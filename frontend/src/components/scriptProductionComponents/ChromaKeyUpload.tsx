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
    Tooltip,
    CircularProgress,
    Stack
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    VideoFile as VideoIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    CloudDone as CloudDoneIcon,
    RecordVoiceOver as TranscriptionIcon,
    HourglassEmpty as ProcessingIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { HelperFunctions } from '../../utils/helperFunctions';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

interface ChromaKeyUploadProps {
    jobId: string;
    scriptLanguage: string;
    onUploadComplete: (driveUrl: string, transcriptionData: string) => void;
    onUploadFailed: (errorMessage: string) => void;
}

const ChromaKeyUpload: React.FC<ChromaKeyUploadProps> = ({
    jobId,
    scriptLanguage,
    onUploadComplete,
    onUploadFailed,
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState<'idle' | 'uploading' | 'transcribing' | 'completed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'upload' | 'transcribe' | 'general' | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [driveUrl, setDriveUrl] = useState<string>('');

    const clearError = () => {
        setError(null);
        setErrorType(null);
        setCurrentStep('idle');
    };

    const getProgressMessage = () => {
        switch (currentStep) {
            case 'uploading':
                return 'Uploading video to Google Drive...';
            case 'transcribing':
                return 'Transcribing audio to text...';
            case 'completed':
                return 'Upload and transcription complete!';
            default:
                return 'Processing...';
        }
    };

    const getStepIcon = () => {
        switch (currentStep) {
            case 'uploading':
                return <CloudDoneIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'transcribing':
                return <TranscriptionIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'completed':
                return <CheckIcon sx={{ fontSize: 20, mr: 1 }} />;
            default:
                return <ProcessingIcon sx={{ fontSize: 20, mr: 1 }} />;
        }
    };

    const handleRetry = () => {
        clearError();
        if (errorType === 'upload' && uploadedFile) {
            handleUploadComplete('upload', uploadedFile);
        } else if (errorType === 'transcribe' && driveUrl !== '') {
            handleUploadComplete('transcribe', uploadedFile);
        } else if (errorType === 'general' && uploadedFile) {
            handleUploadComplete('upload', uploadedFile);
        }
    };

    const onFileSelectionClick = () => {
        // Create a file input for chroma key upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const file = files[0];
                setUploadedFile(file);
                clearError(); // Clear any previous errors
                handleUploadComplete('upload', file);
            }
        };
        input.click();
    };

    const handleUploadComplete = async (status: 'upload' | 'transcribe', file: File | null) => {
        try {
            setUploading(true);
            setUploadProgress(5);
            setCurrentStep('uploading');
            let currentDriveUrl = driveUrl; // Use current state value as fallback
            
            if (status === 'upload' && file !== null) {
                // 1) Upload to Drive first
                const upload = await HelperFunctions.uploadMediaToDrive(jobId, 'input', file);
                if (!upload?.success || !upload?.fileId) {
                    setUploading(false);
                    setCurrentStep('idle');
                    setError('Failed to upload video to Drive');
                    setErrorType('upload');
                    onUploadFailed('Failed to upload video to Drive');
                    return;
                }
                currentDriveUrl = `https://drive.google.com/uc?id=${upload.fileId}`;
                setDriveUrl(currentDriveUrl);
            }
            setUploadProgress(40);
            setCurrentStep('transcribing');
            if (status === 'upload' || status === 'transcribe') {
                // 2) Call transcribe with URL (small JSON payload)
                console.log('Using drive URL for transcription:', currentDriveUrl);
                const res = await fetch(API_ENDPOINTS.TRANSCRIBE_VIDEO, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: currentDriveUrl, fileName: file?.name || '', scriptLanguage: scriptLanguage })
                });
                setUploadProgress(85);
                const data = await res.json();
                if (!res.ok) {
                    setUploading(false);
                    setCurrentStep('idle');
                    console.log("transcription failed: ", data?.error);
                    setError(`Transcription failed: ${data?.error || 'Unknown error'}`);
                    setErrorType('transcribe');
                    onUploadFailed('Transcription failed');
                    return;
                }

                setUploadProgress(100);
                setCurrentStep('completed');
                setUploading(false);
                toast.success('Upload and transcription complete');
                onUploadComplete(currentDriveUrl, data.text || '');
            }

        } catch (error) {
            setUploading(false);
            setUploadProgress(0);
            setCurrentStep('idle');
            toast.error('Failed to upload chroma key');
            setError(error instanceof Error ? error.message : 'Failed to upload chroma key');
            setErrorType('general');
        }
    }

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
                        },
                        pointerEvents: uploading ? 'none' : 'auto',
                    }}
                    onClick={() => onFileSelectionClick()}
                >
                    {uploadProgress > 0 ? (
                        <Box sx={{ textAlign: 'center' }}>
                            {/* Step Indicator */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                {getStepIcon()}
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                    {getProgressMessage()}
                                </Typography>
                            </Box>

                            {/* Progress Bar */}
                            <Box sx={{ mb: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 4,
                                        },
                                    }}
                                />
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                                    {uploadProgress.toFixed(0)}%
                                </Typography>
                            </Box>

                            {/* Step Progress Indicators */}
                            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                                <Chip
                                    icon={<CloudDoneIcon />}
                                    label="Upload"
                                    color={currentStep === 'uploading' ? 'primary' : uploadProgress > 40 ? 'success' : 'default'}
                                    variant={currentStep === 'uploading' ? 'filled' : 'outlined'}
                                    size="small"
                                />
                                <Chip
                                    icon={<TranscriptionIcon />}
                                    label="Transcribe"
                                    color={currentStep === 'transcribing' ? 'primary' : uploadProgress === 100 ? 'success' : 'default'}
                                    variant={currentStep === 'transcribing' ? 'filled' : 'outlined'}
                                    size="small"
                                />
                            </Stack>

                            {/* Additional Info */}
                            {currentStep === 'uploading' && (
                                <Typography variant="caption" color="text.secondary">
                                    Please wait while your video is being uploaded...
                                </Typography>
                            )}
                            {currentStep === 'transcribing' && (
                                <Typography variant="caption" color="text.secondary">
                                    Converting audio to text in {scriptLanguage}...
                                </Typography>
                            )}
                            {currentStep === 'completed' && (
                                <Typography variant="caption" color="success.main">
                                    ✓ All done! Your video has been processed successfully.
                                </Typography>
                            )}
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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Retry">
                                    <IconButton
                                        size="small"
                                        onClick={handleRetry}
                                        disabled={uploading}
                                        color="inherit"
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Close">
                                    <IconButton
                                        size="small"
                                        onClick={clearError}
                                        color="inherit"
                                    >
                                        <CloseIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        }
                    >
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {errorType === 'upload' && 'Upload Failed'}
                                {errorType === 'transcribe' && 'Transcription Failed'}
                                {errorType === 'general' && 'Error Occurred'}
                            </Typography>
                            <Typography variant="body2">
                                {error}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                                Click the retry button to try again
                            </Typography>
                        </Box>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default ChromaKeyUpload;



