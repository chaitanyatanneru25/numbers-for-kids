/**
 * Maths for Kid - Sound Engine using Web Audio API
 * 100% offline, zero-latency synthesizer sounds for kids.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Play pleasant high chime for correct answer
    playCorrect() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.07);

            gain.gain.setValueAtTime(0.001, now + index * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.2, now + index * 0.07 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + index * 0.07);
            osc.stop(now + index * 0.07 + 0.28);
        });
    }

    // Play encouraging, gentle bounce for wrong answer (never harsh)
    playWrong() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(170, now + 0.22);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    // Play cheerful streak fanfare
    playStreak() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6

        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + index * 0.06);

            gain.gain.setValueAtTime(0.001, now + index * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.22, now + index * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + index * 0.06);
            osc.stop(now + index * 0.06 + 0.25);
        });
    }

    // Play celebratory victory fanfare when paper is completed
    playVictory() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [
            { f: 523.25, t: 0.0, d: 0.15 },
            { f: 659.25, t: 0.15, d: 0.15 },
            { f: 783.99, t: 0.30, d: 0.20 },
            { f: 1046.50, t: 0.50, d: 0.60 }
        ];

        chord.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0.001, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.25, now + n.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + n.t);
            osc.stop(now + n.t + n.d);
        });
    }

    // Gentle button tap
    playTap() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }
}

window.soundEngine = new SoundEngine();
