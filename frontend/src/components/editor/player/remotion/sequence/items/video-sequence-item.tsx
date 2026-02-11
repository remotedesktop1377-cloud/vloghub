import React, { useEffect } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, Video, getRemotionEnvironment, prefetch } from "remotion";
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

interface VideoSequenceItemProps {
    item: MediaFile;
    options: SequenceItemOptions;
}

export const VideoSequenceItem: React.FC<VideoSequenceItemProps> = ({ item, options }) => {
    const { fps } = options;

    const playbackRate = HelperFunctions.getValidNumber(item.playbackSpeed) ?? 1;
    const { from, durationInFrames } = calculateFrames(
        {
            from: item.positionStart,
            to: item.positionEnd
        },
        fps
    );

    const trimFrom = HelperFunctions.getValidNumber(item.startTime) ?? 0;
    const trimTo = HelperFunctions.getValidNumber(item.endTime) ?? 0;
    const safeX = HelperFunctions.getValidNumber(item.x) ?? 0;
    const safeY = HelperFunctions.getValidNumber(item.y) ?? 0;
    const safeWidth = HelperFunctions.getValidNumber(item.width);
    const safeHeight = HelperFunctions.getValidNumber(item.height);
    const safeOpacity = HelperFunctions.getValidNumber(item.opacity);
    const safeVolume = HelperFunctions.getValidNumber(item.volume);
    const { isRendering } = getRemotionEnvironment();
    const VideoComponent = isRendering ? OffthreadVideo : Video;
    const trimFromFrames = Math.max(0, Math.floor(trimFrom * fps));
    const trimToFrames = trimTo > 0 ? Math.floor(trimTo * fps) + REMOTION_SAFE_FRAME : undefined;
    const premountFor = Math.min(durationInFrames, Math.max(1, Math.floor(fps)));
    const src = item.src || "";

    useEffect(() => {
        if (!src) return;
        const { free, waitUntilDone } = prefetch(src);
        waitUntilDone().catch(() => undefined);
        return () => {
            free();
        };
    }, [src]);

    return (
        <Sequence
            key={item.id}
            from={from}
            premountFor={premountFor}
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
                    width: safeWidth ?? "100%",
                    height: safeHeight ?? "auto",
                    transform: "none",
                    zIndex: item.zIndex,
                    opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                    borderRadius: `10px`, // Default border radius
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
                    <VideoComponent
                        startFrom={trimFromFrames}  
                        endAt={trimToFrames}
                        playbackRate={playbackRate}
                        src={src}
                        pauseWhenBuffering
                        volume={safeVolume !== null && safeVolume !== undefined ? safeVolume / 100 : 1}
                        style={{
                            pointerEvents: "none",
                            top: 0,
                            left: 0,
                            width: safeWidth ?? "100%",
                            height: safeHeight ?? "auto",
                            position: "absolute"
                        }}
                    />
                </div>
            </AbsoluteFill>
        </Sequence>
    );
};
