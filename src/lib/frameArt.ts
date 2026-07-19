import type { ArtStyle, Scene } from "@/types";
import { mulberry32 } from "./aiEngine";

/* ------------------------------------------------------------------ */
/*  Procedural storyboard frames — deterministic SVG concept art per   */
/*  scene, driven by emotion palette + camera angle + art style.       */
/* ------------------------------------------------------------------ */

const PALETTES: Record<string, { sky: [string, string]; hills: [string, string]; accent: string; ink: string }> = {
  Joy: { sky: ["#fef3c7", "#fcd34d"], hills: ["#f59e0b", "#b45309"], accent: "#ef4444", ink: "#451a03" },
  Curiosity: { sky: ["#cffafe", "#67e8f9"], hills: ["#0ea5e9", "#075985"], accent: "#8b5cf6", ink: "#082f49" },
  Calm: { sky: ["#d1fae5", "#a7f3d0"], hills: ["#34d399", "#047857"], accent: "#60a5fa", ink: "#022c22" },
  Excitement: { sky: ["#fce7f3", "#f9a8d4"], hills: ["#ec4899", "#9d174d"], accent: "#fbbf24", ink: "#500724" },
  Trust: { sky: ["#e0e7ff", "#c7d2fe"], hills: ["#6366f1", "#3730a3"], accent: "#22d3ee", ink: "#1e1b4b" },
  Hope: { sky: ["#f3e8ff", "#e9d5ff"], hills: ["#a855f7", "#6b21a8"], accent: "#f472b6", ink: "#3b0764" },
};

function person(x: number, y: number, s: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${color}">
    <circle cx="0" cy="-46" r="16"/>
    <rect x="-15" y="-30" width="30" height="52" rx="14"/>
    <rect x="-26" y="-26" width="10" height="36" rx="5" transform="rotate(12 -21 -8)"/>
    <rect x="16" y="-26" width="10" height="36" rx="5" transform="rotate(-12 21 -8)"/>
  </g>`;
}

function star(cx: number, cy: number, r: number, color: string, opacity = 1): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rad * Math.cos(ang)).toFixed(1)},${(cy + rad * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}" fill="${color}" opacity="${opacity}"/>`;
}

export function sceneFrameSVG(scene: Scene, style: ArtStyle, sceneNumber: number): string {
  const W = 1200;
  const H = 800;
  const rand = mulberry32(scene.seed + style.length * 7919);
  const pal = PALETTES[scene.emotion] ?? PALETTES.Curiosity;
  const id = `g${scene.seed % 100000}${sceneNumber}`;
  const parts: string[] = [];

  const defs = `<defs>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.sky[0]}"/><stop offset="100%" stop-color="${pal.sky[1]}"/>
    </linearGradient>
    <linearGradient id="hill${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.hills[0]}"/><stop offset="100%" stop-color="${pal.hills[1]}"/>
    </linearGradient>
    <radialGradient id="glow${id}" cx="0.5" cy="0.4" r="0.7">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft${id}"><feGaussianBlur stdDeviation="18"/></filter>
    <filter id="soft2${id}"><feGaussianBlur stdDeviation="42"/></filter>
    <pattern id="dots${id}" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="2.4" fill="${pal.ink}" opacity="0.16"/>
    </pattern>
  </defs>`;

  /* ---------- background ---------- */
  if (style === "flat") {
    parts.push(`<rect width="${W}" height="${H}" fill="${pal.sky[0]}"/>`);
    parts.push(`<circle cx="${200 + rand() * 800}" cy="${150 + rand() * 200}" r="${90 + rand() * 60}" fill="${pal.sky[1]}"/>`);
  } else {
    parts.push(`<rect width="${W}" height="${H}" fill="url(#sky${id})"/>`);
  }

  const sunX = 150 + rand() * 900;
  const sunY = 100 + rand() * 160;
  if (style !== "comic") {
    parts.push(`<circle cx="${sunX}" cy="${sunY}" r="150" fill="url(#glow${id})"/>`);
    parts.push(`<circle cx="${sunX}" cy="${sunY}" r="${55 + rand() * 25}" fill="#fff7ed" opacity="0.95"/>`);
  } else {
    parts.push(star(sunX, sunY, 90, "#fef08a"));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      parts.push(`<line x1="${sunX + Math.cos(a) * 105}" y1="${sunY + Math.sin(a) * 105}" x2="${sunX + Math.cos(a) * 160}" y2="${sunY + Math.sin(a) * 160}" stroke="${pal.ink}" stroke-width="7" stroke-linecap="round"/>`);
    }
  }

  // clouds
  for (let i = 0; i < 3; i++) {
    const cx = rand() * W;
    const cy = 60 + rand() * 200;
    const s = 0.7 + rand() * 0.9;
    parts.push(`<g transform="translate(${cx} ${cy}) scale(${s})" fill="#ffffff" opacity="${style === "flat" ? 0.9 : 0.65}">
      <ellipse cx="0" cy="0" rx="70" ry="26"/><ellipse cx="45" cy="-14" rx="50" ry="22"/><ellipse cx="-48" cy="-10" rx="46" ry="18"/>
    </g>`);
  }

  /* ---------- composition by camera angle ---------- */
  const angle = scene.cameraAngle;
  if (angle === "Wide shot" || angle === "Over-the-shoulder") {
    // layered hills
    for (let l = 0; l < 3; l++) {
      const yBase = 430 + l * 110;
      const amp = 60 - l * 12;
      let d = `M0 ${H} L0 ${yBase}`;
      for (let x = 0; x <= W; x += 120) d += ` Q ${x + 60} ${yBase - amp - rand() * 40} ${x + 120} ${yBase}`;
      d += ` L${W} ${H} Z`;
      const col = l === 0 ? pal.hills[0] : pal.hills[1];
      parts.push(`<path d="${d}" fill="${col}" opacity="${0.55 + l * 0.2}"/>`);
    }
    if (angle === "Wide shot") {
      parts.push(person(880 + rand() * 120, 640, 1.15, pal.ink));
      parts.push(person(180 + rand() * 80, 680, 0.8, `${pal.ink}cc`));
    } else {
      parts.push(person(300, 760, 2.6, pal.ink));
      parts.push(person(830, 660, 1.2, `${pal.accent}`));
    }
  } else if (angle === "Close-up") {
    parts.push(`<ellipse cx="600" cy="880" rx="520" ry="220" fill="url(#hill${id})"/>`);
    parts.push(`<circle cx="600" cy="330" r="180" fill="${pal.ink}"/>`);
    parts.push(`<circle cx="535" cy="300" r="26" fill="#fff" opacity="0.92"/><circle cx="665" cy="300" r="26" fill="#fff" opacity="0.92"/>`);
    parts.push(`<circle cx="540" cy="304" r="12" fill="${pal.ink}"/><circle cx="660" cy="304" r="12" fill="${pal.ink}"/>`);
    parts.push(`<path d="M540 400 Q600 445 660 400" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/>`);
    parts.push(`<rect x="430" y="500" width="340" height="300" rx="90" fill="${pal.ink}"/>`);
    parts.push(star(920, 180, 46, pal.accent));
  } else if (angle === "Macro") {
    for (let i = 0; i < 14; i++) {
      const r = 26 + rand() * 90;
      const x = rand() * W;
      const y = rand() * H;
      const c = [pal.hills[0], pal.hills[1], pal.accent, "#ffffff"][Math.floor(rand() * 4)];
      parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${0.35 + rand() * 0.5}"/>`);
      if (rand() > 0.5) parts.push(`<circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff" opacity="0.7"/>`);
    }
    parts.push(`<circle cx="600" cy="400" r="200" fill="none" stroke="${pal.ink}" stroke-width="10" opacity="0.5" stroke-dasharray="4 18" stroke-linecap="round"/>`);
  } else if (angle === "Aerial view") {
    parts.push(`<rect width="${W}" height="${H}" fill="${pal.hills[1]}" opacity="0.25"/>`);
    for (let i = 0; i < 6; i++) {
      const y = 80 + i * 120;
      parts.push(`<path d="M0 ${y} C 300 ${y - 60 + rand() * 120}, 900 ${y - 60 + rand() * 120}, ${W} ${y}" stroke="#ffffff" stroke-width="6" opacity="0.45" fill="none" stroke-dasharray="16 14"/>`);
    }
    for (let i = 0; i < 8; i++) {
      const x = 100 + rand() * 1000;
      const y = 100 + rand() * 600;
      const s = 30 + rand() * 40;
      parts.push(`<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="8" fill="${rand() > 0.5 ? pal.hills[0] : pal.accent}" opacity="0.85" transform="rotate(${rand() * 40 - 20} ${x} ${y})"/>`);
    }
    parts.push(person(600, 430, 1.6, pal.ink));
    parts.push(`<circle cx="600" cy="360" r="150" fill="none" stroke="${pal.accent}" stroke-width="8" opacity="0.8"/>`);
  } else {
    // Medium shot
    parts.push(`<path d="M0 ${H} L0 560 Q 300 ${500 + rand() * 60} 600 560 T ${W} 560 L${W} ${H} Z" fill="url(#hill${id})"/>`);
    parts.push(person(470, 620, 1.9, pal.ink));
    parts.push(`<g transform="translate(760 560)"><rect x="-70" y="-110" width="150" height="110" rx="14" fill="${pal.accent}"/><rect x="-70" y="-110" width="150" height="26" rx="13" fill="${pal.ink}" opacity="0.35"/></g>`);
    parts.push(star(880, 320, 38, pal.accent));
  }

  /* ---------- style overlays ---------- */
  if (style === "comic") {
    parts.push(`<rect width="${W}" height="${H}" fill="url(#dots${id})"/>`);
    for (let i = 0; i < 7; i++) {
      const y = 60 + rand() * 300;
      parts.push(`<line x1="${-20}" y1="${y}" x2="${140 + rand() * 120}" y2="${y + 30}" stroke="${pal.ink}" stroke-width="6" opacity="0.5" stroke-linecap="round"/>`);
    }
    parts.push(`<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${pal.ink}" stroke-width="16" rx="6"/>`);
  }
  if (style === "watercolor") {
    for (let i = 0; i < 5; i++) {
      parts.push(`<ellipse cx="${rand() * W}" cy="${rand() * H}" rx="${140 + rand() * 160}" ry="${90 + rand() * 110}" fill="${[pal.hills[0], pal.accent, "#ffffff"][Math.floor(rand() * 3)]}" opacity="0.28" filter="url(#soft2${id})"/>`);
    }
    parts.push(`<rect width="${W}" height="${H}" fill="#fffbeb" opacity="0.12"/>`);
  }
  if (style === "render3d") {
    for (let i = 0; i < 5; i++) {
      const x = 120 + rand() * 960;
      const y = 120 + rand() * 480;
      const s = 36 + rand() * 60;
      parts.push(`<g transform="translate(${x} ${y})">
        <polygon points="0,${-s} ${s * 0.87},${-s / 2} 0,0 ${-s * 0.87},${-s / 2}" fill="#ffffff" opacity="0.85"/>
        <polygon points="0,0 ${s * 0.87},${-s / 2} ${s * 0.87},${s / 2} 0,${s}" fill="${pal.accent}" opacity="0.85"/>
        <polygon points="0,0 ${-s * 0.87},${-s / 2} ${-s * 0.87},${s / 2} 0,${s}" fill="${pal.hills[1]}" opacity="0.9"/>
      </g>`);
    }
    parts.push(`<ellipse cx="600" cy="760" rx="420" ry="60" fill="${pal.ink}" opacity="0.25" filter="url(#soft${id})"/>`);
  }
  if (style === "cinematic") {
    parts.push(`<rect width="${W}" height="${H}" fill="#0c1445" opacity="0.18"/>`);
    parts.push(`<rect width="${W}" height="86" fill="#0b0f1e"/><rect y="${H - 86}" width="${W}" height="86" fill="#0b0f1e"/>`);
    parts.push(`<rect x="30" y="${H - 60}" width="200" height="8" rx="4" fill="#f97316" opacity="0.9"/>`);
  }

  /* ---------- scene badge ---------- */
  parts.push(`<g>
    <rect x="30" y="28" width="118" height="52" rx="26" fill="#0b0f1e" opacity="0.78"/>
    <text x="89" y="62" font-family="ui-sans-serif, system-ui, sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">SC ${String(sceneNumber).padStart(2, "0")}</text>
  </g>`);
  parts.push(`<text x="${W - 34}" y="${H - (style === "cinematic" ? 110 : 34)}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="600" fill="${style === "comic" ? pal.ink : "#ffffff"}" opacity="0.85" text-anchor="end">${scene.cameraAngle}</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${defs}${parts.join("")}</svg>`;
}

export function sceneFrameDataUrl(scene: Scene, style: ArtStyle, sceneNumber: number): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(sceneFrameSVG(scene, style, sceneNumber))}`;
}

export function sceneImage(scene: Scene, style: ArtStyle, index: number): string {
  return scene.imageUrl ?? sceneFrameDataUrl(scene, style, index + 1);
}
