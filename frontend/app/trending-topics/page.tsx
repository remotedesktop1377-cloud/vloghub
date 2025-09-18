'use client';

import { TrendingTopicsWithSupabase } from '../../src/components/TrendingTopicsComponent/TrendingTopicsWithSupabase'
import { useAuth } from '../../src/context/AuthContext'
import { useRouter } from 'next/navigation'
import AppLoadingOverlay from '@/components/ui/loadingView/AppLoadingOverlay';

const TrendingTopicsPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <AppLoadingOverlay />
    );
  }

  if (!user) {
    router.push('/');
  }

  // User is authenticated, show the enhanced trending topics with Supabase integration
  return <TrendingTopicsWithSupabase />
}

export default TrendingTopicsPage;