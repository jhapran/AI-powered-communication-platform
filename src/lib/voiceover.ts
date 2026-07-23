import { getGroqApiKey, hasGroqKey } from "./llmClient";
import { duckMusic } from "./soundtrack";

/* ------------------------------------------------------------------ */
/*  Voice-over narration                                               */
/*  · With a Groq key: natural AI voice via Groq TTS (Orpheus).        */
/*  · Without one: the browser's built-in speechSynthesis voice.       */
/*  Audio is generated per scene narration and cached for replay.      */
/*  speakScene() resolves when the narration has FINISHED playing,     */
/*  so the animatic can hold a frame until the voice-over is done.     */
/* ------------------------------------------------------------------ */

const GROQ_TTS_URL = "https://api.groq.com/openai/v1/audio/speech";
const TTS_MODEL = "canopylabs/orpheus-v1-english";
const TTS_VOICE = "autumn";
// Slightly below 1.0 — keeps the narration calm and intelligible; both
// the Groq voice and the browser fallback sound rushed at full speed.
const NARRATION_RATE = 0.92;

const audioCache = new Map<string, string>(); // narration text -> object URL
let currentAudio: HTMLAudioElement | null = null;
let currentResolve: (() => void) | null = null;
let callId = 0;

// Hard cap on how long a narration may hold the animatic. If the audio
// engine stalls (no `onended` / `onend` — e.g. speechSynthesis quirks on
// some Linux desktops), the promise still resolves so playback moves on.
function narrationTimeoutMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.min(30000, (words / 2.4) * (1000 / NARRATION_RATE) + 2500);
}

async function groqSpeechUrl(text: string): Promise<string> {
  const cached = audioCache.get(text);
  if (cached) return cached;
  const res = await fetch(GROQ_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify({ model: TTS_MODEL, input: text, voice: TTS_VOICE, response_format: "wav" }),
  });
  if (!res.ok) throw new Error(`Groq TTS ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const url = URL.createObjectURL(await res.blob());
  audioCache.set(text, url);
  return url;
}

export function stopVoiceover(): void {
  callId++;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  // release anyone awaiting the interrupted narration
  currentResolve?.();
  currentResolve = null;
}

/** Speak the text; resolves when playback ends (or immediately if unspeakable). */
export async function speakScene(text: string): Promise<void> {
  stopVoiceover();
  if (!text.trim()) return;
  const id = callId;
  duckMusic(true); // drop the soundtrack under the narration

  try {
    if (hasGroqKey()) {
      try {
        const url = await groqSpeechUrl(text);
        if (id !== callId) return; // superseded while generating
        await new Promise<void>((resolve) => {
          currentResolve = resolve;
          let timer: ReturnType<typeof setTimeout>;
          const finish = () => {
            clearTimeout(timer);
            resolve();
          };
          timer = setTimeout(finish, narrationTimeoutMs(text));
          const audio = new Audio(url);
          currentAudio = audio;
          audio.playbackRate = NARRATION_RATE;
          audio.onended = finish;
          audio.onerror = finish;
          audio.play().catch(finish);
        });
        if (currentAudio) currentAudio = null;
        currentResolve = null;
        return;
      } catch (err) {
        console.warn("Groq TTS failed, falling back to browser voice:", err);
      }
    }

    if (id !== callId || !("speechSynthesis" in window)) return;
    await new Promise<void>((resolve) => {
      currentResolve = resolve;
      let timer: ReturnType<typeof setTimeout>;
      const finish = () => {
        clearTimeout(timer);
        resolve();
      };
      timer = setTimeout(finish, narrationTimeoutMs(text));
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = NARRATION_RATE;
      utterance.pitch = 1;
      utterance.onend = finish;
      utterance.onerror = finish;
      // Chrome can silently drop an utterance spoken immediately after
      // speechSynthesis.cancel() — give the engine a beat first.
      setTimeout(() => {
        if (id !== callId) return; // superseded before the utterance started
        window.speechSynthesis.speak(utterance);
      }, 60);
    });
    currentResolve = null;
  } finally {
    duckMusic(false); // restore the soundtrack level
  }
}
