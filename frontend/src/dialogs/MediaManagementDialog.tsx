import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { SceneData, SceneKeywordSelection, VideoClip } from '../types/sceneData';
import { TEXT } from '../styles/colors';
import ImageSearch from '../components/TrendingTopicsComponent/ImageSearch';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { useImageViewer } from '../hooks/useImageViewer';
import { HelperFunctions } from '@/utils/helperFunctions';

interface MediaManagementDialogProps {
  open: boolean;
  onClose: () => void;
  mediaManagementSceneDataIndex: number | null;
  selectedSceneDataIndex: number;
  scenesData: SceneData[];
  SceneDataImagesMap: Record<number, string[]>;
  scriptTitle?: string;
  trendingTopic?: string;
  location?: string;
  jobId: string;
  onSceneDataImagesMapChange: (map: Record<number, string[]>) => void;
  onSceneDataUpdate: (sceneData: SceneData[]) => void;
  onMediaManagementOpen: (open: boolean) => void;
  onMediaManagementSceneDataIndex: (index: number | null) => void;
  onClearSelection: () => void;
  onGoogleImagePreview?: (imageUrl: string) => void;
}

const MediaManagementDialog: React.FC<MediaManagementDialogProps> = ({
  open,
  onClose,
  mediaManagementSceneDataIndex,
  selectedSceneDataIndex,
  scenesData,
  SceneDataImagesMap,
  scriptTitle,
  trendingTopic,
  location,
  jobId,
  onSceneDataImagesMapChange,
  onSceneDataUpdate,
  onMediaManagementOpen,
  onMediaManagementSceneDataIndex,
  onClearSelection,
  onGoogleImagePreview,
}) => {
  const imageViewer = useImageViewer();

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      (window as any).__keywordSuggestions = undefined;
    }
    onClose();
  };

  const currentSceneDataIndex = mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex;
  const currentSceneData = scenesData[currentSceneDataIndex];
  
  const currentKeyword = typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword;
  const existingTextOverlay = currentKeyword && Array.isArray(currentSceneData?.keywordsSelected) 
    ? (currentSceneData.keywordsSelected as SceneKeywordSelection[]).find(k => k.suggestedKeyword === currentKeyword)?.textOverlay
    : undefined;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px', bgcolor: 'background.paper' }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="div" sx={{ fontSize: '1.3rem', fontWeight: 600 }}>
          Manage Media - SceneData {(mediaManagementSceneDataIndex || 0) + 1}
        </Typography>
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
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '800px' }}>
          {/* Image Search with integrated tabs */}
          <Box sx={{ flex: 1 }}>
            <ImageSearch
              SceneDataNarration={currentSceneData?.narration || ''}
              scriptTitle={scriptTitle}
              trendingTopic={trendingTopic}
              location={location}
              keywords={(currentSceneData?.highlightedKeywords || []).filter(k => typeof k === 'string' && k.trim())}
              onClearSelection={() => onClearSelection()}
              onImageSelect={(imageUrl) => {
                const currentIdx = mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex;
                onSceneDataImagesMapChange({
                  ...SceneDataImagesMap,
                  [currentIdx]: [...(SceneDataImagesMap[currentIdx] || []), imageUrl]
                });
              }}
              onImagePreview={(imageUrl) => {
                if (onGoogleImagePreview) {
                  onGoogleImagePreview(imageUrl);
                } else {
                  // Fallback to existing image viewer
                  imageViewer.openViewer([{ url: imageUrl }], 0, 'preview');
                }
              }}
              SceneDataIndex={currentSceneDataIndex}
              onSceneDataUpdate={async (SceneDataIndex, updatedSceneData: any) => {
                const updated: SceneData[] = scenesData.map((ch, idx) => {
                  if (idx !== SceneDataIndex) return ch;
                  
                  if (updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected)) {
                    const existingArray: SceneKeywordSelection[] = Array.isArray(ch.keywordsSelected) 
                      ? (ch.keywordsSelected as SceneKeywordSelection[]) 
                      : [];
                    
                    const newKeywordsSelected = updatedSceneData.keywordsSelected.map((newKw: SceneKeywordSelection) => {
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
                    newKeywordsSelected.forEach((newKw: SceneKeywordSelection) => {
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
                if (updated[SceneDataIndex]) {
                  GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[SceneDataIndex], 'Text overlay updated');
                }
              }}
              onDone={() => {
                onMediaManagementOpen(false);
                onMediaManagementSceneDataIndex(null);
              }}
              existingImageUrls={[
                ...(currentSceneData?.assets?.images || []),
                ...(currentSceneData?.assets?.clips?.map(clip => clip.url) || [])
              ]}
              suggestionKeywords={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords || []}
              autoSearchOnMount={!!(typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords?.length)}
              currentKeywordForMapping={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword}
              existingTextOverlay={existingTextOverlay}
              onDoneWithSelected={(selectedUrls, modifiedKeyword) => {
                const SceneDataIdx = mediaManagementSceneDataIndex !== null ? mediaManagementSceneDataIndex : selectedSceneDataIndex;
                const kw = typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword;
                if (kw) {
                  // add selected urls to the images array and keywordsSelected
                  const updated: SceneData[] = scenesData.map((ch, idx) => {
                    if (idx !== SceneDataIdx) return ch;
                    const existingArray: import('@/types/sceneData').SceneKeywordSelection[] = Array.isArray(ch.keywordsSelected) ? (ch.keywordsSelected as import('@/types/sceneData').SceneKeywordSelection[]) : [];
                    const low = selectedUrls?.[0] || undefined;
                    const high = selectedUrls?.[1] || selectedUrls?.[0] || undefined;
                    const existingIdx = existingArray.findIndex(e => e && e.suggestedKeyword === kw);
                    let nextArray: import('@/types/sceneData').SceneKeywordSelection[];
                    if (existingIdx >= 0) {
                      nextArray = existingArray.slice();
                      const existing = nextArray[existingIdx] || {} as import('@/types/sceneData').SceneKeywordSelection;
                      nextArray[existingIdx] = {
                        ...existing,
                        ...(modifiedKeyword && modifiedKeyword.trim() ? { modifiedKeyword: modifiedKeyword.trim() } : {}),
                        media: {
                          ...(existing.media || {}),
                          ...(low ? { lowResMedia: low } : {}),
                          ...(high ? { highResMedia: high } : {})
                        }
                      };
                    } else {
                      nextArray = [
                        ...existingArray,
                        {
                          suggestedKeyword: kw,
                          ...(modifiedKeyword && modifiedKeyword.trim() ? { modifiedKeyword: modifiedKeyword.trim() } : {}),
                          media: {
                            ...(low ? { lowResMedia: low } : {}),
                            ...(high ? { highResMedia: high } : {})
                          }
                        }
                      ];
                    }
                    const clipUrls: string[] = [];
                    const imageUrls: string[] = [];
                    
                    selectedUrls.forEach(url => {
                      if (HelperFunctions.isVideoUrl(url)) {
                        clipUrls.push(url);
                      } else {
                        imageUrls.push(url);
                      }
                    });
                    
                    const existingClips: VideoClip[] = Array.isArray(ch.assets?.clips) ? (ch.assets?.clips as VideoClip[]) : [];
                    const newClips: VideoClip[] = clipUrls.map(url => ({
                      id: `${clipUrls.indexOf(url) + 1}`,
                      name: `Video Clip ${clipUrls.indexOf(url) + 1}`,
                      url: url,
                      duration: 0,
                      thumbnail: ''
                    }));
                    
                    return {
                      ...ch,
                      keywordsSelected: nextArray,
                      assets: {
                        ...ch.assets,
                        images: [...(ch.assets?.images || []), ...imageUrls],
                        clips: [...existingClips, ...newClips],
                      }
                    };
                  });
                  // try {
                  //   console.log('Media added to SceneData:', JSON.stringify(updated[SceneDataIdx]));
                  // } catch {}
                  onSceneDataUpdate(updated);
                  GoogleDriveServiceFunctions.persistSceneUpdate(jobId, updated[SceneDataIdx], 'Media added');
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MediaManagementDialog;

