'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupabaseHelpers } from '../../utils/SupabaseHelpers';
import { TrendingTopic } from '../../types/TrendingTopics';
import { Database } from '../../types/database';
import { AuthModal } from '../auth/AuthModal';

type SupabaseTrendingTopic = Database['public']['Tables']['trending_topics']['Row'];

interface SupabaseIntegrationProps {
  onTopicsLoaded?: (topics: TrendingTopic[]) => void;
  filters?: {
    category?: string;
    location?: string;
    date_range?: string;
    limit?: number;
  };
}

export const SupabaseIntegration: React.FC<SupabaseIntegrationProps> = ({
  onTopicsLoaded,
  filters = {}
}) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedTopics, setSavedTopics] = useState<SupabaseTrendingTopic[]>([]);

  useEffect(() => {
    if (user) {
      loadTrendingTopics();
    }
  }, [user, filters]);

  const loadTrendingTopics = async () => {
    setLoading(true);
    try {
      const { data, error } = await SupabaseHelpers.getTrendingTopics(filters);
      if (data) {
        setSavedTopics(data);
        
        // Convert Supabase topics to your existing TrendingTopic format
        const convertedTopics: TrendingTopic[] = data.map((topic: any) => ({
          id: topic.id,
          topic: topic.topic,
          category: topic.category,
          value: topic.value ?? topic.search_volume ?? 0,
          timestamp: topic.timestamp ?? topic.created_at,
          description: topic.description ?? undefined,
          source_reference: topic.source_reference ?? undefined,
          engagement_count: topic.engagement_count ?? undefined,
          // UI model may include these optionally
          // Keep backward compatibility
          ...(
            topic.location || topic.search_volume || topic.date_range || topic.related_keywords
              ? {
                  location: topic.location ?? undefined,
                  searchVolume: topic.search_volume ?? undefined,
                  dateRange: topic.date_range ?? undefined,
                  relatedKeywords: topic.related_keywords ?? undefined,
                }
              : {}
          )
        }));

        if (onTopicsLoaded) {
          onTopicsLoaded(convertedTopics);
        }
      }
    } catch (error) {
      console.error('Error loading trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearchHistory = async (query: string, resultsCount: number = 0) => {
    if (!user) return;

    try {
      const searchData: Database['public']['Tables']['search_history']['Insert'] = {
        user_id: user.id,
        query,
        filters: filters as any,
        results_count: resultsCount,
      };

      await SupabaseHelpers.saveSearchHistory(searchData);
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="supabase-integration">
      {!user && (
        <div className="auth-prompt">
          <p>Sign in to save your trending topics and search history</p>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="btn btn-primary"
          >
            Sign In
          </button>
        </div>
      )}

      {user && (
        <div className="user-features">
          <div className="saved-topics-info">
            <p>You have {savedTopics.length} saved trending topics</p>
            {loading && <span>Loading...</span>}
          </div>
          
          <div className="actions">
            <button 
              onClick={loadTrendingTopics}
              disabled={loading}
              className="btn btn-secondary"
            >
              Refresh Topics
            </button>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />

      <style jsx>{`
        .supabase-integration {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          background: #f9fafb;
        }

        .auth-prompt {
          text-align: center;
          padding: 20px;
        }

        .auth-prompt p {
          margin-bottom: 16px;
          color: #6b7280;
        }

        .user-features {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .saved-topics-info {
          color: #374151;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background-color: #e5e7eb;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (prefers-color-scheme: dark) {
          .supabase-integration {
            background: #1f2937;
            border-color: #374151;
          }

          .auth-prompt p,
          .saved-topics-info {
            color: #9ca3af;
          }

          .btn-secondary {
            background-color: #374151;
            color: #d1d5db;
            border-color: #4b5563;
          }

          .btn-secondary:hover {
            background-color: #4b5563;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for easy integration with existing components
export const useSupabaseIntegration = () => {
  const { user } = useAuth();

  const saveSearch = async (query: string, filters: any = {}, resultsCount: number = 0) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const searchData: Database['public']['Tables']['search_history']['Insert'] = {
        user_id: user.id,
        query,
        filters,
        results_count: resultsCount,
      };

      const result = await SupabaseHelpers.saveSearchHistory(searchData);
      return result;
    } catch (error) {
      return { error };
    }
  };

  const getSearchHistory = async (limit: number = 20) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      const result = await SupabaseHelpers.getSearchHistory(user.id, limit);
      return result;
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    saveSearch,
    getSearchHistory,
  };
};
