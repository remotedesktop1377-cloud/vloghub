// utils/chapterImageGenerator.ts
import { Chapter } from '@/types/chapters';
import { buildImagePrompt } from '@/utils/prompts/buildImagePrompt';

export async function generateChapterImages(chapters: Chapter[]): Promise<Chapter[]> {
  try {
    const updatedChapters = await Promise.all(
      chapters.map(async (chapter, index) => {
        try {
          // Skip if both image and audio already exist
          if (chapter.assets?.image && chapter.assets?.audio) {
            return chapter;
          }

          // Build the image prompt using visuals field
          const prompt = buildImagePrompt({
            title: "YouTube Video Chapter",
            chapterIdx: index,
            visual_guidance: chapter.visual_guidance,
            on_screen_text: chapter.on_screen_text
          });

          // Generate image and audio in parallel
          const [imageResponse, audioResponse] = await Promise.all([
            // Generate image
            !chapter.assets?.image ? fetch('/api/generate-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                width: 1920,
                height: 1080,
                seed: index + 1
              })
            }) : Promise.resolve(null),

            // Generate voice narration
            !chapter.assets?.audio ? (() => {
              console.log(`🎤 Generating voice for chapter ${chapter.id}:`, {
                text: chapter.narration?.substring(0, 50) + '...',
                voiceStyle: chapter.voiceover_style || 'conversational'
              });
              return fetch('/api/generate-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: chapter.narration,
                  voiceStyle: chapter.voiceover_style || 'conversational',
                })
              });
            })() : Promise.resolve(null)
          ]);

          // Process image response
          let imageUrl = chapter.assets?.image || null;
          if (imageResponse && imageResponse.ok) {
            const imageData = await imageResponse.json();
            imageUrl = imageData.imageUrl || null;
          } else if (imageResponse && !imageResponse.ok) {
            console.error(`Failed to generate image for chapter ${chapter.id}`);
          }

          // Process audio response
          let audioUrl = chapter.assets?.audio || null;
          if (audioResponse && audioResponse.ok) {
            const audioData = await audioResponse.json();
            audioUrl = audioData.audioUrl || null;
            console.log(`✅ Audio generated for chapter ${chapter.id}:`, audioUrl ? 'SUCCESS' : 'NO_URL');
          } else if (audioResponse && !audioResponse.ok) {
            const errorText = await audioResponse.text();
            console.error(`❌ Failed to generate audio for chapter ${chapter.id}:`, audioResponse.status, errorText);
          }

          // Create a simple user-friendly prompt from visual guidance
          const simplePrompt = `Create an image showing: ${chapter.visual_guidance}`;

          return {
            ...chapter,
            assets: {
              ...chapter.assets,
              image: imageUrl,
              audio: audioUrl,
              imagePrompt: simplePrompt
            }
          };
        } catch (error) {
          console.error(`Error generating image for chapter ${chapter.id}:`, error);

          // Still create the simple prompt even if image generation failed
          const simplePrompt = `Create an image showing: ${chapter.visual_guidance}`;

          return {
            ...chapter,
            assets: {
              ...chapter.assets,
              image: null,
            }
          };
        }
      })
    );

    return updatedChapters;
  } catch (error) {
    console.error('Error in generateChapterImages:', error);
    return chapters;
  }
}

export function hasAllImages(chapters: Chapter[]): boolean {
  return chapters.every(chapter => chapter.assets?.image);
}

export function getImageGenerationProgress(chapters: Chapter[]): { completed: number; total: number } {
  const completed = chapters.filter(chapter => chapter.assets?.image).length;
  return { completed, total: chapters.length };
}
