import React from 'react';
import { motion } from 'motion/react';
import { UNITS_DATA } from '../data/unitsData';
import { UserProfile } from '../types';
import { ALL_BADGES } from '../utils/storage';
import { Flame, CheckCircle, Trophy, Star, Award, Target, Calendar, Gift, Sparkles, BookOpen, Clock } from 'lucide-react';
import { sound } from '../utils/audio';

interface DailyProgressViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSelectUnit: (unitId: number) => void;
}

export const DailyProgressView: React.FC<DailyProgressViewProps> = ({
  user,
  setUser,
  onSelectUnit,
}) => {
  const totalWordsInApp = UNITS_DATA.reduce((acc, u) => acc + u.words.length, 0);
  const totalMasteredCount = user.masteredWordIds.length;
  const overallMasteryPercent = Math.round((totalMasteredCount / totalWordsInApp) * 100);

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  const dailyQuests = [
    {
      id: 'q1',
      title: 'Học 8 từ vựng mới hôm nay',
      current: user.dailyGoals.wordsLearnedToday,
      target: user.dailyGoals.targetWords,
      reward: '50 XP • 15 Xu 🪙',
      icon: '📖',
      isCompleted: user.dailyGoals.wordsLearnedToday >= user.dailyGoals.targetWords,
    },
    {
      id: 'q2',
      title: 'Tham gia 2 trận đấu trò chơi',
      current: user.dailyGoals.gamesPlayedToday,
      target: user.dailyGoals.targetGames,
      reward: '40 XP • 10 Xu 🪙',
      icon: '🎮',
      isCompleted: user.dailyGoals.gamesPlayedToday >= user.dailyGoals.targetGames,
    },
    {
      id: 'q3',
      title: 'Duy trì chuỗi ngọn lửa học tập',
      current: user.streakDays > 0 ? 1 : 0,
      target: 1,
      reward: '30 XP • 5 Xu 🪙',
      icon: '🔥',
      isCompleted: user.streakDays > 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak card */}
        <div className="bg-amber-50 rounded-3xl p-4 sm:p-5 text-slate-800 shadow-xs border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900">Chuỗi Giữ Lửa</span>
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-bounce" />
          </div>
          <div className="text-3xl font-['Paytone_One'] my-1 text-slate-800">{user.streakDays} Ngày</div>
          <div className="text-xs font-bold text-slate-600">Học mỗi ngày không ngắt quãng!</div>
        </div>

        {/* Mastered Words card */}
        <div className="bg-emerald-50/70 rounded-3xl p-4 sm:p-5 text-emerald-950 shadow-xs border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">Đã Thuộc Lòng</span>
            <CheckCircle className="w-6 h-6 text-emerald-600 fill-emerald-600" />
          </div>
          <div className="text-3xl font-['Paytone_One'] my-1 text-emerald-900">
            {totalMasteredCount}/{totalWordsInApp}
          </div>
          <div className="text-xs font-bold text-emerald-700">Đạt {overallMasteryPercent}% toàn bộ Grade 6</div>
        </div>

        {/* Level card */}
        <div className="bg-amber-100/60 rounded-3xl p-4 sm:p-5 text-amber-950 shadow-xs border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900">Cấp Độ & XP</span>
            <Award className="w-6 h-6 text-orange-500" />
          </div>
          <div className="text-3xl font-['Paytone_One'] my-1 text-slate-800">Cấp {user.level}</div>
          <div className="text-xs font-bold text-slate-600">{user.xp} tổng điểm kinh nghiệm</div>
        </div>

        {/* Coins card */}
        <div className="bg-orange-50/80 rounded-3xl p-4 sm:p-5 text-orange-950 shadow-xs border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-orange-900">Kho Báu Xu</span>
            <span className="text-2xl">🪙</span>
          </div>
          <div className="text-3xl font-['Paytone_One'] my-1 text-slate-800">{user.coins} Xu</div>
          <div className="text-xs font-bold text-slate-600">Đổi danh hiệu & linh vật</div>
        </div>
      </div>

      {/* 7-Day Streak Calendar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <h2 className="font-['Paytone_One'] text-slate-800 text-base sm:text-lg">
              Lịch Học Tập & Giữ Lửa Trong Tuần
            </h2>
          </div>
          <div className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Hôm nay: Thứ {todayDayIndex === 6 ? 'CN' : todayDayIndex + 2}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {daysOfWeek.map((day, idx) => {
            const isToday = idx === todayDayIndex;
            const isPastActive = idx <= todayDayIndex && idx >= todayDayIndex - (user.streakDays - 1);

            return (
              <div
                key={day}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between ${
                  isToday
                    ? 'bg-amber-100/80 border-orange-300 shadow-xs scale-105'
                    : isPastActive
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-amber-100'
                }`}
              >
                <span className="text-xs font-bold text-slate-500">{day}</span>
                <div className="my-2 text-xl sm:text-2xl">
                  {isPastActive || isToday ? '🔥' : '⚪'}
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    isToday ? 'text-amber-900' : isPastActive ? 'text-orange-600' : 'text-slate-400'
                  }`}
                >
                  {isToday ? 'Hôm nay' : isPastActive ? 'Đạt' : 'Chưa'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Quests Box */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            <h2 className="font-['Paytone_One'] text-slate-800 text-base sm:text-lg">
              Nhiệm Vụ Hằng Ngày
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">Làm mới sau 24h</span>
        </div>

        <div className="space-y-3">
          {dailyQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                quest.isCompleted
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{quest.icon}</div>
                <div>
                  <div className="font-bold text-slate-800 text-sm sm:text-base">
                    {quest.title}
                  </div>
                  <div className="text-xs font-bold text-amber-800">
                    Phần thưởng: {quest.reward}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700">
                    {quest.current} / {quest.target}
                  </div>
                  <div className="w-24 h-2 bg-amber-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quest.isCompleted ? 'bg-emerald-600' : 'bg-orange-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (quest.current / quest.target) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {quest.isCompleted ? (
                  <span className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-slate-600 font-bold text-xs rounded-xl border border-amber-200">
                    Đang làm
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12 Units Mastery Chart Grid */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-500" />
            <h2 className="font-['Paytone_One'] text-slate-800 text-base sm:text-lg">
              Mức Độ Thành Thạo 12 Units Tiếng Anh 6
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">Bấm để học ngay</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {UNITS_DATA.map((u) => {
            const uMastered = u.words.filter((w) => user.masteredWordIds.includes(w.id)).length;
            const percent = Math.round((uMastered / u.words.length) * 100);

            return (
              <div
                key={u.id}
                onClick={() => {
                  sound.playPop();
                  onSelectUnit(u.id);
                }}
                className="p-3.5 rounded-2xl bg-amber-50/40 hover:bg-amber-50 border-2 border-amber-200 hover:border-orange-400 cursor-pointer transition-all active:scale-98 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{u.icon}</span>
                    <span className="font-['Paytone_One'] text-xs text-slate-800">
                      Unit {u.id}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-orange-600 font-mono">
                    {percent}%
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-700 truncate">
                  {u.titleVi}
                </div>

                <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="text-[10px] text-slate-500 font-bold mt-1 text-right">
                  {uMastered}/{u.words.length} từ
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges and Achievements */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h2 className="font-['Paytone_One'] text-slate-800 text-base sm:text-lg">
              Huy Chương & Danh Hiệu Đạt Được
            </h2>
          </div>
          <span className="text-xs font-bold text-amber-900 font-bold">
            {ALL_BADGES.filter((b) => user.unlockedBadges.includes(b.id)).length} / {ALL_BADGES.length} đã mở khóa
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = user.unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                  isUnlocked
                    ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
                    : 'bg-white border-amber-100 opacity-50 grayscale'
                }`}
              >
                <div className="text-4xl mb-1.5">{badge.icon}</div>
                <div className="font-['Paytone_One'] text-xs text-slate-800">{badge.title}</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5 leading-snug">
                  {badge.description}
                </div>
                {isUnlocked ? (
                  <span className="inline-block mt-2 text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✓ Đã nhận
                  </span>
                ) : (
                  <span className="inline-block mt-2 text-[9px] font-bold text-slate-500 bg-amber-100/60 px-2 py-0.5 rounded-full">
                    🔒 Chưa mở
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
