import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

// Lightweight in-memory cache to reduce Drive API calls
type CacheEntry = { timestamp: number; data: any };
const cache = new Map<string, CacheEntry>();
const FIVE_MINUTES_MS = 5 * 60 * 1000;

function getDriveClient() {
  const credentialsPath = path.join(process.cwd(), 'src', 'config', 'gen-lang-client-0211941879-57f306607431.json');
  const raw = fs.readFileSync(credentialsPath, 'utf8');
  const credentials = JSON.parse(raw);
  const jwtClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth: jwtClient });
}

async function resolveSubfolderId(drive: any, rootFolderId: string, name: string): Promise<string | null> {
  const q = [
    `'${rootFolderId}' in parents`,
    "mimeType = 'application/vnd.google-apps.folder'",
    'trashed = false',
  ].join(' and ');
  const res = await drive.files.list({
    q,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1000,
  });
  const folders: Array<{ id: string; name: string }> = res.data.files || [];
  const match = folders.find(f => (f.name || '').toLowerCase() === name.toLowerCase());
  return match?.id || null;
}

async function listCategory(drive: any, folderId: string): Promise<any[]> {
  const q = [
    `'${folderId}' in parents`,
    'trashed = false',
  ].join(' and ');
  const res = await drive.files.list({
    q,
    fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,iconLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1000,
  });
  const files = Array.isArray(res.data.files) ? res.data.files : [];
  return files.map((f: any) => {
    // For videos, we need to use a different URL format
    const isVideo = f.mimeType && f.mimeType.startsWith('video/');
    const webContentLink = isVideo 
      ? `https://drive.google.com/uc?id=${f.id}` // Direct streaming URL for videos
      : `https://drive.google.com/uc?id=${f.id}&export=download`; // Download URL for other files
    
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      webContentLink: webContentLink,
      thumbnailLink: f.thumbnailLink || null,
      iconLink: f.iconLink || null,
      isVideo: isVideo,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get('category') || '').toLowerCase();
    const allowList = ['backgrounds', 'music', 'transitions', 'all'];
    const requested = allowList.includes(category) ? category : 'all';

    // Auth client (reuse the service account approach from google-drive-upload route)
    const drive = getDriveClient();

    // Env configuration (align with upload route and allow library-specific overrides)
    const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    const backgroundsIdEnv = process.env.GOOGLE_DRIVE_BACKGROUND_FOLDER_ID || '';
    const musicIdEnv = process.env.GOOGLE_DRIVE_MUSIC_FOLDER_ID || '';
    const transitionsIdEnv = process.env.GOOGLE_DRIVE_TRANSITIONS_FOLDER_ID || '';

    // Cache key
    const cacheKey = `library:${requested}:${rootId}:${backgroundsIdEnv}:${musicIdEnv}:${transitionsIdEnv}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.timestamp < FIVE_MINUTES_MS) {
      return NextResponse.json(hit.data);
    }

    // Resolve folder IDs
    let backgroundsId = backgroundsIdEnv;
    let musicId = musicIdEnv;
    let transitionsId = transitionsIdEnv;

    if ((!backgroundsId || !musicId || !transitionsId) && rootId) {
      // Attempt to resolve subfolders by conventional names if missing in env
      if (!backgroundsId) backgroundsId = (await resolveSubfolderId(drive, rootId, 'backgrounds')) || backgroundsIdEnv;
      if (!musicId) musicId = (await resolveSubfolderId(drive, rootId, 'music')) || musicIdEnv;
      if (!transitionsId) transitionsId = (await resolveSubfolderId(drive, rootId, 'transitions')) || transitionsIdEnv;
    }

    const result: any = { meta: { rootId, requested }, data: {} };

    if (requested === 'backgrounds' || requested === 'all') {
      if (!backgroundsId) {
        result.data.backgrounds = [];
        result.meta.backgroundsWarning = 'Missing backgrounds folder id';
      } else {
        result.data.backgrounds = await listCategory(drive, backgroundsId);
      }
    }

    if (requested === 'music' || requested === 'all') {
      if (!musicId) {
        result.data.music = [];
        result.meta.musicWarning = 'Missing music folder id';
      } else {
        result.data.music = await listCategory(drive, musicId);
      }
    }

    if (requested === 'transitions' || requested === 'all') {
      if (!transitionsId) {
        result.data.transitions = [];
        result.meta.transitionsWarning = 'Missing transitions folder id';
      } else {
        result.data.transitions = await listCategory(drive, transitionsId);
      }
    }

    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


