export const DB_TABLES = {
    PROFILES: 'profiles',
    YOUTUBE_VIDEOS: 'youtube_videos',
    PUBLISHED_VIDEOS: 'published_videos',
    GENERATED_VIDEOS: 'generated_videos',
    PROJECTS: 'projects',
    SOCIAL_ACCOUNTS: 'social_accounts',
    VIDEO_CLIPS: 'video_clips',
    SEARCH_HISTORY: 'search_history',
    PROJECT_SCENES: 'project_scenes',
    TRENDING_TOPICS: 'trending_topics',
    SCRIPTS_APPROVED: 'scripts_approved',
    TRANSCRIPTION_JOBS: 'transcription_jobs',
} as const;

export type DbTable = typeof DB_TABLES[keyof typeof DB_TABLES]; 