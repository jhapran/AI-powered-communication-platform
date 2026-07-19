import { useState } from "react";
import {
  ArrowLeft, Check, Download, FileJson, Film, LayoutGrid, Link2, PanelsTopLeft, Rocket, Share2,
} from "lucide-react";
import StoryboardPreview, { type BoardLayout } from "@/components/StoryboardPreview";
import { exportStoryboardJSON, exportStoryboardPNG } from "@/lib/exporter";
import type { Storyboard } from "@/types";
import type { WizardData } from "./CreateWizard";
import { cn } from "@/lib/utils";

interface Props {
  data: WizardData;
  patch: (p: Partial<WizardData>) => void;
  onBack: () => void;
  onFinish: () => void;
}

const LAYOUTS: { id: BoardLayout; label: string; icon: typeof LayoutGrid }[] = [
  { id: "grid", label: "Grid board", icon: LayoutGrid },
  { id: "filmstrip", label: "Filmstrip", icon: Film },
  { id: "comic", label: "Comic pages", icon: PanelsTopLeft },
];

export default function StepCompose({ data, patch, onBack, onFinish }: Props) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const sb: Storyboard = {
    id: "preview",
    title: data.title || "Untitled storyboard",
    thought: data.thought,
    format: data.format,
    style: data.style,
    status: "composed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    analysis: data.analysis,
    scenes: data.scenes,
    exports: 0,
  };

  const doExportPNG = async () => {
    setExporting(true);
    try {
      await exportStoryboardPNG(sb);
    } finally {
      setExporting(false);
    }
  };

  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}#/shared/${sb.title.replace(/\s+/g, "-").toLowerCase()}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => patch({ layout: l.id })}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all",
                data.layout === l.id
                  ? "btn-gradient border-transparent text-white"
                  : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/25"
              )}
            >
              <l.icon className="h-3.5 w-3.5" /> {l.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          Composed from {data.scenes.length} scenes · {data.scenes.reduce((a, s) => a + s.durationSec, 0)}s runtime
        </div>
      </div>

      <StoryboardPreview sb={sb} layout={data.layout} />

      {/* Export & share */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold">
          <Share2 className="h-4 w-4 text-primary" /> Export & share
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={doExportPNG}
            disabled={exporting}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <Download className="h-5 w-5 shrink-0 text-violet-300" />
            <div>
              <div className="text-sm font-bold">{exporting ? "Rendering…" : "Download PNG"}</div>
              <div className="text-xs text-muted-foreground">Print-ready composed board</div>
            </div>
          </button>
          <button
            onClick={() => exportStoryboardJSON(sb)}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            <FileJson className="h-5 w-5 shrink-0 text-cyan-300" />
            <div>
              <div className="text-sm font-bold">Export JSON</div>
              <div className="text-xs text-muted-foreground">Scenes, prompts & analysis</div>
            </div>
          </button>
          <button
            onClick={copyLink}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5"
          >
            {copied ? <Check className="h-5 w-5 shrink-0 text-emerald-400" /> : <Link2 className="h-5 w-5 shrink-0 text-pink-300" />}
            <div>
              <div className="text-sm font-bold">{copied ? "Link copied!" : "Copy share link"}</div>
              <div className="text-xs text-muted-foreground">Read-only viewer link (mock)</div>
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition-colors hover:bg-white/[0.07]">
          <ArrowLeft className="h-4 w-4" /> Back to frames
        </button>
        <button onClick={onFinish} className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white">
          <Rocket className="h-4 w-4" /> Publish to dashboard
        </button>
      </div>
    </div>
  );
}
