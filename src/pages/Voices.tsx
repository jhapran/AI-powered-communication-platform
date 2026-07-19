import {
  AudioWaveform, Mic, BrainCircuit, Users, Drama, Globe2, Gauge, BookOpenText, ShieldCheck, FileSignature, Play,
} from "lucide-react";
import { CapabilityCard, Phase2Header, Phase2Notice } from "@/components/Phase2";

const CAPABILITIES = [
  { icon: Mic, title: "Voice recording", desc: "Guided 3-minute recording session with quality checks and noise gating." },
  { icon: BrainCircuit, title: "Voice training", desc: "Neural TTS fine-tuned on your samples; ready in under an hour." },
  { icon: Users, title: "Voice profiles", desc: "Multiple profiles per user — narrator, presenter, character voices." },
  { icon: Drama, title: "Emotion control", desc: "Per-scene emotional delivery: warm, excited, calm, authoritative." },
  { icon: Globe2, title: "Accent & language", desc: "Keep your voice, switch accent or language with cross-lingual transfer." },
  { icon: Gauge, title: "Speech speed", desc: "0.75×–1.5× pacing, auto-synced to scene durations." },
  { icon: BookOpenText, title: "Pronunciation", desc: "Custom dictionary for names, brands and domain jargon." },
  { icon: FileSignature, title: "Explicit consent", desc: "Voice cloning only after a recorded consent phrase — revocable any time." },
  { icon: ShieldCheck, title: "Safety controls", desc: "Voice ownership verification; synthetic speech watermarking." },
];

const STOCK_VOICES = [
  { name: "Aria", style: "Warm narrator", lang: "EN · US", color: "#a78bfa" },
  { name: "Kai", style: "Energetic presenter", lang: "EN · UK", color: "#22d3ee" },
  { name: "Sofia", style: "Calm storyteller", lang: "EN · AU", color: "#f472b6" },
  { name: "Mateo", style: "Confident pitch", lang: "EN · ES accent", color: "#34d399" },
];

export default function Voices() {
  return (
    <div className="space-y-8">
      <Phase2Header
        icon={AudioWaveform}
        title="Voice Studio"
        subtitle="Give every storyboard a voice — stock narrators today, your own cloned voice in Phase 5 with explicit, revocable consent."
        phase="Phase 5 · Planned"
      />

      <Phase2Notice text="Voice cloning follows the Voice Specification: explicit user consent, ownership verification and watermarking. Stock narration voices will arrive with the video pipeline in Phase 4." />

      <div>
        <h2 className="mb-4 text-lg font-bold">Stock narrator preview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STOCK_VOICES.map((v) => (
            <div key={v.name} className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white" style={{ background: v.color }}>
                  {v.name[0]}
                </div>
                <button disabled title="Available in Phase 4" className="rounded-full border border-white/10 bg-white/5 p-2.5 text-muted-foreground/50">
                  <Play className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="text-sm font-bold">{v.name}</div>
              <div className="text-xs text-muted-foreground">{v.style}</div>
              <div className="mt-2 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {v.lang}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">Planned capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
}
