import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { HttpService } from './httpService';

export interface OutputVideoItem {
  id: string;
  name: string;
  mimeType?: string | null;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string | null;
  iconLink?: string | null;
  jobId: string;
  projectId?: string;
  generatedVideoId?: string;
}

export interface OutputVideosJob {
  jobId: string;
  videos: OutputVideoItem[];
}

export interface OutputVideosResponse {
  jobs: OutputVideosJob[];
}

export const DashboardService = {
  async fetchOutputVideos(jobId?: string): Promise<OutputVideosResponse> {
    const baseUrl = API_ENDPOINTS.API_GOOGLE_DRIVE_OUTPUT_VIDEOS;
    const url = jobId ? `${baseUrl}?jobId=${encodeURIComponent(jobId)}` : baseUrl;
    return HttpService.get<OutputVideosResponse>(url);
  },
};



