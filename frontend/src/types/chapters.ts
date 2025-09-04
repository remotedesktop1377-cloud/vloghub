export interface Chapter {
    id: string;
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
    assets?: {
        images?: string[] | null;
        imagesGoogle?: string[] | null;
        imagesEnvato?: string[] | null;
        audio?: string | null;
        video?: string | null;
    };
}

