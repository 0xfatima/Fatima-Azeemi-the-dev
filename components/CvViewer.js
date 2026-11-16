"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

// pdf.js is loaded straight from the CDN at runtime (pinned version), so it
// isn't bundled and needs no build config.
const PDFJS_VERSION = "4.10.38";
const PDFJS_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build`;

let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* webpackIgnore: true */ `${PDFJS_BASE}/pdf.min.mjs`).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
      return lib;
    });
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }
  return pdfjsPromise;
}

const BLOCKED_KEYS = new Set(["s", "p", "c", "a", "x", "u"]);

/**
 * View-only CV: every page is painted onto a <canvas>, so there is no PDF
 * toolbar, no download button and no selectable text. Right-click, dragging,
 * copy and save/print shortcuts are blocked while it is open.
 */
export default function CvViewer({ open, onClose, src = "/api/cv", title = "Curriculum Vitae" }) {
  const pagesRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    let pdf = null;
    setStatus("loading");

    const render = async () => {
      try {
        const pdfjs = await loadPdfjs();
        const task = pdfjs.getDocument({
          url: src,
          httpHeaders: { "X-CV-Viewer": "1" },
          withCredentials: true,
          disableAutoFetch: true,
        });
        pdf = await task.promise;
        if (cancelled) return;

        const host = pagesRef.current;
        if (!host) return;
        host.replaceChildren();
        const width = Math.min(host.clientWidth || 800, 900);
        const ratio = Math.min(window.devicePixelRatio || 1, 2);

        for (let number = 1; number <= pdf.numPages; number += 1) {
          const page = await pdf.getPage(number);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block rounded-xl shadow-lg bg-white";
          canvas.setAttribute("aria-label", `${title}, page ${number}`);
          host.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    render();
    return () => {
      cancelled = true;
      pdf?.destroy();
    };
  }, [open, src, title]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && BLOCKED_KEYS.has(key)) event.preventDefault();
      if (key === "printscreen") event.preventDefault();
    };
    const block = (event) => event.preventDefault();
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("copy", block, true);
    document.addEventListener("cut", block, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("copy", block, true);
      document.removeEventListener("cut", block, true);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const block = (event) => event.preventDefault();

  return (
    <div
      className="cv-viewer fixed inset-0 z-[60] bg-stone-900/50 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onContextMenu={block}
      onDragStart={block}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-4xl h-full max-h-[94vh] flex flex-col rounded-3xl bg-cream-bg dark:bg-dark-surface border border-cream-border dark:border-dark-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-cream-border dark:border-dark-border">
          <div>
            <h3 className="font-heading text-lg font-bold">{title}</h3>
            <p className="text-[11px] text-cream-muted dark:text-dark-muted">View only</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-card dark:hover:bg-dark-card transition-colors" aria-label="Close CV">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto overscroll-contain px-3 sm:px-8 py-6 bg-cream-surface dark:bg-dark-bg">
          {status === "loading" && <p className="text-center text-xs font-mono text-cream-muted dark:text-dark-muted py-10">Loading CV…</p>}
          {status === "error" && <p className="text-center text-xs font-mono text-rose-600 dark:text-rose-400 py-10">The CV could not be loaded. Please try again later.</p>}
          <div ref={pagesRef} className="mx-auto max-w-[900px] space-y-6 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
