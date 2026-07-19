export type Intent = "explain" | "persuade" | "inspire" | "inform" | "entertain";

export interface EmotionScore {
  name: string;
  score: number; // 0..1
  color: string; // hex
}

export interface PipelineModuleResult {
  module: string;
  confidence: number;
  durationMs: number;
}

export interface ThoughtAnalysis {
  summary: string;
  intent: Intent;
  intentConfidence: number;
  audience: string;
  audienceConfidence: number;
  tone: string;
  emotions: EmotionScore[];
  keywords: string[];
  readingLevel: string;
  recommendedScenes: number;
  moderation: { passed: boolean; confidence: number; note: string };
  pipeline: PipelineModuleResult[];
}

export type ArtStyle =
  | "storybook"
  | "comic"
  | "cinematic"
  | "flat"
  | "watercolor"
  | "render3d";

export type OutputFormat = "storyboard" | "comic" | "presentation";

export interface Scene {
  id: string;
  title: string;
  narration: string;
  visualPrompt: string;
  cameraAngle: CameraAngle;
  transition: Transition;
  durationSec: number;
  emotion: string;
  imageUrl?: string; // bundled asset (demo) — otherwise SVG frame is rendered procedurally
  seed: number; // procedural frame seed
}

export type CameraAngle =
  | "Wide shot"
  | "Medium shot"
  | "Close-up"
  | "Macro"
  | "Aerial view"
  | "Over-the-shoulder";

export type Transition = "Fade" | "Slide" | "Cut" | "Zoom" | "Dissolve";

export type StoryboardStatus =
  | "draft"
  | "analyzed"
  | "outline"
  | "generated"
  | "composed";

export interface Storyboard {
  id: string;
  title: string;
  thought: string;
  format: OutputFormat;
  style: ArtStyle;
  status: StoryboardStatus;
  createdAt: number;
  updatedAt: number;
  analysis?: ThoughtAnalysis;
  scenes: Scene[];
  isDemo?: boolean;
  exports: number;
}

export interface UserProfile {
  name: string;
  email: string;
}

export const STATUS_LABEL: Record<StoryboardStatus, string> = {
  draft: "Draft",
  analyzed: "Analyzed",
  outline: "Outline",
  generated: "Frames generated",
  composed: "Composed",
};
