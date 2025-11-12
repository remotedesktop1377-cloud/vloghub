import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Typography,
    Box,
    Grid,
    TextField,
    CircularProgress,
    IconButton,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { toast } from 'react-toastify';
import { HelperFunctions } from '@/utils/helperFunctions';
import { LibraryData } from '@/services/profileService';
import { LogoOverlayInterface, SettingItemInterface, Settings } from '@/types/scriptData';

interface ProjectSettingsContext {
    mode: 'project' | 'scene';
    sceneIndex?: number;
}

interface ProjectSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => void;
    jobId: string | null;
    userId: string;
    projectSettingsContext: ProjectSettingsContext;
    pSettings: Settings | null;
    sSettings: Settings | null;
    driveLibrary: { backgrounds?: any[]; music?: any[]; transitions?: any[], transitionEffects?: any[] };
}

const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
    open,
    onClose,
    onApply,
    jobId,
    userId,
    projectSettingsContext,
    pSettings,
    sSettings,
    driveLibrary,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const transitionVideoRef = useRef<HTMLVideoElement | null>(null);

    const [music, setMusic] = useState<any[]>(driveLibrary?.music || []);
    const [backgrounds, setBackgrounds] = useState<any[]>(driveLibrary?.backgrounds || []);
    const [transitionEffects, setTransitionEffects] = useState<any[]>(driveLibrary?.transitionEffects || []);
    const [currentMusicId, setCurrentMusicId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [transitionVideoError, setTransitionVideoError] = useState(false);
    const [transitionVideoLoading, setTransitionVideoLoading] = useState(false);

    const [projectSettings, setProjectSettings] = useState<Settings | null>(pSettings || null);
    const [sceneSettings, setSceneSettings] = useState<Settings | null>(sSettings || null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isMusicLoading, setIsMusicLoading] = useState(false);

    const isProjectSettings = projectSettingsContext.mode === 'project';
    // console.log(isProjectSettings ? 'Settings for Project' : 'Settings for Scene', ' are: ', isProjectSettings ? pSettings : sSettings);

    // Update settings state when dialog opens or props change
    React.useEffect(() => {
        if (open) {
            if (isProjectSettings) {
                setProjectSettings(pSettings || null);
            } else {
                setSceneSettings(sSettings || null);
            }
        }
    }, [open, isProjectSettings, pSettings, sSettings]);

    // Cleanup audio when dialog closes
    React.useEffect(() => {
        if (!open) {
            // Stop and cleanup audio when dialog closes
            if (audioRef.current) {
                try {
                    audioRef.current.pause();
                    audioRef.current.src = '';
                } catch (error) {
                    console.error('Error cleaning up audio:', error);
                }
            }
            setCurrentMusicId(null);
        } else {
            // Load backgrounds and music from cache or driveLibrary on mount
            // Use single cache call to get both backgrounds and music efficiently
            const cachedLibraryData = GoogleDriveServiceFunctions.getCachedLibraryData();

            if (cachedLibraryData && cachedLibraryData.backgrounds && cachedLibraryData.music) {
                // Set backgrounds from cache
                setBackgrounds(cachedLibraryData.backgrounds);
                // Set music from cache
                setMusic(cachedLibraryData.music);
                // Set transition effects from cache if available
                if (cachedLibraryData.transitionEffects) {
                    setTransitionEffects(cachedLibraryData.transitionEffects);
                }
            } else {
                // Fallback to driveLibrary if cache is empty or missing
                if (driveLibrary && driveLibrary.backgrounds) {
                    setBackgrounds(driveLibrary.backgrounds);
                }

                if (driveLibrary.music) {
                    setMusic(driveLibrary.music);
                }

                // if (driveLibrary.transitionEffects) {
                //     setTransitions(driveLibrary.transitionEffects);
                // }

                if (driveLibrary.transitionEffects) {
                    setTransitionEffects(driveLibrary.transitionEffects);
                }
            }
        }
    }, [open]);

    // Utility function to get playable video URL from Google Drive
    // Uses the authenticated proxy endpoint like images do
    const getPlayableVideoUrl = (background: any): string => {
        if (!background) return '';

        // If webContentLink exists, normalize it (extract file ID and use proxy)
        if (background.webContentLink) {
            return HelperFunctions.normalizeGoogleDriveUrl(background.webContentLink);
        }

        // If we have an ID, use the proxy endpoint directly
        if (background.id) {
            return `/api/google-drive-media?id=${encodeURIComponent(background.id)}`;
        }

        return '';
    };

    // Update video source when selectedBackground changes
    useEffect(() => {
        if (isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo && videoRef.current) {
            const videoUrl = getPlayableVideoUrl(isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo);
            if (videoUrl) {
                if (videoRef.current) {
                    videoRef.current.src = videoUrl;
                    videoRef.current.load(); // Force reload the video
                }
            }
        } else if (!isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo && videoRef.current) {
            // Clear video source when no background is selected
            if (videoRef.current) {
                videoRef.current.src = '';
            }
        }
    }, [isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo]);

    // Update transition video source when selectedTransitionEffect changes
    useEffect(() => {
        if (isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect && transitionVideoRef.current) {
            const videoUrl = getPlayableVideoUrl(isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect);
            if (videoUrl) {
                if (transitionVideoRef.current) {
                    transitionVideoRef.current.src = videoUrl;
                    transitionVideoRef.current.load(); // Force reload the video
                }
            }
        } else if (!isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect && transitionVideoRef.current) {
            // Clear video source when no transition is selected
            if (transitionVideoRef.current) {
                transitionVideoRef.current.src = '';
            }
        }
    }, [isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect]);

    const refreshLibraryData = async () => {
        setLoading(true);
        try {
            // Use loadBackgrounds which calls the main API, then fetch full library to get music
            const response: LibraryData = await GoogleDriveServiceFunctions.loadLibraryData(true);
            setMusic(response.music);
            setBackgrounds(response.backgrounds);
            if (response.transitionEffects) {
                setTransitionEffects(response.transitionEffects);
            }
        } catch (error) {
            console.error('Error refreshing library data:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleVideoError = () => {
        setVideoError(true);
        setLoading(false);
    };

    const handleVideoLoadStart = () => {
        setLoading(true);
        setVideoError(false);
    };

    const handleVideoLoaded = () => {
        setLoading(false);
        setVideoError(false);
    };

    const handleTransitionVideoError = () => {
        setTransitionVideoError(true);
        setTransitionVideoLoading(false);
    };

    const handleTransitionVideoLoadStart = () => {
        setTransitionVideoLoading(true);
        setTransitionVideoError(false);
    };

    const handleTransitionVideoLoaded = () => {
        setTransitionVideoLoading(false);
        setTransitionVideoError(false);
    };

    const handleToggleBackgroundMusic = async () => {
        try {
            const id = (isProjectSettings ? projectSettings?.videoBackgroundMusic?.id : sceneSettings?.videoBackgroundMusic?.id);
            if (!id) return;

            // If no audio element exists, create it
            if (!audioRef.current) {
                audioRef.current = new Audio();
                audioRef.current.addEventListener('playing', () => {
                    setIsMusicPlaying(true);
                    setIsMusicLoading(false);
                });
                audioRef.current.addEventListener('pause', () => {
                    setIsMusicPlaying(false);
                });
                audioRef.current.addEventListener('ended', () => {
                    setIsMusicPlaying(false);
                    setIsMusicLoading(false);
                });
                audioRef.current.addEventListener('loadstart', () => {
                    setIsMusicLoading(true);
                });
                audioRef.current.addEventListener('canplaythrough', () => {
                    setIsMusicLoading(false);
                });
                audioRef.current.addEventListener('error', () => {
                    setIsMusicPlaying(false);
                    setIsMusicLoading(false);
                });
            }

            const currentId = currentMusicId;
            const src = `${API_ENDPOINTS.API_GOOGLE_DRIVE_MEDIA}${id}`;

            // If clicking play/pause on the same music that's currently playing, toggle pause
            if (isMusicPlaying && currentId === id && audioRef.current.src.includes(id)) {
                audioRef.current.pause();
                setIsMusicPlaying(false);
                return;
            }

            // If different music is selected, stop current and load new
            if (currentId && currentId !== id && isMusicPlaying) {
                audioRef.current.pause();
                setIsMusicPlaying(false);
            }

            // Load new music if different from current
            if (currentId !== id || !audioRef.current.src.includes(id)) {
                setIsMusicLoading(true);
                setCurrentMusicId(id);
                audioRef.current.src = src;
                // Wait a bit for the source to be set
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Play the music
            await audioRef.current.play();
        } catch (error) {
            console.error('Error playing music:', error);
            setIsMusicPlaying(false);
            setIsMusicLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="project-settings-dialog-title"
            maxWidth="xl"
            fullWidth
            disableEscapeKeyDown={loading}
        >
            <DialogTitle id="project-settings-dialog-title" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="div" sx={{ fontSize: '1.25rem' }}>Project Settings {projectSettingsContext.mode === 'scene' ? `(Scene ${(projectSettingsContext.sceneIndex || 0) + 1})` : ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={() => onApply(projectSettingsContext.mode, projectSettings, sceneSettings)} variant="contained" size="medium" disabled={logoUploading} sx={{ textTransform: 'none', fontSize: '1.25rem' }}>✔ Save Changes</Button>
                    <Button onClick={onClose} variant="outlined" size="medium" disabled={logoUploading} sx={{ textTransform: 'none', fontSize: '1.25rem' }}>✕ Close</Button>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {/* Logo Upload Section */}
                    <Grid item xs={12} md={6} sx={{ minHeight: 320, maxHeight: 320 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Project Logo</Typography>
                        {(isProjectSettings ? projectSettings?.videoLogo?.url : sceneSettings?.videoLogo?.url) ? (
                            <Box sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 2,
                                backgroundColor: 'background.paper'
                            }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <img
                                        // width={120}
                                        // height={120}
                                        src={HelperFunctions.normalizeGoogleDriveUrl(isProjectSettings ? projectSettings?.videoLogo?.url || '' : sceneSettings?.videoLogo?.url || '')}
                                        alt={isProjectSettings ? projectSettings?.videoLogo?.name : sceneSettings?.videoLogo?.name}
                                        loading="lazy"
                                        style={{
                                            width: '45%',
                                            height: '45%',
                                            objectFit: 'contain',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            background: '#111',
                                            display: 'block',
                                            justifySelf: 'center'
                                        }}
                                    />

                                </Box>
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                                        {isProjectSettings ? projectSettings?.videoLogo?.name : sceneSettings?.videoLogo?.name}
                                    </Typography>
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        size="small"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => window.open(isProjectSettings ? projectSettings?.videoLogo?.url : sceneSettings?.videoLogo?.url, '_blank')}
                                        sx={{ color: 'primary.main' }}
                                    >
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (isProjectSettings) {
                                                setProjectSettings({ ...projectSettings, videoLogo: { name: '', url: '', position: 'top-right' } as LogoOverlayInterface } as Settings);
                                            } else {
                                                setSceneSettings({ ...sceneSettings, videoLogo: { name: '', url: '', position: 'top-right' } as LogoOverlayInterface } as Settings);
                                            }
                                        }}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <TextField
                                    size="small"
                                    select
                                    label="Position"
                                    value={isProjectSettings ? projectSettings?.videoLogo?.position || 'top-right' : sceneSettings?.videoLogo?.position || 'top-right'}
                                    onChange={(e) => {
                                        if (isProjectSettings) {
                                            setProjectSettings({ ...projectSettings, videoLogo: { ...projectSettings?.videoLogo, position: String(e.target.value) } as SettingItemInterface } as Settings);
                                        } else {
                                            setSceneSettings({ ...sceneSettings, videoLogo: { ...sceneSettings?.videoLogo, position: String(e.target.value) } as SettingItemInterface } as Settings);
                                        }
                                    }}
                                    SelectProps={{ native: true }}
                                    fullWidth
                                    sx={{ mt: 1.5 }}
                                >
                                    <option value="top-left">top-left</option>
                                    <option value="top-right">top-right</option>
                                    <option value="bottom-left">bottom-left</option>
                                    <option value="bottom-right">bottom-right</option>
                                </TextField>
                            </Box>
                        ) : (
                            <Box
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    border: '2px dashed',
                                    borderColor: 'primary.main',
                                    borderRadius: 2,
                                    p: 4,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    bgcolor: 'action.hover',
                                    transition: 'all 0.2s',
                                    opacity: logoUploading ? 0.5 : 1,
                                    pointerEvents: logoUploading ? 'none' : 'auto',
                                    '&:hover': {
                                        borderColor: 'primary.dark',
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                {logoUploading ? <CircularProgress size={20} /> : <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />}
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{logoUploading ? 'Uploading logo to Google Drive...' : 'Upload Logo'}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    PNG, JPG, GIF up to 5MB
                                </Typography>
                            </Box>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // If jobId is available, upload to Google Drive
                                if (jobId) {
                                    setLogoUploading(true);
                                    try {
                                        // Get file extension
                                        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                                        const logoFileName = `logo.${fileExtension}`;

                                        // Create a new File object with the renamed filename
                                        const renamedFile = new File([file], logoFileName, { type: file.type });

                                        // Upload to Google Drive in images/logo/ folder
                                        const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(
                                            jobId,
                                            'images/logo',
                                            renamedFile
                                        );

                                        if (uploadResult.success && uploadResult.fileId) {
                                            // Use webViewLink from upload response, fallback to constructed URL if not available
                                            const logoUrl = uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.fileId}/view?usp=drive_link`;

                                            // Update logo with Google Drive webViewLink and renamed file
                                            if (isProjectSettings) {
                                                setProjectSettings({ ...projectSettings, videoLogo: { name: logoFileName, url: logoUrl, position: projectSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                            } else {
                                                setSceneSettings({ ...sceneSettings, videoLogo: { name: logoFileName, url: logoUrl, position: sceneSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                            }
                                        } else {
                                            throw new Error('Upload failed');
                                        }
                                    } catch (error) {
                                        console.error('Error uploading logo to Google Drive:', error);
                                        toast.error('Failed to upload logo to Google Drive. Using local preview.');
                                        // Fallback to blob URL if upload fails
                                        const objectUrl = URL.createObjectURL(file);
                                        if (isProjectSettings) {
                                            setProjectSettings({ ...projectSettings, videoLogo: { name: file.name, url: objectUrl, position: projectSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                        } else {
                                            setSceneSettings({ ...sceneSettings, videoLogo: { name: file.name, url: objectUrl, position: sceneSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                        }
                                    } finally {
                                        setLogoUploading(false);
                                    }
                                } else {
                                    // No jobId, first check the folder exist or not, if not, generate a new folder
                                    const uploadResult = await GoogleDriveServiceFunctions.uploadMediaToDrive(
                                        'users',
                                        `${userId}/logo`,
                                        file
                                    );
                                    if (!uploadResult.success || !uploadResult.fileId) {
                                        console.error('Failed to upload logo to Google Drive:');
                                        toast.error('Failed to upload logo to Google Drive. Using local preview.');
                                        return;
                                    }
                                    const logoUrl = uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.fileId}/view?usp=drive_link`;
                                    if (isProjectSettings) {
                                        setProjectSettings({ ...projectSettings, videoLogo: { name: file.name, url: logoUrl, position: projectSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                    } else {
                                        setSceneSettings({ ...sceneSettings, videoLogo: { name: file.name, url: logoUrl, position: sceneSettings?.videoLogo?.position || 'top-right' } as LogoOverlayInterface } as Settings);
                                    }
                                }
                            }}
                        />
                    </Grid>

                    {/* Background Music Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Music</Typography>
                            <IconButton
                                size="small"
                                onClick={refreshLibraryData}
                                disabled={loading}
                                sx={{ color: 'primary.main' }}
                                title="Refresh music list"
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: 'background.paper',
                            minHeight: 320,
                            maxHeight: 320,
                        }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    select
                                    fullWidth
                                    sx={{ '& .MuiInputBase-root': { height: 44, fontSize: '1.25rem', }, '& select': { fontSize: '1.25rem' } }}
                                    size="small"
                                    value={(isProjectSettings ? projectSettings?.videoBackgroundMusic?.name : sceneSettings?.videoBackgroundMusic?.name)}
                                    onChange={(e) => {
                                        const selectedMusicId = e.target.value;
                                        const fullMusicObj = (music || []).find((m: any) => m.id === selectedMusicId);
                                        if (fullMusicObj) {
                                            if (isProjectSettings) {
                                                setProjectSettings({ ...projectSettings, videoBackgroundMusic: fullMusicObj as SettingItemInterface } as Settings);
                                            } else {
                                                setSceneSettings({ ...sceneSettings, videoBackgroundMusic: fullMusicObj as SettingItemInterface } as Settings);
                                            }
                                        }

                                        // Stop current music if playing
                                        if (audioRef.current && isMusicPlaying) {
                                            try {
                                                audioRef.current.pause();
                                            } catch (error) {
                                                console.error('Error stopping music:', error);
                                            }
                                        }

                                        // Reset states
                                        setIsMusicPlaying(false);
                                        setIsMusicLoading(false);
                                        setCurrentMusicId(null);
                                    }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Select music...</option>
                                    {loading ? (
                                        <option disabled>Loading music...</option>
                                    ) : music.length === 0 ? (
                                        <option disabled>No music available</option>
                                    ) : (
                                        music.map((t: any) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))
                                    )}
                                </TextField>
                            </Box>
                            {(isProjectSettings ? projectSettings?.videoBackgroundMusic?.name : sceneSettings?.videoBackgroundMusic?.name) && (() => {
                                const selectedMusicItem = music.find((t: any) => (isProjectSettings ? projectSettings?.videoBackgroundMusic?.name : sceneSettings?.videoBackgroundMusic?.name)?.includes(t.name));
                                if (selectedMusicItem) {
                                    return (
                                        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 2,
                                                bgcolor: 'action.hover',
                                                borderRadius: 1
                                            }}>
                                                <Box sx={{
                                                    width: 50,
                                                    height: 50,
                                                    borderRadius: 1,
                                                    bgcolor: 'secondary.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white'
                                                }}>
                                                    <Typography variant="h6">🎵</Typography>
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {selectedMusicItem.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {isMusicLoading ? 'Loading...' : isMusicPlaying ? 'Playing...' : 'Ready to play'}
                                                    </Typography>
                                                </Box>
                                                {isMusicLoading ? (
                                                    <CircularProgress size={20} sx={{ color: 'primary.main' }} />
                                                ) : isMusicPlaying ? (
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'primary.main' }}
                                                        onClick={handleToggleBackgroundMusic}
                                                    >
                                                        <PauseIcon />
                                                    </IconButton>
                                                ) : (
                                                    <IconButton
                                                        size="small"
                                                        sx={{ color: 'primary.main' }}
                                                        onClick={handleToggleBackgroundMusic}
                                                    >
                                                        <PlayIcon />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                }
                                return null;
                            })()}
                        </Box>
                    </Grid>

                    {/* Transition Effect Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Transition Effect</Typography>
                            <IconButton
                                size="small"
                                onClick={refreshLibraryData}
                                disabled={loading}
                                sx={{ color: 'primary.main' }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: 'background.paper',
                            minHeight: 320,
                            maxHeight: 320,

                        }}>
                            {transitionEffects.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No transition effects available</Typography>
                                </Box>
                            ) : (
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={isProjectSettings ? projectSettings?.videoTransitionEffect?.id : sceneSettings?.videoTransitionEffect?.id}
                                    onChange={(e) => {
                                        const transitionEffectObj = transitionEffects.find(te => te.id === e.target.value);
                                        if (transitionEffectObj) {
                                            if (isProjectSettings) {
                                                setProjectSettings({ ...projectSettings, videoTransitionEffect: transitionEffectObj as SettingItemInterface } as Settings);
                                            } else {
                                                setSceneSettings({ ...sceneSettings, videoTransitionEffect: transitionEffectObj as SettingItemInterface } as Settings);
                                            }
                                        }
                                    }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Select a transition effect</option>
                                    {transitionEffects.map((transitionEffect) => (
                                        <option key={transitionEffect.id} value={transitionEffect.id}>
                                            {transitionEffect.name}
                                        </option>
                                    ))}
                                </TextField>
                            )}
                            {(isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect) && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: 180,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        bgcolor: '#000'
                                    }}>
                                        {transitionVideoError ? (
                                            // Show error message with external link option
                                            <Box sx={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 2,
                                                p: 2,
                                                bgcolor: 'rgba(0,0,0,0.8)'
                                            }}>
                                                <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                                                    Video cannot be played in browser
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => window.open(isProjectSettings ? projectSettings?.videoTransitionEffect?.webViewLink : sceneSettings?.videoTransitionEffect?.webViewLink, '_blank')}
                                                    startIcon={<PlayIcon />}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Open in Google Drive
                                                </Button>
                                            </Box>
                                        ) : (
                                            <>
                                                <video
                                                    ref={transitionVideoRef}
                                                    src={getPlayableVideoUrl(isProjectSettings ? projectSettings?.videoTransitionEffect : sceneSettings?.videoTransitionEffect)}
                                                    muted
                                                    autoPlay
                                                    loop
                                                    onError={handleTransitionVideoError}
                                                    onLoadStart={handleTransitionVideoLoadStart}
                                                    onLoadedData={handleTransitionVideoLoaded}
                                                    onCanPlay={handleTransitionVideoLoaded}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                                {transitionVideoLoading && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'rgba(0,0,0,0.5)'
                                                    }}>
                                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                        {(isProjectSettings ? projectSettings?.videoTransitionEffect?.webViewLink : sceneSettings?.videoTransitionEffect?.webViewLink) && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => window.open(isProjectSettings ? projectSettings?.videoTransitionEffect?.webViewLink : sceneSettings?.videoTransitionEffect?.webViewLink, '_blank')}
                                                sx={{ textTransform: 'none', fontSize: '1.25rem', py: 0.25, px: 1 }}
                                                startIcon={<PlayIcon fontSize="small" />}
                                            >
                                                Open in Drive
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Background Selection Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Video</Typography>
                            <IconButton
                                size="small"
                                onClick={refreshLibraryData}
                                disabled={loading}
                                sx={{ color: 'primary.main' }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: 'background.paper',
                            minHeight: 320,
                            maxHeight: 320,
                        }}>
                            {!backgrounds || backgrounds?.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No backgrounds available</Typography>
                                </Box>
                            ) : (
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={isProjectSettings ? projectSettings?.videoBackgroundVideo?.id : sceneSettings?.videoBackgroundVideo?.id}
                                    onChange={(e) => {
                                        const backgroundVideoObj = backgrounds.find(bg => bg.id === e.target.value);
                                        if (backgroundVideoObj) {
                                            if (isProjectSettings) {
                                                setProjectSettings({ ...projectSettings, videoBackgroundVideo: backgroundVideoObj as SettingItemInterface } as Settings);
                                            } else {
                                                setSceneSettings({ ...sceneSettings, videoBackgroundVideo: backgroundVideoObj as SettingItemInterface } as Settings);
                                            }
                                        }
                                    }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Select a background</option>
                                    {backgrounds.map((background) => (
                                        <option key={background.id} value={background.id}>
                                            {background.name}
                                        </option>
                                    ))}
                                </TextField>
                            )}
                            {(isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo) && (
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{
                                        position: 'relative',
                                        width: '100%',
                                        height: 180,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        bgcolor: '#000'
                                    }}>
                                        {videoError ? (
                                            // Show error message with external link option
                                            <Box sx={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 2,
                                                p: 2,
                                                bgcolor: 'rgba(0,0,0,0.8)'
                                            }}>
                                                <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
                                                    Video cannot be played in browser
                                                </Typography>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    onClick={() => window.open(isProjectSettings ? projectSettings?.videoBackgroundVideo?.webViewLink : sceneSettings?.videoBackgroundVideo?.webViewLink, '_blank')}
                                                    startIcon={<PlayIcon />}
                                                    sx={{ textTransform: 'none' }}
                                                >
                                                    Open in Google Drive
                                                </Button>
                                            </Box>
                                        ) : (
                                            <>
                                                <video
                                                    ref={videoRef}
                                                    src={getPlayableVideoUrl(isProjectSettings ? projectSettings?.videoBackgroundVideo : sceneSettings?.videoBackgroundVideo)}
                                                    muted
                                                    autoPlay
                                                    loop
                                                    onError={handleVideoError}
                                                    onLoadStart={handleVideoLoadStart}
                                                    onLoadedData={handleVideoLoaded}
                                                    onCanPlay={handleVideoLoaded}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                                {loading && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        bgcolor: 'rgba(0,0,0,0.5)'
                                                    }}>
                                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                                    </Box>
                                                )}

                                            </>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                        {(isProjectSettings ? projectSettings?.videoBackgroundVideo?.webViewLink : sceneSettings?.videoBackgroundVideo?.webViewLink) && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => window.open(isProjectSettings ? projectSettings?.videoBackgroundVideo?.webViewLink : sceneSettings?.videoBackgroundVideo?.webViewLink, '_blank')}
                                                sx={{ textTransform: 'none', fontSize: '1.25rem', py: 0.25, px: 1 }}
                                                startIcon={<PlayIcon fontSize="small" />}
                                            >
                                                Open in Drive
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectSettingsDialog;

