import { useNavigate } from "react-router";
import {
  Clapperboard, Image as ImageIcon, Download, Layers, Plus, ArrowRight,
  CheckCircle2, Circle, Loader, Film,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { SAMPLE_THOUGHTS } from "@/lib/aiEngine";
import { sceneImage } from "@/lib/frameArt";
import { STATUS_LABEL, type StoryboardStatus } from "@/types";

const STATUS_STYLE: Record<StoryboardStatus, string> = {
  draft: "border-white/15 bg-white/5 text-muted-foreground",
  analyzed: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  outline: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  generated: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  composed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const ROADMAP = [
  { phase: 1, label: "Auth · Dashboard · Storyboard generation", state: "done" },
  { phase: 2, label: "Image generation", state: "done" },
  { phase: 3, label: "Avatar creation", state: "next" },
  { phase: 4, label: "Video generation", state: "next" },
  { phase: 5, label: "Voice cloning (with consent)", state: "future" },
  { phase: 6, label: "Sharing & collaboration", state: "future" },
];

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 3600_000) return `${Math.max(1, Math.round(d / 60_000))}m ago`;
  if (d < 86400_000) return `${Math.round(d / 3600_000)}h ago`;
  return `${Math.round(d / 86400_000)}d ago`;
}

export default function Dashboard() {
  const { user, projects, setDraftThought } = useApp();
  const navigate = useNavigate();

  const sceneCount = projects.reduce((a, p) => a + p.scenes.length, 0);
  const exportCount = projects.reduce((a, p) => a + p.exports, 0);
  const composed = projects.filter((p) => p.status === "composed").length;

  const stats = [
    { icon: Clapperboard, label: "Storyboards", value: projects.length, tint: "text-violet-300 bg-violet-400/10 border-violet-400/20" },
    { icon: Layers, label: "Scenes planned", value: sceneCount, tint: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20" },
    { icon: ImageIcon, label: "Frames generated", value: projects.filter(p => ["generated","composed"].includes(p.status)).reduce((a,p)=>a+p.scenes.length,0), tint: "text-pink-300 bg-pink-400/10 border-pink-400/20" },
    { icon: Download, label: "Exports", value: exportCount, tint: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  ];

  const startSample = (text: string) => {
    setDraftThought(text);
    navigate("/create");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "creator"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {composed} of {projects.length} storyboards ready to share · your visual studio is warmed up
          </p>
        </div>
        <button
          onClick={() => navigate("/create")}
          className="btn-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
        >
          <Plus className="h-4 w-4" /> New storyboard
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="anim-fade-slide-up glass rounded-2xl p-5" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={`mb-3 inline-flex rounded-lg border p-2 ${s.tint}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="text-3xl font-extrabold tracking-tight">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick start */}
      <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px]" />
        <h2 className="mb-1 text-lg font-bold">Start from a spark</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Pick a sample thought and watch the AI pipeline turn it into a storyboard — or write your own.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {SAMPLE_THOUGHTS.map((s) => (
            <button
              key={s.id}
              onClick={() => startSample(s.text)}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/50 hover:bg-primary/10"
            >
              {s.label}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          ))}
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Plus className="h-3.5 w-3.5" /> Write my own thought
          </button>
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your storyboards</h2>
          <span className="text-xs text-muted-foreground">{projects.length} projects</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <button
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="anim-fade-slide-up group overflow-hidden rounded-2xl border border-white/10 bg-card text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative aspect-[3/2] overflow-hidden bg-black/40">
                <img
                  src={sceneImage(p.scenes[0], p.style, 0)}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${STATUS_STYLE[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
                {p.isDemo && (
                  <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md">
                    Demo
                  </span>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-white/80">
                  <Film className="h-3.5 w-3.5" /> {p.scenes.length} scenes · {p.style}
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-1 line-clamp-1 font-bold leading-snug">{p.title}</h3>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.thought}</p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Updated {timeAgo(p.updatedAt)}</span>
                  <span className="flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">MVP development plan</h2>
            <p className="text-sm text-muted-foreground">Storyboard workflow first — avatars, video and voice follow validation.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROADMAP.map((r) => (
            <div
              key={r.phase}
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                r.state === "done"
                  ? "border-emerald-400/20 bg-emerald-400/5"
                  : r.state === "next"
                    ? "border-cyan-400/20 bg-cyan-400/5"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {r.state === "done" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : r.state === "next" ? (
                <Loader className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phase {r.phase}</div>
                <div className="text-sm font-medium leading-snug">{r.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
