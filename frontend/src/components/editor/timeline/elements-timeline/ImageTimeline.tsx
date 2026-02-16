"use client";
import React, { useRef, useMemo } from "react";
import Moveable, { OnDrag, OnResize } from "react-moveable";
import { useAppSelector } from "../../../../store";
import { setActiveElement, setActiveElementIndex, setMediaFiles } from "../../../../store/slices/projectSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import { MediaFile } from "../../../../types/video_editor";
import { throttle } from "lodash";
import styles from "./ImageTimeline.module.css";
import imageIcon from "@/assets/images/image.svg";

export default function ImageTimeline() {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { mediaFiles, textElements, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});


    const mediaFilesRef = useRef(mediaFiles);
    useEffect(() => {
        mediaFilesRef.current = mediaFiles;
    }, [mediaFiles]);

    // Increased throttle delay to 200ms to reduce Redux updates during drag operations
    const onUpdateMedia = useMemo(() =>
        throttle((id: string, updates: Partial<MediaFile>) => {
            const currentFiles = mediaFilesRef.current;
            const updated = currentFiles.map(media =>
                media.id === id ? { ...media, ...updates } : media
            );
            dispatch(setMediaFiles(updated));
        }, 200), [dispatch]
    );

    const handleClick = (element: string, index: number | string) => {
        if (element === "media") {
            dispatch(setActiveElement("media") as any);
            const actualIndex = mediaFiles.findIndex(clip => clip.id === index as unknown as string);
            dispatch(setActiveElementIndex(actualIndex));
        }
    };

    const handleDrag = (clip: MediaFile, target: HTMLElement, left: number) => {
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
            endTime: (newPositionStart - clip.positionStart) + clip.endTime
        })

        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (clip: MediaFile, target: HTMLElement, width: number) => {
        const newPositionEnd = width / timelineZoom;

        onUpdateMedia(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
            endTime: clip.positionStart + newPositionEnd,
        })
    };
    useEffect(() => {
        for (const clip of mediaFiles) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [timelineZoom]);

    return (
        <div className={styles.container}>
            {mediaFiles
                .filter(clip => clip.type === "image")
                .map((clip) => {
                    const isActive = activeElement === "media" && mediaFiles[activeElementIndex]?.id === clip.id;
                    return (
                    <div key={clip.id}>
                        <div
                            key={clip.id}
                            ref={(el: HTMLDivElement | null) => {
                                if (el) {
                                    targetRefs.current[clip.id] = el;
                                }
                            }}
                            onClick={() => handleClick("media", clip.id)}
                            className={`${styles.clip} ${isActive ? styles.clipActive : ""}`}
                            style={{
                                left: `${clip.positionStart * timelineZoom}px`,
                                width: `${(clip.positionEnd - clip.positionStart) * timelineZoom}px`,
                                zIndex: clip.zIndex,
                            }}
                        >
                            <Image
                                alt="Image"
                                className={styles.clipIcon}
                                height={22}
                                width={22}
                                src={imageIcon}
                            />
                            <span className={styles.clipText}>{clip.fileName}</span>

                        </div>

                        <Moveable
                            ref={(el: Moveable | null) => {
                                if (el) {
                                    moveableRef.current[clip.id] = el;
                                }
                            }}
                            target={targetRefs.current[clip.id] || null}
                            container={null}
                            renderDirections={isActive ? ["w", "e"] : []}
                            draggable={true}
                            throttleDrag={0}
                            rotatable={false}
                            onDragStart={({ target, clientX, clientY }) => {
                            }}
                            onDrag={({ left, target }: OnDrag) => {
                                handleClick("media", clip.id)
                                handleDrag(clip, target as HTMLElement, left);
                            }}
                            onDragEnd={({ target, isDrag, clientX, clientY }) => {
                            }}
                            resizable={true}
                            throttleResize={0}
                            onResizeStart={({ target, clientX, clientY }) => {
                            }}
                            onResize={({ target, width, delta, direction }: OnResize) => {
                                if (direction[0] === 1) {
                                    handleClick("media", clip.id)
                                    delta[0] && (target!.style.width = `${width}px`);
                                    handleRightResize(clip, target as HTMLElement, width);

                                }
                                else if (direction[0] === -1) {
                                }

                            }}
                            onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                            }}
                            className={isActive ? "" : "moveable-control-box-hidden"}

                        />
                    </div>
                    );
                })}
        </div>
    );
}
