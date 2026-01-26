You are a senior video-editing systems engineer and frontend architect.

I have an existing video editor UI with:
- A single video track
- A basic timeline with second-level precision
- One combined video+audio clip
- Basic playhead and playback
- No multi-layer support
- No canvas transforms
- No media library
- No clip thumbnails
- No waveform rendering
- No split/cut tool

Your task is NOT to code immediately.

Your task is to:
1. Analyze the CURRENT editor architecture
2. Design a step-by-step PLAN to evolve it into a production-grade editor like the reference screenshot
3. Propose a clean internal data model
4. Propose UI/UX changes incrementally
5. Identify rendering + performance considerations
6. Keep everything compatible with an already-live app

---

## 🎬 TARGET FEATURES (REFERENCE BEHAVIOR)

The target editor must support:

### Canvas / Preview
- Transformable video canvas
- Bounding box with resize handles
- Rotation handle
- Aspect ratio / safe-area guides
- Object-level selection (clip vs track)

### Timeline
- Multi-track timeline (video, overlays, text, audio)
- Frame-accurate timeline (milliseconds)
- Zoomable timeline scale
- Clip thumbnails rendered inside timeline
- Playhead snapping
- Ripple trim behavior

### Clips & Tracks
- Multiple clips per track
- Independent audio tracks
- Waveform rendering
- Clip trimming handles
- Split (scissors) tool at playhead
- Track-level controls (lock, mute, hide)

### Media & Assets
- Media library panel (left sidebar)
- Drag-and-drop assets into timeline
- Asset reuse across tracks
- Thumbnail preview in library

### Editing Tools
- Split / Cut tool
- Select tool
- Move tool
- Transform tool (canvas-based)
- Undo / redo with history stack

---

## 🧠 PLANNING REQUIREMENTS

### 1️⃣ Architecture Plan
Explain:
- How to refactor from single-track → multi-track
- How to separate:
  - Timeline state
  - Canvas state
  - Playback state
- How to keep backward compatibility

### 2️⃣ Data Models (VERY IMPORTANT)
Design clean models for:
- Project
- Track
- Clip
- Asset
- Timeline state
- Transform state

Example expectation (conceptual, not final code):
- Project → Tracks[] → Clips[]
- Clip references Asset
- Clip has timeIn, timeOut, start, duration
- Track has type (video/audio/text/overlay)

### 3️⃣ Timeline Engine
Plan:
- Timeline zoom levels
- Pixel-to-time mapping
- Playhead snapping logic
- Trimming + splitting logic
- Multi-clip collision handling

### 4️⃣ Canvas Engine
Plan:
- Selection model
- Transform controls
- Rotation math
- Aspect-ratio locking
- Safe-area guides

### 5️⃣ Audio Handling
Plan:
- Separate audio tracks
- Waveform generation strategy
- Sync with playhead
- Mute / solo logic

### 6️⃣ Rendering Strategy
Explain:
- How preview rendering differs from export rendering
- How to avoid UI lag
- When to use cached frames
- Timeline virtualization for performance

### 7️⃣ Incremental Rollout Plan
Break everything into PHASES:
- Phase 1: Structural refactor
- Phase 2: Multi-track timeline
- Phase 3: Canvas transforms
- Phase 4: Editing tools
- Phase 5: Polish & performance

Each phase must include:
- What changes
- What stays untouched
- What risks exist

---

## ⚠️ CONSTRAINTS
- Do NOT suggest rewriting the entire app
- Do NOT remove existing functionality
- Assume real users already exist
- Assume real projects already saved
- Prioritize stability over features

---

## OUTPUT FORMAT
Return:
1. High-level transformation summary
2. Detailed phase-by-phase plan
3. Data model diagrams (textual)
4. Timeline engine explanation
5. Canvas engine explanation
6. Final checklist comparing:
   - Current editor
   - Target editor

Think like you are designing the foundation of CapCut / Clipchamp, not a demo.
