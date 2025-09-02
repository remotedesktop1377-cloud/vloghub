import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
    try {
        const { jsonData, fileName } = await request.json();
        console.log('Private key: ');

        if (!jsonData || !fileName) {
            return NextResponse.json(
                { error: 'JSON data and filename are required' },
                { status: 400 }
            );
        }

        // Read Google Drive credentials from the service account file
        const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
        // const credentialsPath = path.join(process.cwd(), 'src', 'config', 'youtubeclipsearching-b0aa61e232e9.json');
        
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

        // Get folder ID from environment variable (this is the only thing we need from env)
        // const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        const folderId = "15atf1g4WlSLlxL0YQjjY2OJumYVHBWtL";

        if (!folderId) {
            return NextResponse.json(
                { error: 'Google Drive folder ID not configured. Please set GOOGLE_DRIVE_FOLDER_ID in environment variables.' },
                { status: 500 }
            );
        }

        console.log('Using credentials:', {
            client_email: credentials.client_email,
            project_id: credentials.project_id,
            private_key_id: credentials.private_key_id,
            folderId: folderId
        });

        // Create JWT client using credentials from file
        const jwtClient = new google.auth.JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        // Create Drive API client with JWT
        const drive = google.drive({ version: 'v3', auth: jwtClient });

        // Convert JSON data to string
        const jsonString = JSON.stringify(jsonData, null, 2);
        
        console.log('Uploading to Google Drive:', {
            fileName,
            folderId,
            dataSize: jsonString.length
        });

        // Upload file to Google Drive using multipart upload
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
                mimeType: 'application/json',
            },
            media: {
                mimeType: 'application/json',
                body: jsonString,
            },
            uploadType: 'multipart',
        });
        console.log(response);

        const fileId = response.data.id;
        const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;

        console.log('Successfully uploaded to Google Drive:', {
            fileId,
            fileUrl
        });

        return NextResponse.json({
            success: true,
            fileId,
            fileUrl,
            fileName,
            message: 'File uploaded successfully to Google Drive'
        });

    } catch (error) {
        console.error('Google Drive upload error:', error);
        
        let errorMessage = 'Failed to upload to Google Drive';
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { 
                error: 'Google Drive upload failed',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
