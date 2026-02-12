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
import { HelperFunctions } from '../../utils/helperFunctions';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { processService } from '@/services/processService';
import { SceneData } from '@/types/sceneData';
import { SceneThumbnailResponse } from '@/services/thumbnailCreationService';

interface ChromaKeyUploadProps {
    jobId: string;
    videoDurationCaptured: (duration: number) => void;
    onUploadComplete: (narratorVideoUrl: string, transcription: string, scenes: SceneData[]) => void;
    onUploadFailed: (errorMessage: string) => void;
}

const ChromaKeyUpload: React.FC<ChromaKeyUploadProps> = ({
    jobId,
    videoDurationCaptured,
    onUploadComplete,
    onUploadFailed,
}) => {
    const [uploading, setUploading] = useState(false);
    const [currentStep, setCurrentStep] = useState<'idle' | 'compressing' | 'uploading' | 'videoConversion' | 'transcribing' | 'llmProcessing' | 'segmentation' | 'assetsGeneration' | 'completed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'upload' | 'transcribe' | 'general' | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [videoDurationSeconds, setVideoDurationSeconds] = useState<number>(0);
    const [progress, setProgress] = useState(0);

    const startVideoUploadingAndTranscribtion = async (file: File) => {
        try {
            setUploading(true);
            setProgress(5);
            setCurrentStep('compressing');

            const compressedFile = await processService.compressVideo(file, jobId);

            setProgress(10);
            setCurrentStep('uploading');

            const upload = await GoogleDriveServiceFunctions.uploadMediaToDrive(jobId, 'input', compressedFile);
            if (!upload?.success || !upload?.fileId) {
                const message = upload?.message || 'Failed to upload video to Drive';
                setUploading(false);
                setCurrentStep('idle');
                setError(message);
                setErrorType('upload');
                toast.error(message);
                return;
            }
            const narratorVideoUrl = upload?.webViewLink || '';

            setProgress(20);
            setCurrentStep('videoConversion');

            const audioFile = await processService.extractAudioFromVideo(compressedFile);
            // console.log('audioFile: ', audioFile);
            setCurrentStep('transcribing');
            setProgress(40);

            const transcription = await processService.transcribeAudio(audioFile);
            // console.log('transcription: ', transcription);
            setProgress(60);
            setCurrentStep('llmProcessing');

            const scenes = await processService.planScenesWithLLM({
                transcription,
                videoDurationSeconds,
                fps: 30,
                aspectRatio: "16:9",
                visualTheme: "cinematic geopolitical documentary"
            });

            setProgress(80);
            setCurrentStep('segmentation');

            const updatedScenes = await processService.cutClipsAndPackageResults({
                videoFile: compressedFile,
                scenes,
                jobId,
                fps: 30,
            });

            setProgress(90);
            setCurrentStep('assetsGeneration');

            const scenesWithGeneratedBackgrounds = await processService.generateSceneBackgrounds({
                jobId,
                scenes: updatedScenes.scenes || [],
                aspectRatio: "16:9"
            });
            const generatedBackgroundScenes: SceneThumbnailResponse[] = Array.isArray(scenesWithGeneratedBackgrounds)
                ? scenesWithGeneratedBackgrounds
                : [];
            const scenesWithGeneratedImages = await Promise.all(
                (updatedScenes.scenes || []).map(async (scene: SceneData) => {                    
                    const match = generatedBackgroundScenes.find((s: any) => (s?.sceneId || s?.id) === scene.id);
                    const generatedBackground = match?.image || '';
                    if (!generatedBackground) {
                        return scene;
                    }

                    let driveBackgroundUrl = generatedBackground;
                    if (generatedBackground.startsWith('data:')) {
                        const uploaded = await GoogleDriveServiceFunctions.uploadPreviewDataUrl(
                            jobId,
                            scene.id || '',
                            generatedBackground
                        );
                        const uploadedUrl =
                            uploaded?.result?.webViewLink ||
                            uploaded?.result?.result?.webViewLink ||
                            uploaded?.result?.webContentLink ||
                            uploaded?.result?.result?.webContentLink ||
                            '';
                        if (uploaded?.success && uploadedUrl) {
                            driveBackgroundUrl = uploadedUrl;
                        }
                    }

                    const existingImages = Array.isArray(scene?.assets?.images) ? scene.assets?.images || [] : [];

                    return {
                        ...scene,
                        generatedBackgroundUrl: driveBackgroundUrl,
                        backgroundPrompt: match?.enhancedPrompt || '',
                        aiAssets: {
                            ...(scene?.aiAssets || {}),
                            generatedBackgroundUrl: driveBackgroundUrl,
                        },
                        assets: {
                            ...(scene?.assets || {}),
                            images: [driveBackgroundUrl, ...existingImages]
                        }
                    };
                })
            );
            updatedScenes.scenes = scenesWithGeneratedImages;

            setProgress(100);
            setCurrentStep('completed');

            onUploadComplete(narratorVideoUrl, transcription, updatedScenes.scenes);

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

    const getStepIcon = () => {
        switch (currentStep) {
            case 'compressing':
                return <ProcessingIcon sx={{ fontSize: 20, mr: 1 }} />;
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
            case 'assetsGeneration':
                return <ProcessingIcon sx={{ fontSize: 20, mr: 1 }} />;
            case 'completed':
                return <CheckIcon sx={{ fontSize: 20, mr: 1 }} />;
        }
    };

    const handleUploadVideo = () => {
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
                    setVideoDurationSeconds(duration);
                } catch (error) {
                    console.log('Failed to extract video duration:', error);
                }

                startVideoUploadingAndTranscribtion(file);
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
                        onClick={() => handleUploadVideo()}
                    >
                        {progress > 0 ? (
                            <Box sx={{ textAlign: 'center' }}>
                                {/* Step Indicator */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                    {getStepIcon()} <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{HelperFunctions.getProgressMessage(currentStep)}</Typography>
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
                                            onClick={() => {
                                                clearError();
                                                startVideoUploadingAndTranscribtion(uploadedFile as File);
                                            }}
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
        </>
    );
};

export default ChromaKeyUpload;




