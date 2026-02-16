import { AbsoluteFill, OffthreadVideo, Audio, Img, Sequence } from "remotion";
import { MediaFile, TextElement } from "../../../../../types/video_editor";
import { setTextElements } from "../../../../../store/slices/projectSlice";
import { useAppDispatch, useAppSelector } from "../../../../../store";
import React from "react";
import { TextSequenceItem } from "./items/text-sequence-item";
import { AudioSequenceItem } from "./items/audio-sequence-item";
import { VideoSequenceItem } from "./items/video-sequence-item";
import { ImageSequenceItem } from "./items/image-sequence-item";

interface SequenceItemOptions {
    handleTextChange?: (id: string, text: string) => void;
    fps: number;
    editableTextId?: string | null;
    currentTime?: number;
}

export const SequenceItem: Record<
    string,
    (item: any, options: SequenceItemOptions) => JSX.Element> = {
    video: (item: MediaFile, options: SequenceItemOptions) => {
        // Key is required here for React's list rendering
        // The Sequence component inside also has a key for Remotion's internal use
        return <VideoSequenceItem key={item.id} item={item} options={options} />;
    },
    text: (item: TextElement, options: SequenceItemOptions) => {
        // Key is required here for React's list rendering
        // The Sequence component inside also has a key for Remotion's internal use
        return <TextSequenceItem key={item.id} item={item} options={options} />;
    },
    image: (item: MediaFile, options: SequenceItemOptions) => {
        // Key is required here for React's list rendering
        // The Sequence component inside also has a key for Remotion's internal use
        return <ImageSequenceItem key={item.id} item={item} options={options} />;
    },
    audio: (item: MediaFile, options: SequenceItemOptions) => {
        // Key is required here for React's list rendering
        // The Sequence component inside also has a key for Remotion's internal use
        return <AudioSequenceItem key={item.id} item={item} options={options} />;
    }
};