import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabularyItem, UserProfile } from '../types';
import { Volume2, Star, CheckCircle, X, Sparkles, BookOpen, Share2, Snail } from 'lucide-react';
import { sound } from '../utils/audio';
import { saveUser } from '../utils/storage';
import confetti from 'canvas-confetti';

interface WordDetailModalProps {
  word: VocabularyItem | null;
  onClose: () => void;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  onClose,
  user,
  setUser,
}) => {
  const [isSlowAudio, setIsSlowAudio] = useState(false);

  if (!word) return null;

  const isMastered = user.masteredWordIds.includes(word.id);
  const isFavorite = user.favoriteWordIds.includes(word.id);

  const handlePlayWordAudio = (rate = isSlowAudio ? 0.65 : 0.95) => {
    sound.speakWord(word.word, rate);
  };

  const handlePlayExampleAudio = () => {
    sound.speakWord(word.example, 0.9);
  };

  const toggleMastered = () => {
    sound.playPop();
    const newMastered = isMastered
      ? user.masteredWordIds.filter((id) => id !== word.id)
      : [...user.masteredWordIds, word.id];

    let bonusXp = user.xp;
    let bonusCoins = user.coins;

    if (!isMastered) {
      sound.playCorrect();
      bonusXp += 20;
      bonusCoins += 5;
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
      });
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

  const toggleFavorite = () => {
    sound.playPop();
    const newFavorites = isFavorite
      ? user.favoriteWordIds.filter((id) => id !== word.id)
      : [...user.favoriteWordIds, word.id];

    const updated: UserProfile = {
      ...user,
      favoriteWordIds: newFavorites,
    };
    setUser(updated);
    saveUser(updated);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-4 border-amber-200 relative overflow-hidden"
        >
          {/* Top Decorative bar */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

          {/* Close button */}
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-amber-50 hover:bg-amber-100 text-slate-600 flex items-center justify-center border border-amber-200 transition-colors active:scale-95 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Word Header with Big Emoji */}
          <div className="flex items-center gap-4 mt-2 mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-5xl sm:text-6xl shadow-inner flex-shrink-0">
              {word.emoji}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {word.category}
                </span>
                <span className="text-xs font-bold text-slate-500">Unit {word.unit}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800 mt-1 truncate">
                {word.word}
              </h2>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm sm:text-base font-extrabold text-orange-600 font-mono bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                  {word.ipa}
                </span>
                {word.vietReading && (
                  <span className="text-xs sm:text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200 flex items-center gap-1 shadow-2xs" title="Đọc phát âm giống tiếng Việt">
                    <span className="text-[11px] font-black text-sky-600 uppercase">🇻🇳 Đọc:</span>
                    <span className="font-['Paytone_One'] text-sky-900">{word.vietReading}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pronunciation Controls */}
          <div className="flex items-center gap-2 p-3 bg-amber-50/60 rounded-2xl border-2 border-amber-200 mb-4">
            <button
              onClick={() => handlePlayWordAudio()}
              className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-sm sm:text-base shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Volume2 className="w-5 h-5" />
              <span>Nghe phát âm chuẩn</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                setIsSlowAudio(!isSlowAudio);
                handlePlayWordAudio(isSlowAudio ? 0.95 : 0.65);
              }}
              className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center gap-1 transition-all ${
                isSlowAudio
                  ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                  : 'bg-white border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
              title="Nghe tốc độ chậm như chú rùa"
            >
              <Snail className="w-4 h-4" />
              <span className="hidden sm:inline">Chậm</span>
            </button>
          </div>

          {/* Meaning Card */}
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 mb-4 shadow-2xs">
            <div className="text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-500" /> Nghĩa tiếng Việt
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800 capitalize">
              {word.meaning}
            </div>
          </div>

          {/* Example Sentence with Full IPA, Meaning & Pronunciation Hint */}
          <div className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border-2 border-amber-200 mb-5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-900 mb-2">
              <span className="flex items-center gap-1.5 font-['Paytone_One'] text-amber-900 text-sm">
                💬 Ví dụ câu thực hành
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePlayExampleAudio}
                  className="flex items-center gap-1 text-amber-900 hover:text-orange-700 font-bold bg-white hover:bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs active:scale-95 transition-all text-xs"
                  title="Nghe phát âm chuẩn cả câu"
                >
                  <Volume2 className="w-3.5 h-3.5 text-orange-600" />
                  <span>Đọc câu</span>
                </button>
                <button
                  onClick={() => sound.speakWord(word.example, 0.65)}
                  className="flex items-center gap-1 text-amber-800 hover:text-orange-700 font-bold bg-white hover:bg-amber-100 px-2 py-1 rounded-xl border border-amber-300 shadow-2xs active:scale-95 transition-all text-xs"
                  title="Nghe đọc chậm từng chữ"
                >
                  <Snail className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chậm</span>
                </button>
              </div>
            </div>

            {/* English Sentence */}
            <div className="text-base sm:text-lg font-['Paytone_One'] text-slate-800 tracking-wide mb-1.5">
              "{word.example}"
            </div>

            {/* Sentence IPA & Vietnamese Reading Guide */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {word.exampleIpa && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-amber-300/80 text-orange-700 font-mono text-xs sm:text-sm font-bold shadow-2xs">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">IPA</span>
                  <span>{word.exampleIpa}</span>
                </div>
              )}

              {word.exampleVietReading && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 rounded-lg border border-sky-200 text-sky-800 text-xs sm:text-sm font-bold shadow-2xs">
                  <span className="text-[10px] font-black text-sky-600 uppercase tracking-wider bg-sky-100/80 px-1.5 py-0.5 rounded">🇻🇳 Đọc giống TV</span>
                  <span className="font-['Paytone_One'] text-sky-900 tracking-wide">"{word.exampleVietReading}"</span>
                </div>
              )}
            </div>

            {/* Sentence Vietnamese Meaning */}
            {word.exampleMeaning && (
              <div className="text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50/90 border border-emerald-200 px-3 py-1.5 rounded-xl mb-2 flex items-start gap-1.5">
                <span className="font-extrabold text-emerald-600 shrink-0">👉 Nghĩa:</span>
                <span>{word.exampleMeaning}</span>
              </div>
            )}

            {/* Pronunciation & Intonation Hint */}
            {word.examplePronunciationHint && (
              <div className="text-xs font-semibold text-amber-950 bg-amber-100/70 border border-amber-300/70 px-3 py-2 rounded-xl flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-orange-900 block mb-0.5">💡 Gợi ý đọc & ngữ điệu:</span>
                  <span className="text-slate-700 leading-relaxed">{word.examplePronunciationHint}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleMastered}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                isMastered
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-2 border-amber-200'
              }`}
            >
              <CheckCircle className={`w-5 h-5 ${isMastered ? 'fill-white text-emerald-600' : ''}`} />
              <span>{isMastered ? 'Đã Thuộc Lòng (+20 XP)' : 'Đánh Dấu Đã Thuộc'}</span>
            </button>

            <button
              onClick={toggleFavorite}
              className={`p-3 rounded-2xl border-2 transition-all active:scale-95 shadow-sm ${
                isFavorite
                  ? 'bg-amber-400 border-amber-500 text-amber-950'
                  : 'bg-white border-amber-200 text-slate-500 hover:bg-amber-50'
              }`}
              title={isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào mục Yêu thích'}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-950' : ''}`} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
