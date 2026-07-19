import { useState } from "react";
import {
  Clapperboard, Timer, PersonStanding, Video as VideoIcon, ArrowLeftRight, Mic2, Captions, Music4, Rocket, Play,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { CapabilityCard, Phase2Header, Phase2Notice } from "@/components/Phase2";
import AnimaticPlayer from "@/components/AnimaticPlayer";
import SceneImage from "@/components/SceneImage";
import type { Storyboard } from "@/types";

const PIPELINE = [
  { icon: Timer, title: "Scene timing", desc: "Durations from your outline drive the edit rhythm.", ready: true },
  { icon: PersonStanding, title: "Animation", desc: "Parallax and character motion bring frames to life.", ready: false },
  { icon: VideoIcon, title: "Camera movement", desc: "Pans, zooms and dolly moves per shot type.", ready: false },
  { icon: ArrowLeftRight, title: "Transitions", desc: "Your per-scene transitions compiled into the cut.", ready: true },
  { icon: Mic2, title: "Voice timing", desc: "Narration synthesised and aligned to each scene.", ready: false },
  { icon: Captions, title: "Subtitles", desc: "Auto-generated, styled and burnt-in or sidecar.", ready: false },
  { icon: Music4, title: "Music", desc: "Mood-matched score from the emotion analysis.", ready: false },
  { icon: Rocket, title: "Final render", desc: "1080p MP4 via the render queue, straight to share.", ready: false },
];

export default function Video() {
  const { projects } = useApp();
  const [playing, setPlaying] = useState<Storyboard | null>(null);
  const ready = projects.filter((p) => p.scenes.length > 0);

  return (
    <div className="space-y-8">
      <Phase2Header
        icon={Clapperboard}
        title="Video Studio"
        subtitle="The storyboard-to-video pipeline from the Video Generation Spec. Phase 4 — the animatic preview below works today."
        phase="Phase 4 · Partial"
      />

      <Phase2Notice text="Full video rendering queues in Phase 4. What already works: the animatic — your composed storyboard played as a timed slideshow with transitions, captions and camera drift." />

      {/* Animatic */}
      <div>
        <h2 className="mb-4 text-lg font-bold">Animatic preview — works today</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ready.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlaying(p)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <SceneImage scene={p.scenes[0]} style={p.style} index={0} alt={p.title} className="aspect-[16/9] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="btn-gradient rounded-full p-4 text-white shadow-2xl">
                  <Play className="h-5 w-5 translate-x-[1px]" />
                </div>
              </div>
              <div className="absolute bottom-0 w-full p-4">
                <div className="text-sm font-bold">{p.title}</div>
                <div className="text-[11px] text-white/70">
                  {p.scenes.length} scenes · {p.scenes.reduce((a, s) => a + s.durationSec, 0)}s
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="mb-4 text-lg font-bold">Storyboard → video pipeline</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((c) => (
            <CapabilityCard key={c.title} {...c} locked={!c.ready} />
          ))}
        </div>
      </div>

      {playing && <AnimaticPlayer sb={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
