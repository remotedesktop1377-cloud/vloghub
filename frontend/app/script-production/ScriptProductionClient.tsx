'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    VideoCall as VideoIcon,
    Refresh as RefreshIcon,
    Movie as ChapterIcon,
    AccessTime as TimeIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { HelperFunctions } from '@/utils/helperFunctions';
import { toast } from 'react-toastify';
import { secure } from '@/utils/helperFunctions';
import { getDirectionSx, isRTLLanguage } from '@/utils/languageUtils';
import { API_ENDPOINTS } from '../../src/config/apiEndpoints';
import { Chapter } from '@/types/chapters';
import ChaptersSection from '@/components/TrendingTopicsComponent/ChaptersSection';
import { DropResult } from 'react-beautiful-dnd';
import { fallbackImages } from '@/data/mockImages';
import { SUCCESS } from '@/styles/colors';
import { ROUTES_KEYS } from '@/data/constants';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

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
    const [noScriptFound, setNoScriptFound] = useState<boolean>(false);

    // Script approval states
    const [isScriptApproved, setIsScriptApproved] = useState(false);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');

    // Navigation confirmation states
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);

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
    const [loading, setLoading] = useState(false);
    const [uploadingCompleted, setUploadingCompleted] = useState(false);
    const [selectedText, setSelectedText] = useState<{ chapterIndex: number; text: string; startIndex: number; endIndex: number } | null>(null);
    const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);

    // Function to upload JSON to Google Drive
    const uploadToGoogleDrive = async (chapters: Chapter[]) => {
        if (!scriptData) {
            toast.error('No script data available to upload');
            return;
        }

        setLoading(true);
        try {
            // Ensure each chapter has assets.images populated with all selected sources
            const chaptersForUpload: Chapter[] = chapters.map((ch) => {
                const existingImages = Array.isArray(ch.assets?.images) ? ch.assets!.images! : [];
                const googleImages = Array.isArray(ch.assets?.imagesGoogle) ? ch.assets!.imagesGoogle! : [];
                const envatoImages = Array.isArray(ch.assets?.imagesEnvato) ? ch.assets!.imagesEnvato! : [];
                const keywordImages = HelperFunctions.extractImageUrlsFromKeywordsSelected(ch.keywordsSelected as any);
                const combined = Array.from(new Set([
                    ...existingImages,
                    ...googleImages,
                    ...envatoImages,
                    ...keywordImages,
                ].filter(Boolean)));
                return {
                    ...ch,
                    assets: {
                        ...ch.assets,
                        images: combined,
                        imagesGoogle: googleImages,
                        imagesEnvato: envatoImages,
                    }
                } as Chapter;
            });

            const scriptProductionJSON = {
                project: {
                    topic: scriptData?.topic || null,
                    title: scriptData?.title || null,
                    description: scriptData?.description || null,
                    duration: parseInt(scriptData?.duration || '1') || null,
                    resolution: '1920x1080',
                    region: scriptData?.region || null,
                    language: scriptData?.language || null,
                    subtitleLanguage: scriptData?.subtitleLanguage || null,
                    narrationType: scriptData?.narrationType || null,
                },
                // Use chaptersForUpload to ensure merged images are included
                script: chaptersForUpload.map(chapter => ({
                    id: chapter.id,
                    narration: chapter.narration,
                    duration: chapter.duration,
                    durationInSeconds: chapter.durationInSeconds,
                    words: chapter.words,
                    startTime: chapter.startTime,
                    endTime: chapter.endTime,
                    highlightedKeywords: chapter.highlightedKeywords || [],
                    keywordsSelected: chapter.keywordsSelected || {},
                    assets: {
                        images: chapter.assets?.images || [],
                        imagesGoogle: chapter.assets?.imagesGoogle || [],
                        imagesEnvato: chapter.assets?.imagesEnvato || []
                    },
                })),
            };

            // console.log('scriptProductionJSON', scriptProductionJSON);

            const now = new Date();
            const timestamp = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;

            const jobId = HelperFunctions.generateRandomId();
            const folderName = `job-${jobId}-${timestamp}`; // <-- folder only, no ".json"
            const fileName = `project-config.json`;

            const form = new FormData();
            form.append('folderName', folderName);
            form.append('fileName', fileName);
            form.append('jsonData', JSON.stringify(scriptProductionJSON));

            // Add chroma key file if available
            if (chromaKeyFile) {
                form.append('file', chromaKeyFile);
            }

            const response = await fetch(API_ENDPOINTS.GOOGLE_DRIVE_UPLOAD, {
                method: 'POST',
                body: form,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.details || err.error || 'Failed to upload to Google Drive');
            }

            const result = await response.json();
            // console.log('Drive result:', result);

            setShowBackConfirmation(true);
            setUploadingCompleted(true);
        } catch (e: any) {
            console.error(e);
            toast.error(`Failed to upload to Google Drive: ${e?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Function to break down script into paragraphs and calculate individual durations
    const updateParagraphs = (scriptData: ScriptData) => {
        // Split script into paragraphs (split by double newlines or single newlines)

        const scriptParagraphs = scriptData.script
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // Calculate sequential time allocation for paragraphs
        const paragraphsWithTimeRanges = calculateSequentialTimeRanges(scriptParagraphs);

        // If chapters with images already exist in approvedScript, reuse them
        try {
            const stored = secure.j.approvedScript.get();
            const storedData = typeof stored === 'string' ? JSON.parse(stored) : stored;
            if (storedData && Array.isArray(storedData.chapters) && storedData.chapters.length === paragraphsWithTimeRanges.length) {
                const normalizedFromStorage: Chapter[] = storedData.chapters.map((ch: any, index: number) => ({
                    id: ch.id || `scene-${index + 1}`,
                    narration: ch.narration || paragraphsWithTimeRanges[index].text,
                    duration: ch.duration || paragraphsWithTimeRanges[index].duration,
                    words: ch.words ?? paragraphsWithTimeRanges[index].words,
                    startTime: ch.startTime ?? paragraphsWithTimeRanges[index].startTime,
                    endTime: ch.endTime ?? paragraphsWithTimeRanges[index].endTime,
                    durationInSeconds: ch.durationInSeconds ?? paragraphsWithTimeRanges[index].durationInSeconds,
                    highlightedKeywords: ch.highlightedKeywords ?? paragraphsWithTimeRanges[index].highlightedKeywords,
                    keywordsSelected: ch.keywordsSelected ?? {},
                    assets: {
                        image: ch.assets?.image || (Array.isArray(ch.assets?.images) && ch.assets.images.length > 0 ? ch.assets.images[0] : null),
                        audio: ch.assets?.audio || null,
                        video: ch.assets?.video || null,
                        images: ch.assets?.images || [],
                        imagesGoogle: ch.assets?.imagesGoogle || [],
                        imagesEnvato: ch.assets?.imagesEnvato || [],
                    }
                }));
                setChapters(normalizedFromStorage);
                return;
            }
        } catch { }

        // Map to Chapter[] with required fields
        const chaptersAsRequired: Chapter[] = paragraphsWithTimeRanges.map((p, index) => ({
            id: `scene-${index + 1}`,
            narration: p.text,
            duration: p.duration,
            words: p.words,
            startTime: p.startTime,
            endTime: p.endTime,
            durationInSeconds: p.durationInSeconds,
            keywordsSelected: {},
            assets: { image: null, audio: null, video: null, images: [], imagesGoogle: [], imagesEnvato: [] }
        }));

        setChapters(chaptersAsRequired);
    };

    useEffect(() => {
        // Load from secure storage - check metadata first, then approved script
        let storedData = null;
        let isApproved = false;
        setLoading(true);

        // First try to load from metadata (for unapproved scripts)
        try {
            const storedMetadata = secure.j.scriptMetadata.get();
            if (storedMetadata && typeof storedMetadata === 'object') {
                storedData = storedMetadata;
                // setScriptSectionData(storedMetadata);
                isApproved = false; // Has metadata, so not approved yet
            }
        } catch (error) {
            console.warn('Error parsing script metadata:', error);
        }

        // If no metadata, try to load from approved script
        if (!storedData) {
            try {
                const stored = secure.j.approvedScript.get();
                if (stored) {
                    storedData = typeof stored === 'string' ? JSON.parse(stored) : stored;
                    isApproved = true; // No metadata but has approved script, so it's approved
                }
            } catch (e) {
                console.error('Failed to parse stored approved script data', e);
            }
        }
        // console.log('storedData', JSON.stringify(storedData));
        if (storedData) {
            setLoading(false);
            setScriptData(storedData);
            setEditedScript(storedData.script || '');
            setIsScriptApproved(isApproved);
        } else {
            setNoScriptFound(true);
            setLoading(false);
        }

    }, []);

    // Calculate estimated duration when script data changes
    useEffect(() => {
        if (scriptData) {
            setEstimatedDuration(HelperFunctions.calculateDuration(scriptData.script));
            updateParagraphs(scriptData);
        }
    }, [scriptData]);

    // Calculate estimated duration when script data changes
    useEffect(() => {
        if (chapters && chapters.length > 0) {
            // save updated chapters
            secure.j.approvedScript.set({ ...scriptData, chapters });
            // console.log('chapters saved to approvedScript');
        }
    }, [chapters]);

    // Handle browser back button
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isScriptApproved) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        const handlePopState = (e: PopStateEvent) => {
            if (!isScriptApproved) {
                e.preventDefault();
                window.history.pushState(null, '', window.location.href);
                setShowBackConfirmation(true);
            }
        };

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        // Push current state to history to handle back button
        if (!isScriptApproved) {
            window.history.pushState(null, '', window.location.href);
        }

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isScriptApproved]);

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
                durationInSeconds,
                highlightedKeywords: []
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

    const handleDownloadAllNarrations = () => {
        if (!chapters.length) return;

        try {
            // Build script content in the same structured format used in approval
            let content = '';
            if (scriptData) {
                const parts: string[] = [];
                const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData.language || 'english');
                if (scriptData.title && scriptData.title.trim()) {
                    parts.push(`📋 ${headers.title}:\n${scriptData.title.trim()}`);
                }
                if (scriptData.hook && scriptData.hook.trim()) {
                    parts.push(`🎯 ${headers.hook}:\n${scriptData.hook.trim()}`);
                }
                if (scriptData.mainContent && scriptData.mainContent.trim()) {
                    parts.push(`📝 ${headers.mainContent}:\n${scriptData.mainContent.trim()}`);
                }
                if (scriptData.conclusion && scriptData.conclusion.trim()) {
                    parts.push(`🏁 ${headers.conclusion}:\n${scriptData.conclusion.trim()}`);
                }
                if (scriptData.callToAction && scriptData.callToAction.trim()) {
                    parts.push(`🚀 ${headers.callToAction}:\n${scriptData.callToAction.trim()}`);
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
        uploadToGoogleDrive(chapters);
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

    const handleSaveScript = () => {
        // Combine all sections into a single script
        const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english');
        const combinedScript = [
            scriptData?.title && `${headers.title}:\n${scriptData?.title}`,
            scriptData?.hook && `${headers.hook}:\n${scriptData?.hook}`,
            scriptData?.mainContent && `${headers.mainContent}:\n${scriptData?.mainContent}`,
            scriptData?.conclusion && `${headers.conclusion}:\n${scriptData?.conclusion}`,
            scriptData?.callToAction && `${headers.callToAction}:\n${scriptData?.callToAction}`
        ].filter(Boolean).join('\n\n');

        // Update the edited script state
        setEditedScript(combinedScript);

        // Update script data
        if (scriptData) {
            const updatedScriptData = {
                ...scriptData,
                script: combinedScript
            };
            setScriptData(updatedScriptData);
            secure.j.approvedScript.set(updatedScriptData);
        }

        setIsEditingScript(false);
        toast.success('Script updated successfully!');
    };

    const handleCancelEditingScript = () => {
        // Reset edited script to original
        setEditedScript(scriptData?.script || '');

        // Reset script section data to original values from secure storage
        try {
            const storedMetadata = secure.j.scriptMetadata.get();
            if (storedMetadata && typeof storedMetadata === 'object') {
                setScriptData(storedMetadata);
            } else {
                // If no stored metadata, clear the section data
                setScriptData(null);
            }
        } catch (error) {
            console.warn('Error restoring script metadata:', error);
            setScriptData(null);
        }

        // Exit editing mode
        setIsEditingScript(false);

        toast.info('Changes cancelled - script restored to original');
    };

    // Script approval functions
    const handleStartEditingScript = () => {
        setIsEditingScript(true);
        setEditedScript(scriptData?.script || '');

        // Parse the current script to populate scriptSectionData for editing
        const currentScript = editedScript || scriptData?.script || '';
        const lines = currentScript.split('\n');
        const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english');

        let currentSection = '';
        let currentContent = '';
        const newScriptData: any = { ...scriptData };

        for (const line of lines) {
            if (line.includes(headers.title)) {
                currentSection = 'title';
                currentContent = '';
            } else if (line.includes(headers.hook)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'hook';
                currentContent = '';
            } else if (line.includes(headers.mainContent)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'mainContent';
                currentContent = '';
            } else if (line.includes(headers.conclusion)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'conclusion';
                currentContent = '';
            } else if (line.includes(headers.callToAction)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'callToAction';
                currentContent = '';
            } else if (line.trim() && currentSection) {
                currentContent += line + '\n';
            }
        }

        // Save the last section
        if (currentSection && currentContent.trim()) {
            newScriptData[currentSection] = currentContent.trim();
        }

        setScriptData(newScriptData);
    };

    // Function to render script with embedded titles
    const renderScriptWithTitles = () => {
        const { title, hook, mainContent, conclusion, callToAction } = scriptData || {};
        const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english');

        // If we have script metadata, format it with sections
        if (title || hook || mainContent || conclusion || callToAction) {
            let formattedScript = '';

            if (title) {
                formattedScript += `${headers.title}:\n${title}\n\n`;
            }

            if (hook) {
                formattedScript += `${headers.hook}:\n${hook}\n\n`;
            }

            if (mainContent) {
                formattedScript += `${headers.mainContent}:\n${mainContent}\n\n`;
            }

            if (conclusion) {
                formattedScript += `${headers.conclusion}:\n${conclusion}\n\n`;
            }

            if (callToAction) {
                formattedScript += `${headers.callToAction}:\n${callToAction}\n\n`;
            }

            return formattedScript.trim();
        }

        // Fallback to original script if no metadata
        return scriptData?.script || '';
    };

    const handleApproveScript = () => {
        setIsScriptApproved(true);
        secure.j.scriptMetadata.remove();
        toast.success('Script approved! Now generating scenes breakdown...');
    };

    const handleCancelBack = () => {
        setShowBackConfirmation(false);
        if (uploadingCompleted) {
            router.replace(ROUTES_KEYS.TRENDING_TOPICS);
        }
    };

    // Handle text selection for highlighting keywords
    const handleTextSelection = (chapterIndex: number, event: React.MouseEvent) => {
        // console.log('handleTextSelection called for chapter:', chapterIndex);

        // Use a shorter delay to capture the selection more accurately
        setTimeout(() => {
            const selection = window.getSelection();
            // console.log('Selection object:', selection);
            // console.log('Selection text:', selection?.toString());

            if (!selection || selection.toString().trim() === '') {
                console.log('No selection or empty selection');
                return;
            }

            const selectedText = selection.toString().trim();
            // console.log('Selected text:', selectedText);

            if (selectedText.length === 0) {
                console.log('Selected text is empty after trim');
                return;
            }

            // Get the exact range of the selection
            const range = selection.getRangeAt(0);
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;

            // console.log('Start container type:', startContainer.nodeType);
            // console.log('End container type:', endContainer.nodeType);
            // console.log('Range start:', range.startOffset, 'Range end:', range.endOffset);

            // Handle text selection that might span multiple nodes
            if (startContainer.nodeType === Node.TEXT_NODE && endContainer.nodeType === Node.TEXT_NODE) {
                // Same text node - simple case
                if (startContainer === endContainer) {
                    const textContent = startContainer.textContent || startContainer.nodeValue || '';
                    const startIndex = range.startOffset;
                    const endIndex = range.endOffset;
                    const actualSelectedText = textContent.substring(startIndex, endIndex).trim();

                    // console.log('Same text node - Full text:', textContent);
                    // console.log('Same text node - Selected range:', startIndex, 'to', endIndex);
                    // console.log('Same text node - Actual selected text:', actualSelectedText);

                    if (actualSelectedText.length > 0) {
                        setSelectedText({
                            chapterIndex,
                            text: actualSelectedText,
                            startIndex,
                            endIndex
                        });
                    }
                } else {
                    // Different text nodes - use the selection text directly
                    // console.log('Different text nodes - using selection text directly');
                    setSelectedText({
                        chapterIndex,
                        text: selectedText,
                        startIndex: 0,
                        endIndex: selectedText.length
                    });
                }
            } else if (startContainer.nodeType === Node.ELEMENT_NODE || endContainer.nodeType === Node.ELEMENT_NODE) {
                // Selection spans across elements - use the selection text directly
                // console.log('Selection spans elements - using selection text directly');
                setSelectedText({
                    chapterIndex,
                    text: selectedText,
                    startIndex: 0,
                    endIndex: selectedText.length
                });
            } else {
                console.log('Unsupported node types for selection');
                console.log('Start node type:', startContainer.nodeType, 'End node type:', endContainer.nodeType);
            }
        }, 50); // Even shorter delay for more accurate capture
    };

    // Save highlighted keywords to chapter
    const saveHighlightedKeywords = (chapterIndex: number, keywords: string[]) => {
        const updatedChapters = chapters.map((chapter, index) => {
            if (index === chapterIndex) {
                return {
                    ...chapter,
                    highlightedKeywords: keywords
                };
            }
            return chapter;
        });
        setChapters(updatedChapters);
        setSelectedText(null);
    };

    // Add keyword to highlighted list
    const addKeyword = () => {
        if (!selectedText) return;

        const chapter = chapters[selectedText.chapterIndex];
        const currentKeywords = chapter.highlightedKeywords || [];
        const selectedTextLower = selectedText.text.toLowerCase().trim();

        // Check if the exact text is already a keyword
        if (currentKeywords.some(keyword => keyword.toLowerCase().trim() === selectedTextLower)) {
            toast.info(`"${selectedText.text}" is already in keywords`);
            setSelectedText(null);
            window.getSelection()?.removeAllRanges();
            return;
        }

        // Check if the selected text contains any existing keywords
        const containsExistingKeywords = currentKeywords.some(keyword =>
            selectedTextLower.includes(keyword.toLowerCase().trim()) ||
            keyword.toLowerCase().trim().includes(selectedTextLower)
        );

        if (containsExistingKeywords) {
            // Find which keywords are contained in the selection
            const containedKeywords = currentKeywords.filter(keyword =>
                selectedTextLower.includes(keyword.toLowerCase().trim())
            );

            if (containedKeywords.length > 0) {
                toast.warning(`Selection contains existing keywords: ${containedKeywords.join(', ')}. Please select only new text.`);
                setSelectedText(null);
                window.getSelection()?.removeAllRanges();
                return;
            }
        }

        // Check if any existing keyword contains the selected text
        const isContainedInExisting = currentKeywords.some(keyword =>
            keyword.toLowerCase().trim().includes(selectedTextLower)
        );

        if (isContainedInExisting) {
            toast.warning(`"${selectedText.text}" is already part of an existing keyword. Please select different text.`);
            setSelectedText(null);
            window.getSelection()?.removeAllRanges();
            return;
        }

        // Add the new keyword
        const newKeywords = [...currentKeywords, selectedText.text];
        saveHighlightedKeywords(selectedText.chapterIndex, newKeywords);
        toast.success(`Added "${selectedText.text}" to keywords`);

        // Open media selector with this keyword as suggestion
        try {
            if (typeof window !== 'undefined') {
                (window as any).__keywordSuggestions = { keyword: selectedText.text, keywords: [selectedText.text] };
            }
            setMediaManagementChapterIndex(selectedText.chapterIndex);
            setMediaManagementOpen(true);
        } catch {}

        // Clear selection after adding
        setSelectedText(null);
        window.getSelection()?.removeAllRanges();
    };

    // Clear selection when clicking outside
    const handleClearSelection = (event?: React.MouseEvent) => {
        if (event) {
            // Only clear if not clicking on the toolbar or text selection area
            const target = event.target as HTMLElement;
            const isToolbar = target.closest('[data-toolbar="keyword-toolbar"]');
            const isTextArea = target.closest('[data-chapter-index]');
            const isKeywordBadge = target.closest('[data-keyword-badge]');

            if (!isToolbar && !isTextArea && !isKeywordBadge) {
                console.log('Clearing selection - clicked outside toolbar, text area, and keyword badges');
                setSelectedText(null);
                window.getSelection()?.removeAllRanges();
            }
        } else {
            // Direct clear (from Cancel button)
            console.log('Clearing selection directly');
            setSelectedText(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    // Global selection listener
    React.useEffect(() => {
        let selectionTimeout: NodeJS.Timeout;

        const handleGlobalSelection = () => {
            // Clear any existing timeout
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }

            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                console.log('Global selection detected:', selection.toString());
                // Find which chapter this selection belongs to
                const range = selection.getRangeAt(0);
                const textNode = range.startContainer;

                if (textNode.nodeType === Node.TEXT_NODE) {
                    // Try to find the chapter by traversing up the DOM
                    let element = textNode.parentElement;
                    while (element && !element.getAttribute('data-chapter-index')) {
                        element = element.parentElement;
                    }

                    if (element) {
                        const chapterIndex = parseInt(element.getAttribute('data-chapter-index') || '0');
                        const textContent = textNode.textContent || '';
                        const startIndex = range.startOffset;
                        const endIndex = range.endOffset;

                        // Extract only the selected portion of the text
                        const actualSelectedText = textContent.substring(startIndex, endIndex).trim();

                        console.log('Global listener - Full text:', textContent);
                        console.log('Global listener - Selected range:', startIndex, 'to', endIndex);
                        console.log('Global listener - Actual selected text:', actualSelectedText);

                        if (actualSelectedText.length > 0) {
                            setSelectedText({
                                chapterIndex,
                                text: actualSelectedText,
                                startIndex,
                                endIndex
                            });
                        }
                    }
                }
            } else {
                // Only clear selection after a delay to allow for button clicks
                console.log('Selection cleared or empty - scheduling clear');
                selectionTimeout = setTimeout(() => {
                    if (!isInteractingWithToolbar) {
                        console.log('Clearing selection after timeout');
                        setSelectedText(null);
                    } else {
                        console.log('Not clearing selection - user is interacting with toolbar');
                    }
                }, 3000); // 3 second delay before clearing
            }
        };

        document.addEventListener('selectionchange', handleGlobalSelection);
        return () => {
            document.removeEventListener('selectionchange', handleGlobalSelection);
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
            }
        };
    }, []);

    const handleConfirmBack = () => {
        // Clear script data from secure storage when leaving
        try {
            secure.j.approvedScript.remove();
            secure.j.scriptMetadata.remove();
        } catch (error) {
            console.warn('Error clearing script cache:', error);
        }

        setShowBackConfirmation(false);
        router.push(ROUTES_KEYS.TRENDING_TOPICS);
    };

    if (loading) {
        return (
            <LoadingOverlay
                title={'Please wait'}
                desc={`We are uploading your script to process it...`}
            />
        );
    }

    if (noScriptFound) {
        return <Container maxWidth="md" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
                No script data found. Please go back and generate a script first.
            </Alert>
            <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleConfirmBack}
            >
                Back to Script Generation
            </Button>
        </Container>
    }

    return (
        <Box
            sx={{ width: '100vw', height: '100vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
        >
            <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<BackIcon />}
                        onClick={() => setShowBackConfirmation(true)}
                        size="small"
                    >
                        Back
                    </Button>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 2.5 }}>
                        Script Review & Approval
                    </Typography>
                </Box>

                {/* Duration Display */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimeIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.5 }}>
                        Estimated Duration:
                    </Typography>
                    <Chip
                        label={estimatedDuration}
                        size="medium"
                        color="success"
                        sx={{ fontSize: '1rem', fontWeight: 500, height: 28, '& .MuiChip-label': { px: 1, lineHeight: 1.4 } }}
                    />
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', px: 3 }}>

                {/* Script Components Breakdown */}
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>

                    {/* Header section - fixed */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                        mt: 2.5,
                        mb: 2.5,
                        ...(getDirectionSx(scriptData?.language || 'english')),
                        // flexDirection: isRTLLanguage('urdu') ? 'row-reverse' : 'row',
                        width: '100%'
                    }}>
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'primary.main',
                                flex: 1,
                                minWidth: 0,
                                lineHeight: 2.5,
                                textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                overflowWrap: 'anywhere'
                            }}
                        >
                            📋 {scriptData?.title}
                        </Typography>

                        {!isScriptApproved &&
                            <Box sx={{
                                bgcolor: 'background.paper',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexShrink: 0
                            }}>
                                <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>

                                    {!isEditingScript && !isScriptApproved ? (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                startIcon={<EditIcon />}
                                                onClick={handleStartEditingScript}
                                                sx={{ textTransform: 'none', px: 2, py: 1, lineHeight: 1.5, gap: 1 }}
                                            >
                                                Edit Script
                                            </Button>

                                            <Button
                                                onClick={handleApproveScript}
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                startIcon={<CheckIcon />}
                                                sx={{
                                                    py: 1,
                                                    px: 2,
                                                    gap: 1,
                                                    fontSize: '1.05rem',
                                                    bgcolor: 'success.main',
                                                    textTransform: 'none',
                                                    lineHeight: 1.5,
                                                    '&:hover': { bgcolor: 'success.dark' }
                                                }}
                                            >
                                                Approve
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSaveScript}
                                                sx={{ textTransform: 'none', px: 2, py: 1, lineHeight: 1.5 }}
                                            >
                                                Save Changes
                                            </Button>

                                            <Button
                                                variant="outlined"
                                                size="large"
                                                color="secondary"
                                                startIcon={<CancelIcon />}
                                                onClick={handleCancelEditingScript}
                                                sx={{ textTransform: 'none', px: 2, py: 1, lineHeight: 1.5 }}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                            </Box>}
                    </Box>

                    {!isScriptApproved ? (
                        <Paper sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            mb: 1,
                            paddingBottom: 1,
                            maxHeight: '85vh',
                            overflow: 'auto',
                        }}>
                            {/* Script content area - flexible */}
                            <Box sx={{ flex: 1, mb: 2, display: 'flex', flexDirection: 'column' }}>
                                {isEditingScript ? (
                                    <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {/* Hook Section */}
                                        <Paper elevation={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, flexShrink: 0 }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: 'primary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, lineHeight: 2.5, ...(getDirectionSx(scriptData?.language || 'english')), textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left', width: '100%' }}>
                                                🎯 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').hook}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                variant="outlined"
                                                value={scriptData?.hook || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, hook: e.target.value } : prev)}
                                                placeholder="Enter your hook content..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                                        fontSize: '1.25rem',
                                                        lineHeight: 2.5,
                                                        ...getDirectionSx(scriptData?.language || 'english')
                                                    }
                                                }}
                                            />
                                        </Paper>

                                        {/* Main Content Section */}
                                        <Paper elevation={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, flexShrink: 0 }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: 'secondary.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, lineHeight: 2.5, ...(getDirectionSx(scriptData?.language || 'english')), textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left', width: '100%' }}>
                                                📝 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').mainContent}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={8}
                                                variant="outlined"
                                                value={scriptData?.mainContent || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, mainContent: e.target.value } : prev)}
                                                placeholder="Enter your main content..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                                        fontSize: '1.25rem',
                                                        lineHeight: 2.5,
                                                        ...getDirectionSx(scriptData?.language || 'english')
                                                    }
                                                }}
                                            />
                                        </Paper>

                                        {/* Conclusion Section */}
                                        <Paper elevation={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, flexShrink: 0 }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: 'success.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, lineHeight: 2.5, ...(getDirectionSx(scriptData?.language || 'english')), textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left', width: '100%' }}>
                                                🏁 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').conclusion}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                variant="outlined"
                                                value={scriptData?.conclusion || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, conclusion: e.target.value } : prev)}
                                                placeholder="Enter your conclusion..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                                        fontSize: '1.25rem',
                                                        lineHeight: 2.5,
                                                        ...getDirectionSx(scriptData?.language || 'english')
                                                    }
                                                }}
                                            />
                                        </Paper>

                                        {/* Call to Action Section */}
                                        <Paper elevation={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, flexShrink: 0 }}>
                                            <Typography variant="h6" sx={{ mb: 1, color: 'warning.main', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, lineHeight: 2.5, ...(getDirectionSx(scriptData?.language || 'english')), textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left', width: '100%' }}>
                                                🚀 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').callToAction}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                variant="outlined"
                                                value={scriptData?.conclusion || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, callToAction: e.target.value } : prev)}
                                                placeholder="Enter your call to action..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                                        fontSize: '1.25rem',
                                                        lineHeight: 2.5,
                                                        ...getDirectionSx(scriptData?.language || 'english')
                                                    }
                                                }}
                                            />
                                        </Paper>
                                    </Box>
                                ) : (
                                    <Paper
                                        elevation={2}
                                        sx={{
                                            p: 2,
                                            bgcolor: 'background.default',
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            flex: 1,
                                            overflow: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            ...getDirectionSx(scriptData?.language || 'english')
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                whiteSpace: 'pre-wrap',
                                                lineHeight: 2.5,
                                                fontSize: '1.2rem',
                                                fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                                flex: 1,
                                                ...getDirectionSx(scriptData?.language || 'english')
                                            }}
                                        >
                                            {renderScriptWithTitles()}
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        </Paper>
                    ) : (
                        <Paper sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            mb: 1,
                            paddingBottom: 1,
                            maxHeight: '85vh',
                            overflow: 'auto',
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>

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
                                        selectedText={selectedText}
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
                                        onTextSelection={handleTextSelection}
                                        onAddKeyword={addKeyword}
                                        onClearSelection={() => handleClearSelection()}
                                        onToolbarInteraction={setIsInteractingWithToolbar}
                                        language={scriptData?.language || 'english'}
                                        onGoogleImagePreview={(imageUrl) => {
                                            // Open the image in a new tab for preview
                                            window.open(imageUrl, '_blank');
                                        }}
                                    />
                                )}

                                {/* Production Actions - Only show when script is approved */}
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', lineHeight: 2.5 }}>
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
                                                sx={{ mb: 1, fontSize: '1rem', lineHeight: 1.5 }}
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
                                                    sx={{ mb: 1, fontSize: '1rem', lineHeight: 1.5 }}
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
                                                disabled={!chapters.length || !chromaKeyFile || uploadingChromaKey}
                                                sx={{
                                                    bgcolor: SUCCESS.main,
                                                    '&:hover': { bgcolor: SUCCESS.dark },
                                                    mb: 1,
                                                    fontSize: '1rem',
                                                    lineHeight: 1.5
                                                }}
                                                title={!chromaKeyFile ? 'Upload chroma key first' : ''}
                                            >
                                                Generate Video
                                            </Button>
                                        </Grid>

                                    </Grid>
                                </Box>
                            </Box>
                        </Paper>
                    )}

                </Box>

            </Box>

            {/* Back Confirmation Dialog */}
            <Dialog
                open={showBackConfirmation}
                onClose={handleCancelBack}
                aria-labelledby="back-confirmation-dialog-title"
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle id="back-confirmation-dialog-title" variant="h5" sx={{ mb: 2, color: 'warning.main', lineHeight: 2.5 }}>
                    {uploadingCompleted ? 'Uploading Completed' : '⚠️ Are you sure?'}
                </DialogTitle>
                <DialogContent>
                    <Typography variant="h5" sx={{ mb: 2, lineHeight: 1.5 }}>
                        {uploadingCompleted ? 'Your video is being generating, We will notify you when it is ready.' : 'You haven\'t approved your script yet. If you go back now, your current progress and script data will be permanently deleted.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={handleCancelBack}
                        variant="outlined"
                        sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                    >
                        {uploadingCompleted ? 'Close' : 'Stay Here'}
                    </Button>
                    {!uploadingCompleted && <Button
                        onClick={handleConfirmBack}
                        variant="contained"
                        color="warning"
                        sx={{ minWidth: 100, fontSize: '1.05rem', lineHeight: 1.5 }}
                    >
                        Discard Script
                    </Button>}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ScriptProductionClient;

