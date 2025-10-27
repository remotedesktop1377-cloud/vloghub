'use client';

import React from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import {
  ContentCut as CutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DurationOption } from '../../data/mockDurationOptions';
import { LanguageOption } from '../../data/mockLanguageOptions';
import styles from './css/TrendingTopics.module.css';

interface VideoDurationSectionProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  durationOptions: DurationOption[];
  language: string;
  onLanguageChange: (language: string) => void;
  languageOptions: LanguageOption[];
  onGenerateSceneData: () => void;
  onRegenerateAllAssets?: () => void;
  hasSceneData?: boolean;
  canGenerate?: boolean;
  subtitle_language?: string;
  onsubtitle_languageChange?: (subtitle_language: string) => void;
  narration_type?: 'interview' | 'narration';
  onnarration_typeChange?: (narration_type: 'interview' | 'narration') => void;
  generating?: boolean;
  generatedOnce?: boolean;
}

const VideoDurationSection: React.FC<VideoDurationSectionProps> = ({
  duration,
  onDurationChange,
  durationOptions,
  language,
  onLanguageChange,
  languageOptions,
  onGenerateSceneData,
  onRegenerateAllAssets,
  hasSceneData = false,
  canGenerate = false,
  subtitle_language = 'english',
  onsubtitle_languageChange,
  narration_type = 'narration',
  onnarration_typeChange,
  generating = false,
  generatedOnce = false,
}) => {

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
        Video Duration & Actions
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1.5, fontSize: '1.25rem', display: 'block' }}>
        Select the desired length for your generated video content and manage your video assets.
      </Typography>

      {/* Duration Selection, Language Selection and Generate SceneData */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '1.05rem' }}>Duration</InputLabel>
            <Select
              value={duration}
              label="Duration"
              onChange={(e) => onDurationChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '1.05rem' } }}
            >
              {durationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '1.05rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: '1.05rem' }}>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={(e) => onLanguageChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '1.05rem' } }}
            >
              {languageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '1.05rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '1.05rem' }}>Subtitle Language</InputLabel>
            <Select
              value={subtitle_language}
              label="Subtitle Language"
              onChange={(e) => onsubtitle_languageChange?.(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '1.05rem' } }}
            >
              {languageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '1.05rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Narration Type Selection */}
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <RadioGroup
              row
              value={narration_type}
              onChange={(e) => onnarration_typeChange?.(e.target.value as 'interview' | 'narration')}
              className={styles.narration_typeRadioGroup}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '1.05rem',
                  ml: 0.5
                }
              }}
            >
              <FormControlLabel
                value="narration"
                control={<Radio size="small" className={styles.narration_typeRadio} />}
                label="Narration"
                className={styles.narration_typeLabel}
              />
              <FormControlLabel
                value="interview"
                control={<Radio size="small" className={styles.narration_typeRadio} />}
                label="Interview"
                className={styles.narration_typeLabel}
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Button
          variant={generating ? 'outlined' : 'contained'}
          size="medium"
          startIcon={generating ? <RefreshIcon /> : (hasSceneData ? <RefreshIcon /> : <CutIcon />)}
          onClick={hasSceneData ? onRegenerateAllAssets : onGenerateSceneData}
          disabled={!canGenerate || generating || generatedOnce}
          sx={{
            bgcolor: generating ? 'action.disabledBackground' : (hasSceneData ? '#ff9800' : '#1DA1F2'),
            color: generating ? 'text.secondary' : 'inherit',
            '&:hover': { bgcolor: generating ? 'action.disabledBackground' : (hasSceneData ? '#f57c00' : '#0d8bd9') },
            px: 3,
            py: 1,
            fontSize: '1.05rem',
            height: 40
          }}
        >
          {generating ? 'Generating Script...' : (generatedOnce ? 'Script Generated' : (hasSceneData ? 'Regenerate Assets' : 'Generate Script'))}
        </Button>
      </Box>


    </Paper>
  );
};

export default VideoDurationSection; 