/**
 * Load videos from src/assets/background/videos
 * Add .mp4, .webm files to this folder - they will appear in the Videos tab.
 */
// Avoid bundling binary video files into the server bundle.
// Place background videos in `public/background/videos` and reference them
// via their public URL (e.g. `/background/videos/bg_1.mp4`).
// This keeps the build fast and prevents webpack from trying to parse binaries.

const assetVideos: { id: string; src: string; name: string }[] = [
  // Example entry. Move your local files to `public/background/videos/`
  // and add entries here or generate this list from server-side code.
  { id: 'bg_1', src: '/background/videos/bg_1.mp4', name: 'bg 1' },
];

export { assetVideos };
