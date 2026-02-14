import React from "react";
import { AbsoluteFill, Img, Sequence } from "remotion";
import { MediaFile } from "../../../../../../types/video_editor";
import { HelperFunctions } from "../../../../../../utils/helperFunctions";
import { useAppDispatch, useAppSelector } from "../../../../../../store";
import { setMediaFiles } from "../../../../../../store/slices/projectSlice";

const REMOTION_SAFE_FRAME = 0;
const MIN_IMAGE_SIZE = 40;

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

const calculateFrames = (
    display: { from: number; to: number },
    fps: number
) => {
    const from = display.from * fps;
    const to = display.to * fps;
    const durationInFrames = Math.max(1, to - from);
    return { from, durationInFrames };
};

interface ImageSequenceItemProps {
    item: MediaFile;
    options: SequenceItemOptions;
}

type ResizeCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export const ImageSequenceItem: React.FC<ImageSequenceItemProps> = ({ item, options }) => {
    const { fps } = options;
    const dispatch = useAppDispatch();
    const { mediaFiles } = useAppSelector((state) => state.projectState);

    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const crop = item.crop || {
        x: 0,
        y: 0,
        width: item.width,
        height: item.height
    };
    const safeX = HelperFunctions.getValidNumber(item.x) ?? 0;
    const safeY = HelperFunctions.getValidNumber(item.y) ?? 0;
    const safeWidth = HelperFunctions.getValidNumber(item.width);
    const safeHeight = HelperFunctions.getValidNumber(item.height);
    const safeCropX = HelperFunctions.getValidNumber(crop.x) ?? 0;
    const safeCropY = HelperFunctions.getValidNumber(crop.y) ?? 0;
    const safeCropWidth = HelperFunctions.getValidNumber(crop.width);
    const safeCropHeight = HelperFunctions.getValidNumber(crop.height);
    const safeOpacity = HelperFunctions.getValidNumber(item.opacity);
    const safeZIndex = HelperFunctions.getValidNumber(item.zIndex) ?? 0;
    const elementWidth = safeWidth ?? safeCropWidth ?? 320;
    const elementHeight = safeHeight ?? safeCropHeight ?? 180;

    const onUpdateImage = (id: string, updates: Partial<MediaFile>) => {
        dispatch(setMediaFiles(mediaFiles.map((media) =>
            media.id === id ? { ...media, ...updates } : media
        )));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;

        const container = document.querySelector('.__remotion-player') as HTMLElement;
        const rect = container?.getBoundingClientRect();
        const scaleX = rect && container?.offsetWidth ? rect.width / container.offsetWidth : 1;
        const scaleY = rect && container?.offsetHeight ? rect.height / container.offsetHeight : 1;

        const handleMouseMove = (event: MouseEvent) => {
            const diffX = event.clientX - startX;
            const diffY = event.clientY - startY;
            onUpdateImage(item.id, { x: safeX + diffX / scaleX, y: safeY + diffY / scaleY });
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleResizeMouseDown = (corner: ResizeCorner) => (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const startWidth = elementWidth;
        const startHeight = elementHeight;
        const startPosX = safeX;
        const startPosY = safeY;

        const container = document.querySelector('.__remotion-player') as HTMLElement;
        const rect = container?.getBoundingClientRect();
        const scaleX = rect && container?.offsetWidth ? rect.width / container.offsetWidth : 1;
        const scaleY = rect && container?.offsetHeight ? rect.height / container.offsetHeight : 1;

        const handleMouseMove = (event: MouseEvent) => {
            const deltaX = (event.clientX - startMouseX) / scaleX;
            const deltaY = (event.clientY - startMouseY) / scaleY;
            let nextWidth = startWidth;
            let nextHeight = startHeight;

            if (corner === "top-left" || corner === "bottom-left") {
                nextWidth = startWidth - deltaX;
            } else {
                nextWidth = startWidth + deltaX;
            }

            if (corner === "top-left" || corner === "top-right") {
                nextHeight = startHeight - deltaY;
            } else {
                nextHeight = startHeight + deltaY;
            }

            const clampedWidth = Math.max(MIN_IMAGE_SIZE, nextWidth);
            const clampedHeight = Math.max(MIN_IMAGE_SIZE, nextHeight);
            const nextX = corner === "top-left" || corner === "bottom-left"
                ? startPosX + (startWidth - clampedWidth)
                : startPosX;
            const nextY = corner === "top-left" || corner === "top-right"
                ? startPosY + (startHeight - clampedHeight)
                : startPosY;

            onUpdateImage(item.id, {
                x: nextX,
                y: nextY,
                width: clampedWidth,
                height: clampedHeight,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    return (
        <Sequence
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: "none" }}
        >
            <AbsoluteFill
                data-track-item="transition-element"
                className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
                style={{
                    pointerEvents: "auto",
                    top: safeY,
                    left: safeX,
                    width: elementWidth,
                    height: elementHeight,
                    opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                    zIndex: safeZIndex,
                    overflow: "hidden",
                    cursor: "move",
                    userSelect: "none",
                }}
                onMouseDown={handleMouseDown}
            >
                <div
                    style={{
                        width: elementWidth,
                        height: elementHeight,
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "auto",
                    }}
                    onMouseDown={handleMouseDown}
                >
                    <Img
                        style={{
                            pointerEvents: "none",
                            top: -safeCropY,
                            left: -safeCropX,
                            width: elementWidth,
                            height: elementHeight,
                            position: "absolute",
                        }}
                        data-id={item.id}
                        src={item.src || ""}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "#ffffff",
                            border: "1px solid #111827",
                            borderRadius: 2,
                            top: -5,
                            left: -5,
                            cursor: "nwse-resize",
                            zIndex: safeZIndex + 1,
                        }}
                        onMouseDown={handleResizeMouseDown("top-left")}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "#ffffff",
                            border: "1px solid #111827",
                            borderRadius: 2,
                            top: -5,
                            right: -5,
                            cursor: "nesw-resize",
                            zIndex: safeZIndex + 1,
                        }}
                        onMouseDown={handleResizeMouseDown("top-right")}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "#ffffff",
                            border: "1px solid #111827",
                            borderRadius: 2,
                            bottom: -5,
                            left: -5,
                            cursor: "nesw-resize",
                            zIndex: safeZIndex + 1,
                        }}
                        onMouseDown={handleResizeMouseDown("bottom-left")}
                    />
                    <div
                        style={{
                            position: "absolute",
                            width: 10,
                            height: 10,
                            background: "#ffffff",
                            border: "1px solid #111827",
                            borderRadius: 2,
                            bottom: -5,
                            right: -5,
                            cursor: "nwse-resize",
                            zIndex: safeZIndex + 1,
                        }}
                        onMouseDown={handleResizeMouseDown("bottom-right")}
                    />
                </div>
            </AbsoluteFill>
        </Sequence>

    );
};
