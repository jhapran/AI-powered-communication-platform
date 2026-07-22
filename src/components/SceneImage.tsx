import { useEffect, useRef, useState } from "react";
import { pollinationsImageUrl, sceneFrameDataUrl, sceneImage } from "@/lib/frameArt";
import { fetchAndCacheFrame, getCachedFrameUrl } from "@/lib/imageCache";
import { getImageProvider } from "@/lib/llmClient";
import type { ArtStyle, Scene } from "@/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Scene frame <img> that respects Pollinations' free-tier limit of   */
/*  ~1 concurrent request per IP. Remote loads are serialized through  */
/*  a module-level queue; fetched frames are persisted in CacheStorage */
/*  so revisiting the app doesn't re-download them. Failures are       */
/*  retried with backoff and ultimately fall back to the local         */
/*  procedural SVG frame so a storyboard never shows broken images.    */
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
      holdsSlot.current = true;
      const url = pollinationsImageUrl(scene, style);
      const remoteUrl = attempt.current > 0 ? `${url}&retry=${attempt.current}` : url;
      fetchAndCacheFrame(remoteUrl)
        .then((objectUrl) => {
          if (cancelled.current) {
            URL.revokeObjectURL(objectUrl);
            releaseSlot();
            return;
          }
          setSrc(objectUrl); // slot released by <img> onLoad
        })
        .catch(() => {
          if (cancelled.current) {
            releaseSlot();
            return;
          }
          // Fetch failed (e.g. rate-limited) — let the <img> try the URL
          // directly; its onError drives the retry/fallback path below.
          setSrc(remoteUrl);
        });
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
    setSrc(null);
    // Persistent cache first — avoids re-downloading frames on every app start.
    getCachedFrameUrl(pollinationsImageUrl(scene, style)).then((cached) => {
      if (cancelled.current) return;
      if (cached) setSrc(cached);
      else enqueue();
    });
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
