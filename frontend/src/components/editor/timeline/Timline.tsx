"use client";
import { useAppSelector } from "../../../store";
import { setMarkerTrack, setTextElements, setMediaFiles, setTimelineZoom, setCurrentTime, setIsPlaying, setActiveElement } from "../../../store/slices/projectSlice";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import TimelineHeader from "./TimelineHeader";
import VideoTimeline from "./elements-timeline/VideoTimeline";
import ImageTimeline from "./elements-timeline/ImageTimeline";
import AudioTimeline from "./elements-timeline/AudioTimline";
import TextTimeline from "./elements-timeline/TextTimeline";
import { throttle } from "lodash";
import GlobalKeyHandlerProps from "../../../utils/GlobalKeyHandlerProps";
import toast from "react-hot-toast";
import styles from "./Timline.module.css";
import checkIcon from "@/assets/images/check.svg";
import closeIcon from "@/assets/images/close.svg";
import cutIcon from "@/assets/images/cut.svg";
import duplicateIcon from "@/assets/images/duplicate.svg";
import deleteIcon from "@/assets/images/delete.svg";
import { MediaFile, TextElement } from "@/types/video_editor";

export const Timeline = () => {
    const { currentTime, timelineZoom, enableMarkerTracking, activeElement, activeElementIndex, mediaFiles, textElements, duration, isPlaying } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const timelineRef = useRef<HTMLDivElement>(null)

    const throttledZoom = useMemo(() =>
        throttle((value: number) => {
            dispatch(setTimelineZoom(value));
        }, 100),
        [dispatch]
    );

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
        let element: MediaFile | TextElement | null = null;
        let elements: Array<MediaFile | TextElement> | null = null;
        let setElements: typeof setMediaFiles | typeof setTextElements | null = null;

        if (activeElement === "media") {
            elements = [...mediaFiles];
            element = elements[activeElementIndex];
            setElements = setMediaFiles;
        } else if (activeElement === "text") {
            elements = [...textElements];
            element = elements[activeElementIndex];
            setElements = setTextElements;
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
                <TimelineHeader />

                <div className={styles.timelineSurface}>
                    <div
                        className={styles.timelineCursor}
                        style={{
                            left: `${currentTime * timelineZoom}px`,
                        }}
                    />
                    <div className={styles.trackStack}>
                        <div className={styles.trackRow}>
                            <VideoTimeline />
                        </div>
                        <div className={styles.trackRow}>
                            <AudioTimeline />
                        </div>
                        <div className={styles.trackRow}>
                            <ImageTimeline />
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
