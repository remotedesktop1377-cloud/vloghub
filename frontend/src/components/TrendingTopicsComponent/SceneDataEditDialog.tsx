import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    TextField,
    Typography,
    Tabs,
    Tab,
    Grid,
    Card,
    CardContent,
    IconButton,
    Chip,
    Switch,
    FormControlLabel,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Alert
} from '@mui/material';
import {
    Save as SaveIcon,
    Close as CloseIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayIcon,
    Image as ImageIcon,
    VolumeUp as VolumeIcon,
    AutoFixHigh as WandIcon,
    Upload as UploadIcon,
    Visibility as EyeIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { SceneData, VideoClip, LogoOverlay, BackgroundMusic } from '../../types/sceneData';
import { HelperFunctions } from '../../utils/helperFunctions';
import { EffectsPanel } from '../videoEffects/EffectsPanel';
import { TransitionSelector } from '../videoEffects/TransitionSelector';
import { MediaPlayer } from '../videoEffects/MediaPlayer';
import { PRIMARY, SUCCESS, WARNING, ERROR, INFO, PURPLE, NEUTRAL } from '../../styles/colors';
import { preStoredMusic } from '@/data/DefaultData';

interface SceneDataEditDialogProps {
    open: boolean;
    sceneData: SceneData | null;
    sceneDataIndex: number;
    language: string;
    onClose: () => void;
    onSave: (SceneDataIndex: number, updatedSceneData: SceneData) => void;
}

export function SceneDataEditDialog({
    open,
    sceneData,
    sceneDataIndex,
    language,
    onClose,
    onSave
}: SceneDataEditDialogProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [editData, setEditData] = useState<SceneData | null>(null);

    useEffect(() => {
        if (sceneData) {
            setEditData({
                ...sceneData,
                videoEffects: {
                    clips: sceneData.videoEffects?.clips || [],
                    logos: sceneData.videoEffects?.logos || [],
                    backgroundMusic: Array.isArray(sceneData.videoEffects?.backgroundMusic)
                        ? sceneData.videoEffects?.backgroundMusic
                        : (sceneData.videoEffects?.backgroundMusic
                            ? [sceneData.videoEffects.backgroundMusic as unknown as BackgroundMusic]
                            : []),
                    transition: sceneData.videoEffects?.transition || 'quantum_dissolve',
                    transitionEffects: sceneData.videoEffects?.transitionEffects || []
                }
            });
        }
    }, [sceneData]);

    const handleSave = () => {
        if (editData) {
            onSave(sceneDataIndex, editData);
            onClose();
        }
    };

    const handleCancel = () => {
        setEditData(sceneData);
        onClose();
    };

    const addClip = () => {
        if (!editData) return;
        const newClip: VideoClip = {
            id: Date.now().toString(),
            name: '',
            url: '',
            duration: 30
        };
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                clips: [...(prev!.videoEffects?.clips || []), newClip]
            }
        }));
    };

    const updateClip = (id: string, field: keyof VideoClip, value: string | number) => {
        if (!editData) return;
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                clips: prev!.videoEffects?.clips?.map(clip =>
                    clip.id === id ? { ...clip, [field]: value } : clip
                ) || []
            }
        }));
    };

    const removeClip = (id: string) => {
        if (!editData) return;
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                clips: prev!.videoEffects?.clips?.filter(clip => clip.id !== id) || []
            }
        }));
    };

    const addLogo = () => {
        if (!editData) return;
        const newLogo: LogoOverlay = {
            id: Date.now().toString(),
            name: 'New Logo',
            url: '',
            position: 'top-right'
        };
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                logos: [...(prev!.videoEffects?.logos || []), newLogo]
            }
        }));
    };

    const updateLogo = (id: string, field: keyof LogoOverlay, value: string) => {
        if (!editData) return;
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                logos: prev!.videoEffects?.logos?.map(logo =>
                    logo.id === id ? { ...logo, [field]: value } : logo
                ) || []
            }
        }));
    };

    const removeLogo = (id: string) => {
        if (!editData) return;
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                logos: prev!.videoEffects?.logos?.filter(logo => logo.id !== id) || []
            }
        }));
    };

    const toggleEffect = (effect: string) => {
        if (!editData) return;
        const currentEffects = editData.videoEffects?.transitionEffects || [];
        const newEffects = currentEffects.includes(effect)
            ? currentEffects.filter(e => e !== effect)
            : [...currentEffects, effect];

        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                effects: newEffects
            }
        }));
    };

    const updateBackgroundMusic = (field: keyof BackgroundMusic, value: any) => {
        if (!editData) return;
        setEditData(prev => ({
            ...prev!,
            videoEffects: {
                ...prev!.videoEffects!,
                backgroundMusic: (() => {
                    const list = Array.isArray(prev!.videoEffects?.backgroundMusic)
                        ? [...(prev!.videoEffects!.backgroundMusic as BackgroundMusic[])]
                        : [] as BackgroundMusic[];
                    const ensure = (bm?: BackgroundMusic): BackgroundMusic => bm || {
                        id: Date.now().toString(),
                        selectedMusic: '',
                        volume: 0.3,
                        autoAdjust: true,
                        fadeIn: true,
                        fadeOut: true
                    };
                    const first = ensure(list[0]);
                    (first as any)[field] = value;
                    list[0] = first;
                    return list;
                })()
            }
        }));
    };

    if (!editData) return null;

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: 'white',
                    minHeight: '80vh'
                }
            }}
        >
            <DialogTitle component="div" sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Typography variant="h5" component="span" sx={{ fontWeight: 'bold' }}>
                    Edit SceneData {sceneDataIndex + 1}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        sx={{
                            bgcolor: SUCCESS.main,
                            '&:hover': { bgcolor: SUCCESS.dark }
                        }}
                    >
                        Save
                    </Button>
                    <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        sx={{
                            px: 3,
                            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                            '& .Mui-selected': { color: 'white' }
                        }}
                    >
                        <Tab label="Basic Info" />
                        <Tab label="Video Clips" />
                        <Tab label="Logo Overlays" />
                        <Tab label="Background Music" />
                        <Tab label="Transitions" />
                        <Tab label="Video Effects" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 3 }}>
                    {/* Basic Info Tab */}
                    {activeTab === 0 && (
                        <Box sx={{ space: 3 }}>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Narration"
                                    multiline
                                    rows={4}
                                    value={editData.narration}
                                    onChange={(e) => setEditData(prev => ({ ...prev!, narration: e.target.value }))}
                                    variant="outlined"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            color: 'white',
                                            '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                                            '&.Mui-focused fieldset': { borderColor: PRIMARY.main }
                                        },
                                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                                        '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY.main }
                                    }}
                                />
                            </Grid>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'end', mt: 2 }}>
                                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    Duration:
                                </Typography>
                                <Typography variant="h6" sx={{ color: INFO.main, fontWeight: 700 }}>
                                    {`${editData.durationInSeconds}s`}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Video Clips Tab */}
                    {activeTab === 1 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PlayIcon sx={{ color: PRIMARY.main }} />
                                    Video Clips
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={addClip}
                                    sx={{ bgcolor: PRIMARY.main }}
                                >
                                    Add Clip
                                </Button>
                            </Box>

                            <Grid container spacing={2}>
                                {editData.videoEffects?.clips?.map((clip) => (
                                    <Grid item xs={12} key={clip.id}>
                                        <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <CardContent>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} md={3}>
                                                        <TextField
                                                            fullWidth
                                                            label="Clip Name"
                                                            value={clip.name}
                                                            onChange={(e) => updateClip(clip.id, 'name', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { color: 'white' },
                                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="URL or File"
                                                            value={clip.url}
                                                            onChange={(e) => updateClip(clip.id, 'url', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { color: 'white' },
                                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={2}>
                                                        <TextField
                                                            fullWidth
                                                            label="Duration (s)"
                                                            type="number"
                                                            value={clip.duration}
                                                            onChange={(e) => updateClip(clip.id, 'duration', parseInt(e.target.value) || 0)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { color: 'white' },
                                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={2}>
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<UploadIcon />}
                                                            size="small"
                                                            sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                                                        >
                                                            Upload
                                                        </Button>
                                                    </Grid>
                                                    <Grid item xs={12} md={1}>
                                                        <IconButton
                                                            onClick={() => removeClip(clip.id)}
                                                            sx={{ color: ERROR.main }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>

                                                {clip.url && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <MediaPlayer
                                                            src={clip.url}
                                                            type="video"
                                                            title={clip.name}
                                                            className="w-full h-32 rounded-lg"
                                                            thumbnail={clip.thumbnail}
                                                        />
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Logo Overlays Tab */}
                    {activeTab === 2 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ImageIcon sx={{ color: INFO.main }} />
                                    Logo Overlays
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={addLogo}
                                    sx={{ bgcolor: INFO.main }}
                                >
                                    Add Logo
                                </Button>
                            </Box>

                            <Grid container spacing={2}>
                                {editData.videoEffects?.logos?.map((logo) => (
                                    <Grid item xs={12} key={logo.id}>
                                        <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <CardContent>
                                                <Grid container spacing={2} alignItems="center">
                                                    <Grid item xs={12} md={3}>
                                                        <TextField
                                                            fullWidth
                                                            label="Logo Name"
                                                            value={logo.name}
                                                            onChange={(e) => updateLogo(logo.id, 'name', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { color: 'white' },
                                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={4}>
                                                        <TextField
                                                            fullWidth
                                                            label="Image URL"
                                                            value={logo.url}
                                                            onChange={(e) => updateLogo(logo.id, 'url', e.target.value)}
                                                            size="small"
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { color: 'white' },
                                                                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} md={3}>
                                                        <FormControl fullWidth size="small">
                                                            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Position</InputLabel>
                                                            <Select
                                                                value={logo.position}
                                                                onChange={(e) => updateLogo(logo.id, 'position', e.target.value)}
                                                                sx={{ color: 'white' }}
                                                            >
                                                                <MenuItem value="top-left">Top Left</MenuItem>
                                                                <MenuItem value="top-right">Top Right</MenuItem>
                                                                <MenuItem value="bottom-left">Bottom Left</MenuItem>
                                                                <MenuItem value="bottom-right">Bottom Right</MenuItem>
                                                                <MenuItem value="center">Center</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>
                                                    <Grid item xs={12} md={1}>
                                                        <IconButton
                                                            onClick={() => removeLogo(logo.id)}
                                                            sx={{ color: ERROR.main }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>

                                                {logo.url && (
                                                    <Box sx={{ mt: 2 }}>
                                                        <MediaPlayer
                                                            src={logo.url}
                                                            type="image"
                                                            title={logo.name}
                                                            className="w-full h-20 rounded-lg"
                                                        />
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Background Music Tab */}
                    {activeTab === 3 && (
                        <Box>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <VolumeIcon sx={{ color: WARNING.main }} />
                                Background Music
                            </Typography>

                            <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <CardContent>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <FormControl fullWidth>
                                                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Select Music</InputLabel>
                                                <Select
                                                    value={editData.videoEffects?.backgroundMusic?.[0]?.selectedMusic || ''}
                                                    onChange={(e) => updateBackgroundMusic('selectedMusic', e.target.value)}
                                                    sx={{ color: 'white' }}
                                                >
                                                    <MenuItem value="">Select background music...</MenuItem>
                                                    {preStoredMusic.map((music) => (
                                                        <MenuItem key={music.id} value={music.id}>
                                                            {music.name} - {music.genre}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography gutterBottom>
                                                Volume ({Math.round(((editData.videoEffects?.backgroundMusic?.[0]?.volume || 0.3) as number) * 100)}%)
                                            </Typography>
                                            <Slider
                                                value={editData.videoEffects?.backgroundMusic?.[0]?.volume || 0.3}
                                                onChange={(e, value) => updateBackgroundMusic('volume', value)}
                                                min={0.1}
                                                max={1}
                                                step={0.1}
                                                sx={{ color: WARNING.main }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={editData.videoEffects?.backgroundMusic?.[0]?.autoAdjust !== false}
                                                            onChange={(e) => updateBackgroundMusic('autoAdjust', e.target.checked)}
                                                            sx={{ color: WARNING.main }}
                                                        />
                                                    }
                                                    label="Auto-adjust volume for vocals"
                                                    sx={{ color: 'white' }}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={editData.videoEffects?.backgroundMusic?.[0]?.fadeIn !== false}
                                                            onChange={(e) => updateBackgroundMusic('fadeIn', e.target.checked)}
                                                            sx={{ color: WARNING.main }}
                                                        />
                                                    }
                                                    label="Fade in"
                                                    sx={{ color: 'white' }}
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={editData.videoEffects?.backgroundMusic?.[0]?.fadeOut !== false}
                                                            onChange={(e) => updateBackgroundMusic('fadeOut', e.target.checked)}
                                                            sx={{ color: WARNING.main }}
                                                        />
                                                    }
                                                    label="Fade out"
                                                    sx={{ color: 'white' }}
                                                />
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {editData.videoEffects?.backgroundMusic?.[0]?.selectedMusic && (
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
                                                Music Preview
                                            </Typography>
                                            <MediaPlayer
                                                src={preStoredMusic.find(m => m.id === editData.videoEffects?.backgroundMusic?.[0]?.selectedMusic)?.url || ''}
                                                type="audio"
                                                title={preStoredMusic.find(m => m.id === editData.videoEffects?.backgroundMusic?.[0]?.selectedMusic)?.name}
                                                className="w-full"
                                            />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Transitions Tab */}
                    {activeTab === 4 && (
                        <Box>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <WandIcon sx={{ color: PURPLE.main }} />
                                Transition Effects
                            </Typography>
                            <TransitionSelector
                                selectedTransition={editData.videoEffects?.transition || 'quantum_dissolve'}
                                onTransitionSelect={(transition) => setEditData(prev => ({
                                    ...prev!,
                                    videoEffects: {
                                        ...prev!.videoEffects!,
                                        transition
                                    }
                                }))}
                            />
                        </Box>
                    )}

                    {/* Video Effects Tab */}
                    {activeTab === 5 && (
                        <Box>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <WandIcon sx={{ color: PURPLE.main }} />
                                Video Effects
                            </Typography>
                            <EffectsPanel
                                selectedEffects={editData.videoEffects?.transitionEffects || []}
                                onEffectToggle={toggleEffect}
                            />
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}
