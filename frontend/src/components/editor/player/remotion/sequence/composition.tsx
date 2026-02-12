"use client";
import { useAppDispatch, useAppSelector } from "../../../../../store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement } from "../../../../../types/video_editor";
import { useCurrentFrame } from 'remotion';
import { useEffect, useRef } from "react";
import { setCurrentTime } from "../../../../../store/slices/projectSlice";

const Composition = () => {
    const mediaFiles = useAppSelector((state) => state.projectState.mediaFiles);
    const textElements = useAppSelector((state) => state.projectState.textElements);
    const isPlaying = useAppSelector((state) => state.projectState.isPlaying);
    const currentTime = useAppSelector((state) => state.projectState.currentTime);
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    const THRESHOLD = 0.1;
    const previousTime = useRef(0);
    const fps = 30;

    useEffect(() => {
        const currentTimeInSeconds = frame / fps;
        if (!Number.isFinite(currentTimeInSeconds)) {
            return;
        }
        if (!isPlaying) {
            previousTime.current = currentTimeInSeconds;
            return;
        }

        const frameDelta = Math.abs(currentTimeInSeconds - previousTime.current);
        const storeDelta = Math.abs(currentTimeInSeconds - currentTime);
        if (frameDelta > THRESHOLD && storeDelta > THRESHOLD) {
            previousTime.current = currentTimeInSeconds;
            dispatch(setCurrentTime(currentTimeInSeconds));
        }
    }, [frame, dispatch, isPlaying, currentTime]);

    return (
        <>
            {mediaFiles
                .map((item: MediaFile) => {
                    if (!item) return;
                    const trackItem = {
                        ...item,
                    } as MediaFile;
                    return SequenceItem[trackItem.type](trackItem, {
                        fps
                    });
                })}
            {textElements
                .map((item: TextElement) => {
                    if (!item) return;
                    const trackItem = {
                        ...item,
                    } as TextElement;
                    return SequenceItem["text"](trackItem, {
                        fps
                    });
                })}
        </>
    );
};

export default Composition;
