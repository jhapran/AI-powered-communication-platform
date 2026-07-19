import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";

export function Phase2Header({
  icon: Icon,
  title,
  subtitle,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  phase: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="btn-gradient flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
              {phase}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function CapabilityCard({
  icon: Icon,
  title,
  desc,
  locked = true,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  locked?: boolean;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      {locked && (
        <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/40 p-1.5">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <div className="mb-3 inline-flex rounded-lg border border-violet-400/20 bg-violet-400/10 p-2">
        <Icon className="h-4 w-4 text-violet-300" />
      </div>
      <div className="text-sm font-bold">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

export function Phase2Notice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-400/5 p-5 text-sm leading-relaxed text-cyan-100/80">
      {text}
    </div>
  );
}
