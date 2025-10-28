export type BackgroundType = 'chroma' | 'fixed' | 'event';

export interface BackgroundTypeDialogProps {
    open: boolean;
    onClose: () => void;
    onSelectBackgroundType: (type: BackgroundType) => void;
}
