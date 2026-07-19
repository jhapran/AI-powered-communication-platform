import { Clock, ArrowRight } from "lucide-react";
import SceneImage from "@/components/SceneImage";
import { EMOTION_COLORS } from "@/lib/aiEngine";
import type { Storyboard } from "@/types";
import { cn } from "@/lib/utils";

export type BoardLayout = "grid" | "filmstrip" | "comic";

export default function StoryboardPreview({ sb, layout }: { sb: Storyboard; layout: BoardLayout }) {
  if (layout === "filmstrip") {
    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-0">
          {sb.scenes.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="w-72 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <div className="relative">
                  <SceneImage scene={s} style={sb.style} index={i} alt={s.title} className="aspect-[3/2] w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Clock className="h-2.5 w-2.5" /> {s.durationSec}s · {s.transition}
                  </span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold">{s.title}</div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{s.narration}</p>
                </div>
              </div>
              {i < sb.scenes.length - 1 && (
                <div className="flex w-10 items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-primary/60" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "comic") {
    return (
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {sb.scenes.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "mb-5 break-inside-avoid rounded-lg border-[3px] border-white/90 bg-white p-2 shadow-[6px_6px_0_rgba(0,0,0,0.45)]",
              i % 3 === 0 && "-rotate-1",
              i % 3 === 1 && "rotate-1",
              i % 3 === 2 && "-rotate-[0.5deg]"
            )}
          >
            <div className="relative overflow-hidden rounded">
              <SceneImage scene={s} style={sb.style} index={i} alt={s.title} className="w-full object-cover" />
              <span className="absolute left-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                #{i + 1}
              </span>
            </div>
            <div className="p-2">
              <div className="text-sm font-black uppercase tracking-tight text-black">{s.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">{s.narration}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // grid
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {sb.scenes.map((s, i) => (
        <div key={s.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <div className="relative">
            <SceneImage scene={s} style={sb.style} index={i} alt={s.title} className="aspect-[3/2] w-full object-cover" />
            <span className="btn-gradient absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className="absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur-md"
              style={{
                color: EMOTION_COLORS[s.emotion] ?? "#22d3ee",
                borderColor: `${EMOTION_COLORS[s.emotion] ?? "#22d3ee"}55`,
                background: `${EMOTION_COLORS[s.emotion] ?? "#22d3ee"}18`,
              }}
            >
              {s.emotion}
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold">{s.title}</div>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                <Clock className="h-3 w-3" /> {s.durationSec}s
              </div>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.narration}</p>
            <div className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {s.cameraAngle} · {s.transition}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
