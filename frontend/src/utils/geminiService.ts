import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { AI_CONFIG } from '@/config/aiConfig';

/**
 * Initialize Google Generative AI client
 * @param apiKey - Optional API key, defaults to GEMINI_API_KEY from environment
 * @returns GoogleGenerativeAI instance
 */
export function getGeminiClient(apiKey?: string): GoogleGenerativeAI {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your environment variables.');
  }
  return new GoogleGenerativeAI(key);
}

/**
 * Get a configured Gemini model instance
 * @param options - Configuration options for the model
 * @param options.model - Model name (defaults to MODEL_PRO)
 * @param options.temperature - Temperature setting (defaults to AI_CONFIG.GEMINI.TEMPERATURE)
 * @param options.apiKey - Optional API key override
 * @returns Configured GenerativeModel instance
 */
export function getGeminiModel(options?: {
  model?: string;
  temperature?: number;
  apiKey?: string;
}): GenerativeModel {
  const {
    model = AI_CONFIG.GEMINI.MODEL_PRO,
    temperature = AI_CONFIG.GEMINI.TEMPERATURE,
    apiKey,
  } = options || {};

  const genAI = getGeminiClient(apiKey);
  
  return genAI.getGenerativeModel({
    model,
    generationConfig: { temperature },
  });
}


/**
 * Convenience function to get Gemini Active model with default settings
 */
export function getGeminiActiveModel(apiKey?: string): GenerativeModel {
    return getGeminiModel({
      model: AI_CONFIG.GEMINI.MODEL_FLASH,
      temperature: AI_CONFIG.GEMINI.TEMPERATURE,
      apiKey,
    });
  }

/**
 * Convenience function to get Gemini Pro model with default settings
 */
export function getGeminiProModel(apiKey?: string): GenerativeModel {
  return getGeminiModel({
    model: AI_CONFIG.GEMINI.MODEL_PRO,
    temperature: AI_CONFIG.GEMINI.TEMPERATURE,
    apiKey,
  });
}

/**
 * Convenience function to get Gemini Flash model with default settings
 */
export function getGeminiFlashModel(apiKey?: string): GenerativeModel {
  return getGeminiModel({
    model: AI_CONFIG.GEMINI.MODEL_FLASH,
    temperature: AI_CONFIG.GEMINI.TEMPERATURE,
    apiKey,
  });
}

/**
 * Convenience function to get Gemini Flash model with low temperature (for keyword extraction, etc.)
 */
export function getGeminiFlashModelLowTemp(apiKey?: string): GenerativeModel {
  return getGeminiModel({
    model: AI_CONFIG.GEMINI.MODEL_FLASH,
    temperature: 0.2,
    apiKey,
  });
}

