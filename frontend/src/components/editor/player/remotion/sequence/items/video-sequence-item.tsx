import React, { useEffect, memo, useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, Video, getRemotionEnvironment, prefetch } from "remotion";
import { MediaFile } from "../../../../../../types/video_editor";
import { HelperFunctions } from "../../../../../../utils/helperFunctions";

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

const VideoSequenceItemComponent: React.FC<VideoSequenceItemProps> = ({ item, options }) => {
    const { fps } = options;

    const playbackRate = HelperFunctions.getValidNumber(item.playbackSpeed) ?? 1;
    
    // Memoize all frame calculations to prevent recalculation on every render
    // This is critical - Sequence component restarts video if props change
    const frameCalculations = useMemo(() => {
        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart,
                to: item.positionEnd
            },
            fps
        );
        
        const trimFrom = HelperFunctions.getValidNumber(item.startTime) ?? 0;
        const trimTo = HelperFunctions.getValidNumber(item.endTime) ?? 0;
        
        // Round to integers to prevent floating-point precision issues
        // Remotion Sequence is sensitive to prop changes
        return {
            from: Math.round(from),
            durationInFrames: Math.round(durationInFrames),
            trimFromFrames: Math.max(0, Math.round(trimFrom * fps)),
            trimToFrames: trimTo > 0 ? Math.round(trimTo * fps) + REMOTION_SAFE_FRAME : undefined,
            premountFor: Math.round(Math.min(durationInFrames, Math.max(1, Math.floor(fps))))
        };
    }, [item.positionStart, item.positionEnd, item.startTime, item.endTime, fps]);

    const safeX = HelperFunctions.getValidNumber(item.x) ?? 0;
    const safeY = HelperFunctions.getValidNumber(item.y) ?? 0;
    const safeWidth = HelperFunctions.getValidNumber(item.width);
    const safeHeight = HelperFunctions.getValidNumber(item.height);
    const safeOpacity = HelperFunctions.getValidNumber(item.opacity);
    const safeVolume = HelperFunctions.getValidNumber(item.volume);
    const { isRendering } = getRemotionEnvironment();
    const VideoComponent = isRendering ? OffthreadVideo : Video;
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
            from={frameCalculations.from}
            premountFor={frameCalculations.premountFor}
            durationInFrames={frameCalculations.durationInFrames + REMOTION_SAFE_FRAME}
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
                        startFrom={frameCalculations.trimFromFrames}  
                        endAt={frameCalculations.trimToFrames}
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

// Tolerance for floating-point comparisons to prevent unnecessary re-renders
const FLOAT_TOLERANCE = 0.0001;

// Helper function to compare floating-point numbers with tolerance
const floatEquals = (a: number | null | undefined, b: number | null | undefined): boolean => {
    if (a === b) return true;
    if (a === null || a === undefined || b === null || b === undefined) return false;
    return Math.abs(a - b) < FLOAT_TOLERANCE;
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
export const VideoSequenceItem = memo(VideoSequenceItemComponent, (prevProps, nextProps) => {
    // Custom comparison function with tolerance for floating-point values
    // This prevents re-renders due to minor floating-point precision differences
    const prev = prevProps.item;
    const next = nextProps.item;
    
    return (
        prev.id === next.id &&
        prev.src === next.src &&
        Object.is(prev.type, next.type) &&
        floatEquals(prev.positionStart, next.positionStart) &&
        floatEquals(prev.positionEnd, next.positionEnd) &&
        floatEquals(prev.startTime, next.startTime) &&
        floatEquals(prev.endTime, next.endTime) &&
        floatEquals(prev.x, next.x) &&
        floatEquals(prev.y, next.y) &&
        floatEquals(prev.width, next.width) &&
        floatEquals(prev.height, next.height) &&
        floatEquals(prev.opacity, next.opacity) &&
        prev.zIndex === next.zIndex &&
        floatEquals(prev.playbackSpeed, next.playbackSpeed) &&
        floatEquals(prev.volume, next.volume) &&
        prevProps.options.fps === nextProps.options.fps
    );
});
