export class AudioEngine {
  constructor(isMuted = () => false) {
    this.ctx = null;
    this.master = null;
    this.isMuted = isMuted;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = .11;
    this.master.connect(this.ctx.destination);
  }

  tone(freq = 440, dur = .12, type = 'sine', vol = .35, bend = 0) {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (bend) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + bend), t + dur);
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + .02);
  }

  collect(n = 0) { this.tone(560 + n * 45, .16, 'triangle', .5, 180); }
  jump() { this.tone(220, .13, 'sine', .35, 100); }
  burst() { this.tone(160, .28, 'sawtooth', .22, 900); }
  land() { this.tone(95, .07, 'sine', .18, -25); }
  hurt() { this.tone(120, .25, 'square', .15, -70); }
  complete() {
    [0, 4, 7, 12].forEach((s, i) => setTimeout(() => this.tone(330 * Math.pow(2, s / 12), .34, 'triangle', .28, 40), i * 95));
  }
}
