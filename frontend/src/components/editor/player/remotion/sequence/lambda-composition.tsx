import React from 'react';
import { SequenceItem } from './sequence-item';
import { MediaFile, TextElement } from '../../../../../types/video_editor';

export interface LambdaCompositionProps {
  mediaFiles?: MediaFile[];
  textElements?: TextElement[];
  fps?: number;
}

export const LambdaComposition: React.FC<LambdaCompositionProps> = ({
  mediaFiles = [],
  textElements = [],
  fps = 30,
}) => {
  return (
    <>
      {mediaFiles.map((item: MediaFile) => {
        if (!item) return null;
        const trackItem = {
          ...item,
        } as MediaFile;
        return SequenceItem[trackItem.type](trackItem, {
          fps,
        });
      })}
      {textElements.map((item: TextElement) => {
        if (!item) return null;
        const trackItem = {
          ...item,
        } as TextElement;
        return SequenceItem['text'](trackItem, {
          fps,
        });
      })}
    </>
  );
};
