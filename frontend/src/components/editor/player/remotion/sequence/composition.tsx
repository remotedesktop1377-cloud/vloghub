"use client";
import { useAppDispatch, useAppSelector } from "../../../../../store";
import { SequenceItem } from "./sequence-item";
import { MediaFile, TextElement } from "../../../../../types/video_editor";
import { useCurrentFrame } from 'remotion';
import { useEffect, useRef } from "react";
import { setCurrentTime } from "../../../../../store/slices/projectSlice";

const Composition = () => {
    const projectState = useAppSelector((state) => state.projectState);
    const { mediaFiles, textElements } = projectState;
    const frame = useCurrentFrame();
    const dispatch = useAppDispatch();

    const THRESHOLD = 0.1;
    const previousTime = useRef(0);
    const fps = 30;

    useEffect(() => {
        const currentTimeInSeconds = frame / fps;
        if (Math.abs(currentTimeInSeconds - previousTime.current) > THRESHOLD) {
            if (currentTimeInSeconds !== undefined) {
                previousTime.current = currentTimeInSeconds;
                dispatch(setCurrentTime(currentTimeInSeconds));
            }
        }
    }, [frame, dispatch]);

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
