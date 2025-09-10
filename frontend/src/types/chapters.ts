export interface Chapter {
    id: string;
    title?: string;
    narration: string;
    duration: string;
    words: number;
    startTime: number;
    endTime: number;
    durationInSeconds: number;
    narrationType?: 'interview' | 'narration';
    voiceover_style?: string;
    visual_guidance?: string;
    on_screen_text?: string;
    highlightedKeywords?: string[];
    // Map from keyword (key) to selected media URLs (value array)
    keywordsSelected?: Record<string, string[]>;
    assets?: {
        images?: string[] | null;
        imagesGoogle?: string[] | null;
        imagesEnvato?: string[] | null;
        audio?: string | null;
        video?: string | null;
        backgroundMusic?: BackgroundMusic | undefined;
    };
    // Video effects and editing properties
    videoEffects?: {
        clips?: VideoClip[];
        logos?: LogoOverlay[];
        backgroundMusic?: BackgroundMusic;
        transition?: string;
        effects?: string[];
    };
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

