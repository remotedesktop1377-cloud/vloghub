import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  narration?: string;
  duration?: string;
  words?: number;
  durationInSeconds?: number;
  startFrame?: number;
  endFrame?: number;
  durationInFrames?: number;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID || !process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 400 }
      );
    }

    const awsConfig = getAwsConfig();
    const s3Client = new S3Client(awsConfig);
    const lambdaClient = new LambdaClient(awsConfig);
    const region = awsConfig.region;
    const bucketName = process.env.AWS_S3_BUCKET || 'remotionlambda-useast1-o5o2xdg7ne';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const scenesRaw = String(formData.get('scenes') || '[]');
    const jobId = String(formData.get('jobId') || '').trim();
    const fps = Number(formData.get('fps') || 30) || 30;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    let scenes: Scene[] = [];
    try {
      scenes = JSON.parse(scenesRaw);
    } catch {
      return NextResponse.json({ error: 'Invalid scenes JSON' }, { status: 400 });
    }

    if (!Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json({ error: 'scenes is required' }, { status: 400 });
    }

    const videoKey = `input/${jobId || 'job'}-${Date.now()}-${file.name}`;
    const videoBuffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
        Body: videoBuffer,
        ContentType: file.type || 'video/mp4',
      })
    );

    const videoUrl = `s3://${bucketName}/${videoKey}`;

    const lambdaFunctionName = process.env.FFMPEG_LAMBDA_FUNCTION_NAME || 'ffmpeg-clip-cutter';

    const payload = {
      videoUrl,
      scenes,
      jobId,
      fps,
      bucketName,
      region,
    };

    const invokeResponse = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: lambdaFunctionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload),
      })
    );

    if (invokeResponse.FunctionError) {
      const errorMessage = invokeResponse.Payload
        ? new TextDecoder().decode(invokeResponse.Payload)
        : 'Lambda function error';
      return NextResponse.json(
        { error: `Lambda error: ${errorMessage}` },
        { status: 500 }
      );
    }

    const payloadString = invokeResponse.Payload
      ? new TextDecoder().decode(invokeResponse.Payload)
      : '{}';
    
    let result: { scenes?: any[]; clipUrls?: string[]; error?: string } = {};
    try {
      const parsed = JSON.parse(payloadString);
      result = parsed.body ? JSON.parse(parsed.body) : parsed;
    } catch {
      result = { error: 'Failed to parse Lambda response' };
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const processedScenes = result.scenes || scenes.map((scene, i) => {
      const startTime = Number(scene.startTime || 0);
      const endTime = Number(scene.endTime || 0);
      const durationInSeconds = Math.max(0, endTime - startTime);

      return {
        ...scene,
        id: scene.id || `scene-${i + 1}`,
        startTime,
        endTime,
        durationInSeconds,
        startFrame: Math.max(0, Math.floor(startTime * fps)),
        endFrame: Math.max(0, Math.floor(endTime * fps)),
        durationInFrames: Math.max(1, Math.floor(durationInSeconds * fps)),
        previewClip: result.clipUrls?.[i] || null,
      };
    });

    return NextResponse.json({
      scenes: processedScenes,
    });
  } catch (error: any) {
    console.error('Error in cut-clips Lambda route:', error);
    return NextResponse.json(
      { error: error.message || 'Clip cutting failed' },
      { status: 500 }
    );
  }
}
