/**
 * PRINCESS BIRTHDAY MAGIC - INTERACTIVE ENGINE
 * Features:
 * - Birthday Gatekeeper (Date/Month/Year verification)
 * - Web Audio API Romantic Music Box (Zero external dependencies)
 * - Canvas Floating Petals & Tap Stardust
 * - Canvas Confetti Cannon with Hearts & Stars
 * - Tiered Birthday Cake with blowable candles & smoke
 * - Spotify song embed
 * - Wax-sealed Typewriter Love Letter
 * - Personalization / Settings Drawer
 */

// ==========================================================================
// 1. APPLICATION STATE & DEFAULT CONFIG
// ==========================================================================
const DEFAULT_CONFIG = {
  name: "My Birthday Queen",
  birthMonth: 11, // November (1-12)
  birthDay: 18,    // 18th
  birthYear: 2002, // 2002
  hint: "Think of your special day: Month (11), Day (18), Year (2002) 💖",
  greetingTitle: "Happy Birthday to the Girl Who Lights Up My Entire World",
  letterGreeting: "Dearest Birthday Princess,",
  letterBody: `From the very moment you came into this world, everything became a little brighter, softer, and so much more beautiful.

Today is not just any ordinary day—it is the anniversary of the day my favorite human was born. I created this little corner of the digital universe just for you, to remind you of how deeply cherished, celebrated, and loved you are.

Thank you for your infectious laughter, your gentle heart, and the warmth you bring into every room you step into. May this year bring you all the magic, joy, and dreams you so rightfully deserve.

Blow out your candles, make the biggest wish, and listen to the song I picked especially for you. Know that someone is endlessly proud of you today and always.`,
  letterSignature: "Forever yours, with all my love ❤️"
};

// ==========================================================================
// SPOTIFY SONG (auto-plays from the start when she blows out the candles)
// ==========================================================================
const SPOTIFY_TRACK_URI = 'spotify:track:1CJOj6Bs5OIasNTROmfWFJ';
window.spotifyController = null;
window.spotifyPlayPending = false;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  const el = document.getElementById('spotify-embed');
  if (!el) return;
  IFrameAPI.createController(el, { uri: SPOTIFY_TRACK_URI, width: '100%', height: 152 }, (controller) => {
    window.spotifyController = controller;
    // When the song reaches its end, release the ghost
    let songStarted = false;
    controller.addListener('playback_update', (e) => {
      const d = e.data || {};
      if (!d.duration) return;
      if (!d.isPaused && d.position > 1000) songStarted = true;
      if (songStarted && d.position >= d.duration - 800) {
        songStarted = false;
        if (window.app) window.app.showGhost();
      }
    });
    controller.addListener('ready', () => {
      if (window.spotifyPlayPending) {
        window.spotifyPlayPending = false;
        playSpotifySong();
      }
    });
  });
};

function playSpotifySong() {
  const c = window.spotifyController;
  if (c) {
    if (c.restart) c.restart(); // begin from the very first line
    else c.play();
  } else {
    window.spotifyPlayPending = true;
  }
}

class BirthdayApp {
  constructor() {
    this.loadConfig();
    this.currentTab = 'tab-greeting';
    this.completedSteps = new Set();
    this.musicPlaying = false;
    this.audioCtx = null;
    this.melodyTimeout = null;
    
    this.initDOMElements();
    this.initBackgroundParticles();
    this.initConfetti();
    this.populateDateSelectors();
    this.bindEvents();
    this.updateProgress();
  }

  loadConfig() {
    const saved = localStorage.getItem('birthday_magic_config');
    if (saved) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        this.config = { ...DEFAULT_CONFIG };
      }
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  saveConfig() {
    localStorage.setItem('birthday_magic_config', JSON.stringify(this.config));
    this.updateRenderedTexts();
  }

  // ==========================================================================
  // 2. DOM INITIALIZATION & POPULATION
  // ==========================================================================
  initDOMElements() {
    this.gateScreen = document.getElementById('gate-screen');
    this.mainApp = document.getElementById('main-app');
    this.gateMsg = document.getElementById('gate-msg');
    this.musicBtn = document.getElementById('music-toggle-btn');
    this.settingsModal = document.getElementById('settings-modal');
    
    this.selectMonth = document.getElementById('select-month');
    this.selectDay = document.getElementById('select-day');
    this.selectYear = document.getElementById('select-year');
    
    this.updateRenderedTexts();
  }

  updateRenderedTexts() {
    const heroName = document.getElementById('hero-name-display');
    if (heroName) heroName.textContent = this.config.name;

    const brandName = document.getElementById('brand-name-display');
    if (brandName) brandName.textContent = `${this.config.name}'s Day`;

    const letterGreet = document.getElementById('letter-greeting-display');
    if (letterGreet) letterGreet.textContent = this.config.letterGreeting;

    const letterSig = document.getElementById('letter-sig-display');
    if (letterSig) letterSig.textContent = this.config.letterSignature;
  }

  populateDateSelectors() {
    const months = [
      "January (01)", "February (02)", "March (03)", "April (04)",
      "May (05)", "June (06)", "July (07)", "August (08)",
      "September (09)", "October (10)", "November (11)", "December (12)"
    ];

    // Populate Months
    this.selectMonth.innerHTML = months.map((m, idx) => 
      `<option value="${idx + 1}" ${idx + 1 === this.config.birthMonth ? 'selected' : ''}>${m}</option>`
    ).join('');

    // Populate Days (1-31)
    let daysHtml = '';
    for (let d = 1; d <= 31; d++) {
      daysHtml += `<option value="${d}" ${d === this.config.birthDay ? 'selected' : ''}>${d < 10 ? '0' + d : d}</option>`;
    }
    this.selectDay.innerHTML = daysHtml;

    // Populate Years (1990 - 2026)
    let yearsHtml = '';
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1990; y--) {
      yearsHtml += `<option value="${y}" ${y === this.config.birthYear ? 'selected' : ''}>${y}</option>`;
    }
    this.selectYear.innerHTML = yearsHtml;
  }

  // ==========================================================================
  // 3. BIRTHDAY GATE / LOGIN VERIFICATION
  // ==========================================================================
  verifyBirthday() {
    const selectedMonth = parseInt(this.selectMonth.value, 10);
    const selectedDay = parseInt(this.selectDay.value, 10);
    const selectedYear = parseInt(this.selectYear.value, 10);

    const isMatch = (
      selectedMonth === parseInt(this.config.birthMonth, 10) &&
      selectedDay === parseInt(this.config.birthDay, 10) &&
      selectedYear === parseInt(this.config.birthYear, 10)
    );

    if (isMatch) {
      this.gateMsg.className = 'gate-msg success';
      this.gateMsg.textContent = '✨ Secret unlocked! Welcome, Birthday Princess... ✨';
      
      this.playChimeSound(600, 900);
      this.triggerConfetti();
      this.markStepDone('step-unlock');

      setTimeout(() => {
        this.gateScreen.classList.add('hidden');
        this.mainApp.classList.add('active');
      }, 900);
    } else {
      this.gateMsg.className = 'gate-msg error';
      this.gateMsg.textContent = 'Oops! Only the Birthday Queen knows the secret date 🥺';
      this.playBuzzSound();
      
      const card = document.querySelector('.gate-card');
      if (card) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = 'shake 0.4s ease-in-out';
      }
    }
  }

  showHint() {
    alert(`💡 Birthday Clue:\n${this.config.hint || `Her date is set to: Month ${this.config.birthMonth}, Day ${this.config.birthDay}, Year ${this.config.birthYear} 💕`}\n\nYou can also click the ⚙️ gear icon at the top to customize!`);
  }

  // ==========================================================================
  // 4. NAVIGATION & CELEBRATION PROGRESS
  // ==========================================================================
  switchTab(tabId) {
    document.querySelectorAll('.section-tab').forEach(el => el.classList.remove('active-tab'));
    const target = document.getElementById(tabId);
    if (target) {
      target.classList.add('active-tab');
      this.currentTab = tabId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
  }

  markStepDone(stepId) {
    this.completedSteps.add(stepId);
    this.updateProgress();
  }

  updateProgress() {
    const totalSteps = 4;
    const progressFill = document.getElementById('progress-bar-fill');
    const progressPct = document.getElementById('progress-pct');
    const pct = Math.min(100, Math.round((this.completedSteps.size / totalSteps) * 100));

    if (progressFill) progressFill.style.width = `${Math.max(25, pct)}%`;
    if (progressPct) progressPct.textContent = `${pct}% Complete`;
  }

  // ==========================================================================
  // 5. LOVE LETTER WITH WAX SEAL
  // ==========================================================================
  openWaxSeal() {
    const sealWrap = document.getElementById('wax-seal-wrapper');
    const letter = document.getElementById('letter-paper');
    const letterBody = document.getElementById('letter-body-display');

    this.playChimeSound(500, 1100);
    this.triggerConfetti();
    this.markStepDone('step-letter');

    sealWrap.style.display = 'none';
    letter.classList.add('open');

    // Typewriter effect
    letterBody.textContent = '';
    const fullText = this.config.letterBody;
    let i = 0;
    const speed = 18;

    const typeWriter = () => {
      if (i < fullText.length) {
        letterBody.textContent += fullText.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      }
    };
    typeWriter();
  }

  replayLetter() {
    const letterBody = document.getElementById('letter-body-display');
    letterBody.textContent = '';
    const fullText = this.config.letterBody;
    let i = 0;
    const typeWriter = () => {
      if (i < fullText.length) {
        letterBody.textContent += fullText.charAt(i);
        i++;
        setTimeout(typeWriter, 14);
      }
    };
    typeWriter();
  }

  // ==========================================================================
  // 6. INTERACTIVE BIRTHDAY CAKE & CANDLE BLOWING
  // ==========================================================================
  blowCandles() {
    const candles = document.querySelectorAll('.candle');
    candles.forEach(c => c.classList.add('blown'));

    this.playBlowSound();
    this.triggerConfetti();
    this.markStepDone('step-cake');

    // Song starts from the beginning and its cover appears at the bottom
    const dock = document.getElementById('song-dock');
    if (dock && !dock.classList.contains('visible')) {
      dock.classList.add('visible');
      playSpotifySong(); // runs inside the button click so sound is allowed
    }

    const card = document.getElementById('wish-revealed-card');
    if (card) {
      setTimeout(() => {
        card.classList.add('visible');
        this.playChimeSound(700, 1200);
      }, 500);
    }
  }

  relightCandles() {
    const candles = document.querySelectorAll('.candle');
    candles.forEach(c => c.classList.remove('blown'));
    const card = document.getElementById('wish-revealed-card');
    if (card) card.classList.remove('visible');
  }

  // ==========================================================================
  // GHOST JUMP-SCARE
  // ==========================================================================
  showGhost() {
    if (this.ghostShown) return;
    this.ghostShown = true;
    const overlay = document.getElementById('ghost-overlay');
    if (!overlay) return;
    overlay.classList.add('show');
    this.playScareSound();
    if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400]);
  }

  playScareSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc2.type = 'square';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.5);
      osc2.frequency.setValueAtTime(97, now);
      osc2.frequency.exponentialRampToValueAtTime(380, now + 0.5);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc2.start(now);
      osc.stop(now + 1.3); osc2.stop(now + 1.3);
    } catch (e) {}
  }

  // ==========================================================================
  // 8. WEB AUDIO API ROMANTIC MUSIC BOX & SOUND FX
  // ==========================================================================
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMusic() {
    if (this.musicPlaying) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  startMusic() {
    try {
      this.getAudioContext();
      this.musicPlaying = true;
      this.musicBtn.classList.add('playing');
      this.playBirthdayLofiLoop();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicBtn.classList.remove('playing');
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }
  }

  playTone(freq, time, duration = 0.5, type = 'sine') {
    if (!this.musicPlaying) return;
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  playBirthdayLofiLoop() {
    if (!this.musicPlaying) return;
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { f: 392.00, d: 0.35, t: 0.0 },
      { f: 392.00, d: 0.35, t: 0.4 },
      { f: 440.00, d: 0.6,  t: 0.8 },
      { f: 392.00, d: 0.6,  t: 1.5 },
      { f: 523.25, d: 0.6,  t: 2.2 },
      { f: 493.88, d: 1.1,  t: 2.9 },

      { f: 392.00, d: 0.35, t: 4.2 },
      { f: 392.00, d: 0.35, t: 4.6 },
      { f: 440.00, d: 0.6,  t: 5.0 },
      { f: 392.00, d: 0.6,  t: 5.7 },
      { f: 587.33, d: 0.6,  t: 6.4 },
      { f: 523.25, d: 1.1,  t: 7.1 },

      { f: 392.00, d: 0.35, t: 8.4 },
      { f: 392.00, d: 0.35, t: 8.8 },
      { f: 783.99, d: 0.7,  t: 9.2 },
      { f: 659.25, d: 0.7,  t: 10.0 },
      { f: 523.25, d: 0.7,  t: 10.8 },
      { f: 493.88, d: 0.7,  t: 11.5 },
      { f: 440.00, d: 1.1,  t: 12.2 },

      { f: 698.46, d: 0.35, t: 13.5 },
      { f: 698.46, d: 0.35, t: 13.9 },
      { f: 659.25, d: 0.7,  t: 14.3 },
      { f: 523.25, d: 0.7,  t: 15.0 },
      { f: 587.33, d: 0.7,  t: 15.7 },
      { f: 523.25, d: 1.4,  t: 16.4 }
    ];

    notes.forEach(n => {
      this.playTone(n.f, now + n.t, n.d + 0.3, 'triangle');
      this.playTone(n.f / 2, now + n.t, n.d + 0.1, 'sine');
    });

    this.melodyTimeout = setTimeout(() => {
      if (this.musicPlaying) {
        this.playBirthdayLofiLoop();
      }
    }, 19000);
  }

  playChimeSound(startFreq = 500, endFreq = 1000) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch(e) {}
  }

  playBlowSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(200, now + 0.4);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch(e) {}
  }

  playPluckSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch(e) {}
  }

  playBuzzSound() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch(e) {}
  }

  // ==========================================================================
  // 9. FLOATING PETALS & INTERACTIVE STARDUST CANVAS
  // ==========================================================================
  initBackgroundParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    const colors = ['#ffccd5', '#ffb3c1', '#ffe5ec', '#fbcfe8', '#fef08a'];

    for (let i = 0; i < 26; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 6,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 0.8 + 0.5,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.4 ? 'petal' : 'heart'
      });
    }

    const stardust = [];

    const spawnSparkles = (x, y) => {
      for (let i = 0; i < 8; i++) {
        stardust.push({
          x, y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          size: Math.random() * 4 + 2,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    window.addEventListener('pointerdown', (e) => spawnSparkles(e.clientX, e.clientY));

    const drawPetal = (x, y, size, angle, color) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawHeart = (x, y, size, color) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurveHeight);
      ctx.bezierCurveTo(-size / 2, (size + topCurveHeight) / 2, 0, (size + topCurveHeight) / 1.4, 0, size);
      ctx.bezierCurveTo(0, (size + topCurveHeight) / 1.4, size / 2, (size + topCurveHeight) / 2, size / 2, topCurveHeight);
      ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.fill();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        if (p.type === 'petal') {
          drawPetal(p.x, p.y, p.size, p.rotation, p.color);
        } else {
          drawHeart(p.x, p.y, p.size, p.color);
        }
      });

      for (let i = stardust.length - 1; i >= 0; i--) {
        const s = stardust[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.025;
        if (s.alpha <= 0) {
          stardust.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }

  // ==========================================================================
  // 10. CONFETTI CANNON WITH HEARTS & STARS
  // ==========================================================================
  initConfetti() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.confettiCanvas) return;
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    this.confettiPieces = [];
    this.isConfettiActive = false;
  }

  triggerConfetti() {
    if (!this.confettiCanvas) return;
    const colors = ['#ff4d6d', '#ff758f', '#ffb3c1', '#d4af37', '#ffd166', '#a78bfa', '#38bdf8'];
    const count = 90;

    for (let i = 0; i < count; i++) {
      this.confettiPieces.push({
        x: this.confettiCanvas.width / 2 + (Math.random() - 0.5) * 80,
        y: this.confettiCanvas.height * 0.45,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 12 - 5,
        gravity: 0.35,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.5 ? 'heart' : 'rect',
        alpha: 1
      });
    }

    if (!this.isConfettiActive) {
      this.isConfettiActive = true;
      this.animateConfetti();
    }
  }

  animateConfetti() {
    if (!this.confettiCtx) return;
    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = this.confettiPieces.length - 1; i >= 0; i--) {
      const p = this.confettiPieces[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.007;

      if (p.alpha <= 0 || p.y > this.confettiCanvas.height) {
        this.confettiPieces.splice(i, 1);
        continue;
      }

      this.confettiCtx.save();
      this.confettiCtx.translate(p.x, p.y);
      this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
      this.confettiCtx.fillStyle = p.color;
      this.confettiCtx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'heart') {
        const s = p.size;
        this.confettiCtx.beginPath();
        this.confettiCtx.moveTo(0, s * 0.3);
        this.confettiCtx.bezierCurveTo(0, 0, -s / 2, 0, -s / 2, s * 0.3);
        this.confettiCtx.bezierCurveTo(-s / 2, s * 0.8, 0, s, 0, s * 1.2);
        this.confettiCtx.bezierCurveTo(0, s, s / 2, s * 0.8, s / 2, s * 0.3);
        this.confettiCtx.bezierCurveTo(s / 2, 0, 0, 0, 0, s * 0.3);
        this.confettiCtx.fill();
      } else {
        this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }
      this.confettiCtx.restore();
    }

    if (this.confettiPieces.length > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.isConfettiActive = false;
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
  }

  // ==========================================================================
  // 11. EVENT BINDING & SETTINGS MODAL
  // ==========================================================================
  bindEvents() {
    document.getElementById('unlock-gate-btn').addEventListener('click', () => this.verifyBirthday());
    document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
    
    document.getElementById('preview-bypass-btn').addEventListener('click', () => {
      this.selectMonth.value = this.config.birthMonth;
      this.selectDay.value = this.config.birthDay;
      this.selectYear.value = this.config.birthYear;
      this.verifyBirthday();
    });

    this.musicBtn.addEventListener('click', () => this.toggleMusic());

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.dataset.tab);
      });
    });

    const waxSeal = document.getElementById('wax-seal-wrapper');
    if (waxSeal) waxSeal.addEventListener('click', () => this.openWaxSeal());

    const replayBtn = document.getElementById('letter-replay-btn');
    if (replayBtn) replayBtn.addEventListener('click', () => this.replayLetter());

    const blowBtn = document.getElementById('blow-candles-btn');
    if (blowBtn) blowBtn.addEventListener('click', () => this.blowCandles());

    const relightBtn = document.getElementById('relight-btn');
    if (relightBtn) relightBtn.addEventListener('click', () => this.relightCandles());

    const ghostClose = document.getElementById('ghost-close-btn');
    if (ghostClose) ghostClose.addEventListener('click', () => document.getElementById('ghost-overlay').classList.remove('show'));

    document.getElementById('settings-btn').addEventListener('click', () => this.openSettings());
    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeSettings());
    document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettingsFromForm());
  }

  openSettings() {
    document.getElementById('set-name-input').value = this.config.name;
    document.getElementById('set-month-input').value = this.config.birthMonth;
    document.getElementById('set-day-input').value = this.config.birthDay;
    document.getElementById('set-year-input').value = this.config.birthYear;
    document.getElementById('set-letter-input').value = this.config.letterBody;
    this.settingsModal.classList.add('active');
  }

  closeSettings() {
    this.settingsModal.classList.remove('active');
  }

  saveSettingsFromForm() {
    this.config.name = document.getElementById('set-name-input').value.trim() || DEFAULT_CONFIG.name;
    this.config.birthMonth = parseInt(document.getElementById('set-month-input').value, 10) || 11;
    this.config.birthDay = parseInt(document.getElementById('set-day-input').value, 10) || 18;
    this.config.birthYear = parseInt(document.getElementById('set-year-input').value, 10) || 2002;
    this.config.letterBody = document.getElementById('set-letter-input').value.trim() || DEFAULT_CONFIG.letterBody;
    this.config.hint = `Remember your birthday: Month (${this.config.birthMonth}), Day (${this.config.birthDay}), Year (${this.config.birthYear}) 💖`;

    this.saveConfig();
    this.populateDateSelectors();
    this.closeSettings();
    this.playChimeSound(600, 1000);
    alert("🎉 Personal settings saved successfully! Her name, birthday passcode, and love letter are updated.");
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new BirthdayApp();
});
