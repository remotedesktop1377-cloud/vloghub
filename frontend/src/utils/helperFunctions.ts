import { TrendingTopic } from '../data/mockTrendingTopics';
import { Chapter } from '../types/chapters';
import { DropResult } from 'react-beautiful-dnd';
export const cn = (...classes: Array<string | false | null | undefined>): string => {
  return classes.filter(Boolean).join(' ');
};

export class HelperFunctions {
  /**
   * Format tweet volume numbers to human-readable format
   */
  static formatTweetVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  /**
   * Get trending color based on ranking index
   */
  static getTrendingColor(index: number): string {
    if (index === 0) return '#FFD700'; // Gold for #1
    if (index === 1) return '#C0C0C0'; // Silver for #2
    if (index === 2) return '#CD7F32'; // Bronze for #3
    return '#4A90E2'; // Blue for others
  }

  /**
   * Get category from topic name
   */
  static getCategoryFromTopic(topicName: string): string {
    const name = topicName.toLowerCase();
    if (name.includes('pakistan') || name.includes('pak')) return 'Pakistan';
    if (name.includes('cricket') || name.includes('odi') || name.includes('test')) return 'Sports';
    if (name.includes('politics') || name.includes('election')) return 'Politics';
    if (name.includes('economy') || name.includes('finance')) return 'Economy';
    if (name.includes('technology') || name.includes('tech')) return 'Technology';
    if (name.includes('entertainment') || name.includes('movie')) return 'Entertainment';
    return 'General';
  }

  /**
   * Handle drag and drop reordering of chapters
   */
  static handleDragEnd(
    result: DropResult,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void
  ): void {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    const updatedChapters = Array.from(chapters);
    const [reorderedChapter] = updatedChapters.splice(source.index, 1);
    updatedChapters.splice(destination.index, 0, reorderedChapter);

    setChapters(updatedChapters);
  }

  /**
   * Add a new chapter after a specific index
   */
  static addChapterAfter(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void
  ): void {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      narration: '',
      duration: '',
      words: 0,
      startTime: 0,
      endTime: 0,
      durationInSeconds: 0,
      assets: {
        image: null,
        audio: null,
        video: null,
      }
    }

    const updatedChapters = [...chapters];
    updatedChapters.splice(index + 1, 0, newChapter);
    setChapters(updatedChapters);
  }

  /**
   * Delete a chapter at a specific index
   */
  static deleteChapter(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void
  ): void {
    const updatedChapters = chapters.filter((_, i) => i !== index);
    setChapters(updatedChapters);
  }

  /**
   * Save edited chapter
   */
  static saveEdit(
    index: number,
    chapters: Chapter[],
    setChapters: (chapters: Chapter[]) => void,
    editHeading: string,
    editNarration: string,
    setEditingChapter: (index: number | null) => void
  ): void {
    const updatedChapters = [...chapters];

    updatedChapters[index] = {
      ...updatedChapters[index],
      // update the model change here as well
      duration: updatedChapters[index].duration,
      assets: updatedChapters[index].assets,
    };
    setChapters(updatedChapters);
    setEditingChapter(null);
  }

  /**
   * Cancel chapter editing
   */
  static cancelEdit(
    setEditingChapter: (index: number | null) => void,
    setEditHeading: (heading: string) => void,
    setEditNarration: (narration: string) => void
  ): void {
    setEditingChapter(null);
    setEditHeading('');
    setEditNarration('');
  }

  /**
   * Handle word click from word cloud
   */
  static handleWordClick(
    word: any,
    trendingTopics: TrendingTopic[],
    onTopicSelect: (topic: TrendingTopic) => void
  ): void {
    const wordText = (word && word.text) || '';
    const hit = trendingTopics.find(t => t.topic === wordText);
    if (hit) onTopicSelect(hit);
  }

  /**
   * Download image as file
   */
  static downloadImage(src: string, index: number): void {
    const a = document.createElement('a');
    a.href = src;
    a.download = `image-${index + 1}.png`;
    a.click();
  }

  /**
   * Trigger file upload input click
   */
  static triggerFileUpload(): void {
    const el = document.getElementById('upload-input');
    el?.click();
  }

  /**
   * Generate fallback topic suggestions
   */
  static generateFallbackTopicSuggestions(topicName: string, region: string): string[] {
    return [
      `The hidden story behind ${topicName} that nobody talks about`,
      `How ${topicName} is changing the landscape in ${region}`,
      `The controversy surrounding ${topicName} - what you need to know`,
      `5 surprising facts about ${topicName} that will shock you`,
      `Why ${topicName} matters more than you think`
    ];
  }

  /**
   * Generate fallback hypothesis suggestions
   */
  static generateFallbackHypothesisSuggestions(topicName: string, region: string): string[] {
    return [
      `Exploring the real-world impact of ${topicName} in ${region}.`,
      `Does public perception of ${topicName} match data in ${region}?`,
      `How ${topicName} narratives differ across communities in ${region}.`,
      `Is policy or culture driving ${topicName} outcomes in ${region}?`,
      `Is ${topicName} momentum sustainable or a short-term spike?`
    ];
  }

  /**
   * Get chapter duration in seconds
   */
  static getChapterDurationInSeconds(duration: string): number {
    const match = duration.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      return minutes * 60 + seconds;
    }
    return 0;
  }

  /**
   * Format duration from seconds to MM:SS format
   */
  static formatDurationFromSeconds(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate total duration of all chapters
   */
  static calculateTotalDuration(chapters: Chapter[]): string {
    const totalSeconds = chapters.reduce((total, chapter) => {
      return total + this.getChapterDurationInSeconds(chapter.duration);
    }, 0);
    return this.formatDurationFromSeconds(totalSeconds);
  }

  /**
   * Filter topics by search term
   */
  static filterTopicsBySearch(topics: TrendingTopic[], searchTerm: string): TrendingTopic[] {
    if (!searchTerm.trim()) return topics;

    const term = searchTerm.toLowerCase();
    return topics.filter(topic =>
      topic.topic.toLowerCase().includes(term) ||
      topic.category.toLowerCase().includes(term) ||
      (topic.description?.toLowerCase().includes(term) ?? false) ||
      (topic.source_reference?.toLowerCase().includes(term) ?? false)
    );

    return topics.filter(topic =>
      topic.topic.toLowerCase().includes(term) ||
      topic.category.toLowerCase().includes(term) ||
      (topic.description?.toLowerCase().includes(term) ?? false) ||
      (topic.source_reference?.toLowerCase().includes(term) ?? false)
    );
  }

  /**
   * Sort topics by various criteria
   */
  static sortTopics(topics: TrendingTopic[], sortBy: 'ranking' | 'postCount' | 'category'): TrendingTopic[] {
    const sortedTopics = [...topics];
    // Fix: Add missing ranking and postCountValue properties to topics for sorting
    // According to the TrendingTopic interface, there is no 'ranking' or 'postCountValue' property.
    // We'll use 'value' as the ranking/post count for sorting.
    switch (sortBy) {
      case 'ranking':
        // Use 'value' as the ranking for sorting (descending order: higher value = higher ranking)
        return sortedTopics.sort((a, b) => b.value - a.value);
      case 'postCount':
        // Use 'engagement_count' as the post count for sorting (descending order)
        return sortedTopics.sort(
          (a, b) => (b.engagement_count || 0) - (a.engagement_count || 0)
        );
      case 'category':
        return sortedTopics.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sortedTopics;
    }
  }

  /**
   * Calculate estimated duration based on script content (average reading speed: 150-160 words per minute)
   */
  static calculateDuration(script: string): string {
    if (!script.trim()) return '0';

    const words = script.trim().split(/\s+/).length;
    const averageWordsPerMinute = 155; // Average speaking/reading speed
    const minutes = words / averageWordsPerMinute;

    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    } else if (minutes < 60) {
      const wholeMinutes = Math.floor(minutes);
      const seconds = Math.round((minutes - wholeMinutes) * 60);
      return seconds > 0 ? `${wholeMinutes}m ${seconds}s` : `${wholeMinutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Format time range as mm:ss - mm:ss
   */
  static formatTimeRange(startSeconds: number, endSeconds: number): string {
    const toMMSS = (totalSeconds: number) => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${mm}:${ss}`;
    };

    return `${toMMSS(startSeconds)} - ${toMMSS(endSeconds)}`;
  }

  /**
   * Format total duration from seconds
   */
  static formatTotalDuration(totalSeconds: number): string {
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  /**
   * Calculate duration for a single paragraph
   */
  static calculateParagraphDuration(words: number): string {
    if (words === 0) return '0s';

    const averageWordsPerMinute = 155;
    const minutes = words / averageWordsPerMinute;

    if (minutes < 1) {
      const seconds = Math.round(minutes * 60);
      return `${seconds}s`;
    } else if (minutes < 60) {
      const wholeMinutes = Math.floor(minutes);
      const seconds = Math.round((minutes - wholeMinutes) * 60);
      return seconds > 0 ? `${wholeMinutes}m ${seconds}s` : `${wholeMinutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Helper function to parse duration string to seconds
   */
  static parseDurationToSeconds(duration: string): number {
    if (!duration) return 0;

    // Handle formats like "1m 30s", "2m", "45s", "1h 15m"
    const timeParts = duration.match(/(\d+)([hms])/g);
    if (!timeParts) return 0;

    let totalSeconds = 0;
    timeParts.forEach(part => {
      const value = parseInt(part.replace(/[hms]/g, ''));
      const unit = part.slice(-1);

      switch (unit) {
        case 'h':
          totalSeconds += value * 3600;
          break;
        case 'm':
          totalSeconds += value * 60;
          break;
        case 's':
          totalSeconds += value;
          break;
      }
    });

    return totalSeconds;
  }

  /**
   * Returns appropriate font-family stack based on language
   * - Urdu: Noto Nastaliq Urdu
   * - Arabic: Noto Naskh Arabic
   * - Default (LTR): Inter/Roboto stack
   */
  static getFontFamilyForLanguage(language: string): string {
    const lang = (language || '').toLowerCase();
    if (lang.includes('urdu') || lang.includes('balochi') || lang.includes('punjabi')) {
      return `'Noto Nastaliq Urdu', 'Arial Unicode MS', sans-serif`;
    }
    if (lang.includes('arabic')) {
      return `'Noto Naskh Arabic', 'Arial Unicode MS', sans-serif`;
    }
    return `var(--font-plus-jakarta-sans)`;
  }

  /**
   * Returns true if the language is RTL (right-to-left)
   */
  static isRTLLanguage(language: string): boolean {
    const rtlLanguages = ['urdu', 'arabic', 'persian', 'sindhi', 'pashto', 'balochi', 'hebrew'];
    return rtlLanguages.includes((language || '').toLowerCase());
  }

  /**
   * Returns MUI sx direction styles for a given language
   */
  static getDirectionSx(language: string) {
    const isRTL = HelperFunctions.isRTLLanguage(language);
    const direction = isRTL ? 'rtl' : 'ltr';
    return {
      direction,
      textAlign: isRTL ? 'right' : 'left',
      '& *': {
        direction,
        textAlign: isRTL ? 'right' : 'left'
      }
    } as const;
  }

} 