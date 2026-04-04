import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { getJWTClient } from '@/services/googleDriveServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const extractDriveFileId = (input: string): string | null => {
  try {
    const url = new URL(input);
    const idFromParam = url.searchParams.get('id');
    if (idFromParam) return idFromParam;
    const fileMatch = url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
    if (fileMatch?.[1]) return fileMatch[1];
    return null;
  } catch {
    const queryMatch = input.match(/[?&]id=([A-Za-z0-9_-]+)/);
    if (queryMatch?.[1]) return queryMatch[1];
    const fileMatch = input.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
    return fileMatch?.[1] || null;
  }
};

const toLambdaAccessibleUrl = (src: string, appBaseUrl?: string): string => {
  if (!src || typeof src !== 'string') return src;

  const driveId = extractDriveFileId(src);
  const isGoogleDriveProxy = src.includes('/api/google-drive-media') || src.includes('/google-drive-media?id=');
  if (driveId && isGoogleDriveProxy) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  }

  if (driveId && src.includes('drive.google.com')) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  }

  if (appBaseUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(src)) {
    try {
      const original = new URL(src);
      const base = new URL(appBaseUrl);
      return `${base.origin}${original.pathname}${original.search}${original.hash}`;
    } catch {
      return src;
    }
  }

  return src;
};

const getAwsConfig = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.REMOTION_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.REMOTION_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials not found. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY');
  }

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
};

const getImageExtension = (contentType: string, src: string): string => {
  const lowerType = (contentType || '').toLowerCase();
  if (lowerType.includes('png')) return 'png';
  if (lowerType.includes('jpeg') || lowerType.includes('jpg')) return 'jpg';
  if (lowerType.includes('webp')) return 'webp';
  if (lowerType.includes('gif')) return 'gif';
  if (lowerType.includes('bmp')) return 'bmp';
  if (lowerType.includes('svg')) return 'svg';

  try {
    const pathname = new URL(src).pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  } catch {
    // ignore
  }

  return 'png';
};

const extractJobFolderIdFromSrc = (src: string): string | null => {
  if (!src || typeof src !== 'string') return null;

  const imageMatch = src.match(/\/images\/([^/]+)\/scene-\d+\//i);
  if (imageMatch?.[1]) return imageMatch[1];

  const inputMatch = src.match(/\/input\/([^/]+?)-(?:\d+)-/i);
  if (inputMatch?.[1]) return inputMatch[1];

  return null;
};

const inferJobFolderId = (body: any, inputProps: any, mediaFiles: any[]): string => {
  const explicit = String(body?.jobId || inputProps?.jobId || '').trim();
  if (explicit) return explicit;

  for (const media of mediaFiles || []) {
    const fromSrc = extractJobFolderIdFromSrc(String(media?.src || ''));
    if (fromSrc) return fromSrc;
  }

  return 'job';
};

const inferSceneFolder = (media: any): string => {
  const sceneIndex = Number(media?.sceneIndex);
  if (Number.isFinite(sceneIndex) && sceneIndex >= 0) {
    return `scene-${sceneIndex + 1}`;
  }

  const fromName = String(media?.fileName || '').match(/Image-(\d+)-/i);
  if (fromName?.[1]) {
    return `scene-${Number(fromName[1])}`;
  }

  return 'scene-unknown';
};

const fetchGoogleDriveFile = async (driveFileId: string): Promise<{ buffer: Buffer; contentType: string } | null> => {
  try {
    const jwt = getJWTClient('https://www.googleapis.com/auth/drive');
    const token = await jwt.getAccessToken();
    const accessToken = typeof token === 'string' ? token : token?.token;
    if (!accessToken) return null;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) return null;

    const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType };
  } catch {
    return null;
  }
};

const getVideoExtension = (contentType: string): string => {
  const lower = contentType.toLowerCase();
  if (lower.includes('mp4')) return 'mp4';
  if (lower.includes('webm')) return 'webm';
  if (lower.includes('quicktime') || lower.includes('mov')) return 'mov';
  if (lower.includes('avi')) return 'avi';
  return 'mp4';
};

const ensureVideoIsS3 = async (params: {
  src: string;
  appBaseUrl?: string;
  s3Client: S3Client;
  bucketName: string;
  region: string;
  jobFolderId: string;
}): Promise<string> => {
  const { src, appBaseUrl, s3Client, bucketName, region, jobFolderId } = params;
  const remotionPrefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;

  if (!src || typeof src !== 'string') return src;
  if (src.startsWith(remotionPrefix)) return src;

  const driveId = extractDriveFileId(src);
  if (!driveId) return toLambdaAccessibleUrl(src, appBaseUrl);

  const media = await fetchGoogleDriveFile(driveId);
  if (!media) return toLambdaAccessibleUrl(src, appBaseUrl);

  const ext = getVideoExtension(media.contentType);
  const key = `videos/${jobFolderId}/${Date.now()}-${randomUUID()}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: media.buffer,
    ContentType: media.contentType,
  }));

  return `${remotionPrefix}${key}`;
};

const ensureImageIsS3 = async (params: {
  src: string;
  appBaseUrl?: string;
  s3Client: S3Client;
  bucketName: string;
  region: string;
  jobFolderId: string;
  sceneFolder: string;
}) => {
  const { src, appBaseUrl, s3Client, bucketName, region, jobFolderId, sceneFolder } = params;
  const remotionPrefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;

  const normalizedSrc = toLambdaAccessibleUrl(src, appBaseUrl);
  if (!normalizedSrc || typeof normalizedSrc !== 'string') return normalizedSrc;
  if (normalizedSrc.startsWith(remotionPrefix)) return normalizedSrc;

  const response = await fetch(normalizedSrc);
  if (!response.ok) {
    return normalizedSrc;
  }

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) {
    return normalizedSrc;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const ext = getImageExtension(contentType, normalizedSrc);
  const key = `images/${jobFolderId}/${sceneFolder}/${Date.now()}-${randomUUID()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${remotionPrefix}${key}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serveUrl,
      compositionId,
      inputProps = {},
      codec = 'h264',
      imageFormat = 'jpeg',
      maxRetries = 1,
      framesPerLambda = 20,
      privacy = 'public',
      region = process.env.AWS_REGION || 'us-east-1',
      functionName,
    } = body;

    if (!serveUrl || !compositionId) {
      return NextResponse.json(
        { error: 'serveUrl and compositionId are required' },
        { status: 400 }
      );
    }

    if (!functionName) {
      return NextResponse.json(
        { error: 'functionName is required' },
        { status: 400 }
      );
    }

    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured. Please set REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY environment variables.' },
        { status: 400 }
      );
    }

    // @ts-ignore - @remotion/lambda is externalized, types not available at build time
    const { renderMediaOnLambda } = await import('@remotion/lambda/client');
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;
    const awsConfig = getAwsConfig();
    const s3Client = new S3Client(awsConfig);
    const bucketName = process.env.AWS_S3_BUCKET || 'remotionlambda-useast1-o5o2xdg7ne';
    const sourceMediaFiles = Array.isArray(inputProps?.mediaFiles) ? inputProps.mediaFiles : [];
    const jobFolderId = inferJobFolderId(body, inputProps, sourceMediaFiles);
    const normalizedMediaFiles = Array.isArray(inputProps?.mediaFiles)
      ? await Promise.all(
          inputProps.mediaFiles.map(async (media: any) => {
            if (typeof media?.src !== 'string') {
              return media;
            }

            if (media?.type === 'image') {
              const sceneFolder = inferSceneFolder(media);
              const s3Src = await ensureImageIsS3({
                src: media.src,
                appBaseUrl,
                s3Client,
                bucketName,
                region,
                jobFolderId,
                sceneFolder,
              });
              return { ...media, src: s3Src };
            }

            if (media?.type === 'video' && extractDriveFileId(media.src)) {
              const s3Src = await ensureVideoIsS3({
                src: media.src, appBaseUrl, s3Client, bucketName, region, jobFolderId,
              });
              return { ...media, src: s3Src };
            }

            return { ...media, src: toLambdaAccessibleUrl(media.src, appBaseUrl) };
          })
        )
      : inputProps?.mediaFiles;

    const normalizedBackgroundClips = Array.isArray(inputProps?.backgroundClips)
      ? await Promise.all(
          inputProps.backgroundClips.map(async (clip: any) => {
            if (typeof clip?.src !== 'string') return clip;
            if (clip.type === 'video' && extractDriveFileId(clip.src)) {
              const s3Src = await ensureVideoIsS3({
                src: clip.src, appBaseUrl, s3Client, bucketName, region, jobFolderId,
              });
              return { ...clip, src: s3Src };
            }
            return { ...clip, src: toLambdaAccessibleUrl(clip.src, appBaseUrl) };
          })
        )
      : inputProps?.backgroundClips;

    const normalizedSelectedBgMedia = inputProps?.selectedBackgroundMedia
      ? {
          ...inputProps.selectedBackgroundMedia,
          ...(typeof inputProps.selectedBackgroundMedia.src === 'string'
            ? inputProps.selectedBackgroundMedia.type === 'video' && extractDriveFileId(inputProps.selectedBackgroundMedia.src)
              ? { src: await ensureVideoIsS3({
                  src: inputProps.selectedBackgroundMedia.src, appBaseUrl, s3Client, bucketName, region, jobFolderId,
                }) }
              : { src: toLambdaAccessibleUrl(inputProps.selectedBackgroundMedia.src, appBaseUrl) }
            : {}),
        }
      : inputProps?.selectedBackgroundMedia;

    const result = await renderMediaOnLambda({
      region,
      functionName,
      serveUrl,
      composition: compositionId,
      inputProps: {
        ...inputProps,
        mediaFiles: normalizedMediaFiles,
        backgroundClips: normalizedBackgroundClips,
        selectedBackgroundMedia: normalizedSelectedBgMedia,
      },
      codec,
      imageFormat,
      maxRetries,
      framesPerLambda,
      privacy,
    });

    return NextResponse.json({
      renderId: result.renderId,
      bucketName: result.bucketName,
    });
  } catch (error: any) {
    console.error('Error rendering video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to render video' },
      { status: 500 }
    );
  }
}
