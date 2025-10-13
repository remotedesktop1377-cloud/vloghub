'use client';

import TrendingTopics from '@/components/TrendingTopicsComponent/TrendingTopicsPage';
import { useAuth } from '../../src/context/AuthContext'
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';

const TrendingTopicsRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppLoadingOverlay />
    );
  }

  if (!user) {
    window.location.replace('/');
  }

  // User is authenticated, show the enhanced trending topics with Supabase integration
  return <TrendingTopics />
}

export default TrendingTopicsRoute;