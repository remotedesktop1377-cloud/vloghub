# Professional Video Preview Compositor Plan

## Goal
Create a CapCut-style professional video compositor that composites all timeline elements (videos, images, text) into a single real-time preview.

## Architecture

### Layer System (Bottom to Top):
1. **Base Video Layer** - First video track or narrator video (background)
2. **Video Overlay Layers** - Additional video clips from video tracks
3. **Image Overlay Layers** - Image clips from overlay tracks
4. **Text Overlay Layer** - Text clips from overlay tracks (always on top)

### Key Features:
- Real-time compositing of all active clips at playhead time
- Video synchronization across multiple video sources
- Image overlays with positioning and opacity
- Text overlays with animations
- Professional layering (z-index based on track order)
- Smooth playback and seeking

### Implementation Approach:

#### Phase 1: Video Clip Management
- Create refs for all active video clips
- Sync all videos to playhead time
- Handle play/pause for all videos
- Support video clips from timeline (not just narrator)

#### Phase 2: Image Overlay System
- Render image clips as positioned overlays
- Handle opacity and fade effects
- Support positioning (x, y percentages)

#### Phase 3: Compositing & Layering
- Use CSS z-index for proper layering
- Order: Base video → Video overlays → Image overlays → Text overlays
- Handle track order (earlier tracks = lower layers)

#### Phase 4: Synchronization
- Sync all videos to same playhead time
- Handle play/pause across all sources
- Smooth seeking for all elements

## Technical Details

### Active Clips Detection:
- Use `getActiveClipsAtTime()` to find all clips active at current time
- Filter by clip start/end time and trim in/out

### Video Management:
- Map of clip ID → video element ref
- Create/destroy video elements as clips become active/inactive
- Sync all videos to playhead time on seek

### Image Management:
- Map of clip ID → image element ref
- Position using CSS absolute positioning
- Apply opacity based on clip properties and fade effects

### Performance:
- Only render active clips (lazy load)
- Use React keys properly for efficient updates
- Debounce frequent updates if needed

## User Experience Goals:
1. Professional look like CapCut
2. Smooth real-time preview
3. All elements visible simultaneously
4. Easy to understand layering
5. No lag or stuttering

