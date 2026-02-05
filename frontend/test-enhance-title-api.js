/**
 * Test script for enhance-title-for-thumbnail API
 * Tests both text enhancement and image generation
 */

const API_URL = 'http://localhost:3000/api/enhance-title-for-thumbnail';

// Test 1: Single title (text enhancement only)
async function testSingleTitle() {
  console.log('\n=== Test 1: Single Title (Text Enhancement Only) ===');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'A beautiful sunset over mountains'
      }),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success && data.enhancedText) {
      console.log('✅ Test 1 PASSED: Text enhancement working');
      return { success: true, enhancedText: data.enhancedText };
    } else {
      console.log('❌ Test 1 FAILED:', data.error || 'Unknown error');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('❌ Test 1 ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Scenes array (text + image generation)
async function testScenesArray() {
  console.log('\n=== Test 2: Scenes Array (Text + Image Generation) ===');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenes: [
          {
            id: 'scene-1',
            narration: 'A peaceful lake at dawn'
          }
        ]
      }),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify({
      ...data,
      scenes: data.scenes?.map(s => ({
        ...s,
        thumbnail: s.thumbnail ? `${s.thumbnail.substring(0, 50)}...` : null
      }))
    }, null, 2));
    
    if (response.ok && data.success && data.scenes && data.scenes.length > 0) {
      const scene = data.scenes[0];
      if (scene.success && scene.enhancedText && scene.thumbnail) {
        console.log('✅ Test 2 PASSED: Text enhancement + Image generation working');
        console.log('   Enhanced text length:', scene.enhancedText.length);
        console.log('   Thumbnail data URL length:', scene.thumbnail.length);
        return { success: true, scene };
      } else {
        console.log('❌ Test 2 FAILED: Scene processing failed:', scene.error);
        return { success: false, error: scene.error };
      }
    } else {
      console.log('❌ Test 2 FAILED:', data.error || 'Unknown error');
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log('❌ Test 2 ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 3: Invalid input
async function testInvalidInput() {
  console.log('\n=== Test 3: Invalid Input ===');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 400 && data.error) {
      console.log('✅ Test 3 PASSED: Invalid input handled correctly');
      return { success: true };
    } else {
      console.log('❌ Test 3 FAILED: Should return 400 for invalid input');
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Test 3 ERROR:', error.message);
    return { success: false, error: error.message };
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API Tests for enhance-title-for-thumbnail');
  console.log('API URL:', API_URL);
  console.log('================================================\n');

  const results = {
    test1: await testSingleTitle(),
    test2: await testScenesArray(),
    test3: await testInvalidInput(),
  };

  console.log('\n================================================');
  console.log('📊 Test Results Summary:');
  console.log('================================================');
  console.log('Test 1 (Single Title):', results.test1.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Test 2 (Scenes Array):', results.test2.success ? '✅ PASSED' : '❌ FAILED');
  console.log('Test 3 (Invalid Input):', results.test3.success ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = results.test1.success && results.test2.success && results.test3.success;
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return results;
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testSingleTitle, testScenesArray, testInvalidInput };

