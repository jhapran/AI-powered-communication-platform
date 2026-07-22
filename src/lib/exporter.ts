import type { Storyboard } from "@/types";
import { sceneFrameDataUrl, sceneImage } from "./frameArt";
import { getCachedFrameUrl } from "./imageCache";
import { getImageProvider } from "./llmClient";
import { INTENT_LABEL } from "./aiEngine";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Pollinations' free tier rate-limits concurrent requests, so frames are
// fetched one at a time; a frame that fails remotely falls back to the
// local procedural SVG so the export always completes.
async function loadSceneImage(sb: Storyboard, i: number): Promise<HTMLImageElement> {
  const s = sb.scenes[i];
  const remote = !s.imageUrl && getImageProvider() === "pollinations";
  let candidates: string[];
  if (remote) {
    const url = sceneImage(s, sb.style, i);
    const cached = await getCachedFrameUrl(url);
    candidates = [...(cached ? [cached] : []), url, `${url}&retry=1`, sceneFrameDataUrl(s, sb.style, i + 1)];
  } else {
    candidates = [sceneImage(s, sb.style, i)];
  }
  let lastErr: unknown;
  for (const url of candidates) {
    try {
      return await loadImage(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function exportStoryboardPNG(sb: Storyboard): Promise<void> {
  const cols = 2;
  const rows = Math.ceil(sb.scenes.length / cols);
  const margin = 64;
  const gap = 36;
  const W = 1600;
  const headerH = 210;
  const footerH = 90;
  const frameW = (W - margin * 2 - gap * (cols - 1)) / cols;
  const frameH = Math.round(frameW * 0.62);
  const captionH = 118;
  const cellH = frameH + captionH;
  const H = headerH + rows * cellH + (rows - 1) * gap + footerH + margin;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0d1c");
  bg.addColorStop(1, "#141032");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.fillStyle = "#a78bfa";
  ctx.font = "700 26px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("EXPRESSA · AI STORYBOARD", margin, 78);
  ctx.fillStyle = "#f4f4f8";
  ctx.font = "800 52px ui-sans-serif, system-ui, sans-serif";
  const titleLines = wrapText(ctx, sb.title, W - margin * 2).slice(0, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, margin, 136 + i * 58));
  ctx.fillStyle = "#9ca3c0";
  ctx.font = "500 24px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(
    `${sb.scenes.length} scenes · ${sb.analysis ? INTENT_LABEL[sb.analysis.intent] : "Story"} · ${sb.style} style`,
    margin,
    headerH - 12
  );

  // frames (sequential — see loadSceneImage)
  const imgs: HTMLImageElement[] = [];
  for (let i = 0; i < sb.scenes.length; i++) {
    imgs.push(await loadSceneImage(sb, i));
  }
  for (let i = 0; i < sb.scenes.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (frameW + gap);
    const y = headerH + row * (cellH + gap);
    const img = imgs[i];

    // frame image (cover)
    const scale = Math.max(frameW / img.width, frameH / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.save();
    ctx.beginPath();
    const r = 22;
    ctx.roundRect(x, y, frameW, frameH, r);
    ctx.clip();
    ctx.drawImage(img, x + (frameW - dw) / 2, y + (frameH - dh) / 2, dw, dh);
    ctx.restore();

    // border
    ctx.strokeStyle = "rgba(167,139,250,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, frameW, frameH, r);
    ctx.stroke();

    // caption
    ctx.fillStyle = "#a78bfa";
    ctx.font = "700 22px ui-sans-serif, system-ui, sans-serif";
    ctx.fillText(`${String(i + 1).padStart(2, "0")} · ${sb.scenes[i].title}`, x + 4, y + frameH + 36);
    ctx.fillStyle = "#c7c9dc";
    ctx.font = "400 21px ui-sans-serif, system-ui, sans-serif";
    wrapText(ctx, sb.scenes[i].narration, frameW - 8)
      .slice(0, 3)
      .forEach((l, li) => ctx.fillText(l, x + 4, y + frameH + 68 + li * 26));
  }

  // footer
  ctx.fillStyle = "#6b6f8c";
  ctx.font = "500 20px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("Made with Expressa — turn thoughts into visual stories", margin, H - 40);
  ctx.textAlign = "right";
  ctx.fillText(new Date(sb.updatedAt).toLocaleDateString(), W - margin, H - 40);
  ctx.textAlign = "left";

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sb.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-storyboard.png`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStoryboardJSON(sb: Storyboard): void {
  const payload = {
    id: sb.id,
    title: sb.title,
    format: sb.format,
    style: sb.style,
    status: sb.status,
    sourceThought: sb.thought,
    analysis: sb.analysis,
    scenes: sb.scenes.map((s, i) => ({
      order: i + 1,
      title: s.title,
      narration: s.narration,
      visualPrompt: s.visualPrompt,
      cameraAngle: s.cameraAngle,
      transition: s.transition,
      durationSec: s.durationSec,
      emotion: s.emotion,
    })),
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sb.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-storyboard.json`;
  a.click();
  URL.revokeObjectURL(url);
}
