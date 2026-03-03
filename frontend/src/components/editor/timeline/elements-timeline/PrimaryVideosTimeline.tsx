"use client";
import React, { useRef, useMemo, useEffect } from "react";
import Moveable, { OnDrag, OnResize } from "react-moveable";
import { useAppSelector } from "../../../../store";
import { setActiveElement, setActiveElementIndex, setMediaFiles } from "../../../../store/slices/projectSlice";
import { useDispatch } from "react-redux";
import Image from "next/image";
import { MediaFile } from "../../../../types/video_editor";
import { throttle } from "lodash";
import styles from "./VideoTimeline.module.css";
import videoIcon from "@/assets/images/video.svg";

const isPrimaryVideo = (m: { type: string; fileName?: string; isPrimarySceneVideo?: boolean }) =>
    m.type === "video" && (m.isPrimarySceneVideo === true || /^Video-\d+-1$/.test(m.fileName || ""));

/** Row 0: Video-1-1, Video-2-1, Video-3-1 in one row */
export default function PrimaryVideosTimeline() {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { mediaFiles, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});
    const clips = mediaFiles.filter(isPrimaryVideo);

    const mediaFilesRef = useRef(mediaFiles);
    useEffect(() => {
        mediaFilesRef.current = mediaFiles;
    }, [mediaFiles]);

    const onUpdateMedia = useMemo(() =>
        throttle((id: string, updates: Partial<MediaFile>) => {
            const currentFiles = mediaFilesRef.current;
            const updated = currentFiles.map(media =>
                media.id === id ? { ...media, ...updates } : media
            );
            dispatch(setMediaFiles(updated));
        }, 200), [dispatch]
    );

    const handleClick = (index: string) => {
        dispatch(setActiveElement("media") as any);
        const actualIndex = mediaFiles.findIndex((clip) => clip.id === index);
        dispatch(setActiveElementIndex(actualIndex >= 0 ? actualIndex : 0));
    };

    const handleDrag = (clip: MediaFile, target: HTMLElement, left: number) => {
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
            endTime: Math.max((newPositionStart - clip.positionStart) + clip.endTime, clip.endTime)
        });
        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionEnd = width / timelineZoom;
        onUpdateMedia(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
            endTime: Math.max(clip.positionStart + newPositionEnd, clip.endTime)
        });
    };

    useEffect(() => {
        clips.forEach((clip) => moveableRef.current[clip.id]?.updateRect());
    }, [timelineZoom, clips]);

    if (clips.length === 0) return null;

    return (
        <div className={styles.container}>
            {clips.map((clip) => {
                const playbackSpeed = clip.playbackSpeed && clip.playbackSpeed > 0 ? clip.playbackSpeed : 1;
                const duration = (clip.positionEnd / playbackSpeed) - (clip.positionStart / playbackSpeed);
                const clipWidth = Number.isFinite(duration) ? duration * timelineZoom : 0;
                const isActive = activeElement === "media" && mediaFiles[activeElementIndex]?.id === clip.id;

                return (
                    <div key={clip.id}>
                        <div
                            ref={(el: HTMLDivElement | null) => {
                                if (el) targetRefs.current[clip.id] = el;
                            }}
                            onClick={() => handleClick(clip.id)}
                            className={`${styles.clip} ${isActive ? styles.clipActive : ""}`}
                            style={{
                                left: `${clip.positionStart * timelineZoom}px`,
                                width: `${clipWidth}px`,
                                zIndex: clip.zIndex,
                            }}
                        >
                            <Image alt="Video" className={styles.clipIcon} height={22} width={22} src={videoIcon} />
                            <span className={styles.clipText}>{clip.fileName}</span>
                        </div>
                        <Moveable
                            ref={(el) => { if (el) moveableRef.current[clip.id] = el; }}
                            target={targetRefs.current[clip.id] || null}
                            container={null}
                            renderDirections={isActive ? ["w", "e"] : []}
                            draggable={true}
                            throttleDrag={0}
                            rotatable={false}
                            onDrag={({ left, target }: OnDrag) => {
                                handleClick(clip.id);
                                handleDrag(clip, target as HTMLElement, left);
                            }}
                            resizable={true}
                            throttleResize={0}
                            onResize={({ target, width, delta, direction }: OnResize) => {
                                if (direction[0] === 1) {
                                    handleClick(clip.id);
                                    delta[0] && (target!.style.width = `${width}px`);
                                    handleRightResize(clip, target as HTMLElement, width);
                                }
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
