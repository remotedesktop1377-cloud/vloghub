const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const ffmpegPath = process.env.FFMPEG_PATH || '/opt/bin/ffmpeg';
const ffprobePath = process.env.FFPROBE_PATH || '/opt/bin/ffprobe';

const downloadFromS3 = async (bucket, key, localPath) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3Client.send(command);
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  await fs.writeFile(localPath, buffer);
};

const uploadToS3 = async (bucket, key, localPath) => {
  const fileBuffer = await fs.readFile(localPath);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
  });
  await s3Client.send(command);
  return `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

exports.handler = async (event) => {
  let payload;
  
  if (typeof event === 'string') {
    payload = JSON.parse(event);
  } else if (event.body) {
    payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } else {
    payload = event;
  }
  
  const { videoUrl, scenes, jobId, fps, bucketName, region } = payload;

  try {
    const tmpDir = path.join(os.tmpdir(), `clip-cutter-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    const s3Match = videoUrl.match(/s3:\/\/([^\/]+)\/(.+)/);
    if (!s3Match) {
      throw new Error('Invalid S3 URL format');
    }

    const [, bucket, key] = s3Match;
    const inputVideoPath = path.join(tmpDir, 'input.mp4');
    await downloadFromS3(bucket, key, inputVideoPath);

    const clipUrls = [];
    const processedScenes = [];

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const startTime = Number(scene.startTime || 0);
      const endTime = Number(scene.endTime || 0);

      if (startTime >= endTime) {
        continue;
      }

      const outputFileName = `segment_${scene.id || `scene-${i + 1}`}.mp4`;
      const outputPath = path.join(tmpDir, outputFileName);
      const outputKey = `clips/${jobId || 'job'}/${outputFileName}`;

      await execAsync(
        `${ffmpegPath} -y -ss ${startTime} -to ${endTime} -i "${inputVideoPath}" -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k "${outputPath}"`
      );

      const clipUrl = await uploadToS3(bucketName, outputKey, outputPath);
      clipUrls.push(clipUrl);

      const durationInSeconds = endTime - startTime;
      processedScenes.push({
        ...scene,
        id: scene.id || `scene-${i + 1}`,
        startTime,
        endTime,
        durationInSeconds,
        startFrame: Math.max(0, Math.floor(startTime * fps)),
        endFrame: Math.max(0, Math.floor(endTime * fps)),
        durationInFrames: Math.max(1, Math.floor(durationInSeconds * fps)),
        previewClip: clipUrl,
      });

      await fs.unlink(outputPath).catch(() => {});
    }

    await fs.unlink(inputVideoPath).catch(() => {});
    await fs.rmdir(tmpDir).catch(() => {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        scenes: processedScenes,
        clipUrls,
      }),
    };
  } catch (error) {
    console.error('Error processing clips:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || 'Failed to process clips',
      }),
    };
  }
};
