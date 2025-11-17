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
    IconButton,
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
    duration,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    VideoCall as VideoIcon,
    Refresh as RefreshIcon,
    Movie as SceneDataIcon,
    AccessTime as TimeIcon,
    Edit as EditIcon,
    Check as CheckIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon
} from '@mui/icons-material';
import SettingsIcon from '@mui/icons-material/Settings';
import { HelperFunctions, SecureStorageHelpers } from '@/utils/helperFunctions';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { LibraryData, profileService } from '@/services/profileService';
import { toast, ToastContainer } from 'react-toastify';
import { getDirectionSx, isRTLLanguage } from '@/utils/languageUtils';
import { API_ENDPOINTS } from '../../src/config/apiEndpoints';
import GammaService from '@/services/gammaService';
import PdfService from '@/services/pdfService';
import { SceneData } from '@/types/sceneData';
import SceneDataSection from '@/components/TrendingTopicsComponent/SceneSection';
import ChromaKeyUpload from '@/components/scriptProductionComponents/ChromaKeyUpload';
import { DropResult } from 'react-beautiful-dnd';
import { fallbackImages } from '@/data/mockImages';
import { PDF_TO_IMAGES_INTERVAL, ROUTES_KEYS, SCRIPT_STATUS } from '@/data/constants';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { LogoOverlayInterface, ScriptData, SettingItemInterface, Settings } from '@/types/scriptData';
import { BackgroundType } from '@/types/backgroundType';
import BackConfirmationDialog from '@/dialogs/BackConfirmationDialog';
import ProjectSettingsDialog from '@/dialogs/ProjectSettingsDialog';
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';
import { predefinedTransitions } from '@/data/DefaultData';

const ScriptProductionClient = () => {

    const router = useRouter();
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);
    const [noScriptFound, setNoScriptFound] = useState<boolean>(false);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

    // Script approval states
    const [isScriptApproved, setIsScriptApproved] = useState(false);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [editedScript, setEditedScript] = useState('');

    // Navigation confirmation states
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);

    // Production states
    const [scenesData, setScenesData] = useState<SceneData[]>([]);

    // SceneData editing states
    const [editingSceneData, setEditingSceneData] = useState<number | null>(null);
    const [editHeading, setEditHeading] = useState('');
    const [editNarration, setEditNarration] = useState('');

    // Image management states
    const [selectedSceneDataIndex, setSelectedSceneDataIndex] = useState(0);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [SceneDataImagesMap, setScenesDataImagesMap] = useState<Record<number, string[]>>({});
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [aiImagesEnabled, setAiImagesEnabled] = useState(false);
    const [rightTabIndex, setRightTabIndex] = useState(0);
    const [imagesLoading, setImagesLoading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerSceneDataIndex, setPickerSceneDataIndex] = useState<number | null>(null);
    const [pickerNarrations, setPickerNarrations] = useState<string[]>([]);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [isDraggingUpload, setIsDraggingUpload] = useState(false);
    const [mediaManagementOpen, setMediaManagementOpen] = useState(false);
    const [mediaManagementSceneDataIndex, setMediaManagementSceneDataIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [isNarratorVideoUploaded, setIsNarratorVideoUploaded] = useState(false);
    const [isNarrationUploadView, setIsNarrationUploadView] = useState(false);
    const [hasDownloadedScript, setHasDownloadedScript] = useState(false);
    const [selectedText, setSelectedText] = useState<{ SceneDataIndex: number; text: string; startIndex: number; endIndex: number } | null>(null);
    const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);
    const [driveLibrary, setDriveLibrary] = useState<LibraryData>({
        backgrounds: [],
        music: [],
        transitions: [],
        transitionEffects: []
    });
    // Project-level settings
    const [videoDuration, setVideoDuration] = useState<number | null>(null);
    const [completeProjectUploaded, setCompleteProjectUploaded] = useState(false);
    const [pageTitle, setPageTitle] = useState('Script Review & Approval');

    const [jobId, setJobId] = useState<string>('');
    // SceneData edit dialog states
    const [SceneDataEditDialogOpen, setScenesDataEditDialogOpen] = useState(false);
    const [SceneDataEditDialogSceneDataIndex, setScenesDataEditDialogSceneDataIndex] = useState<number | null>(null);
    // Project Settings Dialog state
    const [projectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);
    const [projectSettingsContext, setProjectSettingsContext] = useState<{ mode: 'project' | 'scene'; sceneIndex?: number }>({ mode: 'project' });
    // Temp state used inside dialog for cancel/discard behavior
    const [projectSettings, setProjectSettings] = useState<Settings | null>(null);
    const [sceneSettings, setSceneSettings] = useState<Settings | null>(null);

    useEffect(() => {
        let storedData = null;

        // First try to load from metadata (for unapproved scripts)
        try {
            const storedMetadata = SecureStorageHelpers.getScriptMetadata();
            if (storedMetadata && typeof storedMetadata === 'object') {
                storedData = storedMetadata;
                // console.log('storedData', JSON.stringify(storedData, null, 2));
                setScriptData(storedData);

                // Use scriptData flag to restore download state
                if (storedData.isScriptDownloaded === true) {
                    setHasDownloadedScript(true);
                }
                if (storedData.status === SCRIPT_STATUS.APPROVED || storedData.status === SCRIPT_STATUS.UPLOADED) {
                    setJobId(storedData.jobId);
                    setIsScriptApproved(true);
                    // Only open upload view if user has downloaded the script
                    setIsNarrationUploadView(Boolean(hasDownloadedScript));
                    setPageTitle(Boolean(hasDownloadedScript) ? 'Step 2: Narrator Video Upload Stage' : 'Script Approved - Download Script to Continue');
                }

                if (storedData.status === SCRIPT_STATUS.UPLOADED && storedData.narrator_chroma_key_link) {
                    setIsNarrationUploadView(false);
                    setIsNarratorVideoUploaded(true);
                    setVideoDuration(storedData.videoDuration || null);
                    setPageTitle('Final Step: Scene Composition & Video Generation');
                    setProjectSettings(storedData.projectSettings || null);

                    if (storedData.transcription) {
                        updateParagraphs(storedData);
                    }
                }
            } else {
                setNoScriptFound(true);
                setLoading(false);
            }

            // Mark initial loading as complete
            setIsInitialLoading(false);
        } catch (error) {
            console.warn('Error parsing script metadata:', error);
            setLoading(false);
            setNoScriptFound(true);
            setIsInitialLoading(false);
        }

    }, []);

    // Keep narration upload view in sync with download gate
    useEffect(() => {
        if (isScriptApproved && !isNarratorVideoUploaded) {
            setIsNarrationUploadView(Boolean(hasDownloadedScript));
            setPageTitle(Boolean(hasDownloadedScript) ? 'Step 2: Narrator Video Upload Stage' : 'Script Approved - Download Script to Continue');
        }
    }, [isScriptApproved, hasDownloadedScript, isNarratorVideoUploaded]);

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
    }, []);

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
                // console.log('Global selection detected:', selection.toString());
                // Find which SceneData this selection belongs to
                const range = selection.getRangeAt(0);
                const textNode = range.startContainer;

                if (textNode.nodeType === Node.TEXT_NODE) {
                    // Try to find the SceneData by traversing up the DOM
                    let element = textNode.parentElement;
                    while (element && !element.getAttribute('data-scenedata-index')) {
                        element = element.parentElement;
                    }

                    if (element) {
                        const SceneDataIndex = parseInt(element.getAttribute('data-scenedata-index') || '0');
                        const textContent = textNode.textContent || '';
                        const startIndex = range.startOffset;
                        const endIndex = range.endOffset;

                        // Extract only the selected portion of the text
                        const actualSelectedText = textContent.substring(startIndex, endIndex).trim();

                        // console.log('Global listener - Full text:', textContent);
                        // console.log('Global listener - Selected range:', startIndex, 'to', endIndex);
                        // console.log('Global listener - Actual selected text:', actualSelectedText);

                        if (actualSelectedText.length > 0) {
                            setSelectedText({
                                SceneDataIndex,
                                text: actualSelectedText,
                                startIndex,
                                endIndex
                            });
                        }
                    }
                }
            } else {
                // Only clear selection after a delay to allow for button clicks
                // console.log('Selection cleared or empty - scheduling clear');
                selectionTimeout = setTimeout(() => {
                    if (!isInteractingWithToolbar) {
                        // console.log('Clearing selection after timeout');
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

    const openProjectSettingsDialog = (mode: 'project' | 'scene', sceneIndex?: number) => {
        setProjectSettingsContext({ mode, sceneIndex });
        if (mode === 'scene' && typeof sceneIndex === 'number') {
            const ch = scenesData[sceneIndex];
            setSceneSettings(ch?.sceneSettings || null);
        } else {
            setProjectSettings(scriptData?.projectSettings || null);
        }
        setProjectSettingsDialogOpen(true);
    };

    const closeProjectSettingsDialog = () => {
        setProjectSettingsDialogOpen(false);
    };

    const applyProjectSettingsDialog = async (mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => {

        setProjectSettingsDialogOpen(false);
        // Apply to scenes according to context
        if (mode === 'project') {
            // Update project-level states from temp (global apply)
            const updatedProjectSettings: Settings = {
                videoLogo: projectSettings?.videoLogo as LogoOverlayInterface,
                videoBackgroundMusic: projectSettings?.videoBackgroundMusic as SettingItemInterface,
                videoBackgroundVideo: projectSettings?.videoBackgroundVideo as SettingItemInterface,
                videoTransitionEffect: projectSettings?.videoTransitionEffect as SettingItemInterface,
            }

            const updated: SceneData[] = scenesData.map((ch) => ({
                ...(ch as any),
                sceneSettings: {
                    ...(ch as any).sceneSettings,
                    ...updatedProjectSettings,
                }
            }));
            setScenesData(updated);

            SecureStorageHelpers.setScriptMetadata({ ...scriptData, projectSettings: updatedProjectSettings, scenesData: updated });

            try {
                for (let i = 0; i < updated.length; i++) {
                    await GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[i], 'Project settings applied to all scenes');
                }
            } catch { }

        } else if (projectSettingsContext.mode === 'scene' && typeof projectSettingsContext.sceneIndex === 'number') {

            const updatedSceneSettings: Settings = {
                videoLogo: sceneSettings?.videoLogo as LogoOverlayInterface,
                videoBackgroundMusic: sceneSettings?.videoBackgroundMusic as SettingItemInterface,
                videoBackgroundVideo: sceneSettings?.videoBackgroundVideo as SettingItemInterface,
                videoTransitionEffect: sceneSettings?.videoTransitionEffect as SettingItemInterface,
            };

            const idx = projectSettingsContext.sceneIndex;
            const updatedSceneData: SceneData[] = scenesData.map((ch, i) => {
                if (i !== idx) return ch;
                return { ...(ch as any), sceneSettings: { ...(ch as any).sceneSettings, ...updatedSceneSettings } };
            });
            setScenesData(updatedSceneData);
            SecureStorageHelpers.setScriptMetadata({ ...scriptData, scenesData: updatedSceneData });

            try {
                await GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updatedSceneData[idx], 'Project settings applied to scene');
            } catch { }
        }

    };

    // Function to upload JSON to Google Drive
    const uploadCompleteProjectToDrive = async () => {
        setLoading(true);
        try {
            // Ensure each SceneData has assets.images populated with all selected sources
            // const SceneDataForUpload: SceneData[] = scenesData.map((ch) => {
            //     const existingImages = Array.isArray(ch.assets?.images) ? ch.assets!.images! : [];
            //     const googleImages = Array.isArray(ch.assets?.imagesGoogle) ? ch.assets!.imagesGoogle! : [];
            //     const envatoImages = Array.isArray(ch.assets?.imagesEnvato) ? ch.assets!.imagesEnvato! : [];
            //     const keywordImages = HelperFunctions.extractImageUrlsFromKeywordsSelected(ch.keywordsSelected as any);
            //     const combined = Array.from(new Set([
            //         ...existingImages,
            //         ...googleImages,
            //         ...envatoImages,
            //         ...keywordImages,
            //     ].filter(Boolean)));
            //     return {
            //         ...ch,
            //         assets: {
            //             ...ch.assets,
            //             images: combined,
            //             imagesGoogle: googleImages,
            //             imagesEnvato: envatoImages,
            //         }
            //     } as SceneData;
            // });

            const scriptProductionJSON = {
                project: {
                    jobId: jobId,
                    topic: scriptData?.topic || null,
                    title: scriptData?.title || null,
                    description: scriptData?.description || null,
                    duration: parseInt(scriptData?.duration || '1') || null,
                    resolution: '1920x1080',
                    region: scriptData?.region || null,
                    language: scriptData?.language || null,
                    subtitle_language: scriptData?.subtitle_language || null,
                    narration_type: scriptData?.narration_type || null,
                    narrator_chroma_key_link: scriptData?.narrator_chroma_key_link || null,
                    transcription: scriptData?.transcription || null,
                    // Project-level settings
                    projectSettings: {
                        videoLogo: projectSettings?.videoLogo as LogoOverlayInterface,
                        videoBackgroundMusic: projectSettings?.videoBackgroundMusic as SettingItemInterface,
                        videoBackgroundVideo: projectSettings?.videoBackgroundVideo as SettingItemInterface,
                        videoTransitionEffect: projectSettings?.videoTransitionEffect as SettingItemInterface,
                    },
                },
                // Use SceneDataForUpload to ensure merged images are included
                script: scenesData.map(sceneData => ({
                    jobId: jobId,
                    id: sceneData.id,
                    narration: sceneData.narration,
                    duration: sceneData.duration,
                    durationInSeconds: sceneData.durationInSeconds,
                    words: sceneData.words,
                    startTime: sceneData.startTime,
                    endTime: sceneData.endTime,
                    highlightedKeywords: sceneData.highlightedKeywords || [],
                    keywordsSelected: Array.isArray(sceneData.keywordsSelected) ? sceneData.keywordsSelected : [],
                    assets: {
                        images: sceneData.assets?.images || [],
                    },
                    gammaGenId: sceneData?.gammaGenId || '',
                    gammaUrl: sceneData?.gammaUrl || '',
                    previewImage: sceneData?.gammaPreviewImage || '',
                    sceneSettings: {
                        videoLogo: sceneData.sceneSettings?.videoLogo as LogoOverlayInterface,
                        videoTransitionEffect: sceneData.sceneSettings?.videoTransitionEffect as SettingItemInterface,
                        videoBackgroundMusic: sceneData.sceneSettings?.videoBackgroundMusic as SettingItemInterface,
                        videoBackgroundVideo: sceneData.sceneSettings?.videoBackgroundVideo as SettingItemInterface,
                    },
                })),
            };

            const form = new FormData();
            form.append('jobName', jobId);
            form.append('fileName', `project-config.json`);
            form.append('jsonData', JSON.stringify(scriptProductionJSON));

            console.log('scriptProductionJSON: ', JSON.stringify(scriptProductionJSON, null, 2));

            const uploadResult = await GoogleDriveServiceFunctions.uploadContentToDrive(form);
            if (!uploadResult.success) {
                toast.error(uploadResult.result || 'Failed to upload to Google Drive');
                return;
            }
            // console.log('Drive result:', uploadResult.result);

            setLoading(false);
            setCompleteProjectUploaded(true);
            setShowBackConfirmation(true);

        } catch (e: any) {
            console.error(e);
            toast.error(`Failed to upload to Google Drive: ${e?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Start Gamma generation if needed (script-level)
    const GenerateGammaId = async (scriptData: ScriptData) => {
        try {
            if (!scriptData || scriptData.gammaGenId || scriptData.gammaExportUrl || !scriptData.transcription || !scriptData.scenesData || scriptData.scenesData.length <= 0) return;
            const inputText = scriptData.transcription;
            const data = await GammaService.startGeneration(inputText, scriptData.scenesData!.length);
            if (data?.generationId) {
                const updatedScriptData = { ...scriptData, gammaGenId: data.generationId } as ScriptData;
                setScriptData(updatedScriptData);
                SecureStorageHelpers.setScriptMetadata(updatedScriptData);

                checkGammaAPIStatus(updatedScriptData);
            }
        } catch { }
    };

    const checkGammaAPIStatus = async (scriptData: ScriptData) => {
        try {
            const poll = async () => {
                try {
                    const data = await GammaService.checkStatus(scriptData.gammaGenId!);
                    if (data?.status === 'completed' && data?.exportUrl) {
                        const updatedScriptData = { ...scriptData, gammaExportUrl: data.exportUrl } as ScriptData;
                        setScriptData(updatedScriptData);
                        SecureStorageHelpers.setScriptMetadata(updatedScriptData);

                        // PDF -> Images (one per scene) and populate preview images
                        convertGammaPdfToImages(updatedScriptData);
                    } else {
                        setTimeout(poll, PDF_TO_IMAGES_INTERVAL);
                    }
                } catch {
                    setTimeout(poll, PDF_TO_IMAGES_INTERVAL);
                }
            };
            poll();
        } catch { }
    };

    const convertGammaPdfToImages = async (scriptData: ScriptData) => {
        try {
            const arrayBuffer = await PdfService.fetchPdfArrayBuffer(scriptData.gammaExportUrl!);
            // First, split: get total pages
            const totalPages = await PdfService.getPdfPageCount(arrayBuffer);
            const pagesToRender = Math.min(totalPages, (scriptData.scenesData || []).length);
            const images: string[] = [];
            for (let i = 1; i <= pagesToRender; i++) {
                const img = await PdfService.renderPdfPageToImage(arrayBuffer, i, 2);
                images.push(img);
            }
            const mapped = scriptData.scenesData?.map((ch, idx) => ({
                ...ch,
                gammaPreviewImage: images[idx] || '',
            }));
            console.log('PDF pages:', totalPages, 'Rendered images:', mapped || []);
            setScenesData(mapped || [] as SceneData[]);

            // Upload Gamma preview images to each scene folder using media upload API
            if (mapped && mapped.length > 0) {
                for (let i = 0; i < mapped.length; i++) {
                    const ch: SceneData = mapped[i];
                    if (!ch?.gammaPreviewImage) continue;
                    try {
                        const uploadResult = await GoogleDriveServiceFunctions.uploadPreviewDataUrl(jobId, ch.id ?? i + 1, ch.gammaPreviewImage);
                        if (uploadResult.success) {
                            ch.gammaPreviewImage = uploadResult.result.webViewLink;
                            // update scene data with the updated scene data
                            setScenesData((prev: SceneData[]) => prev.map((s: SceneData) => s.id === ch.id ? ch : s));
                            await GoogleDriveServiceFunctions.persistSceneUpdate(jobId, ch, 'Preview image uploaded');
                        }
                    } catch { }
                }

                SecureStorageHelpers.setScriptMetadata({ ...scriptData, scenesData: mapped || [] as SceneData[] });
            }

        } catch (e: any) {
            console.error('Failed to convert PDF to images:', e?.message || 'Unknown error');
        }
    };

    // Function to break down script into paragraphs and calculate individual durations
    const updateParagraphs = async (scriptData: ScriptData) => {
        // Check if we have scenes data from the new transcribe API
        if (scriptData?.scenesData && Array.isArray(scriptData.scenesData) && scriptData.scenesData.length > 0) {
            // console.log('Using scenes data from transcribe API:', scriptData.scenesData.length, 'scenes');

            // If SceneData with images already exist in approvedScript, reuse them
            try {
                if (scriptData && Array.isArray(scriptData.scenesData) && scriptData.scenesData.length === scriptData.scenesData!.length) {
                    const normalizedFromStorage: SceneData[] = scriptData.scenesData.map((ch: any, index: number) => ({
                        id: ch.id || scriptData.scenesData![index]?.id || `scene-${index + 1}`,
                        jobId: ch.jobId || '',
                        jobName: ch.jobName || '',
                        narration: ch.narration || scriptData.scenesData![index]?.narration || '',
                        duration: ch.duration || scriptData.scenesData![index]?.duration || '',
                        words: ch.words ?? scriptData.scenesData![index]?.words ?? 0,
                        startTime: ch.startTime ?? scriptData.scenesData![index]?.startTime ?? 0,
                        endTime: ch.endTime ?? scriptData.scenesData![index]?.endTime ?? 0,
                        durationInSeconds: ch.durationInSeconds ?? scriptData.scenesData![index]?.durationInSeconds ?? 0,
                        highlightedKeywords: ch.highlightedKeywords ?? [],
                        keywordsSelected: ch.keywordsSelected ?? {},
                        assets: {
                            images: ch.assets?.images || [],
                        },
                        gammaPreviewImage: ch.gammaPreviewImage || scriptData.scenesData![index]?.gammaPreviewImage || '',
                        sceneSettings: ch.sceneSettings || scriptData.scenesData![index]?.sceneSettings || {
                            videoLogo: ch.sceneSettings?.videoLogo || scriptData.scenesData![index]?.sceneSettings?.videoLogo || '',
                            videoTransitionEffect: ch.sceneSettings?.videoTransitionEffect || scriptData.scenesData![index]?.sceneSettings?.videoTransitionEffect || '',
                            videoBackgroundMusic: ch.sceneSettings?.videoBackgroundMusic || scriptData.scenesData![index]?.sceneSettings?.videoBackgroundMusic || '',
                            videoBackgroundVideo: ch.sceneSettings?.videoBackgroundVideo || scriptData.scenesData![index]?.sceneSettings?.videoBackgroundVideo || '',
                        },
                        clip: ch.clip || scriptData.scenesData![index]?.clip || '',
                    }));
                    // console.log('Using existing SceneData with scenes data:', JSON.stringify(normalizedFromStorage, null, 2));

                    applyHighlights(scriptData, normalizedFromStorage);

                }
            } catch { }
        }
    };

    const applyHighlights = async (scriptData: ScriptData, scenesData: SceneData[]) => {
        const needsHighlights = scenesData.some(ch => !Array.isArray(ch.highlightedKeywords) || ch.highlightedKeywords.length === 0);
        if (needsHighlights) {
            setLoading(true);
            HelperFunctions.fetchAndApplyHighlightedKeywords(scenesData, setScenesData, (scenesData) => {
                // console.log('SceneData with highlights', SceneData);
                setLoading(false);
                // save updated SceneData
                const updatedScriptData = { ...scriptData, scenesData, updated_at: new Date().toISOString() } as ScriptData;
                setScriptData(updatedScriptData);
                SecureStorageHelpers.setScriptMetadata(updatedScriptData);

                setScenesData(scenesData);
                // checkAndProcessGamma(updatedScriptData);

                try {
                    for (const scene of scenesData) {
                        GoogleDriveServiceFunctions.persistSceneUpdate(jobId, scene, 'Highlighted keywords applied to scene');
                    }
                } catch { }

            });
        } else {
            setLoading(false);
            setScenesData(scenesData);
            // checkAndProcessGamma(scriptData);
        }
    };

    const checkAndProcessGamma = async (scriptData: ScriptData) => {
        // Kick off or check Gamma generation at SCRIPT level
        if (!scriptData.gammaGenId) {
            GenerateGammaId(scriptData);
        } else if (scriptData.gammaGenId && !scriptData.gammaExportUrl) {
            checkGammaAPIStatus(scriptData);
        } else if (
            scriptData.gammaGenId &&
            scriptData.gammaExportUrl &&
            scriptData.scenesData &&
            scriptData.scenesData.length > 0
        ) {
            // Determine if any scene is missing a previewImage
            const hasMissingPreviewImages = scriptData.scenesData.some(
                (scene: any) => !scene.gammaPreviewImage
            );
            if (hasMissingPreviewImages) {
                convertGammaPdfToImages(scriptData);
            } else {
                console.log('All scenes have preview images');
            }
        }
    };
    // SceneData Management Functions
    const handleAddSceneDataAfter = (index: number) => {
        HelperFunctions.addSceneDataAfter(index, scenesData, setScenesData);
    };

    const handleDeleteSceneData = (index: number) => {
        HelperFunctions.deleteSceneData(index, scenesData, setScenesData);
    };

    const handleEditSceneData = (index: number) => {
        // setEditingSceneData(index);
        // setEditHeading(SceneData[index].on_screen_text || '');
        // setEditNarration(SceneData[index].narration || '');
    };

    const handleSaveEdit = () => {
        if (editingSceneData !== null) {
            HelperFunctions.saveEdit(editingSceneData, scenesData, setScenesData, editHeading, editNarration, setEditingSceneData);
            setEditHeading('');
            setEditNarration('');
        }
    };

    const handleCancelEdit = () => {
        HelperFunctions.cancelEdit(setEditingSceneData, setEditHeading, setEditNarration);
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination } = result;
        if (source.index === destination.index) return;

        // Reorder SceneData
        const updatedSceneData = Array.from(scenesData);
        const [reorderedSceneData] = updatedSceneData.splice(source.index, 1);
        updatedSceneData.splice(destination.index, 0, reorderedSceneData);
        setScenesData(updatedSceneData);

        // Reorder SceneData images map to follow the SceneData
        const updatedSceneDataImagesMap: Record<number, string[]> = {};

        // Create a temporary mapping of old indices to their images
        const tempImageMap: Record<number, string[]> = {};
        Object.keys(SceneDataImagesMap).forEach(key => {
            tempImageMap[parseInt(key)] = SceneDataImagesMap[parseInt(key)];
        });

        // Reorder the images based on the new SceneData order
        updatedSceneData.forEach((sceneData, newIndex) => {
            // Find the original index of this SceneData
            const originalIndex = scenesData.findIndex(c => c.id === sceneData.id);
            if (originalIndex !== -1 && tempImageMap[originalIndex]) {
                updatedSceneDataImagesMap[newIndex] = tempImageMap[originalIndex];
            }
        });

        setScenesDataImagesMap(updatedSceneDataImagesMap);

        // Update selected SceneData index if needed
        if (selectedSceneDataIndex === source.index) {
            setSelectedSceneDataIndex(destination.index);
        } else if (selectedSceneDataIndex >= Math.min(source.index, destination.index) &&
            selectedSceneDataIndex <= Math.max(source.index, destination.index)) {
            // Adjust selected index if it's in the affected range
            if (source.index < destination.index && selectedSceneDataIndex > source.index) {
                setSelectedSceneDataIndex(selectedSceneDataIndex - 1);
            } else if (source.index > destination.index && selectedSceneDataIndex < source.index) {
                setSelectedSceneDataIndex(selectedSceneDataIndex + 1);
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
        setScenesDataImagesMap(prev => ({ ...prev, [selectedSceneDataIndex]: [first, ...(prev[selectedSceneDataIndex] || [])] }));

        setGeneratedImages([first]);
        setAiImagesEnabled(true);
        setRightTabIndex(0);
    };

    const handleGenerateImages = async () => {
        try {
            setImagesLoading(true);
            const visuals = aiPrompt;
            const res = await fetch(API_ENDPOINTS.GENERATE_IMAGES, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visuals })
            });
            const data = await res.json();
            const imgs: string[] = Array.isArray(data?.images) && data.images.length > 0 ? data.images : [fallbackImages[selectedSceneDataIndex % fallbackImages.length]];
            const first = imgs[0];
            setScenesDataImagesMap(prev => ({ ...prev, [selectedSceneDataIndex]: [first, ...(prev[selectedSceneDataIndex] || [])] }));
            setGeneratedImages([first]);
            setAiImagesEnabled(true);
            setRightTabIndex(0);
        } catch (e) {
            console.error('AI generate failed', e);
            const first = fallbackImages[selectedSceneDataIndex % fallbackImages.length];
            setScenesDataImagesMap(prev => ({ ...prev, [selectedSceneDataIndex]: [first, ...(prev[selectedSceneDataIndex] || [])] }));
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

    const selectSceneData = (idx: number) => {
        setSelectedSceneDataIndex(idx);
        if (aiImagesEnabled) {
            const imgs = SceneDataImagesMap[idx] || [];
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
            scriptData?.main_content && `${headers.main_content}:\n${scriptData?.main_content}`,
            scriptData?.conclusion && `${headers.conclusion}:\n${scriptData?.conclusion}`,
            scriptData?.call_to_action && `${headers.call_to_action}:\n${scriptData?.call_to_action}`
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
            SecureStorageHelpers.setScriptMetadata(updatedScriptData);
        }

        setIsEditingScript(false);
        toast.success('Script updated successfully!');
    };

    const handleCancelEditingScript = () => {
        // Reset edited script to original
        setEditedScript(scriptData?.script || '');

        // Reset script section data to original values from secure storage
        try {
            const storedMetadata = SecureStorageHelpers.getScriptMetadata();
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
            } else if (line.includes(headers.main_content)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'main_content';
                currentContent = '';
            } else if (line.includes(headers.conclusion)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'conclusion';
                currentContent = '';
            } else if (line.includes(headers.call_to_action)) {
                if (currentSection && currentContent.trim()) {
                    newScriptData[currentSection] = currentContent.trim();
                }
                currentSection = 'call_to_action';
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
        const { title, hook, main_content, conclusion, call_to_action } = scriptData || {};
        const headers = HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english');

        // If we have script metadata, format it with sections
        if (title || hook || main_content || conclusion || call_to_action) {
            let formattedScript = '';

            if (title) {
                formattedScript += `${headers.title}:\n${title}\n\n`;
            }

            if (hook) {
                formattedScript += `${headers.hook}:\n${hook}\n\n`;
            }

            if (main_content) {
                formattedScript += `${headers.main_content}:\n${main_content}\n\n`;
            }

            if (conclusion) {
                formattedScript += `${headers.conclusion}:\n${conclusion}\n\n`;
            }

            if (call_to_action) {
                formattedScript += `${headers.call_to_action}:\n${call_to_action}\n\n`;
            }

            return formattedScript.trim();
        }

        // Fallback to original script if no metadata
        return scriptData?.script || '';
    };

    const handleApproveScript = async () => {
        setLoading(true);
        const jobId = HelperFunctions.generateJobId();
        setJobId(jobId);

        const sceneFolderResult: { success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string } = await GoogleDriveServiceFunctions.generateAFolderOnDrive(jobId);
        if (!sceneFolderResult.success || !sceneFolderResult.result) {
            setLoading(false);
            toast.error(sceneFolderResult.message || 'Failed to generate scene folder');
            return;
        }
        // console.log('Scene folder result:', sceneFolderResult.result);
        // push this script data to the scripts_approved table in supabase


        // save the profile settings to the secure storage
        const profileSettings = await profileService.getProfileSettings(scriptData?.user_id || '');
        const approvedData = { ...scriptData, jobId: jobId, status: SCRIPT_STATUS.APPROVED, projectSettings: profileSettings.projectSettings, updated_at: new Date().toISOString() } as any;
        setScriptData(approvedData);
        SecureStorageHelpers.setScriptMetadata(approvedData);
        // const { error } = await SupabaseHelpers.saveApprovedScript(data);
        // if (error) {
        //     console.error('Error saving approved script:', error);
        // } else {
        setIsScriptApproved(true);
        // show an empty upload view to the user to ask him to upload the Narration to proceed with the video generation
        setIsNarrationUploadView(true);
        setPageTitle('Step 2: Narrator Video Upload Stage');
        // console.log('Approved script saved successfully');
        // }
        setLoading(false);
        toast.success('Script approved! Now generating scenes breakdown...');

    };

    const handleCancelBack = () => {
        setShowBackConfirmation(false);
    };

    // Handle text selection for highlighting keywords
    const handleTextSelection = (SceneDataIndex: number, event: React.MouseEvent) => {
        // console.log('handleTextSelection called for SceneData:', SceneDataIndex);

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
                            SceneDataIndex,
                            text: actualSelectedText,
                            startIndex,
                            endIndex
                        });
                    }
                } else {
                    // Different text nodes - use the selection text directly
                    // console.log('Different text nodes - using selection text directly');
                    setSelectedText({
                        SceneDataIndex,
                        text: selectedText,
                        startIndex: 0,
                        endIndex: selectedText.length
                    });
                }
            } else if (startContainer.nodeType === Node.ELEMENT_NODE || endContainer.nodeType === Node.ELEMENT_NODE) {
                // Selection spans across elements - use the selection text directly
                // console.log('Selection spans elements - using selection text directly');
                setSelectedText({
                    SceneDataIndex,
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

    // Save highlighted keywords to SceneData
    const saveHighlightedKeywords = (SceneDataIndex: number, keywords: string[]) => {
        const updatedSceneData = scenesData.map((sceneData, index) => {
            if (index === SceneDataIndex) {
                return {
                    ...sceneData,
                    highlightedKeywords: keywords
                };
            }
            return sceneData;
        });
        setScenesData(updatedSceneData);
        setSelectedText(null);
    };

    // Add keyword to highlighted list
    const addKeyword = () => {
        if (!selectedText) return;

        const SceneData = scenesData[selectedText.SceneDataIndex];
        const currentKeywords = SceneData.highlightedKeywords || [];
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
        saveHighlightedKeywords(selectedText.SceneDataIndex, newKeywords);
        toast.success(`Added "${selectedText.text}" to keywords`);

        // Open media selector with this keyword as suggestion
        try {
            if (typeof window !== 'undefined') {
                (window as any).__keywordSuggestions = { keyword: selectedText.text, keywords: [selectedText.text] };
            }
            setMediaManagementSceneDataIndex(selectedText.SceneDataIndex);
            setMediaManagementOpen(true);
        } catch { }

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
            const isTextArea = target.closest('[data-scenedata-index]');
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

    const handleConfirmBack = () => {
        // Clear script data from secure storage when leaving
        try {
            console.warn('auto moving back to trending topics');
            SecureStorageHelpers.removeApprovedScript();
            SecureStorageHelpers.removeScriptMetadata();
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
                desc={`We are processing your script...`}
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

    const showDownloadGatePanel = isScriptApproved && !hasDownloadedScript && scenesData.length === 0;

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
                        size="medium"
                        sx={{ fontSize: '1.25rem' }}
                    >
                        Back
                    </Button>
                    <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 2.5, fontSize: '1.5rem' }}>
                        {pageTitle}
                    </Typography>
                </Box>

                {/* Top-right controls: Download Script + Duration */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {isScriptApproved && !showDownloadGatePanel && (
                        <Button variant="contained" size="medium" startIcon={<DownloadIcon />} sx={{ textTransform: 'none', fontSize: '1.25rem' }}
                            onClick={() => {
                                HelperFunctions.handleDownloadAllNarrations(scriptData as ScriptData);
                                setHasDownloadedScript(true);
                                // Persist flag in script metadata
                                try {
                                    const updated = { ...(scriptData as ScriptData), isScriptDownloaded: true, updated_at: new Date().toISOString() } as ScriptData;
                                    setScriptData(updated);
                                    SecureStorageHelpers.setScriptMetadata(updated);
                                } catch { }
                            }}
                        >
                            Download Script
                        </Button>
                    )}

                    {!isInitialLoading && isScriptApproved && videoDuration !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.25rem', lineHeight: 1.5 }}>
                                Video Duration:
                            </Typography>
                            <Chip
                                label={`${HelperFunctions.formatTime(videoDuration)}`}
                                size="medium"
                                color="success"
                                sx={{ fontSize: '1.25rem', fontWeight: 500, height: 28, '& .MuiChip-label': { px: 1, lineHeight: 1.4 } }}
                            />
                        </Box>
                    )}
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

                    {isInitialLoading && (
                        <AppLoadingOverlay />
                    )}

                    {/* Header section - fixed */}
                    {!isInitialLoading && !scriptData?.transcription && (
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
                                variant="h4"
                                sx={{
                                    color: 'primary.main',
                                    flex: 1,
                                    minWidth: 0,
                                    lineHeight: 2.5,
                                    textAlign: isRTLLanguage(scriptData?.language || 'english') ? 'right' : 'left',
                                    fontFamily: HelperFunctions.getFontFamilyForLanguage(scriptData?.language || 'english'),
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                }}
                            >
                                📋 {scriptData?.title}
                            </Typography>
                            {false && (
                                <Box />
                            )}

                            {!isScriptApproved && (
                                <Box sx={{
                                    bgcolor: 'background.paper',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexShrink: 0
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>

                                        {!isEditingScript && !isScriptApproved ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    startIcon={<EditIcon />}
                                                    onClick={handleStartEditingScript}
                                                    sx={{
                                                        textTransform: 'none',
                                                        px: 2,
                                                        py: 1.5,
                                                        lineHeight: 1.5,
                                                        gap: 1,
                                                        fontSize: '1.25rem',
                                                        width: '100%'
                                                    }}
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
                                                        py: 1.5,
                                                        px: 2,
                                                        gap: 1,
                                                        fontSize: '1.25rem',
                                                        bgcolor: 'success.main',
                                                        textTransform: 'none',
                                                        lineHeight: 1.5,
                                                        width: '100%',
                                                        '&:hover': { bgcolor: 'success.dark' }
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    startIcon={<SaveIcon />}
                                                    onClick={handleSaveScript}
                                                    sx={{
                                                        textTransform: 'none',
                                                        py: 1.5,
                                                        px: 2,
                                                        gap: 1,
                                                        lineHeight: 1.5,
                                                        fontSize: '1.25rem',
                                                        width: '100%'
                                                    }}
                                                >
                                                    Save
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    size="large"
                                                    color="secondary"
                                                    startIcon={<CancelIcon />}
                                                    onClick={handleCancelEditingScript}
                                                    sx={{
                                                        textTransform: 'none',
                                                        py: 1.5,
                                                        px: 2,
                                                        gap: 1,
                                                        lineHeight: 1.5,
                                                        fontSize: '1.25rem',
                                                        width: '100%'
                                                    }}
                                                >
                                                    Discard
                                                </Button>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}

                    {!isInitialLoading && !isScriptApproved && !scriptData?.transcription && (
                        <Paper sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            mb: 1,
                            paddingBottom: 1,
                            // maxHeight: '85vh',
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
                                                📝 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').main_content}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={8}
                                                variant="outlined"
                                                value={scriptData?.main_content || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, main_content: e.target.value } : prev)}
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
                                                🚀 {HelperFunctions.getLocalizedSectionHeaders(scriptData?.language || 'english').call_to_action}
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={3}
                                                variant="outlined"
                                                value={scriptData?.call_to_action || ''}
                                                onChange={(e) => setScriptData(prev => prev ? { ...prev, call_to_action: e.target.value } : prev)}
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
                                                fontSize: '1.6rem',
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
                    )}

                    {(isNarrationUploadView || isNarratorVideoUploaded || (isScriptApproved && !hasDownloadedScript)) && scenesData.length === 0 &&
                        //show an empty upload view to the user to ask him to upload the Narration to proceed with the video generation
                        <Paper sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            // mb: 1,
                            // paddingBottom: 1,
                            // maxHeight: '85vh',
                            // overflow: 'auto',
                        }}>
                            <Box sx={{ p: 2 }}>
                                {(isScriptApproved && hasDownloadedScript) ? (
                                    <ChromaKeyUpload
                                        jobId={jobId || 'job-chroma-key'}
                                        scriptData={scriptData as ScriptData}
                                        setScriptData={setScriptData}
                                        videoDurationCaptured={(duration: number) => {
                                            setVideoDuration(duration);
                                            const updatedScriptData = {
                                                ...scriptData,
                                                videoDuration: duration,
                                                updated_at: new Date().toISOString(),
                                            } as ScriptData;
                                            setScriptData(updatedScriptData);
                                            SecureStorageHelpers.setScriptMetadata(updatedScriptData);
                                        }}
                                        onUploadComplete={async (driveUrl: string, transcriptionData: any, backgroundType: BackgroundType) => {
                                            setPageTitle('Final Step: Scene Composition & Video Generation');
                                            setIsNarratorVideoUploaded(true);
                                            setIsNarrationUploadView(false);

                                            const updatedScriptData = {
                                                ...scriptData,
                                                videoBackground: backgroundType,
                                                status: SCRIPT_STATUS.UPLOADED,
                                                narrator_chroma_key_link: driveUrl,
                                                transcription: transcriptionData.text,
                                                scenesData: transcriptionData.scenes,
                                                updated_at: new Date().toISOString(),
                                            } as ScriptData;
                                            console.log('updatedScriptData: ', JSON.stringify(updatedScriptData, null, 2));
                                            setScriptData(updatedScriptData);
                                            SecureStorageHelpers.setScriptMetadata(updatedScriptData);

                                            // Loop the scenes data and generate scene folder in google drive by using googleDriveService function
                                            for (const scene of transcriptionData.scenes) {
                                                const data = await GoogleDriveServiceFunctions.uploadClipsInSceneFolder(jobId, scene, transcriptionData.scenes.length);
                                                if (!data?.success) {
                                                    toast.error('Failed to upload clip');
                                                    continue;
                                                }
                                                console.log('Clip uploaded successfully', data);
                                                const updatedScriptData = {
                                                    ...scriptData,
                                                    scenesData: transcriptionData.scenes?.map((scene: SceneData) => scene.id === scene.id ? { ...scene, clip: data.webViewLink } : scene) || [],
                                                } as ScriptData;
                                                console.log('updatedScriptData: ', JSON.stringify(updatedScriptData.scenesData, null, 2));
                                                setScriptData(updatedScriptData);
                                                SecureStorageHelpers.setScriptMetadata(updatedScriptData);
                                            }

                                            updateParagraphs(updatedScriptData);

                                            // // generate scene folder in google drive by using googleDriveService function
                                            // const sceneFolderResult = await GoogleDriveServiceFunctions.generateSceneFoldersInDrive(jobId, transcriptionData.scenes.length);
                                            // if (!sceneFolderResult.success) {
                                            //     toast.error(sceneFolderResult.message || 'Failed to generate scene folder');
                                            //     return;
                                            // }
                                            // console.log('Scene folder result:', sceneFolderResult.result);
                                        }}
                                        onUploadFailed={(errorMessage: string) => {
                                            toast.error(errorMessage);
                                            console.log("onUploadFailed: ", errorMessage);
                                            setIsNarrationUploadView(true);
                                            setIsNarratorVideoUploaded(false);
                                            setHasDownloadedScript(true);
                                        }}
                                    />
                                ) : (
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 4,
                                            borderRadius: 3,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            background: 'linear-gradient(135deg, rgba(25,118,210,0.06), rgba(102,187,106,0.06))',
                                            border: '1px dashed',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 3, flexWrap: 'wrap' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 280 }}>
                                                <Box sx={{
                                                    width: 56, height: 56, borderRadius: '50%',
                                                    bgcolor: 'primary.main', color: 'primary.contrastText',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: 2
                                                }}>
                                                    <DownloadIcon sx={{ fontSize: 30 }} />
                                                </Box>
                                                <Box>
                                                    <Typography variant="h6" sx={{ mb: 0.5, fontSize: '1.4rem' }}>
                                                        Download your script to proceed
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                                                        We’ll unlock the narrator video upload right after you download.
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexGrow: 1, }}>
                                                <Chip label="1. Review" color="default" sx={{ fontSize: '1rem' }} icon={<svg style={{ fontSize: 25, marginLeft: 5, marginRight: -10 }} viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M9.29 16.29a1 1 0 0 1-1.42 0l-3.29-3.3a1 1 0 1 1 1.42-1.41l2.29 2.29 6.29-6.3a1 1 0 0 1 1.42 1.42l-7 7Z"></path></svg>} />
                                                <Chip label="2. Download" color="primary" sx={{ fontSize: '1rem' }} />
                                                <Chip label="3. Upload Narrator Video" color="success" variant="outlined" sx={{ fontSize: '1rem' }} />
                                            </Box>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, justifyContent: 'center', minWidth: 260 }}>
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<DownloadIcon />}
                                                    sx={{
                                                        textTransform: 'none',
                                                        fontSize: '1.2rem',
                                                        px: 3,
                                                        py: 1.2,
                                                        boxShadow: 2
                                                    }}
                                                    onClick={() => {
                                                        HelperFunctions.handleDownloadAllNarrations(scriptData as ScriptData);
                                                        setHasDownloadedScript(true);
                                                        setIsNarrationUploadView(true);
                                                        // Persist flag in script metadata
                                                        try {
                                                            const updated = { ...(scriptData as ScriptData), isScriptDownloaded: true, updated_at: new Date().toISOString() } as ScriptData;
                                                            setScriptData(updated);
                                                            SecureStorageHelpers.setScriptMetadata(updated);
                                                        } catch { }
                                                    }}
                                                >
                                                    Download Script
                                                </Button>

                                            </Box>
                                        </Box>

                                    </Paper>
                                )}
                            </Box>
                        </Paper>
                    }

                    {scriptData?.status === SCRIPT_STATUS.UPLOADED && scriptData?.transcription && scenesData && scenesData.length > 0 &&
                        <Paper sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            mb: 1,
                            paddingBottom: 1,
                            // maxHeight: '85vh',
                            overflow: 'auto',
                        }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', pr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end', mb: 2, }}>
                                    <Button variant="contained" size="medium" sx={{ textTransform: 'none', fontSize: '1.25rem' }} onClick={() => openProjectSettingsDialog('project')} startIcon={<SettingsIcon />}>Project Settings </Button>
                                </Box>

                                <SceneDataSection
                                    jobId={jobId}
                                    SceneDataGenerated={true}
                                    generatingSceneData={false}
                                    scenesData={scenesData}
                                    editingSceneData={editingSceneData}
                                    editHeading={editHeading}
                                    editNarration={editNarration}
                                    selectedSceneDataIndex={selectedSceneDataIndex}
                                    rightTabIndex={rightTabIndex}
                                    aiImagesEnabled={aiImagesEnabled}
                                    imagesLoading={imagesLoading}
                                    generatedImages={generatedImages}
                                    aiPrompt={aiPrompt}
                                    pickerOpen={pickerOpen}
                                    pickerSceneDataIndex={pickerSceneDataIndex}
                                    pickerNarrations={pickerNarrations}
                                    pickerLoading={pickerLoading}
                                    uploadedImages={uploadedImages}
                                    isDraggingUpload={isDraggingUpload}
                                    SceneDataImagesMap={SceneDataImagesMap}
                                    selectedText={selectedText}
                                    onSceneDataUpdate={(scenesData: SceneData[]) => {
                                        setScenesData(scenesData);
                                        SecureStorageHelpers.setScriptMetadata({ ...scriptData, scenesData: scenesData });
                                    }}
                                    onAddSceneDataAfter={handleAddSceneDataAfter}
                                    onDeleteSceneData={handleDeleteSceneData}
                                    onSaveEdit={handleSaveEdit}
                                    onCancelEdit={handleCancelEdit}
                                    onEditHeadingChange={setEditHeading}
                                    onEditNarrationChange={setEditNarration}
                                    onStartEdit={handleEditSceneData}
                                    onDragEnd={handleDragEnd}
                                    onSelectSceneData={selectSceneData}
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
                                    onPickerSceneDataIndex={setPickerSceneDataIndex}
                                    onPickerLoading={setPickerLoading}
                                    onPickerNarrations={setPickerNarrations}
                                    onSceneDataImagesMapChange={setScenesDataImagesMap}
                                    onGeneratedImagesChange={setGeneratedImages}
                                    onRightTabIndexChange={setRightTabIndex}
                                    mediaManagementOpen={mediaManagementOpen}
                                    mediaManagementSceneDataIndex={mediaManagementSceneDataIndex}
                                    onMediaManagementOpen={setMediaManagementOpen}
                                    onMediaManagementSceneDataIndex={setMediaManagementSceneDataIndex}
                                    onTextSelection={handleTextSelection}
                                    onAddKeyword={addKeyword}
                                    onClearSelection={() => handleClearSelection()}
                                    onToolbarInteraction={setIsInteractingWithToolbar}
                                    language={scriptData?.language || 'english'}
                                    onGoogleImagePreview={(imageUrl: any) => {
                                        // Open the image in a new tab for preview
                                        window.open(imageUrl, '_blank');
                                    }}
                                    SceneDataEditDialogOpen={SceneDataEditDialogOpen}
                                    onSceneDataEditDialogOpen={setScenesDataEditDialogOpen}
                                    onSceneDataEditDialogSceneDataIndex={setScenesDataEditDialogSceneDataIndex}
                                    driveBackgrounds={driveLibrary?.backgrounds || []}
                                    driveMusic={driveLibrary?.music || []}
                                    driveTransitions={predefinedTransitions.map((t) => ({ id: t, name: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }))}
                                    projectSettings={projectSettings}
                                    onOpenProjectSettingsDialog={(sceneIndex: number) => openProjectSettingsDialog('scene', sceneIndex)}
                                    scriptTitle={scriptData?.title || ''}
                                    trendingTopic={scriptData?.topic || ''}
                                    location={scriptData?.region || ''}
                                />

                                {/* Production Actions - Only show when script is approved */}
                                <Box sx={{ mt: 5 }}>
                                    {/* <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', lineHeight: 2.5, fontSize: '1.5rem' }}>
                                    🎬 Production Actions
                                </Typography> */}

                                    {/* Other Actions */}
                                    <Grid container spacing={2}>

                                        <Grid item xs={12}>
                                            <Button
                                                variant="contained"
                                                size="medium"
                                                fullWidth
                                                startIcon={<VideoIcon />}
                                                onClick={() => uploadCompleteProjectToDrive()}
                                                disabled={!scenesData.length}
                                                sx={{ textTransform: 'none', fontSize: '1.25rem' }}
                                            >
                                                Generate Video
                                            </Button>
                                        </Grid>

                                    </Grid>
                                </Box>
                            </Box>
                        </Paper>
                    }

                </Box>

            </Box>

            {/* Back Confirmation Dialog */}
            <BackConfirmationDialog
                open={showBackConfirmation}
                onClose={handleCancelBack}
                onConfirm={handleConfirmBack}
                isComplete={completeProjectUploaded}
            />

            {/* Project Settings Dialog */}
            <ProjectSettingsDialog
                jobId={jobId}
                userId={scriptData?.user_id || ''}
                open={projectSettingsDialogOpen}
                onClose={closeProjectSettingsDialog}
                onApply={(mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => applyProjectSettingsDialog(mode, projectSettings, sceneSettings)}
                projectSettingsContext={projectSettingsContext}
                pSettings={projectSettings}
                sSettings={sceneSettings}
            />
        </Box>
    );
};

export default ScriptProductionClient;

