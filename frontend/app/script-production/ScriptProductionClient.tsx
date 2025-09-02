'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Container,
    Button,
    Alert,
    Grid,
    LinearProgress,
    Chip,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    VideoCall as VideoIcon,
    Refresh as RefreshIcon,
    Movie as ChapterIcon,
    AccessTime as TimeIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { HelperFunctions } from '@/utils/helperFunctions';
import { toast } from 'react-toastify';
import { secure } from '@/utils/helperFunctions';
import { API_ENDPOINTS } from '../../src/config/apiEndpoints';
import { Chapter } from '@/types/chapters';
import ChaptersSection from '@/components/TrendingTopicsComponent/ChaptersSection';
import { DropResult } from 'react-beautiful-dnd';
import { fallbackImages } from '@/data/mockImages';
import { SUCCESS, INFO, WARNING, SPECIAL, HOVER } from '@/styles/colors';
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';
import { LOCAL_STORAGE_KEYS, ROUTES_KEYS } from '@/data/constants';

interface ScriptData {
    description: string;
    script: string;
    topic: string;
    hypothesis: string;
    region: string;
    duration: string;
    language: string;
    subtitleLanguage?: string;
    narrationType?: 'interview' | 'narration';
    title?: string;
    hook?: string;
    mainContent?: string;
    conclusion?: string;
    callToAction?: string;
    words?: number;
}


const ScriptProductionClient: React.FC = () => {

    const router = useRouter();
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);
    const [initializing, setInitializing] = useState(true);

    // Production states
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [chromaKeyFile, setChromaKeyFile] = useState<File | null>(null);
    const [chromaKeyUrl, setChromaKeyUrl] = useState<string | null>(null);
    const [uploadingChromaKey, setUploadingChromaKey] = useState(false);
    const [chromaKeyUploadProgress, setChromaKeyUploadProgress] = useState(0);

    // Chapter editing states
    const [editingChapter, setEditingChapter] = useState<number | null>(null);
    const [editHeading, setEditHeading] = useState('');
    const [editNarration, setEditNarration] = useState('');

    // Image management states
    const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [chapterImagesMap, setChapterImagesMap] = useState<Record<number, string[]>>({});
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [aiImagesEnabled, setAiImagesEnabled] = useState(false);
    const [rightTabIndex, setRightTabIndex] = useState(0);
    const [imagesLoading, setImagesLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerChapterIndex, setPickerChapterIndex] = useState<number | null>(null);
    const [pickerNarrations, setPickerNarrations] = useState<string[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [isDraggingUpload, setIsDraggingUpload] = useState(false);
    const [mediaManagementOpen, setMediaManagementOpen] = useState(false);
    const [mediaManagementChapterIndex, setMediaManagementChapterIndex] = useState<number | null>(null);
    const [uploadingToDrive, setUploadingToDrive] = useState(false);
    const [driveUploadResult, setDriveUploadResult] = useState<{ fileUrl?: string; fileName?: string } | null>(null);

    // Function to upload JSON to Google Drive
    const uploadToGoogleDrive = async (chapters: Chapter[]) => {
        if (!scriptData) {
            toast.error('No script data available to upload');
            return;
        }

        setUploadingToDrive(true);

        try {
            // Create comprehensive JSON structure for script production
            const scriptProductionJSON = {
                "project": {
                    "topic": scriptData?.topic || null,
                    "title": scriptData?.title || null,
                    "description": scriptData?.description || null,
                    "duration": parseInt(scriptData?.duration || '1') || null,
                    "resolution": "1920x1080",
                    "region": scriptData?.region || null,
                    "language": scriptData?.language || null,
                    "subtitleLanguage": scriptData?.subtitleLanguage || null,
                    "narrationType": scriptData?.narrationType || null,
                },
                "script": chapters.map(chapter => ({
                    "id": chapter.id,
                    "narration": chapter.narration,
                    "duration": chapter.duration,
                    "durationInSeconds": chapter.durationInSeconds,
                    "words": chapter.words,
                    "startTime": chapter.startTime,
                    "endTime": chapter.endTime,
                    "assets": {
                        "images": chapter.assets?.images || []
                    }
                }))
            };

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const fileName = `${scriptData.topic?.replace(/[^a-zA-Z0-9]/g, '-') || 'untitled'}-${timestamp}.json`;

            console.log('📤 Uploading to Google Drive:', fileName);

            // Upload to Google Drive
            const response = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_UPLOAD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonData: scriptProductionJSON,
                    fileName: fileName
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Failed to upload to Google Drive');
            }

            const result = await response.json();

            setDriveUploadResult({
                fileUrl: result.fileUrl,
                fileName: result.fileName
            });

            toast.success(`Successfully uploaded "${result.fileName}" to Google Drive!`);
            console.log('✅ Google Drive upload successful:', result);

        } catch (error) {
            console.error('❌ Google Drive upload failed:', error);
            toast.error(`Failed to upload to Google Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploadingToDrive(false);
        }
    };

    const createGoogleDriveJSON = (chapters: Chapter[]) => {
        // This function is kept for backward compatibility
        // The actual upload logic is now in uploadToGoogleDrive
        console.log('📋 JSON structure ready for', chapters.length, 'chapters');
    };

    // Function to break down script into paragraphs and calculate individual durations
    const updateParagraphs = (scriptData: ScriptData) => {
        // Split script into paragraphs (split by double newlines or single newlines)

        // console.log('📋 Script Data:', scriptData.script)

        const scriptParagraphs = scriptData.script
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // Calculate sequential time allocation for paragraphs
        const paragraphsWithTimeRanges = calculateSequentialTimeRanges(scriptParagraphs);

        // Map to Chapter[] with required fields
        const chaptersAsRequired: Chapter[] = paragraphsWithTimeRanges.map((p, index) => ({
            id: `scene-${index + 1}`,
            narration: p.text,
            duration: p.duration,
            words: p.words,
            startTime: p.startTime,
            endTime: p.endTime,
            durationInSeconds: p.durationInSeconds,
            assets: { image: null, audio: null, video: null }
        }));

        setChapters(chaptersAsRequired);
        createGoogleDriveJSON(chaptersAsRequired);
    };

    useEffect(() => {
        // Load only from secure storage
        const stored = secure.j.approvedScript.get();
        if (stored) {
            try {
                // secure.j returns the object directly, no need to parse
                const storedData = typeof stored === 'string' ? JSON.parse(stored) : stored;
                setScriptData(storedData);
            } catch (e) {
                console.error('Failed to parse stored script data', e);
            }
        }
        setInitializing(false);
    }, []);

    // Calculate estimated duration when script data changes
    useEffect(() => {
        if (scriptData) {
            updateParagraphs(scriptData);
        }
    }, [scriptData]);

    // Calculate sequential time ranges for paragraphs (0-20s, 20-40s, etc.)
    const calculateSequentialTimeRanges = (scriptParagraphs: string[]) => {
        if (scriptParagraphs.length === 0) return [];

        // Get the intended duration from scriptData (convert to seconds)
        const intendedDurationMinutes = parseFloat(scriptData?.duration || '1');
        const intendedDurationSeconds = intendedDurationMinutes * 60;

        // Calculate total words in all paragraphs
        const totalWords = scriptParagraphs.reduce((sum, paragraph) => {
            return sum + paragraph.trim().split(/\s+/).filter(word => word.length > 0).length;
        }, 0);

        let currentTime = 0; // Start from 0 seconds

        return scriptParagraphs.map((paragraph, index) => {
            const words = paragraph.trim().split(/\s+/).filter(word => word.length > 0).length;

            // Calculate proportional duration based on word count and intended total duration
            const durationInSeconds = totalWords > 0
                ? Math.round((words / totalWords) * intendedDurationSeconds)
                : Math.round(intendedDurationSeconds / scriptParagraphs.length);

            const startTime = currentTime;
            const endTime = currentTime + durationInSeconds;

            // Update current time for next paragraph
            currentTime = endTime;

            return {
                text: paragraph,
                duration: formatTimeRange(startTime, endTime),
                words,
                startTime,
                endTime,
                durationInSeconds
            };
        });
    };

    // Format time range (e.g., "0-20s", "20-40s")
    const formatTimeRange = (startSeconds: number, endSeconds: number): string => {
        const formatTime = (seconds: number) => {
            if (seconds < 60) return `${seconds}s`;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        };

        return `${formatTime(startSeconds)} - ${formatTime(endSeconds)}`;
    };

    // Calculate duration for a single paragraph
    const calculateParagraphDuration = (words: number): string => {
        if (words === 0) return '0s';

        const averageWordsPerMinute = 155;
        const minutes = words / averageWordsPerMinute;

        if (minutes < 1) {
            const seconds = Math.round(minutes * 60);
            return `${seconds}s`;
        } else if (minutes < 60) {
            const wholeMinutes = Math.floor(minutes);
            const seconds = Math.round((minutes - wholeMinutes) * 60);
            return seconds > 0 ? `${wholeMinutes}m ${seconds}s` : `${wholeMinutes}m`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = Math.round(minutes % 60);
            return `${hours}h ${remainingMinutes}m`;
        }
    };

    const handleGoBack = () => {
        router.push(ROUTES_KEYS.TRENDING_TOPICS);
    };

    const handleDownloadAllNarrations = () => {
        if (!chapters.length) return;

        try {
            // Build script content in the same structured format used in approval
            let content = '';
            if (scriptData) {
                const parts: string[] = [];
                if (scriptData.title && scriptData.title.trim()) {
                    parts.push(`📋 TITLE:\n${scriptData.title.trim()}`);
                }
                if (scriptData.hook && scriptData.hook.trim()) {
                    parts.push(`🎯 HOOK:\n${scriptData.hook.trim()} -`);
                }
                if (scriptData.mainContent && scriptData.mainContent.trim()) {
                    parts.push(`📝 MAIN CONTENT:\n${scriptData.mainContent.trim()}`);
                }
                if (scriptData.conclusion && scriptData.conclusion.trim()) {
                    parts.push(`🏁 CONCLUSION:\n${scriptData.conclusion.trim()}`);
                }
                if (scriptData.callToAction && scriptData.callToAction.trim()) {
                    parts.push(`🚀 CALL TO ACTION:\n${scriptData.callToAction.trim()}`);
                }
                content = parts.filter(Boolean).join('\n\n');
                if (!content.trim() && scriptData.script) {
                    content = scriptData.script;
                }
            }

            if (!content.trim()) {
                toast.error('No script content to download');
                return;
            }

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeTopic = (scriptData?.topic || 'script').toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
            a.href = url;
            a.download = `${safeTopic || 'script'}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Script downloaded successfully');
        } catch (error) {
            toast.error('Failed to download narrations');
        }
    };

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
                    setUploadingChromaKey(true);
                    setChromaKeyUploadProgress(0);

                    // Simulate upload progress
                    const progressInterval = setInterval(() => {
                        setChromaKeyUploadProgress(prev => {
                            if (prev >= 90) {
                                clearInterval(progressInterval);
                                return 90;
                            }
                            return prev + 10;
                        });
                    }, 100);

                    // Create object URL for the file
                    const url = URL.createObjectURL(file);
                    setChromaKeyFile(file);
                    setChromaKeyUrl(url);

                    // Complete the progress
                    setTimeout(() => {
                        setChromaKeyUploadProgress(100);
                        setUploadingChromaKey(false);
                        toast.success('Chroma key uploaded successfully!');
                    }, 1000);

                } catch (error) {
                    setUploadingChromaKey(false);
                    setChromaKeyUploadProgress(0);
                    toast.error('Failed to upload chroma key');
                }
            }
        };
        input.click();
    };

    const handleGenerateVideo = async () => {
        if (!chapters.length) {
            toast.error('No chapters available for video generation');
            return;
        }

        if (!chromaKeyFile || !chromaKeyUrl) {
            toast.error('Please upload a chroma key before generating video');
            return;
        }

        toast.success('Video generation started! This may take a while...');
        // TODO: Implement actual video generation
    };

    // Chapter Management Functions
    const handleAddChapterAfter = (index: number) => {
        HelperFunctions.addChapterAfter(index, chapters, setChapters);
    };

    const handleDeleteChapter = (index: number) => {
        HelperFunctions.deleteChapter(index, chapters, setChapters);
    };

    const handleEditChapter = (index: number) => {
        // setEditingChapter(index);
        // setEditHeading(chapters[index].on_screen_text || '');
        // setEditNarration(chapters[index].narration || '');
    };

    const handleSaveEdit = () => {
        if (editingChapter !== null) {
            HelperFunctions.saveEdit(editingChapter, chapters, setChapters, editHeading, editNarration, setEditingChapter);
            setEditHeading('');
            setEditNarration('');
        }
    };

    const handleCancelEdit = () => {
        HelperFunctions.cancelEdit(setEditingChapter, setEditHeading, setEditNarration);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;
        if (source.index === destination.index) return;

        // Reorder chapters
        const updatedChapters = Array.from(chapters);
        const [reorderedChapter] = updatedChapters.splice(source.index, 1);
        updatedChapters.splice(destination.index, 0, reorderedChapter);
        setChapters(updatedChapters);

        // Reorder chapter images map to follow the chapters
        const updatedChapterImagesMap: Record<number, string[]> = {};

        // Create a temporary mapping of old indices to their images
        const tempImageMap: Record<number, string[]> = {};
        Object.keys(chapterImagesMap).forEach(key => {
            tempImageMap[parseInt(key)] = chapterImagesMap[parseInt(key)];
        });

        // Reorder the images based on the new chapter order
        updatedChapters.forEach((chapter, newIndex) => {
            // Find the original index of this chapter
            const originalIndex = chapters.findIndex(c => c.id === chapter.id);
            if (originalIndex !== -1 && tempImageMap[originalIndex]) {
                updatedChapterImagesMap[newIndex] = tempImageMap[originalIndex];
            }
        });

        setChapterImagesMap(updatedChapterImagesMap);

        // Update selected chapter index if needed
        if (selectedChapterIndex === source.index) {
            setSelectedChapterIndex(destination.index);
        } else if (selectedChapterIndex >= Math.min(source.index, destination.index) &&
            selectedChapterIndex <= Math.max(source.index, destination.index)) {
            // Adjust selected index if it's in the affected range
            if (source.index < destination.index && selectedChapterIndex > source.index) {
                setSelectedChapterIndex(selectedChapterIndex - 1);
            } else if (source.index > destination.index && selectedChapterIndex < source.index) {
                setSelectedChapterIndex(selectedChapterIndex + 1);
            }
        }
    };

    // Image Management Functions
    const handleUploadFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const imgs: string[] = [];
        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const url = URL.createObjectURL(file);
            imgs.push(url);
        });
        if (imgs.length === 0) return;
        setUploadedImages((prev) => [...imgs, ...prev]);
        // Mirror AI Generation flow: send to Stock Media single view with the first image
        const first = imgs[0];
        setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
        setGeneratedImages([first]);
        setAiImagesEnabled(true);
        setRightTabIndex(0);
    };

    const handleGenerateImages = async () => {
        try {
            setImagesLoading(true);
            const visuals = aiPrompt;
            const res = await fetch('/api/generate-images', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visuals })
            });
            const data = await res.json();
            const imgs: string[] = Array.isArray(data?.images) && data.images.length > 0 ? data.images : [fallbackImages[selectedChapterIndex % fallbackImages.length]];
            const first = imgs[0];
            setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
            setGeneratedImages([first]);
            setAiImagesEnabled(true);
            setRightTabIndex(0);
        } catch (e) {
            console.error('AI generate failed', e);
            const first = fallbackImages[selectedChapterIndex % fallbackImages.length];
            setChapterImagesMap(prev => ({ ...prev, [selectedChapterIndex]: [first, ...(prev[selectedChapterIndex] || [])] }));
            setGeneratedImages([first]);
            setRightTabIndex(0);
        } finally {
            setImagesLoading(false);
        }
    };

    const handleImageSelect = (imageUrl: string) => {
        setGeneratedImages([imageUrl]);
    };

    const handleImageDeselect = (imageUrl: string) => {
        setGeneratedImages(generatedImages.filter(img => img !== imageUrl));
    };

    const handleDownloadImage = (src: string, idx: number) => {
        HelperFunctions.downloadImage(src, idx);
    };

    const handleTriggerFileUpload = () => {
        HelperFunctions.triggerFileUpload();
    };

    const selectChapter = (idx: number) => {
        setSelectedChapterIndex(idx);
        if (aiImagesEnabled) {
            const imgs = chapterImagesMap[idx] || [];
            const fallback = [fallbackImages[idx % fallbackImages.length]];
            setGeneratedImages(imgs.length > 0 ? [imgs[0]] : fallback);
        } else {
            setGeneratedImages(fallbackImages);
        }
    };

    if (initializing) {
        return (
            <AppLoadingOverlay />
        );
    }

    if (!scriptData) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    No script data found. Please go back and generate a script first.
                </Alert>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={handleGoBack}
                >
                    Back to Script Generation
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" >
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={handleGoBack}
                    size="small"
                >
                    Back
                </Button>
                <Typography variant="h6" color="text.secondary">
                    Your script has been approved! Now let's bring it to life.
                </Typography>
            </Box>

            <Grid container spacing={3}>

                {/* Right Column: Script & Chapters */}
                <Grid item xs={12} lg={12}>

                    {/* Script Title in Bold */}
                    {scriptData.title && (
                        <Box sx={{ mb: 2, textAlign: 'center' }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: 'primary.main',
                                    mb: 2,
                                    lineHeight: HelperFunctions.isRTLLanguage(scriptData.language) ? 2.5 : 1.7,
                                    fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData.language),
                                    ...HelperFunctions.getDirectionSx(scriptData.language)
                                }}
                            >
                                {scriptData.title}
                            </Typography>
                            <Box sx={{ width: '60px', height: '3px', bgcolor: 'primary.main', mx: 'auto', borderRadius: 2 }} />
                        </Box>
                    )}

                    {/* Script Components Breakdown */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                            📋 Script Scenes Breakdown
                        </Typography>

                        {scriptData.hook && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
                                        🎯 Hook
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, }}>
                                        {(() => {
                                            const words = scriptData.hook.trim().split(/\s+/).filter(w => w.length > 0).length;
                                            const duration = calculateParagraphDuration(words);
                                            return (
                                                <>
                                                    <Chip label={duration} size="small" color="success" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                                    <Chip label={`${words} words`} size="small" color="info" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: `1px solid ${SUCCESS.main}` }}>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 400, fontSize: '1rem', fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData.language), lineHeight: HelperFunctions.isRTLLanguage(scriptData.language) ? 2.5 : 1.7, ...HelperFunctions.getDirectionSx(scriptData.language) }}>
                                        {scriptData.hook}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        {scriptData.mainContent && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main' }}>
                                        📝 Main Content
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {(() => {
                                            const words = scriptData.mainContent.trim().split(/\s+/).filter(w => w.length > 0).length;
                                            const duration = calculateParagraphDuration(words);
                                            return (
                                                <>
                                                    <Chip label={duration} size="small" color="success" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                                    <Chip label={`${words} words`} size="small" color="info" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: `1px solid ${INFO.main}` }}>
                                    <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', fontSize: '1rem', fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData.language), lineHeight: HelperFunctions.isRTLLanguage(scriptData.language) ? 2.5 : 1.7, ...HelperFunctions.getDirectionSx(scriptData.language) }}>
                                        {scriptData.mainContent}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        {scriptData.conclusion && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                                        🎬 Conclusion
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {(() => {
                                            const words = scriptData.conclusion.trim().split(/\s+/).filter(w => w.length > 0).length;
                                            const duration = calculateParagraphDuration(words);
                                            return (
                                                <>
                                                    <Chip label={duration} size="small" color="success" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                                    <Chip label={`${words} words`} size="small" color="info" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: `1px solid ${WARNING.main}` }}>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 400, fontSize: '1rem', fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData.language), lineHeight: HelperFunctions.isRTLLanguage(scriptData.language) ? 2.5 : 1.7, ...HelperFunctions.getDirectionSx(scriptData.language) }}>
                                        {scriptData.conclusion}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}

                        {scriptData.callToAction && (
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                                        📢 Call to Action
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {(() => {
                                            const words = scriptData.callToAction.trim().split(/\s+/).filter(w => w.length > 0).length;
                                            const duration = calculateParagraphDuration(words);
                                            return (
                                                <>
                                                    <Chip label={duration} size="small" color="success" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                                                    <Chip label={`${words} words`} size="small" color="info" sx={{ fontSize: '0.65rem', height: 18 }} />
                                                </>
                                            );
                                        })()}
                                    </Box>
                                </Box>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: `1px solid ${SPECIAL.purple}` }}>
                                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 400, fontSize: '1rem', fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData.language), lineHeight: HelperFunctions.isRTLLanguage(scriptData.language) ? 2.5 : 1.7, ...HelperFunctions.getDirectionSx(scriptData.language) }}>
                                        {scriptData.callToAction}
                                    </Typography>
                                </Paper>
                            </Box>
                        )}
                    </Paper>

                    {/* Chapters Section */}
                    {chapters.length > 0 && (
                        <ChaptersSection
                            chaptersGenerated={true}
                            generatingChapters={false}
                            chapters={chapters}
                            editingChapter={editingChapter}
                            editHeading={editHeading}
                            editNarration={editNarration}
                            selectedChapterIndex={selectedChapterIndex}
                            rightTabIndex={rightTabIndex}
                            aiImagesEnabled={aiImagesEnabled}
                            imagesLoading={imagesLoading}
                            generatedImages={generatedImages}
                            aiPrompt={aiPrompt}
                            pickerOpen={pickerOpen}
                            pickerChapterIndex={pickerChapterIndex}
                            pickerNarrations={pickerNarrations}
                            pickerLoading={pickerLoading}
                            uploadedImages={uploadedImages}
                            isDraggingUpload={isDraggingUpload}
                            chapterImagesMap={chapterImagesMap}
                            onChaptersUpdate={setChapters}
                            onAddChapterAfter={handleAddChapterAfter}
                            onDeleteChapter={handleDeleteChapter}
                            onSaveEdit={handleSaveEdit}
                            onCancelEdit={handleCancelEdit}
                            onEditHeadingChange={setEditHeading}
                            onEditNarrationChange={setEditNarration}
                            onStartEdit={handleEditChapter}
                            onDragEnd={handleDragEnd}
                            onSelectChapter={selectChapter}
                            onRightTabChange={setRightTabIndex}
                            onAIPromptChange={setAiPrompt}
                            onUseAIChange={setAiImagesEnabled}
                            onGenerateImages={handleGenerateImages}
                            onImageSelect={handleImageSelect}
                            onImageDeselect={handleImageDeselect}
                            onDownloadImage={handleDownloadImage}
                            onTriggerFileUpload={handleTriggerFileUpload}
                            onUploadFiles={handleUploadFiles}
                            onPickerOpen={setPickerOpen}
                            onPickerChapterIndex={setPickerChapterIndex}
                            onPickerLoading={setPickerLoading}
                            onPickerNarrations={setPickerNarrations}
                            onChapterImagesMapChange={setChapterImagesMap}
                            onGeneratedImagesChange={setGeneratedImages}
                            onRightTabIndexChange={setRightTabIndex}
                            mediaManagementOpen={mediaManagementOpen}
                            mediaManagementChapterIndex={mediaManagementChapterIndex}
                            onMediaManagementOpen={setMediaManagementOpen}
                            onMediaManagementChapterIndex={setMediaManagementChapterIndex}
                            language={scriptData.language}
                            onGoogleImagePreview={(imageUrl) => {
                                // Open the image in a new tab for preview
                                window.open(imageUrl, '_blank');
                            }}
                        />
                    )}

                    {/* Production Actions */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                            🎬 Production Actions
                        </Typography>

                        {/* Other Actions */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadAllNarrations}
                                    disabled={!chapters.length}
                                    sx={{ mb: 1, fontSize: '1rem' }}
                                >
                                    Download Narrations
                                </Button>
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ position: 'relative' }}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<UploadIcon />}
                                        onClick={handleUploadChromaKey}
                                        disabled={!chapters.length || uploadingChromaKey}
                                        sx={{ mb: 1, fontSize: '1rem' }}
                                    >
                                        {uploadingChromaKey ? 'Uploading...' : (chromaKeyFile ? 'Replace Chroma Key' : 'Upload Chroma Key')}
                                    </Button>

                                    {/* Upload Progress */}
                                    {uploadingChromaKey && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={chromaKeyUploadProgress}
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: 2,
                                                borderRadius: 0
                                            }}
                                        />
                                    )}

                                    {/* Chroma Key Status */}
                                    {chromaKeyFile && !uploadingChromaKey && (
                                        <Chip
                                            label={chromaKeyFile.name.length > 20 ? `${chromaKeyFile.name.substring(0, 20)}...` : chromaKeyFile.name}
                                            size="small"
                                            color="success"
                                            sx={{
                                                position: 'absolute',
                                                top: -8,
                                                right: 8,
                                                fontSize: '0.6rem',
                                                height: 18,
                                                '& .MuiChip-label': {
                                                    px: 0.5
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>

                            {/* Google Drive Upload Button */}
                            <Grid item xs={12}>
                                <Box sx={{ position: 'relative' }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<UploadIcon />}
                                        onClick={() => uploadToGoogleDrive(chapters)}
                                        disabled={!chapters.length || uploadingToDrive}
                                        sx={{
                                            mb: 1,
                                            fontSize: '1rem',
                                            background: INFO.main,
                                            '&:hover': {
                                                background: INFO.dark
                                            }
                                        }}
                                    >
                                        {uploadingToDrive ? 'Uploading to Google Drive...' : 'Upload JSON to Google Drive'}
                                    </Button>

                                    {/* Upload Progress */}
                                    {uploadingToDrive && (
                                        <LinearProgress
                                            sx={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: 2,
                                                borderRadius: 0
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>

                            {/* Google Drive Upload Success */}
                            {driveUploadResult && (
                                <Grid item xs={12}>
                                    <Alert
                                        severity="success"
                                        sx={{ mb: 1 }}
                                        action={
                                            <Button
                                                size="small"
                                                component="a"
                                                href={driveUploadResult.fileUrl || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open File
                                            </Button>
                                        }
                                    >
                                        Successfully uploaded "{driveUploadResult.fileName}" to Google Drive!
                                    </Alert>
                                </Grid>
                            )}

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<VideoIcon />}
                                    onClick={handleGenerateVideo}
                                    disabled={!chapters.length || !chromaKeyFile || uploadingChromaKey}
                                    sx={{
                                        bgcolor: SUCCESS.main,
                                        '&:hover': { bgcolor: SUCCESS.dark },
                                        mb: 1,
                                        fontSize: '1rem'
                                    }}
                                    title={!chromaKeyFile ? 'Upload chroma key first' : ''}
                                >
                                    Generate Video
                                </Button>
                            </Grid>

                            {/* <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRegenerateAllAssets}
                                    disabled={!chapters.length || generatingChapters}
                                    sx={{
                                                                borderColor: WARNING.main,
                        color: WARNING.main,
                        '&:hover': { bgcolor: HOVER.warning }
                                    }}
                                >
                                    Regenerate Assets
                                </Button>
                            </Grid> */}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ScriptProductionClient;
