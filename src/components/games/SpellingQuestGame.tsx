import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UNITS_DATA } from '../../data/unitsData';
import { VocabularyItem, UserProfile } from '../../types';
import { Volume2, Trophy, RotateCcw, Sparkles, HelpCircle, Delete, Check, ArrowRight, Star } from 'lucide-react';
import { sound } from '../../utils/audio';
import { saveUser, getStoredLeaderboard, saveLeaderboard } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface SpellingQuestGameProps {
  unitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExit: () => void;
}

interface LetterTile {
  id: string;
  char: string;
  isUsed: boolean;
}

export const SpellingQuestGame: React.FC<SpellingQuestGameProps> = ({
  unitId,
  user,
  setUser,
  onExit,
}) => {
  const pool = useMemo(() => {
    if (unitId === 0) return UNITS_DATA.flatMap((u) => u.words);
    const u = UNITS_DATA.find((item) => item.id === unitId);
    return u ? u.words : UNITS_DATA[0].words;
  }, [unitId]);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<VocabularyItem | null>(null);
  const [scrambledLetters, setScrambledLetters] = useState<LetterTile[]>([]);
  const [userLetters, setUserLetters] = useState<LetterTile[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWrong, setIsWrong] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const totalQuestions = Math.min(10, pool.length);

  const setupQuestion = (index: number) => {
    if (index >= totalQuestions) {
      handleFinishGame();
      return;
    }

    const word = pool[index % pool.length];
    setCurrentWord(word);
    setUserLetters([]);
    setIsSuccess(false);
    setIsWrong(false);

    // Filter only alphanumeric characters for spelling
    const cleanChars = word.word.toLowerCase().replace(/[^a-z]/g, '').split('');
    const letters: LetterTile[] = cleanChars.map((char, idx) => ({
      id: `l_${char}_${idx}_${Date.now()}`,
      char: char.toUpperCase(),
      isUsed: false,
    }));

    // Shuffle letters
    const shuffled = [...letters].sort(() => 0.5 - Math.random());
    setScrambledLetters(shuffled);
  };

  useEffect(() => {
    setupQuestion(questionIndex);
  }, [pool]);

  const handleLetterClick = (tile: LetterTile) => {
    if (tile.isUsed || isSuccess) return;
    sound.playPop();

    // Mark as used in pool
    setScrambledLetters((prev) =>
      prev.map((t) => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    // Add to user letters
    const nextUser = [...userLetters, tile];
    setUserLetters(nextUser);

    // Check if assembled full length
    const targetClean = (currentWord?.word || '').toLowerCase().replace(/[^a-z]/g, '');
    const currentInput = nextUser.map((t) => t.char.toLowerCase()).join('');

    if (currentInput.length === targetClean.length) {
      if (currentInput === targetClean) {
        // Correct!
        sound.playCorrect();
        if (currentWord) {
          sound.speakWord(currentWord.word, 0.95);
        }
        setIsSuccess(true);
        setScore((prev) => prev + (hintsUsed > 0 ? 15 : 25));

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        // Wrong spelling
        sound.playWrong();
        setIsWrong(true);
        setTimeout(() => setIsWrong(false), 800);
      }
    }
  };

  const handleRemoveUserLetter = (index: number) => {
    if (isSuccess) return;
    sound.playPop();
    const removedTile = userLetters[index];

    // Return to scrambled pool
    setScrambledLetters((prev) =>
      prev.map((t) => (t.id === removedTile.id ? { ...t, isUsed: false } : t))
    );

    // Remove from userLetters
    setUserLetters((prev) => prev.filter((_, idx) => idx !== index));
    setIsWrong(false);
  };

  const handleClear = () => {
    sound.playPop();
    setScrambledLetters((prev) => prev.map((t) => ({ ...t, isUsed: false })));
    setUserLetters([]);
    setIsWrong(false);
  };

  const handleHint = () => {
    if (!currentWord || isSuccess) return;
    sound.playPop();
    setHintsUsed((prev) => prev + 1);

    const targetClean = currentWord.word.toLowerCase().replace(/[^a-z]/g, '');
    const nextCharIndex = userLetters.length;
    if (nextCharIndex < targetClean.length) {
      const neededChar = targetClean[nextCharIndex].toUpperCase();
      const availableTile = scrambledLetters.find(
        (t) => !t.isUsed && t.char === neededChar
      );
      if (availableTile) {
        handleLetterClick(availableTile);
      }
    }
  };

  const handleNextQuestion = () => {
    sound.playPop();
    setHintsUsed(0);
    const nextIdx = questionIndex + 1;
    setQuestionIndex(nextIdx);
    setupQuestion(nextIdx);
  };

  const handleFinishGame = () => {
    setIsGameOver(true);
    sound.playFanfare();
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
    });

    const gainedXp = Math.floor(score / 4) + 35;
    const gainedCoins = Math.floor(score / 15) + 12;

    const updatedUser: UserProfile = {
      ...user,
      xp: user.xp + gainedXp,
      coins: user.coins + gainedCoins,
      dailyGoals: {
        ...user.dailyGoals,
        gamesPlayedToday: user.dailyGoals.gamesPlayedToday + 1,
      },
      highScores: {
        ...user.highScores,
        spellingQuest: Math.max(user.highScores.spellingQuest, score),
      },
    };
    setUser(updatedUser);
    saveUser(updatedUser);

    const board = getStoredLeaderboard();
    const updatedBoard = board.map((item) => {
      if (item.isCurrentUser) {
        return { ...item, score: item.score + gainedXp };
      }
      return item;
    });
    saveLeaderboard(updatedBoard);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200 flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-slate-700 rounded-xl font-bold text-xs border border-amber-200 transition-transform active:scale-95"
        >
          ← Thoát Game
        </button>

        <div className="font-['Paytone_One'] text-slate-700 text-xs sm:text-sm">
          Câu hỏi: {questionIndex + 1} / {totalQuestions}
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-950 rounded-full font-['Paytone_One'] text-sm border border-amber-200">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span>{score} điểm</span>
        </div>
      </div>

      {!isGameOver && currentWord ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border-2 border-amber-200 space-y-5 select-none">
          {/* Question Clue Box */}
          <div className="bg-amber-50 rounded-3xl p-4 text-center border border-amber-200 relative overflow-hidden">
            <div className="text-5xl sm:text-6xl mb-2">{currentWord.emoji}</div>
            <div className="text-xs font-bold uppercase text-amber-900 tracking-wider">
              Nghĩa Tiếng Việt
            </div>
            <h3 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800 capitalize mt-0.5">
              "{currentWord.meaning}"
            </h3>
            <div className="text-sm font-mono font-bold text-orange-700 mt-1">
              Phiên âm: {currentWord.ipa}
            </div>
            <p className="text-xs font-bold text-slate-600 italic mt-2">
              "{currentWord.example}"
            </p>
          </div>

          {/* User Assembled Letters Slots */}
          <div>
            <div className="text-xs font-bold text-slate-500 mb-1.5 text-center flex items-center justify-center gap-1">
              <span>Bấm vào ô chữ bên dưới để ghép từ:</span>
            </div>

            <div
              className={`flex flex-wrap items-center justify-center gap-2 p-3.5 min-h-[64px] rounded-2xl border-2 transition-colors ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-400'
                  : isWrong
                  ? 'bg-rose-50 border-rose-400'
                  : 'bg-amber-50/40 border-dashed border-amber-300'
              }`}
            >
              {userLetters.map((tile, idx) => (
                <motion.button
                  key={tile.id + idx}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleRemoveUserLetter(idx)}
                  className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-['Paytone_One'] text-xl sm:text-2xl flex items-center justify-center shadow-xs border-2 cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-orange-400 text-white border-orange-500 hover:bg-orange-500'
                  }`}
                  title="Bấm để gỡ chữ này"
                >
                  {tile.char}
                </motion.button>
              ))}

              {userLetters.length === 0 && (
                <span className="text-xs font-bold text-slate-400 italic">
                  Chưa chọn chữ cái nào...
                </span>
              )}
            </div>
          </div>

          {/* Available Scrambled Letter Blocks */}
          {!isSuccess && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {scrambledLetters.map((tile) => (
                  <motion.button
                    key={tile.id}
                    whileHover={{ scale: tile.isUsed ? 1 : 1.05 }}
                    whileTap={{ scale: tile.isUsed ? 1 : 0.95 }}
                    onClick={() => handleLetterClick(tile)}
                    disabled={tile.isUsed}
                    className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-['Paytone_One'] text-xl sm:text-2xl flex items-center justify-center shadow-xs border-2 transition-all ${
                      tile.isUsed
                        ? 'bg-amber-50 text-slate-300 border-amber-100 cursor-not-allowed opacity-40'
                        : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200 cursor-pointer'
                    }`}
                  >
                    {tile.char}
                  </motion.button>
                ))}
              </div>

              {/* Action Tools */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleHint}
                  className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl font-bold text-xs flex items-center gap-1 border border-amber-200 shadow-2xs"
                >
                  <HelpCircle className="w-4 h-4 text-orange-500" /> Gợi Ý 1 Chữ
                </button>

                <button
                  onClick={handleClear}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1 border border-amber-200"
                >
                  <RotateCcw className="w-4 h-4" /> Làm Lại Từ Đầu
                </button>
              </div>
            </div>
          )}

          {/* Success Banner & Next Button */}
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-300 text-left space-y-3 shadow-sm"
            >
              <div className="text-lg sm:text-xl font-['Paytone_One'] text-emerald-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-600" />
                  <span>Chính xác tuyệt đối! 🎉</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  +{hintsUsed > 0 ? 15 : 25} Điểm
                </span>
              </div>

              {/* Word & IPA pill */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xl">{currentWord.emoji}</span>
                    <span className="font-['Paytone_One'] text-lg text-slate-800">{currentWord.word}</span>
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {currentWord.ipa}
                    </span>
                    {currentWord.vietReading && (
                      <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        🇻🇳 Đọc: <strong>{currentWord.vietReading}</strong>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => sound.speakWord(currentWord.word)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition-colors"
                    title="Nghe phát âm từ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-600 mb-2">
                  👉 Nghĩa: <span className="text-emerald-700 font-extrabold capitalize">{currentWord.meaning}</span>
                </div>

                {/* Example box */}
                <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-amber-900 mb-1">
                    <span>💬 Ví dụ thực hành:</span>
                    <button
                      onClick={() => sound.speakWord(currentWord.example)}
                      className="flex items-center gap-1 text-orange-700 hover:text-orange-900 font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-[11px]"
                    >
                      <Volume2 className="w-3 h-3" /> Đọc câu
                    </button>
                  </div>
                  <div className="font-bold text-slate-800 mb-1 italic">"{currentWord.example}"</div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1 text-[11px]">
                    {currentWord.exampleIpa && (
                      <span className="font-mono text-orange-700 bg-white/90 px-1.5 py-0.5 rounded border border-amber-200">
                        IPA: <strong>{currentWord.exampleIpa}</strong>
                      </span>
                    )}
                    {currentWord.exampleVietReading && (
                      <span className="text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-bold">
                        🇻🇳 Đọc: <strong className="text-sky-900 font-['Paytone_One']">{currentWord.exampleVietReading}</strong>
                      </span>
                    )}
                  </div>
                  {currentWord.exampleMeaning && (
                    <div className="text-[11px] font-bold text-emerald-700 mb-1">
                      👉 {currentWord.exampleMeaning}
                    </div>
                  )}
                  {currentWord.examplePronunciationHint && (
                    <div className="text-[10px] text-slate-600 bg-white/80 p-1.5 rounded border border-amber-200/60 leading-relaxed">
                      💡 <strong>Gợi ý đọc:</strong> {currentWord.examplePronunciationHint}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-base shadow-xs flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <span>Câu Tiếp Theo</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        /* Victory Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-amber-200 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="text-6xl animate-bounce">🏰</div>
          <h2 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800">
            Thám Hiểm Thành Công!
          </h2>

          <div className="flex justify-center gap-2 text-3xl text-orange-400">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Điểm Số Đạt Được:</span>
              <span className="text-xl font-['Paytone_One'] text-orange-600 font-bold">
                {score} điểm
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Phần Thưởng:</span>
              <span className="text-sm font-bold text-emerald-700">
                +{Math.floor(score / 4) + 35} XP • +{Math.floor(score / 15) + 12} Xu 🪙
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                sound.playPop();
                setScore(0);
                setQuestionIndex(0);
                setIsGameOver(false);
                setupQuestion(0);
              }}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>

            <button
              onClick={onExit}
              className="px-5 py-3 bg-amber-50 hover:bg-amber-100 text-slate-700 border border-amber-200 rounded-2xl font-bold text-sm active:scale-95 transition-all"
            >
              Chọn Trò Khác
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
