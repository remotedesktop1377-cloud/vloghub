import { Settings } from "./scriptData";

export interface SceneKeywordOverlay {
    word: string;
    overlayType: 'kinetic_text' | 'lower_third' | 'headline_bold' | 'headline' | 'pop_up';
    animation: 'fade_in' | 'slide_up' | 'scale_pop' | 'none';
}

export interface SceneAiAssets {
    backgroundType?: 'ai_image' | 'stock_image' | 'video';
    cameraMotion?: 'slow_zoom' | 'pan_left' | 'parallax' | 'static' | string;
    parallax?: boolean;
    generatedBackgroundUrl?: string;
}

export interface SceneOverlayConfig {
    lowerThird?: string | null;
    subtitleStyle?: {
        position?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'center' | 'top-center';
        fontSize?: number;
        color?: string;
    };
}

export interface SceneAudioLayers {
    backgroundMusic?: string | null;
    sfx?: string[];
}

export interface SceneTransitionConfig {
    type?: 'cut' | 'crossfade' | 'cinematic_wipe' | string;
    durationFrames?: number;
}

export interface ChromaKeyConfig {
    enabled?: boolean;
    color?: string;
    similarity?: number;
    smoothness?: number;
    spill?: number;
}

export interface SceneData {
    id: string;
    jobId?: string;
    jobName?: string;
    title?: string;
    narration: string;
    duration: string;
    words: number;
    startTime: number;
    endTime: number;
    durationInSeconds: number;
    startFrame?: number;
    endFrame?: number;
    durationInFrames?: number;
    emotionalTone?: string;
    overlayStyleSuggestion?: string;
    backgroundPrompt?: string;
    cameraMotion?: string;
    transitionSuggestion?: string;
    highlightedKeywordOverlays?: SceneKeywordOverlay[];
    narration_type?: 'interview' | 'narration';
    voiceover_style?: string;
    visual_guidance?: string;
    on_screen_text?: string;
    gammaGenId?: string;
    gammaUrl?: string;
    highlightedKeywords?: string[];
    gammaPreviewImage?: string;    
    previewClip?: string;
    localPath?: string;
    aiAssets?: SceneAiAssets;
    overlays?: SceneOverlayConfig;
    audioLayers?: SceneAudioLayers;
    transition?: SceneTransitionConfig;
    generatedBackgroundUrl?: string;
    chromaUrl?: string;
    chromaKeyConfig?: ChromaKeyConfig;
    keywordsSelected?: SceneKeywordSelection[] | Record<string, string[]>;
    assets?: {
        images?: string[] | null;
        clips?: VideoClip[] | null;
    };
    sceneSettings?: Settings,
}

export interface TextOverlay {
    text: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    position?: 'top-left' | 'top-center' | 'top-right' | 'top-second-left' | 'top-second-center' | 'top-second-right' | 'center-left' | 'center' | 'center-right' | 'lower-third-left' | 'lower-third-center' | 'lower-third-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'custom';
    customPosition?: {
        x: number;
        y: number;
        usePercentage?: boolean;
    };
    duration?: number;
    startTime?: number;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    padding?: number;
    borderRadius?: number;
    animationType?: 'fade-in' | 'fade-out' | 'slide-in' | 'scale' | 'slide-fade' | 'bounce' | 'none';
    animationTypes?: ('fade-in' | 'fade-out' | 'slide-in' | 'scale' | 'slide-fade' | 'bounce')[];
    animationDuration?: number;
}

export interface SceneKeywordSelection {
    suggestedKeyword: string;
    modifiedKeyword?: string;
    media?: {
        lowResMedia?: string;
        highResMedia?: string;
    };
    backgroundMusic?: string;
    transitionsEffects?: string[];
    textOverlay?: TextOverlay;
}

export interface VideoClip {
    id: string;
    name: string;
    url: string;
    duration: number;
    thumbnail?: string;
}

export interface LogoOverlay {
    id: string;
    name: string;
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface BackgroundMusic {
    id: string;
    selectedMusic: string;
    volume: number;
    autoAdjust: boolean;
    fadeIn: boolean;
    fadeOut: boolean;
}

