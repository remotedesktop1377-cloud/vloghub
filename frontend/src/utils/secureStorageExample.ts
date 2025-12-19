import { secure, SecureStorageHelpers } from './helperFunctions';

/**
 * Example usage of the new @secure.j.approvedScript interface
 * 
 * This replaces the old secureLocalStorage.getItem(LOCAL_STORAGE_KEYS.APPROVED_SCRIPT) pattern
 * with the new @secure.j.approvedScript.get() pattern
 * 
 * Note: The Google Image Search now uses a single API call with combined suggestions
 * instead of multiple parallel API calls for better efficiency.
 */

// Example 1: Using the direct secure.j interface
export const loadApprovedScriptDirect = () => {
  try {
    // Load approved script from secure storage
    const scriptData = secure.j.approvedScript.get();
    
    if (scriptData) {
      console.log('✅ Approved script loaded successfully:', scriptData);
      return scriptData;
    } else {
      console.log('ℹ️ No approved script found in secure storage');
      return null;
    }
  } catch (error) {
    console.log('❌ Error loading approved script:', error);
    return null;
  }
};

// Example 2: Using the helper functions (recommended)
export const loadApprovedScriptHelper = () => {
  try {
    const scriptData = SecureStorageHelpers.getApprovedScript();
    
    if (scriptData) {
      console.log('✅ Approved script loaded successfully:', scriptData);
      return scriptData;
    } else {
      console.log('ℹ️ No approved script found in secure storage');
      return null;
    }
  } catch (error) {
    console.log('❌ Error loading approved script:', error);
    return null;
  }
};

// Example 3: Saving approved script
export const saveApprovedScript = (scriptData: any) => {
  try {
    // Using direct interface
    secure.j.approvedScript.set(scriptData);
    
    // Or using helper function
    // SecureStorageHelpers.setApprovedScript(scriptData);
    
    console.log('✅ Approved script saved successfully');
    return true;
  } catch (error) {
    console.log('❌ Error saving approved script:', error);
    return false;
  }
};

// Example 4: Removing approved script
export const removeApprovedScript = () => {
  try {
    // Using direct interface
    secure.j.approvedScript.remove();
    
    // Or using helper function
    // SecureStorageHelpers.removeApprovedScript();
    
    console.log('✅ Approved script removed successfully');
    return true;
  } catch (error) {
    console.log('❌ Error removing approved script:', error);
    return false;
  }
};

// Example 5: Working with script metadata
export const manageScriptMetadata = () => {
  try {
    // Save metadata
    const metadata = {
      topic: 'AI and Machine Learning',
      duration: '5 minutes',
      language: 'English',
      createdAt: new Date().toISOString()
    };
    
    secure.j.scriptMetadata.set(metadata);
    console.log('✅ Script metadata saved');
    
    // Load metadata
    const loadedMetadata = secure.j.scriptMetadata.get();
    console.log('📋 Loaded metadata:', loadedMetadata);
    
    return loadedMetadata;
  } catch (error) {
    console.log('❌ Error managing script metadata:', error);
    return null;
  }
};

// Example 6: Dynamic key access
export const accessDynamicKey = (key: string) => {
  try {
    // You can access any key dynamically
    const value = secure.j[key].get();
    console.log(`📦 Value for key "${key}":`, value);
    return value;
  } catch (error) {
    console.log(`❌ Error accessing key "${key}":`, error);
    return null;
  }
};

// Example 7: Batch operations
export const batchOperations = () => {
  try {
    // Set multiple values
    secure.j.userPreferences.set({ theme: 'dark', language: 'en' });
    secure.j.lastVisit.set(new Date().toISOString());
    secure.j.settings.set({ notifications: true, autoSave: true });
    
    console.log('✅ Batch operations completed');
    
    // Get all values
    const preferences = secure.j.userPreferences.get();
    const lastVisit = secure.j.lastVisit.get();
    const settings = secure.j.settings.get();
    
    console.log('📊 All values loaded:', { preferences, lastVisit, settings });
    
    return { preferences, lastVisit, settings };
  } catch (error) {
    console.log('❌ Error in batch operations:', error);
    return null;
  }
};
