import React from 'react';
import { Paper, Box, Tabs, Tab, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import { Image as ImageIcon, SmartToy as AIIcon, Upload as UploadIcon } from '@mui/icons-material';
import { fallbackImages } from '../../data/mockImages';

interface RightPanelProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
  aiPrompt: string;
  onAIPromptChange: (prompt: string) => void;
  generatingImages: boolean;
  onGenerateImages: () => void;
  selectedImages: string[];
  onImageSelect: (imageUrl: string) => void;
  onImageDeselect: (imageUrl: string) => void;
  onDownloadImage: (imageUrl: string, index: number) => void;
  onTriggerFileUpload: () => void;
  useAI: boolean;
  onUseAIChange: (useAI: boolean) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  activeTab,
  onTabChange,
  aiPrompt,
  onAIPromptChange,
  generatingImages,
  onGenerateImages,
  selectedImages,
  onImageSelect,
  onImageDeselect,
  onDownloadImage,
  onTriggerFileUpload,
  useAI,
  onUseAIChange,
}) => {
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onTabChange(newValue);
  };

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="media tabs">
          <Tab 
            icon={<ImageIcon />} 
            label="Stock Media" 
            iconPosition="start"
            sx={{ fontSize: '0.7rem', minHeight: 40 }}
          />
          <Tab 
            icon={<AIIcon />} 
            label="AI Generation" 
            iconPosition="start"
            sx={{ fontSize: '0.7rem', minHeight: 40 }}
          />
          <Tab 
            icon={<UploadIcon />} 
            label="Upload Media" 
            iconPosition="start"
            sx={{ fontSize: '0.7rem', minHeight: 40 }}
          />
        </Tabs>
      </Box>

      {/* Stock Media Tab */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            Stock Media Library
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.7rem' }}>
            Browse and select from our curated collection of stock images and videos.
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
              {fallbackImages.map((imageUrl, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    border: selectedImages.includes(imageUrl) ? '2px solid #1DA1F2' : '1px solid #e0e0e0',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                  onClick={() => {
                    if (selectedImages.includes(imageUrl)) {
                      onImageDeselect(imageUrl);
                    } else {
                      onImageSelect(imageUrl);
                    }
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`Stock image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '80px',
                      objectFit: 'cover',
                    }}
                  />
                  {selectedImages.includes(imageUrl) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: '#1DA1F2',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* AI Generation Tab */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            AI Image Generation
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={useAI}
                onChange={(e) => onUseAIChange(e.target.checked)}
                size="small"
              />
            }
            label="Enable AI Generation"
            sx={{ mb: 2 }}
          />
          
          {useAI && (
            <>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="AI Prompt"
                placeholder="Describe the image you want to generate..."
                value={aiPrompt}
                onChange={(e) => onAIPromptChange(e.target.value)}
                sx={{ mb: 2 }}
                size="small"
              />
              
              <Button
                fullWidth
                variant="contained"
                onClick={onGenerateImages}
                disabled={generatingImages || !aiPrompt.trim()}
                sx={{ bgcolor: '#9c27b0', '&:hover': { bgcolor: '#7b1fa2' } }}
              >
                {generatingImages ? 'Generating...' : '🎨 Generate Images'}
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Upload Media Tab */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            Upload Your Media
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.7rem' }}>
            Upload your own images, videos, or audio files to use in your project.
          </Typography>
          
          <Button
            fullWidth
            variant="outlined"
            onClick={onTriggerFileUpload}
            sx={{ borderColor: '#1DA1F2', color: '#1DA1F2' }}
          >
            📁 Choose Files
          </Button>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Supported formats: JPG, PNG, MP4, MOV, MP3
          </Typography>
        </Box>
      )}

      {/* Selected Images Display */}
      {selectedImages.length > 0 && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            Selected Media ({selectedImages.length})
          </Typography>
          <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
            {selectedImages.map((imageUrl, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  p: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Selected ${index + 1}`}
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>
                    Media {index + 1}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onDownloadImage(imageUrl, index)}
                  sx={{ fontSize: '0.6rem', p: 0.5 }}
                >
                  📥
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onImageDeselect(imageUrl)}
                  sx={{ fontSize: '0.6rem', p: 0.5, color: 'error.main' }}
                >
                  ✕
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default RightPanel; 