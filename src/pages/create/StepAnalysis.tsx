import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, BrainCircuit, CheckCircle2, ShieldCheck, Target, Users, MessageSquareQuote, Hash,
} from "lucide-react";
import { INTENT_LABEL } from "@/lib/aiEngine";
import type { WizardData } from "./CreateWizard";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  onBack: () => void;
  onOutline: (sceneCount?: number) => void;
}

function ConfBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
      <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export default function StepAnalysis({ data, onBack, onOutline }: Props) {
  const a = data.analysis!;
  const [completed, setCompleted] = useState(0);
  const [sceneCount, setSceneCount] = useState(data.useDemoFrames ? 6 : a.recommendedScenes);
  const done = completed >= a.pipeline.length;

  useEffect(() => {
    setCompleted(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let acc = 300;
    a.pipeline.forEach((m, i) => {
      acc += m.durationMs * 0.55;
      timers.push(setTimeout(() => setCompleted(i + 1), acc));
    });
    return () => timers.forEach(clearTimeout);
  }, [a]);

  return (
    <div className="space-y-6">
      {/* Pipeline */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold">
          <BrainCircuit className="h-4 w-4 text-primary" /> AI pipeline
          {!done && <span className="text-xs font-medium text-muted-foreground">running modules…</span>}
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {a.pipeline.map((m, i) => {
            const isDone = i < completed;
            const running = i === completed;
            return (
              <div
                key={m.module}
                className={cn(
                  "rounded-xl border p-3.5 transition-all duration-500",
                  isDone && "border-emerald-400/25 bg-emerald-400/5",
                  running && "anim-pulse-ring border-primary/50 bg-primary/10",
                  !isDone && !running && "border-white/10 bg-white/[0.02] opacity-50"
                )}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold leading-tight">{m.module}</span>
                  {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                </div>
                {isDone ? (
                  <>
                    <div className="mb-1 flex items-center gap-2">
                      <ConfBar value={m.confidence} color="bg-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-300">{Math.round(m.confidence * 100)}%</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{m.durationMs}ms · confidence</div>
                  </>
                ) : (
                  <div className="text-[10px] text-muted-foreground">{running ? "processing…" : "queued"}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className={cn("grid gap-4 transition-opacity duration-700 lg:grid-cols-3", done ? "opacity-100" : "pointer-events-none opacity-30")}>
        {/* Intent */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-violet-300" /> Detected intent
          </div>
          <div className="mb-2 text-xl font-extrabold tracking-tight">{INTENT_LABEL[a.intent]}</div>
          <div className="flex items-center gap-2">
            <ConfBar value={a.intentConfidence} />
            <span className="text-xs font-bold text-violet-300">{Math.round(a.intentConfidence * 100)}%</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">"{a.summary}"</p>
        </div>

        {/* Emotions */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <MessageSquareQuote className="h-3.5 w-3.5 text-pink-300" /> Emotional tone
          </div>
          <div className="space-y-2.5">
            {a.emotions.map((e) => (
              <div key={e.name} className="flex items-center gap-2.5">
                <span className="w-20 text-xs font-semibold">{e.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${e.score * 100}%`, background: e.color }} />
                </div>
                <span className="w-8 text-right text-[10px] font-bold text-muted-foreground">{Math.round(e.score * 100)}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Suggested tone: <span className="font-semibold text-foreground">{a.tone}</span></p>
        </div>

        {/* Audience & moderation */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-cyan-300" /> Audience
            </div>
            <div className="text-lg font-extrabold">{data.audienceOverride !== "auto" ? data.audienceOverride : a.audience}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {data.audienceOverride !== "auto" ? "Overridden by you" : `${Math.round(a.audienceConfidence * 100)}% confidence · reading level: ${a.readingLevel}`}
            </div>
          </div>
          <div className="glass flex items-center gap-3 rounded-2xl p-5">
            <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-400" />
            <div>
              <div className="text-sm font-bold">Moderation passed</div>
              <div className="text-xs text-muted-foreground">{a.moderation.note} · {Math.round(a.moderation.confidence * 100)}% confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Keywords + scene plan */}
      <div className={cn("glass rounded-2xl p-6 transition-opacity duration-700", done ? "opacity-100" : "pointer-events-none opacity-30")}>
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <Hash className="h-3.5 w-3.5 text-amber-300" /> Key concepts to visualise
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {a.keywords.map((k) => (
            <span key={k} className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
              {k}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Scenes:</span>
            <div className="flex items-center gap-1.5">
              {[4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setSceneCount(n)}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-bold transition-all",
                    sceneCount === n ? "btn-gradient border-transparent text-white" : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/25"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">(AI recommends {a.recommendedScenes})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/[0.07]">
          <ArrowLeft className="h-4 w-4" /> Edit thought
        </button>
        <button
          onClick={() => onOutline(sceneCount)}
          disabled={!done}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all",
            done ? "btn-gradient text-white" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-muted-foreground"
          )}
        >
          Generate storyboard outline <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
