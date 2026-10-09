import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UNITS_DATA } from '../data/unitsData';
import { VocabularyItem, UserProfile } from '../types';
import {
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Trophy,
  Flame,
  Award,
  BookOpen,
  Keyboard,
  Shuffle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { sound } from '../utils/audio';
import { saveUser, getStoredLeaderboard, saveLeaderboard } from '../utils/storage';
import confetti from 'canvas-confetti';

export type DictationSubMode = 'full_write' | 'fill_missing';

interface DictationViewProps {
  initialUnitId: number;
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  onOpenWordDetail?: (word: VocabularyItem) => void;
  subModeDefault?: DictationSubMode;
}

export const DictationView: React.FC<DictationViewProps> = ({
  initialUnitId,
  user,
  setUser,
  onOpenWordDetail,
  subModeDefault = 'full_write',
}) => {
  // Current settings
  const [selectedUnitId, setSelectedUnitId] = useState<number>(initialUnitId);
  const [subMode, setSubMode] = useState<DictationSubMode>(subModeDefault);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.9); // 0.9 normal, 0.65 slow

  // Word pool
  const pool = useMemo(() => {
    if (selectedUnitId === 0) return UNITS_DATA.flatMap((u) => u.words);
    const u = UNITS_DATA.find((item) => item.id === selectedUnitId);
    return u ? u.words : UNITS_DATA[0].words;
  }, [selectedUnitId]);

  // Current session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  // For 'fill_missing' mode: an array of characters or null for blanks
  const [letterSlots, setLetterSlots] = useState<Array<{ char: string; isBlank: boolean; userChar: string }>>([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);

  // Verification state
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [streak, setStreak] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showHintMeaning, setShowHintMeaning] = useState(false);
  const [showHintFirstLetter, setShowHintFirstLetter] = useState(false);
  const [showVietReading, setShowVietReading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const slotRefs = useRef<Array<HTMLInputElement | null>>([]);

  const currentWord: VocabularyItem | undefined = pool[currentIndex % pool.length];

  // Helper to initialize current word test
  const setupWord = (idx: number, currentSubMode: DictationSubMode) => {
    if (!pool.length) return;
    const word = pool[idx % pool.length];
    setInputVal('');
    setStatus('idle');
    setShowHintMeaning(false);
    setShowHintFirstLetter(false);
    setShowVietReading(false);

    if (currentSubMode === 'fill_missing') {
      // Build slots for missing characters
      const cleanWord = word.word.trim();
      const chars = cleanWord.split('');

      // Determine which indices to hide (e.g. 40% to 60% of letters, minimum 1, keeping first letter visible if possible unless long)
      const letterIndices: number[] = [];
      chars.forEach((c, i) => {
        if (/[a-zA-Z]/.test(c)) letterIndices.push(i);
      });

      // Select indices to blank out
      const totalBlanks = Math.max(1, Math.min(letterIndices.length - 1, Math.round(letterIndices.length * 0.45)));
      
      // Shuffle indices (excluding the very first letter if word has >= 3 letters to make it friendly)
      const poolOfBlanks = letterIndices.filter((pos) => pos > 0);
      const shuffledIndices = [...poolOfBlanks].sort(() => 0.5 - Math.random());
      const blankIndices = new Set(shuffledIndices.slice(0, totalBlanks));

      // Fallback if somehow no blanks
      if (blankIndices.size === 0 && letterIndices.length > 0) {
        blankIndices.add(letterIndices[letterIndices.length - 1]);
      }

      const slots = chars.map((char, i) => {
        const isLetter = /[a-zA-Z]/.test(char);
        const isBlank = isLetter && blankIndices.has(i);
        return {
          char,
          isBlank,
          userChar: isBlank ? '' : char,
        };
      });

      setLetterSlots(slots);
      
      // Find first blank slot
      const firstBlank = slots.findIndex((s) => s.isBlank);
      setActiveSlotIdx(firstBlank !== -1 ? firstBlank : 0);
    }

    // Auto speak the word with pleasant resonant female voice
    setTimeout(() => {
      handlePlayVoice(word.word, audioSpeed);
    }, 250);
  };

  useEffect(() => {
    setCurrentIndex(0);
    setSessionScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setShowSummary(false);
    setupWord(0, subMode);
  }, [selectedUnitId, subMode]);

  // Focus input automatically
  useEffect(() => {
    if (status === 'idle') {
      if (subMode === 'full_write') {
        inputRef.current?.focus();
      } else {
        const targetRef = slotRefs.current[activeSlotIdx];
        targetRef?.focus();
      }
    }
  }, [currentIndex, subMode, activeSlotIdx, status]);

  // Play voice
  const handlePlayVoice = (text: string, speed: number = 0.9) => {
    setIsPlayingAudio(true);
    sound.speakWord(text, speed);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 1200);
  };

  // Toggle speed between normal (0.9) and slow (0.65)
  const handleToggleSpeed = () => {
    const newSpeed = audioSpeed === 0.9 ? 0.65 : 0.9;
    setAudioSpeed(newSpeed);
    sound.playPop();
    if (currentWord) {
      handlePlayVoice(currentWord.word, newSpeed);
    }
  };

  // Normalize comparison strings
  const normalize = (str: string) => {
    return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Handle Full Write submission
  const handleSubmitFullWrite = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || status !== 'idle') return;

    const userText = normalize(inputVal);
    const targetText = normalize(currentWord.word);

    if (!userText) return;

    if (userText === targetText) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  // Handle Fill Missing slot change
  const handleSlotChange = (index: number, val: string) => {
    if (status !== 'idle') return;
    const char = val.slice(-1).toLowerCase();
    
    // Only accept alphabet
    if (val && !/^[a-zA-Z]$/.test(char)) return;

    const newSlots = [...letterSlots];
    newSlots[index].userChar = char;
    setLetterSlots(newSlots);

    if (char) {
      sound.playPop();
      // Jump to next blank slot
      let nextBlank = -1;
      for (let i = index + 1; i < newSlots.length; i++) {
        if (newSlots[i].isBlank && !newSlots[i].userChar) {
          nextBlank = i;
          break;
        }
      }
      if (nextBlank === -1) {
        // Find any empty blank
        nextBlank = newSlots.findIndex((s) => s.isBlank && !s.userChar);
      }

      if (nextBlank !== -1) {
        setActiveSlotIdx(nextBlank);
        slotRefs.current[nextBlank]?.focus();
      } else {
        // All blanks filled -> check auto
        checkFillMissingAnswer(newSlots);
      }
    }
  };

  const handleSlotKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !letterSlots[index].userChar) {
      // Find previous blank slot
      for (let i = index - 1; i >= 0; i--) {
        if (letterSlots[i].isBlank) {
          setActiveSlotIdx(i);
          slotRefs.current[i]?.focus();
          break;
        }
      }
    } else if (e.key === 'Enter') {
      checkFillMissingAnswer(letterSlots);
    }
  };

  const checkFillMissingAnswer = (slots: typeof letterSlots) => {
    if (!currentWord || status !== 'idle') return;
    const currentBuilt = slots.map((s) => s.userChar).join('').toLowerCase();
    const target = currentWord.word.toLowerCase();

    if (currentBuilt === target) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  // Handle Correct
  const handleCorrectAnswer = () => {
    sound.playCorrect();
    setStatus('correct');
    const newStreak = streak + 1;
    setStreak(newStreak);
    setCorrectCount((prev) => prev + 1);

    const points = 20 + Math.min(newStreak * 5, 25);
    setSessionScore((prev) => prev + points);

    // Confetti on streaks
    if (newStreak % 5 === 0) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    // Award XP, coins & mastered word in user profile
    const updatedUser: UserProfile = {
      ...user,
      xp: user.xp + points,
      coins: user.coins + 5,
      masteredWordIds: Array.from(new Set([...user.masteredWordIds, currentWord.id])),
      dailyGoals: {
        ...user.dailyGoals,
        wordsLearnedToday: user.dailyGoals.wordsLearnedToday + 1,
      },
    };
    setUser(updatedUser);
    saveUser(updatedUser);

    // Sync leaderboard
    const currentLb = getStoredLeaderboard();
    const updatedLb = currentLb.map((u) => {
      if (u.isCurrentUser) {
        return { ...u, score: u.score + points };
      }
      return u;
    });
    saveLeaderboard(updatedLb);
  };

  // Handle Wrong
  const handleWrongAnswer = () => {
    sound.playWrong();
    setStatus('wrong');
    setStreak(0);
    setWrongCount((prev) => prev + 1);
  };

  // Move to next word
  const handleNextWord = () => {
    sound.playPop();
    const nextIdx = currentIndex + 1;
    if (nextIdx >= pool.length && pool.length > 0) {
      // Completed full unit
      setShowSummary(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } else {
      setCurrentIndex(nextIdx);
      setupWord(nextIdx, subMode);
    }
  };

  // Retry current word
  const handleRetryCurrent = () => {
    sound.playPop();
    setupWord(currentIndex, subMode);
  };

  // Restart unit
  const handleRestartSession = () => {
    sound.playPop();
    setCurrentIndex(0);
    setSessionScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setShowSummary(false);
    setupWord(0, subMode);
  };

  // Revealed first letter hint
  const handleUseHint = () => {
    sound.playPop();
    if (!showHintFirstLetter) {
      setShowHintFirstLetter(true);
      setShowHintMeaning(true);
    } else {
      setShowVietReading(true);
    }
  };

  if (!currentWord) {
    return <div className="text-center py-10 font-bold">Không tìm thấy từ vựng</div>;
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Controls & Mode Switcher */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-amber-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Header & Badges */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">✍️</span>
              <div>
                <h2 className="font-['Paytone_One'] text-slate-800 text-lg sm:text-xl flex items-center gap-2">
                  Nghe & Viết Từ Vựng
                  <span className="text-xs bg-orange-100 text-orange-800 font-black px-2 py-0.5 rounded-full border border-orange-200">
                    Chính Tả Siêu Đẳng
                  </span>
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  Luyện tai nghe nhạy bén và ghi nhớ chính xác từng chữ cái tiếng Anh
                </p>
              </div>
            </div>
          </div>

          {/* Unit Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Bài học:</span>
            <select
              value={selectedUnitId}
              onChange={(e) => {
                sound.playPop();
                setSelectedUnitId(Number(e.target.value));
              }}
              className="px-3 py-2 font-['Paytone_One'] text-xs sm:text-sm bg-amber-50 border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:border-orange-500 shadow-sm"
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

        {/* 2 Big Mode Tabs: Viết Toàn Bộ vs Điền Ký Tự Còn Thiếu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-100">
          {/* Mode 1: Full Write */}
          <button
            onClick={() => {
              if (subMode !== 'full_write') {
                sound.playPop();
                setSubMode('full_write');
              }
            }}
            className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
              subMode === 'full_write'
                ? 'bg-orange-500 text-white border-orange-600 shadow-md transform scale-[1.01]'
                : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 border-amber-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${
                subMode === 'full_write' ? 'bg-white/20 text-white' : 'bg-white text-orange-600 border border-amber-200'
              }`}
            >
              ⌨️
            </div>
            <div className="flex-1">
              <div className="font-['Paytone_One'] text-sm sm:text-base flex items-center gap-2">
                1. Viết Lại Toàn Bộ Từ
                {subMode === 'full_write' && <Check className="w-4 h-4 ml-auto" />}
              </div>
              <div
                className={`text-xs font-semibold leading-tight mt-0.5 ${
                  subMode === 'full_write' ? 'text-orange-100' : 'text-slate-500'
                }`}
              >
                Nghe giọng nữ phát âm và gõ đầy đủ 100% các chữ cái
              </div>
            </div>
          </button>

          {/* Mode 2: Fill Missing */}
          <button
            onClick={() => {
              if (subMode !== 'fill_missing') {
                sound.playPop();
                setSubMode('fill_missing');
              }
            }}
            className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 text-left transition-all ${
              subMode === 'fill_missing'
                ? 'bg-amber-600 text-white border-amber-700 shadow-md transform scale-[1.01]'
                : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 border-amber-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold ${
                subMode === 'fill_missing' ? 'bg-white/20 text-white' : 'bg-white text-amber-600 border border-amber-200'
              }`}
            >
              🧩
            </div>
            <div className="flex-1">
              <div className="font-['Paytone_One'] text-sm sm:text-base flex items-center gap-2">
                2. Điền Ký Tự Bị Khuyết
                {subMode === 'fill_missing' && <Check className="w-4 h-4 ml-auto" />}
              </div>
              <div
                className={`text-xs font-semibold leading-tight mt-0.5 ${
                  subMode === 'fill_missing' ? 'text-amber-100' : 'text-slate-500'
                }`}
              >
                Có sẵn các chữ cái nền, điền thêm các ký tự còn thiếu
              </div>
            </div>
          </button>
        </div>

        {/* Live Session Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-amber-100 text-xs font-bold text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200">
              <BookOpen className="w-3.5 h-3.5 text-amber-700" />
              Câu {currentIndex + 1} / {pool.length}
            </span>

            <span className="flex items-center gap-1.5 bg-orange-100/80 px-2.5 py-1 rounded-full border border-orange-200 text-orange-800">
              <Trophy className="w-3.5 h-3.5 text-orange-600" />
              Điểm: {sessionScore}
            </span>

            <span className="flex items-center gap-1.5 bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-200 text-rose-800">
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              Chuỗi: {streak} 🔥
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-700 font-black">✓ Đúng: {correctCount}</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600 font-black">✗ Sai: {wrongCount}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Dictation Arena */}
      {!showSummary ? (
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border-2 border-amber-200 relative overflow-hidden">
          {/* Progress bar */}
          <div className="w-full bg-amber-100 h-2.5 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-orange-400 to-amber-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / pool.length) * 100}%` }}
            />
          </div>

          {/* Central Audio Soundstage */}
          <div className="text-center py-4 flex flex-col items-center">
            {/* Audio Pulsing Speaker Button with Female Voice Indicator */}
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayVoice(currentWord.word, audioSpeed)}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-lg transition-all border-4 relative ${
                  isPlayingAudio
                    ? 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white border-orange-300 ring-8 ring-orange-200 animate-pulse'
                    : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white border-white ring-4 ring-orange-100 hover:ring-orange-200 hover:shadow-xl'
                }`}
              >
                <Volume2 className="w-12 h-12 sm:w-14 sm:h-14 mb-1" />
                <span className="font-['Paytone_One'] text-xs uppercase tracking-wider">
                  {isPlayingAudio ? 'Đang đọc...' : 'Bấm Để Nghe'}
                </span>

                {/* Resonant female wave effect rings */}
                {isPlayingAudio && (
                  <div className="absolute inset-0 rounded-full border-4 border-orange-300 animate-ping opacity-30" />
                )}
              </motion.button>
            </div>

            {/* Voice badge & speed switch */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 font-bold text-xs border border-orange-200">
                <span>👩‍🏫</span> Giọng Nữ Chuẩn (Vang & Sáng)
              </span>

              {/* Speed Switch: 0.9x vs 0.65x */}
              <button
                onClick={handleToggleSpeed}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border transition-all ${
                  audioSpeed === 0.65
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <span>{audioSpeed === 0.65 ? '🐌 Đọc Chậm (0.65x)' : '⚡ Tốc Độ Chuẩn (1x)'}</span>
              </button>
            </div>

            {/* Instruction text */}
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-3 max-w-md">
              {subMode === 'full_write'
                ? 'Hãy lắng nghe kỹ và gõ lại toàn bộ từ vựng vào ô bên dưới:'
                : 'Lắng nghe phát âm và điền các chữ cái còn thiếu vào các ô trống:'}
            </p>
          </div>

          {/* Interactive Writing Area */}
          <div className="mt-4 max-w-xl mx-auto">
            {/* SUB-MODE 1: Full Write */}
            {subMode === 'full_write' && (
              <form onSubmit={handleSubmitFullWrite} className="space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={status === 'correct'}
                    value={inputVal}
                    onChange={(e) => {
                      if (status === 'wrong') setStatus('idle');
                      setInputVal(e.target.value);
                    }}
                    placeholder="Gõ từ vựng bạn vừa nghe..."
                    className={`w-full py-4 px-6 text-xl sm:text-2xl font-black text-center tracking-wide rounded-2xl border-4 transition-all focus:outline-none ${
                      status === 'correct'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-4 ring-emerald-100'
                        : status === 'wrong'
                        ? 'bg-rose-50 text-rose-800 border-rose-500 ring-4 ring-rose-100'
                        : 'bg-white text-slate-800 border-amber-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                    }`}
                  />

                  {/* Clear button */}
                  {inputVal && status === 'idle' && (
                    <button
                      type="button"
                      onClick={() => setInputVal('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Primary Action Button */}
                {status === 'idle' && (
                  <button
                    type="submit"
                    disabled={!inputVal.trim()}
                    className={`w-full py-3.5 rounded-2xl font-['Paytone_One'] text-base shadow-md flex items-center justify-center gap-2 transition-all ${
                      inputVal.trim()
                        ? 'bg-orange-500 hover:bg-orange-600 text-white active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    <span>KIỂM TRA ĐÁP ÁN</span>
                  </button>
                )}
              </form>
            )}

            {/* SUB-MODE 2: Fill Missing Letters */}
            {subMode === 'fill_missing' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 py-3">
                  {letterSlots.map((slot, idx) => {
                    if (!slot.isBlank) {
                      // Already provided letter (clue)
                      return (
                        <div
                          key={`slot_given_${idx}`}
                          className="w-10 h-13 sm:w-12 sm:h-16 rounded-xl bg-amber-100/90 border-2 border-amber-300 flex items-center justify-center font-['Paytone_One'] text-xl sm:text-2xl text-amber-900 select-none shadow-sm"
                        >
                          {slot.char}
                        </div>
                      );
                    }

                    // User fillable blank slot
                    const isFocused = activeSlotIdx === idx;
                    const isBlankCorrect = status === 'correct';
                    const isBlankWrong = status === 'wrong';

                    return (
                      <input
                        key={`slot_blank_${idx}`}
                        ref={(el) => {
                          slotRefs.current[idx] = el;
                        }}
                        type="text"
                        maxLength={1}
                        value={slot.userChar}
                        disabled={status === 'correct'}
                        onFocus={() => setActiveSlotIdx(idx)}
                        onChange={(e) => handleSlotChange(idx, e.target.value)}
                        onKeyDown={(e) => handleSlotKeyDown(idx, e)}
                        className={`w-10 h-13 sm:w-12 sm:h-16 rounded-xl text-center font-['Paytone_One'] text-xl sm:text-2xl uppercase transition-all border-3 focus:outline-none ${
                          isBlankCorrect
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                            : isBlankWrong
                            ? 'bg-rose-50 text-rose-800 border-rose-500 animate-shake'
                            : isFocused
                            ? 'bg-white text-orange-600 border-orange-500 ring-4 ring-orange-200'
                            : 'bg-white text-slate-800 border-amber-300'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Check button for fill missing if needed */}
                {status === 'idle' && (
                  <button
                    type="button"
                    onClick={() => checkFillMissingAnswer(letterSlots)}
                    className="w-full py-3.5 rounded-2xl font-['Paytone_One'] text-base shadow-md flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white active:scale-95 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    <span>XÁC NHẬN TỪ ĐÃ HOÀN THIỆN</span>
                  </button>
                )}
              </div>
            )}

            {/* SUCCESS BANNER */}
            <AnimatePresence>
              {status === 'correct' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-slate-800 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-['Paytone_One'] text-lg text-emerald-800">
                          Chính Xác Tuyệt Đối! 🎉
                        </span>
                        <span className="text-xs font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                          +20 XP
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-700 mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xl font-['Paytone_One'] text-orange-600">
                          {currentWord.word}
                        </span>
                        <span className="text-slate-500 font-mono text-xs">{currentWord.ipa}</span>
                        {currentWord.vietReading && (
                          <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-md border border-amber-200">
                            🇻🇳 {currentWord.vietReading}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-1">
                        👉 Nghĩa: <span className="font-black text-slate-800">{currentWord.meaning}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-emerald-200">
                    <button
                      onClick={handleNextWord}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-['Paytone_One'] text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>TỪ TIẾP THEO</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    {onOpenWordDetail && (
                      <button
                        onClick={() => onOpenWordDetail(currentWord)}
                        className="px-3.5 py-3 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs border border-emerald-300"
                      >
                        Chi tiết từ
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* WRONG BANNER */}
            <AnimatePresence>
              {status === 'wrong' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-slate-800 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <X className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-['Paytone_One'] text-base text-rose-800">
                        Chưa Đúng Rồi, Đừng Nản Lòng Nhé!
                      </div>
                      <div className="text-xs font-semibold text-slate-600 mt-1">
                        Đáp án đúng là:
                      </div>
                      <div className="text-lg font-['Paytone_One'] text-rose-700 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>{currentWord.word}</span>
                        <span className="text-xs font-mono text-slate-500">{currentWord.ipa}</span>
                        {currentWord.vietReading && (
                          <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                            🇻🇳 {currentWord.vietReading}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-1">
                        Nghĩa: {currentWord.meaning}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-rose-200">
                    <button
                      onClick={handleRetryCurrent}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-['Paytone_One'] text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>THỬ LẠI TỪ NÀY</span>
                    </button>
                    <button
                      onClick={handleNextWord}
                      className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-['Paytone_One'] text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>BỎ QUA & TIẾP THEO</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smart Clue / Hint Options */}
            {status === 'idle' && (
              <div className="mt-5 pt-4 border-t border-amber-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      sound.playPop();
                      setShowHintMeaning((prev) => !prev);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      showHintMeaning
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>{showHintMeaning ? 'Ẩn nghĩa' : '💡 Gợi ý nghĩa tiếng Việt'}</span>
                  </button>

                  <button
                    onClick={handleUseHint}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                    <span>{showHintFirstLetter ? 'Gợi ý đọc tiếng Việt' : 'Gợi ý chữ cái đầu'}</span>
                  </button>
                </div>

                {onOpenWordDetail && (
                  <button
                    onClick={() => onOpenWordDetail(currentWord)}
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    Xem câu ví dụ 📖
                  </button>
                )}
              </div>
            )}

            {/* Revealed Hint Box */}
            <AnimatePresence>
              {(showHintMeaning || showHintFirstLetter || showVietReading) && status === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-1"
                >
                  {showHintMeaning && (
                    <div>
                      💡 <span className="font-bold text-slate-900">Nghĩa tiếng Việt:</span> {currentWord.meaning} ({currentWord.category})
                    </div>
                  )}
                  {showHintFirstLetter && (
                    <div>
                      🔤 <span className="font-bold text-slate-900">Bắt đầu bằng chữ:</span>{' '}
                      <span className="font-black text-orange-600 text-sm uppercase">
                        {currentWord.word.charAt(0)}
                      </span>{' '}
                      (gồm {currentWord.word.length} ký tự)
                    </div>
                  )}
                  {showVietReading && currentWord.vietReading && (
                    <div>
                      🇻🇳 <span className="font-bold text-slate-900">Đọc giống tiếng Việt:</span>{' '}
                      <span className="font-black text-amber-800">{currentWord.vietReading}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* Summary Report after completing unit session */
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border-2 border-amber-200 text-center space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-4xl sm:text-5xl mx-auto shadow-md">
            🏆
          </div>

          <div>
            <h3 className="text-2xl sm:text-3xl font-['Paytone_One'] text-slate-800">
              Hoàn Thành Bài Nghe Viết!
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
              Bạn đã luyện tập xuất sắc toàn bộ từ vựng trong bài học này!
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <div className="text-2xl font-['Paytone_One'] text-orange-600">{sessionScore}</div>
              <div className="text-xs font-bold text-slate-500">Điểm Số</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="text-2xl font-['Paytone_One'] text-emerald-600">{correctCount}</div>
              <div className="text-xs font-bold text-slate-500">Đúng Tuyệt Đối</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
              <div className="text-2xl font-['Paytone_One'] text-rose-600">{wrongCount}</div>
              <div className="text-xs font-bold text-slate-500">Cần Ôn Lại</div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRestartSession}
              className="w-full sm:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-['Paytone_One'] text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>LUYỆN TẬP LẠI UNIT NÀY</span>
            </button>

            <button
              onClick={() => {
                const nextUnit = (selectedUnitId % 12) + 1;
                setSelectedUnitId(nextUnit);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-['Paytone_One'] text-sm sm:text-base shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>SANG UNIT TIẾP THEO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
