import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient, getRootFolderId, resolveSubfolderId } from '@/services/googleDriveServer';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string | null;
  webViewLink?: string | null;
  thumbnailLink?: string | null;
  iconLink?: string | null;
}

async function listOutputVideosForJob(drive: any, jobFolderId: string, jobId: string) {
  const outputFolderId = await resolveSubfolderId(drive, jobFolderId, 'output');
  // console.log('outputFolderId:', outputFolderId);
  if (!outputFolderId) {
    return { jobId, videos: [] as any[] };
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
  // console.log('response: ', res);
  const files: DriveFile[] = Array.isArray(res.data.files) ? res.data.files as any : [];
  // console.log('files:', files);
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
  const videos = videoFiles.map((f: DriveFile) => {
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobIdParam = searchParams.get('jobId') || '';
    const drive = getDriveClient();
    const rootFolderId = getRootFolderId();
    if (jobIdParam) {
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
        if (folderName === jobIdParam) {
          const directJob = await listOutputVideosForJob(drive, folderId, jobIdParam);
          // console.log('directJob 1', directJob);
          return NextResponse.json({ jobs: [directJob] });
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
        // console.log('nestedList', nestedList);
        const nestedFolders = Array.isArray(nestedList.data.files) ? nestedList.data.files : [];
        for (const nf of nestedFolders) {
          const nestedId = nf.id;
          const nestedName = (nf.name || '').trim();
          if (!nestedId) {
            continue;
          }
          if (nestedName === jobIdParam) {
            const nestedJob = await listOutputVideosForJob(drive, nestedId, jobIdParam);
            return NextResponse.json({ jobs: [nestedJob] });
          }
        }
      }
      return NextResponse.json({ jobs: [] });
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
    // console.log('folderList', folderList);
    const jobFolders = Array.isArray(folderList.data.files) ? folderList.data.files : [];
    // console.log('jobFolders', jobFolders);
    const jobs = [];
    for (const f of jobFolders) {
      const folderId = f.id;
      const name = (f.name || '').trim();
      if (!folderId) {
        continue;
      }
      if (name) {
        const directResult = await listOutputVideosForJob(drive, folderId, name);
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
      // console.log('nestedList 1', nestedList);
      const nestedFolders = Array.isArray(nestedList.data.files) ? nestedList.data.files : [];
      for (const nf of nestedFolders) {
        const nestedId = nf.id;
        const nestedName = (nf.name || '').trim();
        if (!nestedId || !nestedName) {
          continue;
        }
        const nestedResult = await listOutputVideosForJob(drive, nestedId, nestedName);
        if (nestedResult.videos.length > 0) {
          jobs.push(nestedResult);
        }
      }
    }
    return NextResponse.json({ jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}


