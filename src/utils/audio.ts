// Web Audio Synthesizer & Speech Synthesis Utility for Kids App

export interface FemaleVoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  accentLabel: string;
  qualityLabel: string;
  isRecommended: boolean;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  // Female voice management
  private femaleVoices: SpeechSynthesisVoice[] = [];
  private selectedVoiceURI: string | null = null;
  public customPitch: number = 1.12; // Bright, resonant, cheerful pitch ("vang sáng")
  public customRate: number = 0.90; // Crisp, melodious articulation ("ngân hay")
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVoice = localStorage.getItem('mindmap_female_voice_uri');
        if (savedVoice) this.selectedVoiceURI = savedVoice;

        const savedPitch = localStorage.getItem('mindmap_female_pitch');
        if (savedPitch) this.customPitch = parseFloat(savedPitch) || 1.12;

        const savedRate = localStorage.getItem('mindmap_female_rate');
        if (savedRate) this.customRate = parseFloat(savedRate) || 0.90;
      } catch {
        // Ignore localStorage errors
      }

      if ('speechSynthesis' in window) {
        this.refreshFemaleVoices();
        window.speechSynthesis.onvoiceschanged = () => {
          this.refreshFemaleVoices();
        };
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Bubble pop sound effect
  playPop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Correct answer cheerful ding
  playCorrect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.06);

      gain.gain.setValueAtTime(0.25, now + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.06);
      osc.stop(now + index * 0.06 + 0.25);
    });
  }

  // Incorrect answer soft buzz
  playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Coin / Star collected
  playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Card flip whoosh
  playFlip() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Level up / Victory fanfare
  playFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.12 }, // C5
      { f: 659.25, t: 0.12, d: 0.12 }, // E5
      { f: 783.99, t: 0.24, d: 0.12 }, // G5
      { f: 1046.5, t: 0.36, d: 0.35 }, // C6
    ];

    melody.forEach(({ f, t, d }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.3, now + t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + t + d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  // ==========================================
  // FEMALE ENGLISH VOICES FILTERING & SCORING
  // ==========================================

  // Check if a voice is strictly male or robotic to eliminate
  private isMaleOrUnwantedVoice(voice: SpeechSynthesisVoice): boolean {
    const name = voice.name.toLowerCase();
    const uri = (voice.voiceURI || '').toLowerCase();
    const combined = `${name} ${uri}`;

    // Reject non-English
    if (!voice.lang.toLowerCase().startsWith('en')) {
      return true;
    }

    // Reject explicit male indicators
    if (/\b(male|man|boy|guy|mr|sir)\b/i.test(combined)) return true;
    if (combined.includes('-male') || combined.includes('_male') || combined.includes('#male')) return true;

    // Strict male names checklist across Edge, Windows, Mac, iOS, Android, Linux
    const maleNames = [
      'david', 'mark', 'george', 'ryan', 'eric', 'alex', 'fred',
      'daniel', 'oliver', 'richard', 'thomas', 'james', 'christopher', 'paul',
      'brian', 'steffan', 'edward', 'william', 'michael', 'kevin', 'arthur',
      'john', 'baritone', 'ralph', 'junior', 'albert', 'bruce', 'zarvox',
      'deranged', 'whisper', 'good news', 'bad news', 'trinoids', 'organ', 'cellos',
      'boing', 'bell', 'bubbles', 'sin-ji', 'russell', 'gordon', 'yuri', 'tom',
      'andrew', 'ian', 'lee', 'wayne', 'colin', 'aaron', 'peter', 'steve', 'bobby',
      'jack', 'harry', 'charles', 'henry', 'josh', 'jacob', 'noah', 'ethan',
      'liam', 'mason', 'lucas', 'benjamin', 'carl', 'connor', 'mitchell', 'reed',
      'nathan', 'sam ', 'guy '
    ];

    for (const m of maleNames) {
      if (new RegExp(`\\b${m.trim()}\\b`, 'i').test(combined)) {
        return true;
      }
    }

    // Reject novelty/joke voices on macOS
    const noveltyVoices = ['bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'good news', 'hysterical', 'pipe organ', 'trinoids', 'whisper', 'zarvox', 'albert', 'fred', 'junior', 'ralph'];
    if (noveltyVoices.some(nv => combined.includes(nv))) return true;

    return false;
  }

  // Calculate resonance & quality score for female voices
  private scoreFemaleVoice(voice: SpeechSynthesisVoice): number {
    const name = voice.name.toLowerCase();
    const uri = (voice.voiceURI || '').toLowerCase();
    const combined = `${name} ${uri}`;

    let score = 100;

    // Gold Standard Female Voices (Bright, resonant, clear enunciation)
    // 1. Microsoft Edge Natural Neural Voices (Best in class for resonance and tone)
    if (combined.includes('jenny') && combined.includes('natural')) return 3000;
    if (combined.includes('aria') && combined.includes('natural')) return 2900;
    if (combined.includes('sonia') && combined.includes('natural')) return 2800;
    if (combined.includes('libby') && combined.includes('natural')) return 2700;
    if (combined.includes('ana') && combined.includes('natural')) return 2600;
    if (combined.includes('michelle') && combined.includes('natural')) return 2550;
    if (combined.includes('ava') && combined.includes('natural')) return 2500;
    if (combined.includes('emma') && combined.includes('natural')) return 2450;

    // 2. Google Chrome High-Definition Female Voices
    if (combined.includes('google uk english female')) return 2400;
    if (combined.includes('google us english')) return 2350;

    // 3. Apple macOS / iOS / iPadOS Crystal-Clear Female Voices
    if (combined.includes('samantha')) return 2300;
    if (combined.includes('victoria')) return 2200;
    if (combined.includes('karen')) return 2100;
    if (combined.includes('moira')) return 2050;
    if (combined.includes('tessa')) return 2000;
    if (combined.includes('fiona')) return 1950;

    // 4. Windows Standard Desktop Female Voices
    if (combined.includes('zira')) return 1900;
    if (combined.includes('hazel')) return 1850;
    if (combined.includes('susan')) return 1800;
    if (combined.includes('catherine')) return 1750;

    // Known female names & markers
    const femaleNames = [
      'female', 'woman', 'girl', 'jenny', 'aria', 'sonia', 'libby', 'ana',
      'michelle', 'ava', 'emma', 'samantha', 'victoria', 'karen', 'moira',
      'tessa', 'fiona', 'zira', 'hazel', 'susan', 'catherine', 'allison',
      'chloe', 'veena', 'sangeeta', 'heera', 'stephanie', 'sarah', 'lisa',
      'clara', 'olivia', 'sophia', 'isabella', 'mia', 'charlotte', 'amelia',
      'siri', 'claire', 'grace', 'zoey', 'lily', 'hannah', 'elena'
    ];

    for (const fn of femaleNames) {
      if (new RegExp(`\\b${fn}\\b`, 'i').test(combined)) {
        score += 800;
        break;
      }
    }

    if (combined.includes('natural') || combined.includes('neural') || combined.includes('online')) {
      score += 500;
    }

    if (voice.lang.toLowerCase() === 'en-us' || voice.lang.toLowerCase() === 'en-gb') {
      score += 200;
    }

    if (voice.localService) {
      score += 50;
    }

    return score;
  }

  // Refresh and filter only female English voices
  public refreshFemaleVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];

    const all = window.speechSynthesis.getVoices();
    if (!all || all.length === 0) return [];

    // Filter out all male & non-English voices
    const candidates = all.filter(v => !this.isMaleOrUnwantedVoice(v));

    // Sort descending by female resonance score
    candidates.sort((a, b) => this.scoreFemaleVoice(b) - this.scoreFemaleVoice(a));

    this.femaleVoices = candidates;
    return this.femaleVoices;
  }

  // Get current best female voice
  public getBestFemaleVoice(): SpeechSynthesisVoice | null {
    if (this.femaleVoices.length === 0) {
      this.refreshFemaleVoices();
    }

    // If user explicitly picked a female voice from the list
    if (this.selectedVoiceURI) {
      const match = this.femaleVoices.find(v => v.voiceURI === this.selectedVoiceURI);
      if (match) return match;
    }

    // Top ranked resonant female voice
    return this.femaleVoices[0] || null;
  }

  // Get structured list of available female voices for UI selection
  public getAvailableFemaleVoiceOptions(): FemaleVoiceOption[] {
    const voices = this.femaleVoices.length > 0 ? this.femaleVoices : this.refreshFemaleVoices();
    const best = this.getBestFemaleVoice();

    return voices.map((v, index) => {
      let accentLabel = 'Mỹ (US)';
      const langLower = v.lang.toLowerCase();
      if (langLower.includes('gb') || langLower.includes('uk')) accentLabel = 'Anh (UK)';
      else if (langLower.includes('au')) accentLabel = 'Úc (AU)';
      else if (langLower.includes('ca')) accentLabel = 'Canada (CA)';
      else if (langLower.includes('ie')) accentLabel = 'Ireland (IE)';

      let qualityLabel = 'Chuẩn Bản Ngữ';
      const nameLower = v.name.toLowerCase();
      if (nameLower.includes('natural') || nameLower.includes('neural')) {
        qualityLabel = 'Vang Sáng Tự Nhiên (VIP)';
      } else if (nameLower.includes('google') || nameLower.includes('samantha')) {
        qualityLabel = 'Trong Trẻo & Ngân Vang';
      }

      return {
        voice: v,
        name: v.name.replace(/^(Microsoft |Google |Apple )/i, '').replace(/\s*-\s*English.*/i, ''),
        lang: v.lang,
        accentLabel,
        qualityLabel,
        isRecommended: index === 0 || v.voiceURI === best?.voiceURI,
      };
    });
  }

  // Set active female voice
  public selectFemaleVoice(voiceURI: string) {
    this.selectedVoiceURI = voiceURI;
    try {
      localStorage.setItem('mindmap_female_voice_uri', voiceURI);
    } catch {
      // Ignore
    }
  }

  // Set custom pitch & rate
  public setVoiceSettings(pitch: number, rate: number) {
    this.customPitch = Math.max(0.8, Math.min(1.4, pitch));
    this.customRate = Math.max(0.5, Math.min(1.2, rate));
    try {
      localStorage.setItem('mindmap_female_pitch', this.customPitch.toString());
      localStorage.setItem('mindmap_female_rate', this.customRate.toString());
    } catch {
      // Ignore
    }
  }

  // Reset to default best resonant female settings
  public resetToBestSettings() {
    this.selectedVoiceURI = null;
    this.customPitch = 1.12; // Bright & resonant
    this.customRate = 0.90; // Crisp & clear for grade 6
    try {
      localStorage.removeItem('mindmap_female_voice_uri');
      localStorage.setItem('mindmap_female_pitch', '1.12');
      localStorage.setItem('mindmap_female_rate', '0.90');
    } catch {
      // Ignore
    }
  }

  // Speak English word or phrase with resonant female voice
  speakWord(text: string, rate?: number) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pick exclusively female English voice
    const femaleVoice = this.getBestFemaleVoice();
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      utterance.lang = femaleVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    // Rate: use passed rate (e.g. slow 0.65) or customRate (default 0.90)
    utterance.rate = rate !== undefined ? rate : this.customRate;

    // Pitch: 1.12 creates a bright, ringing, resonant, melodic female tone ("vang sáng ngân hay")
    utterance.pitch = this.customPitch;
    utterance.volume = 1.0;

    // Keep reference alive for Chromium garbage collection bug
    this.currentUtterance = utterance;
    utterance.onend = () => {
      this.currentUtterance = null;
    };
    utterance.onerror = () => {
      this.currentUtterance = null;
    };

    window.speechSynthesis.speak(utterance);
  }

  // Quick test sample
  testVoiceSample() {
    this.speakWord("Hello! Welcome to English Grade 6. Let's learn vocabulary together!");
  }
}

export const sound = new SoundEngine();

