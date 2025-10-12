export interface TrendingTopic {
  id: string;
  topic: string;
  location?: string;
  date_range?: string;
  related_keywords?: string[];
  category: string;
  value: number;
  timestamp: string;
  description?: string;
  source_reference?: string;
  engagement_count?: number;
}