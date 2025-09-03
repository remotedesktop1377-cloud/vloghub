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
  onGenerateChapters: () => void;
  onRegenerateAllAssets?: () => void;
  hasChapters?: boolean;
  canGenerate?: boolean;
  subtitleLanguage?: string;
  onSubtitleLanguageChange?: (subtitleLanguage: string) => void;
  narrationType?: 'interview' | 'narration';
  onNarrationTypeChange?: (narrationType: 'interview' | 'narration') => void;
  generating?: boolean; // NEW: show loading
  generatedOnce?: boolean; // NEW: disable after generating
}

const VideoDurationSection: React.FC<VideoDurationSectionProps> = ({
  duration,
  onDurationChange,
  durationOptions,
  language,
  onLanguageChange,
  languageOptions,
  onGenerateChapters,
  onRegenerateAllAssets,
  hasChapters = false,
  canGenerate = false,
  subtitleLanguage = 'english',
  onSubtitleLanguageChange,
  narrationType = 'narration',
  onNarrationTypeChange,
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

      {/* Duration Selection, Language Selection and Generate Chapters */}
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
              value={subtitleLanguage}
              label="Subtitle Language"
              onChange={(e) => onSubtitleLanguageChange?.(e.target.value)}
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
              value={narrationType}
              onChange={(e) => onNarrationTypeChange?.(e.target.value as 'interview' | 'narration')}
              className={styles.narrationTypeRadioGroup}
              sx={{
                '& .MuiFormControlLabel-label': {
                  fontSize: '1.05rem',
                  ml: 0.5
                }
              }}
            >
              <FormControlLabel
                value="narration"
                control={<Radio size="small" className={styles.narrationTypeRadio} />}
                label="Narration"
                className={styles.narrationTypeLabel}
              />
              <FormControlLabel
                value="interview"
                control={<Radio size="small" className={styles.narrationTypeRadio} />}
                label="Interview"
                className={styles.narrationTypeLabel}
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Button
          variant={generating ? 'outlined' : 'contained'}
          size="medium"
          startIcon={generating ? <RefreshIcon /> : (hasChapters ? <RefreshIcon /> : <CutIcon />)}
          onClick={hasChapters ? onRegenerateAllAssets : onGenerateChapters}
          disabled={!canGenerate || generating || generatedOnce}
          sx={{
            bgcolor: generating ? 'action.disabledBackground' : (hasChapters ? '#ff9800' : '#1DA1F2'),
            color: generating ? 'text.secondary' : 'inherit',
            '&:hover': { bgcolor: generating ? 'action.disabledBackground' : (hasChapters ? '#f57c00' : '#0d8bd9') },
            px: 3,
            py: 1,
            fontSize: '1.05rem',
            height: 40
          }}
        >
          {generating ? 'Generating Script...' : (generatedOnce ? 'Script Generated' : (hasChapters ? 'Regenerate Assets' : 'Generate Script'))}
        </Button>
      </Box>


    </Paper>
  );
};

export default VideoDurationSection; 