import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { getJWTClient } from '@/services/googleDriveServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

const IMAGE_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
]);

const extensionFromContentType = (contentType: string) => {
  switch ((contentType || '').toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'image/bmp':
      return 'bmp';
    default:
      return 'png';
  }
};

const decodeDataUrl = (value: string): { buffer: Buffer; contentType: string } | null => {
  const match = value.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const b64 = match[2];
  if (!IMAGE_CONTENT_TYPES.has(contentType)) return null;
  return {
    buffer: Buffer.from(b64, 'base64'),
    contentType,
  };
};

const extractDriveFileId = (url: string): string | null => {
  const trimmed = String(url || '').trim();
  const idFromQuery = trimmed.match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1];
  if (idFromQuery) return idFromQuery;
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
};

const normalizeFetchableImageUrl = (url: string): string => {
  const trimmed = String(url || '').trim();

  const proxyIdMatch = trimmed.match(/[?&]id=([A-Za-z0-9_-]+)/);
  const isDriveProxy =
    trimmed.includes('/api/google-drive-media') ||
    trimmed.includes('/google-drive-media?id=');

  if (isDriveProxy && proxyIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=download&id=${proxyIdMatch[1]}`;
  }

  if (trimmed.includes('drive.google.com')) {
    const id = extractDriveFileId(trimmed);
    if (id) {
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }
  return trimmed;
};

async function getImagePayloadFromUrl(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!url || typeof url !== 'string') return null;

  const dataUrlPayload = decodeDataUrl(url);
  if (dataUrlPayload) {
    return dataUrlPayload;
  }

  const driveFileId = extractDriveFileId(url);
  if (driveFileId) {
    try {
      const jwt = getJWTClient('https://www.googleapis.com/auth/drive');
      const token = await jwt.getAccessToken();
      const accessToken = typeof token === 'string' ? token : token?.token;
      if (accessToken) {
        const driveResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (driveResponse.ok) {
          const contentType = (driveResponse.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
          if (IMAGE_CONTENT_TYPES.has(contentType)) {
            const arrayBuffer = await driveResponse.arrayBuffer();
            return {
              buffer: Buffer.from(arrayBuffer),
              contentType,
            };
          }
        }
      }
    } catch {
      // Fallback to public URL fetch below
    }
  }

  const normalizedUrl = normalizeFetchableImageUrl(url);
  const response = await fetch(normalizedUrl);
  if (!response.ok) return null;

  const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!IMAGE_CONTENT_TYPES.has(contentType)) return null;

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function uploadImageToS3(params: {
  s3Client: S3Client;
  bucketName: string;
  region: string;
  jobId: string;
  sceneId: string;
  sourceUrl: string;
}) {
  const { s3Client, bucketName, region, jobId, sceneId, sourceUrl } = params;

  if (!sourceUrl || typeof sourceUrl !== 'string') return sourceUrl;

  const existingS3UrlPrefix = `https://${bucketName}.s3.${region}.amazonaws.com/images/`;
  if (sourceUrl.startsWith(existingS3UrlPrefix)) {
    return sourceUrl;
  }

  const payload = await getImagePayloadFromUrl(sourceUrl);
  if (!payload) {
    return sourceUrl;
  }

  const ext = extensionFromContentType(payload.contentType);
  const key = `images/${jobId || 'job'}/${sceneId || 'scene'}/${Date.now()}-${randomUUID()}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: payload.buffer,
    ContentType: payload.contentType,
  }));

  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

export async function POST(request: NextRequest) {
  try {
    const { jobId = '', scenes = [] } = (await request.json()) as { jobId?: string; scenes?: any[] };

    if (!Array.isArray(scenes)) {
      return NextResponse.json({ error: 'scenes must be an array' }, { status: 400 });
    }

    const awsConfig = getAwsConfig();
    const s3Client = new S3Client(awsConfig);
    const region = awsConfig.region;
    const bucketName = process.env.AWS_S3_BUCKET || 'remotionlambda-useast1-o5o2xdg7ne';
    const urlMap = new Map<string, string>();

    const uploadCached = async (sceneId: string, url: string) => {
      const key = String(url || '').trim();
      if (!key) return key;
      if (urlMap.has(key)) return urlMap.get(key)!;
      const uploaded = await uploadImageToS3({
        s3Client,
        bucketName,
        region,
        jobId: String(jobId || 'job'),
        sceneId,
        sourceUrl: key,
      });
      urlMap.set(key, uploaded);
      return uploaded;
    };

    const updatedScenes = await Promise.all(
      scenes.map(async (scene: any, index: number) => {
        const sceneId = `scene-${index + 1}`;

        const imageList = Array.isArray(scene?.assets?.images)
          ? scene.assets.images.filter((value: any) => typeof value === 'string' && value.trim().length > 0)
          : [];

        const uploadedImages = await Promise.all(imageList.map((imageUrl: string) => uploadCached(sceneId, imageUrl)));
        const generatedBackgroundUrl = scene?.generatedBackgroundUrl
          ? await uploadCached(sceneId, String(scene.generatedBackgroundUrl))
          : scene?.generatedBackgroundUrl || '';
        const gammaPreviewImage = scene?.gammaPreviewImage
          ? await uploadCached(sceneId, String(scene.gammaPreviewImage))
          : scene?.gammaPreviewImage || '';
        const previewImage = scene?.previewImage
          ? await uploadCached(sceneId, String(scene.previewImage))
          : scene?.previewImage || '';

        return {
          ...scene,
          generatedBackgroundUrl,
          gammaPreviewImage,
          previewImage,
          aiAssets: {
            ...(scene?.aiAssets || {}),
            generatedBackgroundUrl,
          },
          assets: {
            ...(scene?.assets || {}),
            images: uploadedImages,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      scenes: updatedScenes,
    });
  } catch (error: any) {
    console.error('Error uploading scene images to S3:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload scene images' }, { status: 500 });
  }
}
