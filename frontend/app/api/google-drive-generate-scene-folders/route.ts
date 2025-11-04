import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, getRootFolderId, findOrCreateFolder } from '@/services/googleDriveService';

export const runtime = 'nodejs';

function toInt(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function zeroPad(num: number, width: number): string {
    const s = String(num);
    return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

export async function POST(request: NextRequest) {
    try {
        const drive = getDriveClient();
        const ROOT_ID = getRootFolderId();

        let jobName = '';
        let numberOfScenes = 0;

        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            jobName = String(formData.get('jobName') || '').trim();
            numberOfScenes = toInt(formData.get('numberOfScenes'), 0);
        } else if (contentType.includes('application/json')) {
            const bodyText = await request.text();
            if (!bodyText || bodyText.trim() === '') {
                return NextResponse.json({ success: false, result: null, message: 'Request body is empty' }, { status: 400 });
            }
            const body = JSON.parse(bodyText) as { jobName?: string; numberOfScenes?: number };
            jobName = String(body?.jobName || '').trim();
            numberOfScenes = toInt(body?.numberOfScenes, 0);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const bodyText = await request.text();
            const params = new URLSearchParams(bodyText);
            jobName = String(params.get('jobName') || '').trim();
            numberOfScenes = toInt(params.get('numberOfScenes'), 0);
        } else {
            const bodyText = await request.text();
            if (!bodyText || bodyText.trim() === '') {
                return NextResponse.json({ success: false, result: null, message: 'Request body is empty' }, { status: 400 });
            }
            try {
                const body = JSON.parse(bodyText);
                jobName = String(body?.jobName || '').trim();
                numberOfScenes = toInt(body?.numberOfScenes, 0);
            } catch {
                // Fallback: plain text is jobName; no scenes provided
                jobName = bodyText.trim();
            }
        }

        if (!jobName) {
            return NextResponse.json({ success: false, result: null, message: 'jobName is required' }, { status: 400 });
        }
        if (!Number.isFinite(numberOfScenes) || numberOfScenes <= 0) {
            return NextResponse.json({ success: false, result: null, message: 'numberOfScenes must be a positive integer' }, { status: 400 });
        }
        if (numberOfScenes > 200) {
            return NextResponse.json({ success: false, result: null, message: 'numberOfScenes is too large (max 200)' }, { status: 400 });
        }

        const jobFolder = await findOrCreateFolder(drive, jobName, ROOT_ID);

        const width = numberOfScenes >= 100 ? 3 : numberOfScenes >= 10 ? 2 : 1;

        const created: Array<{ id: string; name: string; webViewLink: string }> = [];

        for (let i = 1; i <= numberOfScenes; i++) {
            const name = `scene-${zeroPad(i, width)}`;
            const { id } = await findOrCreateFolder(drive, name, jobFolder.id);
            created.push({ id, name, webViewLink: `https://drive.google.com/drive/folders/${id}` });
        }

        return NextResponse.json({
            success: true,
            result: {
                folderId: jobFolder.id,
                webViewLink: `https://drive.google.com/drive/folders/${jobFolder.id}`,
                sceneFolders: created
            },
            message: 'Scene folders generated successfully'
        });
    } catch (err: any) {
        console.error('generateSceneFolders error', err);
        return NextResponse.json({ success: false, result: null, message: err?.message || 'Unknown error' }, { status: 500 });
    }
}


