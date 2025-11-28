import { getDriveClient, getRootFolderId, resolveSubfolderId } from '@/services/googleDriveServer';
import type { OutputVideoItem, OutputVideosJob, OutputVideosResponse } from './dashboardService';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string | null;
  webViewLink?: string | null;
  thumbnailLink?: string | null;
  iconLink?: string | null;
}

let cachedAllJobs: OutputVideosResponse | null = null;
let cachedAllJobsTimestamp: number = 0;
const CACHE_TTL_MS = process.env.BACKGROUNDS_CACHE_MAX_AGE ? parseInt(process.env.BACKGROUNDS_CACHE_MAX_AGE) : 1 * 60 * 60 * 1000;
console.log('CACHE_TTL_MS:', CACHE_TTL_MS);
async function listOutputVideosForJobInternal(drive: any, jobFolderId: string, jobId: string): Promise<OutputVideosJob> {
  const outputFolderId = await resolveSubfolderId(drive, jobFolderId, 'output');
  if (!outputFolderId) {
    return { jobId, videos: [] };
  }
  const q = [
    `'${outputFolderId}' in parents`,
    'trashed = false',
  ].join(' and ');
  const res = await drive.files.list({
    q,
    fields: 'files(id,name,mimeType,webViewLink,thumbnailLink,iconLink)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1000,
  });
  const files: DriveFile[] = Array.isArray(res.data.files) ? (res.data.files as any) : [];
  const videoFiles = files.filter((f: DriveFile) => {
    const mime = (f.mimeType || '').toLowerCase();
    const name = (f.name || '').toLowerCase();
    if (mime.startsWith('video/')) {
      return true;
    }
    if (name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.mkv')) {
      return true;
    }
    return false;
  });
  if (videoFiles.length === 0) {
    return { jobId, videos: [] };
  }
  try {
    await Promise.allSettled(
      videoFiles.map((f: DriveFile) =>
        drive.permissions.create({
          fileId: f.id,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
          supportsAllDrives: true,
        }),
      ),
    );
  } catch (e) {
  }
  const videos: OutputVideoItem[] = videoFiles.map((f: DriveFile) => {
    const id = f.id;
    const webViewLink = f.webViewLink || `https://drive.google.com/file/d/${id}/view`;
    const webContentLink = `https://drive.google.com/uc?id=${id}`;
    return {
      id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink,
      webContentLink,
      thumbnailLink: f.thumbnailLink || null,
      iconLink: f.iconLink || null,
      jobId,
    };
  });
  return { jobId, videos };
}

export async function getOutputVideos(jobId?: string, bypassCache: boolean = false): Promise<OutputVideosResponse> {
  const drive = getDriveClient();
  const rootFolderId = getRootFolderId();
  if (jobId) {
    const folderListForJob = await drive.files.list({
      q: [
        `'${rootFolderId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        'trashed = false',
      ].join(' and '),
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
    });
    const topFoldersForJob = Array.isArray(folderListForJob.data.files) ? folderListForJob.data.files : [];
    for (const f of topFoldersForJob) {
      const folderId = f.id;
      const folderName = (f.name || '').trim();
      if (!folderId) {
        continue;
      }
      if (folderName === jobId) {
        const directJob = await listOutputVideosForJobInternal(drive, folderId, jobId);
        return { jobs: [directJob] };
      }
      const nestedList = await drive.files.list({
        q: [
          `'${folderId}' in parents`,
          "mimeType = 'application/vnd.google-apps.folder'",
          'trashed = false',
        ].join(' and '),
        fields: 'files(id,name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 1000,
      });
      const nestedFolders = Array.isArray(nestedList.data.files) ? nestedList.data.files : [];
      for (const nf of nestedFolders) {
        const nestedId = nf.id;
        const nestedName = (nf.name || '').trim();
        if (!nestedId) {
          continue;
        }
        if (nestedName === jobId) {
          const nestedJob = await listOutputVideosForJobInternal(drive, nestedId, jobId);
          return { jobs: [nestedJob] };
        }
      }
    }
    return { jobs: [] };
  }
  if (!jobId && !bypassCache) {
    const now = Date.now();
    if (cachedAllJobs && now - cachedAllJobsTimestamp < CACHE_TTL_MS) {
      return cachedAllJobs;
    }
  }
  const folderList = await drive.files.list({
    q: [
      `'${rootFolderId}' in parents`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
    ].join(' and '),
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    pageSize: 1000,
  });
  const jobFolders = Array.isArray(folderList.data.files) ? folderList.data.files : [];
  const jobs: OutputVideosJob[] = [];
  for (const f of jobFolders) {
    const folderId = f.id;
    const name = (f.name || '').trim();
    if (!folderId) {
      continue;
    }
    if (name) {
      const directResult = await listOutputVideosForJobInternal(drive, folderId, name);
      if (directResult.videos.length > 0) {
        jobs.push(directResult);
        continue;
      }
    }
    const nestedList = await drive.files.list({
      q: [
        `'${folderId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        'trashed = false',
      ].join(' and '),
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 1000,
    });
    const nestedFolders = Array.isArray(nestedList.data.files) ? nestedList.data.files : [];
    for (const nf of nestedFolders) {
      const nestedId = nf.id;
      const nestedName = (nf.name || '').trim();
      if (!nestedId || !nestedName) {
        continue;
      }
      const nestedResult = await listOutputVideosForJobInternal(drive, nestedId, nestedName);
      if (nestedResult.videos.length > 0) {
        jobs.push(nestedResult);
      }
    }
  }
  const result: OutputVideosResponse = { jobs };
  if (!jobId) {
    cachedAllJobs = result;
    cachedAllJobsTimestamp = Date.now();
  }
  return result;
}


