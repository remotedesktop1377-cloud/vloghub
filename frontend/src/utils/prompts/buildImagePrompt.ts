// utils/buildImagePrompt.ts
export function buildImagePrompt({
    title,
    chapterIdx,
    visual_guidance,
    on_screen_text
  }: {
    title: string;
    chapterIdx: number;
    visual_guidance: string;
    on_screen_text?: string;
  }) {
    return [
      `High-quality thumbnail frame for a ${title} short.`,
      `Scene ${chapterIdx + 1}: ${visual_guidance}.`,
      `Cinematic, 16:9, crisp details, realistic lighting, broadcast quality.`,
      `No text overlay baked into the image. (Text will be added in edit)`,
    ].join(" ");
  }
  