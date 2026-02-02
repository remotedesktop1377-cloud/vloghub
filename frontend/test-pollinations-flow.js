/**
 * Test script for Pollinations flow
 * Tests both text enhancement and image generation separately
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test configuration
const CONFIG = {
  timeout: 120000, // 120 seconds default
  shortPrompt: true, // Use shorter prompts for testing
  retries: 3, // Number of retries for failed requests
  retryDelay: 2000, // Delay between retries (ms)
};

// Helper function to make requests with timeout and retries
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.timeout, retries = CONFIG.retries) {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      console.log(`  Retry attempt ${attempt}/${retries} after ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // If we get a 502, 503, or 504, retry
      if (response.status >= 502 && response.status <= 504 && attempt < retries) {
        console.log(`  Got ${response.status}, will retry...`);
        lastError = new Error(`Pollinations API returned status ${response.status}`);
        continue;
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms`);
      } else {
        lastError = error;
      }
      
      // Retry on network errors
      if (attempt < retries) {
        continue;
      }
    }
  }
  
  throw lastError;
}

// Test 1: Direct Pollinations Text API
async function testPollinationsTextAPI() {
  console.log('\n=== Test 1: Direct Pollinations Text API ===');
  
  // Use very short prompt for testing
  const testPrompt = CONFIG.shortPrompt 
    ? 'sunset mountains'
    : 'You are a professional prompt engineer for generative AI images. Given a user\'s base idea, elaborate and enhance the prompt by preserving the original subject and context, adding vivid artistic details, improving clarity, storytelling, and immersion, including realistic textures, dynamic lighting, depth, and color harmony, specifying atmosphere and composition style, and ensuring final output is suitable for 8K ultra-high-resolution rendering. Output only the enhanced prompt as plain text.\n\nIdea:\nA beautiful sunset over mountains';

  const encodedPrompt = encodeURIComponent(testPrompt);
  const textUrl = `https://text.pollinations.ai/${encodedPrompt}`;

  console.log('Testing URL:', textUrl.substring(0, 100) + '...');
  console.log('Prompt length:', testPrompt.length);
  console.log('Prompt:', testPrompt);

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(textUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain, application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    }, 60000); // 60 second timeout for text

    const elapsed = Date.now() - startTime;
    console.log(`Response status: ${response.status}`);
    console.log(`Time taken: ${elapsed}ms`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText.substring(0, 200));
      throw new Error(`Pollinations text API returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let text;
    
    if (contentType.includes('application/json')) {
      const json = await response.json();
      console.log('JSON response:', JSON.stringify(json, null, 2));
      text = json.text || json.prompt || JSON.stringify(json);
    } else {
      text = await response.text();
    }
    
    console.log('Response length:', text.length);
    console.log('Enhanced text (first 200 chars):', text.substring(0, 200));
    
    return { success: true, text: text.trim(), elapsed };
  } catch (error) {
    console.error('Error:', error.message);
    console.log('⚠️  Text API may be down or unavailable. Image generation can still work with original prompts.');
    return { success: false, error: error.message };
  }
}

// Test 2: Direct Pollinations Image API
async function testPollinationsImageAPI(enhancedPrompt) {
  console.log('\n=== Test 2: Direct Pollinations Image API ===');
  
  // Use very short prompt for testing
  const testPrompt = enhancedPrompt || (CONFIG.shortPrompt 
    ? 'sunset mountains cinematic 8K'
    : 'A beautiful sunset over mountains, cinematic, high quality, 8K, detailed, professional photography');

  const imageEncodedPrompt = encodeURIComponent(testPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${imageEncodedPrompt}`;

  // Use smaller dimensions for testing to avoid timeouts
  const params = new URLSearchParams({
    model: 'flux',
    width: '512',
    height: '512',
    nologo: 'true',
  });

  const fullImageUrl = `${imageUrl}?${params.toString()}`;

  console.log('Testing URL:', fullImageUrl.substring(0, 100) + '...');
  console.log('Prompt length:', testPrompt.length);
  console.log('Prompt:', testPrompt);

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(fullImageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0',
      },
    }, 180000); // 180 second timeout for image generation

    const elapsed = Date.now() - startTime;
    console.log(`Response status: ${response.status}`);
    console.log(`Time taken: ${elapsed}ms`);

    if (!response.ok) {
      throw new Error(`Pollinations image API returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    const imageBuffer = await response.arrayBuffer();
    console.log('Image size:', imageBuffer.byteLength, 'bytes');
    
    return { success: true, imageBuffer, contentType, elapsed };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Single Title Endpoint
async function testSingleTitleEndpoint() {
  console.log('\n=== Test 3: Single Title Endpoint ===');
  
  const testTitle = CONFIG.shortPrompt 
    ? 'sunset'
    : 'A beautiful sunset over mountains with vibrant colors';

  console.log('Testing with title:', testTitle);

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(`${BASE_URL}/api/enhance-title-for-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: testTitle }),
    }, 60000); // 60 second timeout

    const elapsed = Date.now() - startTime;
    console.log(`Response status: ${response.status}`);
    console.log(`Time taken: ${elapsed}ms`);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success && data.enhancedText) {
      console.log('✓ Single title endpoint working');
      return { success: true, data, elapsed };
    } else {
      console.log('✗ Single title endpoint failed');
      return { success: false, data, elapsed };
    }
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 4: Scenes Endpoint
async function testScenesEndpoint() {
  console.log('\n=== Test 4: Scenes Endpoint ===');
  
  const testScenes = [
    {
      id: 'scene-1',
      narration: CONFIG.shortPrompt ? 'sunset' : 'A beautiful sunset over mountains',
    },
    {
      id: 'scene-2',
      title: CONFIG.shortPrompt ? 'ocean' : 'Ocean waves crashing on the beach',
    },
  ];

  console.log('Testing with scenes:', testScenes.length);
  testScenes.forEach((scene, idx) => {
    console.log(`  Scene ${idx + 1}: ${scene.narration || scene.title}`);
  });

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(`${BASE_URL}/api/enhance-title-for-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenes: testScenes }),
    }, 300000); // 300 second timeout for multiple scenes

    const elapsed = Date.now() - startTime;
    console.log(`Response status: ${response.status}`);
    console.log(`Time taken: ${elapsed}ms`);

    const data = await response.json();
    console.log('Response structure:', {
      success: data.success,
      scenesCount: data.scenes?.length || 0,
    });

    if (data.scenes) {
      data.scenes.forEach((scene, idx) => {
        console.log(`\nScene ${idx + 1} (${scene.sceneId}):`);
        console.log(`  Success: ${scene.success}`);
        if (scene.success) {
          console.log(`  Has imageUrl: ${!!scene.imageUrl}`);
          console.log(`  Has thumbnail: ${!!scene.thumbnail}`);
          console.log(`  Enhanced text length: ${scene.enhancedText?.length || 0}`);
        } else {
          console.log(`  Error: ${scene.error}`);
        }
      });
    }

    const allSuccess = data.scenes?.every(s => s.success) || false;
    if (data.success && allSuccess) {
      console.log('✓ Scenes endpoint working');
      return { success: true, data, elapsed };
    } else {
      console.log('✗ Scenes endpoint failed');
      return { success: false, data, elapsed };
    }
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('Pollinations Flow Test Script');
  console.log('========================================');
  console.log('Configuration:');
  console.log(`  Timeout: ${CONFIG.timeout}ms`);
  console.log(`  Short prompts: ${CONFIG.shortPrompt}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log('========================================');

  const results = {
    textAPI: null,
    imageAPI: null,
    singleTitle: null,
    scenes: null,
  };

  // Test 1: Text API
  results.textAPI = await testPollinationsTextAPI();
  
  // Test 2: Image API (use enhanced text from test 1 if available, otherwise use simple prompt)
  const enhancedPrompt = results.textAPI.success ? results.textAPI.text : null;
  console.log('\n⚠️  Note: Testing image API with', enhancedPrompt ? 'enhanced prompt' : 'simple fallback prompt');
  results.imageAPI = await testPollinationsImageAPI(enhancedPrompt);

  // Test 3: Single Title Endpoint
  results.singleTitle = await testSingleTitleEndpoint();

  // Test 4: Scenes Endpoint
  results.scenes = await testScenesEndpoint();

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Text API: ${results.textAPI.success ? '✓ PASS' : '⚠️  FAIL (may be optional)'}`);
  if (results.textAPI.success) {
    console.log(`  Time: ${results.textAPI.elapsed}ms`);
  } else {
    console.log(`  Error: ${results.textAPI.error}`);
    console.log(`  Note: Image generation can work without text enhancement`);
  }

  console.log(`Image API: ${results.imageAPI.success ? '✓ PASS' : '✗ FAIL'}`);
  if (results.imageAPI.success) {
    console.log(`  Time: ${results.imageAPI.elapsed}ms`);
    console.log(`  Size: ${results.imageAPI.imageBuffer?.byteLength || 0} bytes`);
  } else {
    console.log(`  Error: ${results.imageAPI.error}`);
  }

  console.log(`Single Title: ${results.singleTitle.success ? '✓ PASS' : '✗ FAIL'}`);
  if (results.singleTitle.success) {
    console.log(`  Time: ${results.singleTitle.elapsed}ms`);
  } else {
    console.log(`  Error: ${results.singleTitle.error || 'Check response'}`);
  }

  console.log(`Scenes: ${results.scenes.success ? '✓ PASS' : '✗ FAIL'}`);
  if (results.scenes.success) {
    console.log(`  Time: ${results.scenes.elapsed}ms`);
    const successCount = results.scenes.data?.scenes?.filter(s => s.success).length || 0;
    const totalCount = results.scenes.data?.scenes?.length || 0;
    console.log(`  Success: ${successCount}/${totalCount} scenes`);
  } else {
    console.log(`  Error: ${results.scenes.error || 'Check response'}`);
  }

  console.log('========================================\n');

  // Exit with appropriate code
  const allPassed = Object.values(results).every(r => r && r.success);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

