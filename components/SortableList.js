"use client";

import { useState } from "react";
import { ArrowDownWideNarrow, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { api } from "@/lib/client";
import { DATE_FIELDS, sortByDate } from "@/lib/ordering";

const handleBtn =
  "p-0.5 rounded text-cream-muted hover:text-cream-text hover:bg-cream-card dark:text-stone-500 dark:hover:text-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors";

function move(list, from, to) {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Admin list with drag-and-drop ordering (grab the ⋮⋮ handle) plus ↑/↓
 * buttons for touch screens and keyboards. The new order is saved right away
 * and is the order visitors see. Dated collections also get "Sort by date".
 */
export default function SortableList({ collection, items, onSaved, onError, className = "space-y-2", label, children }) {
  // While a new order is being saved, show it immediately (optimistic);
  // otherwise always render the latest data from the server.
  const [pending, setPending] = useState(null);
  const [armedId, setArmedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [saving, setSaving] = useState(false);

  const byId = new Map(items.map((item) => [item.id, item]));
  const list = pending
    ? [...pending.map((id) => byId.get(id)).filter(Boolean), ...items.filter((item) => !pending.includes(item.id))]
    : items;

  async function save(next) {
    setPending(next.map((item) => item.id));
    setSaving(true);
    onError?.("");
    try {
      await api("/api/admin/reorder", {
        method: "POST",
        body: JSON.stringify({ collection, ids: next.map((item) => item.id) }),
      });
      await onSaved?.();
    } catch (err) {
      onError?.(err.message);
    } finally {
      setPending(null);
      setSaving(false);
    }
  }

  function drop(targetId) {
    const from = list.findIndex((item) => item.id === dragId);
    const to = list.findIndex((item) => item.id === targetId);
    setDragId(null);
    setOverId(null);
    setArmedId(null);
    if (from < 0 || to < 0 || from === to) return;
    save(move(list, from, to));
  }

  if (!list.length) return null;
  const dated = Boolean(DATE_FIELDS[collection]);

  return (
    <div className="space-y-2">
      {list.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wide text-cream-muted dark:text-stone-500">
          <span className="inline-flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> Drag to reorder{label ? ` · ${label}` : ""}
            {saving ? <span className="normal-case text-amber-700 dark:text-amber-400"> · saving…</span> : null}
          </span>
          {dated && (
            <button
              type="button"
              disabled={saving}
              onClick={() => save(sortByDate(list, collection))}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cream-border dark:border-stone-700 normal-case tracking-normal text-[11px] font-sans font-medium text-cream-text dark:text-stone-200 hover:bg-cream-card dark:hover:bg-stone-800 disabled:opacity-60 transition-colors"
            >
              <ArrowDownWideNarrow className="w-3.5 h-3.5" /> Sort by date (newest first)
            </button>
          )}
        </div>
      )}
      <div className={className}>
        {list.map((item, index) => (
          <div
            key={item.id}
            draggable={armedId === item.id}
            onDragStart={(event) => {
              setDragId(item.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
            }}
            onDragOver={(event) => {
              if (!dragId) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (overId !== item.id) setOverId(item.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              drop(item.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
              setArmedId(null);
            }}
            className={`flex items-stretch gap-1.5 rounded-xl transition-all ${dragId === item.id ? "opacity-40" : ""} ${
              overId === item.id && dragId !== item.id ? "ring-2 ring-amber-500/60 ring-offset-2 ring-offset-cream-bg dark:ring-offset-dark-surface" : ""
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
              <button type="button" className={handleBtn} disabled={saving || index === 0} onClick={() => save(move(list, index, index - 1))} aria-label="Move up">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <span
                className="cursor-grab active:cursor-grabbing p-0.5 text-cream-muted dark:text-stone-500 hover:text-amber-700 dark:hover:text-amber-400"
                onMouseDown={() => setArmedId(item.id)}
                onMouseUp={() => !dragId && setArmedId(null)}
                title="Drag to reorder"
                aria-hidden="true"
              >
                <GripVertical className="w-4 h-4" />
              </span>
              <button type="button" className={handleBtn} disabled={saving || index === list.length - 1} onClick={() => save(move(list, index, index + 1))} aria-label="Move down">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">{children(item, index)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
