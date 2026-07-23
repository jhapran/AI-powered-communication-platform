import { useEffect, useRef, useState } from "react";
import { pollinationsImageUrl, sceneFrameDataUrl, sceneImage } from "@/lib/frameArt";
import { getImageProvider } from "@/lib/llmClient";
import type { ArtStyle, Scene } from "@/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Scene frame <img> that respects Pollinations' free-tier limit of   */
/*  ~1 concurrent request per IP. Remote loads are serialized through  */
/*  a module-level queue; failures are retried with backoff and        */
/*  ultimately fall back to the local procedural SVG frame so a        */
/*  storyboard never shows broken images. Frames are plain <img>       */
/*  loads on purpose: Pollinations blocks fetch()/CORS for anonymous   */
/*  callers, and its responses carry `cache-control: immutable`, so    */
/*  the browser's own HTTP cache persists them across app restarts.    */
/* ------------------------------------------------------------------ */

const queue: Array<() => void> = [];
let inFlight = false;

function pump() {
  if (inFlight) return;
  const job = queue.shift();
  if (!job) return;
  inFlight = true;
  job();
}

function release() {
  inFlight = false;
  // small gap between requests to stay under the rate limit
  setTimeout(pump, 700);
}

const MAX_RETRIES = 2;

interface Props {
  scene: Scene;
  style: ArtStyle;
  index: number;
  alt?: string;
  className?: string;
  imgStyle?: React.CSSProperties;
}

export default function SceneImage({ scene, style, index, alt, className, imgStyle }: Props) {
  const useRemote = !scene.imageUrl && getImageProvider() === "pollinations";
  const [src, setSrc] = useState<string | null>(useRemote ? null : sceneImage(scene, style, index));
  const holdsSlot = useRef(false);
  const attempt = useRef(0);
  const cancelled = useRef(false);
  // last URL this instance asked the <img> to load — a duplicate queue job
  // for the same URL must NOT call setSrc again: React would bail out of
  // the identical update, no onLoad would fire, and its queue slot would
  // never be released (deadlocking every frame behind it).
  const requestedUrl = useRef<string | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const releaseSlot = () => {
    if (holdsSlot.current) {
      holdsSlot.current = false;
      release();
    }
  };

  const enqueue = () => {
    queue.push(() => {
      if (cancelled.current) {
        release();
        return;
      }
      const url = pollinationsImageUrl(scene, style);
      const remoteUrl = attempt.current > 0 ? `${url}&retry=${attempt.current}` : url;
      if (requestedUrl.current === remoteUrl) {
        release();
        return;
      }
      requestedUrl.current = remoteUrl;
      holdsSlot.current = true;
      setSrc(remoteUrl);
    });
    pump();
  };

  useEffect(() => {
    cancelled.current = false;
    if (!useRemote) {
      setSrc(sceneImage(scene, style, index));
      return;
    }
    attempt.current = 0;
    requestedUrl.current = null;
    setSrc(null);
    enqueue();
    return () => {
      cancelled.current = true;
      clearTimeout(retryTimer.current);
      releaseSlot();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRemote, scene, style, index]);

  if (!src) {
    return <div className={cn("shimmer bg-white/[0.06]", className)} style={imgStyle} />;
  }
  return (
    <img
      src={src}
      alt={alt ?? scene.title}
      className={className}
      style={imgStyle}
      onLoad={releaseSlot}
      onError={() => {
        releaseSlot();
        if (cancelled.current) return;
        if (attempt.current < MAX_RETRIES) {
          attempt.current += 1;
          retryTimer.current = setTimeout(enqueue, 2500 * attempt.current);
        } else {
          // give up on the remote service — local frame always renders
          setSrc(sceneFrameDataUrl(scene, style, index + 1));
        }
      }}
    />
  );
}
