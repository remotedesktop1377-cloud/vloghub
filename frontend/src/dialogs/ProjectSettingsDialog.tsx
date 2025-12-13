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
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Check as CheckIcon,
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

// Transition Effects Grid Component
interface TransitionEffectsGridProps {
    selectedTransitionId?: string;
    onSelect: (transitionEffect: SettingItemInterface) => void;
}

const TransitionEffectsGrid: React.FC<TransitionEffectsGridProps> = ({ selectedTransitionId, onSelect }) => {
    const transitions = [
        { id: 'fade_dissolve', name: 'Fade Dissolve', type: 'fade', direction: 'in-out', duration: 1.5 },
        { id: 'fade_in', name: 'Fade In', type: 'fade', direction: 'in', duration: 1.0 },
        { id: 'fade_out', name: 'Fade Out', type: 'fade', direction: 'out', duration: 1.0 },
        { id: 'fade_to_black', name: 'Fade to Black', type: 'fade', direction: 'to-black', duration: 2.0 },
        { id: 'slide_in_left', name: 'Slide In Left', type: 'slide', direction: 'left', duration: 1.0 },
        { id: 'slide_in_right', name: 'Slide In Right', type: 'slide', direction: 'right', duration: 1.0 },
        { id: 'slide_in_top', name: 'Slide In Top', type: 'slide', direction: 'top', duration: 1.0 },
        { id: 'slide_in_bottom', name: 'Slide In Bottom', type: 'slide', direction: 'bottom', duration: 1.0 },
        { id: 'slide_out_left', name: 'Slide Out Left', type: 'slide', direction: 'out-left', duration: 1.0 },
        { id: 'slide_out_right', name: 'Slide Out Right', type: 'slide', direction: 'out-right', duration: 1.0 },
        { id: 'slide_out_top', name: 'Slide Out Top', type: 'slide', direction: 'out-top', duration: 1.0 },
        { id: 'slide_out_bottom', name: 'Slide Out Bottom', type: 'slide', direction: 'out-bottom', duration: 1.0 },
        { id: 'cross_dissolve', name: 'Cross Dissolve', type: 'fade', direction: 'cross', duration: 1.5 },
        { id: 'none', name: 'None', type: 'none', direction: '', duration: 0 },
        { id: '', name: '', type: 'empty', direction: '', duration: 0 },
        { id: '', name: '', type: 'empty', direction: '', duration: 0 },
    ];

    const getAnimationClass = (transition: typeof transitions[0]) => {
        if (transition.type === 'empty') return '';
        if (transition.type === 'none') return 'transition-none';
        if (transition.type === 'fade') {
            if (transition.direction === 'in') return 'transition-fade-in';
            if (transition.direction === 'out') return 'transition-fade-out';
            if (transition.direction === 'in-out') return 'transition-fade-in-out';
            if (transition.direction === 'to-black') return 'transition-fade-to-black';
            if (transition.direction === 'cross') return 'transition-cross-dissolve';
        }
        if (transition.type === 'slide') {
            if (transition.direction === 'left') return 'transition-slide-in-left';
            if (transition.direction === 'right') return 'transition-slide-in-right';
            if (transition.direction === 'top') return 'transition-slide-in-top';
            if (transition.direction === 'bottom') return 'transition-slide-in-bottom';
            if (transition.direction === 'out-left') return 'transition-slide-out-left';
            if (transition.direction === 'out-right') return 'transition-slide-out-right';
            if (transition.direction === 'out-top') return 'transition-slide-out-top';
            if (transition.direction === 'out-bottom') return 'transition-slide-out-bottom';
        }
        return '';
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
                @keyframes fadeToBlack {
                    0% { opacity: 1; }
                    50%, 100% { opacity: 0; background: #000; }
                }
                @keyframes crossDissolve {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slideInTop {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                @keyframes slideInBottom {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes slideOutLeft {
                    from { transform: translateX(0); }
                    to { transform: translateX(-100%); }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
                @keyframes slideOutTop {
                    from { transform: translateY(0); }
                    to { transform: translateY(-100%); }
                }
                @keyframes slideOutBottom {
                    from { transform: translateY(0); }
                    to { transform: translateY(100%); }
                }
                .transition-preview-box {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    border-radius: 4px;
                }
                .transition-fade-in {
                    animation: fadeIn 2s ease-in-out infinite;
                }
                .transition-fade-out {
                    animation: fadeOut 2s ease-in-out infinite;
                }
                .transition-fade-in-out {
                    animation: fadeInOut 3s ease-in-out infinite;
                }
                .transition-fade-to-black {
                    animation: fadeToBlack 3s ease-in-out infinite;
                }
                .transition-cross-dissolve {
                    animation: crossDissolve 3s ease-in-out infinite;
                }
                .transition-slide-in-left {
                    animation: slideInLeft 2s ease-in-out infinite;
                }
                .transition-slide-in-right {
                    animation: slideInRight 2s ease-in-out infinite;
                }
                .transition-slide-in-top {
                    animation: slideInTop 2s ease-in-out infinite;
                }
                .transition-slide-in-bottom {
                    animation: slideInBottom 2s ease-in-out infinite;
                }
                .transition-slide-out-left {
                    animation: slideOutLeft 2s ease-in-out infinite;
                }
                .transition-slide-out-right {
                    animation: slideOutRight 2s ease-in-out infinite;
                }
                .transition-slide-out-top {
                    animation: slideOutTop 2s ease-in-out infinite;
                }
                .transition-slide-out-bottom {
                    animation: slideOutBottom 2s ease-in-out infinite;
                }
                .transition-none {
                    opacity: 1;
                }
            `}</style>
            <Grid container spacing={1.5}>
                {transitions.map((transition) => {
                    if (transition.type === 'empty') {
                        return <Grid item xs={3} key={`empty-${transitions.indexOf(transition)}`} />;
                    }
                    const isSelected = selectedTransitionId === transition.id;
                    return (
                        <Grid item xs={3} key={transition.id}>
                            <Box
                                onClick={() => {
                                    if (transition.id) {
                                        onSelect({
                                            id: transition.id,
                                            name: transition.name,
                                            duration: transition.duration,
                                        } as SettingItemInterface);
                                    }
                                }}
                                sx={{
                                    position: 'relative',
                                    cursor: transition.id ? 'pointer' : 'default',
                                    border: isSelected ? '2px solid' : '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    aspectRatio: '1',
                                    bgcolor: 'background.default',
                                    transition: 'all 0.2s',
                                    '&:hover': transition.id ? {
                                        borderColor: 'primary.main',
                                        transform: 'scale(1.02)',
                                    } : {},
                                }}
                            >
                                {transition.id && (
                                    <>
                                        <Box
                                            className={`transition-preview-box ${getAnimationClass(transition)}`}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                bgcolor: transition.direction === 'to-black' ? '#000' : 'primary.light',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        />
                                        {isSelected && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    bgcolor: 'primary.main',
                                                    borderRadius: '50%',
                                                    width: 24,
                                                    height: 24,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 1,
                                                }}
                                            >
                                                <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                                            </Box>
                                        )}
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                position: 'absolute',
                                                bottom: 2,
                                                left: 4,
                                                right: 4,
                                                textAlign: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                                color: 'black',
                                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                                px: 0.5,
                                                py: 0.25,
                                                borderRadius: 1,
                                            }}
                                        >
                                            {transition.name}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </>
    );
};

interface ProjectSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: (mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => void;
    jobId: string | null;
    userId: string;
    projectSettingsContext: ProjectSettingsContext;
    pSettings: Settings | null;
    sSettings: Settings | null;
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
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const transitionVideoRef = useRef<HTMLVideoElement | null>(null);

    const [music, setMusic] = useState<any[]>([]);
    const [backgrounds, setBackgrounds] = useState<any[]>([]);
    const [transitionEffects, setTransitionEffects] = useState<any[]>([]);
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
            initLibraryData(false);
        }
    }, [open]);

    const initLibraryData = async (isRefreshingData: boolean) => {
        if (isRefreshingData) {
            setLoading(true);
        }

        const libraryData: LibraryData = await GoogleDriveServiceFunctions.loadLibraryData(isRefreshingData);
        setBackgrounds(libraryData.backgrounds);
        setMusic(libraryData.music);
        setTransitionEffects(libraryData.transitionEffects);

        setLoading(false);
    }

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
            if (isMusicPlaying && currentId === id && audioRef.current?.src.includes(id)) {
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
            if (currentId !== id || !audioRef.current?.src.includes(id)) {
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
                    {/* Preview Image Option */}
                    <Grid item xs={12}>
                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: 'background.paper',
                        }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isProjectSettings
                                            ? (projectSettings?.showPreviewImageAtStart ?? true)
                                            : (sceneSettings?.showPreviewImageAtStart ?? true)
                                        }
                                        onChange={(e) => {
                                            if (isProjectSettings) {
                                                setProjectSettings({
                                                    ...projectSettings,
                                                    showPreviewImageAtStart: e.target.checked
                                                } as Settings);
                                            } else {
                                                setSceneSettings({
                                                    ...sceneSettings,
                                                    showPreviewImageAtStart: e.target.checked
                                                } as Settings);
                                            }
                                        }}
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600, mb: 0.5 }}>
                                            Show Gamma Preview Image at Scene Start
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '1rem' }}>
                                            When enabled, the preview image will be displayed at the start of each scene video if no media is attached within the first 3 seconds of the scene.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Box>
                    </Grid>

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
                                            width: '120px',
                                            height: '120px',
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
                                            throw new Error(uploadResult?.message || 'Upload failed');
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
                                        console.error('Failed to upload logo to Google Drive:', uploadResult?.message);
                                        toast.error(uploadResult?.message || 'Failed to upload logo to Google Drive. Using local preview.');
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
                                onClick={() => initLibraryData(true)}
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
                                onClick={() => initLibraryData(true)}
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
                            // backgroundColor: 'background.paper',
                            minHeight: 320,
                        }}>
                            <TransitionEffectsGrid
                                selectedTransitionId={isProjectSettings ? projectSettings?.videoTransitionEffect?.id : sceneSettings?.videoTransitionEffect?.id}
                                onSelect={(transitionEffect) => {
                                    if (isProjectSettings) {
                                        setProjectSettings({ ...projectSettings, videoTransitionEffect: transitionEffect as SettingItemInterface } as Settings);
                                    } else {
                                        setSceneSettings({ ...sceneSettings, videoTransitionEffect: transitionEffect as SettingItemInterface } as Settings);
                                    }
                                }}
                            />
                        </Box>
                    </Grid>

                    {/* Background Selection Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Video</Typography>
                            <IconButton
                                size="small"
                                onClick={() => initLibraryData(true)}
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

