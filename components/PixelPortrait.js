"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Turns a normal photo into a pixel-art "poster" portrait:
 *  - the photo is sampled down to a coarse grid of square cells
 *  - each cell is mapped to a 4-tone poster palette by brightness
 *  - mid tones are split blue (left) / red (right), so the photo's own
 *    background dissolves into the same split backdrop as the figure
 *
 * Reveal: the tile starts small, transparent and very blocky, then grows to
 * its full size while the pixel grid refines to its final resolution.
 */

const PALETTE = {
  navy: [16, 44, 68],
  blueDark: [86, 130, 150],
  blueLight: [140, 176, 190],
  redDark: [158, 26, 34],
  red: [200, 38, 44],
  cream: [243, 224, 168],
};

const FINAL_CELLS = 44; // pixels across the finished portrait
const STEPS = [5, 8, 12, 17, 23, 30, 37, FINAL_CELLS];
const DURATION = 2400; // ms
const RENDER_SIZE = 480; // backing canvas resolution (2x for retina)

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function rgb([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

function pickColor(lum, xRatio) {
  const left = xRatio < 0.52;
  if (lum < 0.24) return PALETTE.navy;
  if (lum < 0.46) return left ? PALETTE.blueDark : PALETTE.redDark;
  if (lum < 0.74) return left ? PALETTE.blueLight : PALETTE.red;
  return PALETTE.cream;
}

/** Centre-crop the image into a square and return a canvas we can sample from. */
function squareSource(img) {
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - size) / 2;
  // Bias the crop slightly upwards so faces stay in frame on tall photos.
  const sy = Math.max(0, (img.naturalHeight - size) * 0.3);
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
  return canvas;
}

/**
 * Brightness percentiles (so tones adapt to any photo's exposure) plus an
 * estimate of the backdrop colour, sampled from the top and side edges.
 */
function measureLevels(source) {
  const ctx = source.getContext("2d");
  const { width, height } = source;
  const { data } = ctx.getImageData(0, 0, width, height);
  const values = [];
  for (let i = 0; i < data.length; i += 16) {
    values.push((0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255);
  }
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.04)];
  const hi = values[Math.floor(values.length * 0.96)];

  // Edge ring: top band + left/right bands down to 70% height (skip shoulders).
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
    // A busy backdrop (high spread) gets no special treatment.
    bgThreshold: spread < 70 ? Math.max(38, spread * 2.2) : 0,
  };
}

/**
 * Flood-fill from the edges over cells that look like the backdrop. Growth
 * follows gradual drift (vignettes, gradient walls): a cell joins if it is
 * close to the edge colour, or close to the backdrop cell it grows from while
 * staying within a looser global limit.
 */
function backgroundMask(data, cells, levels) {
  const mask = new Uint8Array(cells * cells);
  if (!levels.bgThreshold) return mask;
  const thr = levels.bgThreshold;
  const dist = (i, r, g, b) => Math.sqrt((data[i] - r) ** 2 + (data[i + 1] - g) ** 2 + (data[i + 2] - b) ** 2);
  const [br, bgG, bb] = levels.bg;

  const accepts = (idx, fromIdx) => {
    const i = idx * 4;
    const dGlobal = dist(i, br, bgG, bb);
    if (dGlobal < thr) return true;
    if (fromIdx < 0 || dGlobal > thr * 2.2) return false;
    const f = fromIdx * 4;
    return dist(i, data[f], data[f + 1], data[f + 2]) < thr * 0.45;
  };

  const queue = [];
  const visit = (x, y, fromIdx) => {
    const idx = y * cells + x;
    if (!mask[idx] && accepts(idx, fromIdx)) {
      mask[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < cells; x += 1) visit(x, 0, -1);
  for (let y = 0; y < cells; y += 1) {
    visit(0, y, -1);
    visit(cells - 1, y, -1);
  }
  while (queue.length) {
    const idx = queue.pop();
    const x = idx % cells;
    const y = (idx - x) / cells;
    if (x > 0) visit(x - 1, y, idx);
    if (x < cells - 1) visit(x + 1, y, idx);
    if (y > 0) visit(x, y - 1, idx);
    if (y < cells - 1) visit(x, y + 1, idx);
  }
  return mask;
}

function drawPoster(target, source, levels, cells) {
  const small = document.createElement("canvas");
  small.width = cells;
  small.height = cells;
  const sctx = small.getContext("2d", { willReadFrequently: true });
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(source, 0, 0, cells, cells);
  const { data } = sctx.getImageData(0, 0, cells, cells);
  const bgMask = backgroundMask(data, cells, levels);

  const ctx = target.getContext("2d");
  const cell = RENDER_SIZE / cells;
  ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const idx = y * cells + x;
      const i = idx * 4;
      const xRatio = (x + 0.5) / cells;
      if (bgMask[idx]) {
        // Backdrop: flat split poster background (blue left, red right).
        ctx.fillStyle = rgb(xRatio < 0.52 ? PALETTE.blueLight : PALETTE.red);
        ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
        continue;
      }
      const raw = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      const lum = Math.min(1, Math.max(0, (raw - levels.lo) / levels.range));
      ctx.fillStyle = rgb(pickColor(lum, xRatio));
      // Overlap by a hair so no seams appear between cells.
      ctx.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell) + 1, Math.ceil(cell) + 1);
    }
  }

  // Faint pixel grid, like a bead / cross-stitch board.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.09)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let n = 1; n < cells; n += 1) {
    const p = Math.round(n * cell) + 0.5;
    ctx.moveTo(p, 0);
    ctx.lineTo(p, RENDER_SIZE);
    ctx.moveTo(0, p);
    ctx.lineTo(RENDER_SIZE, p);
  }
  ctx.stroke();
}

export default function PixelPortrait({ src, alt, start = true, className = "" }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const sourceRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | failed

  // Load + prepare the photo once.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      try {
        const source = squareSource(img);
        sourceRef.current = { source, levels: measureLevels(source) };
        setStatus("ready");
      } catch {
        // Canvas is tainted (image host without CORS) – fall back gracefully.
        setStatus("failed");
      }
    };
    img.onerror = () => !cancelled && setStatus("failed");
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  // Run the reveal once the photo is ready and the page says "go".
  useEffect(() => {
    if (status !== "ready" || !start) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const prepared = sourceRef.current;
    if (!canvas || !wrap || !prepared) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      drawPoster(canvas, prepared.source, prepared.levels, FINAL_CELLS);
      wrap.style.transform = "scale(1)";
      wrap.style.opacity = "1";
      return;
    }

    let frame;
    let lastCells = 0;
    const begin = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - begin) / DURATION);
      const eased = easeOutCubic(t);

      const stepIndex = Math.min(STEPS.length - 1, Math.floor(t * STEPS.length));
      const cells = STEPS[stepIndex];
      if (cells !== lastCells) {
        drawPoster(canvas, prepared.source, prepared.levels, cells);
        lastCells = cells;
      }

      wrap.style.transform = `scale(${0.28 + 0.72 * eased})`;
      wrap.style.opacity = String(Math.min(1, t * 1.8));
      wrap.style.filter = `blur(${(1 - eased) * 6}px)`;

      if (t < 1) frame = requestAnimationFrame(tick);
      else wrap.style.filter = "none";
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, start]);

  if (status === "failed") {
    return (
      <div className={`pixel-portrait pixel-portrait--fallback ${className}`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`pixel-portrait ${className}`}
      style={{ transform: "scale(0.28)", opacity: 0 }}
    >
      <canvas
        ref={canvasRef}
        width={RENDER_SIZE}
        height={RENDER_SIZE}
        role="img"
        aria-label={alt}
        className="block w-full h-full"
      />
    </div>
  );
}
