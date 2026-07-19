import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { SAMPLE_THOUGHTS } from "@/lib/aiEngine";
import type { OutputFormat } from "@/types";
import type { WizardData } from "./CreateWizard";
import { cn } from "@/lib/utils";

const FORMATS: { id: OutputFormat; label: string; desc: string }[] = [
  { id: "storyboard", label: "Storyboard", desc: "Scenes + narration for a visual story" },
  { id: "comic", label: "Comic strip", desc: "Panels with speech-ready captions" },
  { id: "presentation", label: "Presentation", desc: "Slide-style frames for a talk or pitch" },
];

const AUDIENCES = ["auto", "General audience", "Children (6–12)", "Students", "Investors & stakeholders", "Internal team", "Customers", "Executives"];

interface Props {
  data: WizardData;
  patch: (p: Partial<WizardData>) => void;
  onAnalyze: () => void;
}

export default function StepThought({ data, patch, onAnalyze }: Props) {
  const len = data.thought.trim().length;
  const valid = len >= 20;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="glass rounded-2xl p-6">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Lightbulb className="h-4 w-4 text-amber-300" /> What's on your mind?
          </label>
          <textarea
            value={data.thought}
            onChange={(e) => patch({ thought: e.target.value })}
            rows={7}
            placeholder="Paste or type the thought you want to communicate… e.g. explain an idea, pitch a project, tell a story, or update your team."
            className="w-full resize-none rounded-xl border border-input bg-black/20 px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={cn("font-medium", valid ? "text-emerald-400" : "text-muted-foreground")}>
              {valid ? "Looks good — enough signal for the AI to work with." : `Keep going… ${Math.max(0, 20 - len)} more characters needed.`}
            </span>
            <span className="text-muted-foreground">{len} chars</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-3 text-sm font-bold">Output format</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => patch({ format: f.id })}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  data.format === f.id
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(247_85%_67%/0.4)]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                )}
              >
                <div className="text-sm font-bold">{f.label}</div>
                <div className="mt-1 text-xs leading-snug text-muted-foreground">{f.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-bold">Target audience</div>
            <select
              value={data.audienceOverride}
              onChange={(e) => patch({ audienceOverride: e.target.value })}
              className="w-full rounded-xl border border-input bg-black/20 px-4 py-3 text-sm outline-none focus:border-primary sm:w-72"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a} className="bg-card">
                  {a === "auto" ? "Let the AI detect it" : a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={onAnalyze}
          disabled={!valid}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold transition-all sm:w-auto",
            valid ? "btn-gradient text-white" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-muted-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" /> Analyse my thought <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Samples */}
      <div className="space-y-4">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Try a sample</div>
        {SAMPLE_THOUGHTS.map((s) => (
          <button
            key={s.id}
            onClick={() => patch({ thought: s.text })}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-all",
              data.thought === s.text
                ? "border-primary/60 bg-primary/10"
                : "border-white/10 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-bold">{s.label}</span>
              {s.hasRealFrames && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  Real AI frames
                </span>
              )}
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
          </button>
        ))}
        <div className="rounded-xl border border-dashed border-white/15 p-4 text-xs leading-relaxed text-muted-foreground">
          The photosynthesis sample ships with frames rendered by a real image model. Everything else is generated
          procedurally in your browser — that's the prototype's stand-in for the image-generation service.
        </div>
      </div>
    </div>
  );
}
