"use client";
import { useAppDispatch, useAppSelector } from "../../../../../store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement } from "../../../../../types/video_editor";
import { useCurrentFrame } from 'remotion';
import { useEffect, useRef, useMemo, memo } from "react";
import { setCurrentTime } from "../../../../../store/slices/projectSlice";

const Composition = () => {
    const mediaFiles = useAppSelector((state) => state.projectState.mediaFiles);
    const textElements = useAppSelector((state) => state.projectState.textElements);
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    // Completely stop Redux updates during playback to prevent feedback loop
    // Redux updates cause re-renders that restart Remotion videos
    // Timeline cursor will be updated separately by reading from Player ref
    const lastDispatchedTime = useRef(0);
    const fps = 30;

    useEffect(() => {
        // Only update Redux currentTime when paused (user seeking)
        // During playback, we completely skip Redux updates to prevent video restarts
        if (isPlaying) {
            // Do nothing during playback - let Remotion handle playback internally
            return;
        }

        // When paused, update Redux for user seeking operations
        const currentTimeInSeconds = frame / fps;
        if (!Number.isFinite(currentTimeInSeconds)) {
            return;
        }
        
        // Only dispatch if time changed significantly (avoid unnecessary updates)
        const dispatchDelta = Math.abs(currentTimeInSeconds - lastDispatchedTime.current);
        if (dispatchDelta > 0.01) { // 10ms threshold for paused state
            lastDispatchedTime.current = currentTimeInSeconds;
            dispatch(setCurrentTime(currentTimeInSeconds));
        }
    }, [frame, dispatch, isPlaying]);

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

    return (
        <>
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
