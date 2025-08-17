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

export const mockTrendingTopics: TrendingTopic[] = [
  {
    "id": "1",
    "category": "#PakistanHameshaZindabad",
    "topic": "Only on X · Trending",
    "value": 20,
    "timestamp": "2025-08-13T13:30:29.306Z",
    "description": "Popular patriotic hashtag trending across Pakistani social media celebrating national pride and unity",
    "source_reference": "Twitter, Instagram, TikTok",
    "engagement_count": 1850000
  },
  {
    "id": "2",
    "category": "#14AugustBalochistanKeSang",
    "topic": "#14AugustBalochistanKeSang",
    "value": 19,
    "timestamp": "2025-08-13T13:30:29.306Z",
    "description": "Balochistan-specific Independence Day celebrations highlighting the province's culture and heritage",
    "source_reference": "Twitter, Regional Media",
    "engagement_count": 1650000
  },
  {
    "id": "3",
    "category": "#آزادی_بھی_قید_میں_ہے",
    "topic": "#آزادی_بھی_قید_میں_ہے",
    "value": 18,
    "timestamp": "2025-08-13T13:30:29.306Z",
    "description": "Political discourse about freedom and current state of democracy in Pakistan",
    "source_reference": "Twitter, Political Forums",
    "engagement_count": 1420000
  },
  {
    "id": "4",
    "category": "Pakistan",
    "topic": "Sir Abdullah Haroon",
    "value": 17,
    "timestamp": "2025-08-13T13:30:29.306Z"
  },
  {
    "id": "5",
    "category": "#حقیقی_آزادی_کی_تحریک",
    "topic": "#حقیقی_آزادی_کی_تحریک",
    "value": 16,
    "timestamp": "2025-08-13T13:30:29.306Z"
  },
  {
    "id": "6",
    "category": "#BajaurUnderStateAttack",
    "topic": "#BajaurUnderStateAttack",
    "value": 15,
    "timestamp": "2025-08-13T13:30:29.306Z"
  },
  {
    "id": "7",
    "category": "Pakistan",
    "topic": "Shai Hope",
    "value": 14,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "8",
    "category": "Pakistan",
    "topic": "Quaid-e-Azam",
    "value": 13,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "9",
    "category": "Pakistan",
    "topic": "bla and majeed brigade",
    "value": 12,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "10",
    "category": "Pakistan",
    "topic": "Jayden Seales",
    "value": 11,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "11",
    "category": "Pakistan",
    "topic": "governor house sindh",
    "value": 10,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "12",
    "category": "Pakistan",
    "topic": "Rizwan",
    "value": 9,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "13",
    "category": "Pakistan",
    "topic": "governor kamran tessori",
    "value": 8,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "14",
    "category": "Pakistan",
    "topic": "kaifi khalil",
    "value": 7,
    "timestamp": "2025-08-13T13:30:29.307Z"
  },
  {
    "id": "15",
    "category": "Pakistan",
    "topic": "hasan raheem",
    "value": 6,
    "timestamp": "2025-08-13T13:30:29.308Z"
  },
  {
    "id": "16",
    "category": "Pakistan",
    "topic": "Caa2",
    "value": 5,
    "timestamp": "2025-08-13T13:30:29.308Z"
  },
  {
    "id": "17",
    "category": "",
    "topic": "West Indies",
    "value": 4,
    "timestamp": "2025-08-13T13:30:29.308Z"
  },
  {
    "id": "18",
    "category": "",
    "topic": "Mumbai Indians · Trending",
    "value": 3,
    "timestamp": "2025-08-13T13:30:29.308Z"
  },
  {
    "id": "19",
    "category": "Pakistan",
    "topic": "3rd odi",
    "value": 2,
    "timestamp": "2025-08-13T13:30:29.308Z"
  },
  {
    "id": "20",
    "category": "Pakistan",
    "topic": "Taylor",
    "value": 1,
    "timestamp": "2025-08-13T13:30:29.308Z"
  }
].sort((a, b) => b.value - a.value); 