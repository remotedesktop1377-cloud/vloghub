import { API_ENDPOINTS } from "@/config/apiEndpoints";
import HttpService from "./httpService";

export interface GammaGenerationResponse {
    generationId?: string;
    error?: string;
}
let API_IN_PROGRESS = false;

export const GammaService = {
    async startGeneration(inputText: string, numCards: number): Promise<GammaGenerationResponse> {
        if (API_IN_PROGRESS) {
            return { error: 'Gamma API is already in progress' };
        }
        API_IN_PROGRESS = true;
        const res = await HttpService.post<any>(API_ENDPOINTS.API_GAMMA_GENERATE, {
            inputText: inputText,
            numCards,
            exportAs: 'pdf',
            imageOptions: {
                model: 'imagen-4-pro',
                style: 'photorealistic',
            },
            sharingOptions: {
                workspaceAccess: 'view',
                externalAccess: 'noAccess',
            },
        });
        API_IN_PROGRESS = false;
        return res;
    },

    async checkStatus(generationId: string): Promise<any> {
        return HttpService.get<any>(`${API_ENDPOINTS.API_GAMMA_GENERATE}/${encodeURIComponent(generationId)}`);
    }
};

export default GammaService;


