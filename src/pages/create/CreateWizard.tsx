import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Check, Lightbulb, ScanSearch, ListTree, ImagePlay, LayoutGrid } from "lucide-react";
import { useApp } from "@/lib/store";
import { analyzeThought, generateOutline, SAMPLE_THOUGHTS } from "@/lib/aiEngine";
import { DEMO_FRAMES } from "@/data/demo";
import type { ArtStyle, OutputFormat, Scene, Storyboard, ThoughtAnalysis } from "@/types";
import { cn } from "@/lib/utils";
import StepThought from "./StepThought";
import StepAnalysis from "./StepAnalysis";
import StepOutline from "./StepOutline";
import StepGenerate from "./StepGenerate";
import StepCompose from "./StepCompose";

export const STEPS = [
  { id: 1, label: "Your thought", icon: Lightbulb },
  { id: 2, label: "AI analysis", icon: ScanSearch },
  { id: 3, label: "Outline", icon: ListTree },
  { id: 4, label: "Generate frames", icon: ImagePlay },
  { id: 5, label: "Compose & share", icon: LayoutGrid },
];

export interface WizardData {
  thought: string;
  format: OutputFormat;
  audienceOverride: string;
  title: string;
  analysis?: ThoughtAnalysis;
  scenes: Scene[];
  style: ArtStyle;
  useDemoFrames: boolean;
  layout: "filmstrip" | "grid" | "comic";
}

export function titleFromThought(thought: string): string {
  const first = thought.split(/[.!?\n]/)[0].trim();
  const base = first.length > 10 ? first : thought.trim();
  const trimmed = base.length > 52 ? base.slice(0, 49).replace(/\s+\S*$/, "") + "…" : base;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function CreateWizard() {
  const { draftThought, setDraftThought, saveProject } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    thought: "",
    format: "storyboard",
    audienceOverride: "auto",
    title: "",
    scenes: [],
    style: "storybook",
    useDemoFrames: false,
    layout: "grid",
  });
  const projectId = useRef(`sb-${Date.now().toString(36)}`);

  useEffect(() => {
    if (draftThought) {
      setData((d) => ({ ...d, thought: draftThought }));
      setDraftThought("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (p: Partial<WizardData>) => setData((d) => ({ ...d, ...p }));

  const persist = (over: Partial<Storyboard> = {}) => {
    const sb: Storyboard = {
      id: projectId.current,
      title: data.title || titleFromThought(data.thought),
      thought: data.thought,
      format: data.format,
      style: data.style,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      analysis: data.analysis,
      scenes: data.scenes,
      exports: 0,
      ...over,
    };
    saveProject(sb);
    return sb;
  };

  const runAnalysis = () => {
    const a = analyzeThought(data.thought);
    const sample = SAMPLE_THOUGHTS.find((s) => s.text === data.thought.trim());
    patch({
      analysis: a,
      style: sample?.style ?? data.style,
      useDemoFrames: Boolean(sample?.hasRealFrames),
      title: titleFromThought(data.thought),
    });
    setStep(2);
  };

  const runOutline = (sceneCount?: number) => {
    if (!data.analysis) return;
    const scenes = generateOutline(data.thought, data.analysis, sceneCount);
    patch({ scenes });
    persist({ analysis: data.analysis, scenes, status: "outline", title: data.title || titleFromThought(data.thought) });
    setStep(3);
  };

  const finishGeneration = (style: ArtStyle) => {
    const scenes = data.scenes.map((s, i) =>
      data.useDemoFrames && DEMO_FRAMES[i] ? { ...s, imageUrl: DEMO_FRAMES[i] } : { ...s, imageUrl: undefined, seed: s.seed + style.length * 131 }
    );
    patch({ scenes, style });
    persist({ scenes, style, status: "generated", title: data.title });
    setStep(5);
  };

  const finishCompose = () => {
    const sb = persist({ status: "composed", title: data.title, layout: undefined } as Partial<Storyboard>);
    navigate(`/project/${sb.id}`);
  };

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <StepThought data={data} patch={patch} onAnalyze={runAnalysis} />;
      case 2:
        return <StepAnalysis data={data} onBack={() => setStep(1)} onOutline={runOutline} />;
      case 3:
        return (
          <StepOutline
            data={data}
            patch={patch}
            onBack={() => setStep(2)}
            onApprove={() => {
              persist({ scenes: data.scenes, status: "outline", title: data.title });
              setStep(4);
            }}
          />
        );
      case 4:
        return <StepGenerate data={data} patch={patch} onBack={() => setStep(3)} onDone={finishGeneration} />;
      case 5:
        return <StepCompose data={data} patch={patch} onBack={() => setStep(4)} onFinish={finishCompose} />;
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Storyboard Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thought → intent → outline → frames → a storyboard you can share.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:gap-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all sm:px-4",
                  active && "btn-gradient border-transparent text-white shadow-lg",
                  done && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                  !active && !done && "border-white/10 bg-white/[0.03] text-muted-foreground"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                <span className="whitespace-nowrap">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1 h-px w-4 sm:w-8", step > s.id ? "bg-emerald-400/50" : "bg-white/10")} />
              )}
            </div>
          );
        })}
      </div>

      <div key={step} className="anim-fade-slide-up">{content}</div>
    </div>
  );
}
