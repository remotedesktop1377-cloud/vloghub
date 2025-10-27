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
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isComplete: boolean;
}

const BackConfirmationDialog: React.FC<BackConfirmationDialogProps> = ({
    open,
    onClose,
    onConfirm,
    isComplete
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="back-confirmation-dialog-title"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="back-confirmation-dialog-title" variant="h5" sx={{ mb: 2, color: 'warning.main', lineHeight: 2.5 }}>
                {isComplete ? 'Uploading Completed' : '⚠️ Are you sure?'}
            </DialogTitle>
            <DialogContent>
                <Typography variant="h5" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {isComplete ? 'Your video is being generating, We will notify you when it is ready.' : 'You haven\'t approved your script yet. If you go back now, your current progress and script data will be permanently deleted.'}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
                {!isComplete && (
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                    >
                        Stay Here
                    </Button>
                )}
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color="warning"
                    sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                >
                    {isComplete ? 'Okay' : 'Discard Script'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackConfirmationDialog;

