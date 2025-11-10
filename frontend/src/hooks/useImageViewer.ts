import { useState, useCallback } from 'react';
import { ImageViewMode } from '../components/ui/ImageViewer/ImageViewModal';

interface ImageData {
  url: string;
  name?: string;
  type?: 'generated' | 'uploaded';
}

interface UseImageViewerReturn {
  // Modal state
  isOpen: boolean;
  currentIndex: number;
  viewMode: ImageViewMode;
  images: ImageData[];

  // Actions
  openViewer: (images: ImageData[], initialIndex?: number, initialViewMode?: ImageViewMode) => void;
  closeViewer: () => void;
  setCurrentIndex: (index: number) => void;
  setViewMode: (mode: ImageViewMode) => void;
  nextImage: () => void;
  prevImage: () => void;

  // Utility
  hasNext: boolean;
  hasPrev: boolean;
  currentImage: ImageData | null;
}

export const useImageViewer = (): UseImageViewerReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ImageViewMode>('preview');
  const [images, setImages] = useState<ImageData[]>([]);

  const openViewer = useCallback((
    newImages: ImageData[],
    initialIndex: number = 0,
    initialViewMode: ImageViewMode = 'preview'
  ) => {
    setImages(newImages);
    setCurrentIndex(Math.max(0, Math.min(initialIndex, newImages.length - 1)));
    setViewMode(initialViewMode);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    // Keep the state for potential re-opening
  }, []);

  const handleSetCurrentIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  const nextImage = useCallback(() => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, images.length]);

  const prevImage = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const hasNext = currentIndex < images.length - 1;
  const hasPrev = currentIndex > 0;
  const currentImage = images[currentIndex] || null;

  return {
    // State
    isOpen,
    currentIndex,
    viewMode,
    images,

    // Actions
    openViewer,
    closeViewer,
    setCurrentIndex: handleSetCurrentIndex,
    setViewMode,
    nextImage,
    prevImage,

    // Utility
    hasNext,
    hasPrev,
    currentImage
  };
};

// Helper function to convert SceneData images to ImageData format
export const formatSceneDataImages = (
  SceneDataImages: string[],
  gammaPreviewImage: string,
): ImageData[] => {
  const images: ImageData[] = [];

  // Add generated image first if it exists
  if (gammaPreviewImage) {
    images.push({
      url: gammaPreviewImage,
      name: 'Preview Image',
      type: 'generated',
    });
  }

  // Add uploaded images
  SceneDataImages.forEach((url, index) => {
    images.push({
      url,
      name: `Uploaded Image ${index + 1}`,
      type: 'uploaded'
    });
  });

  return images;
};

// Helper function to create view mode options for UI
export const getViewModeOptions = () => [
  { value: 'thumbnail' as ImageViewMode, label: 'Thumbnail', icon: 'thumbnail' },
  { value: 'preview' as ImageViewMode, label: 'Preview', icon: 'preview' },
  { value: 'fullscreen' as ImageViewMode, label: 'Fullscreen', icon: 'fullscreen' }
];


