import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { EMOTION_COLORS } from "@/lib/aiEngine";
import type { CameraAngle, Scene, Transition } from "@/types";
import type { WizardData } from "./CreateWizard";
import { cn } from "@/lib/utils";

const CAMERAS: CameraAngle[] = ["Wide shot", "Medium shot", "Close-up", "Macro", "Aerial view", "Over-the-shoulder"];
const TRANSITIONS: Transition[] = ["Fade", "Slide", "Cut", "Zoom", "Dissolve"];
const EMOTIONS = Object.keys(EMOTION_COLORS);

interface Props {
  data: WizardData;
  patch: (p: Partial<WizardData>) => void;
  onBack: () => void;
  onApprove: () => void;
}

export default function StepOutline({ data, patch, onBack, onApprove }: Props) {
  const updateScene = (id: string, p: Partial<Scene>) =>
    patch({ scenes: data.scenes.map((s) => (s.id === id ? { ...s, ...p } : s)) });

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= data.scenes.length) return;
    const scenes = [...data.scenes];
    [scenes[idx], scenes[j]] = [scenes[j], scenes[idx]];
    patch({ scenes });
  };

  const remove = (id: string) => patch({ scenes: data.scenes.filter((s) => s.id !== id) });

  const add = () => {
    const n = data.scenes.length + 1;
    patch({
      scenes: [
        ...data.scenes,
        {
          id: `scene-${n}-${Date.now().toString(36)}`,
          title: `New scene ${n}`,
          narration: "",
          visualPrompt: "",
          cameraAngle: "Medium shot",
          transition: "Fade",
          durationSec: 4,
          emotion: data.analysis?.emotions[0]?.name ?? "Curiosity",
          seed: Math.floor(Math.random() * 1e9),
        },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center gap-4 rounded-2xl p-5">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Storyboard title</label>
          <input
            value={data.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="w-full bg-transparent text-xl font-extrabold tracking-tight outline-none placeholder:text-muted-foreground/40 focus:border-b focus:border-primary"
            placeholder="Name your storyboard…"
          />
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="text-2xl font-extrabold text-foreground">{data.scenes.length}</div>
          scenes · {data.scenes.reduce((a, s) => a + s.durationSec, 0)}s total
        </div>
      </div>

      <div className="space-y-4">
        {data.scenes.map((s, i) => (
          <div key={s.id} className="glass group rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 pt-1">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <div className="btn-gradient flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:bg-white/10 disabled:opacity-30">
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === data.scenes.length - 1} className="rounded p-1 text-muted-foreground hover:bg-white/10 disabled:opacity-30">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid flex-1 gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scene title</label>
                    <input
                      value={s.title}
                      onChange={(e) => updateScene(s.id, { title: e.target.value })}
                      className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm font-bold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Narration / caption</label>
                    <textarea
                      value={s.narration}
                      onChange={(e) => updateScene(s.id, { narration: e.target.value })}
                      rows={3}
                      placeholder="What the narrator says or the caption reads…"
                      className="w-full resize-none rounded-lg border border-input bg-black/20 px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visual direction</label>
                    <textarea
                      value={s.visualPrompt}
                      onChange={(e) => updateScene(s.id, { visualPrompt: e.target.value })}
                      rows={2}
                      placeholder="What the image should show…"
                      className="w-full resize-none rounded-lg border border-input bg-black/20 px-3 py-2 text-sm leading-relaxed outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Camera</label>
                      <select
                        value={s.cameraAngle}
                        onChange={(e) => updateScene(s.id, { cameraAngle: e.target.value as CameraAngle })}
                        className="w-full rounded-lg border border-input bg-black/20 px-2.5 py-2 text-xs outline-none focus:border-primary"
                      >
                        {CAMERAS.map((c) => (
                          <option key={c} value={c} className="bg-card">{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Transition</label>
                      <select
                        value={s.transition}
                        onChange={(e) => updateScene(s.id, { transition: e.target.value as Transition })}
                        className="w-full rounded-lg border border-input bg-black/20 px-2.5 py-2 text-xs outline-none focus:border-primary"
                      >
                        {TRANSITIONS.map((t) => (
                          <option key={t} value={t} className="bg-card">{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Duration <span className="text-foreground">{s.durationSec}s</span>
                    </label>
                    <input
                      type="range" min={2} max={12} value={s.durationSec}
                      onChange={(e) => updateScene(s.id, { durationSec: Number(e.target.value) })}
                      className="w-full accent-violet-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Emotion</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOTIONS.map((em) => (
                        <button
                          key={em}
                          onClick={() => updateScene(s.id, { emotion: em })}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all",
                            s.emotion === em ? "text-white" : "border-white/10 text-muted-foreground hover:border-white/25"
                          )}
                          style={s.emotion === em ? { background: `${EMOTION_COLORS[em]}26`, borderColor: `${EMOTION_COLORS[em]}66`, color: EMOTION_COLORS[em] } : {}}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => remove(s.id)}
                      disabled={data.scenes.length <= 1}
                      className="flex items-center gap-1.5 rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/15 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove scene
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Plus className="h-4 w-4" /> Add a scene
      </button>

      <div className="flex flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/[0.07]">
          <ArrowLeft className="h-4 w-4" /> Back to analysis
        </button>
        <button onClick={onApprove} className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white">
          Approve outline · choose style <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
