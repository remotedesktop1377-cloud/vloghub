# How Green Screen Gets Replaced by Stored Background

## Key Idea

The green screen is **not directly replaced**.

Instead:

1. The green color in the narrator video is turned into **transparent pixels**.
2. A background image or video is rendered **behind the narrator**.
3. The transparent pixels reveal the background.

This process is called **chroma key compositing**.

---

# Step-by-Step Process

## 1. Narrator Video Contains Green Screen

After processing with Replicate, the narrator video looks like this:

```
Person in front of a green background
```

Example:

```
[Person] + [Green background]
```

---

# 2. Renderer Detects Green Pixels

During rendering, the `ChromaKeyVideo` component processes each frame of the video.

For every pixel:

```
Compare pixel color to the green key color (#00FF00)
```

If the pixel is green:

```
alpha = 0
```

If the pixel is not green:

```
alpha = 1
```

Where:

```
alpha = transparency
```

---

# 3. Green Pixels Become Transparent

After processing:

```
Person remains visible
Green background becomes transparent
```

Visual result:

```
[Person] + [Transparent background]
```

---

# 4. Background Is Rendered Behind the Video

The editor already stores backgrounds selected from the **Storyboard Background tab**.

Example variable:

```
selectedBackgroundMedia
```

That background is rendered **first** in the scene.

Example:

```
Background layer
↓
Narrator video layer
```

---

# 5. Transparent Pixels Reveal the Background

Since the green pixels were converted to transparent pixels, the background behind the narrator becomes visible.

Final composition:

```
Stored background
↓
Narrator video (green removed)
↓
Captions
```

Visually:

```
Before:
Person + Green Screen

After:
Person + Selected Background
```

---

# Example Rendering Structure

The renderer should follow this structure:

```
<AbsoluteFill>

  Background Layer

  Narrator Video (ChromaKeyVideo)

  Captions

</AbsoluteFill>
```

---

# Example Implementation

```
<AbsoluteFill>

  <Img src={selectedBackgroundMedia.url} />

  <ChromaKeyVideo
    src={narratorVideo}
    chromaKeyConfig={chromaKeyConfig}
  />

</AbsoluteFill>
```

Rendering order is important.

Correct order:

```
1 Background
2 Narrator
3 Captions
```

---

# Final Result

The system works like this:

```
Green screen narrator video
↓
ChromaKeyVideo removes green pixels
↓
Pixels become transparent
↓
Background layer shows through
↓
Narrator appears in front of new background
```

This is how the green screen gets replaced with backgrounds stored in the storyboard.
