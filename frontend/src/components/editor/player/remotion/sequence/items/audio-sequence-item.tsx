import { MediaFile } from "@/types/video_editor";
import { AbsoluteFill, Sequence } from "remotion";
import { Audio } from "remotion";
import { memo } from "react";

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

const AudioSequenceItemComponent: React.FC<{ item: MediaFile; options: SequenceItemOptions }> = ({ item, options }) => {
        const { fps } = options;
        const playbackRate = item.playbackSpeed || 1;
        const { from, durationInFrames } = calculateFrames(
            {
                from: item.positionStart / playbackRate,
                to: item.positionEnd / playbackRate
            },
            fps
        );

        const trim = {
            from: (item.startTime) / playbackRate,
            to: (item.endTime) / playbackRate
        };
        return (
            <Sequence
                key={item.id}
                from={from}
                durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
                style={{
                    userSelect: "none",
                    pointerEvents: "none"
                }}
            >
                <AbsoluteFill>
                    <Audio
                        startFrom={(trim.from) * fps}
                        endAt={(trim.to) * fps + REMOTION_SAFE_FRAME}
                        playbackRate={playbackRate}
                        src={item.src || ""}
                        volume={item.volume / 100 || 100}
                    />
                </AbsoluteFill>
            </Sequence>
        );
    };

// Memoize component to prevent unnecessary re-renders
export const AudioSequenceItem = memo(AudioSequenceItemComponent, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.src === nextProps.item.src &&
        prevProps.item.positionStart === nextProps.item.positionStart &&
        prevProps.item.positionEnd === nextProps.item.positionEnd &&
        prevProps.item.startTime === nextProps.item.startTime &&
        prevProps.item.endTime === nextProps.item.endTime &&
        prevProps.item.playbackSpeed === nextProps.item.playbackSpeed &&
        prevProps.item.volume === nextProps.item.volume &&
        prevProps.options.fps === nextProps.options.fps
    );
});
