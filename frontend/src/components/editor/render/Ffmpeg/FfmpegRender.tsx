"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useRef, useState } from "react";
import { getFile, useAppDispatch, useAppSelector } from "../../../../store";
import { Heart } from "lucide-react";
import Image from "next/image";
import { extractConfigs } from "../../../../utils/extractConfigs";
import { mimeToExt } from "../../../../types/video_editor";
import { toast } from "react-hot-toast";
import FfmpegProgressBar from "./ProgressBar";
import styles from "./FfmpegRender.module.css";
import saveIcon from "@/assets/images/save.svg";
import { setAutoRenderRequested, setAutoRenderProjectId, setQuality, setResolution, setSpeed } from "../../../../store/slices/projectSlice";
import { cleanupService } from "@/services/cleanupService";

interface FileUploaderProps {
    loadFunction: () => Promise<void>;
    loadFfmpeg: boolean;
    ffmpeg: FFmpeg;
    logMessages: string;
}

export default function FfmpegRender({ loadFunction, loadFfmpeg, ffmpeg, logMessages }: FileUploaderProps) {
    const { id, mediaFiles, projectName, exportSettings, duration, textElements, autoRenderRequested, autoRenderProjectId } = useAppSelector(state => state.projectState);
    const totalDuration = duration;
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [autoRenderTriggered, setAutoRenderTriggered] = useState(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (loaded && videoRef.current && previewUrl) {
            videoRef.current.src = previewUrl;
        }
    }, [loaded, previewUrl]);

    useEffect(() => {
        const shouldAutoRender = autoRenderRequested && autoRenderProjectId === id;
        const hasContent = mediaFiles.length > 0 || textElements.length > 0;

        if (!autoRenderTriggered && shouldAutoRender && loadFfmpeg && !isRendering && hasContent) {
            dispatch(setResolution("480p"));
            dispatch(setQuality("low"));
            dispatch(setSpeed("fastest"));
            dispatch(setAutoRenderRequested(false));
            dispatch(setAutoRenderProjectId(''));
            setAutoRenderTriggered(true);
            render();
        }
    }, [autoRenderProjectId, autoRenderRequested, autoRenderTriggered, dispatch, id, isRendering, loadFfmpeg, mediaFiles.length, textElements.length]);

    const handleCloseModal = async () => {
        setShowModal(false);
        setIsRendering(false);
        try {
            ffmpeg.terminate();
            await loadFunction();
            await cleanupService.cleanupExports();
        } catch (e) {
            console.error("Failed to reset FFmpeg:", e);
        }
    };

    const render = async () => {
        if (mediaFiles.length === 0 && textElements.length === 0) {
            console.log('No media files to render');
            return;
        }
        setShowModal(true);
        setIsRendering(true);

        const renderFunction = async () => {
            const params = extractConfigs(exportSettings);
            const toFetchableMediaUrl = (src: string): string => {
                try {
                    const parsed = new URL(src, window.location.origin);
                    const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';
                    if (isHttp && parsed.origin !== window.location.origin) {
                        return `/api/media-fetch?url=${encodeURIComponent(parsed.toString())}`;
                    }
                    return parsed.toString();
                } catch {
                    return src;
                }
            };
            const audioProbeCache = new Map<string, boolean>();
            const detectHasAudioStream = async (inputFileName: string): Promise<boolean> => {
                const cached = audioProbeCache.get(inputFileName);
                if (cached !== undefined) return cached;

                let hasAudio = false;
                try {
                    // Optional audio map probe: exits 0 only when at least one audio stream exists.
                    const probeExitCode = await ffmpeg.exec(['-v', 'error', '-i', inputFileName, '-map', '0:a:0', '-f', 'null', '-']);
                    hasAudio = probeExitCode === 0;
                } catch {
                    hasAudio = false;
                }

                audioProbeCache.set(inputFileName, hasAudio);
                return hasAudio;
            };

            try {
                const filters = [];
                const overlays = [];
                const inputs = [];
                const audioDelays = [];

                filters.push(`color=c=black:size=1920x1080:d=${totalDuration.toFixed(3)}[base]`);
                const sortedMediaFiles = [...mediaFiles].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

                for (let i = 0; i < sortedMediaFiles.length; i++) {

                    const { startTime, positionStart, positionEnd } = sortedMediaFiles[i];
                    const duration = positionEnd - positionStart;
                    const safeStartTime = Number.isFinite(startTime) ? startTime : 0;
                    const safePositionStart = Number.isFinite(positionStart) ? positionStart : 0;
                    const safePositionEnd = Number.isFinite(positionEnd) ? positionEnd : (safePositionStart + Math.max(duration || 0, 0));
                    const safeDuration = Math.max((safePositionEnd - safePositionStart) || 0, 0.001);
                    const safeWidth = Number.isFinite(sortedMediaFiles[i].width) ? sortedMediaFiles[i].width : 1920;
                    const safeHeight = Number.isFinite(sortedMediaFiles[i].height) ? sortedMediaFiles[i].height : 1080;
                    const safeX = Number.isFinite(sortedMediaFiles[i].x) ? sortedMediaFiles[i].x : 0;
                    const safeY = Number.isFinite(sortedMediaFiles[i].y) ? sortedMediaFiles[i].y : 0;

                    const fileData = await getFile(sortedMediaFiles[i].fileId);
                    let buffer: ArrayBuffer | null = null;
                    let ext = '';
                    if (fileData) {
                        buffer = await fileData.arrayBuffer();
                        ext = mimeToExt[fileData.type as keyof typeof mimeToExt] || fileData.type.split('/')[1];
                    } else if (sortedMediaFiles[i].src) {
                        const src = sortedMediaFiles[i].src;
                        const fetchUrl = toFetchableMediaUrl(src!);
                        let response: Response;
                        try {
                            response = await fetch(fetchUrl);
                        } catch (fetchErr) {
                            throw new Error(`Failed to fetch media source: ${src}`);
                        }
                        if (!response.ok) {
                            throw new Error(`Missing media file for ${sortedMediaFiles[i].fileName || sortedMediaFiles[i].id} (${response.status} ${response.statusText})`);
                        }
                        const blob = await response.blob();
                        buffer = await blob.arrayBuffer();
                        const blobType = blob.type || '';
                        ext = mimeToExt[blobType as keyof typeof mimeToExt] || blobType.split('/')[1] || '';
                        if (!ext) {
                            const pathName = new URL(src!, window.location.origin).pathname;
                            const extMatch = pathName.split('.').pop();
                            ext = extMatch ? extMatch.toLowerCase() : '';
                        }
                    } else {
                        throw new Error(`Missing media file for ${sortedMediaFiles[i].fileName || sortedMediaFiles[i].id}`);
                    }
                    if (!buffer || !ext) {
                        throw new Error(`Missing media file for ${sortedMediaFiles[i].fileName || sortedMediaFiles[i].id}`);
                    }
                    const inputFileName = `input${i}.${ext}`;
                    await ffmpeg.writeFile(inputFileName, new Uint8Array(buffer));

                    if (sortedMediaFiles[i].type === 'image') {
                        inputs.push('-loop', '1', '-t', safeDuration.toFixed(3), '-i', inputFileName);
                    }
                    else {
                        inputs.push('-i', inputFileName);
                    }

                    const visualLabel = `visual${i}`;
                    const audioLabel = `audio${i}`;

                    if (sortedMediaFiles[i].type === 'video') {
                        filters.push(
                            `[${i}:v]trim=start=${safeStartTime.toFixed(3)}:duration=${safeDuration.toFixed(3)},scale=${safeWidth}:${safeHeight},setpts=PTS-STARTPTS+${safePositionStart.toFixed(3)}/TB[${visualLabel}]`
                        );
                    }
                    if (sortedMediaFiles[i].type === 'image') {
                        filters.push(
                            `[${i}:v]scale=${safeWidth}:${safeHeight},setpts=PTS+${safePositionStart.toFixed(3)}/TB[${visualLabel}]`
                        );
                    }

                    if (sortedMediaFiles[i].type === 'video' || sortedMediaFiles[i].type === 'image') {
                        const alpha = Math.min(Math.max((sortedMediaFiles[i].opacity || 100) / 100, 0), 1);
                        filters.push(
                            `[${visualLabel}]format=yuva420p,colorchannelmixer=aa=${alpha}[${visualLabel}]`
                        );
                    }

                    if (sortedMediaFiles[i].type === 'video' || sortedMediaFiles[i].type === 'image') {
                        overlays.push({
                            label: visualLabel,
                            x: safeX,
                            y: safeY,
                            start: safePositionStart.toFixed(3),
                            end: safePositionEnd.toFixed(3),
                        });
                    }

                    // Include explicit audio files and video files that actually have audio streams.
                    let shouldIncludeAudio = sortedMediaFiles[i].type === 'audio';
                    if (!shouldIncludeAudio && sortedMediaFiles[i].type === 'video') {
                        shouldIncludeAudio = await detectHasAudioStream(inputFileName);
                    }
                    if (shouldIncludeAudio) {
                        const delayMs = Math.round(safePositionStart * 1000);
                        const volume = sortedMediaFiles[i].volume !== undefined ? sortedMediaFiles[i].volume / 100 : 1;
                        filters.push(
                            `[${i}:a]atrim=start=${safeStartTime.toFixed(3)}:duration=${safeDuration.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[${audioLabel}]`
                        );
                        audioDelays.push(`[${audioLabel}]`);
                    }
                }

                let lastLabel = 'base';
                if (overlays.length > 0) {
                    for (let i = 0; i < overlays.length; i++) {
                        const { label, start, end, x, y } = overlays[i];
                        const nextLabel = i === overlays.length - 1 ? 'outv' : `tmp${i}`;
                        filters.push(
                            `[${lastLabel}][${label}]overlay=${x}:${y}:enable='between(t\\,${start}\\,${end})'[${nextLabel}]`
                        );
                        lastLabel = nextLabel;
                    }
                }

                if (textElements.length > 0) {
                    const fonts = ['Arial', 'Inter', 'Lato'];
                    for (let i = 0; i < fonts.length; i++) {
                        const font = fonts[i];
                        const res = await fetch(`/fonts/${font}.ttf`);
                        const fontBuf = await res.arrayBuffer();
                        await ffmpeg.writeFile(`font${font}.ttf`, new Uint8Array(fontBuf));
                    }
                    for (let i = 0; i < textElements.length; i++) {
                        const text = textElements[i];
                        const label = i === textElements.length - 1 ? 'outv' : `text${i}`;
                        const escapedText = text.text.replace(/:/g, '\\:').replace(/'/g, "\\\\'");
                        const alpha = Math.min(Math.max((text.opacity ?? 100) / 100, 0), 1);
                        const color = text.color?.includes('@') ? text.color : `${text.color || 'white'}@${alpha}`;
                        const requestedFont = typeof text.font === 'string' ? text.font : '';
                        const drawFont = fonts.includes(requestedFont) ? requestedFont : 'Arial';
                        filters.push(
                            `[${lastLabel}]drawtext=fontfile=font${drawFont}.ttf:text='${escapedText}':x=${Number.isFinite(text.x) ? text.x : 0}:y=${Number.isFinite(text.y) ? text.y : 0}:fontsize=${text.fontSize || 24}:fontcolor=${color}:enable='between(t\\,${Number.isFinite(text.positionStart) ? text.positionStart : 0}\\,${Number.isFinite(text.positionEnd) ? text.positionEnd : totalDuration})'[${label}]`
                        );
                        lastLabel = label;
                    }
                }

                if (audioDelays.length > 0) {
                    const audioMix = audioDelays.join('');
                    filters.push(`${audioMix}amix=inputs=${audioDelays.length}:normalize=0[outa]`);
                }

                const complexFilter = filters.join('; ');
                const ffmpegArgs = [
                    ...inputs,
                    '-filter_complex', complexFilter,
                    '-map', '[outv]',
                ];

                if (audioDelays.length > 0) {
                    ffmpegArgs.push('-map', '[outa]');
                }

                ffmpegArgs.push(
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-preset', params.preset,
                    '-crf', params.crf.toString(),
                    '-t', totalDuration.toFixed(3),
                    'output.mp4'
                );

                const exitCode = await ffmpeg.exec(ffmpegArgs);
                if (exitCode !== 0) {
                    throw new Error(`FFmpeg exited with code ${exitCode}`);
                }

            } catch (err) {
                console.error('FFmpeg processing error:', err);
                throw err;
            }

            // return the output url
            let outputData: Uint8Array;
            try {
                outputData = await ffmpeg.readFile('output.mp4') as Uint8Array;
            } catch {
                throw new Error('FFmpeg did not produce output.mp4');
            }
            const outputBlob = new Blob([outputData as any], { type: 'video/mp4' });
            const outputUrl = URL.createObjectURL(outputBlob);
            return outputUrl;
        };

        try {
            const outputUrl = await renderFunction();
            setPreviewUrl(outputUrl);
            setLoaded(true);
            setIsRendering(false);
            toast.success('Video rendered successfully');
        } catch (err) {
            toast.error('Failed to render video');
            setIsRendering(false);
            console.error("Failed to render video:", err);
        }
    };

    return (
        <>
            <button
                onClick={() => render()}
                className={styles.renderButton}
                disabled={(!loadFfmpeg || isRendering || (mediaFiles.length === 0 && textElements.length === 0))}
            >
                {(!loadFfmpeg || isRendering) && (
                    <span className={styles.spinner}>
                        <svg
                            viewBox="0 0 1024 1024"
                            focusable="false"
                            data-icon="loading"
                            width="1em"
                            height="1em"
                        >
                            <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
                        </svg>
                    </span>
                )}
                <span>{loadFfmpeg ? (isRendering ? "Rendering..." : "Render") : "Loading FFmpeg..."}</span>
            </button>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>
                                {isRendering ? "Rendering..." : `${projectName}`}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className={styles.closeButton}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                        </div>

                        {isRendering ? (
                            <div className={styles.logPanel}>
                                <div className={styles.logText}>{logMessages}</div>
                                <div className={styles.logHint}>
                                    The progress bar is experimental in FFmpeg WASM, so it might appear slow or unresponsive even though the actual processing is not.
                                </div>
                                <FfmpegProgressBar ffmpeg={ffmpeg} />
                            </div>
                        ) : (
                            <div>
                                {previewUrl && (
                                    <video src={previewUrl} controls className={styles.previewVideo} />
                                )}
                                <div className={styles.modalActions}>
                                    <a
                                        href={previewUrl || "#"}
                                        download={`${projectName}.mp4`}
                                        className={styles.actionButton}
                                    >
                                        <Image
                                            alt="Download"
                                            className={styles.actionIcon}
                                            height={18}
                                            src={saveIcon}
                                            width={18}
                                        />
                                        <span className={styles.actionLabel}>Save Video</span>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}