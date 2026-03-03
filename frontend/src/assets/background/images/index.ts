/**
 * Load images from src/assets/background/images
 * Add .png, .jpg, .jpeg, .gif, .webp files to this folder - they will appear in the Images tab.
 */
let assetImages: { id: string; src: string; name: string }[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const req = require.context('.', false, /\.(png|jpg|jpeg|gif|webp)$/);
  assetImages = req.keys().map((key: string) => ({
    id: key.replace('./', '').replace(/\.[^.]+$/, ''),
    src: (req(key) as { default?: string })?.default ?? (req(key) as string),
    name: key.replace('./', '').replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
  }));
} catch {
  assetImages = [];
}
export { assetImages };
