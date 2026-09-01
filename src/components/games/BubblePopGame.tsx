import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UNITS_DATA } from '../../data/unitsData';
import { VocabularyItem, UserProfile } from '../../types';
import { Volume2, Trophy, RotateCcw, Flame, Sparkles, Heart, Star, Zap } from 'lucide-react';
import { sound } from '../../utils/audio';
import { saveUser, getStoredLeaderboard, saveLeaderboard } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface BubblePopGameProps {
  unitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExit: () => void;
}

interface BubbleOption {
  id: string;
  word: VocabularyItem;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
}

const BUBBLE_COLORS = [
  'bg-amber-100 border-amber-300 text-amber-950 hover:bg-amber-200',
  'bg-orange-100 border-orange-300 text-orange-950 hover:bg-orange-200',
  'bg-emerald-100 border-emerald-300 text-emerald-950 hover:bg-emerald-200',
  'bg-amber-50 border-orange-200 text-slate-800 hover:bg-amber-100',
  'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100',
  'bg-orange-50 border-amber-300 text-orange-900 hover:bg-orange-100',
];

export const BubblePopGame: React.FC<BubblePopGameProps> = ({
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

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [combo, setCombo] = useState(1);
  const [targetWord, setTargetWord] = useState<VocabularyItem | null>(null);
  const [bubbles, setBubbles] = useState<BubbleOption[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  // Generate a new question round
  const generateRound = (poolList: VocabularyItem[]) => {
    if (poolList.length === 0) return;
    const correct = poolList[Math.floor(Math.random() * poolList.length)];
    setTargetWord(correct);

    // Pick 3 random wrong options
    const others = poolList.filter((w) => w.id !== correct.id);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const roundOptions = [correct, ...shuffledOthers].sort(() => 0.5 - Math.random());

    const newBubbles: BubbleOption[] = roundOptions.map((word, idx) => ({
      id: `${word.id}_${Date.now()}_${idx}`,
      word,
      x: 10 + (idx % 2) * 45 + Math.random() * 8,
      y: 15 + Math.floor(idx / 2) * 40 + Math.random() * 8,
      color: BUBBLE_COLORS[idx % BUBBLE_COLORS.length],
      size: 90 + Math.random() * 20,
      speed: 2 + Math.random() * 2,
    }));

    setBubbles(newBubbles);
  };

  // Start game on mount
  useEffect(() => {
    generateRound(pool);
  }, [pool]);

  // Main countdown timer
  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, score]);

  const handleEndGame = () => {
    setIsGameOver(true);
    sound.playFanfare();
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
    });

    // Reward XP & Coins
    const gainedXp = Math.floor(score / 5) + 30;
    const gainedCoins = Math.floor(score / 20) + 10;
    const isNewHigh = score > user.highScores.bubblePop;

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
        bubblePop: Math.max(user.highScores.bubblePop, score),
      },
    };
    setUser(updatedUser);
    saveUser(updatedUser);

    // Update leaderboard score for local player
    const board = getStoredLeaderboard();
    const updatedBoard = board.map((item) => {
      if (item.isCurrentUser) {
        return {
          ...item,
          score: item.score + gainedXp,
        };
      }
      return item;
    });
    saveLeaderboard(updatedBoard);
  };

  const handleBubbleClick = (bubble: BubbleOption) => {
    if (isGameOver || !targetWord) return;

    if (bubble.word.id === targetWord.id) {
      // Correct!
      sound.playPop();
      sound.playCorrect();

      const points = 10 * combo;
      setScore((prev) => prev + points);
      setStreakCount((prev) => prev + 1);
      setCombo((prev) => Math.min(prev + 1, 5));
      setFeedback({ text: `+${points} Tuyệt cú mèo! 🎉`, color: 'text-emerald-500' });

      // Pronounce word
      sound.speakWord(targetWord.word, 0.95);

      setTimeout(() => {
        setFeedback(null);
        generateRound(pool);
      }, 400);
    } else {
      // Wrong!
      sound.playWrong();
      setCombo(1);
      setStreakCount(0);
      setFeedback({ text: `Thử lại nhé bạn! 🥺`, color: 'text-rose-500' });
      setTimeout(() => setFeedback(null), 600);
    }
  };

  const handleRestart = () => {
    sound.playPop();
    setScore(0);
    setTimeLeft(45);
    setCombo(1);
    setStreakCount(0);
    setIsGameOver(false);
    generateRound(pool);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Game Header Bar */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200 flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-slate-700 rounded-xl font-bold text-xs border border-amber-200 transition-transform active:scale-95"
        >
          ← Thoát Game
        </button>

        {/* Combo flame */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500 text-white rounded-full font-bold text-xs shadow-xs animate-bounce">
          <Flame className="w-4 h-4 fill-white" />
          <span>Combo x{combo}</span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-slate-800 rounded-full font-['Paytone_One'] text-sm border border-amber-200">
          <span>⏱️</span>
          <span>{timeLeft}s</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-950 rounded-full font-['Paytone_One'] text-sm border border-amber-200">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span>{score} điểm</span>
        </div>
      </div>

      {/* Target Word Prompt Banner */}
      {targetWord && !isGameOver && (
        <div className="bg-amber-100 rounded-3xl p-4 sm:p-5 text-slate-800 shadow-sm border-2 border-amber-300 text-center relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1">
            Bắn quả bóng có từ tiếng Anh của:
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl sm:text-3xl">{targetWord.emoji}</span>
            <span className="text-2xl sm:text-3xl font-['Paytone_One'] capitalize text-slate-900">
              "{targetWord.meaning}"
            </span>
          </div>

          <div className="text-xs font-bold text-slate-600 mt-1">
            Gợi ý chủ đề: <span className="underline">{targetWord.category}</span>
          </div>

          {feedback && (
            <div className={`text-sm sm:text-base font-bold ${feedback.color} bg-white px-4 py-1 rounded-full inline-block mt-2 border border-amber-200 shadow-xs animate-bounce`}>
              {feedback.text}
            </div>
          )}
        </div>
      )}

      {/* Bubbles Floating Stage */}
      {!isGameOver ? (
        <div className="bg-amber-50/60 rounded-3xl p-6 sm:p-8 min-h-[380px] border-2 border-amber-200 relative overflow-hidden flex items-center justify-center select-none shadow-inner">
          {/* Subtle decoration background */}
          <div className="absolute top-4 left-6 text-4xl opacity-20 pointer-events-none">☁️</div>
          <div className="absolute top-12 right-10 text-5xl opacity-15 pointer-events-none">☁️</div>
          <div className="absolute bottom-6 left-1/3 text-3xl opacity-20 pointer-events-none">✨</div>

          {/* Floating Bubble Buttons */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg relative z-10">
            {bubbles.map((bubble) => (
              <motion.button
                key={bubble.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5 + Math.random(),
                  ease: 'easeInOut',
                }}
                onClick={() => handleBubbleClick(bubble)}
                className={`p-4 sm:p-6 rounded-full ${bubble.color} shadow-sm border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md active:scale-95`}
              >
                <div className="text-2xl sm:text-3xl mb-1">{bubble.word.emoji}</div>
                <div className="font-['Paytone_One'] text-base sm:text-xl tracking-wide">
                  {bubble.word.word}
                </div>
                <div className="text-[11px] font-mono opacity-80 mt-0.5 font-bold">
                  {bubble.word.ipa}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        /* Game Over / Victory Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-amber-200 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800">
            Hết Giờ! Hoàn Thành Xuất Sắc!
          </h2>

          <div className="flex justify-center gap-2 text-3xl text-orange-400">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Tổng Điểm Đạt Được:</span>
              <span className="text-xl font-['Paytone_One'] text-orange-600 font-bold">
                {score} điểm
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Phần Thưởng XP:</span>
              <span className="text-sm font-bold text-emerald-700">+{Math.floor(score / 5) + 30} XP</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Xu Vàng Nhận Được:</span>
              <span className="text-sm font-bold text-amber-800">+{Math.floor(score / 20) + 10} Xu 🪙</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Kỷ Lục Cao Nhất Của Bé:</span>
              <span className="text-sm font-bold text-slate-800">{user.highScores.bubblePop} điểm</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Lần Nữa</span>
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
