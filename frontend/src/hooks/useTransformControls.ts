import { useState, useCallback, useRef } from 'react';
import { Clip } from '@/types/videoEditor';

export interface TransformState {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  anchorX: number; // Normalized 0-1
  anchorY: number; // Normalized 0-1
}

export interface TransformControls {
  selectedClipId: string | null;
  transformState: TransformState | null;
  isTransforming: boolean;
  selectClip: (clipId: string | null, clip?: Clip) => void;
  startTransform: (type: 'move' | 'resize' | 'rotate', initialData: any) => void;
  updateTransform: (delta: Partial<TransformState>) => void;
  commitTransform: () => void;
  cancelTransform: () => void;
  resetTransform: () => void;
}

const DEFAULT_TRANSFORM: TransformState = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  anchorX: 0.5,
  anchorY: 0.5,
};

/**
 * Hook for managing canvas transform controls
 */
export function useTransformControls(): TransformControls {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [transformState, setTransformState] = useState<TransformState | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const initialTransformRef = useRef<TransformState | null>(null);
  const transformTypeRef = useRef<'move' | 'resize' | 'rotate' | null>(null);

  const selectClip = useCallback((clipId: string | null, clip?: Clip) => {
    setSelectedClipId(clipId);
    
    if (clipId && clip) {
      // Initialize transform state from clip properties
      const transform = clip.properties.transform || DEFAULT_TRANSFORM;
      const anchorPoint = clip.properties.anchorPoint || { x: 0.5, y: 0.5 };
      
      setTransformState({
        x: transform.x || 0,
        y: transform.y || 0,
        scaleX: transform.scaleX || 1,
        scaleY: transform.scaleY || 1,
        rotation: transform.rotation || 0,
        anchorX: anchorPoint.x,
        anchorY: anchorPoint.y,
      });
    } else {
      setTransformState(null);
    }
  }, []);

  const startTransform = useCallback((type: 'move' | 'resize' | 'rotate', initialData: any) => {
    setIsTransforming(true);
    transformTypeRef.current = type;
    
    if (transformState) {
      initialTransformRef.current = { ...transformState };
    }
  }, [transformState]);

  const updateTransform = useCallback((delta: Partial<TransformState>) => {
    if (!transformState) return;
    
    setTransformState((prev) => {
      if (!prev) return prev;
      
      return {
        ...prev,
        ...delta,
      };
    });
  }, [transformState]);

  const commitTransform = useCallback(() => {
    setIsTransforming(false);
    transformTypeRef.current = null;
    initialTransformRef.current = null;
  }, []);

  const cancelTransform = useCallback(() => {
    if (initialTransformRef.current) {
      setTransformState(initialTransformRef.current);
    }
    setIsTransforming(false);
    transformTypeRef.current = null;
    initialTransformRef.current = null;
  }, []);

  const resetTransform = useCallback(() => {
    setTransformState(DEFAULT_TRANSFORM);
  }, []);

  return {
    selectedClipId,
    transformState,
    isTransforming,
    selectClip,
    startTransform,
    updateTransform,
    commitTransform,
    cancelTransform,
    resetTransform,
  };
}

/**
 * Calculate transform matrix from transform state
 */
export function getTransformMatrix(transform: TransformState): string {
  const { x, y, scaleX, scaleY, rotation, anchorX, anchorY } = transform;
  
  // Calculate anchor point in pixels (assuming 100% container)
  // This will be adjusted based on actual container size
  const anchorPixelX = anchorX * 100; // Percentage to pixels approximation
  const anchorPixelY = anchorY * 100;
  
  // Build transform string
  // Order: translate anchor to origin, rotate, scale, translate back, translate position
  return `
    translate(${x}px, ${y}px)
    translate(${anchorPixelX}%, ${anchorPixelY}%)
    rotate(${rotation}deg)
    scale(${scaleX}, ${scaleY})
    translate(-${anchorPixelX}%, -${anchorPixelY}%)
  `.trim();
}

/**
 * Calculate bounding box from transform state
 */
export function getBoundingBox(
  width: number,
  height: number,
  transform: TransformState
): { x: number; y: number; width: number; height: number; rotation: number } {
  const { x, y, scaleX, scaleY, rotation } = transform;
  
  return {
    x: x - (width * scaleX) / 2,
    y: y - (height * scaleY) / 2,
    width: width * scaleX,
    height: height * scaleY,
    rotation,
  };
}

/**
 * Apply aspect ratio lock to transform
 */
export function applyAspectRatioLock(
  transform: TransformState,
  aspectRatio: number,
  lockWidth: boolean
): TransformState {
  if (lockWidth) {
    return {
      ...transform,
      scaleY: transform.scaleX / aspectRatio,
    };
  } else {
    return {
      ...transform,
      scaleX: transform.scaleY * aspectRatio,
    };
  }
}

