import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import SceneImage from "@/components/SceneImage";
import { speakScene, stopVoiceover } from "@/lib/voiceover";
import { startMusic, stopMusic } from "@/lib/soundtrack";
import type { Storyboard } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  sb: Storyboard;
  onClose: () => void;
}

export default function AnimaticPlayer({ sb, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [voiceDone, setVoiceDone] = useState(true); // has the current scene's narration finished?
  const [elapsed, setElapsed] = useState(0); // seconds within current scene
  const total = sb.scenes.reduce((a, s) => a + s.durationSec, 0);
  const scene = sb.scenes[index];
  const raf = useRef<number | undefined>(undefined);
  const voiceDoneRef = useRef(true);
  const voiceSeq = useRef(0);

  useEffect(() => {
    voiceDoneRef.current = voiceDone;
  }, [voiceDone]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setElapsed((e) => {
        const next = e + dt;
        // a frame only ends when BOTH its minimum duration has passed
        // AND its voice-over has finished playing
        if (next >= scene.durationSec && voiceDoneRef.current) {
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

  // Voice-over narration follows the current scene; the frame is held
  // until the narration has finished playing.
  useEffect(() => {
    const seq = ++voiceSeq.current;
    if (playing && voiceOn) {
      setVoiceDone(false);
      void speakScene(scene.narration)
        .catch(() => {
          /* narration failed — keep the animatic moving */
        })
        .then(() => {
          if (voiceSeq.current === seq) setVoiceDone(true);
        });
    } else {
      stopVoiceover();
      setVoiceDone(true);
    }
  }, [index, playing, voiceOn, scene.narration]);

  // Generative soundtrack follows the scene's emotion
  useEffect(() => {
    if (playing && musicOn) startMusic(scene.emotion);
    else stopMusic();
  }, [playing, musicOn, index, scene.emotion]);

  // Silence everything when the player closes
  useEffect(
    () => () => {
      stopVoiceover();
      stopMusic();
    },
    []
  );

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
            <SceneImage
              key={s.id}
              scene={s}
              style={sb.style}
              index={i}
              alt={s.title}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
                i === index ? "opacity-100" : "opacity-0"
              )}
              imgStyle={i === index ? { transform: `scale(${1 + (elapsed / s.durationSec) * 0.06})`, transition: "transform 0.2s linear, opacity 0.7s" } : {}}
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
            <button
              onClick={() => setVoiceOn((v) => !v)}
              title={voiceOn ? "Mute voice-over" : "Enable voice-over"}
              className={cn("rounded-lg p-2 transition-colors hover:bg-white/10", voiceOn ? "text-primary" : "text-muted-foreground/40")}
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setMusicOn((m) => !m)}
              title={musicOn ? "Mute soundtrack" : "Enable soundtrack"}
              className={cn("rounded-lg p-2 transition-colors hover:bg-white/10", musicOn ? "text-primary" : "text-muted-foreground/40")}
            >
              <Music className="h-4 w-4" />
            </button>
            <div className="flex flex-1 items-center gap-1.5">
              {sb.scenes.map((s, i) => (
                <button key={s.id} onClick={() => jump(i)} className="group relative h-2 flex-1 overflow-hidden rounded-full bg-white/10" title={s.title}>
                  <div
                    className="btn-gradient h-full rounded-full"
                    style={{ width: i < index ? "100%" : i === index ? `${Math.min(100, (elapsed / s.durationSec) * 100)}%` : "0%" }}
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
