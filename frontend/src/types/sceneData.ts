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
    // Selected media for keywords; supports new array format and legacy map
    keywordsSelected?: SceneKeywordSelection[] | Record<string, string[]>;
    assets?: {
        images?: string[] | null;
        imagesGoogle?: string[] | null;
        imagesEnvato?: string[] | null;
    };
    // Video effects and editing properties
    videoEffects?: {
        clips?: VideoClip[];
        logos?: LogoOverlay[];
        backgroundMusic?: BackgroundMusic[]; // array
        transition?: string;
        transitionEffects?: string[];
    };
}

export interface SceneKeywordSelection {
    suggestedKeyword: string; // highlighted keyword
    modifiedKeyword?: string; // user-changed search term
    media?: {
        lowResMedia?: string;
        highResMedia?: string;
    };
    backgroundMusic?: string;
    transitionsEffects?: string[];
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

