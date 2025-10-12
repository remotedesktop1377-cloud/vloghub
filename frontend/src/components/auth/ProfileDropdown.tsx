'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './ProfileDropdown.module.css';
import { HelperFunctions } from '../../utils/helperFunctions';
import { SupabaseHelpers } from '../../utils/SupabaseHelpers';
import { useRouter } from 'next/navigation';

export const ProfileDropdown: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [socialKeys, setSocialKeys] = useState({ tiktok: '', instagram: '', facebook: '', youtube: '' });
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

  // // Load saved keys for this user
  // useEffect(() => {
  //   let mounted = true;
  //   (async () => {
  //     try {
  //       // Prefer DB keys if present, fall back to local secure storage
  //       const { data } = await SupabaseHelpers.getUserSocialAuthKeys(user.id);
  //       const local = HelperFunctions.getSocialAuthKeys(user.id);
  //       const merged = {
  //         tiktok: (data as any)?.tiktok_key ?? local.tiktok ?? '',
  //         instagram: (data as any)?.instagram_key ?? local.instagram ?? '',
  //         facebook: (data as any)?.facebook_key ?? local.facebook ?? '',
  //         youtube: (data as any)?.youtube_key ?? local.youtube ?? '',
  //       };
  //       if (mounted) setSocialKeys(merged as any);
  //     } catch {
  //       if (mounted) {
  //         const keys = HelperFunctions.getSocialAuthKeys(user.id);
  //         setSocialKeys({ tiktok: keys.tiktok || '', instagram: keys.instagram || '', facebook: keys.facebook || '', youtube: keys.youtube || '' });
  //       }
  //     }
  //   })();
  //   return () => { mounted = false; };
  // }, [user?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      setMenuOpen(false);
    }
  };

  const saveKeys = async () => {
    HelperFunctions.saveSocialAuthKeys(user.id, socialKeys); // local secure cache
    await SupabaseHelpers.saveUserSocialAuthKeys(user.id, socialKeys); // persist to DB
    setMenuOpen(false);
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
            {user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
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
                      src={user.user_metadata.avatar_url}
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
                  onClick={() => setMenuOpen(false)}
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
            
            <div className={styles.dialogSection}>
              <div className={styles.socialForm}>
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

            <div className={styles.dialogFooter}>
              <button className={`${styles.menuItem} ${styles.logout}`} onClick={handleSignOut}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 17l5-5-5-5v3H3v4h7v3zm9-12H12V3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7v-2h7V5z" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
