import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { SceneData } from '../types/sceneData';
import { TEXT } from '../styles/colors';
import ImageSearch from '../components/TrendingTopicsComponent/ImageSearch';
import { useImageViewer } from '../hooks/useImageViewer';
import { HelperFunctions } from '@/utils/helperFunctions';

interface SceneMediaSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  scenesData: SceneData[];
  initialTab?: 'google' | 'envatoClips';
  scriptTitle?: string;
  trendingTopic?: string;
  location?: string;
  onSceneDataUpdate: (sceneData: SceneData[]) => void;
  onMediaAdded?: (sceneIndex: number, mediaUrl: string) => void;
}

const SceneMediaSelectionDialog: React.FC<SceneMediaSelectionDialogProps> = ({
  open,
  onClose,
  scenesData,
  initialTab = 'google',
  scriptTitle,
  trendingTopic,
  location,
  onSceneDataUpdate,
  onMediaAdded,
}) => {
  const imageViewer = useImageViewer();
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const [currentTab, setCurrentTab] = useState<'google' | 'envatoClips'>(initialTab);

  // Reset selected scene when dialog opens or tab changes
  useEffect(() => {
    if (open && scenesData.length > 0) {
      setSelectedSceneIndex(0);
      setCurrentTab(initialTab);
    }
  }, [open, scenesData.length, initialTab]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      (window as any).__keywordSuggestions = undefined;
    }
    onClose();
  };

  const currentSceneData = scenesData[selectedSceneIndex];

  if (!currentSceneData) {
    return null;
  }

  // Extract keywords from scene data
  const extractKeywords = (sceneData: SceneData): string[] => {
    const keywords: string[] = [];
    
    // Get keywords from keywordsSelected array
    if (Array.isArray(sceneData.keywordsSelected)) {
      sceneData.keywordsSelected.forEach((kw: any) => {
        if (kw && typeof kw === 'object') {
          // Use modifiedKeyword if available, otherwise suggestedKeyword
          const keyword = kw.modifiedKeyword || kw.suggestedKeyword;
          if (keyword && typeof keyword === 'string' && keyword.trim()) {
            keywords.push(keyword.trim());
          }
        } else if (typeof kw === 'string' && kw.trim()) {
          keywords.push(kw.trim());
        }
      });
    }
    
    // Get keywords from highlightedKeywords array
    if (Array.isArray(sceneData.highlightedKeywords)) {
      sceneData.highlightedKeywords.forEach((kw: any) => {
        if (typeof kw === 'string' && kw.trim()) {
          keywords.push(kw.trim());
        }
      });
    }
    
    // Deduplicate and return
    return Array.from(new Set(keywords));
  };

  const extractedKeywords = extractKeywords(currentSceneData);
  const hasKeywords = extractedKeywords.length > 0;
  const firstKeyword = hasKeywords ? extractedKeywords[0] : undefined;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      sx={{
        zIndex: 9999,
        '& .MuiBackdrop-root': {
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        '& .MuiDialog-container': {
          zIndex: 9999,
        },
      }}
      PaperProps={{
        sx: { 
          minHeight: '600px', 
          bgcolor: 'background.paper',
          zIndex: 9999,
          position: 'relative',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10000 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Typography variant="h5" component="div" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
            {currentTab === 'google' ? 'Google Images' : 'Envato Clips'} - Select Scene
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Scene</InputLabel>
            <Select
              value={selectedSceneIndex}
              label="Scene"
              onChange={(e) => setSelectedSceneIndex(Number(e.target.value))}
            >
              {scenesData.map((scene, index) => (
                <MenuItem key={scene.id || index} value={index}>
                  Scene {index + 1}
                  {scene.title ? ` - ${scene.title}` : ''}
                  {scene.narration ? ` (${scene.narration.substring(0, 30)}...)` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            ml: 1,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke={TEXT.dark} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, zIndex: 10000, position: 'relative' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '800px', position: 'relative', zIndex: 10000 }}>
          <Box sx={{ flex: 1, position: 'relative', zIndex: 10000 }}>
            <ImageSearch
              key={`${currentTab}-${selectedSceneIndex}`}
              SceneDataNarration={currentSceneData?.narration || ''}
              scriptTitle={scriptTitle}
              trendingTopic={trendingTopic}
              location={location}
              keywords={(currentSceneData?.highlightedKeywords || []).filter(k => typeof k === 'string' && k.trim())}
              onClearSelection={() => {}}
              initialActiveTab={currentTab}
              visibleTabs={currentTab === 'google' ? ['google'] : ['envatoClips']}
              suggestionKeywords={extractedKeywords}
              autoSearchOnMount={hasKeywords}
              currentKeywordForMapping={firstKeyword}
              onImageSelect={(imageUrl) => {
                // Update scene's images map
                const updatedScenes = scenesData.map((scene, idx) => {
                  if (idx !== selectedSceneIndex) return scene;
                  return {
                    ...scene,
                    assets: {
                      ...scene.assets,
                      images: [...(scene.assets?.images || []), imageUrl]
                    }
                  };
                });
                onSceneDataUpdate(updatedScenes);
                if (onMediaAdded) {
                  onMediaAdded(selectedSceneIndex, imageUrl);
                }
              }}
              onImagePreview={(imageUrl) => {
                imageViewer.openViewer([{ url: imageUrl }], 0, 'preview');
              }}
              SceneDataIndex={selectedSceneIndex}
              onSceneDataUpdate={async (SceneDataIndex, updatedSceneData: any) => {
                const updated: SceneData[] = scenesData.map((ch, idx) => {
                  if (idx !== SceneDataIndex) return ch;
                  
                  if (updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected)) {
                    const existingArray: any[] = Array.isArray(ch.keywordsSelected) 
                      ? (ch.keywordsSelected as any[]) 
                      : [];
                    
                    const newKeywordsSelected = updatedSceneData.keywordsSelected.map((newKw: any) => {
                      const existingIdx = existingArray.findIndex(e => e && e.suggestedKeyword === newKw.suggestedKeyword);
                      if (existingIdx >= 0) {
                        return {
                          ...existingArray[existingIdx],
                          ...newKw
                        };
                      }
                      return newKw;
                    });
                    
                    const merged = [...existingArray];
                    newKeywordsSelected.forEach((newKw: any) => {
                      const idx = merged.findIndex(e => e && e.suggestedKeyword === newKw.suggestedKeyword);
                      if (idx >= 0) {
                        merged[idx] = { ...merged[idx], ...newKw };
                      } else {
                        merged.push(newKw);
                      }
                    });
                    
                    return {
                      ...ch,
                      keywordsSelected: merged
                    };
                  }
                  
                  return {
                    ...ch,
                    ...updatedSceneData
                  };
                });
                
                onSceneDataUpdate(updated);
              }}
              onDone={() => {
                handleClose();
              }}
              existingImageUrls={[
                ...(currentSceneData?.assets?.images || []),
                ...(currentSceneData?.assets?.clips?.map(clip => clip.url) || [])
              ]}
              existingTextOverlay={undefined}
              onDoneWithSelected={(selectedUrls, modifiedKeyword) => {
                const clipUrls: string[] = [];
                const imageUrls: string[] = [];
                
                selectedUrls.forEach(url => {
                  if (HelperFunctions.isVideoUrl(url)) {
                    clipUrls.push(url);
                  } else {
                    imageUrls.push(url);
                  }
                });

                const updated: SceneData[] = scenesData.map((ch, idx) => {
                  if (idx !== selectedSceneIndex) return ch;
                  
                  const existingClips = Array.isArray(ch.assets?.clips) ? (ch.assets?.clips as any[]) : [];
                  const newClips = clipUrls.map(url => ({
                    id: `${clipUrls.indexOf(url) + 1}`,
                    name: `Video Clip ${clipUrls.indexOf(url) + 1}`,
                    url: url,
                    duration: 0,
                    thumbnail: ''
                  }));
                  
                  return {
                    ...ch,
                    assets: {
                      ...ch.assets,
                      images: [...(ch.assets?.images || []), ...imageUrls],
                      clips: [...existingClips, ...newClips],
                    }
                  };
                });
                
                onSceneDataUpdate(updated);
                if (onMediaAdded && selectedUrls.length > 0) {
                  onMediaAdded(selectedSceneIndex, selectedUrls[0]);
                }
                handleClose();
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SceneMediaSelectionDialog;
