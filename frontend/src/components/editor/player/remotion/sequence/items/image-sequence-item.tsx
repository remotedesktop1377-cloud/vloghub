import React from "react";
import { AbsoluteFill, Img, Sequence } from "remotion";
import { MediaFile } from "@/types/video_editor";
import { HelperFunctions } from "@/utils/helperFunctions";

const REMOTION_SAFE_FRAME = 0;

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

export const ImageSequenceItem: React.FC<ImageSequenceItemProps> = ({ item, options }) => {
    const { fps } = options;

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
                    width: safeCropWidth ?? "100%",
                    height: safeCropHeight ?? "auto",
                    // transform: item?.transform || "none",
                    opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        width: safeWidth ?? "100%",
                        height: safeHeight ?? "auto",
                        position: "relative",
                        overflow: "hidden",
                        pointerEvents: "none",
                    }}
                >
                    <Img
                        style={{
                            pointerEvents: "none",
                            top: -safeCropY,
                            left: -safeCropX,
                            width: safeWidth ?? "100%",
                            height: safeHeight ?? "auto",
                            position: "absolute",
                            zIndex: item.zIndex || 0,
                        }}
                        data-id={item.id}
                        src={item.src || ""}
                    />
                </div>
            </AbsoluteFill>
        </Sequence>
    );
};
