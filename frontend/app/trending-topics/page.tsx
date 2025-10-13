'use client';

import TrendingTopics from '@/components/TrendingTopicsComponent/TrendingTopicsPage';
import { useAuth } from '../../src/context/AuthContext'
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';
import { ROUTES_KEYS } from '@/data/constants';

const TrendingTopicsRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLoadingOverlay />
    );
  }

  if (!user) {
    window.location.replace(ROUTES_KEYS.HOME);
  }

  // User is authenticated, show the enhanced trending topics with Supabase integration
  return <TrendingTopics />
}

export default TrendingTopicsRoute;