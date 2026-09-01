import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageCircle, HelpCircle, Volume2, Shuffle } from 'lucide-react';
import { sound } from '../utils/audio';

interface MascotGuideProps {
  currentUnitTitle?: string;
  contextText?: string;
}

interface Mascot {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
  quotes: string[];
}

const MASCOTS: Mascot[] = [
  {
    id: 'corgi',
    name: 'Corgi Mimi',
    avatar: '🐕',
    role: 'Bạn đồng hành vui vẻ',
    color: 'from-amber-400 to-orange-400',
    quotes: [
      'Chào bạn nhỏ! Mỗi ngày học 5 từ vựng là bạn sẽ siêu đẳng tiếng Anh luôn đó! 🚀',
      'Đừng quên bấm vào biểu tượng chiếc loa 🔊 để nghe phát âm chuẩn bản xứ nha!',
      'Bạn làm rất tốt! Hãy thử chơi game Bắn Bóng để kiểm tra trí nhớ nhé!',
      'Ghi nhớ bằng sơ đồ tư duy giúp não bộ chúng mình nhớ từ nhanh gấp 3 lần đấy!',
      'Hãy lật thẻ ghi nhớ và thử đoán nghĩa trước khi xem kết quả nhé! 💡',
    ],
  },
  {
    id: 'owl',
    name: 'Cú Mèo Poki',
    avatar: '🦉',
    role: 'Bác học phát âm',
    color: 'from-indigo-400 to-purple-500',
    quotes: [
      'Hãy chú ý phần phiên âm IPA (ví dụ: /ˈskuːl/) để phát âm thật chuẩn xác nhé!',
      'Học từ vựng cùng ví dụ cả câu sẽ giúp bạn nói tiếng Anh tự nhiên như người bản xứ!',
      'Mỗi ngày giữ chuỗi ngọn lửa 🔥 để leo lên đỉnh Bảng Xếp Hạng nha!',
      'Có từ nào khó? Bấm vào ngôi sao ⭐ để lưu vào mục Ôn Tập nhé!',
    ],
  },
  {
    id: 'dino',
    name: 'Khủng Long Rex',
    avatar: '🦖',
    role: 'Chiến binh trò chơi',
    color: 'from-emerald-400 to-teal-500',
    quotes: [
      'Gầm gừ! Bạn đã sẵn sàng phá kỷ lục điểm số trong Đấu Trường Game chưa nào?! 🎮',
      'Combo trả lời nhanh sẽ nhân đôi điểm số và tặng bạn nhiều xu vàng lắm đó!',
      'Cố lên hiệp sĩ tí hon, bạn đang tiến bộ vượt bậc từng ngày!',
    ],
  },
];

export const MascotGuide: React.FC<MascotGuideProps> = ({ currentUnitTitle, contextText }) => {
  const [currentMascotIndex, setCurrentMascotIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  const mascot = MASCOTS[currentMascotIndex];
  const activeQuote = contextText || mascot.quotes[quoteIndex % mascot.quotes.length];

  const handleNextQuote = () => {
    sound.playPop();
    setQuoteIndex((prev) => prev + 1);
  };

  const handleSwitchMascot = () => {
    sound.playPop();
    setCurrentMascotIndex((prev) => (prev + 1) % MASCOTS.length);
    setQuoteIndex(0);
  };

  const handleSpeakTip = () => {
    sound.speakWord(activeQuote, 0.95);
  };

  return (
    <div className="relative my-3 select-none">
      <div className="bg-white/95 backdrop-blur-xs border-2 border-orange-200 rounded-3xl p-3 sm:p-4 shadow-md flex items-center gap-3 sm:gap-4 transition-all relative">
        {/* Mascot Avatar & Animation */}
        <div className="relative flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.08, rotate: [0, -4, 4, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSwitchMascot}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-orange-400 flex items-center justify-center text-3xl sm:text-4xl shadow-md border-4 border-white cursor-pointer relative group"
            title="Bấm để đổi bạn đồng hành khác!"
          >
            {mascot.avatar}
            <span className="absolute -bottom-1 -right-1 bg-white text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-orange-200 shadow-xs flex items-center gap-0.5">
              <Shuffle className="w-2.5 h-2.5 text-orange-500" /> Đổi
            </span>
          </motion.button>
        </div>

        {/* Mascot Speech Bubble Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-['Paytone_One'] text-sm sm:text-base text-slate-800 flex items-center gap-1">
                {mascot.name}
              </span>
              <span className="text-[11px] font-bold px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full border border-orange-200">
                {mascot.role}
              </span>
              {currentUnitTitle && (
                <span className="text-[11px] font-extrabold text-amber-800 hidden md:inline-block">
                  • Đang xem: {currentUnitTitle}
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleNextQuote}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 shadow-2xs active:scale-95 transition-all flex items-center gap-1"
                title="Nghe lời khuyên khác"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Mẹo khác</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={activeQuote + mascot.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed"
            >
              {activeQuote}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
