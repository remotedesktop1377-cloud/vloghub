export interface LanguageOption {
  value: string;
  label: string;
  code: string;
}

export const languageOptions: LanguageOption[] = [
  { value: 'english', label: 'English', code: 'en' },
  { value: 'urdu', label: 'اردو (Urdu)', code: 'ur' },
  { value: 'punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', code: 'pa' },
  { value: 'sindhi', label: 'سنڌي (Sindhi)', code: 'sd' },
  { value: 'pashto', label: 'پښتو (Pashto)', code: 'ps' },
  { value: 'balochi', label: 'بلوچی (Balochi)', code: 'bal' },
  { value: 'saraiki', label: 'سرائیکی (Saraiki)', code: 'skr' },
  { value: 'hindi', label: 'हिन्दी (Hindi)', code: 'hi' },
  { value: 'arabic', label: 'العربية (Arabic)', code: 'ar' },
  { value: 'persian', label: 'فارسی (Persian)', code: 'fa' },
  { value: 'turkish', label: 'Türkçe (Turkish)', code: 'tr' },
  { value: 'spanish', label: 'Español (Spanish)', code: 'es' },
  { value: 'french', label: 'Français (French)', code: 'fr' },
  { value: 'german', label: 'Deutsch (German)', code: 'de' },
  { value: 'chinese', label: '中文 (Chinese)', code: 'zh' },
  { value: 'japanese', label: '日本語 (Japanese)', code: 'ja' },
  { value: 'korean', label: '한국어 (Korean)', code: 'ko' },
  { value: 'russian', label: 'Русский (Russian)', code: 'ru' },
  { value: 'portuguese', label: 'Português (Portuguese)', code: 'pt' },
  { value: 'italian', label: 'Italiano (Italian)', code: 'it' },
];
