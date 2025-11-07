'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './ProfileDropdown.module.css';
import { HelperFunctions, secure } from '../../utils/helperFunctions';
import { SupabaseHelpers } from '../../utils/SupabaseHelpers';
import { profileService, BackgroundItem } from '../../services/profileService';
import { toast } from 'react-toastify';
import { GoogleDriveServiceFunctions } from '../../services/googleDriveService';

export const ProfileDropdown: React.FC = () => {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialKeys, setSocialKeys] = useState({ tiktok: '', instagram: '', facebook: '', youtube: '' });
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundItem | null>(null);
  const [userLogo, setUserLogo] = useState<{ url: string; fileName: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingBackgrounds, setLoadingBackgrounds] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [textMode, setTextMode] = useState<string>(() => String((secure as any).j?.textMode?.get?.() || 'generate'));
  const [format, setFormat] = useState<string>(() => String((secure as any).j?.format?.get?.() || 'presentation'));
  const [themeName, setThemeName] = useState<string>(() => String((secure as any).j?.themeName?.get?.() || 'Pearl'));
  const [themeFilter, setThemeFilter] = useState<string>('');
  const allThemes: string[] = [
    // 'Pearl', 'Vortex', 'Clementa', 'Stratos', 'Nova', 'Twilight', 'Coral Glow', 'Mercury', 'Ashrose', 'Spectrum', 'Chisel', 'Stardust', 'Seafoam', 'Nebulae', 'Creme', 'Lux', 'Consultant', 'Marine', 'Elysia', 'Prism', 'Lunaria', 'Night Sky', 'Commons', 'Bonan Hale', 'Gamma', 'Gamma Dark', 'Dialogue', 'Founder', 'Lavender', 'Indigo', 'Howlite', 'Onyx', 'Atmosphere', 'Blueberry', 'Kraft', 'Mystique', 'Petrol', 'Blues', 'Peach', 'Incandescent', 'Oatmeal', 'Sanguine', 'Sage', 'Verdigris', 'Ash', 'Coal', 'Flamingo', 'Canaveral', 'Oasis', 'Fluo', 'Finesse', 'Electric', 'Zephyr', 'Chimney Smoke', 'Chimney Dust', 'Icebreaker', 'Blue Steel', 'Daydream', 'Orbit', 'Dune', 'Mocha', 'Serene', 'Cornflower', 'Vanilla', 'Alien', 'Breeze', 'Aurora', 'Velvet Tides', 'Tranquil', 'Borealis', 'Terracotta', 'Bubble Gum', 'Snowball', 'Pistachio', 'Piano', 'Atacama', 'Wireframe', 'Aurum', 'Bee Happy', 'Chocolate', 'Cigar', 'Cornfield', 'Daktilo', 'Dawn', 'Editoria', 'Flax', 'Gleam', 'Gold Leaf', 'Iris', 'Keepsake', 'Leimoon', 'Linen', 'Malibu', 'Moss & Mist', 'Plant Shop', 'Rush', 'Shadow', 'Slate', 'Sprout', 'Wine', 'Basic Light', 'Basic Dark'
    'Pearl', 'Vortex', 'Clementa', 'Seafoam', 'Chisel', 'Marine', 'Lux',
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
    let mounted = true;
    (async () => {
      try {

        if (mounted) {
          const keys = HelperFunctions.getSocialAuthKeys(user.id);
          setSocialKeys({ tiktok: keys.tiktok || '', instagram: keys.instagram || '', facebook: keys.facebook || '', youtube: keys.youtube || '' });
          setLoadingBackgrounds(false);
        }

        // Load profile settings (logo and background)
        const profileSettings = await profileService.getProfileSettings(user.id);
        if (mounted) {
          if (profileSettings.logo) {
            setUserLogo(profileSettings.logo);
          }
          if (profileSettings.background) {
            setSelectedBackground(profileSettings.background);
          }
          if (profileSettings.textMode) {
            setTextMode(profileSettings.textMode);
          }
          if (profileSettings.format) {
            setFormat(profileSettings.format);
          }
          if (profileSettings.themeName) {
            setThemeName(profileSettings.themeName);
          }
        }
        
      } catch {
        if (mounted) {
          const keys = HelperFunctions.getSocialAuthKeys(user.id);
          setSocialKeys({ tiktok: keys.tiktok || '', instagram: keys.instagram || '', facebook: keys.facebook || '', youtube: keys.youtube || '' });
          setLoadingBackgrounds(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  // Load backgrounds from cache on mount
  useEffect(() => {
    const cachedBackgrounds = GoogleDriveServiceFunctions.getCachedBackgrounds();
    if (cachedBackgrounds && cachedBackgrounds.length > 0) {
      console.log('🟡 Loading backgrounds from cache');
      setBackgrounds(cachedBackgrounds);
    }
  }, []);

  const loadBackgrounds = async (forceRefresh: boolean = false) => {
    setLoadingBackgrounds(true);
    try {
      const backgroundsList = await GoogleDriveServiceFunctions.loadBackgrounds(forceRefresh);
      setBackgrounds(backgroundsList);
    } catch (error) {
      console.error('Error refreshing backgrounds:', error);
      toast.error('Failed to refresh backgrounds');
    } finally {
      setLoadingBackgrounds(false);
    }
  };

  useEffect(() => {
    saveProfileSettings();
  }, [textMode, format, themeName, selectedBackground, userLogo]);

  const handleSignOut = async () => {
    try {
      setUploadingLogo(false);
      await signOut();
    } finally {
      setMenuOpen(false);
    }
  };

  const saveKeys = async () => {
    HelperFunctions.saveSocialAuthKeys(user.id, socialKeys); // local secure cache
    await SupabaseHelpers.saveUserSocialAuthKeys(user.id, socialKeys); // persist to DB
  };

  const saveProfileSettings = async () => {
    await profileService.saveProfileSettings(user.id, {
      logo: userLogo,
      background: selectedBackground,
      textMode: textMode,
      format: format,
      themeName: themeName
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    console.log('Starting logo upload for file:', file.name, 'Size:', file.size);
    setUploadingLogo(true);

    try {
      console.log('Calling profileService.uploadLogo...');
      const result = await profileService.uploadLogo(file, user.id);
      console.log('Upload result:', result);

      if (result.success && result.url) {
        const logoData = {
          url: result.url,
          fileName: result.fileName || file.name,
          uploadedAt: new Date().toISOString()
        };
        setUserLogo(logoData);

        // Save to profile settings
        console.log('Saving profile settings...');

        toast.success('Logo uploaded successfully');
        console.log('Logo upload completed successfully');
      } else {
        console.error('Upload failed:', result);
        toast.error('Failed to upload logo');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Setting uploadingLogo to false');
      setUploadingLogo(false);
    }
  };

  const handleBackgroundSelect = async (background: BackgroundItem) => {
    setSelectedBackground(background);

    toast.success('Background selected successfully');
  };

  const removeLogo = async () => {
    const result = await profileService.removeLogo(userLogo?.fileName || '', userLogo?.url || '', user.id);
    if (result.success) {
      setUserLogo(null);
    }
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  const handleVideoLoadStart = () => {
    setVideoLoading(true);
  };

  // Utility function to convert Google Drive URLs to playable formats
  const getPlayableVideoUrl = (background: BackgroundItem): string[] => {
    const fileId = background.id;
    const urls = [
      // Method 1: Direct Google Drive streaming URL
      `https://drive.google.com/uc?id=${fileId}`,
      // Method 2: Alternative streaming format
      `https://drive.google.com/file/d/${fileId}/preview`,
      // Method 3: Download format (sometimes works for videos)
      `https://drive.google.com/uc?id=${fileId}&export=download`,
      // Method 4: Alternative preview format
      `https://drive.google.com/file/d/${fileId}/view`,
      // Method 5: Using the original webContentLink
      background.webContentLink,
    ];

    // Remove duplicates and return unique URLs
    return Array.from(new Set(urls));
  };

  const handleVideoError = (e: any) => {
    setVideoLoading(false);
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
      {/* Hidden file input for logo uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        style={{ display: 'none' }}
        disabled={uploadingLogo}
      />

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
                <button
                  className={styles.dialogClose}
                  onClick={() => {
                    setMenuOpen(false)
                    setUploadingLogo(false);
                    setLoadingBackgrounds(false);
                    setVideoLoading(false);
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

            <div className={styles.dialogContent}>
              {/* Left Column */}
              <div className={styles.leftColumn}>
                {/* Logo Upload Section */}
                <div className={styles.logoSection}>
                  <h3 className={styles.sectionTitle}>Logo</h3>
                  <div className={styles.logoContainer}>
                    {userLogo ? (
                      <div className={styles.logoPreview}>
                        <div className={styles.logoImageContainer}>
                          <img src={userLogo.url} alt="User Logo" className={styles.logoImage} />
                          <div className={styles.logoOverlay}>
                            <button
                              className={styles.changeLogoBtn}
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploadingLogo}
                              title="Change logo"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className={styles.logoInfo}>
                          <div className={styles.logoDetails}>
                            <span className={styles.logoName}>{userLogo.fileName}</span>
                          </div>
                          <div className={styles.logoActions}>
                            <button
                              className={styles.viewLogoBtn}
                              onClick={() => window.open(userLogo.url, '_blank')}
                              title="View full size"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                              </svg>
                            </button>
                            <button
                              className={styles.removeLogoBtn}
                              onClick={removeLogo}
                              disabled={uploadingLogo}
                              title="Remove logo"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.logoUploadArea}>
                        <label
                          className={styles.uploadLabel}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingLogo ? (
                            <div className={styles.uploadingState}>
                              <div className={styles.uploadingSpinner}></div>
                              <span className={styles.uploadingText}>Uploading...</span>
                            </div>
                          ) : (
                            <div className={styles.uploadContent}>
                              <div className={styles.uploadIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                              </div>
                              <div className={styles.uploadText}>
                                <span className={styles.uploadTitle}>Upload Logo</span>
                                <span className={styles.uploadSubtitle}>PNG, JPG, GIF up to 5MB</span>
                              </div>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Background Selection Section */}
                <div className={styles.backgroundSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Background</h3>
                    <button
                      className={styles.refreshBtn}
                      onClick={() => loadBackgrounds(true)}
                      disabled={loadingBackgrounds}
                      title="Refresh backgrounds"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                      </svg>
                    </button>
                  </div>
                  <div className={styles.backgroundContainer}>
                    {loadingBackgrounds ? (
                      <div className={styles.loadingText}>Loading backgrounds...</div>
                    ) : backgrounds.length === 0 ? (
                      <div className={styles.noBackgroundsMessage}>
                        <div className={styles.noBackgroundsIcon}>📁</div>
                        <div className={styles.noBackgroundsText}>
                          <p>No backgrounds found</p>
                          <p className={styles.noBackgroundsSubtext}>
                            Please check your Google Drive configuration or add background files to your Drive folder.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <select
                        className={styles.backgroundSelect}
                        value={selectedBackground?.id || ''}
                        onChange={(e) => {
                          const background = backgrounds.find(bg => bg.id === e.target.value);
                          if (background) {
                            handleBackgroundSelect(background);
                          }
                        }}
                      >
                        <option value="">Select a background</option>
                        {backgrounds.map((background) => (
                          <option key={background.id} value={background.id}>
                            {background.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedBackground && (
                      <div className={styles.selectedBackground}>
                        <div className={styles.backgroundVideoContainer}>
                          <video
                            className={styles.backgroundVideo}
                            controls
                            muted
                            loop
                            preload="metadata"
                            poster={selectedBackground.thumbnailLink || selectedBackground.webContentLink}
                            onLoadStart={handleVideoLoadStart}
                            onLoadedData={handleVideoLoad}
                            onError={handleVideoError}
                          >
                            {/* Try multiple URL formats for better compatibility */}
                            {getPlayableVideoUrl(selectedBackground).map((url, index) => (
                              <source key={index} src={url} type="video/mp4" />
                            ))}
                            {/* Fallback for different video formats */}
                            <source src={selectedBackground.webContentLink} type="video/webm" />
                            <source src={selectedBackground.webContentLink} type="video/ogg" />
                            Your browser does not support the video tag.
                          </video>

                          {videoLoading && (
                            <div className={styles.videoLoadingOverlay}>
                              <div className={styles.videoSpinner}></div>
                              <span className={styles.videoLoadingText}>Loading video...</span>
                            </div>
                          )}
                          <div className={styles.videoOverlay}>
                            <div className={styles.playButton}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className={styles.backgroundInfo}>
                          <span className={styles.backgroundName}>{selectedBackground.name}</span>
                          <span className={styles.backgroundType}>Video Background</span>
                          <div className={styles.videoActions}>
                            <div className={styles.videoMessage}>
                              <p>If video doesn't play, click the Play button to open in Google Drive</p>
                            </div>
                            <button
                              className={styles.drivePlayBtn}
                              onClick={() => window.open(selectedBackground.webViewLink, '_blank')}
                              title="Open video in Google Drive"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Play in Drive
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout Section */}
                <div className={styles.logoutSection}>
                  <button className={styles.logoutBtn} onClick={handleSignOut}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-12H12V3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7v-2h7V5z" />
                    </svg>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.rightColumn}>
                {/* Theme & Generation Section */}
                <div className={styles.generationSection}>
                  <h3 className={styles.sectionTitle}>Theme & Generation</h3>
                  <div className={styles.rowInputs}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Text mode</label>
                      <select className={styles.selectInput} value={textMode} onChange={(e) => setTextMode(e.target.value)}>
                        <option value="generate">generate</option>
                        <option value="condense">condense</option>
                        <option value="preserve">preserve</option>
                      </select>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Format</label>
                      <select className={styles.selectInput} value={format} onChange={(e) => setFormat(e.target.value)}>
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
                        }}
                      />
                    </div>
                    {/* <div className={styles.themeSelected}>Selected: <strong>{themeName}</strong></div> */}
                  </div>

                  <ThemeCards
                    themes={allThemes.filter(t => t.toLowerCase().includes(themeFilter.toLowerCase()))}
                    selected={themeName}
                    onSelect={(name) => setThemeName(name)}
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
                  <div className={styles.formActions}>
                    <button className={styles.saveBtn} onClick={saveKeys}>Save</button>
                    <button className={styles.cancelBtn} onClick={() => setMenuOpen(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div >
      )}
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
