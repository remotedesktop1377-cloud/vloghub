"use client";
import React, { useRef, useMemo, useEffect } from "react";
import Moveable, { OnDrag, OnResize } from "react-moveable";
import { useAppSelector } from "../../../../store";
import { setActiveElement, setActiveElementIndex, setMediaFiles } from "../../../../store/slices/projectSlice";
import { useDispatch } from "react-redux";
import Image from "next/image";
import { MediaFile } from "../../../../types/video_editor";
import { throttle } from "lodash";
import styles from "./MediaLayerRow.module.css";
import videoIcon from "@/assets/images/video.svg";
import imageIcon from "@/assets/images/image.svg";

interface MediaLayerRowProps {
    clip: MediaFile;
    layerLabel: string;
}

export default function MediaLayerRow({ clip, layerLabel }: MediaLayerRowProps) {
    const targetRef = useRef<HTMLDivElement | null>(null);
    const { mediaFiles, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const moveableRef = useRef<Moveable | null>(null);
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

    const handleClick = () => {
        dispatch(setActiveElement("media") as any);
        const actualIndex = mediaFiles.findIndex(c => c.id === clip.id);
        dispatch(setActiveElementIndex(actualIndex >= 0 ? actualIndex : 0));
    };

    const handleDrag = (target: HTMLElement, left: number) => {
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateMedia(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
            endTime: Math.max((newPositionStart - clip.positionStart) + clip.endTime, clip.endTime)
        });
        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (target: HTMLElement, width: number) => {
        const newPositionEnd = width / timelineZoom;
        onUpdateMedia(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
            endTime: clip.type === "video"
                ? Math.max(clip.positionStart + newPositionEnd, clip.endTime)
                : clip.positionStart + newPositionEnd
        });
    };

    useEffect(() => {
        moveableRef.current?.updateRect();
    }, [timelineZoom]);

    const isVideo = clip.type === "video";
    const playbackSpeed = clip.playbackSpeed && clip.playbackSpeed > 0 ? clip.playbackSpeed : 1;
    const duration = isVideo
        ? (clip.positionEnd / playbackSpeed) - (clip.positionStart / playbackSpeed)
        : clip.positionEnd - clip.positionStart;
    const clipWidth = Number.isFinite(duration) ? duration * timelineZoom : (clip.positionEnd - clip.positionStart) * timelineZoom;
    const isActive = activeElement === "media" && mediaFiles[activeElementIndex]?.id === clip.id;

    return (
        <div className={styles.row} data-layer-label={layerLabel}>
            <div
                ref={(el) => { targetRef.current = el; }}
                onClick={handleClick}
                className={`${styles.clip} ${isVideo ? styles.clipVideo : styles.clipImage} ${isActive ? styles.clipActive : ""}`}
                style={{
                    left: `${clip.positionStart * timelineZoom}px`,
                    width: `${clipWidth}px`,
                    zIndex: clip.zIndex,
                }}
            >
                <Image
                    alt={isVideo ? "Video" : "Image"}
                    className={styles.clipIcon}
                    height={22}
                    width={22}
                    src={isVideo ? videoIcon : imageIcon}
                />
                <span className={styles.clipText}>{clip.fileName}</span>
            </div>
            <Moveable
                ref={(el) => { moveableRef.current = el; }}
                target={targetRef.current}
                container={null}
                renderDirections={isActive ? ["w", "e"] : []}
                draggable={true}
                throttleDrag={0}
                rotatable={false}
                onDrag={({ left, target }: OnDrag) => {
                    handleClick();
                    handleDrag(target as HTMLElement, left);
                }}
                resizable={true}
                throttleResize={0}
                onResize={({ target, width, delta, direction }: OnResize) => {
                    if (direction[0] === 1) {
                        handleClick();
                        delta[0] && (target!.style.width = `${width}px`);
                        handleRightResize(target as HTMLElement, width);
                    }
                }}
            />
        </div>
    );
}
