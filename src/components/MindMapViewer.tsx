import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { UNITS_DATA } from '../data/unitsData';
import { VocabularyItem, UserProfile } from '../types';
import { Volume2, Search, Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Layers, LayoutGrid, PlayCircle, Star } from 'lucide-react';
import { sound } from '../utils/audio';

interface MindMapViewerProps {
  selectedUnitId: number;
  setSelectedUnitId: (id: number) => void;
  onSelectWord: (word: VocabularyItem) => void;
  user: UserProfile;
  onStartGameWithUnit: (unitId: number) => void;
  onStartFlashcardsWithUnit: (unitId: number) => void;
  onStartDictationWithUnit?: (unitId: number) => void;
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({
  selectedUnitId,
  setSelectedUnitId,
  onSelectWord,
  user,
  onStartGameWithUnit,
  onStartFlashcardsWithUnit,
  onStartDictationWithUnit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unlearned' | 'mastered'>('all');
  const [viewMode, setViewMode] = useState<'mindmap' | 'grid'>('mindmap');

  const currentUnit = useMemo(() => {
    return UNITS_DATA.find((u) => u.id === selectedUnitId) || UNITS_DATA[0];
  }, [selectedUnitId]);

  const filteredWords = useMemo(() => {
    return currentUnit.words.filter((w) => {
      const matchesSearch =
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.category.toLowerCase().includes(searchQuery.toLowerCase());

      const isMastered = user.masteredWordIds.includes(w.id);
      if (filterMode === 'unlearned') return matchesSearch && !isMastered;
      if (filterMode === 'mastered') return matchesSearch && isMastered;
      return matchesSearch;
    });
  }, [currentUnit, searchQuery, filterMode, user.masteredWordIds]);

  const masteredCount = currentUnit.words.filter((w) =>
    user.masteredWordIds.includes(w.id)
  ).length;
  const progressPercent = Math.round((masteredCount / currentUnit.words.length) * 100);

  const handlePrevUnit = () => {
    sound.playPop();
    const prevId = selectedUnitId > 1 ? selectedUnitId - 1 : UNITS_DATA.length;
    setSelectedUnitId(prevId);
  };

  const handleNextUnit = () => {
    sound.playPop();
    const nextId = selectedUnitId < UNITS_DATA.length ? selectedUnitId + 1 : 1;
    setSelectedUnitId(nextId);
  };

  const handleWordSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    sound.speakWord(word, 0.95);
  };

  return (
    <div className="space-y-4">
      {/* Unit Selector Strip */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <span className="font-['Paytone_One'] text-slate-800 text-sm sm:text-base">
              Chọn Chủ Đề Học (12 Units Tiếng Anh Lớp 6)
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevUnit}
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-transform active:scale-90"
              title="Unit trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-amber-900 px-2">
              {selectedUnitId} / {UNITS_DATA.length}
            </span>
            <button
              onClick={handleNextUnit}
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-transform active:scale-90"
              title="Unit kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Units Carousel Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {UNITS_DATA.map((u) => {
            const isSelected = u.id === selectedUnitId;
            const uMastered = u.words.filter((w) => user.masteredWordIds.includes(w.id)).length;
            const uPercent = Math.round((uMastered / u.words.length) * 100);

            return (
              <button
                key={u.id}
                onClick={() => {
                  sound.playPop();
                  setSelectedUnitId(u.id);
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-200 active:scale-95 border-2 ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-600 shadow-md scale-102 font-black'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border-amber-100/90 font-bold shadow-2xs'
                }`}
              >
                <span className="text-xl">{u.icon}</span>
                <div>
                  <div className="text-xs font-black leading-tight">Unit {u.id}</div>
                  <div className={`text-[10px] truncate max-w-[110px] ${isSelected ? 'text-orange-100 font-semibold' : 'text-slate-500'}`}>
                    {u.titleVi}
                  </div>
                </div>
                {uPercent > 0 && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {uPercent}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Unit Info Banner & Controls */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 sm:p-5 text-white shadow-md border-2 border-amber-400 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                Sơ Đồ Tư Duy Chuẩn Lớp 6
              </span>
              <span className="text-amber-100 text-xs font-bold">
                {currentUnit.words.length} từ vựng then chốt
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-['Paytone_One'] mt-1 drop-shadow-xs flex items-center gap-2">
              <span>{currentUnit.icon}</span>
              <span>{currentUnit.title}</span>
            </h1>

            <p className="text-xs sm:text-sm font-bold text-amber-50 mt-1 max-w-xl">
              {currentUnit.description}
            </p>

            {/* Progress Bar for Unit */}
            <div className="mt-3 flex items-center gap-3">
              <div className="w-44 sm:w-56 h-3 bg-black/20 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-black">
                Đã thuộc: {masteredCount}/{currentUnit.words.length} ({progressPercent}%)
              </span>
            </div>
          </div>

          {/* Practice shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            {onStartDictationWithUnit && (
              <button
                onClick={() => onStartDictationWithUnit(currentUnit.id)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all border border-emerald-300"
              >
                <span>✍️</span> Nghe & Viết Unit Này
              </button>
            )}
            <button
              onClick={() => onStartFlashcardsWithUnit(currentUnit.id)}
              className="px-4 py-2.5 bg-white text-orange-600 hover:bg-amber-50 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>🃏</span> Lật Thẻ Unit Này
            </button>
            <button
              onClick={() => onStartGameWithUnit(currentUnit.id)}
              className="px-4 py-2.5 bg-amber-900/40 hover:bg-amber-900/60 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center gap-1.5 active:scale-95 transition-all border border-white/30"
            >
              <span>🎮</span> Chơi Game Ôn Tập
            </button>
          </div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border-2 border-amber-200 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm từ vựng, phiên âm, nghĩa tiếng Việt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm font-bold bg-amber-50/40 border border-amber-200 rounded-xl focus:outline-none focus:border-orange-400 focus:bg-white"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterMode === 'all'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Tất cả ({currentUnit.words.length})
          </button>
          <button
            onClick={() => setFilterMode('unlearned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterMode === 'unlearned'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Chưa thuộc ({currentUnit.words.length - masteredCount})
          </button>
          <button
            onClick={() => setFilterMode('mastered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              filterMode === 'mastered'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Đã thuộc ({masteredCount})
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200">
          <button
            onClick={() => setViewMode('mindmap')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'mindmap' ? 'bg-white text-slate-800 shadow-xs border border-amber-200' : 'text-slate-500'
            }`}
            title="Xem dạng Sơ đồ tư duy"
          >
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Sơ Đồ</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs border border-amber-200' : 'text-slate-500'
            }`}
            title="Xem dạng Lưới thẻ"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Lưới Thẻ</span>
          </button>
        </div>
      </div>

      {/* Main Mind Map Visual Canvas / Grid */}
      {viewMode === 'mindmap' ? (
        <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-sm border-2 border-amber-200 min-h-[520px] relative overflow-hidden">
          {/* Background Decorative Dotted Grid in Natural Amber */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#FEF3C7 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Central Unit Hub Node */}
          <div className="flex flex-col items-center justify-center my-4 relative z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-amber-400 text-white flex flex-col items-center justify-center p-3 text-center shadow-xl border-4 border-white cursor-pointer relative"
              onClick={() => sound.speakWord(currentUnit.title)}
            >
              <div className="text-2xl sm:text-3xl mb-1 animate-bounce">{currentUnit.icon}</div>
              <div className="font-['Paytone_One'] text-xs sm:text-sm uppercase tracking-wide leading-tight">
                UNIT {currentUnit.id}
              </div>
              <div className="text-[11px] sm:text-xs font-black uppercase text-amber-100 px-1 leading-snug line-clamp-2">
                {currentUnit.title.replace(/^Unit \d+:\s*/i, '')}
              </div>
              <div className="text-[10px] font-bold text-white/90 mt-0.5">
                {currentUnit.titleVi}
              </div>
            </motion.div>
          </div>

          {/* Branching Words in Circular / Organic Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 relative z-10 mt-6">
            {filteredWords.map((item, idx) => {
              const isMastered = user.masteredWordIds.includes(item.id);
              const isFav = user.favoriteWordIds.includes(item.id);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => {
                    sound.playPop();
                    onSelectWord(item);
                  }}
                  className={`relative p-3.5 sm:p-4 rounded-3xl border-2 transition-all cursor-pointer shadow-xs select-none ${
                    isMastered
                      ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500'
                      : 'bg-white border-amber-200 hover:border-orange-400 hover:shadow-md'
                  }`}
                >
                  {/* Top Status Badges */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {isFav && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      {isMastered && (
                        <span className="flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Đã thuộc
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Word Content & Emoji */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-2xl sm:text-3xl shadow-inner flex-shrink-0">
                      {item.emoji}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-['Paytone_One'] text-base sm:text-lg text-slate-800 truncate">
                          {item.word}
                        </h3>
                        <button
                          onClick={(e) => handleWordSpeak(e, item.word)}
                          className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors flex-shrink-0"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono font-bold text-orange-600 tracking-wide">
                          {item.ipa}
                        </span>
                        {item.vietReading && (
                          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                            🇻🇳 {item.vietReading}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-600 capitalize mt-1 truncate">
                        {item.meaning}
                      </div>
                    </div>
                  </div>

                  {/* Example preview */}
                  <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-600 italic truncate font-medium">"{item.example}"</span>
                    <span className="text-[10px] font-bold text-orange-700 shrink-0 bg-orange-50 hover:bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200">
                      Xem IPA & Nghĩa câu ➔
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-slate-600 font-bold text-sm">
                Không tìm thấy từ vựng nào phù hợp với bộ lọc.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Grid Mode View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredWords.map((item) => {
            const isMastered = user.masteredWordIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => {
                  sound.playPop();
                  onSelectWord(item);
                }}
                className={`bg-white rounded-3xl p-4 border-2 transition-all cursor-pointer shadow-xs active:scale-98 ${
                  isMastered
                    ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
                    : 'border-amber-200 hover:border-orange-400 hover:shadow-md'
                }`}
              >
                <div className="text-3xl text-center mb-2">{item.emoji}</div>
                <div className="font-['Paytone_One'] text-center text-lg text-slate-800">
                  {item.word}
                </div>
                <div className="text-center font-mono font-bold text-orange-600 text-xs mt-0.5">
                  {item.ipa}
                </div>
                <div className="text-center font-bold text-slate-600 text-sm mt-1">
                  {item.meaning}
                </div>
                <button
                  onClick={(e) => handleWordSpeak(e, item.word)}
                  className="w-full mt-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200"
                >
                  <Volume2 className="w-3.5 h-3.5 text-orange-500" /> Nghe phát âm
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
