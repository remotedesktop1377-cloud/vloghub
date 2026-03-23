"use client";
import React, { useEffect, useMemo, useRef } from "react";
import Moveable, { OnDrag, OnResize } from "react-moveable";
import { throttle } from "lodash";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../../../store";
import { setActiveElement, setActiveElementIndex, setBackgroundClips } from "../../../../store/slices/projectSlice";
import { BackgroundClip } from "../../../../types/video_editor";
import styles from "./BackgroundTimelineRow.module.css";

const getClipLabel = (clip: BackgroundClip): string => {
    if (clip.type === "color") {
        return clip.name || clip.color || "Color Background";
    }
    return clip.name || clip.src || `${clip.type} background`;
};

export default function BackgroundTimelineRow() {
    const { backgroundClips, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const moveableRef = useRef<Record<string, Moveable | null>>({});
    const backgroundClipsRef = useRef(backgroundClips);
    const dispatch = useDispatch();

    useEffect(() => {
        backgroundClipsRef.current = backgroundClips;
    }, [backgroundClips]);

    const onUpdateBackground = useMemo(() =>
        throttle((id: string, updates: Partial<BackgroundClip>) => {
            const updated = backgroundClipsRef.current.map((clip) =>
                clip.id === id ? { ...clip, ...updates } : clip
            );
            dispatch(setBackgroundClips(updated));
        }, 200), [dispatch]
    );

    const handleClick = (id: string) => {
        dispatch(setActiveElement("background") as any);
        const actualIndex = backgroundClips.findIndex((clip) => clip.id === id);
        dispatch(setActiveElementIndex(actualIndex >= 0 ? actualIndex : 0));
    };

    const handleDrag = (clip: BackgroundClip, target: HTMLElement, left: number) => {
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateBackground(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
        });
        target.style.left = `${constrainedLeft}px`;
    };

    const handleRightResize = (clip: BackgroundClip, width: number) => {
        const newPositionEnd = width / timelineZoom;
        onUpdateBackground(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
        });
    };

    useEffect(() => {
        for (const clip of backgroundClips) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [timelineZoom, backgroundClips]);

    if (backgroundClips.length === 0) {
        return null;
    }

    return (
        <div className={styles.row}>
            {backgroundClips.map((clip) => {
                const isActive = activeElement === "background" && backgroundClips[activeElementIndex]?.id === clip.id;
                const clipWidth = Math.max(1, (clip.positionEnd - clip.positionStart) * timelineZoom);
                return (
                    <div key={clip.id}>
                        <div
                            ref={(el: HTMLDivElement | null) => {
                                if (el) {
                                    targetRefs.current[clip.id] = el;
                                }
                            }}
                            onClick={() => handleClick(clip.id)}
                            className={`${styles.clip} ${isActive ? styles.clipActive : ""}`}
                            style={{
                                left: `${clip.positionStart * timelineZoom}px`,
                                width: `${clipWidth}px`,
                            }}
                        >
                            <span
                                className={styles.swatch}
                                style={{ background: clip.type === "color" ? (clip.color || "#111827") : "#6ea3ff" }}
                            />
                            <span className={styles.clipText}>{getClipLabel(clip)}</span>
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
                                    handleRightResize(clip, width);
                                }
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
