"use client";
import { useAppDispatch, useAppSelector } from "../../../../../store";
import { SequenceItem } from "./sequence-item";
import { BackgroundClip, MediaFile, TextElement } from "../../../../../types/video_editor";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, Video, getRemotionEnvironment, useCurrentFrame } from "remotion";
import { useEffect, useRef, useMemo, memo } from "react";
import { setCurrentTime } from "../../../../../store/slices/projectSlice";

const sanitizeMediaSrc = (src?: string): string | undefined => {
    if (!src) return src;
    const hashIndex = src.indexOf("#");
    if (hashIndex === -1) return src;
    return src.slice(0, hashIndex);
};

const Composition = () => {
    const mediaFiles = useAppSelector((state) => state.projectState.mediaFiles);
    const textElements = useAppSelector((state) => state.projectState.textElements);
    const backgroundClips = useAppSelector((state) => state.projectState.backgroundClips);
    const selectedBackgroundMedia = useAppSelector((state) => state.projectState.selectedBackgroundMedia);
    const duration = useAppSelector((state) => state.projectState.duration);
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    // Completely stop Redux updates during playback to prevent feedback loop
    // Redux updates cause re-renders that restart Remotion videos
    // Timeline cursor will be updated separately by reading from Player ref
    const lastDispatchedTime = useRef(0);
    const fps = 30;
    const { isRendering } = getRemotionEnvironment();
    const BackgroundVideoComponent = isRendering ? OffthreadVideo : Video;

    useEffect(() => {
        if (isPlaying) return;

        const currentTimeInSeconds = frame / fps;
        if (!Number.isFinite(currentTimeInSeconds)) return;

        if (Math.abs(currentTimeInSeconds - lastDispatchedTime.current) > 0.01) {
            lastDispatchedTime.current = currentTimeInSeconds;
            dispatch(setCurrentTime(currentTimeInSeconds));
        }
    }, [frame, dispatch, fps, isPlaying]);

    // Memoize media files rendering to prevent unnecessary re-renders
    // The Redux store now prevents unnecessary array reference changes, so this is stable
    const mediaItems = useMemo(() => {
        return mediaFiles
            .filter((item: MediaFile) => item != null)
            .map((item: MediaFile) => {
                return SequenceItem[item.type](item, {
                    fps
                });
            });
    }, [mediaFiles, fps]);

    // Memoize text elements rendering to prevent unnecessary re-renders
    // The Redux store now prevents unnecessary array reference changes, so this is stable
    const textItems = useMemo(() => {
        return textElements
            .filter((item: TextElement) => item != null)
            .map((item: TextElement) => {
                return SequenceItem["text"](item, {
                    fps
                });
            });
    }, [textElements, fps]);

    const effectiveBackgroundClips = useMemo<BackgroundClip[]>(() => {
        if (backgroundClips.length > 0) {
            return [...backgroundClips].sort((a, b) => a.positionStart - b.positionStart);
        }
        if (!selectedBackgroundMedia || (!selectedBackgroundMedia.src && !selectedBackgroundMedia.color)) {
            return [];
        }
        return [{
            id: `legacy-bg-${selectedBackgroundMedia.src || selectedBackgroundMedia.color || "clip"}`,
            type: selectedBackgroundMedia.type,
            src: selectedBackgroundMedia.src,
            color: selectedBackgroundMedia.color,
            name: selectedBackgroundMedia.name,
            positionStart: 0,
            positionEnd: Math.max(0.1, duration),
        }];
    }, [backgroundClips, selectedBackgroundMedia, duration]);

    const backgroundLayers = useMemo(() => {
        return effectiveBackgroundClips.map((clip) => {
            const from = Math.max(0, Math.round(clip.positionStart * fps));
            const clipDuration = Math.max(1, Math.round((clip.positionEnd - clip.positionStart) * fps));

            if (clip.type === "color") {
                return (
                    <Sequence key={clip.id} from={from} durationInFrames={clipDuration}>
                        <AbsoluteFill style={{ backgroundColor: clip.color || "#000000", zIndex: 0 }} />
                    </Sequence>
                );
            }

            if (clip.type === "image" && clip.src) {
                const safeSrc = sanitizeMediaSrc(clip.src);
                if (!safeSrc) return null;
                return (
                    <Sequence key={clip.id} from={from} durationInFrames={clipDuration}>
                        <AbsoluteFill style={{ zIndex: 0 }}>
                            <Img
                                src={safeSrc}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </AbsoluteFill>
                    </Sequence>
                );
            }

            if (clip.type === "video" && clip.src) {
                const safeSrc = sanitizeMediaSrc(clip.src);
                if (!safeSrc) return null;
                return (
                    <Sequence key={clip.id} from={from} durationInFrames={clipDuration}>
                        <AbsoluteFill style={{ zIndex: 0 }}>
                            <BackgroundVideoComponent
                                src={safeSrc}
                                loop
                                muted
                                volume={0}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        </AbsoluteFill>
                    </Sequence>
                );
            }
            return null;
        });
    }, [effectiveBackgroundClips, fps, BackgroundVideoComponent]);

    return (
        <>
            {backgroundLayers}
            {mediaItems}
            {textItems}
        </>
    );
};

// Custom comparison function for Composition memoization
// Compares array lengths and item IDs instead of array references
const compositionPropsAreEqual = (prevProps: {}, nextProps: {}) => {
    // Composition doesn't take props, so this will always return true
    // The real memoization happens in the useMemo hooks inside
    return true;
};

export default memo(Composition, compositionPropsAreEqual);
