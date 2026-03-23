"use client";
import { useAppSelector } from "../../../store";
import { setMarkerTrack, setTextElements, setMediaFiles, setTimelineZoom, setCurrentTime, setIsPlaying, setActiveElement, setBackgroundClips } from "../../../store/slices/projectSlice";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import TimelineHeader from "./TimelineHeader";
import PrimaryVideosTimeline from "./elements-timeline/PrimaryVideosTimeline";
import MediaLayerRow from "./elements-timeline/MediaLayerRow";
import BackgroundTimelineRow from "./elements-timeline/BackgroundTimelineRow";
import AudioTimeline from "./elements-timeline/AudioTimline";
import TextTimeline from "./elements-timeline/TextTimeline";
import { SceneData } from "@/types/sceneData";
import { throttle } from "lodash";
import GlobalKeyHandlerProps from "../../../utils/GlobalKeyHandlerProps";
import toast from "react-hot-toast";
import styles from "./Timline.module.css";
import checkIcon from "@/assets/images/check.svg";
import closeIcon from "@/assets/images/close.svg";
import cutIcon from "@/assets/images/cut.svg";
import duplicateIcon from "@/assets/images/duplicate.svg";
import deleteIcon from "@/assets/images/delete.svg";
import { BackgroundClip, MediaFile, TextElement } from "@/types/video_editor";
import { usePlayerRef } from "../../../context/PlayerContext";

const fps = 30;

interface TimelineProps {
    scenesData?: SceneData[];
}

export const Timeline = ({ scenesData = [] }: TimelineProps) => {
    const { timelineZoom, enableMarkerTracking, activeElement, activeElementIndex, mediaFiles, textElements, backgroundClips, duration, isPlaying } = useAppSelector((state) => state.projectState);
    // Read currentTime from Redux for user interactions (seeking when paused)
    const reduxCurrentTime = useAppSelector((state) => state.projectState.currentTime);
    const dispatch = useDispatch();
    const timelineRef = useRef<HTMLDivElement>(null);
    const playerRef = usePlayerRef();
    
    // Local state for timeline cursor position (updated from Player during playback)
    const [displayCurrentTime, setDisplayCurrentTime] = useState(0);
    const lastDisplayTimeRef = useRef(0);
    
    // Sync displayCurrentTime from Redux when paused
    useEffect(() => {
        if (isPlaying) return;
        if (Math.abs(reduxCurrentTime - lastDisplayTimeRef.current) > 0.001) {
            lastDisplayTimeRef.current = reduxCurrentTime;
            setDisplayCurrentTime(reduxCurrentTime);
        }
    }, [isPlaying, reduxCurrentTime]);

    // During playback, read directly from Player ref via rAF to avoid Redux round-trips
    useEffect(() => {
        if (!isPlaying || !playerRef.current) return;

        let animationFrameId: number;
        const updateCursor = () => {
            if (!playerRef.current) return;
            try {
                const currentFrame = playerRef.current.getCurrentFrame();
                const currentTimeInSeconds = currentFrame / fps;
                if (Math.abs(currentTimeInSeconds - lastDisplayTimeRef.current) > 0.01) {
                    lastDisplayTimeRef.current = currentTimeInSeconds;
                    setDisplayCurrentTime(currentTimeInSeconds);
                }
            } catch (_) {
                // Player might not be ready yet
            }
            animationFrameId = requestAnimationFrame(updateCursor);
        };

        animationFrameId = requestAnimationFrame(updateCursor);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);
    
    // Use displayCurrentTime for cursor, reduxCurrentTime for operations
    const currentTime = isPlaying ? displayCurrentTime : reduxCurrentTime;

    const throttledZoom = useMemo(() =>
        throttle((value: number) => {
            dispatch(setTimelineZoom(value));
        }, 100),
        [dispatch]
    );

    // Images (excl logo) sorted: Image-1-1, Image-1-2, Image-2-1, Image-2-2...
    const imageLayers = useMemo(() => {
        const images = mediaFiles.filter((m) => m.type === "image" && m.fileName !== "vloghub-logo");
        const parse = (name: string): [number, number] => {
            const m = name.match(/Image-(\d+)-(\d+)/);
            return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [999, 999];
        };
        return images.sort((a, b) => {
            const [sa, ia] = parse(a.fileName);
            const [sb, ib] = parse(b.fileName);
            if (sa !== sb) return sa - sb;
            return ia - ib;
        });
    }, [mediaFiles]);

    const isPrimaryVideo = (m: { type: string; fileName?: string; isPrimarySceneVideo?: boolean }) =>
        m.type === "video" && (m.isPrimarySceneVideo === true || /^Video-\d+-1$/.test(m.fileName || ""));

    // Secondary videos (Video-1-2, Video-2-2...) and logo last
    const otherLayers = useMemo(() => {
        const secondary = mediaFiles.filter((m) => m.type === "video" && !isPrimaryVideo(m));
        const logo = mediaFiles.find((m) => m.fileName === "vloghub-logo");
        return [...secondary, ...(logo ? [logo] : [])];
    }, [mediaFiles]);

    const handleSplit = () => {
        let element = null;
        let elements = null;
        let setElements = null;

        if (!activeElement) {
            toast.error("No element selected.");
            return;
        }

        if (activeElement === "media") {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;

            if (!element) {
                toast.error("No element selected.");
                return;
            }

            const { positionStart, positionEnd } = element;

            if (currentTime <= positionStart || currentTime >= positionEnd) {
                toast.error("Marker is outside the selected element bounds.");
                return;
            }

            const positionDuration = positionEnd - positionStart;

            const { startTime, endTime } = element;
            const sourceDuration = endTime - startTime;
            const ratio = (currentTime - positionStart) / positionDuration;
            const splitSourceOffset = startTime + ratio * sourceDuration;

            const firstPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart,
                positionEnd: currentTime,
                startTime,
                endTime: splitSourceOffset
            };

            const secondPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                positionEnd,
                startTime: splitSourceOffset,
                endTime
            };

            elements.splice(activeElementIndex, 1, firstPart, secondPart);
        } else if (activeElement === "text") {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;

            if (!element) {
                toast.error("No element selected.");
                return;
            }

            const { positionStart, positionEnd } = element;

            if (currentTime <= positionStart || currentTime >= positionEnd) {
                toast.error("Marker is outside the selected element.");
                return;
            }

            const firstPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart,
                positionEnd: currentTime,
            };

            const secondPart = {
                ...element,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                positionEnd,
            };

            elements.splice(activeElementIndex, 1, firstPart, secondPart);
        } else if (activeElement === "background") {
            elements = [...backgroundClips];
            element = elements[activeElementIndex];
            setElements = setBackgroundClips;

            if (!element) {
                toast.error("No element selected.");
                return;
            }

            const bgElement = element as BackgroundClip;
            const { positionStart, positionEnd } = bgElement;
            if (currentTime <= positionStart || currentTime >= positionEnd) {
                toast.error("Marker is outside the selected element.");
                return;
            }

            const firstPart: BackgroundClip = {
                ...bgElement,
                id: crypto.randomUUID(),
                positionStart,
                positionEnd: currentTime,
            };

            const secondPart: BackgroundClip = {
                ...bgElement,
                id: crypto.randomUUID(),
                positionStart: currentTime,
                positionEnd,
            };

            elements.splice(activeElementIndex, 1, firstPart as any, secondPart as any);
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success("Element split successfully.");
        }
    };

    const handleDuplicate = () => {
        let element = null;
        let elements = null;
        let setElements = null;

        if (activeElement === "media") {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === "text") {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
        } else if (activeElement === "background") {
            elements = [...backgroundClips];
            element = elements[activeElementIndex];
            setElements = setBackgroundClips;
        }

        if (!element) {
            toast.error("No element selected.");
            return;
        }

        const duplicatedElement = {
            ...element,
            id: crypto.randomUUID(),
        };

        if (elements) {
            elements.splice(activeElementIndex + 1, 0, duplicatedElement as any);
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success("Element duplicated successfully.");
        }
    };

    const handleDelete = () => {
        let element: MediaFile | TextElement | BackgroundClip | null = null;
        let elements: Array<MediaFile | TextElement | BackgroundClip> | null = null;
        let setElements: typeof setMediaFiles | typeof setTextElements | typeof setBackgroundClips | null = null;

        if (activeElement === "media") {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === "text") {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
        } else if (activeElement === "background") {
            elements = [...backgroundClips];
            element = elements[activeElementIndex];
            setElements = setBackgroundClips;
        }

        if (!element) {
            toast.error("No element selected.");
            return;
        }

        if (elements) {
            const elementId = element?.id;
            if (!elementId) {
                toast.error("No element selected.");
                return;
            }
            elements = elements.filter(ele => ele.id !== elementId)
        }

        if (elements && setElements) {
            dispatch(setElements(elements as any));
            dispatch(setActiveElement(null));
            toast.success("Element deleted successfully.");
        }
    };


    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineRef.current) return;

        dispatch(setIsPlaying(false));
        const rect = timelineRef.current.getBoundingClientRect();

        const scrollOffset = timelineRef.current.scrollLeft;
        const offsetX = e.clientX - rect.left + scrollOffset;

        const seconds = offsetX / timelineZoom;
        const clampedTime = Math.max(0, Math.min(duration, seconds));

        dispatch(setCurrentTime(clampedTime));
    };

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                <div className={styles.toolGroup}>
                    <button
                        onClick={() => dispatch(setMarkerTrack(!enableMarkerTracking))}
                        className={styles.toolButton}
                    >
                        <Image
                            alt="Track"
                            className={styles.toolIcon}
                            height={20}
                            width={20}
                            src={enableMarkerTracking ? checkIcon : closeIcon}
                        />
                        <span className={styles.toolText}>Track Marker <span>(T)</span></span>
                    </button>
                    <button
                        onClick={handleSplit}
                        className={styles.toolButton}
                    >
                        <Image
                            alt="Split"
                            className={styles.toolIcon}
                            height={20}
                            width={20}
                            src={cutIcon}
                        />
                        <span className={styles.toolText}>Split <span>(S)</span></span>
                    </button>
                    <button
                        onClick={handleDuplicate}
                        className={styles.toolButton}
                    >
                        <Image
                            alt="Duplicate"
                            className={styles.toolIcon}
                            height={20}
                            width={20}
                            src={duplicateIcon}
                        />
                        <span className={styles.toolText}>Duplicate <span>(D)</span></span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className={styles.toolButtonDanger}
                    >
                        <Image
                            alt="Delete"
                            className={styles.toolIcon}
                            height={20}
                            width={20}
                            src={deleteIcon}
                        />
                        <span className={styles.toolText}>Delete <span>(Del)</span></span>
                    </button>
                </div>

                <div className={styles.zoomGroup}>
                    <label className={styles.zoomLabel}>Zoom</label>
                    <span className={styles.zoomSign}>-</span>
                    <input
                        type="range"
                        min={30}
                        max={120}
                        step="1"
                        value={timelineZoom}
                        onChange={(e) => throttledZoom(Number(e.target.value))}
                        className={styles.zoomRange}
                    />
                    <span className={styles.zoomSign}>+</span>
                </div>
            </div>

            <div
                className={styles.timelineScroll}
                ref={timelineRef}
                onClick={handleClick}
            >
                <div className={styles.timelineHeaderSticky}>
                    <TimelineHeader />
                </div>
                <div className={styles.timelineSurface}>
                    <div
                        className={styles.timelineCursor}
                        style={{
                            left: `${currentTime * timelineZoom}px`,
                        }}
                    />
                    <div className={styles.trackStack}>
                        <div className={styles.trackRow}>
                            <BackgroundTimelineRow />
                        </div>
                        {mediaFiles.some(isPrimaryVideo) && (
                            <div className={styles.trackRow}>
                                <PrimaryVideosTimeline />
                            </div>
                        )}
                        {imageLayers.map((clip) => (
                            <div key={clip.id} className={styles.trackRow}>
                                <MediaLayerRow clip={clip} layerLabel={clip.fileName} />
                            </div>
                        ))}
                        {otherLayers.map((clip) => (
                            <div key={clip.id} className={styles.trackRow}>
                                <MediaLayerRow clip={clip} layerLabel={clip.fileName} />
                            </div>
                        ))}
                        <div className={styles.trackRow}>
                            <AudioTimeline />
                        </div>
                        <div className={styles.trackRow}>
                            <TextTimeline />
                        </div>
                    </div>
                </div>
            </div>
            <GlobalKeyHandlerProps handleDuplicate={handleDuplicate} handleSplit={handleSplit} handleDelete={handleDelete} />
        </div>
    );
};

export default memo(Timeline)
