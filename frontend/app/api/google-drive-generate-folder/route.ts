// app/api/upload-to-drive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // Get authenticated Drive client
        const drive = getDriveClient();
        
        // Get root folder ID from environment
        const ROOT_ID = getRootFolderId();

        // Parse request body with error handling
        let requestBody: { jobName: string };
        
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
            // Handle multipart/form-data
            try {
                const formData = await request.formData();
                const jobName = formData.get('jobName') as string;
                requestBody = { jobName: jobName || '' };
            } catch (formError) {
                console.error('Form data parse error:', formError);
                return NextResponse.json({ 
                    success: false, 
                    result: null, 
                    message: 'Invalid form data' 
                }, { status: 400 });
            }
        } else if (contentType.includes('application/json')) {
            // Handle JSON
            try {
                const bodyText = await request.text();
                if (!bodyText || bodyText.trim() === '') {
                    return NextResponse.json({ 
                        success: false, 
                        result: null, 
                        message: 'Request body is empty' 
                    }, { status: 400 });
                }
                requestBody = JSON.parse(bodyText) as { jobName: string };
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                return NextResponse.json({ 
                    success: false, 
                    result: null, 
                    message: 'Invalid JSON in request body' 
                }, { status: 400 });
            }
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Handle URL-encoded form data
            try {
                const bodyText = await request.text();
                const params = new URLSearchParams(bodyText);
                requestBody = { jobName: params.get('jobName') || '' };
            } catch (urlError) {
                console.error('URL-encoded parse error:', urlError);
                return NextResponse.json({ 
                    success: false, 
                    result: null, 
                    message: 'Invalid URL-encoded data' 
                }, { status: 400 });
            }
        } else {
            // Fallback: try to parse as plain text or JSON
            try {
                const bodyText = await request.text();
                if (!bodyText || bodyText.trim() === '') {
                    return NextResponse.json({ 
                        success: false, 
                        result: null, 
                        message: 'Request body is empty' 
                    }, { status: 400 });
                }
                
                // Try JSON first
                try {
                    requestBody = JSON.parse(bodyText) as { jobName: string };
                } catch {
                    // If not JSON, treat as plain text jobName
                    requestBody = { jobName: bodyText.trim() };
                }
            } catch (parseError) {
                console.error('Request body parse error:', parseError);
                return NextResponse.json({ 
                    success: false, 
                    result: null, 
                    message: 'Invalid request body format' 
                }, { status: 400 });
            }
        }

        const jobName = String(requestBody?.jobName || '').trim();
        if (!jobName) {
            return NextResponse.json({ success: false, result: null, message: 'jobName is required' }, { status: 400 });
        }
        const folder = await findOrCreateFolder(drive, jobName, ROOT_ID);
        return NextResponse.json({ success: true, result: { folderId: folder.id, webViewLink: `https://drive.google.com/drive/folders/${folder.id}` }, message: 'Folder generated successfully' });
    } catch (err: any) {
        console.error('generateAFolderOnDrive error', err);
        return NextResponse.json({ success: false, result: null, message: err.message || 'Unknown error' }, { status: 500 });
    }
}
