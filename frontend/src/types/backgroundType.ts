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
