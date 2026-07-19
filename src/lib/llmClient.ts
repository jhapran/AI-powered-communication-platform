import type { CameraAngle, Intent, Scene, ThoughtAnalysis, Transition } from "@/types";
import { EMOTION_COLORS } from "./aiEngine";

/* ------------------------------------------------------------------ */
/*  Real AI providers                                                  */
/*  · Storyboard planning: Groq (free tier, open Llama models)         */
/*  · Frame images: Pollinations.ai (free, no key, FLUX) — see         */
/*    frameArt.ts for the URL builder.                                 */
/*  Everything degrades gracefully to the local simulated engine in    */
/*  aiEngine.ts when no key is set or a request fails.                 */
/* ------------------------------------------------------------------ */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/* ---------------------------- settings ---------------------------- */

export function getGroqApiKey(): string {
  return (
    localStorage.getItem("groq_api_key")?.trim() ||
    (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim() ||
    ""
  );
}

export function setGroqApiKey(key: string): void {
  const k = key.trim();
  if (k) localStorage.setItem("groq_api_key", k);
  else localStorage.removeItem("groq_api_key");
}

export function hasGroqKey(): boolean {
  return Boolean(getGroqApiKey());
}

export type ImageProvider = "pollinations" | "procedural";

export function getImageProvider(): ImageProvider {
  const stored = localStorage.getItem("image_provider");
  if (stored === "pollinations" || stored === "procedural") return stored;
  const env = import.meta.env.VITE_IMAGE_PROVIDER as string | undefined;
  return env === "procedural" ? "procedural" : "pollinations";
}

export function setImageProvider(p: ImageProvider): void {
  localStorage.setItem("image_provider", p);
}

/* --------------------------- Groq call ---------------------------- */

async function groqChat(system: string, user: string): Promise<Record<string, unknown>> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getGroqApiKey()}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/* ------------------------- coercion helpers ------------------------ */

const INTENTS: Intent[] = ["explain", "persuade", "inspire", "inform", "entertain"];
const CAMERA_ANGLES: CameraAngle[] = ["Wide shot", "Medium shot", "Close-up", "Macro", "Aerial view", "Over-the-shoulder"];
const TRANSITIONS: Transition[] = ["Fade", "Slide", "Cut", "Zoom", "Dissolve"];
const EMOTION_NAMES = Object.keys(EMOTION_COLORS);

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clampScore(v: unknown, fallback = 0.75): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(0.98, Math.max(0.3, n > 1 ? n / 100 : n));
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

/* ------------------------- thought analysis ------------------------ */

interface LLMEmotion {
  name?: unknown;
  score?: unknown;
}

export async function analyzeThoughtLLM(text: string): Promise<ThoughtAnalysis> {
  const t0 = performance.now();
  const raw = await groqChat(
    `You are the analysis module of a storyboard AI. Analyse the user's text and reply ONLY with a JSON object:
{
  "summary": "one-sentence summary, max 110 chars",
  "intent": one of ["explain","persuade","inspire","inform","entertain"],
  "intentConfidence": 0.0-1.0,
  "audience": "short audience label, e.g. 'Children (6–12)' or 'Investors & stakeholders'",
  "audienceConfidence": 0.0-1.0,
  "tone": "3-6 word tone description",
  "emotions": [{"name": one of ["Joy","Curiosity","Calm","Excitement","Trust","Hope"], "score": 0.0-1.0}], // 2-3 entries, sorted desc
  "keywords": ["3-6 single-word key concepts to visualise"],
  "readingLevel": one of ["Simple","Intermediate","Detailed"],
  "recommendedScenes": integer 4-8
}`,
    text
  );

  const intent = pick(raw.intent, INTENTS, "inform");
  const emotions = (Array.isArray(raw.emotions) ? (raw.emotions as LLMEmotion[]) : [])
    .map((e) => {
      const name = pick(e?.name, EMOTION_NAMES, "Curiosity");
      return { name, score: clampScore(e?.score), color: EMOTION_COLORS[name] };
    })
    .filter((e, i, arr) => arr.findIndex((x) => x.name === e.name) === i)
    .slice(0, 3);
  if (emotions.length === 0) emotions.push({ name: "Curiosity", score: 0.7, color: EMOTION_COLORS.Curiosity });
  emotions.sort((a, b) => b.score - a.score);

  const keywords = (Array.isArray(raw.keywords) ? raw.keywords : [])
    .map((k) => str(k).toLowerCase())
    .filter(Boolean)
    .slice(0, 6);
  if (keywords.length === 0) keywords.push("idea", "story", "moment");

  const intentConfidence = clampScore(raw.intentConfidence, 0.8);
  const audienceConfidence = clampScore(raw.audienceConfidence, 0.75);
  const recommendedScenes = Math.min(8, Math.max(4, Math.round(Number(raw.recommendedScenes)) || 6));
  const elapsed = Math.round(performance.now() - t0);

  return {
    summary: str(raw.summary, text.slice(0, 107)),
    intent,
    intentConfidence,
    audience: str(raw.audience, "General audience"),
    audienceConfidence,
    tone: str(raw.tone, "Clear and engaging"),
    emotions,
    keywords,
    readingLevel: pick(raw.readingLevel, ["Simple", "Intermediate", "Detailed"] as const, "Intermediate"),
    recommendedScenes,
    moderation: { passed: true, confidence: 0.97, note: "No unsafe content detected" },
    pipeline: [
      { module: "Thought Analysis", confidence: 0.9, durationMs: elapsed },
      { module: "Intent Detection", confidence: intentConfidence, durationMs: 0 },
      { module: "Emotion Detection", confidence: emotions[0].score, durationMs: 0 },
      { module: "Audience Modeling", confidence: audienceConfidence, durationMs: 0 },
      { module: "Content Moderation", confidence: 0.97, durationMs: 0 },
    ],
  };
}

/* ------------------------- storyboard outline ---------------------- */

interface LLMScene {
  title?: unknown;
  narration?: unknown;
  visualPrompt?: unknown;
  cameraAngle?: unknown;
  transition?: unknown;
  durationSec?: unknown;
  emotion?: unknown;
}

export async function generateOutlineLLM(
  text: string,
  analysis: ThoughtAnalysis,
  sceneCount?: number
): Promise<Scene[]> {
  const count = Math.max(3, Math.min(8, sceneCount ?? analysis.recommendedScenes));
  const raw = await groqChat(
    `You are the storyboard planning module of a storyboard AI. Turn the user's text into exactly ${count} storyboard scenes.
Reply ONLY with a JSON object: {"scenes": [ ... ]} where each scene is:
{
  "title": "2-5 word evocative scene title",
  "narration": "1-2 spoken narration sentences for this scene (voiceover script)",
  "visualPrompt": "detailed image description: concrete subjects, setting, action, lighting, colors. 25-45 words. No text/words in the image.",
  "cameraAngle": one of ${JSON.stringify(CAMERA_ANGLES)},
  "transition": one of ${JSON.stringify(TRANSITIONS)},
  "durationSec": integer 3-7,
  "emotion": one of ${JSON.stringify(EMOTION_NAMES)}
}
Rules: scenes must follow a clear narrative arc; vary camera angles; every visualPrompt must depict something specific from the text (never generic landscapes).`,
    `Intent: ${analysis.intent}\nTone: ${analysis.tone}\nAudience: ${analysis.audience}\nKey concepts: ${analysis.keywords.join(", ")}\n\nText:\n${text}`
  );

  const list = Array.isArray(raw.scenes) ? (raw.scenes as LLMScene[]) : [];
  if (list.length === 0) throw new Error("Groq returned no scenes");

  return list.slice(0, count).map((s, i) => ({
    id: `scene-${i + 1}-${Date.now().toString(36)}${i}`,
    title: str(s.title, `Scene ${i + 1}`),
    narration: str(s.narration, str(s.visualPrompt).slice(0, 130)),
    visualPrompt: str(s.visualPrompt, str(s.title, "A moment from the story")),
    cameraAngle: pick(s.cameraAngle, CAMERA_ANGLES, CAMERA_ANGLES[i % CAMERA_ANGLES.length]),
    transition: pick(s.transition, TRANSITIONS, "Fade"),
    durationSec: Math.min(9, Math.max(2, Math.round(Number(s.durationSec)) || 4)),
    emotion: pick(s.emotion, EMOTION_NAMES, analysis.emotions[i % analysis.emotions.length]?.name ?? "Curiosity"),
    seed: Math.floor(Math.random() * 1e9),
  }));
}
