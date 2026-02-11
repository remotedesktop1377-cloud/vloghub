import { Settings } from "./scriptData";

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
    // Selected media for keywords; supports new array format and legacy map
    keywordsSelected?: SceneKeywordSelection[] | Record<string, string[]>;
    assets?: {
        images?: string[] | null;
        clips?: VideoClip[] | null;
    };
    // Video effects and editing properties
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
    animationType?: 'fade-in' | 'fade-out' | 'slide-in' | 'scale' | 'slide-fade' | 'bounce' | 'none'; // Legacy: single animation (for backward compatibility)
    animationTypes?: ('fade-in' | 'fade-out' | 'slide-in' | 'scale' | 'slide-fade' | 'bounce')[]; // New: multiple animations array
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

