import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function corsHeaders(request: NextRequest): Record<string, string> {
    const origin = request.headers.get('origin') || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

export async function OPTIONS(request: NextRequest) {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request: NextRequest) {
    const cors = corsHeaders(request);
    try {
        const { searchParams } = new URL(request.url);
        const clipPath = searchParams.get('path');

        if (!clipPath) {
            return NextResponse.json({ error: 'Clip path is required' }, { status: 400, headers: cors });
        }

        const frontendDir = process.cwd();
        const projectRoot = path.resolve(frontendDir, '..');
        const resolvedPath = path.resolve(clipPath);
        
        const normalizePath = (p: string) => p.replace(/\\/g, '/').toLowerCase();
        const normalizedResolved = normalizePath(resolvedPath);
        const normalizedProjectRoot = normalizePath(projectRoot);
        const normalizedFrontend = normalizePath(frontendDir);
        
        const isInProjectRoot = normalizedResolved.startsWith(normalizedProjectRoot);
        const isInFrontend = normalizedResolved.startsWith(normalizedFrontend);
        
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
            return NextResponse.json({ error: 'Invalid clip path' }, { status: 403, headers: cors });
        }

        if (!fs.existsSync(resolvedPath)) {
            return NextResponse.json({ error: 'Clip file not found' }, { status: 404, headers: cors });
        }

        const fileStat = fs.statSync(resolvedPath);
        const fileName = path.basename(resolvedPath);
        const mimeType = fileName.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream';
        const range = request.headers.get('range');

        if (range) {
            const bytesPrefix = 'bytes=';
            if (!range.startsWith(bytesPrefix)) {
                return new NextResponse(null, { status: 416, headers: cors });
            }
            const rawRange = range.substring(bytesPrefix.length);
            const [startStr, endStr] = rawRange.split('-');
            const start = Number(startStr);
            const end = endStr ? Number(endStr) : fileStat.size - 1;

            if (!Number.isFinite(start) || start < 0 || start >= fileStat.size) {
                return new NextResponse(null, {
                    status: 416,
                    headers: {
                        ...cors,
                        'Content-Range': `bytes */${fileStat.size}`,
                        'Accept-Ranges': 'bytes',
                    },
                });
            }

            const safeEnd = Number.isFinite(end) && end >= start ? Math.min(end, fileStat.size - 1) : fileStat.size - 1;
            const chunkSize = safeEnd - start + 1;
            const stream = fs.createReadStream(resolvedPath, { start, end: safeEnd });

            return new NextResponse(stream as any, {
                status: 206,
                headers: {
                    ...cors,
                    'Content-Type': mimeType,
                    'Content-Length': chunkSize.toString(),
                    'Content-Range': `bytes ${start}-${safeEnd}/${fileStat.size}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Disposition': `inline; filename="${fileName}"`,
                },
            });
        }

        const stream = fs.createReadStream(resolvedPath);
        return new NextResponse(stream as any, {
            headers: {
                ...cors,
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${fileName}"`,
                'Content-Length': fileStat.size.toString(),
                'Accept-Ranges': 'bytes',
            },
        });
    } catch (error: any) {
        console.log('Error serving clip:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to serve clip file' },
            { status: 500, headers: cors }
        );
    }
}

