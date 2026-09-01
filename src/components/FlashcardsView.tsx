import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UNITS_DATA } from '../data/unitsData';
import { VocabularyItem, UserProfile } from '../types';
import { Volume2, RotateCw, CheckCircle2, ChevronLeft, ChevronRight, Shuffle, Play, Pause, Snail, Star, Sparkles, BookOpen } from 'lucide-react';
import { sound } from '../utils/audio';
import { saveUser } from '../utils/storage';
import confetti from 'canvas-confetti';

interface FlashcardsViewProps {
  initialUnitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenWordDetail: (word: VocabularyItem) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  initialUnitId,
  user,
  setUser,
  onOpenWordDetail,
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<number>(initialUnitId);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unlearned' | 'mastered'>('all');
  const [isSlow, setIsSlow] = useState<boolean>(false);

  // Collect words based on unit or all units
  const rawWords = useMemo(() => {
    if (selectedUnitId === 0) {
      return UNITS_DATA.flatMap((u) => u.words);
    }
    const unit = UNITS_DATA.find((u) => u.id === selectedUnitId);
    return unit ? unit.words : UNITS_DATA[0].words;
  }, [selectedUnitId]);

  const words = useMemo(() => {
    return rawWords.filter((w) => {
      const isMastered = user.masteredWordIds.includes(w.id);
      if (filterMode === 'unlearned') return !isMastered;
      if (filterMode === 'mastered') return isMastered;
      return true;
    });
  }, [rawWords, filterMode, user.masteredWordIds]);

  const currentWord: VocabularyItem | undefined = words[currentIndex] || words[0];

  // Auto-play slideshow timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlay && currentWord) {
      // Step 1: Speak word
      sound.speakWord(currentWord.word, isSlow ? 0.65 : 0.95);

      // Step 2: Flip card after 2s
      timer = setTimeout(() => {
        setIsFlipped(true);
        sound.playFlip();

        // Step 3: Next card after 2.5s
        timer = setTimeout(() => {
          setIsFlipped(false);
          setCurrentIndex((prev) => (prev + 1) % words.length);
        }, 2500);
      }, 2200);
    }

    return () => clearTimeout(timer);
  }, [isAutoPlay, currentIndex, words.length, isSlow]);

  const handleNext = () => {
    sound.playPop();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % words.length);
  };

  const handlePrev = () => {
    sound.playPop();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
  };

  const handleShuffle = () => {
    sound.playPop();
    setIsFlipped(false);
    setCurrentIndex(Math.floor(Math.random() * words.length));
  };

  const handleFlipCard = () => {
    sound.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentWord) {
      sound.speakWord(currentWord.word, isSlow ? 0.65 : 0.95);
    }
  };

  const handleSpeakExample = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentWord) {
      sound.speakWord(currentWord.example, 0.9);
    }
  };

  const handleMarkMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord) return;

    const isMastered = user.masteredWordIds.includes(currentWord.id);
    let newMastered = isMastered
      ? user.masteredWordIds.filter((id) => id !== currentWord.id)
      : [...user.masteredWordIds, currentWord.id];

    let bonusXp = user.xp;
    let bonusCoins = user.coins;

    if (!isMastered) {
      sound.playCorrect();
      bonusXp += 20;
      bonusCoins += 5;
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else {
      sound.playPop();
    }

    const updated: UserProfile = {
      ...user,
      masteredWordIds: newMastered,
      xp: bonusXp,
      coins: bonusCoins,
      dailyGoals: {
        ...user.dailyGoals,
        wordsLearnedToday: isMastered
          ? user.dailyGoals.wordsLearnedToday
          : user.dailyGoals.wordsLearnedToday + 1,
      },
    };
    setUser(updated);
    saveUser(updated);
  };

  if (!currentWord) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border-3 border-amber-200">
        <div className="text-5xl mb-2">🎉</div>
        <h3 className="text-xl font-['Paytone_One'] text-slate-800">
          Tuyệt vời! Không có từ vựng nào trong danh sách lọc này.
        </h3>
        <p className="text-slate-500 font-bold mt-1 text-sm">
          Hãy đổi bộ lọc sang "Tất cả" hoặc chọn Unit khác để tiếp tục học nhé!
        </p>
        <button
          onClick={() => setFilterMode('all')}
          className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all"
        >
          Xem tất cả từ vựng
        </button>
      </div>
    );
  }

  const isCurrentMastered = user.masteredWordIds.includes(currentWord.id);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Unit Selector & Filters */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Unit Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🃏</span>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                sound.playPop();
                setSelectedUnitId(Number(e.target.value));
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="px-3 py-1.5 font-['Paytone_One'] text-xs sm:text-sm bg-amber-50 border border-amber-200 rounded-xl text-slate-800 focus:outline-none focus:border-orange-400"
            >
              <option value={0}>🌟 Toàn Bộ 12 Units (Kho Báu Từ Vựng)</option>
              {UNITS_DATA.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.icon} Unit {u.id}: {u.title.replace(/^Unit \d+:\s*/i, '')} ({u.titleVi})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setFilterMode('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterMode === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Tất cả ({rawWords.length})
            </button>
            <button
              onClick={() => {
                setFilterMode('unlearned');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterMode === 'unlearned'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Chưa thuộc
            </button>
            <button
              onClick={() => {
                setFilterMode('mastered');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                filterMode === 'mastered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-50 text-slate-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Đã thuộc
            </button>
          </div>
        </div>
      </div>

      {/* Progress Pill & Deck Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="font-['Paytone_One'] text-slate-700 text-sm">
            Thẻ {currentIndex + 1} / {words.length}
          </span>
          <div className="w-24 sm:w-36 h-2.5 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSlow(!isSlow)}
            className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all ${
              isSlow ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-600 border-amber-200'
            }`}
            title="Đọc chậm"
          >
            <Snail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chậm</span>
          </button>

          <button
            onClick={handleShuffle}
            className="p-1.5 bg-white hover:bg-amber-50 text-slate-700 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-1 shadow-2xs"
            title="Xáo trộn ngẫu nhiên"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xáo trộn</span>
          </button>

          <button
            onClick={() => {
              sound.playPop();
              setIsAutoPlay(!isAutoPlay);
            }}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-sm transition-all ${
              isAutoPlay
                ? 'bg-amber-800 text-white animate-pulse'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPlay ? 'Tạm Dừng' : 'Tự Động Chạy'}</span>
          </button>
        </div>
      </div>

      {/* 3D Flip Flashcard Main Canvas */}
      <div className="perspective-1000 min-h-[380px] sm:min-h-[420px] flex items-center justify-center">
        <motion.div
          onClick={handleFlipCard}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full h-[380px] sm:h-[420px] cursor-pointer relative"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              /* FRONT OF CARD */
              <motion.div
                key="front"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: 90 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-200 flex flex-col justify-between items-center text-center select-none"
              >
                {/* Card Top Pill */}
                <div className="w-full flex items-center justify-between">
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 font-extrabold text-xs rounded-full border border-orange-200">
                    Unit {currentWord.unit} • {currentWord.category}
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-orange-500" /> Bấm để lật thẻ
                  </span>
                </div>

                {/* Center Core Word */}
                <div className="my-auto">
                  <div className="text-6xl sm:text-7xl mb-3 animate-bounce drop-shadow-sm">
                    {currentWord.emoji}
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-['Paytone_One'] text-slate-800 tracking-wide">
                    {currentWord.word}
                  </h2>

                  <div className="inline-block mt-2 px-3 py-1 bg-orange-50 rounded-xl border border-orange-200 font-mono font-bold text-orange-600 text-base sm:text-lg">
                    {currentWord.ipa}
                  </div>

                  {currentWord.vietReading && (
                    <div className="mt-2 text-xs sm:text-sm font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200 inline-flex items-center gap-1.5 shadow-2xs">
                      <span className="text-[11px] font-black text-sky-600 uppercase">🇻🇳 Đọc giống:</span>
                      <span className="font-['Paytone_One'] text-sky-900">{currentWord.vietReading}</span>
                    </div>
                  )}
                </div>

                {/* Pronunciation Sound Button */}
                <div className="w-full flex items-center justify-center gap-3">
                  <button
                    onClick={handleSpeak}
                    className="py-2.5 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm sm:text-base shadow-md flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Nghe Đọc Từ</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* BACK OF CARD */
              <motion.div
                key="back"
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                exit={{ opacity: 0, rotateY: -90 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-amber-50/90 rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-300 flex flex-col justify-between items-center text-center select-none"
              >
                {/* Back Top Pill */}
                <div className="w-full flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-extrabold text-xs rounded-full border border-amber-300">
                    Nghĩa & Ví Dụ
                  </span>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 text-orange-500" /> Lật về mặt trước
                  </span>
                </div>

                {/* Meaning Section */}
                <div className="my-auto max-w-lg">
                  <div className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800 capitalize mb-1">
                    {currentWord.meaning}
                  </div>
                  <div className="text-sm font-extrabold text-orange-600 mb-4">
                    ({currentWord.category})
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-amber-200 text-left shadow-sm">
                    <div className="flex items-center justify-between text-xs font-black text-amber-900 mb-1.5">
                      <span className="flex items-center gap-1 text-amber-900">
                        💬 Ví dụ thực hành
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSpeakExample}
                          className="flex items-center gap-1 text-orange-700 hover:text-orange-800 font-bold bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 text-xs"
                          title="Đọc câu"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Đọc câu
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sound.speakWord(currentWord.example, 0.65);
                          }}
                          className="flex items-center gap-1 text-amber-800 hover:text-orange-700 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-lg border border-amber-300 text-xs"
                          title="Đọc chậm"
                        >
                          <Snail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base font-['Paytone_One'] text-slate-800 mb-1">
                      "{currentWord.example}"
                    </p>

                    {/* Sentence IPA & Vietnamese Reading */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {currentWord.exampleIpa && (
                        <div className="inline-block px-2 py-0.5 bg-amber-50/80 rounded border border-amber-200 text-orange-700 font-mono text-xs font-bold">
                          IPA: {currentWord.exampleIpa}
                        </div>
                      )}
                      {currentWord.exampleVietReading && (
                        <div className="inline-block px-2 py-0.5 bg-sky-50 rounded border border-sky-200 text-sky-800 text-xs font-bold">
                          🇻🇳 Đọc: <span className="font-['Paytone_One'] text-sky-900">{currentWord.exampleVietReading}</span>
                        </div>
                      )}
                    </div>

                    {currentWord.exampleMeaning && (
                      <p className="text-xs font-bold text-emerald-700 mb-1">
                        👉 {currentWord.exampleMeaning}
                      </p>
                    )}

                    {currentWord.examplePronunciationHint && (
                      <p className="text-[11px] font-medium text-slate-600 bg-amber-50/50 p-1.5 rounded-lg border border-amber-200/60 leading-relaxed">
                        💡 <strong className="text-orange-900">Gợi ý đọc:</strong> {currentWord.examplePronunciationHint}
                      </p>
                    )}
                  </div>
                </div>

                {/* Back Action Controls */}
                <div className="w-full flex items-center justify-center gap-2">
                  <button
                    onClick={handleMarkMastered}
                    className={`py-2 px-5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                      isCurrentMastered
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCurrentMastered ? 'Đã Thuộc (+20 XP)' : 'Đánh Dấu Thuộc'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWordDetail(currentWord);
                    }}
                    className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all"
                  >
                    Chi tiết
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Buttons Below Card */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={handlePrev}
          className="w-12 h-12 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          title="Thẻ trước"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleFlipCard}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-['Paytone_One'] text-sm shadow-md border-2 border-orange-600 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <RotateCw className="w-4 h-4" />
          <span>Lật Thẻ</span>
        </button>

        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-2xl bg-white hover:bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          title="Thẻ tiếp theo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
