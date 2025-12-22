'use client';

import TrendingTopics from '@/components/TrendingTopicsComponent/TrendingTopicsPage';
import { useSession } from 'next-auth/react';
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';
import { ROUTES_KEYS } from '@/data/constants';

const TrendingTopicsRoute = () => {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <AppLoadingOverlay />
    );
  }

  if (!session) {
    if (typeof window !== 'undefined') {
      window.location.replace(ROUTES_KEYS.HOME);
    }
    return <AppLoadingOverlay />;
  }

  // User is authenticated, show the enhanced trending topics with Supabase integration
  return <TrendingTopics />
}

export default TrendingTopicsRoute;