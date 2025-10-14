export interface ScriptData {
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
}