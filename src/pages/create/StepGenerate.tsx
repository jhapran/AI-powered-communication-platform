import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Dices, ImagePlay, Loader2, RefreshCw } from "lucide-react";
import { STYLE_META, visualPromptFor } from "@/lib/aiEngine";
import { sceneImage } from "@/lib/frameArt";
import type { ArtStyle } from "@/types";
import type { WizardData } from "./CreateWizard";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  patch: (p: Partial<WizardData>) => void;
  onBack: () => void;
  onDone: (style: ArtStyle) => void;
}

type Phase = "pick" | "running" | "done";

export default function StepGenerate({ data, patch, onBack, onDone }: Props) {
  const [style, setStyle] = useState<ArtStyle>(data.style);
  const [phase, setPhase] = useState<Phase>("pick");
  const [progress, setProgress] = useState<number[]>(() => data.scenes.map(() => 0));
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const start = () => {
    setPhase("running");
    setProgress(data.scenes.map(() => 0));
    data.scenes.forEach((_, i) => {
      const speed = 3 + Math.random() * 5; // % per tick
      const delay = i * 350;
      setTimeout(() => {
        const t = setInterval(() => {
          setProgress((prev) => {
            const next = [...prev];
            next[i] = Math.min(100, next[i] + speed + Math.random() * 4);
            return next;
          });
        }, 120);
        timers.current.push(t);
      }, delay);
    });
  };

  const allDone = progress.length > 0 && progress.every((p) => p >= 100);
  useEffect(() => {
    if (allDone && phase === "running") {
      timers.current.forEach(clearInterval);
      const t = setTimeout(() => setPhase("done"), 500);
      return () => clearTimeout(t);
    }
  }, [allDone, phase]);

  const reseed = (id: string) => {
    patch({ scenes: data.scenes.map((s) => (s.id === id ? { ...s, seed: Math.floor(Math.random() * 1e9), imageUrl: undefined } : s)) });
  };

  const previewScene = (i: number) => data.scenes[i];

  return (
    <div className="space-y-6">
      {/* Style picker */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-1 text-sm font-bold">Art direction</div>
        <p className="mb-4 text-xs text-muted-foreground">
          Style library from the Image Generation Spec — applied consistently across every scene, with a shared negative prompt.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(STYLE_META) as ArtStyle[]).map((k) => {
            const meta = STYLE_META[k];
            const active = style === k;
            return (
              <button
                key={k}
                disabled={phase === "running"}
                onClick={() => setStyle(k)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all",
                  active ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(247_85%_67%/0.4)]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                )}
              >
                <div className="mb-2 flex h-10 items-end gap-1">
                  {meta.swatch.map((c, i) => (
                    <span key={c} className="block rounded-md" style={{ background: c, width: 26 - i * 4, height: 36 - i * 8 }} />
                  ))}
                </div>
                <div className="text-xs font-bold leading-tight">{meta.label}</div>
              </button>
            );
          })}
        </div>
        {data.useDemoFrames && (
          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs leading-relaxed text-emerald-200">
            This thought matches the bundled demo — its frames were rendered with a real text-to-image model using the
            character-consistency prompts from the AI spec. Other thoughts get procedural concept frames generated locally.
          </div>
        )}
      </div>

      {/* Scene prompt list / progress */}
      <div className="space-y-3">
        {data.scenes.map((s, i) => {
          const p = progress[i] ?? 0;
          const done = p >= 100;
          return (
            <div key={s.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-4">
                {/* thumbnail */}
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  {phase === "done" || (phase === "running" && done) ? (
                    <img src={sceneImage(previewScene(i), style, i)} alt={s.title} className="h-full w-full object-cover" />
                  ) : phase === "running" && p > 0 ? (
                    <div className="shimmer h-full w-full bg-white/[0.04]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                      <ImagePlay className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {String(i + 1).padStart(2, "0")} · {s.title}
                    </span>
                    {phase === "running" && !done && p > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                    {(done || phase === "done") && phase !== "pick" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  <button
                    onClick={() => setExpandedPrompt(expandedPrompt === s.id ? null : s.id)}
                    className="line-clamp-1 text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground"
                  >
                    {visualPromptFor(s, style, data.analysis)}
                  </button>
                  {phase === "running" && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="btn-gradient h-full rounded-full transition-all duration-150" style={{ width: `${p}%` }} />
                      </div>
                      <span className="w-9 text-right text-[10px] font-bold text-muted-foreground">{Math.round(p)}%</span>
                    </div>
                  )}
                </div>

                {phase === "done" && !s.imageUrl && (
                  <button
                    onClick={() => reseed(s.id)}
                    title="Re-roll this frame"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Dices className="h-3.5 w-3.5" /> Re-roll
                  </button>
                )}
              </div>
              {expandedPrompt === s.id && (
                <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {visualPromptFor(s, style, data.analysis)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} disabled={phase === "running"} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/[0.07] disabled:opacity-40">
          <ArrowLeft className="h-4 w-4" /> Edit outline
        </button>
        {phase === "pick" && (
          <button onClick={start} className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white">
            <ImagePlay className="h-4 w-4" /> Generate {data.scenes.length} frames
          </button>
        )}
        {phase === "running" && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary">
            <Loader2 className="h-4 w-4 animate-spin" /> Rendering scenes… {progress.filter((p) => p >= 100).length}/{data.scenes.length}
          </div>
        )}
        {phase === "done" && (
          <>
            <button onClick={start} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/[0.07]">
              <RefreshCw className="h-4 w-4" /> Regenerate all
            </button>
            <button onClick={() => onDone(style)} className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white">
              Compose storyboard <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
