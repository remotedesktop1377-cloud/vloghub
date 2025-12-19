import { SceneData } from "./sceneData";
import { BackgroundType } from "./backgroundType";

export interface ScriptData {
    projectId?: string;
    userId?: string;
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
    videoBackground: BackgroundType | null;
    isScriptDownloaded?: boolean;
    gammaGenId?: string;
    gammaExportUrl?: string;
    videoDuration?: number;
    videoThumbnailUrl?: string;
    projectSettings?: Settings,
    scenesData?: SceneData[];
}

export interface Settings {
    videoLogo: LogoOverlayInterface;
    videoBackgroundMusic: SettingItemInterface;
    videoBackgroundVideo: SettingItemInterface;
    videoTransitionEffect: SettingItemInterface;
    showPreviewImageAtStart?: boolean;
}

export interface SettingItemInterface {
    id?: string;
    name?: string;
    mimeType?: string;
    webViewLink?: string;
    webContentLink?: string;
    thumbnailLink?: string | null;
    iconLink?: string;
    isVideo?: boolean;
}

export interface LogoOverlayInterface {
    id?: string;
    name?: string;
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}