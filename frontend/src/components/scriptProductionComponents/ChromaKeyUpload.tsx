import React, { useState, useRef, useEffect } from 'react';
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
import { HelperFunctions, SecureStorageHelpers } from '../../utils/helperFunctions';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import BackgroundTypeDialog from '../../dialogs/BackgroundTypeDialog';
import { BackgroundType } from '../../types/backgroundType';
import { useTranscriptionProgress } from '@/hooks/useTranscriptionProgress';
import { useAuth } from '@/context/AuthContext';
import { SCRIPT_STATUS } from '@/data/constants';
import { ScriptData } from '@/types/scriptData';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';

interface ChromaKeyUploadProps {
    jobId: string;
    scriptData: ScriptData;
    setScriptData: (scriptData: ScriptData) => void;
    videoDurationCaptured: (duration: number) => void;
    onUploadComplete: (driveUrl: string, transcriptionData: any, backgroundType: BackgroundType) => void;
    onUploadFailed: (errorMessage: string) => void;
}

const ChromaKeyUpload: React.FC<ChromaKeyUploadProps> = ({
    jobId,
    scriptData,
    setScriptData,
    videoDurationCaptured,
    onUploadComplete,
    onUploadFailed,
}) => {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState<'idle' | 'uploading' | 'transcribing' | 'completed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'upload' | 'transcribe' | 'general' | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [driveUrl, setDriveUrl] = useState<string>('');
    const [showBackgroundTypeDialog, setShowBackgroundTypeDialog] = useState(false);
    const [selectedBackgroundType, setSelectedBackgroundType] = useState<BackgroundType | null>(null);
    const [transcriptionJobId, setTranscriptionJobId] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const transcriptionStartedRef = useRef(false);

    // Use transcription progress hook
    const transcriptionProgress = useTranscriptionProgress({
        jobId: transcriptionJobId,
        onComplete: (data) => {
            console.log('Transcription completed:', data);
        },
        onError: (error) => {
            console.error('Transcription error:', error);
            setError(`Transcription failed: ${error}`);
            setErrorType('transcribe');
            setUploading(false);
            onUploadFailed(error);
        },
    });

    // Sync upload progress with transcription progress
    useEffect(() => {
        if (scriptData.status === SCRIPT_STATUS.UPLOADED && scriptData.narrator_chroma_key_link && scriptData.transcription === "" && !transcriptionStartedRef.current) {
            startVideoTranscribing();
        }
    }, [scriptData]);

    const startVideoTranscribing = () => {
        // Prevent double transcription
        clearError();
        transcriptionStartedRef.current = true;
        // Update visual progress based on transcription stage
        setCurrentStep('transcribing');
        setUploadProgress(40);
        setUploading(true);
        setTranscriptionJobId(jobId);
        transcribingApiCall(scriptData.narrator_chroma_key_link);
    }

    const startVideoUploadingAndTranscribtion = async (status: string, file: File | null) => {
        try {
            setUploading(true);
            setUploadProgress(5);
            setCurrentStep('uploading');

            if (status === 'upload' && file !== null && driveUrl === '') {
                // 1) Upload to Drive first
                const upload = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobId, 'input', file);
                if (!upload?.success || !upload?.fileId) {
                    setUploading(false);
                    setCurrentStep('idle');
                    setError('Failed to upload video to Drive');
                    setErrorType('upload');
                    onUploadFailed('Failed to upload video to Drive');
                    return;
                }
                const currentDriveUrl = `https://drive.google.com/uc?id=${upload.fileId}`;
                // currentDriveUrl = 'https://drive.google.com/uc?id=1lDQe0CXoeiFbcfM6DdnpMK-rNNKHusAt'; // long
                // currentDriveUrl = 'https://drive.google.com/uc?id=1dh2NClbUC5pZw-qlNs0Td2-yaB_4HySo'; // short
                setDriveUrl(currentDriveUrl);
                //store the drive url in the script data
                const updatedScriptData = {
                    ...scriptData,
                    status: SCRIPT_STATUS.UPLOADED,
                    narrator_chroma_key_link: currentDriveUrl,
                    updated_at: new Date().toISOString(),
                } as ScriptData;
                setScriptData(updatedScriptData);
                SecureStorageHelpers.setScriptMetadata(updatedScriptData);
            } else if (status === 'transcribe' && file !== null && driveUrl !== '') {
                startVideoTranscribing();
            }
            // Transcription will be triggered automatically by useEffect when scriptData is updated
            // No need to call transcribeVideo here - the useEffect handles it
        } catch (error) {
            setTranscriptionJobId(null); // Stop tracking on error
            setUploading(false);
            setUploadProgress(0);
            setCurrentStep('idle');
            toast.error('Failed to upload chroma key');
            setError(error instanceof Error ? error.message : 'Failed to upload chroma key');
            setErrorType('general');
        }
    }

    const transcribingApiCall = async (currentDriveUrl: string) => {
        try {
            // Start tracking progress immediately with the jobId
            setTranscriptionJobId(jobId);

            const res = await fetch(API_ENDPOINTS.API_TRANSCRIBE_VIDEO, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driveUrl: currentDriveUrl,
                    scriptLanguage: scriptData?.language || 'english',
                    jobId: jobId,
                    userId: user?.id || '',
                    videoDuration: videoDuration || 0
                })
            });
            const transcriptionData = await res.json();

            if (!res.ok || transcriptionData?.error) {
                setTranscriptionJobId(null);
                setUploading(false);
                setCurrentStep('idle');
                console.log("transcription failed: ", transcriptionData?.error);
                setError(`Transcription failed: ${transcriptionData?.error || 'Unknown error'}`);
                setErrorType('transcribe');
                onUploadFailed('Transcription failed');
                return;
            }

            // Transcription is complete (API blocks until done)
            setUploadProgress(100);
            setCurrentStep('completed');
            setUploading(false);
            setTranscriptionJobId(null); // Stop tracking
            toast.success('Upload and transcription complete');
            onUploadComplete(currentDriveUrl, transcriptionData, selectedBackgroundType as BackgroundType);
        } catch (error) {
            console.error('Transcription error:', error);
            setError(`Transcription failed: ${error}`);
            setErrorType('transcribe');
        }
    }

    const clearError = () => {
        setError(null);
        setErrorType(null);
        setCurrentStep('idle');
        transcriptionStartedRef.current = false; // Reset transcription flag
    };

    const getProgressMessage = () => {
        // If we have transcription progress, show detailed messages
        if (transcriptionProgress.isLoading && transcriptionProgress.message) {
            return transcriptionProgress.message;
        }

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

    const getProgressPercentage = () => {
        // If we have transcription progress, use that
        if (transcriptionProgress.isLoading && transcriptionProgress.progress > 0) {
            // Map transcription progress to our display (upload is 0-40%, transcription is 40-100%)
            return Math.min(100, 40 + (transcriptionProgress.progress * 0.6));
        }
        return uploadProgress;
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

    const handleBackgroundTypeSelected = (type: BackgroundType) => {
        setSelectedBackgroundType(type);
        setShowBackgroundTypeDialog(false);

        // Reset transcription started flag for new upload
        transcriptionStartedRef.current = false;

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
                                        value={getProgressPercentage()}
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
                                        {getProgressPercentage().toFixed(0)}%
                                    </Typography>
                                </Box>

                                {/* Transcription Stage Details */}
                                {currentStep === 'transcribing' && transcriptionProgress.stage && (
                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                        <Chip
                                            label={transcriptionProgress.stage.replace(/_/g, ' ').toUpperCase()}
                                            color="primary"
                                            size="small"
                                            sx={{ textTransform: 'capitalize', mb: 1 }}
                                        />
                                        {transcriptionProgress.progress > 0 && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {transcriptionProgress.progress.toFixed(0)}% of transcription complete
                                            </Typography>
                                        )}
                                        <CircularProgress size={16} sx={{ mb: 0.5 }} />
                                    </Box>
                                )}

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
                                        Converting audio to text in {scriptData?.language || 'english'}...
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
                                            onClick={() => startVideoUploadingAndTranscribtion(errorType || '', uploadedFile)}
                                            // disabled={uploading}
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




