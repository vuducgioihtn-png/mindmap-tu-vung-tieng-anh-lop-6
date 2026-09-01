import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, LeaderboardUser } from '../types';
import { Trophy, Medal, Flame, Award, Sparkles, Star, User, Crown, ChevronUp } from 'lucide-react';
import { getStoredLeaderboard, saveLeaderboard, saveUser, AVATAR_LIST } from '../utils/storage';
import { sound } from '../utils/audio';

interface LeaderboardViewProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ user, setUser }) => {
  const [board, setBoard] = useState<LeaderboardUser[]>(() => {
    const raw = getStoredLeaderboard();
    // Update the currentUser entry with latest user data
    return raw
      .map((item) => {
        if (item.isCurrentUser) {
          return {
            ...item,
            name: user.name,
            avatar: user.avatar,
            level: user.level,
            streak: user.streakDays,
            score: Math.max(item.score, user.xp * 2 + user.coins * 3),
          };
        }
        return item;
      })
      .sort((a, b) => b.score - a.score);
  });

  const [filterTab, setFilterTab] = useState<'all' | 'weekly' | 'school'>('all');

  const top1 = board[0];
  const top2 = board[1];
  const top3 = board[2];
  const restRanks = board.slice(3);

  const currentUserRank = board.findIndex((item) => item.isCurrentUser) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none">
      {/* Banner */}
      <div className="bg-amber-100 rounded-3xl p-5 sm:p-6 text-slate-800 shadow-sm border-2 border-amber-300 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200 text-amber-900">
              <Crown className="w-3.5 h-3.5 text-orange-500" /> Bảng Vinh Danh Học Sinh Xuất Sắc
            </div>
            <h1 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800 drop-shadow-xs">
              Bảng Xếp Hạng Đấu Trường Tiếng Anh 6
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-1 max-w-lg">
              Học từ vựng, duy trì chuỗi ngọn lửa 🔥 và chơi game để tích lũy điểm thưởng và leo lên ngôi Quán Quân!
            </p>
          </div>

          {/* User Rank Card */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-amber-200 text-center shadow-xs min-w-[170px]">
            <div className="text-xs font-bold text-slate-400 uppercase">Hạng của bạn</div>
            <div className="text-3xl font-['Paytone_One'] text-orange-500 my-0.5">
              #{currentUserRank || '-'}
            </div>
            <div className="text-xs font-bold text-slate-700">{user.name}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => {
            sound.playPop();
            setFilterTab('all');
          }}
          className={`px-4 py-2 rounded-2xl font-['Paytone_One'] text-xs sm:text-sm transition-all ${
            filterTab === 'all'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border-2 border-amber-200 hover:bg-amber-50'
          }`}
        >
          🌟 Toàn Quốc
        </button>
        <button
          onClick={() => {
            sound.playPop();
            setFilterTab('weekly');
          }}
          className={`px-4 py-2 rounded-2xl font-['Paytone_One'] text-xs sm:text-sm transition-all ${
            filterTab === 'weekly'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border-2 border-amber-200 hover:bg-amber-50'
          }`}
        >
          🏆 Tuần Này
        </button>
        <button
          onClick={() => {
            sound.playPop();
            setFilterTab('school');
          }}
          className={`px-4 py-2 rounded-2xl font-['Paytone_One'] text-xs sm:text-sm transition-all ${
            filterTab === 'school'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border-2 border-amber-200 hover:bg-amber-50'
          }`}
        >
          🏫 Khối 6 Của Bé
        </button>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-4 pb-2 px-2">
        {/* Top 2 - Silver */}
        {top2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center text-3xl sm:text-4xl shadow-sm mb-2 relative">
              {top2.avatar}
              <span className="absolute -top-2 -right-1 bg-slate-300 text-slate-800 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                2
              </span>
            </div>
            <div className="font-['Paytone_One'] text-xs sm:text-sm text-slate-800 text-center truncate max-w-[100px]">
              {top2.name}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mb-2">
              {top2.score.toLocaleString()} đ
            </div>

            {/* Podium Base */}
            <div className="w-full h-24 sm:h-32 bg-amber-50 rounded-t-3xl border-2 border-b-0 border-amber-200 flex flex-col items-center justify-center shadow-xs">
              <span className="text-2xl">🥈</span>
              <span className="text-xs font-bold text-slate-600">Hạng 2</span>
            </div>
          </motion.div>
        )}

        {/* Top 1 - Gold */}
        {top1 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="text-2xl animate-bounce mb-1">👑</div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-3 border-orange-400 flex items-center justify-center text-4xl sm:text-5xl shadow-md mb-2 relative">
              {top1.avatar}
              <span className="absolute -top-2 -right-1 bg-orange-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                1
              </span>
            </div>
            <div className="font-['Paytone_One'] text-xs sm:text-base text-slate-800 text-center truncate max-w-[120px]">
              {top1.name}
            </div>
            <div className="text-xs font-bold text-orange-600 mb-2">
              {top1.score.toLocaleString()} đ
            </div>

            {/* Podium Base */}
            <div className="w-full h-32 sm:h-40 bg-amber-100/90 rounded-t-3xl border-2 border-b-0 border-amber-300 flex flex-col items-center justify-center shadow-sm">
              <span className="text-3xl animate-pulse">🥇</span>
              <span className="text-xs sm:text-sm font-['Paytone_One'] text-slate-800">Quán Quân</span>
            </div>
          </motion.div>
        )}

        {/* Top 3 - Bronze */}
        {top3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white border-2 border-amber-200 flex items-center justify-center text-3xl sm:text-4xl shadow-sm mb-2 relative">
              {top3.avatar}
              <span className="absolute -top-2 -right-1 bg-orange-300 text-orange-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                3
              </span>
            </div>
            <div className="font-['Paytone_One'] text-xs sm:text-sm text-slate-800 text-center truncate max-w-[100px]">
              {top3.name}
            </div>
            <div className="text-[11px] font-bold text-slate-500 mb-2">
              {top3.score.toLocaleString()} đ
            </div>

            {/* Podium Base */}
            <div className="w-full h-20 sm:h-24 bg-amber-50/70 rounded-t-3xl border-2 border-b-0 border-amber-200 flex flex-col items-center justify-center shadow-xs">
              <span className="text-2xl">🥉</span>
              <span className="text-xs font-bold text-slate-600">Hạng 3</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Ranks 4+ Table */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border-2 border-amber-200 space-y-2">
        <h3 className="text-sm font-bold uppercase text-slate-400 mb-3 px-2">
          Thứ Hạng Khác
        </h3>

        {restRanks.map((item, idx) => {
          const rank = idx + 4;
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.01 }}
              className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                item.isCurrentUser
                  ? 'bg-amber-50/80 border-orange-300 shadow-xs'
                  : 'bg-white hover:bg-amber-50/40 border-amber-100'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="font-['Paytone_One'] text-slate-500 text-sm sm:text-base w-6 text-center">
                  #{rank}
                </span>

                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
                  {item.avatar}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm sm:text-base">
                      {item.name}
                    </span>
                    {item.isCurrentUser && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Bạn
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                    <span className="text-amber-800">🎖️ {item.badge}</span>
                    <span>• Cấp {item.level}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-xl border border-orange-200">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  <span>{item.streak} ngày</span>
                </div>

                <div className="text-right min-w-[70px]">
                  <div className="font-['Paytone_One'] text-slate-800 text-sm sm:text-base">
                    {item.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400">điểm</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
