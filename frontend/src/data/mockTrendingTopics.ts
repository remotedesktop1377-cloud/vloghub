export interface TrendingTopic {
  id: string;
  category: string;
  topic: string;
  value: number;
  timestamp: string;
  description?: string;
  source_reference?: string;
  engagement_count?: number;
}