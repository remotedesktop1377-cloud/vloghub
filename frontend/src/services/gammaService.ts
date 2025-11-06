// Gamma client-side service using public Gamma API

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
            inputText,
            textMode: 'preserve',   // generate, condense, preserve
            format: 'presentation', // presentation, document, social
            themeName: 'Oasis', // Oasis, Ocean, Forest, City, Sunset, Winter, Spring, Summer, Autumn
            numCards,
            cardSplit: 'auto', // auto, manual
            additionalInstructions: 'Make the card headings humorous and catchy',
            exportAs: 'pdf', // pdf, pptx, docx
            imageOptions: {
                source: 'aiGenerated',
                model: 'imagen-4-pro',
                style: 'line art',
            },
            cardOptions: {
                dimensions: 'fluid', // fluid, 16x9, 4x3
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


