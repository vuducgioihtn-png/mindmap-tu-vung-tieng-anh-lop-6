import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, Sparkles, Check, RotateCcw, ShieldCheck, Radio, Music } from 'lucide-react';
import { sound, FemaleVoiceOption } from '../utils/audio';

interface FemaleVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FemaleVoiceModal: React.FC<FemaleVoiceModalProps> = ({ isOpen, onClose }) => {
  const [voiceOptions, setVoiceOptions] = useState<FemaleVoiceOption[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [pitch, setPitch] = useState<number>(sound.customPitch);
  const [rate, setRate] = useState<number>(sound.customRate);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);

  const loadVoices = () => {
    const list = sound.getAvailableFemaleVoiceOptions();
    setVoiceOptions(list);
    const best = sound.getBestFemaleVoice();
    if (best) {
      setSelectedVoiceURI(best.voiceURI);
    }
    setPitch(sound.customPitch);
    setRate(sound.customRate);
  };

  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  const handleSelectVoice = (uri: string) => {
    setSelectedVoiceURI(uri);
    sound.selectFemaleVoice(uri);
    sound.playPop();
    // Test the newly selected voice
    handlePlayTest();
  };

  const handlePlayTest = () => {
    setIsPlayingTest(true);
    sound.speakWord("Hello! Welcome to Mindmap English Grade 6. Let's learn together!");
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 2800);
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    sound.setVoiceSettings(newPitch, rate);
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    sound.setVoiceSettings(pitch, newRate);
  };

  const handleReset = () => {
    sound.resetToBestSettings();
    sound.playPop();
    loadVoices();
    handlePlayTest();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border-4 border-pink-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-linear-to-r from-pink-500 via-rose-500 to-amber-500 p-5 text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner text-2xl">
                👩‍🏫
              </div>
              <div>
                <h3 className="font-['Paytone_One'] text-lg sm:text-xl text-white flex items-center gap-1.5">
                  Giọng Nữ Tiếng Anh Chuẩn
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                </h3>
                <p className="text-xs text-pink-100 font-semibold">
                  Âm sắc vang sáng • Ngân vang tròn chữ • Lọc sạch 100% giọng nam
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors relative z-10"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-sm">
            {/* Status notification banner */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-rose-900">
              <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-950 mb-0.5">
                  Đã kích hoạt bộ lọc giọng nữ cao cấp (Female Only)
                </p>
                <p className="text-rose-800 leading-relaxed">
                  Tất cả các giọng nam, giọng trầm đục, và giọng máy lạ đều đã bị loại bỏ. Hệ thống chỉ phát âm bằng giọng nữ tiếng Anh bản xứ trong trẻo, có độ ngân và truyền cảm tự nhiên.
                </p>
              </div>
            </div>

            {/* Live Audio Test Card */}
            <div className="bg-linear-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all ${
                  isPlayingTest ? 'bg-amber-500 text-white scale-105 animate-bounce' : 'bg-white text-amber-600 border border-amber-200'
                }`}>
                  <Volume2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-800 text-sm">
                    Nghe thử giọng đang chọn
                  </div>
                  <div className="text-xs text-slate-500 italic">
                    "Hello! Welcome to Mindmap English Grade 6..."
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlayTest}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Music className="w-4 h-4" />
                <span>{isPlayingTest ? 'Đang phát...' : 'Bấm Nghe Thử'}</span>
              </button>
            </div>

            {/* Detected female voices list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-pink-500" /> Danh sách giọng nữ khả dụng trên máy:
                </label>
                <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                  {voiceOptions.length} giọng nữ tìm thấy
                </span>
              </div>

              {voiceOptions.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 text-center">
                  Đang đồng bộ danh sách giọng nữ từ trình duyệt... Bạn vẫn có thể nhấn <strong>Nghe Thử</strong> ngay phía trên!
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {voiceOptions.map((opt) => {
                    const isSelected = selectedVoiceURI === opt.voice.voiceURI;
                    return (
                      <button
                        key={opt.voice.voiceURI}
                        onClick={() => handleSelectVoice(opt.voice.voiceURI)}
                        className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-pink-50/80 border-pink-400 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-pink-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span className="text-lg shrink-0">👩</span>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs truncate">
                                {opt.name}
                              </span>
                              {opt.isRecommended && (
                                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                                  Khuyên Dùng
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>📍 {opt.accentLabel}</span>
                              <span>•</span>
                              <span className="text-pink-600 font-medium">{opt.qualityLabel}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fine-tuning parameters (Pitch & Rate) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-bold">
                  <span className="text-slate-700 flex items-center gap-1">
                    <span>✨ Độ vang sáng & cao độ (Pitch):</span>
                  </span>
                  <span className="text-pink-600 font-extrabold">
                    {pitch >= 1.10 ? `${pitch.toFixed(2)}x (Vang sáng ngân hay)` : `${pitch.toFixed(2)}x (Tự nhiên)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.3"
                  step="0.02"
                  value={pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Trầm ấm nhẹ (0.9x)</span>
                  <span className="text-pink-600 font-bold">★ Chuẩn vang sáng (1.12x)</span>
                  <span>Cao trong (1.3x)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1 font-bold">
                  <span className="text-slate-700">⚡ Tốc độ phát âm:</span>
                  <span className="text-pink-600 font-extrabold">
                    {rate <= 0.75 ? `${rate.toFixed(2)}x (Chậm rõ từng từ)` : `${rate.toFixed(2)}x (Chuẩn lớp 6)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.65"
                  max="1.1"
                  step="0.05"
                  value={rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>Chậm rõ (0.65x)</span>
                  <span className="text-pink-600 font-bold">★ Chuẩn Lớp 6 (0.90x)</span>
                  <span>Nhanh (1.1x)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              onClick={handleReset}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition-all text-xs"
            >
              Hoàn Tất & Lưu
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
