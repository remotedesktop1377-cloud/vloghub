'use client';

import React, { useState, useEffect } from 'react';
import TrendingTopicsPage from './TrendingTopicsPage';
import { SupabaseIntegration, useSupabaseIntegration } from './SupabaseIntegration';
import { TrendingTopic } from '../../types/TrendingTopics';
import { useAuth } from '../../context/AuthContext';
import './TrendingTopicsWithSupabase.module.css';

export const TrendingTopicsWithSupabase: React.FC = () => {
  const { user } = useAuth();
  const { saveTrendingTopics, saveSearch, getSearchHistory } = useSupabaseIntegration();
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [currentTopics, setCurrentTopics] = useState<TrendingTopic[]>([]);

  useEffect(() => {
    if (user) {
      loadSearchHistory();
    }
  }, [user]);

  const loadSearchHistory = async () => {
    const { data } = await getSearchHistory(10);
    if (data) {
      setSearchHistory(data);
    }
  };

  // Note: These handlers would be used if the TrendingTopicsPage component supported callbacks
  // For now, we'll integrate Supabase functionality through the SupabaseIntegration component

  return (
    <div className="trending-topics-with-supabase">
      {/* Main trending topics component */}
      <TrendingTopicsPage />
    </div>
  );
};
