"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Full-bleed pixel-art hero background, made from any photo.
 *
 *  1. The photo is mapped to a pixel grid in a blue (left) / red (right)
 *     poster palette. Its own backdrop is detected and recoloured, and any
 *     space beside the photo is filled with the same blue/red backdrop, so
 *     every image gets the split background automatically.
 *  2. Reveal: it starts as a small, very blocky tile, grows until it fills
 *     the whole hero while the pixels refine, then softens and fades its
 *     edges so it settles into the page as if it were the background.
 */

const PALETTE = {
  navy: [16, 44, 68],
  blueDark: [86, 130, 150],
  blueLight: [140, 176, 190],
  redDark: [158, 26, 34],
  red: [200, 38, 44],
  cream: [243, 224, 168],
};

const GROW_MS = 2400; // small → full size, pixels refining
const BLEND_MS = 1400; // full size → blended into the page
const STEPS = [0.07, 0.11, 0.16, 0.23, 0.32, 0.44, 0.6, 0.8, 1];
const START_SCALE = 0.2;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const rgb = ([r, g, b]) => `rgb(${r},${g},${b})`;

function pickColor(lum, xRatio) {
  const left = xRatio < 0.5;
  if (lum < 0.24) return PALETTE.navy;
  if (lum < 0.46) return left ? PALETTE.blueDark : PALETTE.redDark;
  if (lum < 0.74) return left ? PALETTE.blueLight : PALETTE.red;
  return PALETTE.cream;
}

const backdropColor = (xRatio) => (xRatio < 0.5 ? PALETTE.blueLight : PALETTE.red);

/** Square, face-biased crop used only to measure the photo's tones. */
function squareSource(img) {
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - size) / 2;
  const sy = Math.max(0, (img.naturalHeight - size) * 0.3);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
  return canvas;
}

/** Brightness range (adapts to any exposure) and the photo's backdrop colour. */
function measureLevels(source) {
  const ctx = source.getContext("2d", { willReadFrequently: true });
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  const values = [];
  for (let i = 0; i < data.length; i += 16) {
    values.push((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255);
  }
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.04)];
  const hi = values[Math.floor(values.length * 0.96)];

  const band = Math.round(width * 0.06);
  const samples = [];
  for (let y = 0; y < height * 0.7; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (y >= band && x >= band && x < width - band) continue;
      const i = (y * width + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  const mean = [0, 1, 2].map((c) => samples.reduce((sum, px) => sum + px[c], 0) / samples.length);
  const spread = Math.sqrt(
    samples.reduce((sum, px) => sum + (px[0] - mean[0]) ** 2 + (px[1] - mean[1]) ** 2 + (px[2] - mean[2]) ** 2, 0) /
      samples.length
  );

  return {
    lo,
    range: Math.max(0.08, hi - lo),
    bg: mean,
    bgThreshold: spread < 70 ? Math.max(38, spread * 2.2) : 0,
  };
}

/**
 * Lay the photo onto a canvas with the hero's aspect ratio. The whole photo
 * stays visible (contain); the space around it is painted in the photo's own
 * backdrop colour so it reads as one continuous background.
 */
function layoutSource(img, levels, aspect) {
  const h = 256;
  const w = Math.max(64, Math.min(1024, Math.round(h * aspect)));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = rgb(levels.bg.map(Math.round));
  ctx.fillRect(0, 0, w, h);

  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (w - dw) / 2;
  const dy = h - dh; // sit on the bottom edge, like a portrait in frame
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, dw, dh);

  return { canvas, rect: { x0: dx / w, x1: (dx + dw) / w, y0: dy / h, y1: 1 } };
}

/** Cells outside the photo, plus the photo's own backdrop (flood-filled). */
function backgroundMask(data, cols, rows, levels, rect) {
  const mask = new Uint8Array(cols * rows);
  const outside = (x, y) => {
    const fx = (x + 0.5) / cols;
    const fy = (y + 0.5) / rows;
    return fx < rect.x0 || fx > rect.x1 || fy < rect.y0;
  };
  const thr = levels.bgThreshold;
  const [br, bgG, bb] = levels.bg;
  const dist = (i, r, g, b) => Math.sqrt((data[i] - r) ** 2 + (data[i + 1] - g) ** 2 + (data[i + 2] - b) ** 2);

  const accepts = (x, y, fromIdx) => {
    if (outside(x, y)) return true;
    if (!thr) return false;
    const i = (y * cols + x) * 4;
    const dGlobal = dist(i, br, bgG, bb);
    if (dGlobal < thr) return true;
    if (fromIdx < 0 || dGlobal > thr * 2.2) return false;
    const f = fromIdx * 4;
    return dist(i, data[f], data[f + 1], data[f + 2]) < thr * 0.45;
  };

  const queue = [];
  const visit = (x, y, fromIdx) => {
    const idx = y * cols + x;
    if (!mask[idx] && accepts(x, y, fromIdx)) {
      mask[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < cols; x += 1) visit(x, 0, -1);
  for (let y = 0; y < rows; y += 1) {
    visit(0, y, -1);
    visit(cols - 1, y, -1);
  }
  while (queue.length) {
    const idx = queue.pop();
    const x = idx % cols;
    const y = (idx - x) / cols;
    if (x > 0) visit(x - 1, y, idx);
    if (x < cols - 1) visit(x + 1, y, idx);
    if (y > 0) visit(x, y - 1, idx);
    if (y < rows - 1) visit(x, y + 1, idx);
  }
  return mask;
}

function finalCols(width) {
  // Around 14px per pixel on desktop, a little finer on phones.
  const cell = width < 640 ? 10 : 14;
  return Math.max(28, Math.min(120, Math.round(width / cell)));
}

function drawPoster(canvas, layout, levels, cols) {
  const { width: W, height: H } = canvas;
  const rows = Math.max(3, Math.round((cols * H) / W));

  const small = document.createElement("canvas");
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(layout.canvas, 0, 0, cols, rows);
  const { data } = sctx.getImageData(0, 0, cols, rows);
  const bgMask = backgroundMask(data, cols, rows, levels, layout.rect);

  const ctx = canvas.getContext("2d");
  const cw = W / cols;
  const ch = H / rows;
  ctx.clearRect(0, 0, W, H);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const idx = y * cols + x;
      const i = idx * 4;
      const xRatio = (x + 0.5) / cols;
      let color;
      if (bgMask[idx]) {
        color = backdropColor(xRatio);
      } else {
        const raw = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        const lum = Math.min(1, Math.max(0, (raw - levels.lo) / levels.range));
        color = pickColor(lum, xRatio);
      }
      ctx.fillStyle = rgb(color);
      ctx.fillRect(Math.floor(x * cw), Math.floor(y * ch), Math.ceil(cw) + 1, Math.ceil(ch) + 1);
    }
  }

  // Faint bead-board grid.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let n = 1; n < cols; n += 1) {
    const p = Math.round(n * cw) + 0.5;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, H);
  }
  for (let n = 1; n < rows; n += 1) {
    const p = Math.round(n * ch) + 0.5;
    ctx.moveTo(0, p);
    ctx.lineTo(W, p);
  }
  ctx.stroke();
}

/** Edge fade: hard-edged tile while small, soft vignette once blended. */
function maskFor(t) {
  const inner = lerp(55, 38, t);
  const outer = lerp(100, 92, t);
  return `radial-gradient(ellipse 62% 60% at 50% 45%, #000 ${inner}%, transparent ${outer}%)`;
}

export default function PixelPortrait({ src, alt, start = true, className = "" }) {
  const wrapRef = useRef(null);
  const layerRef = useRef(null);
  const canvasRef = useRef(null);
  const prepRef = useRef(null); // { img, levels, layout, aspectKey }
  const stateRef = useRef({ cols: 0, done: false });
  const [status, setStatus] = useState("loading"); // loading | ready | failed

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      try {
        prepRef.current = { img, levels: measureLevels(squareSource(img)), layout: null, aspectKey: "" };
        setStatus("ready");
      } catch {
        setStatus("failed"); // image host without CORS
      }
    };
    img.onerror = () => !cancelled && setStatus("failed");
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    if (status !== "ready" || !start) return;
    const wrap = wrapRef.current;
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const prep = prepRef.current;
    if (!wrap || !layer || !canvas || !prep) return;

    const render = (fraction) => {
      const w = Math.max(1, Math.round(wrap.clientWidth));
      const h = Math.max(1, Math.round(wrap.clientHeight));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const aspectKey = (w / h).toFixed(2);
      if (prep.aspectKey !== aspectKey) {
        prep.layout = layoutSource(prep.img, prep.levels, w / h);
        prep.aspectKey = aspectKey;
      }
      const cols = Math.max(3, Math.round(finalCols(w) * fraction));
      drawPoster(canvas, prep.layout, prep.levels, cols);
      stateRef.current.cols = cols;
    };

    const settle = () => {
      layer.style.transform = "scale(1)";
      layer.style.filter = "none";
      layer.style.opacity = "";
      wrap.style.setProperty("--pixel-mask", maskFor(1));
      wrap.classList.add("is-blended");
      stateRef.current.done = true;
    };

    const observer = new ResizeObserver(() => {
      if (stateRef.current.done) render(1);
    });
    observer.observe(wrap);

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      render(1);
      settle();
      return () => observer.disconnect();
    }

    let frame;
    let lastStep = -1;
    const begin = performance.now();
    const tick = (now) => {
      const elapsed = now - begin;
      const g = Math.min(1, elapsed / GROW_MS);
      const step = Math.min(STEPS.length - 1, Math.floor(g * STEPS.length));
      if (step !== lastStep) {
        render(STEPS[step]);
        lastStep = step;
      }
      const eased = easeOutCubic(g);
      layer.style.transform = `scale(${lerp(START_SCALE, 1, eased)})`;
      layer.style.filter = `blur(${(1 - eased) * 4}px)`;
      const b = easeInOut(Math.min(1, Math.max(0, (elapsed - GROW_MS) / BLEND_MS)));
      const settled = document.documentElement.classList.contains("dark") ? 0.42 : 0.55;
      layer.style.opacity = String(Math.min(1, g * 2) * lerp(1, settled, b));
      wrap.style.setProperty("--pixel-mask", maskFor(b));
      if (elapsed >= GROW_MS) wrap.classList.add("is-blending");

      if (elapsed < GROW_MS + BLEND_MS) frame = requestAnimationFrame(tick);
      else settle();
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [status, start]);

  if (status === "failed") {
    return (
      <div className={`pixel-bg is-blended ${className}`} aria-hidden="true" style={{ "--pixel-mask": maskFor(1) }}>
        <img src={src} alt="" className="pixel-bg__fallback" />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`pixel-bg ${className}`}
      style={{ "--pixel-mask": maskFor(0) }}
    >
      <div ref={layerRef} className="pixel-bg__layer" style={{ transform: `scale(${START_SCALE})`, opacity: 0 }}>
        <canvas ref={canvasRef} role="img" aria-label={alt} className="pixel-bg__canvas" />
      </div>
    </div>
  );
}
