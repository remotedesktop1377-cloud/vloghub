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
export function getGeminiModel(): GenerativeModel {
  const genAI = getGeminiClient(process.env.GEMINI_API_KEY);
  const model = AI_CONFIG.GEMINI.MODEL_FLASH;
  const temperature = AI_CONFIG.GEMINI.TEMPERATURE;

  return genAI.getGenerativeModel({
    model: model,
    generationConfig: { temperature: temperature },
  });
}

