'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './ProfileDropdown.module.css';
import { HelperFunctions, secure } from '../../utils/helperFunctions';
import { SupabaseHelpers } from '../../utils/SupabaseHelpers';
import { profileService, BackgroundItem, LibraryData } from '../../services/profileService';
import { toast } from 'react-toastify';
import { GoogleDriveServiceFunctions } from '../../services/googleDriveService';
import ProjectSettingsDialog from '../../dialogs/ProjectSettingsDialog';
import { SettingItemInterface, Settings } from '../../types/scriptData';
import SettingsIcon from '@mui/icons-material/Settings';
import { Button } from '@mui/material';
import AppLoadingOverlay from '../ui/loadingView/AppLoadingOverlay';
import { SocialKeys } from '@/types/backgroundType';
import { getSupabase } from '@/utils/supabase';
import { ROUTES_KEYS } from '@/data/constants';

export const ProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialKeys, setSocialKeys] = useState<SocialKeys>({ tiktok: '', instagram: '', facebook: '', youtube: '' });
  const [gammaTextMode, setGammaTextMode] = useState<string>('generate');
  const [gammaFormat, setGammaFormat] = useState<string>('presentation');
  const [gammaThemeName, setGammaThemeName] = useState<string>('Pearl');
  const [themeFilter, setThemeFilter] = useState<string>('');
  const allThemes: string[] = [
    // 'Pearl', 'Vortex', 'Clementa', 'Stratos', 'Nova', 'Twilight', 'Coral Glow', 'Mercury', 'Ashrose', 'Spectrum', 'Chisel', 'Stardust', 'Seafoam', 'Nebulae', 'Creme', 'Lux', 'Consultant', 'Marine', 'Elysia', 'Prism', 'Lunaria', 'Night Sky', 'Commons', 'Bonan Hale', 'Gamma', 'Gamma Dark', 'Dialogue', 'Founder', 'Lavender', 'Indigo', 'Howlite', 'Onyx', 'Atmosphere', 'Blueberry', 'Kraft', 'Mystique', 'Petrol', 'Blues', 'Peach', 'Incandescent', 'Oatmeal', 'Sanguine', 'Sage', 'Verdigris', 'Ash', 'Coal', 'Flamingo', 'Canaveral', 'Oasis', 'Fluo', 'Finesse', 'Electric', 'Zephyr', 'Chimney Smoke', 'Chimney Dust', 'Icebreaker', 'Blue Steel', 'Daydream', 'Orbit', 'Dune', 'Mocha', 'Serene', 'Cornflower', 'Vanilla', 'Alien', 'Breeze', 'Aurora', 'Velvet Tides', 'Tranquil', 'Borealis', 'Terracotta', 'Bubble Gum', 'Snowball', 'Pistachio', 'Piano', 'Atacama', 'Wireframe', 'Aurum', 'Bee Happy', 'Chocolate', 'Cigar', 'Cornfield', 'Daktilo', 'Dawn', 'Editoria', 'Flax', 'Gleam', 'Gold Leaf', 'Iris', 'Keepsake', 'Leimoon', 'Linen', 'Malibu', 'Moss & Mist', 'Plant Shop', 'Rush', 'Shadow', 'Slate', 'Sprout', 'Wine', 'Basic Light', 'Basic Dark'
    'Pearl', 'Vortex', 'Clementa', 'Seafoam', 'Chisel', 'Marine', 'Lux',
  ];
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Project Settings Dialog state
  const [loading, setLoading] = useState(false);
  const [projectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);
  const [projectSettingsContext, setProjectSettingsContext] = useState<{ mode: 'project' | 'scene'; sceneIndex?: number }>({ mode: 'project' });
  const [projectSettings, setProjectSettings] = useState<Settings | null>(null);
  const [sceneSettings, setSceneSettings] = useState<Settings | null>(null);

  // Close on ESC
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setMenuOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!user) return null;

  // Load saved keys and profile settings for this user
  useEffect(() => {
    try {
      if (user?.id) {
        loadProfileSettings();
      }
    } catch {
      HelperFunctions.showError('Failed to load profile settings');
    }
  }, [user?.id, menuOpen]);

  const loadProfileSettings = async () => {
    const profileSettings = await profileService.getProfileSettings(user.id);
    if (profileSettings.projectSettings !== undefined && profileSettings.projectSettings !== null && profileSettings.projectSettings.videoBackgroundVideo && profileSettings.projectSettings.videoBackgroundMusic && profileSettings.projectSettings.videoTransitionEffect) {
      setProjectSettings(profileSettings.projectSettings);
    } else {
      await setDefaultProjectSettings();
    }
    if (profileSettings.socialKeys) {
      setSocialKeys(profileSettings.socialKeys);
    }
    if (profileSettings.gammaTextMode) {
      setGammaTextMode(profileSettings.gammaTextMode);
    }
    if (profileSettings.gammaFormat) {
      setGammaFormat(profileSettings.gammaFormat);
    }
    if (profileSettings.gammaThemeName) {
      setGammaThemeName(profileSettings.gammaThemeName);
    }
  }

  const setDefaultProjectSettings = async () => {
    const libraryData = await GoogleDriveServiceFunctions.loadLibraryData(false);
    let updatedProjectSettings: Settings | null = projectSettings || {} as Settings;
    if (!updatedProjectSettings.videoBackgroundVideo && libraryData.backgrounds && libraryData.backgrounds.length > 0) {
      updatedProjectSettings.videoBackgroundVideo = libraryData.backgrounds[0] as SettingItemInterface;
    }
    if (!updatedProjectSettings.videoBackgroundMusic && libraryData.music && libraryData.music.length > 0) {
      updatedProjectSettings.videoBackgroundMusic = libraryData.music[0] as SettingItemInterface;
    }
    if (!updatedProjectSettings.videoTransitionEffect && libraryData.transitionEffects && libraryData.transitionEffects.length > 0) {
      updatedProjectSettings.videoTransitionEffect = libraryData.transitionEffects[0] as SettingItemInterface;
    }
    setProjectSettings(updatedProjectSettings);
    saveProfileSettings(updatedProjectSettings, socialKeys, gammaTextMode, gammaFormat, gammaThemeName);
  }

  const handleSignOut = async () => {
    try {
      setMenuOpen(false);
      HelperFunctions.clearSecureStorage();
      
      // Use window.location since router might not be mounted in all contexts
      // This is a client component, so window is always available
      window.location.href = ROUTES_KEYS.HOME;
      const supabase = getSupabase();
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) {
        console.error(error);
        toast.error("Failed to logout");
        return;
      }
     
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('An error occurred during sign out');
    } finally {
      setMenuOpen(false);
    }
  };

  const saveProfileSettings = async (projectSettings: Settings | null, socialKeys: SocialKeys, gammaTextMode?: string, gammaFormat?: string, gammaThemeName?: string) => {
    await profileService.saveProfileSettings(user.id, projectSettings,
      socialKeys,
      gammaTextMode,
      gammaFormat,
      gammaThemeName);
  };

  // Project Settings Dialog functions
  const openProjectSettingsDialog = (mode: 'project' | 'scene' = 'project', sceneIndex?: number) => {
    setProjectSettingsContext({ mode, sceneIndex });
    setProjectSettings(null);
    setSceneSettings(null);
    setProjectSettingsDialogOpen(true);
    setMenuOpen(false);
  };

  const applyProjectSettingsDialog = async (mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => {
    setProjectSettingsDialogOpen(false);
    setProjectSettings(projectSettings);
    saveProfileSettings(projectSettings, socialKeys, gammaTextMode, gammaFormat, gammaThemeName);
    toast.success('Project settings saved');
  };

  const getInitials = (name: string | null, email: string) => {
    if (name && name.trim()) {
      return name
        .trim()
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return (email || '?').charAt(0).toUpperCase();
  };

  return (
    <>
      {
        loading && <AppLoadingOverlay />
      }
      <div className={styles.profileDropdown}>
        <button
          ref={triggerRef}
          className={styles.profileAvatarBtn}
          onClick={() => setMenuOpen(true)}
          aria-label="Open profile menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
        >
          <div className={styles.avatarCircleSmall}>
            {user.user_metadata?.picture ? (
              <img
                src={user.user_metadata.picture}
                alt="Profile"
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarInitialsSmall}>
                {getInitials(user.user_metadata?.full_name, user.email || '')}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Dialog-like menu (no layout shift) */}
      {menuOpen && (
        <div
          className={styles.menuDialogOverlay}
          role="presentation"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className={styles.menuDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profileMenuTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.menuHeader}>
              <div className={styles.headerRow}>
                <div className={styles.avatarCircle}>
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.picture}
                      alt="Profile"
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarInitials}>
                      {getInitials(user.user_metadata?.full_name, user.email || '')}
                    </span>
                  )}
                </div>
                <div className={styles.userMeta}>
                  <div id="profileMenuTitle" className={styles.userName}>
                    {user.user_metadata?.full_name || 'User'}
                  </div>
                  <div className={styles.userEmail}>{user.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button variant="contained" size="medium" sx={{ textTransform: 'none', fontSize: '1.25rem' }} onClick={() => openProjectSettingsDialog('project')} startIcon={<SettingsIcon />}>Project Settings </Button>
                  <Button
                    variant="outlined"
                    size="medium"
                    sx={{ textTransform: 'none', fontSize: '1.25rem' }}
                    onClick={handleSignOut}
                    startIcon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-12H12V3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7v-2h7V5z" />
                      </svg>
                    }
                  >
                    Log Out
                  </Button>
                  <button
                    className={styles.dialogClose}
                    onClick={() => {
                      setMenuOpen(false)
                    }}
                    aria-label="Close menu"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6L18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.dialogContent}>
              {/* Content Column */}
              <div className={styles.rightColumn} style={{ width: '100%', borderRight: 'none' }}>
                {/* Theme & Generation Section */}
                <div className={styles.generationSection}>
                  <h3 className={styles.sectionTitle}>Theme & Generation</h3>
                  <div className={styles.rowInputs}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Text mode</label>
                      <select className={styles.selectInput} value={gammaTextMode} onChange={(e) => {
                        setGammaTextMode(e.target.value);
                        saveProfileSettings(projectSettings, socialKeys, e.target.value, gammaFormat, gammaThemeName);
                      }}>
                        <option value="generate">generate</option>
                        <option value="condense">condense</option>
                        <option value="preserve">preserve</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Format</label>
                      <select className={styles.selectInput} value={gammaFormat} onChange={(e) => {
                        setGammaFormat(e.target.value);
                        saveProfileSettings(projectSettings, socialKeys, gammaTextMode, e.target.value, gammaThemeName);
                      }}>
                        <option value="presentation">presentation</option>
                        <option value="document">document</option>
                        <option value="social">social</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.themeGridHeader}>
                    <div className={styles.themeSearchWrap}>
                      <input
                        className={styles.themeSearch}
                        value={themeFilter}
                        placeholder="Search theme..."
                        onChange={(e) => {
                          setThemeFilter(e.target.value);
                          saveProfileSettings(projectSettings, socialKeys, gammaTextMode, gammaFormat, e.target.value);
                        }}
                      />
                    </div>
                    {/* <div className={styles.themeSelected}>Selected: <strong>{gammaThemeName}</strong></div> */}
                  </div>

                  <ThemeCards
                    themes={allThemes.filter(t => t.toLowerCase().includes(themeFilter.toLowerCase()))}
                    selected={gammaThemeName}
                    onSelect={(name) => {
                      setGammaThemeName(name);
                      saveProfileSettings(projectSettings, socialKeys, gammaTextMode, gammaFormat, name);
                    }}
                  />

                </div>
                {/* Social Keys Section */}
                <div className={styles.socialForm}>
                  <h3 className={styles.sectionTitle}>Social Media Keys</h3>
                  <div className={styles.socialGroup}>
                    <label className={styles.socialLabel} htmlFor="tiktokKey">TikTok profile key</label>
                    <input id="tiktokKey" className={styles.socialInput} value={socialKeys.tiktok} onChange={(e) => setSocialKeys(k => ({ ...k, tiktok: e.target.value }))} placeholder="Enter TikTok key" />
                  </div>
                  <div className={styles.socialGroup}>
                    <label className={styles.socialLabel} htmlFor="instagramKey">Instagram profile key</label>
                    <input id="instagramKey" className={styles.socialInput} value={socialKeys.instagram} onChange={(e) => setSocialKeys(k => ({ ...k, instagram: e.target.value }))} placeholder="Enter Instagram key" />
                  </div>
                  <div className={styles.socialGroup}>
                    <label className={styles.socialLabel} htmlFor="facebookKey">Facebook profile key</label>
                    <input id="facebookKey" className={styles.socialInput} value={socialKeys.facebook} onChange={(e) => setSocialKeys(k => ({ ...k, facebook: e.target.value }))} placeholder="Enter Facebook key" />
                  </div>
                  <div className={styles.socialGroup}>
                    <label className={styles.socialLabel} htmlFor="youtubeKey">YouTube API key</label>
                    <input id="youtubeKey" className={styles.socialInput} value={socialKeys.youtube} onChange={(e) => setSocialKeys(k => ({ ...k, youtube: e.target.value }))} placeholder="Enter YouTube key" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div >
      )}

      {/* Project Settings Dialog */}
      <ProjectSettingsDialog
        userId={user.id}
        jobId={null}
        open={projectSettingsDialogOpen}
        onClose={() => {
          setProjectSettingsDialogOpen(false);
        }}
        onApply={(mode: 'project' | 'scene', projectSettings: Settings | null, sceneSettings: Settings | null) => applyProjectSettingsDialog(mode, projectSettings, sceneSettings)}
        projectSettingsContext={projectSettingsContext}
        pSettings={projectSettings}
        sSettings={sceneSettings}
      />
    </>
  );
};

// Local ThemeCards component renders a grid of cards resembling the provided visuals
const ThemeCards: React.FC<{ themes: string[]; selected: string; onSelect: (name: string) => void; }> = ({ themes, selected, onSelect }) => {

  // Preview style presets for specific themes
  const themePreview: Record<string, {
    cardBg?: string;
    cardBorder?: string;
    titleColor?: string;
    bodyColor?: string;
    accentColor?: string;
    pageBg?: string;
    shadow?: string;
  }> = {
    Pearl: {
      accentColor: '#1B1B27', // Primary accent color
      titleColor: '#1B1B27', // Heading color
      bodyColor: '#3C3939', // Body color
      cardBg: '#FFFFFF', // Card background color
      pageBg: '#ECECF3', // Page background   
      cardBorder: '#E6E6E6', // Card border color
    },
    Vortex: {
      titleColor: '#F2F2F3', // Heading color
      accentColor: '#F2F2F3', // Primary accent color
      cardBg: '#050505', // Card background color
      cardBorder: '#565151', // Card border color
      bodyColor: '#E5E0DF', // Body color
      pageBg: '#19191A', // Page background   
    },
    Clementa: {
      accentColor: '#FF954F', // Primary accent color
      titleColor: '#532418', // Heading color
      bodyColor: '#67534F', // Body color
      cardBg: '#FFFFF4', // Card background color
      pageBg: '#DEC8AB', // Page background   
      cardBorder: '#E6E6E6', // Card border color
    },
    // Stratos: {
    //   accentColor: '#487CFF', // Primary accent color
    //   titleColor: '#F2F5FA', // Heading color
    //   bodyColor: '#EBEDF0', // Body color
    //   cardBg: '#101620', // Card background color 
    //   pageBg: '#101620', // Page background   
    //   cardBorder: '', // Card border color
    // },
    Seafoam: {
      accentColor: '#26A688', // Primary accent color
      titleColor: '#333F70', // Heading color
      bodyColor: '#333F70', // Body color
      cardBg: '#FFFFFF', // Card background color
      pageBg: '#D6F5EE', // Page background   
      cardBorder: '#E5E0DF', // Card border color
    },
    Chisel: {
      accentColor: '#3E2513', // Primary accent color
      titleColor: '#201B18', // Heading color
      bodyColor: '#504C49', // Body color
      cardBg: '#FFFFFF', // Card background color
      pageBg: '#F7F3F0', // Page background   
      cardBorder: '', // Card border color
    },
    Marine: {
      accentColor: '#8C98CA', // Primary accent color
      titleColor: '#FFFFFF', // Heading color
      bodyColor: '#EBECEF', // Body color
      cardBg: '#080E26', // Card background color
      pageBg: '#A8AFCC', // Page background   
      cardBorder: '#565151', // Card border color
    },
    Lux: {
      accentColor: '#EF9C82', // Primary accent color
      titleColor: '#FFD9BE', // Heading color
      bodyColor: '#F9EEE7', // Body color
      cardBg: '#123332', // Card background color
      pageBg: '#1C4241', // Page background   
      cardBorder: '', // Card border color
    },
  };

  return (
    <div className={styles.themeGrid}>
      {themes.map((name, idx) => {
        const isActive = selected === name;
        const preset = themePreview[name] || {};

        return (
          <button
            key={name}
            className={isActive ? `${styles.themeCard} ${styles.themeCardActive}` : `${styles.themeCard}`}
            onClick={() => onSelect(name)}
          // style={cardStyle}
          >
            <div className={styles.themeThumb} style={{ backgroundColor: preset.pageBg, backgroundImage: 'none', borderBottom: `1px solid #e5e7eb` }}>
              <div
                className={`${styles.themeThumbInner}`}
                style={{ borderColor: preset.cardBorder, backgroundColor: preset.cardBg }}
              >
                <div className={styles.themeTitle} style={{ color: preset.titleColor }}>Title</div>
                <div className={styles.themeBody} style={{ color: preset.bodyColor }}> Body </div>
              </div>
            </div>
            <div className={styles.themeName} style={{ color: 'black' }}>{name}</div>
          </button>
        );
      })}
    </div>
  );
};
