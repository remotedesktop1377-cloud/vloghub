import React from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, Grid, LinearProgress, Chip } from '@mui/material';
import { 
  ContentCut as CutIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  VideoCall as VideoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DurationOption } from '../../data/mockDurationOptions';

interface VideoDurationSectionProps {
  duration: string;
  onDurationChange: (duration: string) => void;
  durationOptions: DurationOption[];
  generatingChapters: boolean;
  onGenerateChapters: () => void;
  hypothesis: string;
  onDownloadAllNarrations?: () => void;
  onUploadChromaKey?: () => void;
  onGenerateVideo?: () => void;
  onRegenerateAllAssets?: () => void;
  hasChapters?: boolean;
  chromaKeyFile?: File | null;
  uploadingChromaKey?: boolean;
  chromaKeyUploadProgress?: number;
}

const VideoDurationSection: React.FC<VideoDurationSectionProps> = ({
  duration,
  onDurationChange,
  durationOptions,
  generatingChapters,
  onGenerateChapters,
  hypothesis,
  onDownloadAllNarrations,
  onUploadChromaKey,
  onGenerateVideo,
  onRegenerateAllAssets,
  hasChapters = false,
  chromaKeyFile,
  uploadingChromaKey = false,
  chromaKeyUploadProgress = 0,
}) => {
  return (
    <Paper sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>
        Video Duration & Actions
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.65rem', display: 'block' }}>
        Select the desired length for your generated video content and manage your video assets.
      </Typography>
      
      {/* Duration Selection and Generate Chapters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel sx={{ fontSize: '0.7rem' }}>Duration</InputLabel>
          <Select
            value={duration}
            label="Duration"
            onChange={(e) => onDurationChange(e.target.value)}
            sx={{ '& .MuiSelect-select': { fontSize: '0.7rem' } }}
          >
            {durationOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.7rem' }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="small"
          startIcon={hasChapters ? <RefreshIcon /> : <CutIcon />}
          onClick={hasChapters ? onRegenerateAllAssets : onGenerateChapters}
          disabled={!hypothesis.trim() || generatingChapters}
          sx={{
            bgcolor: hasChapters ? '#ff9800' : '#1DA1F2',
            '&:hover': { bgcolor: hasChapters ? '#f57c00' : '#0d8bd9' },
            px: 3,
            py: 0.75,
            fontSize: '0.7rem',
            height: 32
          }}
        >
          {generatingChapters 
            ? (hasChapters ? 'Regenerating Assets...' : 'Generating Chapters...') 
            : (hasChapters ? 'Regenerate Assets' : 'Generate Chapters')
          }
        </Button>
      </Box>

      {/* Action Buttons */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontSize: '0.6rem', display: 'block' }}>
          Video Production Actions {!hasChapters && '(Generate chapters first)'}
        </Typography>
        
        {!hasChapters && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.55rem', display: 'block', fontStyle: 'italic' }}>
            These actions will be available after chapters are generated
          </Typography>
        )}
        
        <Grid container spacing={1}>
            <Grid item xs={6} sm={4}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<DownloadIcon />}
                onClick={onDownloadAllNarrations}
                disabled={!hasChapters || generatingChapters}
                sx={{
                  fontSize: '0.65rem',
                  py: 0.5,
                  height: 28,
                  textTransform: 'none'
                }}
              >
                Download Narrations
              </Button>
            </Grid>
            <Grid item xs={6} sm={4}>
              <Box sx={{ position: 'relative' }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<UploadIcon />}
                  onClick={onUploadChromaKey}
                  disabled={!hasChapters || generatingChapters || uploadingChromaKey}
                  sx={{
                    fontSize: '0.65rem',
                    py: 0.5,
                    height: 28,
                    textTransform: 'none'
                  }}
                >
                  {uploadingChromaKey ? 'Uploading...' : (chromaKeyFile ? 'Replace Chroma Key' : 'Upload Chroma Key')}
                </Button>
                
                {/* Upload Progress */}
                {uploadingChromaKey && (
                  <LinearProgress
                    variant="determinate"
                    value={chromaKeyUploadProgress}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      borderRadius: 0
                    }}
                  />
                )}
                
                {/* Chroma Key Status */}
                {chromaKeyFile && !uploadingChromaKey && (
                  <Chip
                    label={chromaKeyFile.name.length > 15 ? `${chromaKeyFile.name.substring(0, 15)}...` : chromaKeyFile.name}
                    size="small"
                    color="success"
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: 0,
                      fontSize: '0.5rem',
                      height: 16,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                startIcon={<VideoIcon />}
                onClick={onGenerateVideo}
                disabled={!hasChapters || generatingChapters || !chromaKeyFile || uploadingChromaKey}
                sx={{
                  bgcolor: '#4caf50',
                  '&:hover': { bgcolor: '#388e3c' },
                  '&:disabled': { 
                    bgcolor: '#e0e0e0',
                    color: '#9e9e9e'
                  },
                  fontSize: '0.65rem',
                  py: 0.5,
                  height: 28,
                  textTransform: 'none'
                }}
                title={!chromaKeyFile ? 'Upload chroma key first' : ''}
              >
                Generate Video
              </Button>
            </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default VideoDurationSection; 