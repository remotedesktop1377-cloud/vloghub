import React from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import {
  ContentCut as CutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DurationOption } from '../../data/mockDurationOptions';
import { LanguageOption } from '../../data/mockLanguageOptions';

interface VideoDurationSectionProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  durationOptions: DurationOption[];
  language: string;
  onLanguageChange: (language: string) => void;
  languageOptions: LanguageOption[];
  generatingChapters: boolean;
  onGenerateChapters: () => void;
  onRegenerateAllAssets?: () => void;
  hasChapters?: boolean;
  canGenerate?: boolean;
  subtitleLanguage?: string;
  onSubtitleLanguageChange?: (subtitleLanguage: string) => void;
}

const VideoDurationSection: React.FC<VideoDurationSectionProps> = ({
  duration,
  onDurationChange,
  durationOptions,
  language,
  onLanguageChange,
  languageOptions,
  generatingChapters,
  onGenerateChapters,
  onRegenerateAllAssets,
  hasChapters = false,
  canGenerate = false,
  subtitleLanguage = 'english',
  onSubtitleLanguageChange,
}) => {

  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 1 }}>
        Video Duration & Actions
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem', display: 'block' }}>
        Select the desired length for your generated video content and manage your video assets.
      </Typography>

      {/* Duration Selection, Language Selection and Generate Chapters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Duration</InputLabel>
            <Select
              value={duration}
              label="Duration"
              onChange={(e) => onDurationChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '0.85rem' } }}
            >
              {durationOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.85rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={(e) => onLanguageChange(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '0.85rem' } }}
            >
              {languageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.85rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: '0.85rem' }}>Subtitle Language</InputLabel>
            <Select
              value={subtitleLanguage}
              label="Subtitle Language"
              onChange={(e) => onSubtitleLanguageChange?.(e.target.value)}
              sx={{ '& .MuiSelect-select': { fontSize: '0.85rem' } }}
            >
              {languageOptions.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.85rem' }}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          size="small"
          startIcon={hasChapters ? <RefreshIcon /> : <CutIcon />}
          onClick={hasChapters ? onRegenerateAllAssets : onGenerateChapters}
          disabled={!canGenerate || generatingChapters}
          sx={{
            bgcolor: hasChapters ? '#ff9800' : '#1DA1F2',
            '&:hover': { bgcolor: hasChapters ? '#f57c00' : '#0d8bd9' },
            px: 3,
            py: 0.75,
            fontSize: '0.85rem',
            height: 36
          }}
        >
          {generatingChapters
            ? (hasChapters ? 'Regenerating Script...' : 'Generating Script...')
            : (hasChapters ? 'Regenerate Script' : 'Generate Script')
          }
        </Button>
      </Box>


    </Paper>
  );
};

export default VideoDurationSection; 