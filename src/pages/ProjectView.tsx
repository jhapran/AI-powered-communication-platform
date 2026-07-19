import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, Check, Download, FileJson, Link2, Play, Target, Trash2, Users, Wand2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import StoryboardPreview, { type BoardLayout } from "@/components/StoryboardPreview";
import AnimaticPlayer from "@/components/AnimaticPlayer";
import { exportStoryboardJSON, exportStoryboardPNG } from "@/lib/exporter";
import { INTENT_LABEL } from "@/lib/aiEngine";
import { STATUS_LABEL } from "@/types";
import { cn } from "@/lib/utils";

export default function ProjectView() {
  const { id } = useParams();
  const { getProject, deleteProject, saveProject } = useApp();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<BoardLayout>("grid");
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const sb = id ? getProject(id) : undefined;
  if (!sb) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-muted-foreground">Storyboard not found.</p>
        <button onClick={() => navigate("/")} className="btn-gradient rounded-xl px-5 py-2.5 text-sm font-bold text-white">
          Back to dashboard
        </button>
      </div>
    );
  }

  const a = sb.analysis;
  const runtime = sb.scenes.reduce((x, s) => x + s.durationSec, 0);

  const doExport = async () => {
    setExporting(true);
    try {
      await exportStoryboardPNG(sb);
      saveProject({ ...sb, exports: sb.exports + 1, updatedAt: Date.now() });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </button>

      {/* Header */}
      <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                {STATUS_LABEL[sb.status]}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {sb.format} · {sb.style}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{sb.title}</h1>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{sb.thought}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPlaying(true)}
              className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            >
              <Play className="h-4 w-4" /> Play animatic
            </button>
          </div>
        </div>

        {a && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <Target className="h-4 w-4 shrink-0 text-violet-300" />
              <div>
                <div className="text-xs text-muted-foreground">Intent</div>
                <div className="text-sm font-bold">{INTENT_LABEL[a.intent]} · {Math.round(a.intentConfidence * 100)}%</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <Users className="h-4 w-4 shrink-0 text-cyan-300" />
              <div>
                <div className="text-xs text-muted-foreground">Audience</div>
                <div className="text-sm font-bold">{a.audience}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <Wand2 className="h-4 w-4 shrink-0 text-pink-300" />
              <div>
                <div className="text-xs text-muted-foreground">Tone</div>
                <div className="text-sm font-bold">{a.tone}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(["grid", "filmstrip", "comic"] as BoardLayout[]).map((l) => (
            <button
              key={l}
              onClick={() => setLayout(l)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold capitalize transition-all",
                layout === l ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={doExport} disabled={exporting} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold transition-colors hover:border-primary/40">
            <Download className="h-3.5 w-3.5" /> {exporting ? "Rendering…" : "PNG"}
          </button>
          <button onClick={() => exportStoryboardJSON(sb)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold transition-colors hover:border-primary/40">
            <FileJson className="h-3.5 w-3.5" /> JSON
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`${location.origin}${location.pathname}#/shared/${sb.id}`);
              } catch { /* ignore */ }
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold transition-colors hover:border-primary/40"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />} {copied ? "Copied" : "Share"}
          </button>
          {!sb.isDemo && (
            <button
              onClick={() => {
                deleteProject(sb.id);
                navigate("/");
              }}
              className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-2.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-400/15"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      <StoryboardPreview sb={sb} layout={layout} />

      <div className="text-center text-xs text-muted-foreground">
        {sb.scenes.length} scenes · {runtime}s runtime · created {new Date(sb.createdAt).toLocaleDateString()} · exported {sb.exports}×
      </div>

      {playing && <AnimaticPlayer sb={sb} onClose={() => setPlaying(false)} />}
    </div>
  );
}
