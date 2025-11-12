import { Settings } from '@/types/scriptData';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { HelperFunctions, secure } from '../utils/helperFunctions';
import { SupabaseHelpers } from '../utils/SupabaseHelpers';
import { SocialKeys } from '@/types/backgroundType';

export interface BackgroundItem {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    webContentLink: string;
    thumbnailLink?: string;
    iconLink?: string;
}

export interface LibraryData {
    backgrounds: BackgroundItem[];
    music: any[];
    transitions: any[];
    transitionEffects: any[];
}

export interface ProfileService {
    fetchLibraryData: () => Promise<LibraryData>;
    uploadLogo: (file: File, userId: string) => Promise<{ success: boolean; url?: string; fileName?: string }>;
    removeLogo: (fileName: string, url: string, userId: string) => Promise<{ success: boolean }>;
    saveProfileSettings: (userId: string, projectSettings: Settings, socialKeys: SocialKeys, gammaTextMode?: string, gammaFormat?: string, gammaThemeName?: string) => Promise<boolean>;
    getProfileSettings: (userId: string) => Promise<{ projectSettings?: Settings | null; socialKeys?: SocialKeys | null; gammaTextMode?: string | null; gammaFormat?: string | null; gammaThemeName?: string | null }>;
}

class ProfileServiceImpl implements ProfileService {

    /**
     * Fetch all library data (backgrounds, music, transitions) from Google Drive library
     */
    async fetchLibraryData(): Promise<LibraryData> {
        try {
            console.log('Fetching library data from:', `${API_ENDPOINTS.API_GOOGLE_DRIVE_LIBRARY}`);
            const response = await fetch(API_ENDPOINTS.API_GOOGLE_DRIVE_LIBRARY);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', response.status, errorText);
                throw new Error(`Failed to fetch library data: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            // console.log('API Response:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            // Show warnings if any
            if (data.meta?.backgroundsWarning) {
                console.warn('Backgrounds warning:', data.meta.backgroundsWarning);
                HelperFunctions.showError(data.meta.backgroundsWarning);
            }
            if (data.meta?.musicWarning) {
                console.warn('Music warning:', data.meta.musicWarning);
                HelperFunctions.showWarning(data.meta.musicWarning);
            }
            if (data.meta?.transitionsWarning) {
                console.warn('Transitions warning:', data.meta.transitionsWarning);
                HelperFunctions.showWarning(data.meta.transitionsWarning);
            }

            // Return the full API response structure
            return {
                backgrounds: data?.data?.backgrounds || [],
                music: data?.data?.music || [],
                transitions: data?.data?.transitions || [],
                transitionEffects: data?.data?.transitionEffects || []
            };
        } catch (error) {
            console.error('Error fetching library data:', error);
            HelperFunctions.showError(`Failed to load library data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                backgrounds: [],
                music: [],
                transitions: [],
                transitionEffects: []
            };
        }
    }

    /**
     * Upload logo to Supabase storage and update profile
     */
    async uploadLogo(file: File, userId: string): Promise<{ success: boolean; url?: string; fileName?: string }> {
        try {
            const result = await SupabaseHelpers.uploadLogoToProfile(userId, file);

            if (result.success) {
                // Also save to local secure storage for immediate access
                const logoData = {
                    url: result.url!,
                    fileName: result.fileName!,
                    uploadedAt: new Date().toISOString()
                };

                const key = `profileSettings_${userId}`;
                const currentSettings = secure.j[key as any].get() || {};
                secure.j[key as any].set({
                    ...currentSettings,
                    logo: logoData
                });
            }

            return result;
        } catch (error) {
            console.error('Error uploading logo:', error);
            HelperFunctions.showError('Failed to upload logo');
            return { success: false };
        }
    }

    /**
     * Remove logo from Supabase storage and profile
     */
    async removeLogo(fileName: string, url: string, userId: string): Promise<{ success: boolean }> {
        try {
            const result = await SupabaseHelpers.removeLogoFromProfile(fileName, url, userId);

            if (result.success) {
                // Also remove from local secure storage
                const key = `profileSettings_${userId}`;
                const currentSettings = secure.j[key as any].get() || {};
                secure.j[key as any].set({
                    ...currentSettings,
                    logo: null
                });
            }

            return result;
        } catch (error) {
            console.error('Error removing logo:', error);
            HelperFunctions.showError('Failed to remove logo');
            return { success: false };
        }
    }

    /**
     * Save profile settings (logo and background) to Supabase and secure storage
     */
    async saveProfileSettings(userId: string, projectSettings: Settings | null, socialKeys: SocialKeys, gammaTextMode?: string, gammaFormat?: string, gammaThemeName?: string): Promise<boolean> {
        try {
            // Save background to Supabase if provided
            // if (settings.background) {
            //     await SupabaseHelpers.updateSelectedBackground(userId, settings.background);
            // }

            // Save to local secure storage for immediate access
            console.log('Saving profile settings to secure storage:', {
                projectSettings: projectSettings,
                socialKeys: socialKeys,
                gammaTextMode: gammaTextMode,
                gammaFormat: gammaFormat,
                gammaThemeName: gammaThemeName
            });
            debugger;
            const key = `profileSettings_${userId}`;
            const currentSettings = secure.j[key as any].get() || {};
            secure.j[key as any].set({
                ...currentSettings,
                projectSettings: projectSettings,
                socialKeys: socialKeys,
                gammaTextMode: gammaTextMode,
                gammaFormat: gammaFormat,
                gammaThemeName: gammaThemeName
                
            });

            HelperFunctions.showSuccess('Profile settings saved');
            return true;
        } catch (error) {
            console.error('Error saving profile settings:', error);
            HelperFunctions.showError('Failed to save profile settings');
            return false;
        }
    }

    /**
     * Get profile settings from Supabase and secure storage
     */
    async getProfileSettings(userId: string): Promise<{ projectSettings?: Settings | null; socialKeys?: SocialKeys | null; gammaTextMode?: string | null; gammaFormat?: string | null; gammaThemeName?: string | null }> {
        try {
            // First try to get from Supabase
            // const { data: profileData } = await SupabaseHelpers.getUserProfileWithAssets(userId);

            // const settings: { logo?: any; background?: any; gammaTextMode?: any; gammaFormat?: any; gammaThemeName?: any } = {};

            // // Get logo from Supabase profile
            // if ((profileData as any)?.logo_url) {
            //     settings.logo = {
            //         url: (profileData as any).logo_url,
            //         fileName: (profileData as any).logo_filename,
            //         uploadedAt: (profileData as any).updated_at
            //     };
            // }

            // // Get background from Supabase profile
            // if ((profileData as any)?.selected_background) {
            //     settings.background = (profileData as any).selected_background;
            // }

            // if ((profileData as any)?.gammaTextMode) {
            //     settings.gammaTextMode = (profileData as any).gammaTextMode;
            // }
            // if ((profileData as any)?.gammaFormat) {
            //     settings.gammaFormat = (profileData as any).gammaFormat;
            // }
            // if ((profileData as any)?.gammaThemeName) {
            //     settings.gammaThemeName = (profileData as any).gammaThemeName;
            // }

            // Fallback to local storage if Supabase data is incomplete
            const key = `profileSettings_${userId}`;
            const localSettings = secure.j[key as any].get() || {};

            return {
                projectSettings: localSettings.projectSettings || null,
                socialKeys: localSettings.socialKeys || null,
                gammaTextMode: localSettings.gammaTextMode || null,
                gammaFormat: localSettings.gammaFormat || null,
                gammaThemeName: localSettings.gammaThemeName || null
            };
        } catch (error) {
            console.error('Error getting profile settings:', error);
            // Fallback to local storage
            const key = `profileSettings_${userId}`;
            return secure.j[key as any].get() || {};
        }
    }
}

// Export singleton instance
export const profileService = new ProfileServiceImpl();
