'use client';

import { TrendingTopicsWithSupabase } from '../../src/components/TrendingTopicsComponent/TrendingTopicsWithSupabase'
import { useAuth } from '../../src/context/AuthContext'
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';

const TrendingTopicsPage = () => {
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
  return <TrendingTopicsWithSupabase />
}

export default TrendingTopicsPage;