import React, { useState, useEffect } from 'react';
import { ActiveTab, VocabularyItem, UserProfile } from './types';
import { UNITS_DATA } from './data/unitsData';
import { Header } from './components/Header';
import { MascotGuide } from './components/MascotGuide';
import { MindMapViewer } from './components/MindMapViewer';
import { FlashcardsView } from './components/FlashcardsView';
import { GamesHub } from './components/games/GamesHub';
import { DictationView } from './components/DictationView';
import { LeaderboardView } from './components/LeaderboardView';
import { DailyProgressView } from './components/DailyProgressView';
import { WordDetailModal } from './components/WordDetailModal';
import { getStoredUser, saveUser } from './utils/storage';
import { sound } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mindmap');
  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [user, setUser] = useState<UserProfile>(getStoredUser);
  const [isMuted, setIsMuted] = useState(false);

  // Sync user state changes to local storage
  useEffect(() => {
    saveUser(user);
  }, [user]);

  const currentUnit = UNITS_DATA.find((u) => u.id === selectedUnitId) || UNITS_DATA[0];

  const handleStartGameWithUnit = (unitId: number) => {
    setSelectedUnitId(unitId);
    setActiveTab('games');
    sound.playPop();
  };

  const handleStartFlashcardsWithUnit = (unitId: number) => {
    setSelectedUnitId(unitId);
    setActiveTab('flashcards');
    sound.playPop();
  };

  const handleStartDictationWithUnit = (unitId: number) => {
    setSelectedUnitId(unitId);
    setActiveTab('dictation');
    sound.playPop();
  };

  return (
    <div className="min-h-screen bg-[#FFFBEB] bg-[radial-gradient(#FEF3C7_1.2px,transparent_1.2px)] [background-size:24px_24px] text-slate-800 flex flex-col font-['Nunito',sans-serif]">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        setUser={setUser}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4">
        {/* Mascot Companion Guide Banner */}
        <MascotGuide
          currentUnitTitle={
            activeTab === 'mindmap' || activeTab === 'flashcards' || activeTab === 'dictation'
              ? `${currentUnit.title} (${currentUnit.titleVi})`
              : undefined
          }
        />

        {/* Tab Views */}
        <div className="mt-4">
          {activeTab === 'mindmap' && (
            <MindMapViewer
              selectedUnitId={selectedUnitId}
              setSelectedUnitId={setSelectedUnitId}
              onSelectWord={setSelectedWord}
              user={user}
              onStartGameWithUnit={handleStartGameWithUnit}
              onStartFlashcardsWithUnit={handleStartFlashcardsWithUnit}
              onStartDictationWithUnit={handleStartDictationWithUnit}
            />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardsView
              initialUnitId={selectedUnitId}
              user={user}
              setUser={setUser}
              onOpenWordDetail={setSelectedWord}
            />
          )}

          {activeTab === 'dictation' && (
            <DictationView
              initialUnitId={selectedUnitId}
              user={user}
              setUser={setUser}
              onOpenWordDetail={setSelectedWord}
            />
          )}

          {activeTab === 'games' && (
            <GamesHub
              initialUnitId={selectedUnitId}
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              user={user}
              setUser={setUser}
            />
          )}

          {activeTab === 'progress' && (
            <DailyProgressView
              user={user}
              setUser={setUser}
              onSelectUnit={(unitId) => {
                setSelectedUnitId(unitId);
                setActiveTab('mindmap');
              }}
            />
          )}
        </div>
      </main>

      {/* Word Detail Popup Modal */}
      <WordDetailModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        user={user}
        setUser={setUser}
      />

      {/* Footer */}
      <footer className="mt-8 border-t-4 border-amber-200 bg-white/90 backdrop-blur-xs py-4 px-4 text-center text-xs font-bold text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-['Paytone_One'] text-amber-900">
            <span>🦊</span>
            <span>Mindmap từ vựng lớp 6 • Sơ Đồ Tư Duy & Đấu Trường Game Tiếng Anh Lớp 6</span>
          </div>
          <div className="text-slate-400 font-semibold">
            Thiết kế sinh động dành cho học sinh lớp 6 chuẩn Bộ Giáo Dục & Đào Tạo
          </div>
        </div>
      </footer>
    </div>
  );
}
