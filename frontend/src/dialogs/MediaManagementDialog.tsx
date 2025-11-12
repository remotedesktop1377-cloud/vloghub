import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { SceneData, SceneKeywordSelection } from '../types/sceneData';
import { TEXT } from '../styles/colors';
import ImageSearch from '../components/TrendingTopicsComponent/ImageSearch';
import { GoogleDriveServiceFunctions } from '@/services/googleDriveService';
import { useImageViewer } from '../hooks/useImageViewer';

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
                // // Update the SceneData with new assets
                // const modifiedScenesData: SceneData[] = scenesData.map((sceneData, index) => {
                //   if (index === SceneDataIndex) {
                //     // Transform any legacy merge payload (map) into array entries
                //     let nextKeywordsSelected: SceneKeywordSelection[] = Array.isArray(sceneData.keywordsSelected) ? (sceneData.keywordsSelected as SceneKeywordSelection[]) : [];
                //     if (updatedSceneData?.keywordsSelectedMerge && typeof updatedSceneData.keywordsSelectedMerge === 'object') {
                //       const mergeMap = updatedSceneData?.keywordsSelectedMerge as Record<string, string[]>;
                //       const entries = Object.entries(mergeMap);
                //       if (entries.length > 0) {
                //         const [kw, urls] = entries[0];
                //         const low = urls?.[0] || undefined;
                //         const high = urls?.[1] || urls?.[0] || undefined;
                //         const idx = nextKeywordsSelected.findIndex(e => e && e.suggestedKeyword === kw);
                //         const newEntry: import('@/types/sceneData').SceneKeywordSelection = {
                //           suggestedKeyword: kw,
                //           ...(updatedSceneData.modifiedKeywordForMapping && typeof updatedSceneData.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedSceneData.modifiedKeywordForMapping } : {}),
                //           media: {
                //             ...(low ? { lowResMedia: low } : {}),
                //             ...(high ? { highResMedia: high } : {})
                //           },
                //           // Add transitionsEffects to SceneData and log
                //           ...(updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected) && updatedSceneData.keywordsSelected.length > 0 && updatedSceneData.keywordsSelected[0].transitionsEffects
                //             ? { transitionsEffects: updatedSceneData.keywordsSelected[0].transitionsEffects }
                //             : {}),
                //         };
                //         if (idx >= 0) {
                //           const existing = nextKeywordsSelected[idx];
                //           nextKeywordsSelected = nextKeywordsSelected.slice();
                //           nextKeywordsSelected[idx] = {
                //             ...existing,
                //             ...(updatedSceneData.modifiedKeywordForMapping && typeof updatedSceneData.modifiedKeywordForMapping === 'string' ? { modifiedKeyword: updatedSceneData.modifiedKeywordForMapping } : {}),
                //             media: {
                //               ...(existing.media || {}),
                //               ...(low ? { lowResMedia: low } : {}),
                //               ...(high ? { highResMedia: high } : {})
                //             }
                //           };
                //         } else {
                //           nextKeywordsSelected = [...nextKeywordsSelected, newEntry];
                //         }
                //       }
                //     }
                //     // Merge direct keywordsSelected array payload (carry transitionsEffects)
                //     if (updatedSceneData.keywordsSelected && Array.isArray(updatedSceneData.keywordsSelected) && updatedSceneData.keywordsSelected.length > 0) {
                //       const entry = updatedSceneData.keywordsSelected[0] as any;
                //       const kw = String(entry?.suggestedKeyword || '').trim();
                //       if (kw) {
                //         const idx = nextKeywordsSelected.findIndex(e => e && e.suggestedKeyword === kw);
                //         const low = entry?.media?.lowResMedia as string | undefined;
                //         const high = entry?.media?.highResMedia as string | undefined;
                //         const transitionsEffects = Array.isArray(entry?.transitionsEffects) ? entry.transitionsEffects as string[] : undefined;
                //         if (idx >= 0) {
                //           const existing = nextKeywordsSelected[idx];
                //           nextKeywordsSelected = nextKeywordsSelected.slice();
                //           nextKeywordsSelected[idx] = {
                //             ...existing,
                //             media: {
                //               ...(existing.media || {}),
                //               ...(low ? { lowResMedia: low } : {}),
                //               ...(high ? { highResMedia: high } : {})
                //             },
                //             ...(transitionsEffects ? { transitionsEffects } : {})
                //           } as any;
                //         } else {
                //           nextKeywordsSelected = [
                //             ...nextKeywordsSelected,
                //             {
                //               suggestedKeyword: kw,
                //               media: {
                //                 ...(low ? { lowResMedia: low } : {}),
                //                 ...(high ? { highResMedia: high } : {})
                //               },
                //               ...(transitionsEffects ? { transitionsEffects } : {})
                //             } as any
                //           ];
                //         }
                //       }
                //     }
                //     return {
                //       ...sceneData,
                //       ...(nextKeywordsSelected.length > 0 ? { keywordsSelected: nextKeywordsSelected } : {}),
                //       assets: {
                //         ...sceneData.assets,
                //         ...updatedSceneData.assets
                //       }
                //     };
                //   }
                //   return sceneData;
                // });
                // try {
                //   // console.log('SceneData modified (onSceneDataUpdate):', JSON.stringify(updatedSceneData[SceneDataIndex]));
                //   const sceneId = modifiedScenesData[SceneDataIndex].id || '';
                //   const sceneJobId = modifiedScenesData[SceneDataIndex].jobId || jobId;
                //   if (sceneJobId && sceneId) {
                //     await GoogleDriveServiceFunctions.persistSceneUpdate(sceneJobId, modifiedScenesData[SceneDataIndex], 'Project settings applied to scene');
                //   }
                // } catch { }
                // onSceneDataUpdate(modifiedScenesData);
              }}
              onDone={() => {
                onMediaManagementOpen(false);
                onMediaManagementSceneDataIndex(null);
              }}
              existingImageUrls={[
                ...(
                  currentSceneData?.assets?.imagesGoogle || []
                ),
                ...(
                  currentSceneData?.assets?.imagesEnvato || []
                ),
                ...(
                  currentSceneData?.assets?.images || []
                )
              ]}
              suggestionKeywords={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords || []}
              autoSearchOnMount={!!(typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keywords?.length)}
              currentKeywordForMapping={typeof window !== 'undefined' && (window as any).__keywordSuggestions?.keyword}
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
                    return {
                      ...ch,
                      keywordsSelected: nextArray,
                      assets: {
                        ...ch.assets,
                        images: [...(ch.assets?.images || []), ...selectedUrls],
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

