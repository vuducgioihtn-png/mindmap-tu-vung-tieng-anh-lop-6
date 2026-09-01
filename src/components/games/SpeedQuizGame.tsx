import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UNITS_DATA } from '../../data/unitsData';
import { VocabularyItem, UserProfile } from '../../types';
import { Volume2, Trophy, RotateCcw, Flame, Heart, Zap, Sparkles, Check, X } from 'lucide-react';
import { sound } from '../../utils/audio';
import { saveUser, getStoredLeaderboard, saveLeaderboard } from '../../utils/storage';
import confetti from 'canvas-confetti';

interface SpeedQuizGameProps {
  unitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExit: () => void;
}

interface QuizQuestion {
  type: 'word_to_meaning' | 'meaning_to_word' | 'fill_blank';
  prompt: string;
  subPrompt?: string;
  correctAnswer: string;
  options: string[];
  wordItem: VocabularyItem;
}

export const SpeedQuizGame: React.FC<SpeedQuizGameProps> = ({
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
  const [lives, setLives] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(15);
  const [combo, setCombo] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const generateQuestion = (): QuizQuestion | null => {
    if (pool.length < 4) return null;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const others = pool.filter((w) => w.id !== target.id);
    const wrongDistractors = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);

    const questionType = Math.random() > 0.4 ? 'meaning_to_word' : 'word_to_meaning';

    if (questionType === 'meaning_to_word') {
      const options = [target.word, ...wrongDistractors.map((w) => w.word)].sort(
        () => 0.5 - Math.random()
      );
      return {
        type: 'meaning_to_word',
        prompt: `Từ tiếng Anh nào có nghĩa là: "${target.meaning}"?`,
        subPrompt: `Ví dụ: "${target.example}"`,
        correctAnswer: target.word,
        options,
        wordItem: target,
      };
    } else {
      const options = [target.meaning, ...wrongDistractors.map((w) => w.meaning)].sort(
        () => 0.5 - Math.random()
      );
      return {
        type: 'word_to_meaning',
        prompt: `Nghĩa tiếng Việt của từ "${target.word}" là gì?`,
        subPrompt: `Phiên âm: ${target.ipa}`,
        correctAnswer: target.meaning,
        options,
        wordItem: target,
      };
    }
  };

  const nextRound = () => {
    const q = generateQuestion();
    setCurrentQuestion(q);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimerSeconds(15);
  };

  useEffect(() => {
    nextRound();
  }, [pool]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver || isAnswered) return;
    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver, isAnswered, currentQuestion]);

  const handleTimeOut = () => {
    sound.playWrong();
    setIsAnswered(true);
    setCombo(1);
    const nextLives = lives - 1;
    setLives(nextLives);

    if (nextLives <= 0) {
      setTimeout(() => finishGame(), 1000);
    } else {
      setTimeout(() => nextRound(), 1200);
    }
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered || !currentQuestion || isGameOver) return;

    setSelectedAnswer(option);
    setIsAnswered(true);
    setQuestionsAnswered((prev) => prev + 1);

    if (option === currentQuestion.correctAnswer) {
      // Correct
      sound.playCorrect();
      sound.speakWord(currentQuestion.wordItem.word, 0.95);

      const points = (10 + timerSeconds) * combo;
      setScore((prev) => prev + points);
      setCombo((prev) => Math.min(prev + 1, 4));

      setTimeout(() => nextRound(), 1200);
    } else {
      // Wrong
      sound.playWrong();
      setCombo(1);
      const nextLives = lives - 1;
      setLives(nextLives);

      if (nextLives <= 0) {
        setTimeout(() => finishGame(), 1200);
      } else {
        setTimeout(() => nextRound(), 1400);
      }
    }
  };

  const finishGame = () => {
    setIsGameOver(true);
    sound.playFanfare();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });

    const gainedXp = Math.floor(score / 4) + 40;
    const gainedCoins = Math.floor(score / 15) + 15;

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
        speedQuiz: Math.max(user.highScores.speedQuiz, score),
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
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-sm border-2 border-amber-200 flex items-center justify-between gap-2">
        <button
          onClick={onExit}
          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-slate-700 rounded-xl font-bold text-xs border border-amber-200 transition-transform active:scale-95"
        >
          ← Thoát
        </button>

        {/* Lives ❤️ */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((heart) => (
            <Heart
              key={heart}
              className={`w-5 h-5 transition-transform ${
                heart <= lives
                  ? 'text-orange-500 fill-orange-500 scale-110'
                  : 'text-amber-200 fill-amber-100 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Combo */}
        <div className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded-full font-bold text-xs shadow-xs">
          <Flame className="w-4 h-4 fill-white" />
          <span>x{combo}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-950 rounded-full font-['Paytone_One'] text-sm border border-amber-200">
          <Trophy className="w-4 h-4 text-orange-500" />
          <span>{score}</span>
        </div>
      </div>

      {!isGameOver && currentQuestion ? (
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border-2 border-amber-200 space-y-5 select-none">
          {/* Timer bar */}
          <div className="w-full h-3 bg-amber-50 rounded-full overflow-hidden border border-amber-200">
            <motion.div
              className={`h-full ${
                timerSeconds <= 5 ? 'bg-orange-600' : timerSeconds <= 9 ? 'bg-orange-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${(timerSeconds / 15) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Question Box */}
          <div className="bg-amber-50 rounded-3xl p-5 text-center border border-amber-200 relative">
            <div className="text-5xl mb-2">{currentQuestion.wordItem.emoji}</div>
            <h3 className="text-xl sm:text-2xl font-['Paytone_One'] text-slate-800 leading-tight">
              {currentQuestion.prompt}
            </h3>
            {currentQuestion.subPrompt && (
              <p className="text-xs sm:text-sm font-bold text-orange-700 mt-1 italic">
                {currentQuestion.subPrompt}
              </p>
            )}
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQuestion.correctAnswer;

              let btnStyle =
                'bg-amber-50/60 hover:bg-amber-100/80 text-slate-800 border-2 border-amber-200 hover:border-orange-300';

              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-xs animate-pulse';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 text-white border-2 border-rose-600';
                } else {
                  btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
                }
              }

              return (
                <motion.button
                  key={opt + idx}
                  whileHover={{ scale: isAnswered ? 1 : 1.01 }}
                  whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                  onClick={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                  className={`p-4 rounded-2xl font-['Paytone_One'] text-base sm:text-lg flex items-center justify-between text-left transition-all active:scale-95 shadow-2xs ${btnStyle}`}
                >
                  <span className="truncate">{opt}</span>
                  {isAnswered && isCorrect && <Check className="w-5 h-5 flex-shrink-0" />}
                  {isAnswered && isSelected && !isCorrect && (
                    <X className="w-5 h-5 flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-amber-200 text-center space-y-4 max-w-lg mx-auto"
        >
          <div className="text-6xl animate-bounce">⚡</div>
          <h2 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800">
            Kết Thúc Đấu Trường!
          </h2>

          <div className="flex justify-center gap-2 text-3xl text-orange-400">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Điểm Trận Đấu:</span>
              <span className="text-xl font-['Paytone_One'] text-orange-600 font-bold">
                {score} điểm
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Số Câu Đã Đấu:</span>
              <span className="text-sm font-bold text-slate-800">{questionsAnswered} câu</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Phần Thưởng:</span>
              <span className="text-sm font-bold text-emerald-700">
                +{Math.floor(score / 4) + 40} XP • +{Math.floor(score / 15) + 15} Xu 🪙
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                sound.playPop();
                setScore(0);
                setLives(3);
                setCombo(1);
                setIsGameOver(false);
                nextRound();
              }}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đấu Lại</span>
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
