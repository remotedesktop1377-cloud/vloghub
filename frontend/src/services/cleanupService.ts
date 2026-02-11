import { API_ENDPOINTS } from "@/config/apiEndpoints";
import HttpService from "./httpService";

export const cleanupService = {
  async cleanupExports() {
    return HttpService.post<{ success: boolean; error?: string }>(
      API_ENDPOINTS.CLEANUP_EXPORTS,
      {}
    );
  },
};
