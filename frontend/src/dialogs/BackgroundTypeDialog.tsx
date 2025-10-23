import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    CardActionArea,
    Stack,
    IconButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Videocam as ChromaIcon,
    Palette as ColorIcon,
    Event as EventIcon
} from '@mui/icons-material';
import { BackgroundType, BackgroundTypeDialogProps } from '../types/backgroundType';
import styles from './BackgroundTypeDialog.module.css';

const BackgroundTypeDialog: React.FC<BackgroundTypeDialogProps> = ({
    open,
    onClose,
    onSelectBackgroundType
}) => {
    const backgroundTypes = [
        {
            id: 'chroma',
            title: 'Chroma Background',
            description: 'Video with green screen or chroma key background for easy background replacement',
            icon: <ChromaIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            color: 'primary'
        },
        {
            id: 'fixed',
            title: 'Fixed Color Background',
            description: 'Video with a solid color background (white, black, or other solid colors)',
            icon: <ColorIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
            color: 'secondary'
        },
        {
            id: 'event',
            title: 'Event Based Background',
            description: 'Live event, outdoor recording, or video with complex real-world backgrounds',
            icon: <EventIcon sx={{ fontSize: 40, color: 'success.main' }} />,
            color: 'success'
        }
    ];

    const handleSelect = (type: BackgroundType) => {
        onSelectBackgroundType(type);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    minHeight: '400px'
                }
            }}
        >
            <DialogTitle sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pb: 1
            }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Select Background Type
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Please select the type of background in your video to help us process it correctly:
                </Typography>

                <Stack spacing={2}>
                    {backgroundTypes.map((type) => (
                        <Card
                            key={type.id}
                            className={styles.backgroundTypeCard}
                            sx={{
                                border: '2px solid transparent',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: `${type.color}.main`,
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                }
                            }}
                        >
                            <CardActionArea onClick={() => handleSelect(type.id as BackgroundType)}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ flexShrink: 0 }}>
                                            {type.icon}
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                {type.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {type.description}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    ))}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} variant="outlined">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BackgroundTypeDialog;
