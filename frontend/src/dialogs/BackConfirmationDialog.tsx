import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

interface BackConfirmationDialogProps {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const BackConfirmationDialog: React.FC<BackConfirmationDialogProps> = ({
    title,
    message,
    confirmText,
    cancelText,
    open,
    onClose,
    onConfirm,
}) => {
    const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
        if (title === 'Uploading Completed') {
            return;
        }
        if (reason === 'backdropClick') {
            return;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="back-confirmation-dialog-title"
            maxWidth="sm"
            fullWidth
            disableEscapeKeyDown={true}
        >
            <DialogTitle id="back-confirmation-dialog-title" variant="h5" sx={{ mb: 2, color: 'warning.main', lineHeight: 2.5 }}>
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="h5" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                >
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="warning"
                    sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackConfirmationDialog;

