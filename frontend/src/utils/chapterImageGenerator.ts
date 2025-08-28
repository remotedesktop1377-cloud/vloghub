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

          // Build the enhanced image prompt using both visuals and narration
          const prompt = buildImagePrompt({
            title: "YouTube Video Chapter",
            chapterIdx: index,
            visual_guidance: chapter.visual_guidance || '',
            on_screen_text: chapter.on_screen_text || '',
            narration: chapter.narration // Include narration for context-aware prompt generation
          });

          // Generate 3 images and audio in parallel for testing
          const [image1Response, image2Response, image3Response, audioResponse] = await Promise.all([
            // Generate 3 different images with different seeds for variety
            !chapter.assets?.image ? fetch('/api/generate-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                width: 1920,
                height: 1080,
                seed: index * 3 + 1
              })
            }) : Promise.resolve(null),

            !chapter.assets?.image ? fetch('/api/generate-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                width: 1920,
                height: 1080,
                seed: index * 3 + 2
              })
            }) : Promise.resolve(null),

            !chapter.assets?.image ? fetch('/api/generate-images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt,
                width: 1920,
                height: 1080,
                seed: index * 3 + 3
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

          // Process image responses and collect all generated images
          const generatedImages: string[] = [];
          let primaryImageUrl = chapter.assets?.image || null;

          // Process first image (will be the primary one for the chapter)
          if (image1Response && image1Response.ok) {
            const imageData = await image1Response.json();
            if (imageData.imageUrl) {
              primaryImageUrl = imageData.imageUrl;
              generatedImages.push(imageData.imageUrl);
              console.log(`✅ Generated image 1 for chapter ${chapter.id}:`, 'Success');
            }
          } else if (image1Response && !image1Response.ok) {
            const errorText = await image1Response.text();
            console.error(`❌ Failed to generate image 1 for chapter ${chapter.id}:`, image1Response.status, errorText);
          }

          // Process second image
          if (image2Response && image2Response.ok) {
            const imageData = await image2Response.json();
            if (imageData.imageUrl) {
              generatedImages.push(imageData.imageUrl);
              console.log(`✅ Generated image 2 for chapter ${chapter.id}:`, 'Success');
            }
          } else if (image2Response && !image2Response.ok) {
            const errorText = await image2Response.text();
            console.error(`❌ Failed to generate image 2 for chapter ${chapter.id}:`, image2Response.status, errorText);
          }

          // Process third image
          if (image3Response && image3Response.ok) {
            const imageData = await image3Response.json();
            if (imageData.imageUrl) {
              generatedImages.push(imageData.imageUrl);
              console.log(`✅ Generated image 3 for chapter ${chapter.id}:`, 'Success');
            }
          } else if (image3Response && !image3Response.ok) {
            const errorText = await image3Response.text();
            console.error(`❌ Failed to generate image 3 for chapter ${chapter.id}:`, image3Response.status, errorText);
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

          // Create a simple user-friendly prompt from visual guidance and key narration elements
          const safeNarration = chapter.narration || '';
          const keyWords = safeNarration.split(' ').slice(0, 8).join(' '); // First 8 words for brevity
          const simplePrompt = `${chapter.visual_guidance || 'Visual guidance'} - ${keyWords}...`;

          return {
            ...chapter,
            assets: {
              ...chapter.assets,
              image: primaryImageUrl,
              audio: audioUrl,
              imagePrompt: simplePrompt
            },
            // Add additional generated images for testing (will be handled separately)
            additionalImages: generatedImages.slice(1) // Exclude the primary image
          };
        } catch (error) {
          console.error(`Error generating image for chapter ${chapter.id}:`, error);

          // Still create the simple prompt even if image generation failed
          const safeNarration = chapter.narration || '';
          const keyWords = safeNarration.split(' ').slice(0, 8).join(' '); // First 8 words for brevity
          const simplePrompt = `${chapter.visual_guidance || 'Visual guidance'} - ${keyWords}...`;

          return {
            ...chapter,
            assets: {
              ...chapter.assets,
              image: null,
              imagePrompt: simplePrompt
            },
            additionalImages: [] // No additional images if generation failed
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
