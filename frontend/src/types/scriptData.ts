import { Chapter } from "./chapters";
import { BackgroundType } from "./backgroundType";

export interface ScriptData {
    jobId?: string;
    title: string;
    topic: string;
    description: string;
    hypothesis: string;
    region: string;
    duration: string;
    language: string;
    subtitle_language: string;
    narration_type: string; // "interview" | "narration";
    estimated_words: number;
    hook: string;
    main_content: string;
    conclusion: string;
    call_to_action: string;
    script: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
    narrator_chroma_key_link: string;
    transcription: string;
    videoBackground: BackgroundType;
    chapters?: Chapter[];
    scenes?: Array<{
        id: string;
        text: string;
        duration: string;
        words: number;
        startTime: number;
        endTime: number;
        durationInSeconds: number;
    }>;
}