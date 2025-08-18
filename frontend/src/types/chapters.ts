export interface Chapter {
    id: string;
    time_range: string;
    narration: string;
    voiceover_style: string;
    visual_guidance: string;
    on_screen_text: string;
    duration: string;
    assets?: {
        image?: string | null;
        audio?: string | null;
        video?: string | null;
    };
}