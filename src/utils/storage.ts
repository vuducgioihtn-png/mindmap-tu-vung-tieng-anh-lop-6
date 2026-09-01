import { UserProfile, LeaderboardUser, AchievementBadge } from '../types';

const USER_STORAGE_KEY = 'engimind6_user_profile_v2';
const LEADERBOARD_KEY = 'engimind6_leaderboard_v2';

const INITIAL_USER: UserProfile = {
  name: 'Bé Khám Phá',
  avatar: '🐶',
  level: 1,
  xp: 120,
  coins: 50,
  streakDays: 3,
  lastActiveDate: new Date().toISOString().split('T')[0],
  masteredWordIds: ['u1_1', 'u1_2', 'u1_3', 'u2_1'],
  reviewedWordIds: ['u1_4', 'u1_5'],
  favoriteWordIds: ['u1_1', 'u1_7'],
  dailyGoals: {
    targetWords: 8,
    wordsLearnedToday: 4,
    targetGames: 2,
    gamesPlayedToday: 1,
    date: new Date().toISOString().split('T')[0],
  },
  unlockedBadges: ['first_step', 'streak_3'],
  highScores: {
    bubblePop: 320,
    spellingQuest: 250,
    speedQuiz: 410,
  },
};

const DEFAULT_LEADERBOARD: LeaderboardUser[] = [
  { id: 'u_1', name: 'Minh Anh Super Star', avatar: '🐱', score: 1450, streak: 12, level: 8, badge: 'Vua Tiếng Anh' },
  { id: 'u_2', name: 'Gia Bảo Explorer', avatar: '🦖', score: 1280, streak: 9, level: 7, badge: 'Thợ Săn Từ Vựng' },
  { id: 'u_3', name: 'Tuệ Mẫn Cần Mẫn', avatar: '🦉', score: 1120, streak: 7, level: 6, badge: 'Siêu Trí Tuệ' },
  { id: 'u_4', name: 'Hải Đăng Thần Tốc', avatar: '🚀', score: 980, streak: 5, level: 5, badge: 'Tia Chớp Vàng' },
  { id: 'u_me', name: 'Bé Khám Phá (Bạn)', avatar: '🐶', score: 650, streak: 3, level: 3, badge: 'Hiệp Sĩ Mới', isCurrentUser: true },
  { id: 'u_5', name: 'Ngọc Hân Sunny', avatar: '🐰', score: 620, streak: 4, level: 3, badge: 'Chăm Chỉ Nhất' },
  { id: 'u_6', name: 'Khôi Nguyên Math & Vocab', avatar: '🦁', score: 540, streak: 2, level: 2, badge: 'Tân Binh Vui Vẻ' },
  { id: 'u_7', name: 'Bảo Trâm Bé Ngoan', avatar: '🐼', score: 430, streak: 3, level: 2, badge: 'Bé Chăm Học' },
];

export const ALL_BADGES: AchievementBadge[] = [
  { id: 'first_step', title: 'Bước Đầu Tiên', description: 'Học từ vựng đầu tiên', icon: '🌱', unlocked: true, color: 'from-amber-400 to-orange-500' },
  { id: 'streak_3', title: 'Giữ Lửa 3 Ngày', description: 'Học liên tục 3 ngày', icon: '🔥', unlocked: true, color: 'from-orange-400 to-red-500' },
  { id: 'streak_7', title: 'Ngọn Lửa Bền Bỉ', description: 'Đạt chuỗi 7 ngày liên tiếp', icon: '⚡', unlocked: false, color: 'from-purple-400 to-pink-500' },
  { id: 'master_10', title: 'Chuyên Gia 10 Từ', description: 'Thuộc lòng 10 từ vựng', icon: '⭐', unlocked: false, color: 'from-blue-400 to-indigo-500' },
  { id: 'master_50', title: 'Kho Báu Từ Vựng', description: 'Thuộc lòng 50 từ vựng', icon: '🏆', unlocked: false, color: 'from-yellow-400 to-amber-500' },
  { id: 'game_champion', title: 'Quán Quân Trò Chơi', description: 'Đạt trên 300 điểm bất kỳ trò chơi nào', icon: '🎮', unlocked: true, color: 'from-emerald-400 to-teal-500' },
  { id: 'unit_master', title: 'Thủ Lĩnh Unit', description: 'Hoàn thành 100% từ vựng của 1 Unit', icon: '👑', unlocked: false, color: 'from-pink-400 to-rose-500' },
];

export function getStoredUser(): UserProfile {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    if (!data) {
      saveUser(INITIAL_USER);
      return INITIAL_USER;
    }
    const user: UserProfile = JSON.parse(data);
    const today = new Date().toISOString().split('T')[0];

    // Check daily streak & reset daily goal if new day
    if (user.dailyGoals.date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (user.lastActiveDate === yesterdayStr) {
        user.streakDays += 1;
      } else if (user.lastActiveDate !== today) {
        user.streakDays = 1;
      }

      user.lastActiveDate = today;
      user.dailyGoals = {
        targetWords: 8,
        wordsLearnedToday: 0,
        targetGames: 2,
        gamesPlayedToday: 0,
        date: today,
      };
      saveUser(user);
    }
    return user;
  } catch {
    return INITIAL_USER;
  }
}

export function saveUser(user: UserProfile) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user profile', err);
  }
}

export function getStoredLeaderboard(): LeaderboardUser[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) {
      saveLeaderboard(DEFAULT_LEADERBOARD);
      return DEFAULT_LEADERBOARD;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_LEADERBOARD;
  }
}

export function saveLeaderboard(board: LeaderboardUser[]) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
  } catch (err) {
    console.error('Failed to save leaderboard', err);
  }
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export const AVATAR_LIST = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🦖', '🦉', '🚀', '⭐'];
