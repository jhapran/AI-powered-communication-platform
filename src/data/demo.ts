import type { Storyboard } from "@/types";
import { analyzeThought, generateOutline, SAMPLE_THOUGHTS } from "@/lib/aiEngine";

import scene1 from "@/assets/demo/scene-1.jpg";
import scene2 from "@/assets/demo/scene-2.jpg";
import scene3 from "@/assets/demo/scene-3.jpg";
import scene4 from "@/assets/demo/scene-4.jpg";
import scene5 from "@/assets/demo/scene-5.jpg";
import scene6 from "@/assets/demo/scene-6.jpg";

export const DEMO_FRAMES = [scene1, scene2, scene3, scene4, scene5, scene6];

const DAY = 86400_000;

export function buildDemoProjects(): Storyboard[] {
  const now = Date.now();

  // 1) Photosynthesis — full pipeline, real AI-generated frames
  const photoThought = SAMPLE_THOUGHTS[0].text;
  const photoAnalysis = analyzeThought(photoThought);
  const photoScenes = generateOutline(photoThought, photoAnalysis, 6).map((s, i) => ({
    ...s,
    imageUrl: DEMO_FRAMES[i],
    narration: [
      "Mia holds a leaf up to the sun and wonders: how does a plant eat?",
      "First, the leaf catches golden sunlight — its solar panels are open for business.",
      "Down below, the roots sip water from the soil like a thousand tiny straws.",
      "The leaf breathes in air through little doors called stomata.",
      "Inside the leaf, a tiny green factory mixes sunlight, water and air into… sugar!",
      "And the leftovers? Fresh oxygen for all of us. Thanks, plants!",
    ][i],
  }));

  const photosynthesis: Storyboard = {
    id: "demo-photosynthesis",
    title: "The Tiny Factory Inside Every Leaf",
    thought: photoThought,
    format: "storyboard",
    style: "storybook",
    status: "composed",
    createdAt: now - 2 * DAY,
    updatedAt: now - 2 * DAY + 36e5,
    analysis: photoAnalysis,
    scenes: photoScenes,
    isDemo: true,
    exports: 3,
  };

  // 2) Flow pitch — composed with procedural cinematic frames
  const pitchThought = SAMPLE_THOUGHTS[1].text;
  const pitchAnalysis = analyzeThought(pitchThought);
  const pitch: Storyboard = {
    id: "demo-flow-pitch",
    title: "Flow — Giving Back 2 Hours a Day",
    thought: pitchThought,
    format: "presentation",
    style: "cinematic",
    status: "generated",
    createdAt: now - 5 * DAY,
    updatedAt: now - DAY,
    analysis: pitchAnalysis,
    scenes: generateOutline(pitchThought, pitchAnalysis, 5),
    isDemo: true,
    exports: 1,
  };

  // 3) Sleep talk — early draft (outline only)
  const sleepThought = SAMPLE_THOUGHTS[2].text;
  const sleepAnalysis = analyzeThought(sleepThought);
  const sleep: Storyboard = {
    id: "demo-sleep",
    title: "Why Sleep Is Your Superpower",
    thought: sleepThought,
    format: "storyboard",
    style: "watercolor",
    status: "outline",
    createdAt: now - 6 * DAY,
    updatedAt: now - 6 * DAY + 18e5,
    analysis: sleepAnalysis,
    scenes: generateOutline(sleepThought, sleepAnalysis, 4),
    isDemo: true,
    exports: 0,
  };

  return [photosynthesis, pitch, sleep];
}
