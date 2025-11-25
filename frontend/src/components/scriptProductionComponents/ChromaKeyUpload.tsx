import React, { useState } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Alert,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    VideoFile as VideoIcon,
    CheckCircle as CheckIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    HourglassEmpty as ProcessingIcon,
    RecordVoiceOver as TranscriptionIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import BackgroundTypeDialog from '../../dialogs/BackgroundTypeDialog';
import { BackgroundType } from '../../types/backgroundType';
import { useAuth } from '@/context/AuthContext';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { ScriptData } from '@/types/scriptData';

interface ChromaKeyUploadProps {
    jobId: string;
    videoDurationCaptured: (duration: number) => void;
    onUploadComplete: (driveUrl: string, transcriptionData: any, backgroundType: BackgroundType) => void;
    onUploadFailed: (errorMessage: string) => void;
}

const ChromaKeyUpload: React.FC<ChromaKeyUploadProps> = ({
    jobId,
    videoDurationCaptured,
    onUploadComplete,
    onUploadFailed,
}) => {
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState<'idle' | 'uploading' | 'videoConversion' | 'transcribing' | 'llmProcessing' | 'segmentation' | 'completed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'upload' | 'transcribe' | 'general' | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [showBackgroundTypeDialog, setShowBackgroundTypeDialog] = useState(false);
    const [selectedBackgroundType, setSelectedBackgroundType] = useState<BackgroundType | null>(null);

    const [progress, setProgress] = useState(0);

    const PY_BACKEND_URL = process.env.PYTHON_BACKEND_URL ?? 'http://127.0.0.1:10000';

    const startVideoUploadingAndTranscribtion = async (status: string, file: File) => {
        try {
            setUploading(true);
            setProgress(5);
            setCurrentStep('uploading');

            // if (status === 'upload' && file !== null && driveUrl === '') {
            // // 1) Upload to Drive first
            const upload = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobId, 'input', file as File);
            if (!upload?.success || !upload?.fileId) {
                const message = upload?.message || 'Failed to upload video to Drive';
                setUploading(false);
                setCurrentStep('idle');
                setError(message);
                setErrorType('upload');
                toast.error(message);
                return;
            }
            const currentDriveUrl = `https://drive.google.com/uc?id=${upload.fileId}`;

            setProgress(30);
            setCurrentStep('videoConversion');

            try {
                const formData = new FormData();
                formData.append('file', file as File);
                formData.append('jobId', jobId);

                // Progressively set progress over 60s to 70, then step, then again over 60s to 90 and step.
                let firstInterval: NodeJS.Timeout | null = null;
                let secondInterval: NodeJS.Timeout | null = null;
                let progressValue = 30;

                // Step 1: progress from 30 to 70 in 60s
                let step1 = 0;
                firstInterval = setInterval(() => {
                    step1++;
                    progressValue = 30 + Math.floor((step1 / 60) * 40); // 30 to 70 over 60s
                    setProgress(progressValue);
                    if (step1 >= 60) {
                        clearInterval(firstInterval!);
                        setProgress(70);
                        setCurrentStep('llmProcessing');

                        // Step 2: after first 60s, progress from 70 to 90 in 60s
                        let step2 = 0;
                        secondInterval = setInterval(() => {
                            step2++;
                            progressValue = 70 + Math.floor((step2 / 60) * 20); // 70 to 90 over 60s
                            setProgress(progressValue);
                            if (step2 >= 60) {
                                clearInterval(secondInterval!);
                                setProgress(90);
                                setCurrentStep('segmentation');
                            }
                        }, 1000);
                    }
                }, 1000);

                const response = await fetch(`${PY_BACKEND_URL}/api/process`, {
                    method: 'POST',
                    body: formData,
                });

                console.log('response: ', response);
                if (!response.ok) {
                    const message = await response.text();
                    throw new Error(message || 'Python pipeline failed');
                }

                const transcriptionData = await response.json();
                setProgress(100);
                setCurrentStep('completed');
                console.log('transcriptionData: ', JSON.stringify(transcriptionData, null, 2));
                
                onUploadComplete(currentDriveUrl, transcriptionData, selectedBackgroundType as BackgroundType);
            } catch (pipelineError) {
                console.error('Python pipeline error:', pipelineError);
                const message = pipelineError instanceof Error ? pipelineError.message : 'Pipeline failed';
                setError(message);
                onUploadFailed(message);
                toast.error(message);
            } finally {
                setUploading(true);
            }


        } catch (error) {
            setUploading(false);
            setProgress(0);
            setCurrentStep('idle');
            toast.error('Failed to upload chroma key');
            setError(error instanceof Error ? error.message : 'Failed to upload chroma key');
            setErrorType('general');
        }
    }

    const clearError = () => {
        setError(null);
        setErrorType(null);
        setCurrentStep('idle');
    };

    const getProgressMessage = () => {
        switch (currentStep) {
            case 'uploading':
                return 'Uploading video to Google Drive...';
            case 'videoConversion':
                return 'Converting video to audio...';
            case 'transcribing':
                return 'Transcribing audio to text...';
            case 'llmProcessing':
                return 'Processing with LLM...';
            case 'segmentation':
                return 'Segmenting video...';
            case 'completed':
                return 'All done! Your video has been processed successfully.';
            default:
                return 'Processing...';
        }
    };

    const getStepIcon = () => {
        switch (currentStep) {
            case 'uploading':
                return <UploadIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'videoConversion':
                return <VideoIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'transcribing':
                return <TranscriptionIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'llmProcessing':
                return <ProcessingIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'segmentation':
                return <VideoIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'completed':
                return <CheckIcon sx={{ fontSize: 20, mr: 1 }} />;
        }
    };

    const handleBackgroundTypeSelected = (type: BackgroundType) => {
        setSelectedBackgroundType(type);
        setShowBackgroundTypeDialog(false);

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

                // Extract video duration
                try {
                    const duration = await HelperFunctions.extractVideoDuration(file);
                    videoDurationCaptured(duration);
                } catch (error) {
                    console.error('Failed to extract video duration:', error);
                }

                startVideoUploadingAndTranscribtion('upload', file);
            }
        };
        input.click();
    };

    return (
        <>
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
                        onClick={() => {
                            setShowBackgroundTypeDialog(true);
                        }}
                    >
                        {progress > 0 ? (
                            <Box sx={{ textAlign: 'center' }}>
                                {/* Step Indicator */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    {getStepIcon()} <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{getProgressMessage()}</Typography>
                                </Box>

                                {/* Progress Bar */}
                                <Box sx={{ mb: 2 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={progress}
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
                                        {progress.toFixed(0)}%
                                    </Typography>
                                </Box>

                            </Box>
                        ) : (
                            <Box>
                                <UploadIcon sx={{ fontSize: 72, mb: 2 }} />
                                <Typography variant="body1" sx={{ mb: 1, fontSize: '1.5rem' }}>
                                    Click to upload Narrator's video
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.25rem' }}>
                                    or drag and drop your Narrator's video file here
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
                                            onClick={() => startVideoUploadingAndTranscribtion(errorType || '', uploadedFile as File)}
                                            // disabled={uploading}
                                            color="inherit"
                                        >
                                            <RefreshIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Close">
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                clearError();
                                                onUploadFailed('Upload failed. Please try again.');
                                            }}
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

            {/* Background Type Selection Dialog */}
            <BackgroundTypeDialog
                open={showBackgroundTypeDialog}
                onClose={() => setShowBackgroundTypeDialog(false)}
                onSelectBackgroundType={handleBackgroundTypeSelected}
            />
        </>
    );
};

export default ChromaKeyUpload;




