import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serve a video clip file from the server's filesystem
 * This endpoint allows the frontend to fetch files that were created by the Python backend
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clipPath = searchParams.get('path');

        if (!clipPath) {
            return NextResponse.json({ error: 'Clip path is required' }, { status: 400 });
        }

        // Security: Only allow paths within the project directory
        // process.cwd() in Next.js points to the frontend directory
        // We need to check for the project root (one level up) where exports/temp folders are
        const frontendDir = process.cwd();
        const projectRoot = path.resolve(frontendDir, '..');
        const resolvedPath = path.resolve(clipPath);
        
        // Normalize paths for comparison (handle Windows/Unix differences)
        const normalizePath = (p: string) => p.replace(/\\/g, '/').toLowerCase();
        const normalizedResolved = normalizePath(resolvedPath);
        const normalizedProjectRoot = normalizePath(projectRoot);
        const normalizedFrontend = normalizePath(frontendDir);
        
        // Check if path is within project root or frontend directory
        const isInProjectRoot = normalizedResolved.startsWith(normalizedProjectRoot);
        const isInFrontend = normalizedResolved.startsWith(normalizedFrontend);
        
        // Also check if it's in exports or temp directories (case-insensitive)
        const isExportsOrTemp = /[\/\\]exports[\/\\]/i.test(resolvedPath) || /[\/\\]temp[\/\\]/i.test(resolvedPath);
        
        if (!isInProjectRoot && !isInFrontend && !isExportsOrTemp) {
            console.log('Path security check failed:', {
                resolvedPath,
                normalizedResolved,
                projectRoot,
                normalizedProjectRoot,
                frontendDir: normalizedFrontend,
                isInProjectRoot,
                isInFrontend,
                isExportsOrTemp
            });
            return NextResponse.json({ error: 'Invalid clip path' }, { status: 403 });
        }

        // Check if file exists
        if (!fs.existsSync(resolvedPath)) {
            return NextResponse.json({ error: 'Clip file not found' }, { status: 404 });
        }

        // Read the file
        const fileBuffer = fs.readFileSync(resolvedPath);
        const fileName = path.basename(resolvedPath);
        const mimeType = fileName.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';

        // Return the file as a blob
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.log('Error serving clip:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to serve clip file' },
            { status: 500 }
        );
    }
}

