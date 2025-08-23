import React from 'react';
import { useRouter } from 'next/router';
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
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField
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
import { getDirectionSx, isRTLLanguage } from '../src/utils/languageUtils';
import { toast } from 'react-toastify';
import { apiService } from '../src/utils/apiService';
import { Chapter } from '../src/types/chapters';
import ChaptersSection from '../src/components/TrendingTopics/ChaptersSection';
import { HelperFunctions } from '../src/utils/helperFunctions';
import { DropResult } from 'react-beautiful-dnd';
import { fallbackImages } from '../src/data/mockImages';

interface ScriptData {
    script: string;
    topic: string;
    hypothesis: string;
    details: string;
    region: string;
    duration: string;
    language: string;
    selectedTopicSuggestions: string[];
    selectedHypothesisSuggestions: string[];
    // Additional script metadata
    title?: string;
    hook?: string;
    mainContent?: string;
    conclusion?: string;
    callToAction?: string;
    estimatedWords?: number;
    emotionalTone?: string;
    pacing?: string;
}

const ScriptProductionPage: React.FC = () => {
    const router = useRouter();
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);

    // Production states
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [generatingChapters, setGeneratingChapters] = useState(false);
    const [chaptersGenerated, setChaptersGenerated] = useState(false);
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

    // Duration calculation
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [scriptModified, setScriptModified] = useState(false);
    const [originalDuration, setOriginalDuration] = useState('');
    const [paragraphs, setParagraphs] = useState<Array<{
        text: string;
        duration: string;
        words: number;
        startTime: number;
        endTime: number;
        durationInSeconds: number;
    }>>([]);

    // Calculate estimated duration based on script content (average reading speed: 150-160 words per minute)
    const calculateDuration = (script: string): string => {
        if (!script.trim()) return '0';

        const words = script.trim().split(/\s+/).length;
        const averageWordsPerMinute = 155; // Average speaking/reading speed
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

    useEffect(() => {
        // Get script data from router query or localStorage
        const queryData = router.query;

        if (queryData.script) {
            // Try to get metadata from localStorage
            const metadata = localStorage.getItem('scriptMetadata');
            const scriptMetadata = metadata ? JSON.parse(metadata) : {};

            // Ensure the edited script content from router query takes priority
            const scriptContent = queryData.script as string;

            setScriptData({
                script: scriptContent, // This is the edited script content
                topic: queryData.topic as string || '',
                hypothesis: queryData.hypothesis as string || '',
                details: queryData.details as string || '',
                region: queryData.region as string || 'pakistan',
                duration: queryData.duration as string || '1',
                language: queryData.language as string || 'english',
                selectedTopicSuggestions: JSON.parse(queryData.selectedTopicSuggestions as string || '[]'),
                selectedHypothesisSuggestions: JSON.parse(queryData.selectedHypothesisSuggestions as string || '[]'),
                // Add metadata
                ...scriptMetadata
            });

            // Store the complete script data in localStorage for page refresh support
            const completeScriptData = {
                script: scriptContent,
                topic: queryData.topic as string || '',
                hypothesis: queryData.hypothesis as string || '',
                details: queryData.details as string || '',
                region: queryData.region as string || 'pakistan',
                duration: queryData.duration as string || '1',
                language: queryData.language as string || 'english',
                selectedTopicSuggestions: JSON.parse(queryData.selectedTopicSuggestions as string || '[]'),
                selectedHypothesisSuggestions: JSON.parse(queryData.selectedHypothesisSuggestions as string || '[]'),
                ...scriptMetadata
            };

            // Store in localStorage for refresh support
            localStorage.setItem('approvedScript', JSON.stringify(completeScriptData));

            // Clean up metadata after loading
            if (metadata) {
                localStorage.removeItem('scriptMetadata');
            }

        } else {
            // Try to get from localStorage as fallback
            const stored = localStorage.getItem('approvedScript');
            if (stored) {
                const storedData = JSON.parse(stored);
                setScriptData(storedData);

                localStorage.removeItem('approvedScript'); // Clean up
            }
        }
    }, [router.query]);

    // Additional useEffect to handle page refresh when router.query is empty
    useEffect(() => {
        // If no script data is set and router query is empty, try to get from localStorage
        if (!scriptData && Object.keys(router.query).length === 0) {
            const stored = localStorage.getItem('approvedScript');
            if (stored) {
                try {
                    const storedData = JSON.parse(stored);
                    setScriptData(storedData);
                    console.log('🔄 Loaded script data from localStorage on page refresh:', storedData);
                } catch (error) {
                    console.error('Error parsing stored script data:', error);
                }
            }
        }
    }, [scriptData, router.query]);

    // Cleanup function to remove old script data when component unmounts
    useEffect(() => {
        return () => {
            // Only clean up if we're not storing new data (i.e., user is leaving the page)
            if (scriptData) {
                // Keep the data for potential refresh, but clean up after a delay
                setTimeout(() => {
                    localStorage.removeItem('approvedScript');
                }, 5000); // Clean up after 5 seconds
            }
        };
    }, [scriptData]);

    // Calculate estimated duration when script data changes
    useEffect(() => {
        console.log('🟢 Script data:', scriptData);
        if (scriptData?.script) {
            setOriginalDuration(scriptData.duration);
            setEstimatedDuration(calculateDuration(scriptData.script));
            updateParagraphs(scriptData.script);
            setScriptModified(false); // Reset to false on initial load
        }
    }, [scriptData, scriptData?.duration]);

    // Recalculate paragraphs when duration changes
    useEffect(() => {
        if (scriptData?.script && scriptData?.duration) {
            updateParagraphs(scriptData.script);
        }
    }, [scriptData?.duration]);

    // Function to break down script into paragraphs and calculate individual durations
    const updateParagraphs = (script: string) => {
        if (!script.trim()) {
            setParagraphs([]);
            return;
        }

        // Split script into paragraphs (split by double newlines or single newlines)
        const scriptParagraphs = script
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // Calculate sequential time allocation for paragraphs
        const paragraphsWithTimeRanges = calculateSequentialTimeRanges(scriptParagraphs);

        setParagraphs(paragraphsWithTimeRanges);
    };

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

    // Format total duration from seconds
    const formatTotalDuration = (totalSeconds: number): string => {
        if (totalSeconds < 60) return `${totalSeconds}s`;
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
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
        router.push('/');
    };

    const handleGenerateChapters = async () => {
        if (!scriptData) return;

        try {
            setGeneratingChapters(true);
            setChapters([]);
            setChaptersGenerated(false);

            const result = await apiService.generateChapters({
                topic: scriptData.topic,
                hypothesis: scriptData.hypothesis,
                details: scriptData.details,
                region: scriptData.region,
                duration: scriptData.duration,
                selectedTopicSuggestions: scriptData.selectedTopicSuggestions,
                selectedHypothesisSuggestions: scriptData.selectedHypothesisSuggestions,
                topicDetails: scriptData.details
            });

            if (result.success && result.data?.chapters && Array.isArray(result.data.chapters)) {
                const chaptersWithEmptyMedia = result.data.chapters.map((chapter: Chapter) => ({
                    ...chapter,
                    media: { image: null, audio: null, video: null }
                }));

                setChapters(chaptersWithEmptyMedia);
                setChaptersGenerated(true);
                toast.success('Chapters generated successfully!');
            } else {
                toast.error(result.error || 'Failed to generate chapters');
            }
        } catch (err) {
            console.error('Error generating chapters:', err);
            toast.error('Failed to generate chapters. Please try again.');
        } finally {
            setGeneratingChapters(false);
        }
    };

    const handleDownloadAllNarrations = () => {
        if (!chapters.length) return;

        try {
            chapters.forEach((chapter, index) => {
                if (chapter.assets?.audio) {
                    // Create a download link for each audio file
                    const link = document.createElement('a');
                    link.href = chapter.assets.audio;
                    link.download = `chapter-${index + 1}-narration.mp3`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
            toast.success('Started downloading all narrations');
        } catch (error) {
            toast.error('Failed to download narrations');
        }
    };

    const handleUploadChromaKey = () => {
        // Create a file input for chroma key upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*';
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

    const handleRegenerateAllAssets = async () => {
        if (!chapters.length) {
            toast.error('No chapters available for asset regeneration');
            return;
        }

        try {
            setGeneratingChapters(true);
            console.log('Regenerating all assets for chapters:', chapters);

            // Call the same image generation function that's used during chapter creation
            const { generateChapterImages } = await import('../src/utils/chapterImageGenerator');
            const updatedChapters = await generateChapterImages(chapters);
            setChapters(updatedChapters);

            // Update generatedImages to include new AI images
            const newGeneratedImages = updatedChapters
                .map(chapter => chapter.assets?.image)
                .filter((image): image is string => Boolean(image));

            if (newGeneratedImages.length > 0) {
                setGeneratedImages(prev => [...prev, ...newGeneratedImages]);
            }

            toast.success('All assets regenerated successfully!');
        } catch (error) {
            console.error('Error regenerating assets:', error);
            toast.error('Error regenerating assets. Please try again.');
        } finally {
            setGeneratingChapters(false);
        }
    };

    // Chapter Management Functions
    const handleAddChapterAfter = (index: number) => {
        HelperFunctions.addChapterAfter(index, chapters, setChapters);
    };

    const handleDeleteChapter = (index: number) => {
        HelperFunctions.deleteChapter(index, chapters, setChapters);
    };

    const handleEditChapter = (index: number) => {
        setEditingChapter(index);
        setEditHeading(chapters[index].on_screen_text || '');
        setEditNarration(chapters[index].narration || '');
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

    // Update chapter durations when script changes
    const updateChapterDurations = (newEstimatedDuration: string) => {
        if (chapters.length === 0 || paragraphs.length === 0) return;

        // Use the actual paragraph-based timing instead of estimated duration
        const totalSeconds = paragraphs[paragraphs.length - 1].endTime;

        // Calculate duration per chapter (equal distribution)
        const secondsPerChapter = Math.floor(totalSeconds / chapters.length);
        const remainingSeconds = totalSeconds % chapters.length;

        const updatedChapters = chapters.map((chapter, index) => {
            // Give remaining seconds to first few chapters
            const chapterSeconds = secondsPerChapter + (index < remainingSeconds ? 1 : 0);
            const formattedDuration = HelperFunctions.formatDurationFromSeconds(chapterSeconds);

            return {
                ...chapter,
                duration: formattedDuration
            };
        });

        setChapters(updatedChapters);
        toast.success('Chapter durations updated to match new script length!');
    };

    // Helper function to parse duration string to seconds
    const parseDurationToSeconds = (duration: string): number => {
        if (!duration) return 0;

        // Handle formats like "1m 30s", "2m", "45s", "1h 15m"
        const timeParts = duration.match(/(\d+)([hms])/g);
        if (!timeParts) return 0;

        let totalSeconds = 0;
        timeParts.forEach(part => {
            const value = parseInt(part.replace(/[hms]/g, ''));
            const unit = part.slice(-1);

            switch (unit) {
                case 'h':
                    totalSeconds += value * 3600;
                    break;
                case 'm':
                    totalSeconds += value * 60;
                    break;
                case 's':
                    totalSeconds += value;
                    break;
            }
        });

        return totalSeconds;
    };

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
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={handleGoBack}
                    size="small"
                >
                    Back
                </Button>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                    Script Production Pipeline
                </Typography>
            </Box>

            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                Your script has been approved! Now let's bring it to life.
            </Typography>

            <Grid container spacing={3}>
                {/* Left Column: Script & Details */}
                <Grid item xs={12} lg={4}>
                    {/* Script Summary */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                            📝 Approved Script Details
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">Topic:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{scriptData.topic}</Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">Hypothesis:</Typography>
                            <Typography variant="body1">{scriptData.hypothesis}</Typography>
                        </Box>



                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">Original Duration:</Typography>
                            <Typography variant="body1">{originalDuration} minute(s)</Typography>
                        </Box>

                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                            <Typography variant="subtitle2" color="text.secondary">
                                {scriptModified ? 'Updated Duration:' : 'Estimated Duration:'}
                            </Typography>
                            <Chip
                                label={scriptModified ? (paragraphs.length > 0 ? formatTotalDuration(paragraphs[paragraphs.length - 1].endTime) : estimatedDuration) : `${originalDuration} minute(s)`}
                                size="small"
                                color={scriptModified ? 'warning' : 'success'}
                                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                            />
                            {scriptModified && (
                                <Chip
                                    label="Modified"
                                    size="small"
                                    color="info"
                                    sx={{ fontSize: '0.65rem', height: 18 }}
                                />
                            )}
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">Region:</Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{scriptData.region}</Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">Language:</Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{scriptData.language}</Typography>
                        </Box>

                        {/* Script Metadata */}
                        {scriptData.title && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Script Title:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>{scriptData.title}</Typography>
                            </Box>
                        )}

                        {scriptData.emotionalTone && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Emotional Tone:</Typography>
                                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{scriptData.emotionalTone}</Typography>
                            </Box>
                        )}

                        {scriptData.pacing && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Pacing:</Typography>
                                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{scriptData.pacing}</Typography>
                            </Box>
                        )}

                        {scriptData.estimatedWords && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Estimated Words:</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{scriptData.estimatedWords} words</Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Paragraph Breakdown */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                            📊 Paragraph Breakdown
                        </Typography>

                        {paragraphs.length > 0 ? (
                            <Box>
                                {paragraphs.map((paragraph, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            bgcolor: '#fafafa',
                                            '&:hover': { bgcolor: '#f5f5f5' }
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                                                Paragraph {index + 1}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={paragraph.duration}
                                                    size="small"
                                                    color="success"
                                                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                                                />
                                                <Chip
                                                    label={`${paragraph.words} words`}
                                                    size="small"
                                                    color="info"
                                                    sx={{ fontSize: '0.65rem', height: 18 }}
                                                />
                                            </Box>
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontSize: '0.8rem',
                                                lineHeight: 1.4,
                                                color: 'text.secondary',
                                                fontFamily: isRTLLanguage(scriptData.language)
                                                    ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                                                    : '"Roboto", "Arial", sans-serif',
                                                ...getDirectionSx(scriptData.language)
                                            }}
                                        >
                                            {paragraph.text.length > 150
                                                ? `${paragraph.text.substring(0, 150)}...`
                                                : paragraph.text
                                            }
                                        </Typography>
                                    </Box>
                                ))}

                                <Box sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: '#e3f2fd',
                                    borderRadius: 1,
                                    border: '1px solid #2196f3',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                                        Total
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip
                                            label={paragraphs.length > 0 ? formatTotalDuration(paragraphs[paragraphs.length - 1].endTime) : estimatedDuration}
                                            size="small"
                                            color="primary"
                                            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                                        />
                                        <Chip
                                            label={`${paragraphs.reduce((sum, p) => sum + p.words, 0)} words`}
                                            size="small"
                                            color="primary"
                                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{
                                p: 3,
                                textAlign: 'center',
                                color: 'text.secondary',
                                bgcolor: '#f5f5f5',
                                borderRadius: 1
                            }}>
                                <Typography variant="body2">
                                    No paragraphs detected. Start typing your script to see the breakdown.
                                </Typography>
                            </Box>
                        )}
                    </Paper>

                    {/* Production Actions */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                            🎬 Production Actions
                        </Typography>

                        {/* Generate Chapters */}
                        <Box sx={{ mb: 3 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                startIcon={generatingChapters ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <ChapterIcon />}
                                onClick={handleGenerateChapters}
                                disabled={generatingChapters}
                                sx={{
                                    bgcolor: '#1DA1F2',
                                    '&:hover': { bgcolor: '#0d8bd9' },
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    mb: 1
                                }}
                            >
                                {generatingChapters ? 'Generating Chapters...' : 'Generate Chapters'}
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                Break down your script into video chapters
                            </Typography>
                        </Box>

                        {/* Update Chapter Durations */}
                        {scriptModified && chapters.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    size="medium"
                                    startIcon={<TimeIcon />}
                                    onClick={() => updateChapterDurations('')}
                                    disabled={generatingChapters}
                                    sx={{
                                        borderColor: '#ff9800',
                                        color: '#ff9800',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                                            borderColor: '#f57c00'
                                        },
                                        py: 1,
                                        fontSize: '0.9rem',
                                        fontWeight: 500
                                    }}
                                >
                                    Update Chapter Durations
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                    Sync chapter times with updated script length
                                </Typography>
                            </Box>
                        )}

                        {/* Other Actions */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadAllNarrations}
                                    disabled={!chapters.length || generatingChapters}
                                    sx={{ mb: 1 }}
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
                                        disabled={!chapters.length || generatingChapters || uploadingChromaKey}
                                        sx={{ mb: 1 }}
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

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    startIcon={<VideoIcon />}
                                    onClick={handleGenerateVideo}
                                    disabled={!chapters.length || generatingChapters || !chromaKeyFile || uploadingChromaKey}
                                    sx={{
                                        bgcolor: '#4caf50',
                                        '&:hover': { bgcolor: '#388e3c' },
                                        mb: 1
                                    }}
                                    title={!chromaKeyFile ? 'Upload chroma key first' : ''}
                                >
                                    Generate Video
                                </Button>
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRegenerateAllAssets}
                                    disabled={!chapters.length || generatingChapters}
                                    sx={{
                                        borderColor: '#ff9800',
                                        color: '#ff9800',
                                        '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.1)' }
                                    }}
                                >
                                    Regenerate Assets
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Right Column: Script & Chapters */}
                <Grid item xs={12} lg={8}>
                    {/* Approved Script */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                                📄 Approved Script Content
                            </Typography>
                            {/* <Button
                                variant="outlined"
                                size="small"
                                startIcon={scriptModified ? <EditIcon /> : <EditIcon />}
                                onClick={() => setScriptModified(!scriptModified)}
                                sx={{
                                    borderColor: scriptModified ? '#ff9800' : '#1976d2',
                                    color: scriptModified ? '#ff9800' : '#1976d2',
                                    '&:hover': {
                                        bgcolor: scriptModified ? 'rgba(255, 152, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)'
                                    }
                                }}
                            >
                                {scriptModified ? 'View Script' : 'Edit Script'}
                            </Button> */}
                        </Box>

                        {/* Script Title in Bold */}
                        {scriptData.title && (
                            <Box sx={{ mb: 3, textAlign: 'center' }}>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: 'primary.main',
                                        mb: 2,
                                        fontFamily: isRTLLanguage(scriptData.language)
                                            ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                                            : '"Roboto", "Arial", sans-serif',
                                        ...getDirectionSx(scriptData.language)
                                    }}
                                >
                                    {scriptData.title}
                                </Typography>
                                <Box sx={{ width: '60px', height: '3px', bgcolor: 'primary.main', mx: 'auto', borderRadius: 2 }} />
                            </Box>
                        )}



                        {scriptModified ? (
                            <Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={12}
                                    variant="outlined"
                                    value={scriptData.script}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const newScript = e.target.value;
                                        setScriptData(prev => prev ? { ...prev, script: newScript } : null);
                                        setEstimatedDuration(calculateDuration(newScript));
                                        updateParagraphs(newScript);
                                        setScriptModified(true);
                                    }}
                                    placeholder="Edit your script content..."
                                    sx={{
                                        '& .MuiInputBase-root': {
                                            fontFamily: isRTLLanguage(scriptData.language)
                                                ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                                                : '"Roboto", "Arial", sans-serif',
                                            fontSize: '0.9rem',
                                            lineHeight: 1.7,
                                            ...getDirectionSx(scriptData.language)
                                        }
                                    }}
                                />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {scriptData.script.trim().split(/\s+/).filter(word => word.length > 0).length} words
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimeIcon sx={{ fontSize: '0.9rem', color: 'success.main' }} />
                                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                                            Live: {paragraphs.length > 0 ? formatTotalDuration(paragraphs[paragraphs.length - 1].endTime) : estimatedDuration}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    bgcolor: '#f8f9fa',
                                    border: '1px solid #e9ecef',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                    ...getDirectionSx(scriptData.language)
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.7,
                                        fontSize: '0.9rem',
                                        fontFamily: isRTLLanguage(scriptData.language)
                                            ? '"Noto Sans Arabic", "Noto Nastaliq Urdu", "Arial Unicode MS", sans-serif'
                                            : '"Roboto", "Arial", sans-serif',
                                        ...getDirectionSx(scriptData.language)
                                    }}
                                >
                                    {scriptData.script}
                                </Typography>

                            </Paper>
                        )}
                    </Paper>

                    {/* Script Components Breakdown */}
                    {(scriptData.hook || scriptData.mainContent || scriptData.conclusion || scriptData.callToAction) && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 3, color: 'primary.main' }}>
                                📋 Script Components
                            </Typography>

                            {scriptData.hook && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main', mb: 1 }}>
                                        🎯 Hook (First 15 seconds)
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0f8f0', border: '1px solid #4caf50' }}>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            {scriptData.hook}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {scriptData.mainContent && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'info.main', mb: 1 }}>
                                        📝 Main Content
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f0f8ff', border: '1px solid #2196f3' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {scriptData.mainContent}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {scriptData.conclusion && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'warning.main', mb: 1 }}>
                                        🎬 Conclusion
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff8f0', border: '1px solid #ff9800' }}>
                                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                            {scriptData.conclusion}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}

                            {scriptData.callToAction && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'secondary.main', mb: 1 }}>
                                        📢 Call to Action
                                    </Typography>
                                    <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f0ff', border: '1px solid #9c27b0' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {scriptData.callToAction}
                                        </Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Paper>
                    )}

                    {/* Chapters Section */}
                    {chapters.length > 0 && (
                        <ChaptersSection
                            chapters={chapters}
                            chaptersGenerated={chaptersGenerated}
                            generatingChapters={generatingChapters}
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
                            onGenerateChapters={handleGenerateChapters}
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
                        />
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default ScriptProductionPage;
