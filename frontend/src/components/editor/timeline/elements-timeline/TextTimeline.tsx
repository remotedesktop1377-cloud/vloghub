"use client";
import React, { useRef, useMemo } from "react";
import Moveable, { OnDrag, OnResize } from "react-moveable";
import { useAppSelector } from "../../../../store";
import { setActiveElement, setActiveElementIndex, setTextElements } from "../../../../store/slices/projectSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Image from "next/image";
import { TextElement } from "../../../../types/video_editor";
import { throttle } from "lodash";
import styles from "./TextTimeline.module.css";
import textIcon from "@/assets/images/text.svg";

export default function TextTimeline() {
    const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const { textElements, activeElement, activeElementIndex, timelineZoom } = useAppSelector((state) => state.projectState);
    const dispatch = useDispatch();
    const moveableRef = useRef<Record<string, Moveable | null>>({});


    const textElementsRef = useRef(textElements);
    useEffect(() => {
        textElementsRef.current = textElements;
    }, [textElements]);

    const onUpdateText = useMemo(() =>
        throttle((id: string, updates: Partial<TextElement>) => {
            const currentFiles = textElementsRef.current;
            const updated = currentFiles.map(text =>
                text.id === id ? { ...text, ...updates } : text
            );
            dispatch(setTextElements(updated));
        }, 100), [dispatch]
    );

    const handleClick = (element: string, index: number | string) => {
        if (element === "text") {
            dispatch(setActiveElement("text") as any);
            const actualIndex = textElements.findIndex(clip => clip.id === index as unknown as string);
            dispatch(setActiveElementIndex(actualIndex));
        }
    };

    const handleDrag = (clip: TextElement, target: HTMLElement, left: number) => {
        const constrainedLeft = Math.max(left, 0);
        const newPositionStart = constrainedLeft / timelineZoom;
        onUpdateText(clip.id, {
            positionStart: newPositionStart,
            positionEnd: (newPositionStart - clip.positionStart) + clip.positionEnd,
        })

        target.style.left = `${constrainedLeft}px`;
    };

    const handleResize = (clip: TextElement, target: HTMLElement, width: number) => {
        const newPositionEnd = width / timelineZoom;

        onUpdateText(clip.id, {
            positionEnd: clip.positionStart + newPositionEnd,
        })
    };
    useEffect(() => {
        for (const clip of textElements) {
            moveableRef.current[clip.id]?.updateRect();
        }
    }, [timelineZoom]);

    return (
        <div className={styles.container}>
            {textElements.map((clip) => {
                const isActive = activeElement === "text" && textElements[activeElementIndex]?.id === clip.id;
                return (
                <div key={clip.id}>
                    <div
                        key={clip.id}
                        ref={(el: HTMLDivElement | null) => {
                            if (el) {
                                targetRefs.current[clip.id] = el;
                            }
                        }}
                        onClick={() => handleClick("text", clip.id)}
                        className={`${styles.clip} ${isActive ? styles.clipActive : ""}`}
                        style={{
                            left: `${clip.positionStart * timelineZoom}px`,
                            width: `${(clip.positionEnd - clip.positionStart) * timelineZoom}px`,
                            zIndex: clip.zIndex,
                        }}
                    >
                        <Image
                            alt="Text"
                            className={styles.clipIcon}
                            height={22}
                            width={22}
                            src={textIcon}
                        />
                        <span className={styles.clipText}>{clip.text}</span>

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
                            handleClick("text", clip.id)
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
                                handleClick("text", clip.id)
                                delta[0] && (target!.style.width = `${width}px`);
                                handleResize(clip, target as HTMLElement, width);

                            }
                            else if (direction[0] === -1) {
                            }
                        }}
                        onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                        }}

                    />
                </div>
                );
            })}
        </div>
    );
}
