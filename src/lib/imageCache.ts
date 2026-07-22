/* ------------------------------------------------------------------ */
/*  Persistent frame cache — remote (Pollinations) frames are stored   */
/*  in the browser's CacheStorage so storyboards don't re-download     */
/*  their images on every app start. Caching is best-effort: when      */
/*  CacheStorage is unavailable or full, callers just get a cache      */
/*  miss and fall back to a normal network load.                       */
/* ------------------------------------------------------------------ */

const CACHE_NAME = "expressa-frames-v1";

// Retry URLs are cache-busted with &retry=N, so a frame may have been
// stored under one of those variants instead of the base URL.
function variants(url: string): string[] {
  return [url, `${url}&retry=1`, `${url}&retry=2`];
}

/** Object URL for a previously cached frame, or null on a cache miss. */
export async function getCachedFrameUrl(url: string): Promise<string | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const key of variants(url)) {
      const res = await cache.match(key);
      if (res) return URL.createObjectURL(await res.blob());
    }
  } catch {
    /* cache unavailable — treat as a miss */
  }
  return null;
}

/** Fetch a remote frame, persist it in CacheStorage, return an object URL. */
export async function fetchAndCacheFrame(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`frame fetch failed: ${res.status}`);
  const blob = await res.blob();
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(url, new Response(blob, { headers: { "Content-Type": blob.type || "image/jpeg" } }));
    } catch {
      /* quota exceeded or storage unavailable — caching is best-effort */
    }
  }
  return URL.createObjectURL(blob);
}
