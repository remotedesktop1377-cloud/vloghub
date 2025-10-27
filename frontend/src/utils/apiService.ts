import { ROUTES_KEYS } from '@/data/constants';
import { API_ENDPOINTS } from '../config/apiEndpoints';

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface ApiError {
  message: string;
  status?: number;
}

export class ApiService {
  private static baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  /**
   * Get the base URL for API calls
   */
  private static getBaseUrl(): string {
    // If no base URL is set, use current origin (same domain)
    if (!this.baseUrl) {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return '';
    }
    return this.baseUrl;
  }

  /**
   * Generic GET request
   */
  static async get<T = any>(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    try {
      // Construct URL properly - handle both relative and absolute endpoints
      let fullUrl: string;
      const baseUrl = this.getBaseUrl();

      if (endpoint.startsWith('http')) {
        // Absolute URL - use as-is
        fullUrl = endpoint;
      } else if (baseUrl) {
        // We have a base URL - combine with endpoint
        if (endpoint.startsWith('/') || endpoint.startsWith(ROUTES_KEYS.HOME)) {
          fullUrl = baseUrl + endpoint;
        } else {
          fullUrl = baseUrl + '/' + endpoint;
        }
      } else {
        // No base URL - assume endpoint is relative to current domain
        if (endpoint.startsWith('/') || endpoint.startsWith(ROUTES_KEYS.HOME)) {
          fullUrl = endpoint;
        } else {
          fullUrl = '/' + endpoint;
        }
      }

      console.log(`URL construction: endpoint="${endpoint}", baseUrl="${baseUrl}", fullUrl="${fullUrl}"`);
      const url = new URL(fullUrl);

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      console.log(`Making GET request to: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data: errorData
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`GET request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generic POST request
   */
  static async post<T = any>(
    endpoint: string,
    body: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data: errorData
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`POST request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generic PUT request
   */
  static async put<T = any>(
    endpoint: string,
    body: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data: errorData
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`PUT request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generic DELETE request
   */
  static async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data: errorData
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`DELETE request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generic PATCH request
   */
  static async patch<T = any>(
    endpoint: string,
    body: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = { message: response.statusText || `HTTP ${response.status}` };
        }

        return {
          success: false,
          error: errorData.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          data: errorData
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`PATCH request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Specific API service functions for common operations
export const apiService = {
  // Trending Topics (Gemini only)
  getGeminiTrendingTopics: (region: string, dateRange: string) =>
    ApiService.get(API_ENDPOINTS.GEMINI_TRENDING_TOPICS, { region, dateRange }),

  generateScript: (body: {
    topic: string;
    hypothesis: string;
    region: string;
    duration: string;
    language?: string;
    narration_type?: 'interview' | 'narration';
  }) => ApiService.post(API_ENDPOINTS.GENERATE_SCRIPT, body),

  generateImages: (body: {
    topic: string;
    hypothesis: string;
    details: string;
    region: string;
    duration: string
  }) => ApiService.post(API_ENDPOINTS.GENERATE_IMAGES, body),

  // Highlights extraction (Gemini)
  getSceneDataHighlights: (SceneData: Array<{ id: string; narration: string }>) =>
    ApiService.post(API_ENDPOINTS.GEMINI_HIGHLIGHT_KEYWORDS, { SceneData }),

}; 