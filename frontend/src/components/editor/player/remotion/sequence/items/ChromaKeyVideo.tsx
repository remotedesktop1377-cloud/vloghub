import React, { useCallback, useRef } from "react";
import { AbsoluteFill, OffthreadVideo, useVideoConfig } from "remotion";

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const m = hex.replace(/^#/, "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return { r: 0, g: 255, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
};

export interface ChromaKeyConfig {
  color?: string;
  similarity?: number;
  smoothness?: number;
  spill?: number;
}

export interface ChromaKeyVideoProps {
  src: string;
  width: number | undefined;
  height: number | undefined;
  config: ChromaKeyConfig;
  trimFromFrames: number;
  trimToFrames: number | undefined;
  playbackRate: number;
  volume: number;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({
  src,
  width,
  height,
  config,
  trimFromFrames,
  trimToFrames,
  playbackRate,
  volume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: configWidth, height: configHeight } = useVideoConfig();
  const w = typeof width === "number" ? Math.min(width, configWidth) : configWidth;
  const h = typeof height === "number" ? Math.min(height, configHeight) : configHeight;

  const keyColor = hexToRgb(config.color || "#00FF00");
  // Use stronger defaults/floors for green-screen clips to avoid residual green wash in preview.
  const similarity = Math.max(0.45, Math.min(1, config.similarity ?? 0.55));
  const smoothness = Math.max(0.03, Math.min(0.5, config.smoothness ?? 0.1));
  const spill = Math.max(0, Math.min(1, config.spill ?? 0.08));

  const onVideoFrame = useCallback(
    (frame: CanvasImageSource) => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(frame, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const { data } = imageData;
      const len = data.length;

      const k0 = keyColor.r / 255;
      const k1 = keyColor.g / 255;
      const k2 = keyColor.b / 255;

      for (let i = 0; i < len; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        const dr = r - k0;
        const dg = g - k1;
        const db = b - k2;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
        const greenDominance = g - Math.max(r, b);

        let alpha = 1;
        const withinKeyDistance = dist < similarity + smoothness;
        const stronglyGreen = greenDominance > 0.05;

        if (withinKeyDistance && stronglyGreen) {
          if (dist <= similarity) {
            alpha = 0;
          } else {
            alpha = (dist - similarity) / smoothness;
          }
        }

        data[i + 3] = Math.round(alpha * 255);

        if (alpha > 0 && alpha < 1 && spill > 0) {
          // Despill only the green channel near keyed edges to reduce neon halo/flicker.
          const despilledGreen = Math.max(Math.max(r, b), g - (1 - alpha) * spill);
          data[i] = Math.round(255 * r);
          data[i + 1] = Math.round(255 * despilledGreen);
          data[i + 2] = Math.round(255 * b);
        }
      }
      ctx.putImageData(imageData, 0, 0);
    },
    [w, h, keyColor.r, keyColor.g, keyColor.b, similarity, smoothness, spill]
  );

  return (
    <AbsoluteFill style={{ width: w, height: h }}>
      <AbsoluteFill style={{ opacity: 0 }}>
        <OffthreadVideo
          startFrom={trimFromFrames}
          endAt={trimToFrames}
          playbackRate={playbackRate}
          src={src}
          volume={volume}
          onVideoFrame={onVideoFrame}
          style={{ width: w, height: h }}
        />
      </AbsoluteFill>
      <canvas ref={canvasRef} width={w} height={h} style={{ width: w, height: h, display: "block" }} />
    </AbsoluteFill>
  );
};
