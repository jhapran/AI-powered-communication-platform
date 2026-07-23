/* ------------------------------------------------------------------ */
/*  Generative ambient soundtrack — pure WebAudio, no audio assets,    */
/*  no network. Designed to be soothing:                               */
/*    · a warm sine pad whose four voices slowly "breathe" (each has   */
/*      its own ultra-slow gain LFO, so the texture drifts organically */
/*      instead of pulsing)                                            */
/*    · sparse melody notes at RANDOM times — never metronomic —       */
/*      picked from a C-major pentatonic scale that is consonant       */
/*      over every chord the storyboard uses                           */
/*    · a generated hall reverb softening everything                   */
/*  Scene emotions glide the pad to a new chord (same C-major family)  */
/*  and change how often melody notes appear — calm = very sparse,     */
/*  excitement = a little more present. No dissonance, no motor beat.  */
/* ------------------------------------------------------------------ */

interface Mood {
  chord: number[]; // pad voicing (Hz), spread across octaves
  noteGapMs: number; // average gap between melody notes — lower = more present
}

const MOODS: Record<string, Mood> = {
  Joy: { chord: [130.81, 261.63, 329.63, 392.0], noteGapMs: 4500 }, // Cmaj7
  Calm: { chord: [87.31, 174.61, 220.0, 329.63], noteGapMs: 8000 }, // Fmaj7
  Trust: { chord: [98.0, 196.0, 246.94, 293.66], noteGapMs: 6000 }, // G6
  Hope: { chord: [110.0, 220.0, 261.63, 329.63], noteGapMs: 5500 }, // Am7
  Curiosity: { chord: [130.81, 261.63, 293.66, 392.0], noteGapMs: 6000 }, // Cadd9
  Excitement: { chord: [98.0, 196.0, 246.94, 392.0], noteGapMs: 3500 }, // G major
};
const DEFAULT_MOOD = MOODS.Curiosity;

// C-major pentatonic — safe over every chord above, always gentle
const MELODY_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

interface PadVoice {
  osc: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let padFilter: BiquadFilterNode | null = null;
let padVoices: PadVoice[] = [];
let melodyTimer: ReturnType<typeof setTimeout> | undefined;
let playing = false;
let ducked = false;
let currentEmotion = "Curiosity";

// Background ambience levels — quiet enough to sit under a voice-over;
// ducked further while narration is actually speaking.
const MUSIC_LEVEL = 0.4;
const DUCK_LEVEL = 0.1;

function applyLevel(c: AudioContext, fade = 0.9): void {
  master!.gain.setTargetAtTime(ducked ? DUCK_LEVEL : MUSIC_LEVEL, c.currentTime, fade);
}

/** Lower the music while narration plays (true) and restore it after (false). */
export function duckMusic(on: boolean): void {
  ducked = on;
  if (ctx && playing) applyLevel(ctx, on ? 0.25 : 1.2);
}

function makeImpulseResponse(c: AudioContext, seconds = 2.8, decay = 2.6): AudioBuffer {
  const rate = c.sampleRate;
  const len = Math.floor(rate * seconds);
  const buffer = c.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buffer;
}

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    // shared bus → dry + hall reverb → master
    bus = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 0.6;
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulseResponse(ctx);
    bus.connect(dry);
    dry.connect(master);
    bus.connect(reverb);
    reverb.connect(wet);
    wet.connect(master);

    padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 1100; // dark and warm
    padFilter.connect(bus);
  }
  return ctx;
}

function moodFor(emotion: string): Mood {
  return MOODS[emotion] ?? DEFAULT_MOOD;
}

function buildPad(freqs: number[]): void {
  const c = ensureCtx();
  padVoices = freqs.map((f, i) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;

    // each voice swells independently at an inaudibly slow rate —
    // organic drift instead of a rhythmic pulse
    const gain = c.createGain();
    gain.gain.value = 0.045;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.04 + i * 0.013; // 40–90 mHz, phase-offset per voice
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    gain.connect(padFilter!);
    osc.start();
    lfo.start();
    return { osc, gain, lfo, lfoGain };
  });
}

function glideTo(freqs: number[]): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  padVoices.forEach((v, i) => {
    if (freqs[i] !== undefined) {
      v.osc.frequency.cancelScheduledValues(t);
      v.osc.frequency.setTargetAtTime(freqs[i], t, 1.2); // slow, seamless chord change
    }
  });
}

function playMelodyNote(): void {
  if (!ctx || !bus || !playing) return;
  const t = ctx.currentTime;
  const freq = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  // long, soft envelope — notes bloom and dissolve
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
  osc.connect(gain);
  gain.connect(bus);
  osc.start(t);
  osc.stop(t + 2.8);
}

function scheduleMelody(): void {
  clearTimeout(melodyTimer);
  const { noteGapMs } = moodFor(currentEmotion);
  melodyTimer = setTimeout(
    () => {
      playMelodyNote();
      scheduleMelody();
    },
    // randomised timing — deliberately never a steady beat
    noteGapMs * (0.55 + Math.random() * 1.3)
  );
}

/** Start the soundtrack (idempotent) or glide to a new mood if already playing. */
export function startMusic(emotion: string): void {
  const c = ensureCtx();
  void c.resume();
  currentEmotion = emotion;
  if (playing) {
    glideTo(moodFor(emotion).chord);
    scheduleMelody(); // re-time note density to the new mood
    return;
  }
  playing = true;
  buildPad(moodFor(emotion).chord);
  applyLevel(c, 1.8); // gentle fade in
  scheduleMelody();
}

/** Update the mood without restarting (no-op if not playing). */
export function setMusicEmotion(emotion: string): void {
  currentEmotion = emotion;
  if (playing) {
    glideTo(moodFor(emotion).chord);
    scheduleMelody();
  }
}

export function stopMusic(): void {
  if (!ctx || !playing) return;
  playing = false;
  clearTimeout(melodyTimer);
  const t = ctx.currentTime;
  master!.gain.setTargetAtTime(0, t, 0.6); // fade out
  const voices = padVoices;
  padVoices = [];
  setTimeout(() => {
    voices.forEach((v) => {
      try {
        v.osc.stop();
        v.lfo.stop();
        v.osc.disconnect();
        v.lfo.disconnect();
        v.gain.disconnect();
        v.lfoGain.disconnect();
      } catch {
        /* already stopped */
      }
    });
  }, 2200);
}
