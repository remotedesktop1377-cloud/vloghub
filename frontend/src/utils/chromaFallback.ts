import { BackgroundClip, MediaFile, ProjectState } from "../types/video_editor";

export type ChromaConfig = NonNullable<MediaFile["chromaKeyConfig"]>;

export const DEFAULT_CHROMA_CONFIG: Required<ChromaConfig> = {
    enabled: true,
    color: "#00FF00",
    similarity: 0.55,
    smoothness: 0.1,
    spill: 0.08,
};

export const isPrimarySceneVideo = (item: Pick<MediaFile, "isPrimarySceneVideo" | "fileName">): boolean => {
    return item.isPrimarySceneVideo === true || /^Video-\d+-1$/.test(item.fileName || "");
};

export const hasRenderableBackground = (
    backgroundClips: BackgroundClip[] = [],
    selectedBackgroundMedia?: ProjectState["selectedBackgroundMedia"]
): boolean => {
    const hasTimelineBackground = backgroundClips.some((clip) => clip.type === "color" || Boolean(clip.src));
    const hasLegacyBackground = Boolean(selectedBackgroundMedia?.src || selectedBackgroundMedia?.color);
    return hasTimelineBackground || hasLegacyBackground;
};

export const getEffectiveChromaConfig = (
    item: MediaFile,
    options: {
        hasBackground: boolean;
    }
): Required<ChromaConfig> | undefined => {
    const explicitConfig = item.chromaKeyConfig;
    const hasExplicitChromaConfig = Boolean(explicitConfig && explicitConfig.enabled !== false);
    const shouldApplyFallback = !hasExplicitChromaConfig && options.hasBackground && isPrimarySceneVideo(item);

    if (!hasExplicitChromaConfig && !shouldApplyFallback) {
        return undefined;
    }

    return {
        ...DEFAULT_CHROMA_CONFIG,
        ...(hasExplicitChromaConfig ? explicitConfig : {}),
    };
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

/**
 * Map preview chroma params to FFmpeg `chromakey` filter params.
 *
 * Preview uses custom canvas RGB-distance + green-dominance logic.
 * FFmpeg `chromakey` works in YUV chrominance space with a 0-1 similarity
 * scale where 0.01 is very tight and 1.0 matches everything.
 *
 * Preview default similarity=0.55 is an RGB-distance ratio — passing it raw
 * to FFmpeg removes the entire narrator.  We remap to 0.15-0.35 range which
 * removes typical green-screen while preserving foreground pixels.
 */
export const getFfmpegChromaParams = (config: Required<ChromaConfig>) => {
    const srcSim = clamp(config.similarity ?? DEFAULT_CHROMA_CONFIG.similarity, 0, 1);
    const srcSmooth = clamp(config.smoothness ?? DEFAULT_CHROMA_CONFIG.smoothness, 0, 1);

    const similarity = clamp(0.10 + srcSim * 0.30, 0.10, 0.40);
    const blend = clamp(0.02 + srcSmooth * 0.50, 0.02, 0.25);

    return {
        colorHex: (config.color || DEFAULT_CHROMA_CONFIG.color).replace("#", "0x"),
        similarity,
        blend,
    };
};

