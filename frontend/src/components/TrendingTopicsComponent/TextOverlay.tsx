import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Slider,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Paper,
    Divider,
    Switch,
    FormControlLabel
} from '@mui/material';
import { TextOverlay as TextOverlayType } from '../../types/sceneData';
import { PRIMARY } from '../../styles/colors';
import { HelperFunctions } from '../../utils/helperFunctions';

interface TextOverlayProps {
    SceneDataNarration: string;
    SceneDataIndex: number;
    onSceneDataUpdate: (SceneDataIndex: number, updatedSceneData: any) => void;
    currentKeywordForMapping?: string;
    existingTextOverlay?: TextOverlayType;
    onDone: () => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({
    SceneDataNarration,
    SceneDataIndex,
    onSceneDataUpdate,
    currentKeywordForMapping,
    existingTextOverlay,
    onDone
}) => {
    const [text, setText] = useState(existingTextOverlay?.text || '');
    const [fontSize, setFontSize] = useState(existingTextOverlay?.fontSize || 24);
    const [fontColor, setFontColor] = useState(existingTextOverlay?.fontColor || '#FFFFFF');
    const [backgroundColor, setBackgroundColor] = useState(existingTextOverlay?.backgroundColor || '#00000080');
    const [position, setPosition] = useState<TextOverlayType['position']>(existingTextOverlay?.position || 'bottom-center');
    const [customX, setCustomX] = useState(existingTextOverlay?.customPosition?.x || 50);
    const [customY, setCustomY] = useState(existingTextOverlay?.customPosition?.y || 50);
    const [usePercentage, setUsePercentage] = useState(existingTextOverlay?.customPosition?.usePercentage !== false);
    const [duration, setDuration] = useState(existingTextOverlay?.duration || 3.0);
    const [fontFamily, setFontFamily] = useState(existingTextOverlay?.fontFamily || 'Arial');
    const [fontWeight, setFontWeight] = useState(existingTextOverlay?.fontWeight || 'normal');
    const [padding, setPadding] = useState(existingTextOverlay?.padding || 10);
    const [borderRadius, setBorderRadius] = useState(existingTextOverlay?.borderRadius || 5);

    useEffect(() => {
        if (!existingTextOverlay && SceneDataNarration) {
            setText(SceneDataNarration.substring(0, 100));
        }
    }, [SceneDataNarration, existingTextOverlay]);

    const handleSave = () => {
        if (!text.trim()) {
            HelperFunctions.showError('Please enter text for the overlay');
            return;
        }

        const textOverlayData: TextOverlayType = {
            text: text.trim(),
            fontSize,
            fontColor,
            backgroundColor,
            position,
            ...(position === 'custom' && {
                customPosition: {
                    x: customX,
                    y: customY,
                    usePercentage
                }
            }),
            duration,
            fontFamily,
            fontWeight,
            padding,
            borderRadius
        };

        const updatedSceneData: any = {
            keywordsSelected: []
        };

        if (currentKeywordForMapping) {
            updatedSceneData.keywordsSelected = [{
                suggestedKeyword: currentKeywordForMapping,
                textOverlay: textOverlayData
            }];
        } else {
            updatedSceneData.textOverlay = textOverlayData;
        }

        onSceneDataUpdate(SceneDataIndex, updatedSceneData);
        HelperFunctions.showSuccess('Text overlay saved successfully');
        onDone();
    };

    const positionOptions: { value: TextOverlayType['position']; label: string; coordinates: string }[] = [
        { value: 'top-left', label: 'Top Left', coordinates: '5%, 8%' },
        { value: 'top-center', label: 'Top Center', coordinates: '50%, 8%' },
        { value: 'top-right', label: 'Top Right', coordinates: '95%, 8%' },
        { value: 'top-second-left', label: 'Top Second Left', coordinates: '5%, 20%' },
        { value: 'top-second-center', label: 'Top Second Center', coordinates: '50%, 20%' },
        { value: 'top-second-right', label: 'Top Second Right', coordinates: '95%, 20%' },
        { value: 'center-left', label: 'Center Left', coordinates: '5%, 40%' },
        { value: 'center', label: 'Center', coordinates: '50%, 50%' },
        { value: 'center-right', label: 'Center Right', coordinates: '95%, 40%' },
        { value: 'lower-third-left', label: 'Lower-Third Left', coordinates: '5%, 75%' },
        { value: 'lower-third-center', label: 'Lower-Third Center', coordinates: '50%, 75%' },
        { value: 'lower-third-right', label: 'Lower-Third Right', coordinates: '95%, 75%' },
        { value: 'bottom-left', label: 'Bottom Left', coordinates: '5%, 95%' },
        { value: 'bottom-center', label: 'Bottom Center', coordinates: '50%, 95%' },
        { value: 'bottom-right', label: 'Bottom Right', coordinates: '95%, 95%' },
    ];

    const fontFamilyOptions = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS', 'Impact'];

    const fontWeightOptions = ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

    const getPositionCoordinates = (): { x: number; y: number } => {
        if (position === 'custom') {
            if (usePercentage) {
                return { x: customX, y: customY };
            } else {
                const previewWidth = 1920;
                const previewHeight = 1080;
                return {
                    x: (customX / previewWidth) * 100,
                    y: (customY / previewHeight) * 100
                };
            }
        }

        const selectedOption = positionOptions.find(opt => opt.value === position);
        if (selectedOption && selectedOption.coordinates !== 'Custom') {
            const [xStr, yStr] = selectedOption.coordinates.split(', ');
            const x = parseFloat(xStr.replace('%', ''));
            const y = parseFloat(yStr.replace('%', ''));
            return { x, y };
        }

        return { x: 50, y: 90 };
    };

    const positionCoords = getPositionCoordinates();

    const getPreviewPositionStyle = (): any => {
        const { x, y } = positionCoords;

        let horizontalKey: 'left' | 'right';
        let verticalKey: 'top' | 'bottom';
        let horizontalValue: string;
        let verticalValue: string;
        let translateX = '0';
        let translateY = '0';

        if (x === 50) {
            horizontalKey = 'left';
            horizontalValue = '50%';
            translateX = '-50%';
        } else if (x < 50) {
            horizontalKey = 'left';
            horizontalValue = `${x}%`;
        } else {
            horizontalKey = 'right';
            horizontalValue = `${100 - x}%`;
        }

        if (y === 50) {
            verticalKey = 'top';
            verticalValue = '50%';
            translateY = '-50%';
        } else if (y < 50) {
            verticalKey = 'top';
            verticalValue = `${y}%`;
        } else {
            verticalKey = 'bottom';
            verticalValue = `${100 - y}%`;
        }

        return {
            [horizontalKey]: horizontalValue,
            [verticalKey]: verticalValue,
            transform: `translate(${translateX}, ${translateY})`
        };
    };

    const previewPositionStyle = getPreviewPositionStyle();

    return (
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Text Overlay Styling
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="Text Content"
                        multiline
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text to display as overlay"
                        sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Position</InputLabel>
                        <Select
                            value={position}
                            onChange={(e) => setPosition(e.target.value as TextOverlayType['position'])}
                            label="Position"
                        >
                            {positionOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label} ({option.coordinates})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Font Family</InputLabel>
                        <Select
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            label="Font Family"
                        >
                            {fontFamilyOptions.map((font) => (
                                <MenuItem key={font} value={font}>
                                    {font}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Font Weight</InputLabel>
                        <Select
                            value={fontWeight}
                            onChange={(e) => setFontWeight(e.target.value)}
                            label="Font Weight"
                        >
                            {fontWeightOptions.map((weight) => (
                                <MenuItem key={weight} value={weight}>
                                    {weight}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        sx={{ mt: 2 }}
                        type="number"
                        label="Duration (seconds)"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        inputProps={{ min: 0.1, step: 0.1 }}
                    />

                </Grid>

                <Grid item xs={6}>
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '16/9',
                            bgcolor: '#1a1a1a',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '2px solid #e0e0e0'
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                ...previewPositionStyle,
                                bgcolor: backgroundColor,
                                borderRadius: `${borderRadius}px`,
                                padding: `${padding}px`,
                                maxWidth: '90%',
                                border: `2px solid ${fontColor}`,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: `${fontSize}px`,
                                    color: fontColor,
                                    fontFamily: fontFamily,
                                    fontWeight: fontWeight,
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {text || 'Preview Text'}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Font Color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="color"
                        label="Background Color"
                        value={backgroundColor.length > 7 ? backgroundColor.substring(0, 7) : backgroundColor}
                        onChange={(e) => {
                            const color = e.target.value;
                            const alpha = backgroundColor.length > 7 ? backgroundColor.substring(7) : '80';
                            setBackgroundColor(color + alpha);
                        }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Font Size: {fontSize}px</Typography>
                    <Slider
                        value={fontSize}
                        onChange={(_, value) => setFontSize(value as number)}
                        min={12}
                        max={120}
                        step={1}
                        marks={[
                            { value: 12, label: '12' },
                            { value: 48, label: '48' },
                            { value: 80, label: '80' },
                            { value: 120, label: '120' }
                        ]}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                        Background Opacity: {Math.round((parseInt(backgroundColor.length > 7 ? backgroundColor.substring(7) : '80', 16) / 255) * 100)}%
                    </Typography>
                    <Slider
                        value={parseInt(backgroundColor.length > 7 ? backgroundColor.substring(7) : '80', 16)}
                        onChange={(_, value) => {
                            const baseColor = backgroundColor.length > 7 ? backgroundColor.substring(0, 7) : backgroundColor;
                            const alpha = Math.round(value as number).toString(16).padStart(2, '0');
                            setBackgroundColor(baseColor + alpha);
                        }}
                        min={0}
                        max={255}
                        step={1}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Padding: {padding}px</Typography>
                    <Slider
                        value={padding}
                        onChange={(_, value) => setPadding(value as number)}
                        min={0}
                        max={50}
                        step={1}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography gutterBottom>Border Radius: {borderRadius}px</Typography>
                    <Slider
                        value={borderRadius}
                        onChange={(_, value) => setBorderRadius(value as number)}
                        min={0}
                        max={50}
                        step={1}
                    />
                </Grid>                

                {position === 'custom' && (
                    <>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={usePercentage}
                                        onChange={(e) => setUsePercentage(e.target.checked)}
                                    />
                                }
                                label="Use Percentage"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label={usePercentage ? "X Position (%)" : "X Position (px)"}
                                value={customX}
                                onChange={(e) => setCustomX(Number(e.target.value))}
                                inputProps={{ min: 0, max: usePercentage ? 100 : 10000 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label={usePercentage ? "Y Position (%)" : "Y Position (px)"}
                                value={customY}
                                onChange={(e) => setCustomY(Number(e.target.value))}
                                inputProps={{ min: 0, max: usePercentage ? 100 : 10000 }}
                            />
                        </Grid>
                    </>
                )}

                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={onDone}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSave}
                            sx={{
                                bgcolor: PRIMARY.main,
                                '&:hover': { bgcolor: PRIMARY.dark }
                            }}
                        >
                            Save Text Overlay
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TextOverlay;

