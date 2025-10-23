import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Typography,
    LinearProgress,
    Alert,
    Card,
    CardContent,
    IconButton,
    Chip,
    Tooltip
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    VideoFile as VideoIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { HelperFunctions } from '../../utils/helperFunctions';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

interface ChromaKeyUploadProps {
    jobId: string;
    scriptLanguage: string;
    onUploadComplete: (driveUrl: string, transcriptionData: string) => void;
    onUploadFailed: (errorMessage: string) => void;
    disabled?: boolean;
}

const ChromaKeyUpload: React.FC<ChromaKeyUploadProps> = ({
    jobId,
    scriptLanguage,
    onUploadComplete,
    onUploadFailed,
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleUploadChromaKey = () => {
        // Create a file input for chroma key upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const file = files[0];

                try {
                    setUploading(true);
                    setUploadProgress(5);

                    // 1) Upload to Drive first
                    const upload = await HelperFunctions.uploadMediaToDrive(jobId, 'input', file);

                    if (!upload?.success || !upload?.fileId) {
                        setUploading(false);
                        setError('Failed to upload video to Drive');
                        onUploadFailed('Failed to upload video to Drive');
                        return;
                    } else {

                        setUploadProgress(40);

                        const driveUrl = `https://drive.google.com/uc?id=${upload.fileId}`;

                        // 2) Call transcribe with URL (small JSON payload)
                        const res = await fetch(API_ENDPOINTS.TRANSCRIBE_VIDEO, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url: driveUrl, fileName: file.name, scriptLanguage: scriptLanguage })
                        });

                        setUploadProgress(85);
                        const data = await res.json();
                        if (!res.ok) {
                            toast.error(data?.error || 'Transcription failed');
                            setUploading(false);
                            setError(data?.error || 'Transcription failed');
                            onUploadFailed('Transcription failed');
                            return;
                        }

                        toast.success('Upload and transcription complete');
                        onUploadComplete(driveUrl, data.text || '');
                    }

                } catch (error) {
                    setUploading(false);
                    setUploadProgress(0);
                    toast.error('Failed to upload chroma key');
                    setError(error instanceof Error ? error.message : 'Failed to upload chroma key');
                }
            }
        };
        input.click();
    };

    return (
        <Card sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
            <CardContent sx={{ minHeight: '200px' }}>
                {/* Upload Area */}
                <Box
                    sx={{
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: 'primary.light',
                        opacity: uploading ? 0.6 : 1,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            backgroundColor: uploading ? 'primary.light' : 'primary.main',
                            color: uploading ? 'inherit' : 'white',
                        }
                    }}
                    onClick={handleUploadChromaKey}
                >
                    {uploadProgress > 0 ? (
                        <Box>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Processing and uploading...
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={uploadProgress}
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="body2">
                                {uploadProgress.toFixed(0)}%
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <UploadIcon sx={{ fontSize: 48, mb: 2 }} />
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                Click to upload chroma key video
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                or drag and drop your video file here
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Error Display */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mt: 2 }}
                        action={
                            <IconButton
                                size="small"
                                onClick={() => setError(null)}
                            >
                                <ErrorIcon />
                            </IconButton>
                        }
                    >
                        {error}
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default ChromaKeyUpload;



