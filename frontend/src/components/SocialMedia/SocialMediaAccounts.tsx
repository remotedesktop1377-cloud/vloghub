'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Avatar,
    Chip,
    IconButton,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    YouTube,
    Instagram,
    Facebook,
    Twitter,
    LinkedIn,
    VideoLibrary,
    CheckCircle,
    Add,
    Delete,
} from '@mui/icons-material';
import { BACKGROUND, TEXT, PURPLE, SUCCESS, ERROR, NEUTRAL, SHADOW } from '../../styles/colors';
import { getSupabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import styles from './SocialMediaAccounts.module.css';
import { ROUTES_KEYS } from '@/data/constants';
import { API_ENDPOINTS } from '@/config/apiEndpoints';

interface SocialAccount {
    id: string;
    platform: string;
    username: string;
    displayName: string;
    avatar?: string;
    connected: boolean;
    connectedAt?: string;
    followers?: number;
    postsCount?: number;
    pagesList?: Array<{ pageId: string; pageName: string }>;
    selectedPageId?: string;
}

const platformConfig = {
    youtube: {
        name: 'YouTube',
        icon: YouTube,
        color: '#FF0000',
        gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    },
    // instagram: {
    //     name: 'Instagram',
    //     icon: Instagram,
    //     color: '#E4405F',
    //     gradient: 'linear-gradient(135deg, #E4405F 0%, #C13584 50%, #833AB4 100%)',
    // },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: '#1877F2',
        gradient: 'linear-gradient(135deg, #1877F2 0%, #0C63D4 100%)',
    },
    // tiktok: {
    //     name: 'TikTok',
    //     icon: VideoLibrary,
    //     color: '#000000',
    //     gradient: 'linear-gradient(135deg, #000000 0%, #FF0050 50%, #00F2EA 100%)',
    // },
};

const mockAccounts: SocialAccount[] = [
    {
        id: '1',
        platform: 'youtube',
        username: '@vloghub',
        displayName: 'VlogHub Channel',
        connected: false,
        connectedAt: '2024-01-15',
        followers: 12500,
        postsCount: 234,
    },
    {
        id: '2',
        platform: 'instagram',
        username: '@vloghub',
        displayName: 'VlogHub',
        connected: false,
        connectedAt: '2024-01-20',
        followers: 8900,
        postsCount: 156,
    },
    {
        id: '3',
        platform: 'facebook',
        username: 'vloghub',
        displayName: 'VlogHub',
        connected: false,
    },
    {
        id: '4',
        platform: 'tiktok',
        username: '@vloghub',
        displayName: 'VlogHub',
        connected: false,
    },
];

export default function SocialMediaAccounts() {
    const { data: session } = useSession();
    const user = session?.user as any;
    const router = useRouter();
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<SocialAccount[]>(mockAccounts);
    const [loading, setLoading] = useState(false);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
    const [updatingPage, setUpdatingPage] = useState<string | null>(null);
    const [localSelectedPageId, setLocalSelectedPageId] = useState<Record<string, string>>({});

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'youtube_connected') {
            toast.success('YouTube account connected successfully!');
            router.replace(ROUTES_KEYS.DASHBOARD);
            loadAccounts();
        } else if (success === 'facebook_connected') {
            toast.success('Facebook account connected successfully!');
            router.replace(ROUTES_KEYS.DASHBOARD);
            loadAccounts();
        } else if (error) {
            toast.error(`Connection failed: ${error}`);
            router.replace(ROUTES_KEYS.DASHBOARD);
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (user) {
            loadAccounts();
        }
    }, [user]);

    const loadAccounts = async () => {
        if (!user || !user.email) return;

        try {
            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            let profileUuid: string | null = null;
            const profileResult: any = await supabaseAny
                .from('profiles')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();
            
            if (profileResult?.data && !profileResult?.error) {
                profileUuid = profileResult.data.id;
            }

            if (!profileUuid) {
                console.log('Error: Could not find user profile UUID for email:', user.email);
                return;
            }

            // Load social accounts
            const socialRes = await supabaseAny
                .from('social_accounts')
                .select('platform, channel_id, channel_name, created_at, connected, oauth_tokens')
                .eq('user_id', profileUuid);

            if (socialRes.error && socialRes.error.code !== 'PGRST116') {
                console.log('Error loading social accounts:', socialRes.error);
            }

            const socialAccounts = Array.isArray(socialRes.data) ? socialRes.data : [];
            let nextAccounts = accounts;

            socialAccounts.forEach((sa: any) => {
                let avatarUrl: string | undefined;

                if (sa.platform === 'youtube' && sa.oauth_tokens?.channel_info?.thumbnail) {
                    avatarUrl = sa.oauth_tokens.channel_info.thumbnail;
                } else if (sa.platform === 'facebook' && sa.oauth_tokens?.user_info?.picture?.data?.url) {
                    avatarUrl = sa.oauth_tokens.user_info.picture.data.url;
                }

                const facebookPagesList = sa.platform === 'facebook' && sa.oauth_tokens?.pages_list
                    ? sa.oauth_tokens.pages_list.map((page: any) => ({
                        pageId: page.pageId,
                        pageName: page.pageName,
                    }))
                    : undefined;

                nextAccounts = nextAccounts.map((acc) =>
                    acc.platform === sa.platform
                        ? {
                            ...acc,
                            connected: sa.connected,
                            displayName: sa.channel_name || acc.displayName,
                            username: sa.channel_id ? `@${sa.channel_id}` : acc.username,
                            connectedAt: sa.created_at || new Date().toISOString(),
                            followers: sa.oauth_tokens?.channel_info?.subscriberCount
                                ? parseInt(sa.oauth_tokens.channel_info.subscriberCount)
                                : undefined,
                            postsCount: sa.oauth_tokens?.channel_info?.videoCount
                                ? parseInt(sa.oauth_tokens.channel_info.videoCount)
                                : undefined,
                            channelId: sa.channel_id || undefined,
                            avatar: avatarUrl,
                            pagesList: facebookPagesList,
                            selectedPageId: sa.platform === 'facebook' ? (sa.oauth_tokens?.selected_page_id || sa.channel_id) : undefined,
                        }
                        : acc,
                );
            });

            setAccounts(nextAccounts);
        } catch (error) {
            console.log('Error loading accounts:', error);
        }
    };

    const handleConnect = async (platform: string) => {
        if (!user) {
            toast.error('Please sign in to connect social media accounts');
            return;
        }

        if (platform === 'youtube') {
            setConnectingPlatform('youtube');
            setLoading(true);
            try {
                const response = await fetch(`${API_ENDPOINTS.YOUTUBE_OAUTH_INITIATE}?userId=${user.id}`);
                const data = await response.json();
                console.log('data: ', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to initiate OAuth');
                }

                window.location.href = data.authUrl;
            } catch (error: any) {
                toast.error(error.message || 'Failed to connect YouTube');
                setConnectingPlatform(null);
                setLoading(false);
            }
        } else if (platform === 'facebook') {
            setConnectingPlatform('facebook');
            setLoading(true);
            try {
                const response = await fetch(`${API_ENDPOINTS.FACEBOOK_OAUTH_INITIATE}?userId=${user.id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to initiate OAuth');
                }

                window.location.href = data.authUrl;
            } catch (error: any) {
                toast.error(error.message || 'Failed to connect Facebook');
                setConnectingPlatform(null);
                setLoading(false);
            }
        } else {
            toast.info(`${platformConfig[platform as keyof typeof platformConfig]?.name || platform} connection coming soon!`);
        }
    };

    const handleDisconnect = async (platform: string) => {
        if (!user || !user.email) return;

        try {
            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            let profileUuid: string | null = null;
            const profileResult: any = await supabaseAny
                .from('profiles')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();
            
            if (profileResult?.data && !profileResult?.error) {
                profileUuid = profileResult.data.id;
            }

            if (!profileUuid) {
                toast.error('User profile not found');
                return;
            }

            const { error } = await (supabaseAny.from('social_accounts') as any)
                .update({
                    connected: false,
                })
                .eq('user_id', profileUuid)
                .eq('platform', platform);

            if (error) {
                throw error;
            }

            setAccounts((prev) =>
                prev.map((acc) =>
                    acc.platform === platform
                        ? {
                            ...acc,
                            connected: false,
                        }
                        : acc,
                ),
            );

            toast.success(`${platform === 'youtube' ? 'YouTube' : platform === 'facebook' ? 'Facebook' : 'Account'} account disconnected successfully`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to disconnect account');
        }
    };

    const handlePageChange = async (platform: string, pageId: string, currentSelectedPageId?: string) => {
        if (!user) {
            toast.error('Please sign in to change page');
            return;
        }

        if (platform !== 'facebook') return;

        if (pageId === currentSelectedPageId) {
            return;
        }

        setLocalSelectedPageId(prev => ({ ...prev, [platform]: pageId }));
        setUpdatingPage(pageId);
        try {
            const response = await fetch(API_ENDPOINTS.FACEBOOK_SELECT_PAGE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    pageId: pageId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change page');
            }

            toast.success('Page changed successfully');
            await loadAccounts();
            setLocalSelectedPageId(prev => {
                const newState = { ...prev };
                delete newState[platform];
                return newState;
            });
        } catch (error: any) {
            toast.error(error.message || 'Failed to change page');
            setLocalSelectedPageId(prev => {
                const newState = { ...prev };
                delete newState[platform];
                return newState;
            });
        } finally {
            setUpdatingPage(null);
        }
    };

    return (
        <Box>
            <Grid container spacing={3}>
                {accounts.map((account) => {
                    const config = platformConfig[account.platform as keyof typeof platformConfig];

                    if (!config) {
                        return null;
                    }

                    const IconComponent = config.icon;

                    return (
                        <Grid item xs={12} sm={6} md={6} key={account.id}>
                            <Card
                                sx={{
                                    bgcolor: BACKGROUND.secondary,
                                    border: `1px solid ${account.connected ? SUCCESS.main : NEUTRAL.gray[700]}`,
                                    borderRadius: 3,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: `0 8px 24px ${SHADOW.primary}`,
                                        borderColor: account.connected ? SUCCESS.light : PURPLE.main,
                                    },
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar
                                                src={(account.platform === 'youtube' || account.platform === 'facebook') && account.connected && account.avatar ? account.avatar : undefined}
                                                sx={{
                                                    bgcolor: config.color,
                                                    width: 56,
                                                    height: 56,
                                                }}
                                            >
                                                {(!account.avatar || ((account.platform !== 'youtube' && account.platform !== 'facebook') || !account.connected)) && (
                                                    <IconComponent sx={{ fontSize: '32px' }} />
                                                )}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                                                    {config.name}
                                                </Typography>
                                                {account.connected && (
                                                    <Typography variant="body2" sx={{ color: TEXT.secondary, fontSize: '0.85rem' }}>
                                                        {account.username}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        {account.connected && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<Delete />}
                                                onClick={() => handleDisconnect(account.platform)}
                                                sx={{
                                                    borderColor: ERROR.main,
                                                    color: ERROR.main,
                                                    '&:hover': {
                                                        borderColor: ERROR.light,
                                                        bgcolor: `${ERROR.main}20`,
                                                    },
                                                }}
                                            >
                                                Disconnect
                                            </Button>
                                        )}

                                    </Box>

                                    {account.connected ? (
                                        <>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 0.5 }}>
                                                    Channel: {account.displayName || 'Unknown'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: TEXT.secondary, mb: 1 }}>
                                                    Connected on:{' '}
                                                    {account.connectedAt
                                                        ? new Date(account.connectedAt).toLocaleString()
                                                        : 'Just now'}
                                                </Typography>
                                                {account.platform === 'facebook' && account.pagesList && account.pagesList.length > 1 && (
                                                    <Box className={styles.pagesCapsules}>
                                                        {account.pagesList.map((page) => {
                                                            const effectiveSelectedId =
                                                                localSelectedPageId[account.platform] || account.selectedPageId || account.pagesList?.[0]?.pageId || '';
                                                            const isActive = effectiveSelectedId === page.pageId;

                                                            return (
                                                                <button
                                                                    key={page.pageId}
                                                                    type="button"
                                                                    disabled={updatingPage !== null}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePageChange(account.platform, page.pageId, account.selectedPageId);
                                                                    }}
                                                                    className={
                                                                        isActive
                                                                            ? `${styles.pageCapsule} ${styles.pageCapsuleActive}`
                                                                            : styles.pageCapsule
                                                                    }
                                                                >
                                                                    {page.pageName}
                                                                </button>
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            </Box>

                                        </>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            startIcon={connectingPlatform === account.platform ? <CircularProgress size={20} sx={{ color: TEXT.primary }} /> : <Add />}
                                            onClick={() => handleConnect(account.platform)}
                                            disabled={loading || connectingPlatform === account.platform}
                                            sx={{
                                                mt: 2,
                                                background: config.gradient,
                                                color: TEXT.primary,
                                                fontWeight: 600,
                                                py: 1.5,
                                                '&:hover': {
                                                    opacity: 0.9,
                                                    transform: 'scale(1.02)',
                                                },
                                                '&:disabled': {
                                                    opacity: 0.6,
                                                },
                                            }}
                                        >
                                            {connectingPlatform === account.platform ? 'Connecting...' : `Connect ${config.name}`}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
}

