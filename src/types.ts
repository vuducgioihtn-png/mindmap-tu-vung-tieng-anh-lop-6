export interface VocabularyItem {
  id: string;
  word: string;
  ipa: string;
  vietReading?: string;
  meaning: string;
  example: string;
  exampleIpa?: string;
  exampleVietReading?: string;
  exampleMeaning?: string;
  examplePronunciationHint?: string;
  category: string;
  unit: number;
  emoji: string;
  imageTag?: string;
}

export interface UnitInfo {
  id: number;
  title: string;
  titleVi: string;
  themeColor: {
    primary: string;
    secondary: string;
    bg: string;
    border: string;
    text: string;
    badge: string;
  };
  icon: string;
  description: string;
  words: VocabularyItem[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  level: number;
  xp: number;
  coins: number;
  streakDays: number;
  lastActiveDate: string;
  masteredWordIds: string[];
  reviewedWordIds: string[];
  favoriteWordIds: string[];
  dailyGoals: {
    targetWords: number;
    wordsLearnedToday: number;
    targetGames: number;
    gamesPlayedToday: number;
    date: string;
  };
  unlockedBadges: string[];
  highScores: {
    bubblePop: number;
    spellingQuest: number;
    speedQuiz: number;
  };
}

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  level: number;
  badge: string;
  isCurrentUser?: boolean;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

export type ActiveTab = 'mindmap' | 'flashcards' | 'dictation' | 'games' | 'leaderboard' | 'progress';
export type GameMode = 'bubble' | 'spelling' | 'quiz' | 'dictation' | null;
