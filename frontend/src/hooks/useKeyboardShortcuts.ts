import { useEffect, useCallback, useRef } from 'react';
import { EditorActions, EditorState } from '@/types/videoEditor';

interface UseKeyboardShortcutsOptions {
  state: EditorState;
  actions: EditorActions;
  enabled?: boolean;
  onDeleteClips?: (clipIds: string[]) => void;
  onSplitClip?: (clipId: string, time: number) => void;
  onTrimIn?: (clipId: string, time: number) => void;
  onTrimOut?: (clipId: string, time: number) => void;
}

const FRAME_STEP = 1 / 30; // 30 fps

export function useKeyboardShortcuts({
  state,
  actions,
  enabled = true,
  onDeleteClips,
  onSplitClip,
  onTrimIn,
  onTrimOut,
}: UseKeyboardShortcutsOptions) {
  const isTypingRef = useRef(false);
  const lastKeyPressRef = useRef<string | null>(null);

  // Check if user is typing in an input field
  const isTyping = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = (activeElement as HTMLElement).isContentEditable;

    return isInput || isContentEditable;
  }, []);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle shortcuts if disabled or user is typing
      if (!enabled || isTyping()) {
        isTypingRef.current = true;
        return;
      }

      isTypingRef.current = false;

      const { key, code, ctrlKey, metaKey, shiftKey } = event;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? metaKey : ctrlKey;

      // Prevent default browser behavior for our shortcuts
      const preventDefault = () => {
        event.preventDefault();
        event.stopPropagation();
      };

      // Space: Play/Pause
      if (key === ' ' && !cmdOrCtrl && !shiftKey) {
        preventDefault();
        actions.togglePlay();
        return;
      }

      // Delete/Backspace: Delete selected clips
      if ((key === 'Delete' || key === 'Backspace') && !cmdOrCtrl && !shiftKey) {
        if (state.selectedClipIds.length > 0) {
          preventDefault();
          onDeleteClips?.(state.selectedClipIds);
          return;
        }
      }

      // Cmd/Ctrl + Z: Undo
      if (key === 'z' && cmdOrCtrl && !shiftKey) {
        preventDefault();
        actions.undo();
        return;
      }

      // Cmd/Ctrl + Shift + Z: Redo
      if (key === 'z' && cmdOrCtrl && shiftKey) {
        preventDefault();
        actions.redo();
        return;
      }

      // Arrow keys: Frame scrub
      if (key.startsWith('Arrow')) {
        preventDefault();
        const currentTime = state.project.playheadTime;
        let newTime = currentTime;

        if (key === 'ArrowLeft') {
          // Left: Go back one frame
          newTime = Math.max(0, currentTime - FRAME_STEP);
          if (shiftKey) {
            // Shift + Left: Go back 1 second
            newTime = Math.max(0, currentTime - 1);
          }
        } else if (key === 'ArrowRight') {
          // Right: Go forward one frame
          newTime = Math.min(state.project.totalDuration, currentTime + FRAME_STEP);
          if (shiftKey) {
            // Shift + Right: Go forward 1 second
            newTime = Math.min(state.project.totalDuration, currentTime + 1);
          }
        } else if (key === 'ArrowUp') {
          // Up: Go to previous clip
          const allClips = state.project.timeline.flatMap((track) => track.clips);
          const clipsBefore = allClips
            .filter((clip) => clip.startTime + clip.duration < currentTime)
            .sort((a, b) => (b.startTime + b.duration) - (a.startTime + a.duration));
          
          if (clipsBefore.length > 0) {
            const prevClip = clipsBefore[0];
            newTime = prevClip.startTime;
          }
        } else if (key === 'ArrowDown') {
          // Down: Go to next clip
          const allClips = state.project.timeline.flatMap((track) => track.clips);
          const clipsAfter = allClips
            .filter((clip) => clip.startTime > currentTime)
            .sort((a, b) => a.startTime - b.startTime);
          
          if (clipsAfter.length > 0) {
            const nextClip = clipsAfter[0];
            newTime = nextClip.startTime;
          }
        }

        actions.setPlayheadTime(newTime);
        return;
      }

      // S: Split clip at playhead
      if (key === 's' && !cmdOrCtrl && !shiftKey) {
        if (state.selectedClipIds.length === 1) {
          preventDefault();
          const clipId = state.selectedClipIds[0];
          onSplitClip?.(clipId, state.project.playheadTime);
          return;
        }
      }

      // A: Select all clips
      if (key === 'a' && cmdOrCtrl && !shiftKey) {
        preventDefault();
        actions.selectAllClips();
        return;
      }

      // Escape: Clear selection
      if (key === 'Escape') {
        preventDefault();
        actions.clearSelection();
        return;
      }

      // [ : Trim in at playhead (set clip start to playhead)
      if (key === '[' && !cmdOrCtrl && !shiftKey) {
        if (state.selectedClipIds.length === 1) {
          const clipId = state.selectedClipIds[0];
          const allClips = state.project.timeline.flatMap((track) => track.clips);
          const clip = allClips.find((c) => c.id === clipId);
          if (clip && state.project.playheadTime >= clip.startTime && 
              state.project.playheadTime <= clip.startTime + clip.duration) {
            preventDefault();
            onTrimIn?.(clipId, state.project.playheadTime);
            return;
          }
        }
      }

      // ] : Trim out at playhead (set clip end to playhead)
      if (key === ']' && !cmdOrCtrl && !shiftKey) {
        if (state.selectedClipIds.length === 1) {
          const clipId = state.selectedClipIds[0];
          const allClips = state.project.timeline.flatMap((track) => track.clips);
          const clip = allClips.find((c) => c.id === clipId);
          if (clip && state.project.playheadTime >= clip.startTime && 
              state.project.playheadTime <= clip.startTime + clip.duration) {
            preventDefault();
            onTrimOut?.(clipId, state.project.playheadTime);
            return;
          }
        }
      }
    },
    [
      enabled,
      state,
      actions,
      onDeleteClips,
      onSplitClip,
      onTrimIn,
      onTrimOut,
      isTyping,
    ]
  );

  // Handle key up to reset typing state
  const handleKeyUp = useCallback(() => {
    // Small delay to allow for rapid typing
    setTimeout(() => {
      if (!isTyping()) {
        isTypingRef.current = false;
      }
    }, 100);
  }, [isTyping]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Update typing state when focus changes
  useEffect(() => {
    const handleFocusChange = () => {
      isTypingRef.current = isTyping();
    };

    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);

    return () => {
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
    };
  }, [isTyping]);
}

