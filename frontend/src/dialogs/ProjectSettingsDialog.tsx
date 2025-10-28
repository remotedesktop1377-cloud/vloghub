import React, { useRef, useState } from 'react';
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
    predefinedTransitions: string[];
    driveLibrary: { backgrounds?: any[]; music?: any[]; transitions?: any[] } | null;
    setVideoPreviewUrl: (url: string) => void;
    setVideoPreviewOpen: (open: boolean) => void;
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
    predefinedTransitions,
    driveLibrary,
    setVideoPreviewUrl,
    setVideoPreviewOpen
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backgrounds, setBackgrounds] = useState<any[]>(driveLibrary?.backgrounds || []);
    const [selectedBackground, setSelectedBackground] = useState<any>(null);
    const [loadingBackgrounds, setLoadingBackgrounds] = useState(false);

    // Sync backgrounds when driveLibrary changes
    React.useEffect(() => {
        setBackgrounds(driveLibrary?.backgrounds || []);
    }, [driveLibrary]);

    const handleToggleBackgroundMusic = async () => {
        try {
            const id = (tmpMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '';
            if (!id) return;
            const src = `${process.env.NEXT_PUBLIC_API_URL || ''}/google-drive-media/${id}`;
            
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
            setLastMusicIdLoaded(id);
            
            if (!audioRef.current.src.includes(id)) {
                audioRef.current.src = src;
            }
            
            await audioRef.current.play();
        } catch {
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
            onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tmpTransitionId !== undefined) onApply();
                }
            }}
        >
            <DialogTitle id="project-settings-dialog-title" component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" component="div">Project Settings {context.mode === 'scene' ? `(Scene ${(context.sceneIndex || 0) + 1})` : ''}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} variant="outlined" size="small" sx={{ textTransform: 'none' }}>✕ Close</Button>
                    <Button onClick={onApply} variant="contained" size="small" disabled={false} sx={{ textTransform: 'none' }}>✔ Done</Button>
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
                                {predefinedTransitions.map((t) => (
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
                                            <Typography variant="caption" color="text.secondary">
                                                Selected transition effect
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
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
                                    <img 
                                        src={tmpLogo.url} 
                                        alt={tmpLogo.name || 'Logo'} 
                                        style={{ 
                                            width: 120, 
                                            height: 120, 
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
                                    '&:hover': {
                                        borderColor: 'primary.dark',
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                <EditIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Upload Logo</Typography>
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
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const objectUrl = URL.createObjectURL(file);
                                onTmpLogoChange({ name: file.name, url: objectUrl, position: tmpLogo?.position || 'top-right' });
                            }}
                        />
                    </Grid>

                    {/* Background Music Section */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{ mb: 2, fontSize: '1.25rem', fontWeight: 600 }}>Background Music</Typography>
                        <Box sx={{ 
                            border: '1px solid', 
                            borderColor: 'divider', 
                            borderRadius: 2, 
                            p: 2, 
                            backgroundColor: 'background.paper'
                        }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField
                                    select
                                    fullWidth
                                    sx={{ '& .MuiInputBase-root': { height: 44, fontSize: '1.25rem', }, '& select': { fontSize: '1.25rem' } }}
                                    size="small"
                                    value={(tmpMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || ''}
                                    onChange={(e) => {
                                        const selId = String(e.target.value);
                                        onTmpMusicChange({ selectedMusic: selId ? `https://drive.google.com/file/d/${selId}/view?usp=drive_link` : '', volume: tmpMusic?.volume ?? 0.3, autoAdjust: tmpMusic?.autoAdjust ?? true, fadeIn: tmpMusic?.fadeIn ?? true, fadeOut: tmpMusic?.fadeOut ?? true });
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
                                    disabled={!((tmpMusic?.selectedMusic.match(/\/d\/([\w-]+)/)?.[1]) || '') || isMusicLoading}
                                    onClick={handleToggleBackgroundMusic}
                                    sx={{ 
                                        height: 44, 
                                        minWidth: 90, 
                                        textTransform: 'none', 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: 1 
                                    }}
                                >
                                    {isMusicLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : (isMusicPlaying ? <PauseIcon fontSize="small" /> : <PlayIcon fontSize="small" />)}
                                    {isMusicPlaying ? 'Pause' : 'Play'}
                                </Button>
                            </Box>
                            {tmpMusic?.selectedMusic && (() => {
                                const selectedMusicItem = driveLibrary?.music?.find((t: any) => tmpMusic.selectedMusic.includes(t.id));
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
                                                        {isMusicPlaying ? 'Playing...' : 'Ready to play'}
                                                    </Typography>
                                                </Box>
                                                {isMusicPlaying && (
                                                    <IconButton size="small" sx={{ color: 'primary.main' }}>
                                                        <PauseIcon />
                                                    </IconButton>
                                                )}
                                                {!isMusicPlaying && (
                                                    <IconButton size="small" sx={{ color: 'primary.main' }}>
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

                    {/* Background Selection Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '1.25rem', fontWeight: 600 }}>Background Video</Typography>
                            <IconButton
                                size="small"
                                onClick={async () => {
                                    setLoadingBackgrounds(true);
                                    // Refresh backgrounds if needed
                                    setBackgrounds(driveLibrary?.backgrounds || []);
                                    setLoadingBackgrounds(false);
                                }}
                                disabled={loadingBackgrounds}
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
                            {loadingBackgrounds ? (
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
                                            // Set as clip
                                            onTmpClipChange({ 
                                                name: background.name, 
                                                url: background.webContentLink 
                                            });
                                        }
                                    }}
                                    SelectProps={{ native: true }}
                                    sx={{ mb: 2 }}
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
                                        border: '1px solid rgba(255,255,255,0.15)'
                                    }}>
                                        <video
                                            src={selectedBackground.webContentLink}
                                            muted
                                            playsInline
                                            loop
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
                                        />
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
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }} color="text.secondary">
                                        {selectedBackground.name}
                                    </Typography>
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

