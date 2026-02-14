import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../store';
import { LambdaService } from '../../../../services/lambdaService';
import { HelperFunctions } from '../../../../utils/helperFunctions';

interface LambdaRenderProps {
  onRenderComplete?: (videoUrl: string) => void;
}

export default function LambdaRender({ onRenderComplete }: LambdaRenderProps) {
  const projectState = useAppSelector((state) => state.projectState);
  const { mediaFiles, textElements, resolution, fps, duration } = projectState;
  
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [functionName, setFunctionName] = useState<string | null>(null);
  const [serveUrl, setServeUrl] = useState<string | null>(null);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [bucketName, setBucketName] = useState<string | null>(null);
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-southeast-1';

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const ensureFunctionDeployed = async (): Promise<string> => {
    try {
      const functions = await LambdaService.getFunctions({ region, compatibleOnly: true });
      if (functions.length > 0) {
        return functions[0].functionName;
      }

      setStatus('Deploying Lambda function...');
      const result = await LambdaService.deployFunction({
        region,
        timeoutInSeconds: 120,
        memorySizeInMb: 2048,
        createCloudWatchLogGroup: true,
      });
      return result.functionName;
    } catch (error: any) {
      HelperFunctions.showError(`Failed to deploy function: ${error.message}`);
      throw error;
    }
  };

  const ensureSiteDeployed = async (): Promise<string> => {
    try {
      setStatus('Deploying Remotion site...');
      const result = await LambdaService.deploySite({
        entryPoint: 'src/index.tsx',
        siteName: 'vloghub',
        region,
      });
      return result.serveUrl;
    } catch (error: any) {
      HelperFunctions.showError(`Failed to deploy site: ${error.message}`);
      throw error;
    }
  };

  const startRender = async () => {
    if (mediaFiles.length === 0 && textElements.length === 0) {
      HelperFunctions.showError('No media files or text elements to render');
      return;
    }

    setIsRendering(true);
    setProgress(0);
    setStatus('Initializing...');

    try {
      const funcName = await ensureFunctionDeployed();
      setFunctionName(funcName);

      const url = await ensureSiteDeployed();
      setServeUrl(url);

      setStatus('Starting render...');
      const renderResult = await LambdaService.renderVideo({
        serveUrl: url,
        compositionId: 'VloghubVideo',
        inputProps: {
          mediaFiles: mediaFiles.map(file => ({
            ...file,
            src: file.src || '',
          })),
          textElements: textElements,
          fps: fps || 30,
          width: resolution?.width || 1920,
          height: resolution?.height || 1080,
          durationInFrames: Math.ceil((duration || 10) * (fps || 30)),
        },
        codec: 'h264',
        imageFormat: 'jpeg',
        maxRetries: 1,
        framesPerLambda: 20,
        privacy: 'public',
        region,
        functionName: funcName,
      });

      setRenderId(renderResult.renderId);
      setBucketName(renderResult.bucketName);
      setStatus('Rendering in progress...');

      progressIntervalRef.current = setInterval(async () => {
        try {
          const progressResult = await LambdaService.getRenderProgress({
            renderId: renderResult.renderId,
            bucketName: renderResult.bucketName,
            functionName: funcName,
            region,
          });

          if (progressResult.done) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }

            if (progressResult.fatalErrorEncountered) {
              HelperFunctions.showError(
                `Render failed: ${progressResult.errors?.join(', ') || 'Unknown error'}`
              );
              setIsRendering(false);
              return;
            }

            if (progressResult.outputFile) {
              let videoUrl = progressResult.outputFile;
              if (!videoUrl.startsWith('http')) {
                videoUrl = `https://${renderResult.bucketName}.s3.${region}.amazonaws.com/${progressResult.outputFile}`;
              }
              setStatus('Render complete!');
              setProgress(100);
              HelperFunctions.showSuccess('Video rendered successfully on AWS Lambda!');
              
              if (onRenderComplete) {
                onRenderComplete(videoUrl);
              }
            }
            setIsRendering(false);
          } else if (progressResult.timeToFinish) {
            setProgress(Math.min(95, 100 - (progressResult.timeToFinish / (duration || 10)) * 100));
          }
        } catch (error: any) {
          console.error('Error checking progress:', error);
        }
      }, 2000);

    } catch (error: any) {
      HelperFunctions.showError(`Render failed: ${error.message}`);
      setIsRendering(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  };

  const cancelRender = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsRendering(false);
    setStatus('');
    setProgress(0);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">AWS Lambda Render</h3>
        <p className="text-sm text-gray-400 mb-4">
          Render your video on AWS Lambda for faster processing and better performance.
        </p>
      </div>

      {status && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">{status}</span>
            {progress > 0 && <span className="text-sm text-gray-400">{Math.round(progress)}%</span>}
          </div>
          {progress > 0 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={startRender}
          disabled={isRendering || (mediaFiles.length === 0 && textElements.length === 0)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isRendering ? 'Rendering...' : 'Render on Lambda'}
        </button>

        {isRendering && (
          <button
            onClick={cancelRender}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Cancel
          </button>
        )}
      </div>

      {renderId && bucketName && !isRendering && (
        <div className="mt-4 p-3 bg-gray-800 rounded">
          <p className="text-sm text-gray-300">
            Render ID: <code className="text-blue-400">{renderId}</code>
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Bucket: <code className="text-blue-400">{bucketName}</code>
          </p>
        </div>
      )}
    </div>
  );
}
