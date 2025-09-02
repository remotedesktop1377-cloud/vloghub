import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
    try {
        // Read Google Drive credentials from the service account file
        const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
        
        let credentials;
        try {
            const credentialsFile = fs.readFileSync(credentialsPath, 'utf8');
            credentials = JSON.parse(credentialsFile);
            console.log('Successfully loaded service account credentials from file');
        } catch (error) {
            console.error('Failed to read service account file:', error);
            return NextResponse.json(
                { error: 'Google Drive service account file not found. Please ensure gen-lang-client-0211941879-57f306607431.json exists in src/config/' },
                { status: 500 }
            );
        }

        // Create JWT client using credentials from file
        const jwtClient = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        // Create Drive API client with JWT
        const drive = google.drive({ version: 'v3', auth: jwtClient });

        console.log('Fetching Google Drive information...');

        // Get Drive information (storage, user info, etc.)
        const aboutInfo = await drive.about.get({
            fields: 'user,storageQuota,importFormats,exportFormats,maxImportSizes,teamDriveThemes'
        });

        console.log('Drive account info:', {
            user: aboutInfo.data.user?.displayName || aboutInfo.data.user?.emailAddress,
            storageQuota: aboutInfo.data.storageQuota
        });

        // List all folders accessible to the service account
        const foldersList = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder'",
            fields: 'nextPageToken,files(id,name,parents,shared,owners,createdTime,modifiedTime,size,permissions)',
            pageSize: 50,
            orderBy: 'modifiedTime desc'
        });

        const folders = foldersList.data.files?.map(folder => ({
            id: folder.id,
            name: folder.name,
            shared: folder.shared,
            hasParents: !!folder.parents,
            parentIds: folder.parents || [],
            owners: folder.owners?.map(owner => owner.displayName || owner.emailAddress) || [],
            createdTime: folder.createdTime,
            modifiedTime: folder.modifiedTime,
            url: `https://drive.google.com/drive/folders/${folder.id}`
        })) || [];

        console.log(`Found ${folders.length} accessible folders`);

        // Format storage quota information
        const storageQuota = aboutInfo.data.storageQuota;
        const formatBytes = (bytes: string | undefined) => {
            if (!bytes) return 'Unknown';
            const num = parseInt(bytes);
            if (num === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(num) / Math.log(k));
            return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const driveInfo = {
            user: {
                displayName: aboutInfo.data.user?.displayName || 'Unknown',
                emailAddress: aboutInfo.data.user?.emailAddress || credentials.client_email,
                photoLink: aboutInfo.data.user?.photoLink
            },
            storage: {
                limit: formatBytes(storageQuota?.limit),
                usage: formatBytes(storageQuota?.usage),
                usageInDrive: formatBytes(storageQuota?.usageInDrive),
                usageInDriveTrash: formatBytes(storageQuota?.usageInDriveTrash),
                
            },
            capabilities: {
                maxImportSizes: aboutInfo.data.maxImportSizes,
            }
        };

        return NextResponse.json({
            success: true,
            driveInfo: driveInfo,
            folders: folders,
            totalFolders: folders.length,
            serviceAccountEmail: credentials.client_email,
            message: `Found ${folders.length} folders accessible to the service account`
        });

    } catch (error) {
        console.error('Google Drive folders list error:', error);
        
        let errorMessage = 'Failed to list Google Drive folders';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { 
                error: 'Failed to list Google Drive folders',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
