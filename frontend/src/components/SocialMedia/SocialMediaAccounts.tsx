'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useAuth } from '../../context/AuthContext';
import { getSupabase } from '../../utils/supabase';
import { toast } from 'react-toastify';
import styles from './SocialMediaAccounts.module.css';
import { ROUTES_KEYS } from '@/data/constants';

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
}

const platformConfig = {
    youtube: {
        name: 'YouTube',
        icon: YouTube,
        color: '#FF0000',
        gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: '#E4405F',
        gradient: 'linear-gradient(135deg, #E4405F 0%, #C13584 50%, #833AB4 100%)',
    },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: '#1877F2',
        gradient: 'linear-gradient(135deg, #1877F2 0%, #0C63D4 100%)',
    },
    tiktok: {
        name: 'TikTok',
        icon: VideoLibrary,
        color: '#000000',
        gradient: 'linear-gradient(135deg, #000000 0%, #FF0050 50%, #00F2EA 100%)',
    },
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
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [accounts, setAccounts] = useState<SocialAccount[]>(mockAccounts);
    const [loading, setLoading] = useState(false);
    const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'youtube_connected') {
            toast.success('YouTube account connected successfully!');
            router.replace(ROUTES_KEYS.SOCIAL_MEDIA);
            loadAccounts();
        } else if (error) {
            toast.error(`Connection failed: ${error}`);
            router.replace(ROUTES_KEYS.SOCIAL_MEDIA);
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (user) {
            loadAccounts();
        }
    }, [user]);

    const loadAccounts = async () => {
        if (!user) return;

        try {
            const supabase = getSupabase();
            const supabaseAny: any = supabase;

            // Load social accounts
            const socialRes = await supabaseAny
                .from('social_accounts')
                .select('platform, channel_id, channel_name, created_at, connected, oauth_tokens')
                .eq('user_id', user.id);

            if (socialRes.error && socialRes.error.code !== 'PGRST116') {
                console.error('Error loading social accounts:', socialRes.error);
            }

            const socialAccounts = Array.isArray(socialRes.data) ? socialRes.data : [];
            let nextAccounts = accounts;

            socialAccounts.forEach((sa: any) => {
                let avatarUrl: string | undefined;

                // For YouTube, extract thumbnail from oauth_tokens.channel_info
                if (sa.platform === 'youtube' && sa.oauth_tokens?.channel_info?.thumbnail) {
                    avatarUrl = sa.oauth_tokens.channel_info.thumbnail;
                }

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
                        }
                        : acc,
                );
            });

            setAccounts(nextAccounts);
        } catch (error) {
            console.error('Error loading accounts:', error);
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
                const response = await fetch(`/api/youtube-oauth/initiate?userId=${user.id}`);
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
        } else {
            toast.info(`${platformConfig[platform as keyof typeof platformConfig]?.name || platform} connection coming soon!`);
        }
    };

    const handleDisconnect = async (platform: string) => {
        if (!user) return;

        try {
            const supabase = getSupabase();
            const { error } = await (supabase.from('social_accounts') as any)
                .update({
                    connected: false,
                })
                .eq('user_id', user.id)
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

            toast.success('YouTube account disconnected successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to disconnect account');
        }
    };

    const formatNumber = (num?: number) => {
        if (!num) return 'N/A';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
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
                                                src={account.platform === 'youtube' && account.connected && account.avatar ? account.avatar : undefined}
                                                sx={{
                                                    bgcolor: config.color,
                                                    width: 56,
                                                    height: 56,
                                                }}
                                            >
                                                {(!account.avatar || account.platform !== 'youtube' || !account.connected) && (
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
                                                {/* <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                                                            {formatNumber(account.followers)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: TEXT.secondary }}>
                                                            Followers
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ color: TEXT.primary, fontWeight: 600 }}>
                                                            {formatNumber(account.postsCount)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: TEXT.secondary }}>
                                                            Posts
                                                        </Typography>
                                                    </Box>
                                                </Box> */}
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

