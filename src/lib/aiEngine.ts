import type {
  ArtStyle,
  CameraAngle,
  EmotionScore,
  Intent,
  Scene,
  ThoughtAnalysis,
  Transition,
} from "@/types";

/* ------------------------------------------------------------------ */
/*  Simulated AI engine — mirrors the modules defined in the product   */
/*  AI Specification (thought analysis, intent/emotion detection,      */
/*  storyboard planning, scene generation, prompt generation,          */
/*  moderation) with confidence scores. Deterministic per input.       */
/* ------------------------------------------------------------------ */

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STOPWORDS = new Set(
  `the a an and or but if then else when while of to in on at for with without from by as is are was were be been being it its this that these those you your we our they their he she his her i me my him them us not no yes do does did done have has had having can could will would should shall may might must about into over under again further once here there all any both each few more most other some such only own same so than too very just because through during before after above below between out off down up`.split(
    /\s+/
  )
);

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  explain: ["explain", "how", "why", "teach", "guide", "understand", "learn", "works", "tutorial", "lesson", "breakdown", "clarify", "walkthrough"],
  persuade: ["pitch", "convince", "investor", "investors", "buy", "sell", "should", "persuade", "proposal", "funding", "stakeholder", "approve", "budget", "win"],
  inspire: ["dream", "motivate", "believe", "journey", "inspire", "vision", "future", "hope", "transform", "change", "courage", "overcome"],
  inform: ["announce", "update", "report", "news", "summary", "status", "weekly", "quarterly", "results", "metrics", "launch", "release", "introducing"],
  entertain: ["story", "funny", "adventure", "joke", "tale", "comic", "fun", "silly", "dragon", "pirate", "magic", "quest", "character"],
};

export const INTENT_LABEL: Record<Intent, string> = {
  explain: "Explain / Teach",
  persuade: "Persuade / Pitch",
  inspire: "Inspire / Motivate",
  inform: "Inform / Update",
  entertain: "Entertain / Tell a story",
};

const EMOTION_KEYWORDS: Record<string, string[]> = {
  Joy: ["happy", "fun", "bright", "love", "celebrate", "smile", "excited", "delight", "laugh", "sunny"],
  Curiosity: ["wonder", "curious", "question", "explore", "discover", "why", "how", "mystery", "learn"],
  Calm: ["calm", "gentle", "peaceful", "relax", "soft", "quiet", "slow", "breathe", "sleep", "wellness"],
  Excitement: ["amazing", "exciting", "bold", "energy", "fast", "launch", "new", "breakthrough", "win", "epic"],
  Trust: ["reliable", "safe", "proven", "data", "secure", "stable", "results", "evidence", "guarantee"],
  Hope: ["future", "hope", "dream", "change", "grow", "better", "possible", "imagine", "together"],
};

export const EMOTION_COLORS: Record<string, string> = {
  Joy: "#fbbf24",
  Curiosity: "#22d3ee",
  Calm: "#34d399",
  Excitement: "#f472b6",
  Trust: "#818cf8",
  Hope: "#c084fc",
};

const AUDIENCE_RULES: [RegExp, string][] = [
  [/\b(kid|kids|child|children|child|10-year-old|10 year old|toddler|preschool|elementary)\b/i, "Children (6–12)"],
  [/\b(student|students|classroom|class|pupils)\b/i, "Students"],
  [/\b(investor|investors|vc|funding|stakeholder|board)\b/i, "Investors & stakeholders"],
  [/\b(team|teammates|colleague|colleagues|staff|sprint|engineering|company|all-hands)\b/i, "Internal team"],
  [/\b(customer|customers|users|clients?|audience|market)\b/i, "Customers"],
  [/\b(developer|developers|engineers?|technical)\b/i, "Technical audience"],
  [/\b(executive|executives|leadership|ceo|c-suite|manager)\b/i, "Executives"],
];

const TONE_BY_INTENT: Record<Intent, string> = {
  explain: "Clear, warm and patient",
  persuade: "Confident and compelling",
  inspire: "Uplifting and cinematic",
  inform: "Crisp and professional",
  entertain: "Playful and vivid",
};

function extractKeywords(words: string[], count: number): string[] {
  const freq = new Map<string, number>();
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9'-]/g, "");
    if (clean.length < 4 || STOPWORDS.has(clean)) continue;
    freq.set(clean, (freq.get(clean) ?? 0) + 1);
  }
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length);
  const out = sorted.slice(0, count).map(([w]) => w);
  if (out.length < 3) {
    for (const w of words) {
      const clean = w.replace(/[^a-z0-9'-]/g, "");
      if (clean.length >= 4 && !out.includes(clean) && !STOPWORDS.has(clean)) out.push(clean);
      if (out.length >= 3) break;
    }
  }
  return out.slice(0, count);
}

export function analyzeThought(text: string): ThoughtAnalysis {
  const rand = mulberry32(hashString(text));
  const lower = ` ${text.toLowerCase()} `;
  const words = lower.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);

  // --- Intent detection ---
  const intentScores = (Object.keys(INTENT_KEYWORDS) as Intent[]).map((intent) => {
    let hits = 0;
    for (const k of INTENT_KEYWORDS[intent]) {
      if (lower.includes(` ${k}`) || lower.includes(`${k} `)) hits++;
    }
    return { intent, hits };
  });
  intentScores.sort((a, b) => b.hits - a.hits);
  const topIntent = intentScores[0].hits > 0 ? intentScores[0].intent : "inform";
  const intentConfidence =
    intentScores[0].hits > 0
      ? Math.min(0.68 + intentScores[0].hits * 0.07 + rand() * 0.06, 0.97)
      : 0.61 + rand() * 0.08;

  // --- Emotion detection ---
  const emotions: EmotionScore[] = [];
  for (const [name, kws] of Object.entries(EMOTION_KEYWORDS)) {
    let hits = 0;
    for (const k of kws) if (lower.includes(k)) hits++;
    if (hits > 0) {
      emotions.push({
        name,
        score: Math.min(0.55 + hits * 0.12 + rand() * 0.12, 0.98),
        color: EMOTION_COLORS[name],
      });
    }
  }
  if (emotions.length === 0) {
    const fallback = topIntent === "explain" ? "Curiosity" : topIntent === "inspire" ? "Hope" : "Trust";
    emotions.push({ name: fallback, score: 0.62 + rand() * 0.1, color: EMOTION_COLORS[fallback] });
    emotions.push({ name: "Calm", score: 0.45 + rand() * 0.1, color: EMOTION_COLORS["Calm"] });
  }
  if (emotions.length === 1) {
    const second = emotions[0].name === "Curiosity" ? "Joy" : "Curiosity";
    emotions.push({ name: second, score: 0.42 + rand() * 0.12, color: EMOTION_COLORS[second] });
  }
  emotions.sort((a, b) => b.score - a.score);

  // --- Audience ---
  let audience = "General audience";
  let audienceConfidence = 0.58 + rand() * 0.08;
  for (const [re, label] of AUDIENCE_RULES) {
    if (re.test(text)) {
      audience = label;
      audienceConfidence = 0.82 + rand() * 0.13;
      break;
    }
  }

  const keywords = extractKeywords(words, 6);
  const summary =
    sentences[0]
      ? sentences[0].length > 110
        ? sentences[0].slice(0, 107) + "…"
        : sentences[0]
      : text.slice(0, 107);

  const recommendedScenes = Math.max(4, Math.min(8, Math.round(words.length / 10) + 3));
  const wordCount = words.length;
  const readingLevel = wordCount < 40 ? "Simple" : wordCount < 120 ? "Intermediate" : "Detailed";

  return {
    summary,
    intent: topIntent,
    intentConfidence,
    audience,
    audienceConfidence,
    tone: TONE_BY_INTENT[topIntent],
    emotions: emotions.slice(0, 3),
    keywords,
    readingLevel,
    recommendedScenes,
    moderation: { passed: true, confidence: 0.97 + rand() * 0.02, note: "No unsafe content detected" },
    pipeline: [
      { module: "Thought Analysis", confidence: 0.88 + rand() * 0.09, durationMs: 620 + Math.round(rand() * 300) },
      { module: "Intent Detection", confidence: intentConfidence, durationMs: 430 + Math.round(rand() * 240) },
      { module: "Emotion Detection", confidence: emotions[0].score, durationMs: 510 + Math.round(rand() * 260) },
      { module: "Audience Modeling", confidence: audienceConfidence, durationMs: 380 + Math.round(rand() * 200) },
      { module: "Content Moderation", confidence: 0.97 + rand() * 0.02, durationMs: 290 + Math.round(rand() * 160) },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Storyboard planning + scene generation                             */
/* ------------------------------------------------------------------ */

const OUTLINE_TEMPLATES: Record<Intent, { title: string; beat: string }[]> = {
  explain: [
    { title: "The Curious Question", beat: "Open with the core question your audience is wondering about." },
    { title: "Setting the Scene", beat: "Introduce the context and why this matters." },
    { title: "The Big Idea", beat: "Reveal the central concept in one clear moment." },
    { title: "How It Works", beat: "Break the process into a simple visual step." },
    { title: "A Simple Analogy", beat: "Make it click with an everyday comparison." },
    { title: "The Takeaway", beat: "Land the one thing to remember, warmly." },
  ],
  persuade: [
    { title: "The Problem", beat: "Show the pain point your audience feels today." },
    { title: "What It Costs", beat: "Raise the stakes — what happens if nothing changes." },
    { title: "The Big Idea", beat: "Introduce your solution as the turning point." },
    { title: "How It Works", beat: "Show the solution in action, simply." },
    { title: "The Proof", beat: "Evidence, numbers, or a before/after moment." },
    { title: "Call to Action", beat: "End on the clear next step." },
  ],
  inspire: [
    { title: "Where We Start", beat: "Ground the audience in the current reality." },
    { title: "The Spark", beat: "The moment of possibility appears." },
    { title: "The Climb", beat: "Show effort, momentum, and obstacles." },
    { title: "The Turning Point", beat: "The breakthrough moment." },
    { title: "The View From Above", beat: "Reveal the transformed outcome." },
    { title: "Your Move", beat: "Invite the audience into the story." },
  ],
  inform: [
    { title: "The Headline", beat: "Lead with the single most important fact." },
    { title: "The Context", beat: "Background the audience needs." },
    { title: "Key Detail One", beat: "First supporting point, visualised." },
    { title: "Key Detail Two", beat: "Second supporting point, visualised." },
    { title: "What It Means", beat: "Interpret the update for the audience." },
    { title: "What's Next", beat: "Close with timing and next steps." },
  ],
  entertain: [
    { title: "Meet the Hero", beat: "Introduce the character in their world." },
    { title: "The Ordinary Day", beat: "Establish normality before the twist." },
    { title: "The Twist", beat: "Something unexpected happens!" },
    { title: "The Adventure", beat: "The chase, journey, or challenge." },
    { title: "The Cliffhanger", beat: "Peak tension — will they make it?" },
    { title: "The Happy Ending", beat: "Resolve with warmth and a wink." },
  ],
};

const CAMERA_CYCLE: Record<Intent, CameraAngle[]> = {
  explain: ["Wide shot", "Close-up", "Aerial view", "Macro", "Medium shot", "Wide shot"],
  persuade: ["Close-up", "Wide shot", "Over-the-shoulder", "Medium shot", "Close-up", "Wide shot"],
  inspire: ["Wide shot", "Close-up", "Aerial view", "Close-up", "Aerial view", "Medium shot"],
  inform: ["Medium shot", "Wide shot", "Close-up", "Close-up", "Medium shot", "Wide shot"],
  entertain: ["Medium shot", "Wide shot", "Close-up", "Aerial view", "Macro", "Wide shot"],
};

const TRANSITIONS: Transition[] = ["Fade", "Slide", "Cut", "Zoom", "Dissolve"];

export function generateOutline(
  text: string,
  analysis: ThoughtAnalysis,
  sceneCount?: number
): Scene[] {
  const rand = mulberry32(hashString(text + "::outline"));
  const template = OUTLINE_TEMPLATES[analysis.intent];
  const count = Math.max(3, Math.min(8, sceneCount ?? analysis.recommendedScenes));
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 8);
  const kw = analysis.keywords.length ? analysis.keywords : ["idea", "story", "moment"];
  const emotionNames = analysis.emotions.map((e) => e.name);

  const scenes: Scene[] = [];
  for (let i = 0; i < count; i++) {
    const t = template[Math.min(i, template.length - 1)];
    const subject = kw[i % kw.length];
    const secondary = kw[(i + 1) % kw.length];
    const src = sentences.length ? sentences[i % sentences.length] : "";
    const narration = src
      ? src.length > 130
        ? src.slice(0, 127) + "…"
        : src
      : t.beat;
    scenes.push({
      id: `scene-${i + 1}-${Math.round(rand() * 1e6)}`,
      title: i < template.length ? t.title : `${t.title} (cont.)`,
      narration,
      visualPrompt: `${t.beat} Focus on ${subject}${secondary !== subject ? ` and ${secondary}` : ""}.`,
      cameraAngle: CAMERA_CYCLE[analysis.intent][i % 6],
      transition: TRANSITIONS[Math.floor(rand() * TRANSITIONS.length)],
      durationSec: 3 + Math.round(rand() * 4),
      emotion: emotionNames[i % emotionNames.length] ?? "Curiosity",
      seed: Math.round(rand() * 1e9),
    });
  }
  return scenes;
}

/* ------------------------------------------------------------------ */
/*  Prompt generation (image prompts per style)                        */
/* ------------------------------------------------------------------ */

export const STYLE_META: Record<
  ArtStyle,
  { label: string; descriptor: string; negative: string; swatch: string[] }
> = {
  storybook: {
    label: "Storybook",
    descriptor: "warm children's storybook illustration, soft watercolor and gouache texture, gentle golden light, rounded friendly shapes",
    negative: "photorealistic, harsh shadows, scary, text artifacts",
    swatch: ["#f59e0b", "#84cc16", "#38bdf8"],
  },
  comic: {
    label: "Comic / Graphic novel",
    descriptor: "bold comic book art, ink outlines, halftone dots, dynamic composition, vibrant flat colors",
    negative: "blurry, muted, photorealistic skin",
    swatch: ["#f43f5e", "#facc15", "#3b82f6"],
  },
  cinematic: {
    label: "Cinematic",
    descriptor: "cinematic film still, dramatic lighting, shallow depth of field, anamorphic lens, teal and orange grade",
    negative: "cartoon, flat lighting, low contrast",
    swatch: ["#0ea5e9", "#f97316", "#111827"],
  },
  flat: {
    label: "Flat illustration",
    descriptor: "modern flat vector illustration, geometric shapes, limited palette, clean negative space",
    negative: "gradients overload, texture noise, realism",
    swatch: ["#8b5cf6", "#ec4899", "#06b6d4"],
  },
  watercolor: {
    label: "Watercolor",
    descriptor: "loose watercolor painting, visible paper grain, soft washes bleeding at edges, airy and light",
    negative: "hard edges, neon, digital gloss",
    swatch: ["#a5b4fc", "#fbcfe8", "#a7f3d0"],
  },
  render3d: {
    label: "3D render",
    descriptor: "polished 3D render, soft studio lighting, subsurface scattering, Pixar-like charm, octane render",
    negative: "flat, 2d, sketch, grain",
    swatch: ["#22d3ee", "#a78bfa", "#f472b6"],
  },
};

export function visualPromptFor(scene: Scene, style: ArtStyle, analysis?: ThoughtAnalysis): string {
  const meta = STYLE_META[style];
  const mood = analysis ? analysis.tone.toLowerCase() : "expressive";
  return `${scene.cameraAngle} — ${scene.visualPrompt} ${meta.descriptor}, ${mood} mood, ${scene.emotion.toLowerCase()} emotional tone. Negative: ${meta.negative}.`;
}

/* ------------------------------------------------------------------ */
/*  Demo sample thoughts                                               */
/* ------------------------------------------------------------------ */

export const SAMPLE_THOUGHTS = [
  {
    id: "photosynthesis",
    label: "Explain photosynthesis to a 10-year-old",
    text: "Explain how photosynthesis works to a curious 10-year-old. Show how a leaf catches sunlight, how the roots drink water, how the plant breathes in air, and how it turns all of it into food and fresh oxygen. Make it feel like a tiny magical factory inside every leaf.",
    style: "storybook" as ArtStyle,
    hasRealFrames: true,
  },
  {
    id: "pitch",
    label: "Pitch a focus app to investors",
    text: "Pitch our new focus app Flow to investors. Knowledge workers lose 2 hours a day to context switching. Flow combines smart notifications, deep-work timers and team quiet hours to give that time back. Early pilots show a 34 percent productivity lift. We are raising a seed round to scale.",
    style: "cinematic" as ArtStyle,
  },
  {
    id: "wellness",
    label: "Team talk: why sleep matters",
    text: "Help me explain to my team why sleep matters for our wellbeing and performance. Cover how sleep consolidates memory, how it restores focus and mood, and give three gentle habits to sleep better. Keep it calm, encouraging and practical.",
    style: "watercolor" as ArtStyle,
  },
];
