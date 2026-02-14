"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store';
import { setResolution, setQuality, setSpeed } from '../../../../store/slices/projectSlice';
import Ffmpeg from "./Ffmpeg";
import RenderOptions from "./RenderOptions";
import { LambdaService } from '../../../../services/lambdaService';
import { HelperFunctions } from '../../../../utils/helperFunctions';
import AlertDialog from '../../../../dialogs/AlertDialog';
import styles from './LambdaRender.module.css';

export default function ExportList() {
    const useLambda = process.env.NEXT_PUBLIC_USE_LAMBDA_FOR_RENDER === 'true';
    const projectState = useAppSelector((state) => state.projectState);
    const { mediaFiles, textElements, resolution, fps, duration, exportSettings } = projectState;
    const dispatch = useAppDispatch();

    const [isRendering, setIsRendering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [functionName, setFunctionName] = useState<string | null>(null);
    const [serveUrl, setServeUrl] = useState<string | null>(null);
    const [renderId, setRenderId] = useState<string | null>(null);
    const [bucketName, setBucketName] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [outputFile, setOutputFile] = useState<string | null>(null);
    const [showErrorDialog, setShowErrorDialog] = useState(false);

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
        setErrors([]);
        setOutputFile(null);

        try {
            const funcName = await ensureFunctionDeployed();
            setFunctionName(funcName);

            const url = await ensureSiteDeployed();
            setServeUrl(url);

            setStatus('Starting render...');
            const exportRes = HelperFunctions.getResolutionFromExportSettings(exportSettings.resolution);
            const framesPerLambda = HelperFunctions.getFramesPerLambdaFromSpeed(exportSettings.speed);
            const imageFormat = HelperFunctions.getImageFormatFromQuality(exportSettings.quality);

            const renderResult = await LambdaService.renderVideo({
                serveUrl: url,
                compositionId: 'VloghubVideo',
                inputProps: {
                    mediaFiles: mediaFiles.map(file => ({
                        ...file,
                        src: file.src || '',
                    })),
                    textElements: textElements,
                    fps: fps || exportSettings.fps || 30,
                    width: exportRes.width,
                    height: exportRes.height,
                    durationInFrames: Math.ceil((duration || 10) * (fps || exportSettings.fps || 30)),
                },
                codec: 'h264',
                imageFormat: imageFormat,
                maxRetries: 1,
                framesPerLambda: framesPerLambda,
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

                    if (progressResult.fatalErrorEncountered) {
                        if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                        }
                        const errorMessages = progressResult.errors || ['Unknown error'];
                        setErrors(errorMessages);
                        setStatus('Render failed');
                        setProgress(0);
                        setShowErrorDialog(true);
                        setIsRendering(false);
                        return;
                    }

                    if (progressResult.done) {
                        if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                        }

                        if (progressResult.outputFile) {
                            let videoUrl = progressResult.outputFile;
                            if (!videoUrl.startsWith('http')) {
                                videoUrl = `https://${renderResult.bucketName}.s3.${region}.amazonaws.com/${progressResult.outputFile}`;
                            }
                            setOutputFile(videoUrl);
                            setStatus('Render complete!');
                            setProgress(100);
                            setErrors([]);
                            HelperFunctions.showSuccess('Video rendered successfully on AWS Lambda!');
                        }
                        setIsRendering(false);
                    } else {
                        if (progressResult.errors && progressResult.errors.length > 0) {
                            setErrors(progressResult.errors);
                        }

                        if (progressResult.overallProgress !== undefined) {
                            const progressPercent = Math.min(95, progressResult.overallProgress * 100);
                            setProgress(progressPercent);
                            setStatus(`Rendering... ${Math.round(progressPercent)}%`);
                        } else if (progressResult.timeToFinish !== undefined && progressResult.timeToFinish > 0) {
                            const estimatedProgress = Math.max(0, Math.min(95, 100 - (progressResult.timeToFinish / (duration || 10)) * 100));
                            setProgress(estimatedProgress);
                            setStatus(`Rendering... Estimated ${Math.round(progressResult.timeToFinish)}s remaining`);
                        } else {
                            setStatus('Rendering in progress...');
                        }
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
        setErrors([]);
    };

    return (
        <div className="flex flex-col justify-center items-center h-full w-full gap-4">
            <div className="w-full max-w-2xl">

                {useLambda ?
                    <h2 className="text-xl font-semibold mb-2">Cloud Render (AWS Lambda)</h2>
                    : <h2 className="text-xl font-semibold mb-2">Local Render (FFmpeg)</h2>
                }

                <RenderOptions />
                {useLambda ? (
                    <div className={styles.container}>

                        {status && (
                            <div className={styles.statusCard}>
                                <div className={styles.statusHeader}>
                                    <div className={styles.statusLeft}>
                                        {isRendering && (
                                            <div className={styles.pulseDot}></div>
                                        )}
                                        <span className={styles.statusText}>{status}</span>
                                    </div>
                                    {progress > 0 && (
                                        <span className={styles.progressBadge}>
                                            {Math.round(progress)}%
                                        </span>
                                    )}
                                </div>
                                {progress > 0 && (
                                    <div className={styles.progressBarContainer}>
                                        <div
                                            className={styles.progressBar}
                                            style={{ width: `${progress}%` }}
                                        >
                                            <div className={styles.progressBarShimmer}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}


                        {outputFile && !isRendering && (
                            <div className={styles.successCard}>
                                <div className={styles.successContent}>
                                    <div className={styles.successIcon}>
                                        <svg className={styles.successIconSvg} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className={styles.successText}>
                                        <p className={styles.successTitle}>Video Ready</p>
                                        <a
                                            href={outputFile}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.successLink}
                                        >
                                            <svg className={styles.successLinkIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            {outputFile}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={styles.buttonsContainer}>
                            <button
                                onClick={startRender}
                                disabled={isRendering || (mediaFiles.length === 0 && textElements.length === 0)}
                                className={styles.primaryButton}
                            >
                                {isRendering ? (
                                    <>
                                        <svg className={`${styles.buttonIcon} ${styles.spinIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Rendering...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Render</span>
                                    </>
                                )}
                            </button>

                            {isRendering && (
                                <button
                                    onClick={cancelRender}
                                    className={styles.secondaryButton}
                                >
                                    <svg className={styles.buttonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Cancel</span>
                                </button>
                            )}
                        </div>

                        {/* {renderId && bucketName && !isRendering && (
                            <div className={styles.detailsCard}>
                                <div className={styles.detailsHeader}>
                                    <svg className={styles.detailsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className={styles.detailsTitle}>Render Details</p>
                                </div>
                                <div className={styles.detailsList}>
                                    <div className={styles.detailsItem}>
                                        <span className={styles.detailsLabel}>Render ID:</span>
                                        <code className={styles.detailsValue}>{renderId}</code>
                                    </div>
                                    <div className={styles.detailsItem}>
                                        <span className={styles.detailsLabel}>Bucket:</span>
                                        <code className={styles.detailsValue}>{bucketName}</code>
                                    </div>
                                </div>
                            </div>
                        )} */}
                    </div>
                ) : (
                    <Ffmpeg />
                )}
            </div>

            <AlertDialog
                open={showErrorDialog}
                title="Render Error"
                message={
                    <div>
                        {errors.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                {errors.map((error, index) => (
                                    <li key={index} style={{ marginBottom: '0.5rem' }}>
                                        {error}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            'An unknown error occurred during rendering.'
                        )}
                    </div>
                }
                onClose={() => {
                    setShowErrorDialog(false);
                    setErrors([]);
                }}
                confirmLabel="OK"
            />
        </div>
    )
}