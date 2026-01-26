'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { TransformState } from '@/hooks/useTransformControls';

interface TransformControlsProps {
  clipId: string;
  transform: TransformState;
  containerWidth: number;
  containerHeight: number;
  clipWidth: number; // Natural width of clip
  clipHeight: number; // Natural height of clip
  onTransformUpdate: (delta: Partial<TransformState>) => void;
  onTransformStart: (type: 'move' | 'resize' | 'rotate') => void;
  onTransformEnd: () => void;
  aspectRatioLock?: boolean;
}

interface HandlePosition {
  x: number;
  y: number;
  cursor: string;
}

const HANDLE_SIZE = 8;
const HANDLE_HIT_SIZE = 12;
const ROTATION_HANDLE_DISTANCE = 30;

const TransformControls: React.FC<TransformControlsProps> = ({
  clipId,
  transform,
  containerWidth,
  containerHeight,
  clipWidth,
  clipHeight,
  onTransformUpdate,
  onTransformStart,
  onTransformEnd,
  aspectRatioLock = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | 'rotate' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialTransform, setInitialTransform] = useState<TransformState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate bounding box
  const boundingBox = React.useMemo(() => {
    const { x, y, scaleX, scaleY, rotation } = transform;
    
    // Center position in container (percentage to pixels)
    const centerX = (transform.x / 100) * containerWidth;
    const centerY = (transform.y / 100) * containerHeight;
    
    // Scaled dimensions
    const scaledWidth = clipWidth * scaleX;
    const scaledHeight = clipHeight * scaleY;
    
    // Bounding box corners (before rotation)
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;
    
    return {
      centerX,
      centerY,
      width: scaledWidth,
      height: scaledHeight,
      rotation,
      halfWidth,
      halfHeight,
    };
  }, [transform, containerWidth, containerHeight, clipWidth, clipHeight]);

  // Calculate handle positions
  const handles = React.useMemo((): HandlePosition[] => {
    const { centerX, centerY, halfWidth, halfHeight, rotation } = boundingBox;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Rotate corners
    const rotatePoint = (px: number, py: number) => {
      const rx = px * cos - py * sin;
      const ry = px * sin + py * cos;
      return {
        x: centerX + rx,
        y: centerY + ry,
      };
    };
    
    return [
      // Corners
      rotatePoint(-halfWidth, -halfHeight), // Top-left
      rotatePoint(halfWidth, -halfHeight),  // Top-right
      rotatePoint(halfWidth, halfHeight),   // Bottom-right
      rotatePoint(-halfWidth, halfHeight),  // Bottom-left
      // Edges
      rotatePoint(0, -halfHeight),          // Top
      rotatePoint(halfWidth, 0),            // Right
      rotatePoint(0, halfHeight),          // Bottom
      rotatePoint(-halfWidth, 0),           // Left
    ];
  }, [boundingBox]);

  // Rotation handle position
  const rotationHandle = React.useMemo(() => {
    const { centerX, centerY, rotation } = boundingBox;
    const rad = (rotation * Math.PI) / 180;
    return {
      x: centerX + Math.sin(rad) * ROTATION_HANDLE_DISTANCE,
      y: centerY - Math.cos(rad) * ROTATION_HANDLE_DISTANCE,
    };
  }, [boundingBox]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize' | 'rotate', handleIndex?: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialTransform({ ...transform });
    onTransformStart(type);
  }, [transform, onTransformStart]);

  // Handle mouse move
  useEffect(() => {
    if (!isDragging || !dragStart || !initialTransform || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // Convert pixel deltas to transform deltas based on container size
      const deltaXPercent = (deltaX / containerWidth) * 100;
      const deltaYPercent = (deltaY / containerHeight) * 100;
      
      if (dragType === 'move') {
        onTransformUpdate({
          x: initialTransform.x + deltaXPercent,
          y: initialTransform.y + deltaYPercent,
        });
      } else if (dragType === 'resize' && typeof handleIndex !== 'undefined') {
        // Calculate scale based on handle position
        // This is simplified - full implementation would calculate based on which handle
        const scaleDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / Math.max(clipWidth, clipHeight);
        
        if (aspectRatioLock) {
          const newScaleX = initialTransform.scaleX + scaleDelta;
          onTransformUpdate({
            scaleX: newScaleX,
            scaleY: newScaleX, // Lock aspect ratio
          });
        } else {
          // Resize based on handle position (simplified)
          onTransformUpdate({
            scaleX: initialTransform.scaleX + (deltaX / clipWidth),
            scaleY: initialTransform.scaleY + (deltaY / clipHeight),
          });
        }
      } else if (dragType === 'rotate') {
        const { centerX, centerY } = boundingBox;
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
        onTransformUpdate({
          rotation: angle,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragType(null);
      setDragStart(null);
      setInitialTransform(null);
      onTransformEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, initialTransform, dragType, containerWidth, containerHeight, clipWidth, clipHeight, aspectRatioLock, onTransformUpdate, onTransformEnd, boundingBox]);

  // Cursor styles for handles
  const getHandleCursor = (index: number): string => {
    if (dragType === 'rotate') return 'crosshair';
    
    const cursors = [
      'nw-resize', // 0: top-left
      'ne-resize', // 1: top-right
      'se-resize', // 2: bottom-right
      'sw-resize', // 3: bottom-left
      'n-resize',  // 4: top
      'e-resize',  // 5: right
      's-resize',  // 6: bottom
      'w-resize',  // 7: left
    ];
    return cursors[index] || 'default';
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isDragging ? 'none' : 'auto',
        zIndex: 1000,
      }}
    >
      {/* Bounding box */}
      <Box
        sx={{
          position: 'absolute',
          left: `${boundingBox.centerX - boundingBox.halfWidth}px`,
          top: `${boundingBox.centerY - boundingBox.halfHeight}px`,
          width: `${boundingBox.width}px`,
          height: `${boundingBox.height}px`,
          border: '2px dashed',
          borderColor: 'primary.main',
          transform: `rotate(${boundingBox.rotation}deg)`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      />

      {/* Resize handles */}
      {handles.map((handle, index) => (
        <Box
          key={`handle-${index}`}
          onMouseDown={(e) => handleMouseDown(e, 'resize', index)}
          sx={{
            position: 'absolute',
            left: `${handle.x - HANDLE_SIZE / 2}px`,
            top: `${handle.y - HANDLE_SIZE / 2}px`,
            width: `${HANDLE_SIZE}px`,
            height: `${HANDLE_SIZE}px`,
            bgcolor: 'primary.main',
            border: '2px solid',
            borderColor: 'background.paper',
            borderRadius: '50%',
            cursor: getHandleCursor(index),
            pointerEvents: 'auto',
            '&:hover': {
              transform: 'scale(1.2)',
            },
          }}
        />
      ))}

      {/* Rotation handle */}
      <Box
        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
        sx={{
          position: 'absolute',
          left: `${rotationHandle.x - HANDLE_SIZE / 2}px`,
          top: `${rotationHandle.y - HANDLE_SIZE / 2}px`,
          width: `${HANDLE_SIZE}px`,
          height: `${HANDLE_SIZE}px`,
          bgcolor: 'secondary.main',
          border: '2px solid',
          borderColor: 'background.paper',
          borderRadius: '50%',
          cursor: 'crosshair',
          pointerEvents: 'auto',
          '&:hover': {
            transform: 'scale(1.2)',
          },
        }}
      />

      {/* Rotation line */}
      <Box
        sx={{
          position: 'absolute',
          left: `${boundingBox.centerX}px`,
          top: `${boundingBox.centerY}px`,
          width: '2px',
          height: `${ROTATION_HANDLE_DISTANCE}px`,
          bgcolor: 'primary.main',
          opacity: 0.5,
          transform: `rotate(${boundingBox.rotation}deg)`,
          transformOrigin: 'center top',
          pointerEvents: 'none',
        }}
      />

      {/* Anchor point indicator */}
      <Box
        sx={{
          position: 'absolute',
          left: `${boundingBox.centerX - 4}px`,
          top: `${boundingBox.centerY - 4}px`,
          width: '8px',
          height: '8px',
          bgcolor: 'warning.main',
          border: '1px solid',
          borderColor: 'background.paper',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};

export default TransformControls;

