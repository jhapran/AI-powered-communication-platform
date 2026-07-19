import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { sceneImage } from "@/lib/frameArt";
import type { Storyboard } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  sb: Storyboard;
  onClose: () => void;
}

export default function AnimaticPlayer({ sb, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0); // seconds within current scene
  const total = sb.scenes.reduce((a, s) => a + s.durationSec, 0);
  const scene = sb.scenes[index];
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setElapsed((e) => {
        const next = e + dt;
        if (next >= scene.durationSec) {
          if (index < sb.scenes.length - 1) {
            setIndex(index + 1);
            return 0;
          }
          setPlaying(false);
          return scene.durationSec;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current!);
  }, [playing, index, scene.durationSec, sb.scenes.length]);

  const jump = (i: number) => {
    setIndex(Math.max(0, Math.min(sb.scenes.length - 1, i)));
    setElapsed(0);
  };

  const elapsedTotal = sb.scenes.slice(0, index).reduce((a, s) => a + s.durationSec, 0) + elapsed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d1c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{sb.title} — animatic preview</div>
            <div className="text-[11px] text-muted-foreground">
              Scene {index + 1}/{sb.scenes.length} · {scene.cameraAngle} · {scene.transition} transition
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-[3/2] max-h-[60vh] w-full overflow-hidden bg-black">
          {sb.scenes.map((s, i) => (
            <img
              key={s.id}
              src={sceneImage(s, sb.style, i)}
              alt={s.title}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                i === index ? "opacity-100" : "opacity-0"
              )}
              style={i === index ? { transform: `scale(${1 + (elapsed / s.durationSec) * 0.06})`, transition: "transform 0.2s linear, opacity 0.7s" } : {}}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-16">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
              {String(index + 1).padStart(2, "0")} · {scene.title}
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-white">{scene.narration}</p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => jump(index - 1)} className="rounded-lg p-2 hover:bg-white/10">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                if (!playing && index === sb.scenes.length - 1 && elapsed >= scene.durationSec) {
                  jump(0);
                }
                setPlaying(!playing);
              }}
              className="btn-gradient rounded-full p-3 text-white"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
            </button>
            <button onClick={() => jump(index + 1)} className="rounded-lg p-2 hover:bg-white/10">
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center gap-1.5">
              {sb.scenes.map((s, i) => (
                <button key={s.id} onClick={() => jump(i)} className="group relative h-2 flex-1 overflow-hidden rounded-full bg-white/10" title={s.title}>
                  <div
                    className="btn-gradient h-full rounded-full"
                    style={{ width: i < index ? "100%" : i === index ? `${(elapsed / s.durationSec) * 100}%` : "0%" }}
                  />
                </button>
              ))}
            </div>
            <span className="w-20 text-right text-xs font-semibold tabular-nums text-muted-foreground">
              {elapsedTotal.toFixed(1)}s / {total}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
