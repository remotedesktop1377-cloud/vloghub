import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { DRIVE_CLIENT_CREDENTIALS_FILE_NAME } from '@/data/constants';

export function getJWTClient(scopes: string) {
    const credentialsPath = path.join(process.cwd(), 'src', 'config', DRIVE_CLIENT_CREDENTIALS_FILE_NAME);
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    const credentials = JSON.parse(raw);
    return new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes,
    });
}

export function getDriveClient(scopes: string = 'https://www.googleapis.com/auth/drive') {
    const jwtClient = getJWTClient(scopes);
    return google.drive({ version: 'v3', auth: jwtClient });
}

export async function findOrCreateFolder(
    drive: any,
    name: string,
    parentId: string,
    options?: { supportsAllDrives?: boolean; includeItemsFromAllDrives?: boolean }
): Promise<{ id: string; created: boolean }> {
    const q = [
        `name = '${name.replace(/'/g, "\\'")}'`,
        "mimeType = 'application/vnd.google-apps.folder'",
        `'${parentId}' in parents`,
        'trashed = false'
    ].join(' and ');

    const response = await drive.files.list({
        q,
        fields: 'files(id, name)',
        supportsAllDrives: options?.supportsAllDrives ?? true,
        includeItemsFromAllDrives: options?.includeItemsFromAllDrives ?? true,
        pageSize: 1,
    });
    const files = response.data.files;
    if (files && files.length > 0) {
        return { id: files[0].id!, created: false };
    }

    const created = await drive.files.create({
        requestBody: { name, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id, name',
        supportsAllDrives: options?.supportsAllDrives ?? true,
    });
    return { id: created.data.id!, created: true };
}

export async function findOrCreateCleanFolder(drive: any, name: string, parentId: string): Promise<string> {
    const response = await drive.files.list({
        q: `name='${name}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
    });
    const files = response.data.files;
    let folderId: string;
    let created = false;
    if (files && files.length > 0) {
        folderId = files[0].id!;
    } else {
        const createdResponse = await drive.files.create({
            requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
        });
        folderId = createdResponse.data.id!;
        created = true;
    }
    if (!created) {
        const filesToDelete = await drive.files.list({ q: `'${folderId}' in parents and trashed=false`, fields: 'files(id, name)' });
        if (filesToDelete.data.files && filesToDelete.data.files.length > 0) {
            await Promise.all(filesToDelete.data.files.map((file: any) => drive.files.delete({ fileId: file.id })));
        }
    }
    return folderId;
}

export async function clearFolder(drive: any, folderId: string): Promise<void> {
    const filesToDelete = await drive.files.list({ q: `'${folderId}' in parents and trashed=false`, fields: 'files(id, name)' });
    if (filesToDelete.data.files && filesToDelete.data.files.length > 0) {
        await Promise.all(filesToDelete.data.files.map((file: any) => drive.files.delete({ fileId: file.id })));
    }
}

export function getRootFolderId(): string {
    const ROOT_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_PARENT_FOLDER_ID;
    if (!ROOT_ID) {
        throw new Error('Google Drive root folder env not set (GOOGLE_DRIVE_FOLDER_ID or GOOGLE_PARENT_FOLDER_ID)');
    }
    return ROOT_ID;
}

export async function resolveSubfolderId(drive: any, parentFolderId: string, name: string): Promise<string | null> {
    const response = await drive.files.list({
        q: `'${parentFolderId}' in parents and name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 10,
    });
    const files = response.data.files;
    if (files && files.length > 0) {
        return files[0].id!;
    }
    return null;
}

export async function findFileByName(drive: any, fileName: string, parentFolderId: string): Promise<string | null> {
    const response = await drive.files.list({
        q: `name='${fileName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 1,
    });
    const files = response.data.files;
    if (files && files.length > 0) {
        return files[0].id!;
    }
    return null;
}


