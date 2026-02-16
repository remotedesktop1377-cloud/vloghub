import React from 'react';
import { registerRoot, Composition, Sequence, AbsoluteFill, OffthreadVideo, Video, Audio, Img, getRemotionEnvironment } from 'remotion';

type MediaType = 'video' | 'audio' | 'image' | 'unknown';

interface MediaFile {
  id: string;
  fileName: string;
  fileId: string;
  type: MediaType;
  startTime: number;
  src?: string;
  endTime: number;
  positionStart: number;
  positionEnd: number;
  includeInMerge: boolean;
  playbackSpeed: number;
  volume: number;
  zIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  crop?: { x: number; y: number; width: number; height: number };
}

interface TextElement {
  id: string;
  text: string;
  includeInMerge?: boolean;
  positionStart: number;
  positionEnd: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  font?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  align?: 'left' | 'center' | 'right';
  zIndex?: number;
  opacity?: number;
  rotation?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  animation?: 'slide-in' | 'zoom' | 'bounce' | 'none';
  visible?: boolean;
}

interface LambdaCompositionProps {
  mediaFiles?: MediaFile[];
  textElements?: TextElement[];
  fps?: number;
}

const REMOTION_SAFE_FRAME = 0;

const getValidNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? null : num;
};

const calculateFrames = (display: { from: number; to: number }, fps: number) => {
  const from = display.from * fps;
  const to = display.to * fps;
  const durationInFrames = Math.max(1, to - from);
  return { from, durationInFrames };
};

const LambdaComposition: React.FC<LambdaCompositionProps> = ({
  mediaFiles = [],
  textElements = [],
  fps = 30,
}) => {
  const { isRendering } = getRemotionEnvironment();
  const VideoComponent = isRendering ? OffthreadVideo : Video;

  return (
    <>
      {mediaFiles.map((item: MediaFile) => {
        if (!item || !item.src) return null;
        
        const playbackRate = getValidNumber(item.playbackSpeed) ?? 1;
        const { from, durationInFrames } = calculateFrames(
          { from: item.positionStart ?? 0, to: item.positionEnd ?? 0 },
          fps
        );
        
        const trimFrom = getValidNumber(item.startTime) ?? 0;
        const trimTo = getValidNumber(item.endTime) ?? 0;
        const safeX = getValidNumber(item.x) ?? 0;
        const safeY = getValidNumber(item.y) ?? 0;
        const safeWidth = getValidNumber(item.width);
        const safeHeight = getValidNumber(item.height);
        const safeOpacity = getValidNumber(item.opacity);
        const safeVolume = getValidNumber(item.volume);
        
        if (item.type === 'video') {
          const trimFromFrames = Math.max(0, Math.floor(trimFrom * fps));
          const trimToFrames = trimTo > 0 ? Math.floor(trimTo * fps) + REMOTION_SAFE_FRAME : undefined;
          
          return (
            <Sequence
              key={item.id}
              from={from}
              durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
              style={{ pointerEvents: 'none' }}
            >
              <AbsoluteFill
                style={{
                  top: safeY,
                  left: safeX,
                  width: safeWidth ?? '100%',
                  height: safeHeight ?? 'auto',
                  opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                  zIndex: item.zIndex ?? 0,
                }}
              >
                <VideoComponent
                  startFrom={trimFromFrames}
                  endAt={trimToFrames}
                  playbackRate={playbackRate}
                  src={item.src}
                  volume={safeVolume !== null && safeVolume !== undefined ? safeVolume / 100 : 1}
                  style={{
                    width: safeWidth ?? '100%',
                    height: safeHeight ?? 'auto',
                  }}
                />
              </AbsoluteFill>
            </Sequence>
          );
        }
        
        if (item.type === 'audio') {
          const trim = {
            from: (item.startTime ?? 0) / playbackRate,
            to: (item.endTime ?? 0) / playbackRate,
          };
          
          return (
            <Sequence
              key={item.id}
              from={from}
              durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
              style={{ pointerEvents: 'none' }}
            >
              <AbsoluteFill>
                <Audio
                  startFrom={trim.from * fps}
                  endAt={trim.to * fps + REMOTION_SAFE_FRAME}
                  playbackRate={playbackRate}
                  src={item.src}
                  volume={(safeVolume !== null ? safeVolume : 100) / 100}
                />
              </AbsoluteFill>
            </Sequence>
          );
        }
        
        if (item.type === 'image') {
          return (
            <Sequence
              key={item.id}
              from={from}
              durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
              style={{ pointerEvents: 'none' }}
            >
              <AbsoluteFill
                style={{
                  top: safeY,
                  left: safeX,
                  width: safeWidth ?? '100%',
                  height: safeHeight ?? 'auto',
                  opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                  zIndex: item.zIndex ?? 0,
                }}
              >
                <Img
                  src={item.src}
                  style={{
                    width: safeWidth ?? '100%',
                    height: safeHeight ?? 'auto',
                    objectFit: 'contain',
                  }}
                />
              </AbsoluteFill>
            </Sequence>
          );
        }
        
        return null;
      })}
      
      {textElements.map((item: TextElement) => {
        if (!item) return null;
        
        const { from, durationInFrames } = calculateFrames(
          { from: item.positionStart ?? 0, to: item.positionEnd ?? 0 },
          fps
        );
        
        const safeWidth = getValidNumber(item.width) ?? 3000;
        const safeHeight = getValidNumber(item.height) ?? 400;
        const safeX = getValidNumber(item.x) ?? 0;
        const safeY = getValidNumber(item.y) ?? 0;
        const safeFontSize = getValidNumber(item.fontSize);
        const safeOpacity = getValidNumber(item.opacity);
        
        return (
          <Sequence
            key={item.id}
            from={from}
            durationInFrames={durationInFrames + REMOTION_SAFE_FRAME}
            style={{ pointerEvents: 'none' }}
          >
            <AbsoluteFill
              style={{
                position: 'absolute',
                width: safeWidth,
                height: safeHeight,
                fontSize: safeFontSize ? `${safeFontSize}px` : '16px',
                top: safeY,
                left: safeX,
                color: item.color || '#000000',
                backgroundColor: item.backgroundColor || 'transparent',
                opacity: safeOpacity !== null ? safeOpacity / 100 : 1,
                fontFamily: item.font || 'Arial',
                zIndex: 1000,
              }}
            >
              <div
                dangerouslySetInnerHTML={{ __html: item.text || '' }}
                style={{
                  height: '100%',
                  width: '100%',
                }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

registerRoot(() => {
  return (
    <>
      <Composition
        id="VloghubVideo"
        component={LambdaComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          mediaFiles: [],
          textElements: [],
          fps: 30,
        }}
      />
    </>
  );
});
