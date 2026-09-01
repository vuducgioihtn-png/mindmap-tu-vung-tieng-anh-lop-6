import React, { useState } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { Volume2, VolumeX, Flame, Award, Coins, Sparkles, UserCheck } from 'lucide-react';
import { sound } from '../utils/audio';
import { AVATAR_LIST, saveUser } from '../utils/storage';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  user,
  setUser,
  isMuted,
  setIsMuted,
}) => {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  const toggleSound = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.isMuted = nextMute;
    if (!nextMute) {
      sound.playPop();
    }
  };

  const handleAvatarChange = (av: string) => {
    const updated = { ...user, avatar: av };
    setUser(updated);
    saveUser(updated);
    sound.playPop();
    setShowAvatarPicker(false);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      const updated = { ...user, name: tempName.trim() };
      setUser(updated);
      saveUser(updated);
    }
    setEditingName(false);
  };

  const tabs: Array<{ id: ActiveTab; label: string; icon: string; badge?: string }> = [
    { id: 'mindmap', label: 'Sơ Đồ Tư Duy', icon: '🗺️' },
    { id: 'flashcards', label: 'Thẻ Ghi Nhớ', icon: '🃏' },
    { id: 'games', label: 'Đấu Trường Game', icon: '🎮', badge: 'Hot' },
    { id: 'leaderboard', label: 'Bảng Xếp Hạng', icon: '🏆' },
    { id: 'progress', label: 'Tiến Độ Hằng Ngày', icon: '📈' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-4 border-amber-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        {/* Top bar: Brand & Stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo */}
          <div
            id="brand-logo"
            onClick={() => {
              setActiveTab('mindmap');
              sound.playPop();
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-400 rounded-full border-2 border-white flex items-center justify-center text-2xl sm:text-3xl shadow-md transform group-hover:scale-105 transition-transform">
              🦊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Paytone_One'] text-xl sm:text-2xl tracking-wide text-slate-800">
                  Mindmap từ vựng lớp 6
                </span>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Tiếng Anh 6
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 hidden sm:block">
                Sơ đồ tư duy & Đấu trường từ vựng tiếng Anh
              </p>
            </div>
          </div>

          {/* User Status Pills */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Streak Pill */}
            <div
              id="streak-indicator"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-100 text-orange-600 rounded-full font-bold text-xs sm:text-sm border border-orange-200 shadow-xs"
              title={`Chuỗi ${user.streakDays} ngày học liên tiếp!`}
            >
              <span className="text-base leading-none">🔥</span>
              <span>{user.streakDays} Ngày</span>
            </div>

            {/* Coins */}
            <div
              id="coins-indicator"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-bold text-xs sm:text-sm border border-yellow-200 shadow-xs"
              title="Xu thưởng đổi quà"
            >
              <span className="text-base leading-none">💰</span>
              <span>{user.coins}</span>
            </div>

            {/* Level & XP */}
            <div
              id="xp-indicator"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-full font-bold text-xs sm:text-sm border border-amber-200 shadow-xs"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Cấp {user.level}</span>
              <div className="w-12 h-2.5 bg-amber-200 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${user.xp % 100}%` }}
                />
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              className={`p-2 rounded-full border transition-transform active:scale-95 ${
                isMuted
                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              aria-label="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Avatar & Profile Trigger */}
            <div className="relative">
              <button
                id="user-avatar-btn"
                onClick={() => {
                  setShowAvatarPicker(!showAvatarPicker);
                  sound.playPop();
                }}
                className="w-10 h-10 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center text-xl shadow-md hover:scale-105 active:scale-95 transition-transform"
                title="Thay đổi tên & nhân vật"
              >
                {user.avatar}
              </button>

              {/* Avatar popup modal */}
              {showAvatarPicker && (
                <div className="absolute right-0 top-12 mt-1 w-72 bg-white rounded-3xl p-4 shadow-2xl border-4 border-amber-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Nhân vật của bạn
                    </span>
                    <button
                      onClick={() => setShowAvatarPicker(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                    >
                      ✕ Đóng
                    </button>
                  </div>

                  {/* Name edit */}
                  {editingName ? (
                    <form onSubmit={handleSaveName} className="mb-3 flex gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        maxLength={20}
                        className="flex-1 px-3 py-1.5 text-sm font-bold border-2 border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm"
                      >
                        Lưu
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-2xl mb-3 border border-amber-200">
                      <div>
                        <div className="font-black text-slate-800 text-sm">{user.name}</div>
                        <div className="text-xs text-slate-500 font-semibold">Cấp độ: {user.level} (XP: {user.xp})</div>
                      </div>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-xs font-bold text-amber-700 underline hover:text-amber-800"
                      >
                        Đổi tên
                      </button>
                    </div>
                  )}

                  {/* Avatar Icons Grid */}
                  <div className="text-xs font-bold text-slate-500 mb-2">Chọn hình đại diện:</div>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATAR_LIST.map((av) => (
                      <button
                        key={av}
                        onClick={() => handleAvatarChange(av)}
                        className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all ${
                          user.avatar === av
                            ? 'bg-orange-400 border-2 border-orange-500 text-white scale-110 shadow-md'
                            : 'bg-slate-50 hover:bg-amber-100 border border-slate-200'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 mt-2.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  sound.playPop();
                }}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 active:scale-95 select-none ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md border-2 border-orange-600 scale-102'
                    : 'bg-white text-slate-700 hover:bg-amber-50 hover:text-amber-900 border-2 border-amber-100 shadow-2xs'
                }`}
              >
                <span className="text-base sm:text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
