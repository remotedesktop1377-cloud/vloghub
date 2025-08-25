export interface Chapter {
    id: string;
    text: string;
    duration: string;
    words: number;
    startTime: number;
    endTime: number;
    durationInSeconds: number;
    assets?: {
        image?: string | null;
        audio?: string | null;
        video?: string | null;
    };
}

