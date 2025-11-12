export enum BackgroundType {
    CHROMA = 'chroma',
    COLOR = 'color',
    EVENT = 'event'
}

export interface BackgroundTypeDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectBackgroundType: (type: BackgroundType) => void;
}

export interface SocialKeys {
    tiktok?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
}
