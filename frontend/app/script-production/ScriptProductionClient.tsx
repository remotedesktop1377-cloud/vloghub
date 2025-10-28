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
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SettingsIcon from '@mui/icons-material/Settings';
import { HelperFunctions, SecureStorageHelpers } from '@/utils/helperFunctions';
import { toast, ToastContainer } from 'react-toastify';
import { secure } from '@/utils/helperFunctions';
import { getDirectionSx, isRTLLanguage } from '@/utils/languageUtils';
import { API_ENDPOINTS } from '../../src/config/apiEndpoints';
import { SceneData } from '@/types/sceneData';
import { EffectsPanel } from '@/components/videoEffects/EffectsPanel';
import SceneDataSection from '@/components/TrendingTopicsComponent/SceneSection';
import ChromaKeyUpload from '@/components/scriptProductionComponents/ChromaKeyUpload';
import { DropResult } from 'react-beautiful-dnd';
import { fallbackImages } from '@/data/mockImages';
import { SUCCESS } from '@/styles/colors';
import { ROUTES_KEYS, SCRIPT_STATUS } from '@/data/constants';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import CustomAudioPlayer from '@/components/scriptProductionComponents/CustomAudioPlayer';
import { SupabaseHelpers } from '@/utils/SupabaseHelpers';
import { ScriptData } from '@/types/scriptData';
import { BackgroundType } from '@/types/backgroundType';
import BackConfirmationDialog from '@/dialogs/BackConfirmationDialog';
import ProjectSettingsDialog from '@/dialogs/ProjectSettingsDialog';
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';

const ScriptProductionClient = () => {

    const router = useRouter();
    const [scriptData, setScriptData] = useState<ScriptData | null>(null);
    const [noScriptFound, setNoScriptFound] = useState<boolean>(false);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

    // Script approval states
    const [isScriptApproved, setIsScriptApproved] = useState(false);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [estimatedDuration, setEstimatedDuration] = useState('');

    // Navigation confirmation states
    const [showBackConfirmation, setShowBackConfirmation] = useState(false);

    // Production states
    const [scenesData, setScenesData] = useState<SceneData[]>([]);
    const [chromaKeyFile, setChromaKeyFile] = useState<File | null>(null);
    const [uploadingChromaKey, setUploadingChromaKey] = useState(false);

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
    const [selectedText, setSelectedText] = useState<{ SceneDataIndex: number; text: string; startIndex: number; endIndex: number } | null>(null);
    const [isInteractingWithToolbar, setIsInteractingWithToolbar] = useState(false);
    const [driveLibrary, setDriveLibrary] = useState<{ backgrounds?: any[]; music?: any[]; transitions?: any[] } | null>(null);
    // Project-level settings
    const [projectLogo, setProjectLogo] = useState<{ name?: string; url: string; position?: string } | null>(null);
    const [projectTransitionId, setProjectTransitionId] = useState<string>('');
    const [projectMusic, setProjectMusic] = useState<{ selectedMusic: string; volume: number; autoAdjust?: boolean; fadeIn?: boolean; fadeOut?: boolean } | null>(null);
    const [projectVideoClip, setProjectVideoClip] = useState<{ name?: string; url: string } | null>(null);
    const [narratorChromaKeyLink, setNarratorChromaKeyLink] = useState<string | null>(null);
    const [projectTransitionEffects, setProjectTransitionEffects] = useState<string[]>([]);
    const [videoPreviewOpen, setVideoPreviewOpen] = useState(false);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [isMusicLoading, setIsMusicLoading] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [lastMusicIdLoaded, setLastMusicIdLoaded] = useState<string | null>(null);
    const [completeProjectUploaded, setCompleteProjectUploaded] = useState(false);
    const [pageTitle, setPageTitle] = useState('Script Review & Approval');

    const CONTROL_HEIGHT = 44;
    const [jobId, setJobId] = useState<string>('');
    // SceneData edit dialog states
    const [SceneDataEditDialogOpen, setScenesDataEditDialogOpen] = useState(false);
    const [SceneDataEditDialogSceneDataIndex, setScenesDataEditDialogSceneDataIndex] = useState<number | null>(null);
    // Project Settings Dialog state
    const [projectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);
    const [projectSettingsContext, setProjectSettingsContext] = useState<{ mode: 'project' | 'scene'; sceneIndex?: number }>({ mode: 'project' });
    // Temp state used inside dialog for cancel/discard behavior
    const [tmpTransitionId, setTmpTransitionId] = useState<string>('');
    const [tmpMusic, setTmpMusic] = useState<{ selectedMusic: string; volume: number; autoAdjust?: boolean; fadeIn?: boolean; fadeOut?: boolean } | null>(null);
    const [tmpLogo, setTmpLogo] = useState<{ name?: string; url: string; position?: string } | null>(null);
    const [tmpClip, setTmpClip] = useState<{ name?: string; url: string } | null>(null);
    const [tmpEffects, setTmpEffects] = useState<string[]>([]);
    // Seed snapshot for change detection
    const projectSettingsSeedRef = useRef<{ transition?: string; music?: any; logo?: any; clip?: any; effects?: string[] } | null>(null);

    const predefinedTransitions = [
        'quantum_dissolve',
        'particle_burst',
        'quantum_tunnel',
        'digital_matrix',
        'data_stream',
        'holographic_dissolve',
        'reality_shift',
        'quantum_fade_to_black'
    ];

    useEffect(() => {
        let storedData = null;

        // First try to load from metadata (for unapproved scripts)
        try {
            const storedMetadata = SecureStorageHelpers.getScriptMetadata();
            if (storedMetadata && typeof storedMetadata === 'object') {
                storedData = storedMetadata;
                setScriptData(storedData);
                if (storedData.status === SCRIPT_STATUS.APPROVED || storedData.status === SCRIPT_STATUS.UPLOADED) {
                    setJobId(storedData.jobId);
                    setIsScriptApproved(true);
                    setIsNarrationUploadView(true);
                    setPageTitle('Step 2: Narrator Video Upload Stage');
                }

                if (storedData.status === SCRIPT_STATUS.UPLOADED && storedData.narrator_chroma_key_link) {
                    setIsNarrationUploadView(false);
                    setIsNarratorVideoUploaded(true);
                    setPageTitle('Final Step: Scene Composition & Video Generation');

                    if (storedData.transcription) {
                        setNarratorChromaKeyLink(storedData.narrator_chroma_key_link);
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

    // Calculate estimated duration when script data changes
    useEffect(() => {
        if (scriptData) {
            setEstimatedDuration(HelperFunctions.calculateDuration(scriptData.transcription));
        }
    }, [scriptData]);

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

    useEffect(() => {
        if (scriptData?.transcription && scenesData && scenesData.length > 0) {

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
                });
            } else {
                setLoading(false);
            }

        }
    }, [scenesData]);

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
            const ve: any = (ch as any)?.videoEffects || {};
            const seedTransition = ve.transition || projectTransitionId || '';
            const seedMusic = ve.backgroundMusic ? { ...ve.backgroundMusic } : (projectMusic ? { ...projectMusic } : null);
            const seedLogo = ve.logo ? { ...ve.logo } : (projectLogo ? { ...projectLogo } : null);
            const seedClip = ve.clip ? { ...ve.clip } : (projectVideoClip ? { ...projectVideoClip } : null);
            const seedEffects = Array.isArray(ve.transitionEffects) ? [...ve.transitionEffects] : ([...(projectTransitionEffects || [])]);
            setTmpTransitionId(seedTransition);
            setTmpMusic(seedMusic);
            setTmpLogo(seedLogo);
            setTmpClip(seedClip);
            setTmpEffects(seedEffects);
            projectSettingsSeedRef.current = { transition: seedTransition, music: seedMusic, logo: seedLogo, clip: seedClip, effects: seedEffects };
        } else {
            // seed temporary state from current project selections
            const seedTransition = projectTransitionId || '';
            const seedMusic = projectMusic ? { ...projectMusic } : null;
            const seedLogo = projectLogo ? { ...projectLogo } : null;
            const seedClip = projectVideoClip ? { ...projectVideoClip } : null;
            const seedEffects = [...(projectTransitionEffects || [])];
            setTmpTransitionId(seedTransition);
            setTmpMusic(seedMusic);
            setTmpLogo(seedLogo);
            setTmpClip(seedClip);
            setTmpEffects(seedEffects);
            projectSettingsSeedRef.current = { transition: seedTransition, music: seedMusic, logo: seedLogo, clip: seedClip, effects: seedEffects };
        }
        setProjectSettingsDialogOpen(true);
    };

    const closeProjectSettingsDialog = () => {
        setProjectSettingsDialogOpen(false);
    };

    const applyProjectSettingsDialog = async () => {
        // Apply to scenes according to context
        if (projectSettingsContext.mode === 'project') {
            // Update project-level states from temp (global apply)
            setProjectTransitionId(tmpTransitionId || '');
            setProjectMusic(tmpMusic ? { selectedMusic: tmpMusic.selectedMusic } as any : null);
            setProjectLogo(tmpLogo ? { ...tmpLogo } : null);
            setProjectVideoClip(tmpClip ? { ...tmpClip } : null);
            setProjectTransitionEffects([...(tmpEffects || [])]);
            const updated = scenesData.map((ch) => ({
                ...(ch as any),
                videoEffects: {
                    ...(ch as any).videoEffects,
                    transition: tmpTransitionId || '',
                    backgroundMusic: tmpMusic ? ({ selectedMusic: tmpMusic.selectedMusic } as any) : null,
                    logo: tmpLogo || null,
                    clip: tmpClip || null,
                    transitionEffects: tmpEffects || [],
                }
            }));
            setScenesData(updated);
            try {
                for (let i = 0; i < updated.length; i++) {
                    await HelperFunctions.persistSceneUpdate(jobId, updated, i, 'Project settings applied to all scenes');
                }
            } catch { }
        } else if (projectSettingsContext.mode === 'scene' && typeof projectSettingsContext.sceneIndex === 'number') {
            const idx = projectSettingsContext.sceneIndex;
            const seed = projectSettingsSeedRef.current;
            const updated = scenesData.map((ch, i) => {
                if (i !== idx) return ch;
                const currentVE: any = (ch as any).videoEffects || {};
                // Only replace fields that changed compared to seed
                const nextVE: any = { ...currentVE };
                if (!seed || seed.transition !== tmpTransitionId) nextVE.transition = tmpTransitionId || '';
                if (!seed || JSON.stringify(seed.music || null) !== JSON.stringify(tmpMusic ? { selectedMusic: tmpMusic.selectedMusic } : null)) nextVE.backgroundMusic = tmpMusic ? ({ selectedMusic: tmpMusic.selectedMusic } as any) : null;
                if (!seed || JSON.stringify(seed.logo || null) !== JSON.stringify(tmpLogo || null)) nextVE.logo = tmpLogo || null;
                if (!seed || JSON.stringify(seed.clip || null) !== JSON.stringify(tmpClip || null)) nextVE.clip = tmpClip || null;
                if (!seed || JSON.stringify(seed.effects || []) !== JSON.stringify(tmpEffects || [])) nextVE.transitionEffects = tmpEffects || [];
                return ({ ...(ch as any), videoEffects: nextVE });
            });
            setScenesData(updated);
            try {
                setProjectSettingsDialogOpen(false);
                await HelperFunctions.persistSceneUpdate(jobId, updated, idx, 'Project settings applied to scene');
            } catch {
                setProjectSettingsDialogOpen(false);
            }
        }

        try { (window as any).toast?.success('Saved'); } catch { }
    };

    const handleToggleBackgroundMusic = async () => {
        try {
            const id = (projectMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '';
            if (!id) return;
            const src = `${API_ENDPOINTS.GOOGLE_DRIVE_MEDIA}${id}`;
            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.addEventListener('playing', () => setIsMusicPlaying(true));
                audioRef.current.addEventListener('ended', () => setIsMusicPlaying(false));
                audioRef.current.addEventListener('canplaythrough', () => setIsMusicLoading(false));
                audioRef.current.addEventListener('error', () => setIsMusicLoading(false));
            }
            // Toggle logic: pause if currently playing same source; otherwise (re)load and play
            if (isMusicPlaying && audioRef.current.src.includes(id)) {
                audioRef.current.pause();
                setIsMusicPlaying(false);
                return;
            }
            // If the same id was already loaded previously, do not reload; just resume
            if (lastMusicIdLoaded === id && audioRef.current.src.includes(id)) {
                setIsMusicLoading(false);
            } else {
                setIsMusicLoading(true);
                if (!audioRef.current.src.includes(id)) {
                    audioRef.current.src = src;
                }
                setLastMusicIdLoaded(id);
            }
            await audioRef.current.play();
        } catch {
            setIsMusicLoading(false);
            setIsMusicPlaying(false);
        }
    };

    // Function to upload JSON to Google Drive
    const uploadCompleteProjectToDrive = async () => {
        setLoading(true);
        try {
            // Ensure each SceneData has assets.images populated with all selected sources
            const SceneDataForUpload: SceneData[] = scenesData.map((ch) => {
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
                } as SceneData;
            });

            const scriptProductionJSON = {
                project: {
                    jobName: jobId,
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
                    videoEffects: {
                        transition: projectTransitionId || '',
                        logo: projectLogo,
                        backgroundMusic: projectMusic,
                        clip: projectVideoClip,
                        transitionEffects: projectTransitionEffects,
                    },
                },
                // Use SceneDataForUpload to ensure merged images are included
                script: scenesData.map(sceneData => ({
                    jobId: '',
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
                })),
            };

            const form = new FormData();
            form.append('jobName', jobId);
            form.append('fileName', `project-config.json`);
            form.append('jsonData', JSON.stringify(scriptProductionJSON));

            // // Add chroma key file if available
            // if (chromaKeyFile) {
            //     form.append('file', chromaKeyFile);
            // }

            const uploadResult = await HelperFunctions.uploadContentToDrive(form);
            if (!uploadResult.success) {
                toast.error(uploadResult.result || 'Failed to upload to Google Drive');
                return;
            }
            console.log('Drive result:', uploadResult.result);
            setCompleteProjectUploaded(true);

            // Store scene folder mapping for future updates
            // const sceneFolderMap: Record<string, string> = {};
            // if (result.images?.scenes) {
            //     result.images.scenes.forEach((scene: any) => {            
            //         sceneFolderMap[scene.sceneId] = scene.folderId;
            //     });
            // }

            // const jobId = result.projectFolderId;

            // // Update SceneData with their corresponding folder IDs
            // const updatedSceneData = SceneData.map((SceneData, index) => {
            //     const sceneId = `scene-${index + 1}`;
            //     // const folderId = sceneFolderMap[sceneId];
            //     return {
            //         ...SceneData,
            //         // id: folderId || SceneData.id, // Replace with folder ID if available
            //         jobId: jobId,
            //         jobName: jobName,
            //     };
            // });
            // setScenesData(updatedSceneData);

            setLoading(false);
            setShowBackConfirmation(true);

        } catch (e: any) {
            console.error(e);
            toast.error(`Failed to upload to Google Drive: ${e?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Function to break down script into paragraphs and calculate individual durations
    const updateParagraphs = (scriptData: ScriptData) => {
        // Check if we have scenes data from the new transcribe API
        if (scriptData?.scenesData && Array.isArray(scriptData.scenesData) && scriptData.scenesData.length > 0) {
            console.log('Using scenes data from transcribe API:', scriptData.scenesData.length, 'scenes');

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
                        }
                    }));
                    console.log('Using existing SceneData with scenes data:', normalizedFromStorage.length);
                    setScenesData(normalizedFromStorage);
                    return;
                }
            } catch (error) {
                console.error('Error processing existing SceneData with scenes:', error);
            }

            // Map scenes data to SceneData[] with required fields
            const SceneDataFromScenes: SceneData[] = scriptData.scenesData!.map((scene: any, index: number) => ({
                id: scene.id || `scene-${index + 1}`,
                jobId: jobId || '',
                jobName: jobId || '',
                narration: scene.narration || '',
                duration: scene.duration || '',
                words: scene.words || 0,
                startTime: scene.startTime || 0,
                endTime: scene.endTime || 0,
                durationInSeconds: scene.durationInSeconds || 0,
                keywordsSelected: [],
                assets: { image: null, audio: null, video: null, images: [], imagesGoogle: [], imagesEnvato: [] }
            }));

            console.log('Created SceneData from scenes data:', SceneDataFromScenes.length);
            setScenesData(SceneDataFromScenes);
            return;
        }

        // Fallback to old method if no scenes data available
        console.log('No scenes data found, using legacy paragraph splitting');
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

        const uploadResult: { success: boolean; result: { folderId: string; webViewLink: string } | null; message?: string } = await HelperFunctions.generateAFolderOnDrive(jobId);
        if (!uploadResult.success || !uploadResult.result) {
            setLoading(false);
            toast.error(uploadResult.message || 'Failed to generate a folder on Google Drive');
            return;
        }
        console.log('Drive result:', uploadResult.result);
        // push this script data to the scripts_approved table in supabase
        const approvedData = { ...scriptData, jobId: jobId, status: SCRIPT_STATUS.APPROVED, updated_at: new Date().toISOString() } as any;
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

                {/* Duration Display */}
                {
                    !isInitialLoading && isScriptApproved && narratorChromaKeyLink &&
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon sx={{ color: 'success.main', fontSize: '1.25rem' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.25rem', lineHeight: 1.5 }}>
                            Estimated Duration:
                        </Typography>
                        <Chip
                            label={estimatedDuration}
                            size="medium"
                            color="success"
                            sx={{ fontSize: '1.25rem', fontWeight: 500, height: 28, '& .MuiChip-label': { px: 1, lineHeight: 1.4 } }}
                        />
                    </Box>
                }
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
                            {isScriptApproved && (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                    <Button variant="contained" size="medium" sx={{
                                        textTransform: 'none',
                                        fontSize: '1.25rem',
                                        px: 2,
                                        py: 1.5,
                                        lineHeight: 1.5,
                                        gap: 1,
                                    }}
                                        startIcon={<DownloadIcon />}
                                        onClick={() => HelperFunctions.handleDownloadAllNarrations(scriptData as ScriptData)}
                                    >
                                        Download Script
                                    </Button>
                                </Box>
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

                    {(isNarrationUploadView || isNarratorVideoUploaded) && scenesData.length === 0 &&
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
                                <ChromaKeyUpload
                                    jobId={jobId || 'job-chroma-key'}
                                    scriptData={scriptData as ScriptData}
                                    setScriptData={setScriptData}
                                    onUploadComplete={(driveUrl: string, transcriptionData: any, backgroundType: BackgroundType) => {
                                        setPageTitle('Final Step: Scene Composition & Video Generation');
                                        setIsNarratorVideoUploaded(true);
                                        setIsNarrationUploadView(false);
                                        setNarratorChromaKeyLink(driveUrl);

                                        const updatedScriptData = {
                                            ...scriptData,
                                            videoBackground: backgroundType,
                                            status: SCRIPT_STATUS.UPLOADED,
                                            narrator_chroma_key_link: driveUrl,
                                            transcription: transcriptionData.text,
                                            scenesData: transcriptionData.scenes,
                                            updated_at: new Date().toISOString(),
                                        } as ScriptData;
                                        setScriptData(updatedScriptData);
                                        SecureStorageHelpers.setScriptMetadata(updatedScriptData);
                                        updateParagraphs(updatedScriptData);
                                    }}
                                    onUploadFailed={(errorMessage: string) => {
                                        toast.error(errorMessage);
                                        console.log("errorMessage: ", errorMessage);
                                    }}
                                />
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
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>

                                {/* Project-level Settings (moved into dialog) */}
                                <Paper sx={{ p: 2, mb: 2, }}>
                                    <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'flex-end' }}>
                                        <Button variant="contained" size="medium" sx={{ textTransform: 'none', fontSize: '1.25rem' }} onClick={() => openProjectSettingsDialog('project')} startIcon={<SettingsIcon />}>Project Settings </Button>
                                    </Box>
                                    <Grid container spacing={2} sx={{ display: 'none' }}>
                                        {/* Transition selector */}
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '1.25rem' }}>Transition Effect</Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={projectTransitionId}
                                                onChange={(e) => setProjectTransitionId(String(e.target.value))}
                                                SelectProps={{ native: true }}
                                                sx={{ '& .MuiInputBase-root': { height: CONTROL_HEIGHT, fontSize: '1.25rem' }, '& select': { fontSize: '1.25rem' } }}
                                            >
                                                <option value="">Select transition...</option>
                                                {predefinedTransitions.map((t) => (
                                                    <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                                                ))}
                                            </TextField>
                                        </Grid>

                                        {/* Logo Overlay (single) */}
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '1.25rem' }}>Logo Overlay</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                <TextField size="small" select label="Position" value={projectLogo?.position || 'top-right'} onChange={(e) => setProjectLogo({ ...(projectLogo || { url: '' }), position: String(e.target.value) })} SelectProps={{ native: true }} sx={{ '& .MuiInputBase-root': { height: CONTROL_HEIGHT, fontSize: '1.25rem' }, '& select': { fontSize: '1.25rem' } }}>
                                                    <option value="top-left">top-left</option>
                                                    <option value="top-right">top-right</option>
                                                    <option value="bottom-left">bottom-left</option>
                                                    <option value="bottom-right">bottom-right</option>
                                                </TextField>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{ height: CONTROL_HEIGHT, textTransform: 'none' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'image/*';
                                                        input.onchange = (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0];
                                                            if (!file) return;
                                                            const objectUrl = URL.createObjectURL(file);
                                                            setProjectLogo({ name: file.name, url: objectUrl, position: projectLogo?.position || 'top-right' });
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    Upload Logo
                                                </Button>
                                                {projectLogo?.url && (
                                                    <>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ height: CONTROL_HEIGHT, textTransform: 'none' }}
                                                            onClick={() => window.open(projectLogo.url, '_blank')}
                                                        >
                                                            Preview
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            size="small"
                                                            sx={{ height: CONTROL_HEIGHT, textTransform: 'none' }}
                                                            onClick={() => setProjectLogo(null)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </>
                                                )}
                                                {projectLogo?.url && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <img
                                                            src={projectLogo.url}
                                                            alt={projectLogo.name || 'Logo'}
                                                            style={{ width: 100, height: 100, objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#111', cursor: 'pointer' }}
                                                            onClick={() => window.open(projectLogo.url, '_blank')}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>

                                        {/* Background Music (single) */}
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '1.25rem' }}>Background Music</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <TextField
                                                    select
                                                    fullWidth
                                                    sx={{ '& .MuiInputBase-root': { height: CONTROL_HEIGHT, fontSize: '1.25rem', }, '& select': { fontSize: '1.25rem' } }}
                                                    size="small"
                                                    value={(projectMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || ''}
                                                    onChange={(e) => {
                                                        const selId = String(e.target.value);
                                                        setProjectMusic({ selectedMusic: selId ? `https://drive.google.com/file/d/${selId}/view?usp=drive_link` : '', volume: projectMusic?.volume ?? 0.3, autoAdjust: projectMusic?.autoAdjust ?? true, fadeIn: projectMusic?.fadeIn ?? true, fadeOut: projectMusic?.fadeOut ?? true });
                                                        // Stop currently playing audio when changing selection
                                                        try { audioRef.current?.pause(); } catch { }
                                                        setIsMusicPlaying(false);
                                                        setIsMusicLoading(false);
                                                        setLastMusicIdLoaded(null);
                                                    }}
                                                    SelectProps={{ native: true }}
                                                >
                                                    <option value="">Select music...</option>
                                                    {(driveLibrary?.music || []).map((t: any) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </TextField>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    disabled={!((projectMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '') || isMusicLoading}
                                                    onClick={handleToggleBackgroundMusic}
                                                    sx={{ height: CONTROL_HEIGHT, minWidth: 90, textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: 1 }}
                                                >
                                                    {isMusicLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : (isMusicPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />)}
                                                    {isMusicPlaying ? 'Pause' : 'Play'}
                                                </Button>
                                                {/* Volume option removed as per requirement */}
                                            </Box>
                                        </Grid>

                                        {/* Video Clip (single) */}
                                        <Grid xs={12} md={6} sx={{ mt: 2, pl: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '1.25rem' }}>Video Clips</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{ height: CONTROL_HEIGHT, textTransform: 'none' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.accept = 'video/*';
                                                        input.onchange = (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0];
                                                            if (!file) return;
                                                            const objectUrl = URL.createObjectURL(file);
                                                            setProjectVideoClip({ name: file.name, url: objectUrl });
                                                        };
                                                        input.click();
                                                    }}
                                                >
                                                    Upload Clip
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    sx={{ height: CONTROL_HEIGHT, textTransform: 'none' }}
                                                    onClick={() => setProjectVideoClip(null)}
                                                >
                                                    Remove
                                                </Button>
                                                {projectVideoClip?.url && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box sx={{ position: 'relative', width: 160, height: 90 }} onClick={() => { setVideoPreviewUrl(projectVideoClip.url); setVideoPreviewOpen(true); }}>
                                                            <video
                                                                src={projectVideoClip.url}
                                                                muted
                                                                playsInline
                                                                loop
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#000', cursor: 'pointer' }}
                                                            />
                                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <PlayIcon sx={{ color: '#fff' }} fontSize="small" />
                                                                </Box>
                                                            </Box>
                                                        </Box>

                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                        {/* Video Effects (project-level) */}
                                        {/* <Grid xs={12} sx={{ mt: 2, pl: 2 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '1.25rem' }}>Video Effects</Typography>
                                            <Box sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                                                <EffectsPanel
                                                    selectedEffects={projectTransitionEffects}
                                                    onEffectToggle={(id: string) => {
                                                        setProjectTransitionEffects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                                    }}
                                                    onApplyToAllScenes={(effects: string[]) => {
                                                        setProjectTransitionEffects(effects);
                                                    }}
                                                />
                                            </Box>
                                        </Grid> */}
                                    </Grid>
                                </Paper>

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
                                    onSceneDataUpdate={(SceneData: SceneData[]) => {
                                        setScenesData(SceneData);
                                        SecureStorageHelpers.setScriptMetadata({ ...scriptData, SceneData: SceneData });
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
                                    driveBackgrounds={driveLibrary?.backgrounds}
                                    driveMusic={driveLibrary?.music}
                                    driveTransitions={predefinedTransitions.map((t) => ({ id: t, name: t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }))}
                                    projectSettings={{
                                        transition: projectTransitionId,
                                        musicId: (projectMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '',
                                        logo: projectLogo,
                                        clip: projectVideoClip,
                                        transitionEffects: projectTransitionEffects,
                                    }}
                                    onOpenProjectSettingsDialog={(sceneIndex: number) => openProjectSettingsDialog('scene', sceneIndex)}
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
                                                fullWidth
                                                startIcon={<VideoIcon />}
                                                onClick={() => uploadCompleteProjectToDrive()}
                                                disabled={!scenesData.length}
                                                sx={{
                                                    bgcolor: SUCCESS.main,
                                                    '&:hover': { bgcolor: SUCCESS.dark },
                                                    mb: 1,
                                                    fontSize: '1.25rem',
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
                open={projectSettingsDialogOpen}
                onClose={closeProjectSettingsDialog}
                onApply={applyProjectSettingsDialog}
                context={projectSettingsContext}
                tmpTransitionId={tmpTransitionId}
                tmpMusic={tmpMusic}
                tmpLogo={tmpLogo}
                tmpClip={tmpClip}
                tmpEffects={tmpEffects}
                onTmpTransitionIdChange={setTmpTransitionId}
                onTmpMusicChange={setTmpMusic}
                onTmpLogoChange={setTmpLogo}
                onTmpClipChange={setTmpClip}
                onTmpEffectsChange={setTmpEffects}
                onEffectToggle={(id: string) => {
                    setTmpEffects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                }}
                isMusicLoading={isMusicLoading}
                isMusicPlaying={isMusicPlaying}
                setIsMusicPlaying={setIsMusicPlaying}
                setIsMusicLoading={setIsMusicLoading}
                setLastMusicIdLoaded={setLastMusicIdLoaded}
                predefinedTransitions={predefinedTransitions}
                driveLibrary={driveLibrary}
                setVideoPreviewUrl={setVideoPreviewUrl}
                setVideoPreviewOpen={setVideoPreviewOpen}
            />

            {/* Video Preview Dialog */}
            <Dialog
                open={videoPreviewOpen}
                onClose={() => setVideoPreviewOpen(false)}
                aria-labelledby="clip-preview-dialog-title"
                maxWidth="md"
                fullWidth
            >
                <DialogTitle id="clip-preview-dialog-title" variant="h6">Clip Preview</DialogTitle>
                <DialogContent>
                    {videoPreviewUrl && (() => {
                        const driveIdMatch = /\/d\/([\w-]+)/.exec(videoPreviewUrl || '') || /[?&]id=([\w-]+)/.exec(videoPreviewUrl || '');
                        const effectiveSrc = driveIdMatch && driveIdMatch[1]
                            ? `${API_ENDPOINTS.GOOGLE_DRIVE_MEDIA}${driveIdMatch[1]}`
                            : videoPreviewUrl;
                        return (
                            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: '100%' }}>
                                    <video
                                        key={effectiveSrc}
                                        controls
                                        playsInline
                                        preload="auto"
                                        muted={false}
                                        autoPlay
                                        style={{ width: '100%', maxHeight: 540, borderRadius: 8, backgroundColor: '#000' }}
                                    >
                                        <source src={effectiveSrc} type="video/mp4" />
                                        <source src={effectiveSrc} type="video/webm" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        If the video does not play, <a href={effectiveSrc} target="_blank" rel="noreferrer">open in a new tab</a>.
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })()}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setVideoPreviewOpen(false)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ScriptProductionClient;

