# Phase 5: Preview System & Playback Sync - Verification Guide

This guide helps you manually verify all Phase 5 features from the frontend.

## Prerequisites

1. Ensure the backend is running and you have a project with a narrator video
2. Navigate to the Final Step (Script Production) page
3. Ensure you have a project with `narrator_chroma_key_link` set (a video URL)

## Feature Verification Checklist

### 1. Enhanced HTML5 Video Player with Full Controls ✅

**Location**: Video Editor → Preview Area (center panel)

**Steps to Verify**:
1. Open the video editor by clicking the "Edit" button in Final Step
2. Look at the center preview area
3. **Verify**: You should see:
   - Video player displaying the narrator video
   - Controls bar at the bottom (should appear when hovering over video)
   - Controls include:
     - Seek bar (horizontal slider at top of controls)
     - Time display (current time / total duration)
     - Volume control (volume slider with mute/unmute button)
     - Fullscreen button

**Expected Behavior**:
- Controls appear when you hover over the preview area
- Controls auto-hide after 3 seconds of inactivity (when not hovering)
- Controls remain visible while dragging the seek bar

### 2. Sync Playhead with Video Playback ✅

**Location**: Timeline (bottom panel) and Top Bar (time display)

**Steps to Verify**:
1. Click the Play button in the Top Bar (or use Space key if implemented)
2. Watch the playhead (red vertical line) in the timeline
3. **Verify**:
   - Playhead moves smoothly from left to right as video plays
   - Time display in Top Bar updates in real-time
   - Time display matches the playhead position

**Expected Behavior**:
- Playhead updates smoothly (at least every 100ms)
- Time display shows format: `MM:SS.MS / MM:SS.MS`
- Playhead position matches video playback time

### 3. Sync Video Playback with Playhead ✅

**Location**: Preview Area

**Steps to Verify**:
1. Click on the timeline ruler (click anywhere on the time ruler above tracks)
2. **Verify**:
   - Video jumps to the clicked position
   - Playhead moves to the clicked position
   - Video frame updates to match the new position

**Expected Behavior**:
- Clicking the timeline ruler seeks the video instantly
- Video frame shows the correct frame for that time position
- Playhead and video are always in sync

### 4. Scrubbing (Click Timeline to Seek Video) ✅

**Location**: Timeline Ruler

**Steps to Verify**:
1. Click anywhere on the timeline ruler (the bar with time markers above the tracks)
2. **Verify**:
   - Video seeks to that position
   - Playhead moves to clicked position
   - Preview shows the frame at that time

**Expected Behavior**:
- Click anywhere on the ruler → video seeks to that time
- Smooth seeking (no lag)
- Video frame matches the seeked time

**Additional Scrubbing**:
- Try dragging the seek bar in the preview controls
- Verify video seeks smoothly while dragging
- Release should update playhead and video position

### 5. Fullscreen Preview Mode ✅

**Location**: Preview Area → Controls Bar → Fullscreen Button

**Steps to Verify**:
1. Hover over the preview area to show controls
2. Click the fullscreen icon (bottom right of controls)
3. **Verify**:
   - Preview area enters fullscreen mode
   - Fullscreen icon changes to "exit fullscreen"
   - Video continues playing if it was playing
   - Click exit fullscreen (or press Esc) to exit

**Expected Behavior**:
- Fullscreen button toggles fullscreen mode
- Video maintains aspect ratio in fullscreen
- All controls work in fullscreen mode
- Exit fullscreen returns to normal editor view

### 6. Volume Control ✅

**Location**: Preview Area → Controls Bar → Volume Control

**Steps to Verify**:
1. Hover over preview area to show controls
2. Locate the volume control (speaker icon + slider)
3. **Verify**:
   - Drag volume slider → video volume changes
   - Click mute button (speaker icon) → video mutes/unmutes
   - Volume slider shows muted state (set to 0 when muted)

**Expected Behavior**:
- Volume slider ranges from 0 to 100%
- Mute button toggles between muted and unmuted
- Volume changes are immediate
- Volume persists while video plays

### 7. Seek Bar in Preview Controls ✅

**Location**: Preview Area → Controls Bar → Seek Bar

**Steps to Verify**:
1. Hover over preview area to show controls
2. Locate the horizontal seek bar at the top of controls
3. **Verify**:
   - Drag the seek bar thumb → video seeks
   - Release → video position and playhead update
   - Seek bar shows current position and total duration

**Expected Behavior**:
- Seek bar represents video timeline (0 to total duration)
- Dragging seeks video smoothly
- Release updates both video and timeline playhead
- Seek bar position matches video current time

### 8. Playhead Synchronization ✅

**Location**: Timeline (bottom) and Preview Area

**Steps to Verify**:
1. Play the video
2. Watch both the timeline playhead and video simultaneously
3. **Verify**:
   - Timeline playhead (red line) moves as video plays
   - Playhead position matches video current time
   - Top bar time display matches both

**Expected Behavior**:
- Playhead updates smoothly during playback
- All time displays are synchronized (Top Bar, Preview Controls, Timeline)
- No lag or desynchronization

### 9. Pause/Play Synchronization ✅

**Location**: Top Bar → Play/Pause Button

**Steps to Verify**:
1. Click Play button in Top Bar
2. **Verify**:
   - Video starts playing
   - Playhead moves
   - Button changes to Pause icon
3. Click Pause button
4. **Verify**:
   - Video pauses
   - Playhead stops moving
   - Button changes to Play icon

**Expected Behavior**:
- Play/Pause button controls video playback
- Button icon reflects current state
- Video and playhead sync when paused/played

### 10. Time Display Format ✅

**Location**: Top Bar and Preview Controls

**Steps to Verify**:
1. Check time display in Top Bar: `MM:SS.MS / MM:SS.MS`
2. Check time display in Preview Controls: `MM:SS / MM:SS`
3. **Verify**:
   - Format is correct (minutes:seconds)
   - Current time updates during playback
   - Total duration is correct

**Expected Behavior**:
- Time format: `M:SS` or `MM:SS`
- Time updates smoothly
- Both displays show consistent times

## Edge Cases to Test

### 1. Video Loading States
- **Test**: Open editor with invalid/non-existent video URL
- **Verify**: Error message displays, controls show "Video not available"

### 2. Video End Behavior
- **Test**: Let video play to end
- **Verify**: Video stops, playhead reaches end, playback stops

### 3. Rapid Scrubbing
- **Test**: Rapidly click different positions on timeline
- **Verify**: Video seeks smoothly without errors

### 4. Fullscreen During Playback
- **Test**: Enter fullscreen while video is playing
- **Verify**: Video continues playing, controls work

### 5. Volume Changes During Playback
- **Test**: Change volume while video is playing
- **Verify**: Volume changes immediately, no audio glitches

## Common Issues & Troubleshooting

### Issue: Controls Don't Appear
- **Check**: Hover over the preview area (not just the video)
- **Solution**: Controls auto-hide after 3 seconds; hover to show

### Issue: Video Doesn't Seek
- **Check**: Ensure video has loaded (metadata loaded)
- **Check**: Check browser console for errors
- **Solution**: Reload the page and try again

### Issue: Playhead Not Moving
- **Check**: Is video actually playing? (check video element state)
- **Check**: Check browser console for errors
- **Solution**: Click Play button to ensure playback state is correct

### Issue: Fullscreen Not Working
- **Check**: Browser permissions for fullscreen
- **Check**: Ensure you clicked the fullscreen button (not browser fullscreen)
- **Solution**: Try using browser's native fullscreen (F11) as fallback

### Issue: Audio Not Playing
- **Check**: Volume slider position
- **Check**: Mute button state
- **Check**: Browser audio permissions
- **Solution**: Unmute and set volume above 0

## Performance Checks

### Smooth Playback
- **Verify**: Video plays at consistent frame rate (no stuttering)
- **Verify**: Playhead updates smoothly (no jumps)

### Responsive Controls
- **Verify**: Controls appear/disappear smoothly
- **Verify**: Seek bar responds immediately to drag
- **Verify**: Volume changes are instant

### Memory Usage
- **Verify**: No memory leaks after extended use
- **Verify**: Video element properly cleaned up on close

## Success Criteria

✅ All controls visible and functional  
✅ Playhead syncs with video playback  
✅ Scrubbing works smoothly  
✅ Fullscreen mode works  
✅ Volume control works  
✅ Time displays are accurate  
✅ No console errors  
✅ Video loads and plays correctly  

## Notes

- The compositor utility (`previewCompositor.ts`) is created but full multi-source compositing will be implemented in later phases
- Currently, only the narrator video is displayed in preview
- Audio mixing for multiple sources will be enhanced in future phases
- Canvas-based compositing for overlays/backgrounds is prepared but not yet implemented

