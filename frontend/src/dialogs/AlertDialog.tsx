import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

interface AlertDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    onClose: () => void;
    confirmLabel?: string;
    onConfirm?: () => void;
    showCancel?: boolean;
    cancelLabel?: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
    open,
    title,
    message,
    onClose,
    confirmLabel = "OK",
    onConfirm,
    showCancel = false,
    cancelLabel = "Cancel",
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="alert-dialog-title" variant="h5" sx={{ mb: 2, lineHeight: 2.5 }}>
                {title}
            </DialogTitle>
            <DialogContent>
                <Typography variant="h6" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                {showCancel && (
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                    >
                        {cancelLabel}
                    </Button>
                )}
                <Button
                    onClick={onConfirm || onClose}
                    variant="contained"
                    sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertDialog;


