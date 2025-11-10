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
import { EffectsPanel } from '@/components/videoEffects/EffectsPanel';
import { predefinedTransitions } from '@/data/DefaultData';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { HelperFunctions } from '@/utils/helperFunctions';
import { LibraryData } from '@/services/profileService';

interface LogoType {
    name?: string;
    url: string;
    position?: string;
}

interface MusicType {
    selectedMusic: string;
    volume: number;
    autoAdjust?: boolean;
    fadeIn?: boolean;
    fadeOut?: boolean;
}

interface ClipType {
    name?: string;
    url: string;
}

interface ProjectSettingsContext {
    mode: 'project' | 'scene';
    sceneIndex?: number;
}

interface ProjectSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    context: ProjectSettingsContext;

    // Temporary state values
    tmpTransitionId: string;
    tmpMusic: MusicType | null;
    tmpLogo: LogoType | null;
    tmpClip: ClipType | null;
    tmpEffects: string[];

    // State setters
    onTmpTransitionIdChange: (value: string) => void;
    onTmpMusicChange: (music: MusicType | null) => void;
    onTmpLogoChange: (logo: LogoType | null) => void;
    onTmpClipChange: (clip: ClipType | null) => void;
    onTmpEffectsChange: (effects: string[]) => void;
    onEffectToggle: (id: string) => void;

    // Music player state
    isMusicLoading: boolean;
    isMusicPlaying: boolean;
    setIsMusicPlaying: (playing: boolean) => void;
    setIsMusicLoading: (loading: boolean) => void;
    setLastMusicIdLoaded: (id: string | null) => void;

    // External dependencies
    driveLibrary: { backgrounds?: any[]; music?: any[]; transitions?: any[] };
    setVideoPreviewUrl: (url: string) => void;
    setVideoPreviewOpen: (open: boolean) => void;
    jobId?: string;
}

const ProjectSettingsDialog: React.FC<ProjectSettingsDialogProps> = ({
    open,
    onClose,
    onApply,
    context,
    tmpTransitionId,
    tmpMusic,
    tmpLogo,
    tmpClip,
    tmpEffects,
    onTmpTransitionIdChange,
    onTmpMusicChange,
    onTmpLogoChange,
    onTmpClipChange,
    onTmpEffectsChange,
    onEffectToggle,
    isMusicLoading,
    isMusicPlaying,
    setIsMusicPlaying,
    setIsMusicLoading,
    setLastMusicIdLoaded,
    driveLibrary,
    setVideoPreviewUrl,
    setVideoPreviewOpen,
    jobId
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [backgrounds, setBackgrounds] = useState<any[]>(driveLibrary?.backgrounds || []);
    const [music, setMusic] = useState<any[]>(driveLibrary?.music || []);
    const [selectedBackground, setSelectedBackground] = useState<any>(null);
    const [loadingLibraryData, setLoadingLibraryData] = useState<boolean>(false);
    const [videoError, setVideoError] = useState(false);
    const [videoLoading, setVideoLoading] = useState(false);
    const [currentMusicId, setCurrentMusicId] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

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
            setIsMusicPlaying(false);
            setIsMusicLoading(false);
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
            } else {
                // Fallback to driveLibrary if cache is empty or missing
                if (driveLibrary && driveLibrary.backgrounds) {
                    setBackgrounds(driveLibrary.backgrounds);
                }

                if (driveLibrary.music) {
                    setMusic(driveLibrary.music);
                }
            }
        }
    }, [open]);

    // Utility function to get playable video URLs from Google Drive
    const getPlayableVideoUrls = (background: any): string[] => {
        const fileId = background.id;
        if (!fileId) return [];

        const urls: string[] = [];

        // Method 1: Use our API proxy endpoint (best for .mp4 and .mov files)
        // This endpoint handles authentication and streaming properly
        urls.push(`${API_ENDPOINTS.API_GOOGLE_DRIVE_MEDIA}${fileId}`);

        // Method 2: Direct Google Drive streaming URL
        urls.push(`https://drive.google.com/uc?id=${fileId}`);

        // Method 3: Alternative streaming format
        urls.push(`https://drive.google.com/file/d/${fileId}/preview`);

        // Method 4: Using the original webContentLink if available
        if (background.webContentLink) {
            urls.push(background.webContentLink);
        }

        // Remove duplicates and return unique URLs
        return Array.from(new Set(urls.filter(Boolean)));
    };

    const refreshLibraryData = async () => {
        setLoadingLibraryData(true);
        try {
            // Use loadBackgrounds which calls the main API, then fetch full library to get music
            const response: LibraryData = await GoogleDriveServiceFunctions.loadLibraryData(true);
            setMusic(response.music);
            setBackgrounds(response.backgrounds);
        } catch (error) {
            console.error('Error refreshing music:', error);
        } finally {
            setLoadingLibraryData(false);
        }
    }

    const handleVideoError = () => {
        setVideoError(true);
        setVideoLoading(false);
    };

    const handleVideoLoadStart = () => {
        setVideoLoading(true);
        setVideoError(false);
    };

    const handleVideoLoaded = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleToggleBackgroundMusic = async () => {
        try {
            const id = (tmpMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '';
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
                setLastMusicIdLoaded(id);
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
            disableEscapeKeyDown={uploadingLogo}
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tmpTransitionId !== undefined) onApply();
                }
            }}
        >
            <DialogTitle id="project-settings-dialog-title" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography component="div" sx={{ fontSize: '1.25rem' }}>Project Settings {context.mode === 'scene' ? `(Scene ${(context.sceneIndex || 0) + 1})` : ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onApply} variant="contained" size="medium" disabled={uploadingLogo} sx={{ textTransform: 'none', fontSize: '1.25rem' }}>✔ Save Changes</Button>
                    <Button onClick={onClose} variant="outlined" size="medium" disabled={uploadingLogo} sx={{ textTransform: 'none', fontSize: '1.25rem' }}>✕ Close</Button>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {/* Transition Effect Section */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Transition Effect</Typography>
                        <Box sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                            backgroundColor: 'background.paper'
                        }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                value={tmpTransitionId}
                                onChange={(e) => onTmpTransitionIdChange(String(e.target.value))}
                                SelectProps={{ native: true }}
                                sx={{ '& .MuiInputBase-root': { height: 44, fontSize: '1.25rem' }, '& select': { fontSize: '1.25rem' } }}
                            >
                                <option value="">Select transition...</option>
                                {predefinedTransitions.map((t: string) => (
                                    <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                                ))}
                            </TextField>
                            {tmpTransitionId && (
                                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        p: 2,
                                        bgcolor: 'action.hover',
                                        borderRadius: 1
                                    }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white'
                                        }}>
                                            ✨
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {tmpTransitionId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Grid>

                    {/* Background Music Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Music</Typography>
                            <IconButton
                                size="small"
                                onClick={refreshLibraryData}
                                disabled={loadingLibraryData}
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
                            backgroundColor: 'background.paper'
                        }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    select
                                    fullWidth
                                    sx={{ '& .MuiInputBase-root': { height: 44, fontSize: '1.25rem', }, '& select': { fontSize: '1.25rem' } }}
                                    size="small"
                                    value={(tmpMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || ''}
                                    onChange={(e) => {
                                        const selId = String(e.target.value);

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
                                        setLastMusicIdLoaded(null);

                                        // Update music selection
                                        onTmpMusicChange({
                                            selectedMusic: selId ? `https://drive.google.com/file/d/${selId}/view?usp=drive_link` : '',
                                            volume: tmpMusic?.volume ?? 0.3,
                                            autoAdjust: tmpMusic?.autoAdjust ?? true,
                                            fadeIn: tmpMusic?.fadeIn ?? true,
                                            fadeOut: tmpMusic?.fadeOut ?? true
                                        });
                                    }}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">Select music...</option>
                                    {loadingLibraryData ? (
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
                            {tmpMusic?.selectedMusic && (() => {
                                const selectedMusicItem = music.find((t: any) => tmpMusic.selectedMusic.includes(t.id));
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

                    {/* Logo Upload Section */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Logo Overlay</Typography>
                        {tmpLogo?.url ? (
                            <Box sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                p: 2,
                                backgroundColor: 'background.paper'
                            }}>
                                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                    <Image
                                        width={120}
                                        height={120}
                                        src={HelperFunctions.normalizeGoogleDriveUrl(tmpLogo.url)}
                                        alt={tmpLogo.name || 'Logo'}
                                        loading="lazy"
                                        style={{
                                            objectFit: 'contain',
                                            borderRadius: 2,
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            background: '#111',
                                            display: 'block'
                                        }}
                                    />
                                    <IconButton
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            bgcolor: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                                            width: 28,
                                            height: 28
                                        }}
                                        size="small"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>
                                        {tmpLogo.name}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => window.open(tmpLogo.url, '_blank')}
                                        sx={{ color: 'primary.main' }}
                                    >
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onTmpLogoChange(null)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                                <TextField
                                    size="small"
                                    select
                                    label="Position"
                                    value={tmpLogo?.position || 'top-right'}
                                    onChange={(e) => onTmpLogoChange({ ...tmpLogo, position: String(e.target.value) })}
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
                                    opacity: uploadingLogo ? 0.5 : 1,
                                    pointerEvents: uploadingLogo ? 'none' : 'auto',
                                    '&:hover': {
                                        borderColor: 'primary.dark',
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                {uploadingLogo ? <CircularProgress size={20} /> : <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />}
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{uploadingLogo ? 'Uploading logo to Google Drive...' : 'Upload Logo'}</Typography>
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
                                    setUploadingLogo(true);
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
                                            onTmpLogoChange({
                                                name: logoFileName,
                                                url: logoUrl,
                                                position: tmpLogo?.position || 'top-right'
                                            });
                                            toast.success(`Logo uploaded successfully as ${logoFileName}`);
                                        } else {
                                            throw new Error('Upload failed');
                                        }
                                    } catch (error) {
                                        console.error('Error uploading logo to Google Drive:', error);
                                        toast.error('Failed to upload logo to Google Drive. Using local preview.');
                                        // Fallback to blob URL if upload fails
                                        const objectUrl = URL.createObjectURL(file);
                                        onTmpLogoChange({
                                            name: file.name,
                                            url: objectUrl,
                                            position: tmpLogo?.position || 'top-right'
                                        });
                                    } finally {
                                        setUploadingLogo(false);
                                    }
                                } else {
                                    // No jobId, use blob URL as fallback
                                    const objectUrl = URL.createObjectURL(file);
                                    onTmpLogoChange({
                                        name: file.name,
                                        url: objectUrl,
                                        position: tmpLogo?.position || 'top-right'
                                    });
                                }
                            }}
                        />
                    </Grid>

                    {/* Background Selection Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Video</Typography>
                            <IconButton
                                size="small"
                                onClick={refreshLibraryData}
                                disabled={loadingLibraryData}
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
                            minHeight: 200
                        }}>
                            {loadingLibraryData ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="caption" sx={{ mt: 1 }}>Loading backgrounds...</Typography>
                                </Box>
                            ) : backgrounds.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">No backgrounds available</Typography>
                                </Box>
                            ) : (
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    value={selectedBackground?.id || ''}
                                    onChange={(e) => {
                                        const background = backgrounds.find(bg => bg.id === e.target.value);
                                        if (background) {
                                            setSelectedBackground(background);
                                            setVideoError(false);
                                            setVideoLoading(false);
                                            // Set as clip
                                            onTmpClipChange({
                                                name: background.name,
                                                url: background.webContentLink
                                            });
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
                            {selectedBackground && (
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
                                                    onClick={() => window.open(selectedBackground.webViewLink || `https://drive.google.com/file/d/${selectedBackground.id}/view`, '_blank')}
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
                                                    muted
                                                    playsInline
                                                    loop
                                                    onError={handleVideoError}
                                                    onLoadStart={handleVideoLoadStart}
                                                    onLoadedData={handleVideoLoaded}
                                                    onCanPlay={handleVideoLoaded}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                                                >
                                                    {/* {getPlayableVideoUrls(selectedBackground).map((url, index) => (
                                                        <source key={index} src={url} type="video/mp4" />
                                                    ))} */}
                                                    Your browser does not support the video tag.
                                                </video>
                                                {videoLoading && (
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
                                                {!videoLoading && (
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        pointerEvents: 'none',
                                                        bgcolor: 'rgba(0,0,0,0.3)'
                                                    }}>
                                                        <Box sx={{
                                                            width: 48,
                                                            height: 48,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'rgba(255,255,255,0.2)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backdropFilter: 'blur(8px)'
                                                        }}>
                                                            <PlayIcon sx={{ color: '#fff', ml: 0.5 }} />
                                                        </Box>
                                                    </Box>
                                                )}
                                            </>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                        {selectedBackground.webViewLink && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => window.open(selectedBackground.webViewLink || `https://drive.google.com/file/d/${selectedBackground.id}/view`, '_blank')}
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

                    {/* Video Effects (project-level) */}
                    {/* <Grid item xs={12} sx={{ mt: 2, pl: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '1.25rem' }}>Video Effects</Typography>
                        <Box sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
                            <EffectsPanel
                                selectedEffects={tmpEffects}
                                onEffectToggle={onEffectToggle}
                                onApplyToAllScenes={(effects: string[]) => {
                                    onTmpEffectsChange(effects);
                                }}
                            />
                        </Box>
                    </Grid> */}
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectSettingsDialog;

