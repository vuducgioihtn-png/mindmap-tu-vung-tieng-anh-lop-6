import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UNITS_DATA } from '../../data/unitsData';
import { UserProfile, GameMode } from '../../types';
import { BubblePopGame } from './BubblePopGame';
import { SpellingQuestGame } from './SpellingQuestGame';
import { SpeedQuizGame } from './SpeedQuizGame';
import { Trophy, Play, Sparkles, Flame, Zap, Award } from 'lucide-react';
import { sound } from '../../utils/audio';

interface GamesHubProps {
  initialUnitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const GamesHub: React.FC<GamesHubProps> = ({
  initialUnitId,
  user,
  setUser,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<number>(initialUnitId);
  const [activeGameMode, setActiveGameMode] = useState<GameMode>(null);

  const gameList = [
    {
      id: 'bubble' as const,
      title: 'Bắn Bóng Từ Vựng',
      subtitle: 'Bubble Pop Mania',
      icon: '🎈',
      color: 'bg-orange-500 hover:bg-orange-600',
      bgColor: 'border-amber-200 hover:border-orange-400',
      textColor: 'text-orange-600',
      highScore: user.highScores.bubblePop,
      description: 'Nhìn nghĩa tiếng Việt và bắn nhanh những quả bóng từ vựng bay lượn trên màn hình!',
      badge: 'Phổ Biến Nhất',
    },
    {
      id: 'spelling' as const,
      title: 'Thám Hiểm Ghép Chữ',
      subtitle: 'Spelling Quest',
      icon: '🧩',
      color: 'bg-amber-600 hover:bg-amber-700',
      bgColor: 'border-amber-200 hover:border-amber-400',
      textColor: 'text-amber-800',
      highScore: user.highScores.spellingQuest,
      description: 'Lắp ráp các khối chữ cái theo đúng chính tả tiếng Anh cùng gợi ý hình ảnh sống động!',
      badge: 'Luyện Chính Tả',
    },
    {
      id: 'quiz' as const,
      title: 'Đấu Trường Siêu Tốc',
      subtitle: 'Speed Quiz Arena',
      icon: '⚡',
      color: 'bg-orange-600 hover:bg-orange-700',
      bgColor: 'border-amber-200 hover:border-orange-400',
      textColor: 'text-orange-600',
      highScore: user.highScores.speedQuiz,
      description: 'Đua tốc độ 15 giây với 3 mạng trái tim và hệ số combo điểm số bùng nổ!',
      badge: 'Kịch Tính',
    },
  ];

  if (activeGameMode === 'bubble') {
    return (
      <BubblePopGame
        unitId={selectedUnitId}
        user={user}
        setUser={setUser}
        onExit={() => setActiveGameMode(null)}
      />
    );
  }

  if (activeGameMode === 'spelling') {
    return (
      <SpellingQuestGame
        unitId={selectedUnitId}
        user={user}
        setUser={setUser}
        onExit={() => setActiveGameMode(null)}
      />
    );
  }

  if (activeGameMode === 'quiz') {
    return (
      <SpeedQuizGame
        unitId={selectedUnitId}
        user={user}
        setUser={setUser}
        onExit={() => setActiveGameMode(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Unit Filter Strip */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <div>
              <h2 className="font-['Paytone_One'] text-slate-800 text-sm sm:text-base">
                Đấu Trường Trò Chơi Ôn Tập Tiếng Anh 6
              </h2>
              <p className="text-xs font-bold text-slate-500">
                Chơi game vừa vui vừa ghi nhớ từ vựng siêu sâu!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Bộ từ vựng:</span>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                sound.playPop();
                setSelectedUnitId(Number(e.target.value));
              }}
              className="px-3 py-1.5 font-['Paytone_One'] text-xs sm:text-sm bg-amber-50 border border-amber-200 rounded-xl text-slate-800 focus:outline-none focus:border-orange-400"
            >
              <option value={0}>🌟 Toàn Bộ 12 Units (Tổng Ôn Luyện)</option>
              {UNITS_DATA.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.icon} Unit {u.id}: {u.title.replace(/^Unit \d+:\s*/i, '')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {gameList.map((game, idx) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`rounded-3xl p-5 sm:p-6 border-2 ${game.bgColor} bg-white shadow-sm hover:shadow-md flex flex-col justify-between relative overflow-hidden group select-none transition-all`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                {game.badge}
              </span>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Trophy className="w-3.5 h-3.5 text-orange-500" />
                <span>Kỷ lục: {game.highScore}</span>
              </div>
            </div>

            {/* Game Visual Icon & Titles */}
            <div className="my-2 text-center">
              <div className="text-6xl sm:text-7xl mb-3 transform group-hover:scale-105 transition-transform">
                {game.icon}
              </div>

              <h3 className="text-xl sm:text-2xl font-['Paytone_One'] text-slate-800 leading-tight">
                {game.title}
              </h3>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {game.subtitle}
              </div>

              <p className="text-xs font-bold text-slate-600 mt-3 leading-relaxed">
                {game.description}
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                sound.playPop();
                setActiveGameMode(game.id);
              }}
              className={`w-full mt-5 py-3 rounded-2xl ${game.color} text-white font-['Paytone_One'] text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all`}
            >
              <Play className="w-4 h-4 fill-white" />
              <span>BẮT ĐẦU CHƠI</span>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
