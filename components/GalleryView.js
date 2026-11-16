"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  Moon,
  Star,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api, compressGalleryImage } from "@/lib/client";

const UNCATEGORIZED = "uncategorized";
const emptyAlbum = { id: "", title: "", description: "", cover: "" };

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-cream-border dark:border-stone-700 text-xs text-cream-text dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20";
const pillBtn =
  "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border border-cream-border dark:border-dark-border text-xs font-medium hover:bg-cream-card dark:hover:bg-dark-card transition-colors disabled:opacity-60";
const amberBtn =
  "inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 text-stone-950 text-xs font-bold hover:bg-amber-400 transition-colors disabled:opacity-60";

function toggleTheme() {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(next);
  localStorage.setItem("theme", next);
}

// Store the image first and save only its URL: record fields are capped at
// 2,000 characters, which a raw data URL always exceeds.
async function uploadImage(file) {
  const dataUrl = await compressGalleryImage(file);
  const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl }) });
  return url;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export default function GalleryView({ initialData, initialAdmin, albumId }) {
  const router = useRouter();
  const [data, setData] = useState({ albums: [], gallery: [], ...initialData });
  const isAdmin = Boolean(initialAdmin);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [albumForm, setAlbumForm] = useState(null); // null | album fields
  const [caption, setCaption] = useState("");
  const [lightbox, setLightbox] = useState(-1);

  const albums = data.albums || [];
  const photos = data.gallery || [];
  const albumIds = useMemo(() => new Set(albums.map((album) => album.id)), [albums]);
  // Photos with no album, or whose album was deleted, count as uncategorized.
  const isLoose = useCallback((photo) => !photo.albumId || !albumIds.has(photo.albumId), [albumIds]);
  const loosePhotos = photos.filter(isLoose);

  const viewingLoose = albumId === UNCATEGORIZED;
  const album = albumId
    ? viewingLoose
      ? { id: UNCATEGORIZED, title: "Uncategorized", description: "Photos that aren't in an album yet." }
      : albums.find((item) => item.id === albumId) || null
    : null;
  const albumPhotos = album ? (viewingLoose ? loosePhotos : photos.filter((photo) => photo.albumId === album.id)) : [];

  async function reload() {
    const next = await api("/api/content");
    setData({ albums: [], gallery: [], ...next });
  }

  async function run(task) {
    setError("");
    setBusy(true);
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function saveAlbum(event) {
    event.preventDefault();
    const { id, title, description, cover } = albumForm;
    run(async () => {
      const payload = JSON.stringify({ title, description, cover });
      const saved = id
        ? await api(`/api/albums/${id}`, { method: "PUT", body: payload })
        : await api("/api/albums", { method: "POST", body: payload });
      setAlbumForm(null);
      await reload();
      if (!id && saved?.id) router.push(`/gallery/${saved.id}`);
    });
  }

  async function onAlbumCover(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    run(async () => {
      const cover = await uploadImage(file);
      setAlbumForm((current) => ({ ...current, cover }));
    });
  }

  function deleteAlbum(target) {
    const count = photos.filter((photo) => photo.albumId === target.id).length;
    const note = count ? ` Its ${plural(count, "photo")} will move to Uncategorized.` : "";
    if (!window.confirm(`Delete the album "${target.title}"?${note}`)) return;
    run(async () => {
      await api(`/api/albums/${target.id}`, { method: "DELETE" });
      await reload();
      if (albumId === target.id) router.push("/gallery");
    });
  }

  async function onUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    run(async () => {
      for (const file of files) {
        const url = await uploadImage(file);
        await api("/api/gallery", {
          method: "POST",
          body: JSON.stringify({
            url,
            caption: files.length === 1 && caption ? caption : file.name.replace(/\.[^.]+$/, ""),
            albumId: viewingLoose ? "" : album.id,
          }),
        });
      }
      setCaption("");
      await reload();
    });
  }

  function deletePhoto(photo) {
    if (!window.confirm("Delete this photo?")) return;
    run(async () => {
      await api(`/api/gallery/${photo.id}`, { method: "DELETE" });
      setLightbox(-1);
      await reload();
    });
  }

  function makeCover(photo) {
    run(async () => {
      await api(`/api/albums/${album.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: album.title, description: album.description || "", cover: photo.url }),
      });
      await reload();
    });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-4">
        <nav className="max-w-6xl mx-auto glass-panel rounded-full px-5 py-3 flex items-center justify-between shadow-lg">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text transition-colors">
            <ArrowLeft className="w-4 h-4" /> Portfolio
          </Link>
          <Link href="/gallery" className="font-heading font-bold text-lg tracking-tight">0xfatima</Link>
          <button type="button" onClick={toggleTheme} aria-label="Toggle Theme" className="p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-surface dark:hover:bg-dark-surface transition-all">
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-24">
        {albumId && !album ? (
          <div className="text-center py-24 space-y-4">
            <h1 className="font-heading text-3xl font-bold">Album not found</h1>
            <p className="text-sm text-cream-muted dark:text-dark-muted">It may have been renamed or removed.</p>
            <Link href="/gallery" className={pillBtn}>
              <ArrowLeft className="w-3.5 h-3.5" /> All albums
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                {album ? (
                  <Link href="/gallery" className="inline-flex items-center gap-1.5 text-xs text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text mb-3">
                    <ArrowLeft className="w-3.5 h-3.5" /> All albums
                  </Link>
                ) : (
                  <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Photography</span>
                )}
                <h1 className="section-heading font-heading text-3xl sm:text-4xl font-bold mt-1">{album ? album.title : "Photo Gallery"}</h1>
                <p className="text-sm text-cream-muted dark:text-dark-muted mt-2 max-w-xl">
                  {album
                    ? `${album.description ? `${album.description} · ` : ""}${plural(albumPhotos.length, "photo")}`
                    : "Albums from work, travel and everything in between."}
                </p>
              </div>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  {!album && (
                    <button type="button" onClick={() => setAlbumForm({ ...emptyAlbum })} className={amberBtn}>
                      <FolderPlus className="w-3.5 h-3.5" /> New album
                    </button>
                  )}
                  {album && (
                    <>
                      <input
                        value={caption}
                        onChange={(event) => setCaption(event.target.value)}
                        type="text"
                        placeholder="Caption (single upload)"
                        className="px-3 py-1.5 rounded-full border border-cream-border dark:border-dark-border bg-transparent text-xs focus:outline-none"
                      />
                      <label className={`${amberBtn} cursor-pointer`}>
                        <Upload className="w-3.5 h-3.5" /> {busy ? "Working…" : "Upload photos"}
                        <input type="file" accept="image/*" multiple className="hidden" disabled={busy} onChange={onUpload} />
                      </label>
                      {!viewingLoose && (
                        <>
                          <button type="button" onClick={() => setAlbumForm({ ...emptyAlbum, ...album, description: album.description || "", cover: album.cover || "" })} className={pillBtn}>
                            <Edit3 className="w-3.5 h-3.5" /> Edit album
                          </button>
                          <button type="button" onClick={() => deleteAlbum(album)} className={`${pillBtn} text-rose-600 dark:text-rose-400`}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {error && <p className="mb-6 text-xs font-mono text-rose-600 dark:text-rose-400">{error}</p>}

            {isAdmin && albumForm && (
              <form onSubmit={saveAlbum} className="mb-10 p-5 rounded-2xl space-y-4 border border-cream-border dark:border-dark-border bg-cream-surface/80 dark:bg-dark-surface">
                <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" /> {albumForm.id ? "Edit album" : "Create an album"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase text-cream-muted dark:text-dark-muted block mb-1">Title</span>
                    <input required value={albumForm.title} onChange={(event) => setAlbumForm({ ...albumForm, title: event.target.value })} placeholder="e.g. Hackathons 2026" className={inputClass} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-mono uppercase text-cream-muted dark:text-dark-muted block mb-1">Description</span>
                    <input value={albumForm.description} onChange={(event) => setAlbumForm({ ...albumForm, description: event.target.value })} placeholder="Optional short note" className={inputClass} />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {albumForm.cover ? (
                    <img src={albumForm.cover} alt="" className="h-14 w-20 rounded-lg object-cover border border-cream-border dark:border-dark-border" />
                  ) : (
                    <div className="h-14 w-20 rounded-lg flex items-center justify-center bg-cream-card dark:bg-dark-card text-cream-muted">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <label className={`${pillBtn} cursor-pointer`}>
                    <Upload className="w-3.5 h-3.5" /> Cover image (optional)
                    <input type="file" accept="image/*" className="hidden" onChange={onAlbumCover} />
                  </label>
                  <span className="text-[11px] text-cream-muted dark:text-dark-muted">Without a cover, the first photo is used.</span>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setAlbumForm(null)} className={pillBtn}>Cancel</button>
                  <button type="submit" disabled={busy} className={amberBtn}>{albumForm.id ? "Save album" : "Create album"}</button>
                </div>
              </form>
            )}

            {!album ? (
              <AlbumGrid albums={albums} photos={photos} loosePhotos={loosePhotos} isAdmin={isAdmin} onEdit={(item) => setAlbumForm({ ...emptyAlbum, ...item, description: item.description || "", cover: item.cover || "" })} onDelete={deleteAlbum} />
            ) : albumPhotos.length ? (
              <div className="gallery-masonry">
                {albumPhotos.map((photo, index) => (
                  <figure key={photo.id} className="relative group rounded-2xl overflow-hidden bg-cream-card dark:bg-dark-card card-glow">
                    <button type="button" onClick={() => setLightbox(index)} className="block w-full" aria-label={`Open ${photo.caption || "photo"}`}>
                      <img src={photo.url} alt={photo.caption || "Photo by Fatima Azeemi"} loading="lazy" className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]" />
                    </button>
                    {photo.caption && (
                      <figcaption className="pointer-events-none absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/75 to-transparent text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {photo.caption}
                      </figcaption>
                    )}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!viewingLoose && (
                          <button type="button" onClick={() => makeCover(photo)} className="p-1.5 rounded-full bg-black/55 hover:bg-amber-500 text-white" aria-label="Use as album cover" title="Use as album cover">
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button type="button" onClick={() => deletePhoto(photo)} className="p-1.5 rounded-full bg-black/55 hover:bg-rose-500 text-white" aria-label="Delete photo" title="Delete photo">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="coming-soon">{isAdmin ? "No photos yet. Upload some above." : "Coming soon"}</p>
            )}
          </>
        )}
      </main>

      {lightbox >= 0 && albumPhotos[lightbox] && (
        <Lightbox photos={albumPhotos} index={lightbox} onChange={setLightbox} onClose={() => setLightbox(-1)} />
      )}
    </div>
  );
}

function AlbumGrid({ albums, photos, loosePhotos, isAdmin, onEdit, onDelete }) {
  if (!albums.length && !loosePhotos.length) {
    return <p className="coming-soon">{isAdmin ? "No albums yet. Create your first one." : "Coming soon"}</p>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {albums.map((album) => {
        const inAlbum = photos.filter((photo) => photo.albumId === album.id);
        const cover = album.cover || inAlbum[0]?.url || "";
        return (
          <div key={album.id} className="relative group">
            <Link href={`/gallery/${album.id}`} className="block relative rounded-3xl overflow-hidden aspect-[4/3] bg-cream-card dark:bg-dark-card card-glow border border-cream-border/60 dark:border-dark-border/60">
              {cover ? (
                <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-cream-muted dark:text-dark-muted">
                  <FolderOpen className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                <h2 className="font-heading font-bold text-xl">{album.title}</h2>
                <p className="text-[11px] text-white/80 mt-0.5">
                  {plural(inAlbum.length, "photo")}
                  {album.description ? ` · ${album.description}` : ""}
                </p>
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button type="button" onClick={() => onEdit(album)} className="p-1.5 rounded-full bg-black/55 hover:bg-amber-500 text-white" aria-label={`Edit ${album.title}`}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => onDelete(album)} className="p-1.5 rounded-full bg-black/55 hover:bg-rose-500 text-white" aria-label={`Delete ${album.title}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
      {loosePhotos.length ? (
        <Link href={`/gallery/${UNCATEGORIZED}`} className="group block relative rounded-3xl overflow-hidden aspect-[4/3] bg-cream-card dark:bg-dark-card card-glow border border-cream-border/60 dark:border-dark-border/60">
          <img src={loosePhotos[0].url} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-5 text-white">
            <h2 className="font-heading font-bold text-xl">Uncategorized</h2>
            <p className="text-[11px] text-white/80 mt-0.5">{plural(loosePhotos.length, "photo")}</p>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

function Lightbox({ photos, index, onChange, onClose }) {
  const touchX = useRef(null);
  const count = photos.length;
  const photo = photos[index];
  const go = useCallback((step) => onChange((index + step + count) % count), [index, count, onChange]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
      onTouchStart={(event) => {
        touchX.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        if (touchX.current == null) return;
        const dx = event.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      role="dialog"
      aria-modal="true"
    >
      <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Close">
        <X className="w-5 h-5" />
      </button>
      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Previous photo">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white" aria-label="Next photo">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <img key={photo.id} src={photo.url} alt={photo.caption || "Photo by Fatima Azeemi"} className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" />
      <div className="mt-4 text-center text-white/85 text-sm">
        {photo.caption && <p className="font-medium">{photo.caption}</p>}
        <p className="text-[11px] font-mono text-white/55 mt-1">{index + 1} / {count}</p>
      </div>
    </div>
  );
}
