export class CoastalAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = false;
    this.volume = 0.45;
  }

  async setEnabled(enabled) {
    if (enabled && !this.context) this.init();
    if (!this.context) return;
    if (enabled && this.context.state === 'suspended') await this.context.resume();
    this.enabled = enabled;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(enabled ? this.volume : 0, now, 0.35);
  }

  init() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('当前浏览器不支持环境音效');
    this.context = new AudioContext();
    const ctx = this.context;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    const length = ctx.sampleRate * 8;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      let previous = 0;
      for (let i = 0; i < length; i += 1) {
        previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025;
        data[i] = previous * 4;
      }
    }
    const sea = ctx.createBufferSource();
    sea.buffer = buffer;
    sea.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const waves = ctx.createGain();
    waves.gain.value = 0.35;
    const tide = ctx.createOscillator();
    tide.frequency.value = 0.11;
    const tideDepth = ctx.createGain();
    tideDepth.gain.value = 0.16;
    tide.connect(tideDepth).connect(waves.gain);
    sea.connect(filter).connect(waves).connect(this.master);
    sea.start();
    tide.start();

    const breeze = ctx.createBufferSource();
    breeze.buffer = buffer;
    breeze.loop = true;
    breeze.playbackRate.value = 1.7;
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.value = 1200;
    breezeFilter.Q.value = 0.35;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.12;
    breeze.connect(breezeFilter).connect(breezeGain).connect(this.master);
    breeze.start();
  }

  setVolume(value) {
    this.volume = Number(value);
    if (this.context && this.enabled) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.2);
  }

  bell() {
    if (!this.context || !this.enabled) return;
    const ctx = this.context;
    const now = ctx.currentTime;
    [1568, 2093, 3136].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.995, now + 1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16 / (index + 1), now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 1.3);
    });
  }

  chirp() {
    if (!this.context || !this.enabled) return;
    const ctx = this.context;
    const now = ctx.currentTime;
    [0, 0.16].forEach((delay, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(650 + index * 120, now + delay);
      oscillator.frequency.exponentialRampToValueAtTime(1150 + index * 200, now + delay + 0.07);
      oscillator.frequency.exponentialRampToValueAtTime(780, now + delay + 0.15);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.075, now + delay + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.17);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 0.2);
    });
  }

  destroy() {
    this.context?.close();
    this.context = null;
  }
}
