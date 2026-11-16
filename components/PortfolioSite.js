"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowUpRight,
  Award,
  BookOpen,
  Camera,
  ChevronDown,
  Edit3,
  FileText,
  Images,
  Mail,
  Menu,
  Moon,
  PenTool,
  PlusCircle,
  Shield,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import AdminDashboard from "@/components/AdminDashboard";
import CvViewer from "@/components/CvViewer";
import PixelPortrait from "@/components/PixelPortrait";
import { api } from "@/lib/client";
import { SKILL_ROWS } from "@/lib/skills";

// Swap this for your own photo (e.g. drop it in /public and use "/portrait.jpg").
// External hosts must allow CORS so the pixel effect can read the image.
const portrait = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80";
const DEFAULT_ALT = "Fatima Azeemi AI Engineer";

const shapeSvgs = [
  `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/></svg>`,
  `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M12 2L2 22h20L12 2z"/><path d="M12 2v20"/></svg>`,
  `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>`,
  `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>`,
  `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="3"/></svg>`,
  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M4 4h16v16H4z"/><path d="M4 4l16 16M20 4 4 20"/></svg>`,
  `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12 4 7.5"/></svg>`,
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/></svg>`,
  `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M3 12h18M12 3v18"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`,
  `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15"><path d="M5 3h14v4H5zM5 17h14v4H5zM9 7v10M15 7v10"/></svg>`,
];

const emptyData = {
  projects: [],
  skills: [],
  experience: [],
  education: [],
  courses: [],
  albums: [],
  gallery: [],
  publications: [],
};
const adminPencil = "text-xs p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-500 border border-amber-500/40 hover:bg-amber-500/25";
const educationShift = ["ml-0 md:ml-24", "ml-0 md:ml-12", "ml-0"];

function createShapes(count = 26) {
  let seed = 918273;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    svg: shapeSvgs[index % shapeSvgs.length],
    top: Number((rand() * 92 + 2).toFixed(2)),
    left: Number((rand() * 92 + 2).toFixed(2)),
    scale: Number((rand() * 0.7 + 0.55).toFixed(2)),
    rotate: Math.floor(rand() * 360),
    opacity: Number((rand() * 0.12 + 0.12).toFixed(2)),
  }));
}

const INITIAL_SHAPES = createShapes();

function BrandIcon({ children, className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

function ComingSoon() {
  return <p className="coming-soon">Coming soon</p>;
}

const MARQUEE_SPEED = 42; // px per second, same pace on every row

function SkillChip({ skill }) {
  return (
    <span className="marquee-item skill-chip text-sm font-semibold tracking-wide" title={skill.name}>
      {skill.icon ? (
        <img
          src={skill.icon}
          alt=""
          className="skill-chip__icon"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      {skill.name}
    </span>
  );
}

/**
 * One endless marquee row. The skill set is repeated until a group is at least
 * as wide as the row, and the track holds two such groups, so moving it by
 * exactly half its width loops seamlessly with no gap or restart.
 */
function SkillTrack({ label, reverse, skills }) {
  const wrapRef = useRef(null);
  const groupRef = useRef(null);
  const [copies, setCopies] = useState(2);
  const [duration, setDuration] = useState(40);

  useEffect(() => {
    const wrap = wrapRef.current;
    const group = groupRef.current;
    if (!wrap || !group) return undefined;

    const measure = () => {
      const setWidth = group.getBoundingClientRect().width / copies;
      if (!setWidth) return;
      const needed = Math.max(1, Math.ceil(wrap.clientWidth / setWidth));
      if (needed !== copies) {
        setCopies(needed);
        return;
      }
      setDuration(Math.max(12, (setWidth * needed) / MARQUEE_SPEED));
    };

    // Icons that failed to load before hydration never fire onError: hide them.
    group.parentElement?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.style.display = "none";
    });

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(group);
    return () => observer.disconnect();
  }, [skills, copies]);

  if (!skills.length) return null;
  const group = Array.from({ length: copies }, (_, copy) =>
    skills.map((skill) => <SkillChip key={`${copy}-${skill.id || skill.name}`} skill={skill} />)
  );

  return (
    <div ref={wrapRef} className="marquee" role="group" aria-label={label}>
      <div className={`marquee-track${reverse ? " is-reverse" : ""}`} style={{ "--marquee-duration": `${duration}s` }}>
        <div ref={groupRef} className="marquee-group">{group}</div>
        <div className="marquee-group" aria-hidden="true">{group}</div>
      </div>
    </div>
  );
}

export default function PortfolioSite({ initialData, initialAdmin }) {
  const [data, setData] = useState({ ...emptyData, ...initialData });
  const [isAdmin, setIsAdmin] = useState(initialAdmin);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [brandOn, setBrandOn] = useState(false);
  const [shapes] = useState(INITIAL_SHAPES);
  const [cvOpen, setCvOpen] = useState(false);
  const [projectGallery, setProjectGallery] = useState(null);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [password, setPassword] = useState("");
  const [loginStatus, setLoginStatus] = useState("");
  const [loginError, setLoginError] = useState("");
  const splashLogoRef = useRef(null);
  const brandRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = () => {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return;
      const theme = mq.matches ? "dark" : "light";
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(theme);
    };
    syncSystemTheme();
    mq.addEventListener("change", syncSystemTheme);
    return () => mq.removeEventListener("change", syncSystemTheme);
  }, []);

  // Always open at the very top so the hero reveal is seen in full: stop the
  // browser restoring an old scroll position and drop a leftover "#hero".
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const hash = window.location.hash;
    if (!hash || hash === "#hero") {
      if (hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let settled = false;
    let startTimer;
    let doneTimer;
    let fallbackTimer;
    let frameId;
    let splashEl = null;
    let onEnd = null;

    const finishSplash = () => {
      setSplashFading(true);
      setBrandOn(true);
      setSplashDone(true);
    };

    const run = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      startTimer = setTimeout(() => {
        const splash = splashLogoRef.current;
        const brand = brandRef.current;
        if (!splash || !brand) {
          finishSplash();
          return;
        }
        splashEl = splash;

        // Nav brand never moves. Splash logo flies to its center, then fades out.
        const from = splash.getBoundingClientRect();
        const to = brand.getBoundingClientRect();
        if (from.width < 1 || to.width < 1) {
          finishSplash();
          return;
        }

        const fromCx = from.left + from.width / 2;
        const fromCy = from.top + from.height / 2;
        const toCx = to.left + to.width / 2;
        const toCy = to.top + to.height / 2;
        const scale = to.width / from.width;
        const dx = toCx - fromCx;
        const dy = toCy - fromCy;
        const duration = 900;

        Object.assign(splash.style, {
          left: `${from.left}px`,
          top: `${from.top}px`,
          margin: "0",
          transformOrigin: "center center",
          transform: "translate3d(0px, 0px, 0) scale(1)",
          transition: "none",
          opacity: "1",
          willChange: "transform",
        });
        void splash.offsetWidth;

        const settle = () => {
          if (settled || cancelled) return;
          settled = true;
          if (onEnd) splash.removeEventListener("transitionend", onEnd);
          clearTimeout(fallbackTimer);

          setBrandOn(true);
          setSplashFading(true);
          splash.style.transition = "opacity 70ms linear";
          splash.style.opacity = "0";
          doneTimer = setTimeout(() => {
            if (!cancelled) setSplashDone(true);
          }, 80);
        };

        onEnd = (event) => {
          if (event.target !== splash || event.propertyName !== "transform") return;
          settle();
        };
        splash.addEventListener("transitionend", onEnd);

        frameId = requestAnimationFrame(() => {
          splash.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          splash.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
          setSplashFading(true);
          fallbackTimer = setTimeout(settle, duration + 100);
        });
      }, 600);
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      clearTimeout(doneTimer);
      clearTimeout(fallbackTimer);
      cancelAnimationFrame(frameId);
      if (splashEl && onEnd) splashEl.removeEventListener("transitionend", onEnd);
    };
  }, []);

  async function reload() {
    const next = await api("/api/content");
    setData({ ...emptyData, ...next });
  }

  function toggleTheme() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    localStorage.setItem("theme", next);
  }

  function adminManage(tab) {
    setActiveTab(tab);
    if (isAdmin) setDashOpen(true);
    else {
      setLoginStatus("");
      setLoginError("");
      setAdminAuthOpen(true);
    }
  }

  async function login(event) {
    event.preventDefault();
    setLoginStatus("");
    setLoginError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
      setLoginStatus("ok");
      setIsAdmin(true);
      setPassword("");
      setTimeout(() => {
        setLoginStatus("");
        setAdminAuthOpen(false);
        setDashOpen(true);
      }, 800);
    } catch (err) {
      setLoginStatus("error");
      setLoginError(err.message);
    }
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      // Always leave admin mode on the client, even if the request fails.
    }
    setIsAdmin(false);
    setDashOpen(false);
    setAdminAuthOpen(false);
  }

  const skillRows = SKILL_ROWS.map((item) => ({
    ...item,
    skills: data.skills.filter((skill) => (Number(skill.row) || 1) === item.row),
  }));

  return (
    <>
      {!splashDone && (
        <>
          <div id="splash-screen" className={splashFading ? "is-fading" : undefined} aria-hidden="true" />
          <span id="splash-logo" ref={splashLogoRef}>
            0xfatima
          </span>
        </>
      )}

      <div id="geo-container" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className="geo-shape text-stone-500 dark:text-stone-400"
            style={{
              top: `${shape.top}%`,
              left: `${shape.left}%`,
              transform: `scale(${shape.scale}) rotate(${shape.rotate}deg)`,
              opacity: shape.opacity,
            }}
            dangerouslySetInnerHTML={{ __html: shape.svg }}
          />
        ))}
      </div>

      {isAdmin && (
        <div id="admin-live-bar" className="fixed bottom-4 right-4 z-[80] glass-panel px-4 py-2.5 rounded-full border border-amber-500/40 shadow-2xl flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-xs font-mono font-medium text-amber-700 dark:text-amber-500">Admin Mode Active</span>
          <button type="button" onClick={() => setDashOpen(true)} className="px-3 py-1 bg-amber-500 text-stone-950 font-semibold rounded-full text-[11px] hover:bg-amber-400 transition-colors">
            Manage Database
          </button>
          <button type="button" onClick={logout} className="px-3 py-1 rounded-full border border-stone-500/40 text-xs text-cream-muted hover:text-cream-text dark:text-stone-300 dark:hover:text-white hover:border-stone-500 dark:hover:border-stone-300 transition-colors">
            Exit
          </button>
        </div>
      )}

      <header className="fixed top-0 left-0 w-full z-40 px-4 sm:px-8 py-4">
        <nav className="max-w-7xl mx-auto glass-panel rounded-full px-5 py-3 flex items-center justify-between shadow-lg">
          <a href="#hero" className="flex items-center gap-2 group">
            <span
              id="nav-brand-target"
              ref={brandRef}
              className={`font-heading font-bold text-xl tracking-tight text-cream-text dark:text-dark-text ${brandOn ? "opacity-100" : "opacity-0"}`}
            >
              0xfatima
            </span>
          </a>

          <div className="hidden lg:flex items-center space-x-6 text-xs font-medium uppercase tracking-wider text-cream-muted dark:text-dark-muted">
            <a href="#hero" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">About</a>
            <a href="#skills" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Skills</a>
            <a href="#projects" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Projects</a>
            <a href="#experience" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Experience</a>
            <a href="#education" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Education</a>
            <a href="#courses" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Courses</a>
            <a href="#publications" className="hover:text-cream-text dark:hover:text-dark-text transition-colors">Publications</a>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleTheme} aria-label="Toggle Theme" className="p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-surface dark:hover:bg-dark-surface transition-all">
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 block dark:hidden" />
            </button>

            <div className="relative group" onMouseLeave={() => setLinksOpen(false)}>
              <button type="button" onClick={() => setLinksOpen((open) => !open)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-cream-border dark:border-dark-border hover:bg-cream-surface dark:hover:bg-dark-surface transition-all">
                <span>Links</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className={`absolute right-0 top-full z-50 w-52 pt-2 ${linksOpen ? "block" : "hidden"} group-hover:block`}>
                <div className="glass-panel rounded-2xl shadow-xl py-2">
                  <button type="button" onClick={() => { setLinksOpen(false); setCvOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                    <FileText className="w-4 h-4" /> Curriculum Vitae
                  </button>
                  <a href="https://github.com/0xfatima" target="_blank" rel="noopener" className="flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                    <BrandIcon className="w-4 h-4"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></BrandIcon>
                    GitHub Account
                  </a>
                  <a href="#publications" onClick={() => setLinksOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                    <BookOpen className="w-4 h-4" /> Publications
                  </a>
                  <a href="https://medium.com" target="_blank" rel="noopener" className="flex items-center gap-2.5 px-4 py-2 text-xs hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                    <PenTool className="w-4 h-4" /> Medium Articles
                  </a>
                  <Link href="/gallery" onClick={() => setLinksOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                    <Camera className="w-4 h-4" /> Photo Gallery
                  </Link>
                  <div className="my-1 border-t border-cream-border dark:border-dark-border" />
                  {isAdmin ? (
                    <>
                      <button type="button" onClick={() => { setLinksOpen(false); setDashOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-500 font-semibold hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                        <Shield className="w-4 h-4" /> Open Admin Console
                      </button>
                      <button type="button" onClick={() => { setLinksOpen(false); logout(); }} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-stone-400 font-semibold hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                        Exit Admin
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setLinksOpen(false); setLoginStatus(""); setLoginError(""); setAdminAuthOpen(true); }} className="flex w-full items-center gap-2.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-500 font-semibold hover:bg-cream-card dark:hover:bg-dark-card transition-colors">
                      <Shield className="w-4 h-4" /> Admin Login
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-label="Open Mobile Menu" className="lg:hidden p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-surface dark:hover:bg-dark-surface transition-all">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </nav>

        <div className={`${mobileOpen ? "flex" : "hidden"} lg:hidden max-w-7xl mx-auto mt-2 glass-panel rounded-3xl p-5 flex-col space-y-3 text-sm font-medium`}>
          {["About|#hero", "Skills|#skills", "Projects|#projects", "Experience|#experience", "Education|#education", "Courses|#courses", "Publications|#publications"].map((item) => {
            const [label, href] = item.split("|");
            return (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="py-1.5 hover:opacity-80">{label}</a>
            );
          })}
        </div>
      </header>

      <main className="relative z-10 pt-28">
        <section id="hero" className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 sm:px-8 relative">
          <PixelPortrait src={portrait} alt={DEFAULT_ALT} start={brandOn} className="inset-x-0 -top-28 bottom-0" />
          <div className="hero-scrim" aria-hidden="true">
            <i /><i /><i /><i />
          </div>
          <div className="hero-copy max-w-4xl mx-auto space-y-6 relative z-10">
            <div>
              <span className="hero-kicker text-xs sm:text-sm font-mono font-semibold tracking-widest uppercase text-cream-text dark:text-dark-text">
                AI Engineer · LLMs · RAG · Full-Stack
              </span>
              <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mt-2 text-cream-text dark:text-dark-text">FATIMA AZEEMI</h1>
            </div>
            <p className="text-sm sm:text-base font-medium max-w-xl mx-auto text-cream-text dark:text-dark-text leading-relaxed">
              Building AI-powered systems & researching new possibilities.
            </p>
            <div className="pt-4">
              <span className="font-heading font-extrabold text-5xl sm:text-7xl lg:text-8xl tracking-tighter select-none text-stone-900 dark:text-stone-100">
                Code.
              </span>
            </div>
          </div>
        </section>

        <section id="skills" className="py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-10 text-center flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Capabilities & Competencies</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Technical Toolkit</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("skills")} className={adminPencil} aria-label="Edit skills">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          {data.skills.length ? (
            <div className="space-y-4 py-6 border-y border-cream-border dark:border-dark-border glass-panel">
              {skillRows.map((item, index) => (
                <SkillTrack key={item.row} label={item.label} reverse={index % 2 === 1} skills={item.skills} />
              ))}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section id="projects" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Featured Work</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Projects</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("projects")} className={adminPencil} aria-label="Add project">
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-cream-muted dark:text-dark-muted max-w-md mt-3">
              RAG systems, computer vision apps, LLM fine-tuning, and full-stack AI products built end to end.
            </p>
          </div>
          {data.projects.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.projects.map((project) => (
                <div key={project.id} className="glass-panel card-glow rounded-3xl p-5 flex flex-col justify-between group relative">
                  <div>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-4 bg-stone-800">
                      <img src={project.cover} alt={DEFAULT_ALT} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      {project.live && (
                        <a href={project.live} target="_blank" rel="noopener" title="Open Live Site" className="absolute top-3 right-3 w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white opacity-90 hover:opacity-100 hover:scale-110 transition-all z-20 shadow-lg">
                          <ArrowUpRight className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(project.stack || []).map((item) => (
                        <span key={item} className="px-2.5 py-1 text-[10px] font-mono rounded-md bg-stone-500/10 border border-cream-border dark:border-dark-border">{item}</span>
                      ))}
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-1">{project.title}</h3>
                    <p className="text-xs text-cream-muted dark:text-dark-muted line-clamp-2 mb-4">{project.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-cream-border dark:border-dark-border">
                    <button type="button" onClick={() => setProjectGallery({ title: project.title, images: project.gallery?.length ? project.gallery : [project.cover] })} className="text-xs font-medium flex items-center gap-1 hover:underline">
                      <Images className="w-3.5 h-3.5" /> Multiple Views
                    </button>
                    {project.github && (
                      <a href={project.github} target="_blank" rel="noopener" className="text-xs font-medium flex items-center gap-1 hover:underline">
                        <BrandIcon className="w-3.5 h-3.5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></BrandIcon>
                        Code Repo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section id="experience" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Career Trajectory</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Experience Route Map</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("experience")} className={adminPencil} aria-label="Add experience">
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {data.experience.length ? (
            <div className="relative pl-6 sm:pl-10 border-l-2 border-stone-400/30 dark:border-stone-700/50 space-y-12">
              {data.experience.map((item, index) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-6 h-6 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center text-xs font-mono font-bold border-4 border-cream-bg dark:border-dark-bg shadow-md">
                    {index + 1}
                  </div>
                  <div className="glass-panel card-glow p-6 rounded-3xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {item.logo ? (
                          <img src={item.logo} alt={DEFAULT_ALT} className="icon-glow w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="icon-glow w-10 h-10 rounded-xl flex items-center justify-center text-amber-200/80 font-bold text-xs shrink-0">{item.company ? item.company[0] : "C"}</div>
                        )}
                        <div>
                          <h3 className="font-heading text-lg font-bold">{item.title}</h3>
                          <p className="text-xs text-cream-muted dark:text-dark-muted">{item.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-full border border-cream-border dark:border-dark-border">{item.type || "Full-time"}</span>
                        <span className="text-cream-muted dark:text-dark-muted">{item.duration}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-cream-muted dark:text-dark-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section id="education" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Academic Step Progression</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Education Staircase</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("education")} className={adminPencil} aria-label="Add education">
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {data.education.length ? (
            <div className="space-y-6">
              {data.education.map((item, index) => (
                <div key={item.id} className={`step-item ${educationShift[index % 3]} glass-panel card-glow p-6 rounded-3xl border-l-8 border-stone-600`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      {item.logo ? (
                        <img src={item.logo} alt={DEFAULT_ALT} className="w-12 h-12 rounded-lg object-cover bg-white/5" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-stone-800 flex items-center justify-center text-white font-bold text-sm">{item.school ? item.school[0] : "U"}</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400">{item.stepLabel || `Step 0${index + 1}`}</span>
                        <h3 className="font-heading text-xl font-bold">{item.degree}</h3>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-cream-muted dark:text-dark-muted">{item.dates}</span>
                  </div>
                  <p className="text-xs font-semibold text-cream-muted dark:text-dark-muted mb-2">{item.school}</p>
                  <p className="text-xs text-cream-muted dark:text-dark-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section id="courses" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Verified Badges & Credentials</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Courses & Specializations</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("courses")} className={adminPencil} aria-label="Add course">
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {data.courses.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.courses.map((item) => {
                const issuerLogo = item.issuerLogo || item.logo;
                return (
                  <div key={item.id} className="glass-panel card-glow rounded-3xl p-6 flex flex-col justify-between h-full group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        {issuerLogo ? (
                          <img src={issuerLogo} alt={DEFAULT_ALT} className="w-12 h-12 rounded-2xl object-contain bg-white/5 p-1.5" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center text-white">
                            <Award className="w-6 h-6" />
                          </div>
                        )}
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded bg-stone-500/10 border border-cream-border dark:border-dark-border">{item.spec || "Certificate"}</span>
                      </div>
                      {item.certificate ? (
                        <div className="mb-4 rounded-2xl overflow-hidden aspect-[4/3] bg-stone-800 border border-cream-border/40 dark:border-dark-border/40">
                          <img src={item.certificate} alt={DEFAULT_ALT} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      ) : null}
                      <p className="text-[10px] uppercase font-mono text-cream-muted dark:text-dark-muted">{item.issuer}</p>
                      <h3 className="font-heading text-base font-bold mb-2">{item.title}</h3>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener" className="inline-flex items-center justify-between text-xs font-medium pt-3 border-t border-cream-border dark:border-dark-border hover:underline">
                        <span>Verify Credential</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section id="publications" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-cream-muted dark:text-dark-muted">Research & Writing</span>
            <div className="flex items-center gap-3 mt-2">
              <h2 className="section-heading font-heading text-3xl sm:text-4xl font-bold">Publications</h2>
              {isAdmin && (
                <button type="button" onClick={() => adminManage("publications")} className={adminPencil} aria-label="Add publication">
                  <PlusCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {(data.publications || []).length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.publications.map((item) => (
                <article key={item.id} className="glass-panel card-glow rounded-3xl overflow-hidden flex flex-col sm:flex-row group">
                  {item.cover ? (
                    <div className="sm:w-40 shrink-0 aspect-[4/3] sm:aspect-auto bg-stone-800">
                      <img src={item.cover} alt={DEFAULT_ALT} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                  ) : null}
                  <div className="p-6 flex flex-col justify-between gap-4 flex-1">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-cream-muted dark:text-dark-muted mb-2">
                        {[item.venue, item.year].filter(Boolean).join(" · ")}
                      </p>
                      <h3 className="font-heading text-lg font-bold mb-2">{item.title}</h3>
                      {item.authors ? <p className="text-xs text-cream-muted dark:text-dark-muted mb-2">{item.authors}</p> : null}
                      {item.abstract ? <p className="text-xs text-cream-muted dark:text-dark-muted leading-relaxed line-clamp-3">{item.abstract}</p> : null}
                    </div>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs font-medium hover:underline">
                        Read / Cite <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <ComingSoon />
          )}
        </section>
      </main>

      <footer className="border-t border-cream-border dark:border-dark-border py-12 px-4 sm:px-8 mt-20 relative z-10 glass-panel">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="font-heading font-bold text-lg tracking-tight">0xfatima</span>
            <p className="text-xs text-cream-muted dark:text-dark-muted mt-1">© 2026 Fatima Azeemi · Karachi, Pakistan</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://www.linkedin.com/in/fatima-azeemi-466988266" target="_blank" rel="noopener" aria-label="LinkedIn Profile" className="text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text transition-colors">
              <BrandIcon><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></BrandIcon>
            </a>
            <a href="https://github.com/0xfatima" target="_blank" rel="noopener" aria-label="GitHub Profile" className="text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text transition-colors">
              <BrandIcon><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></BrandIcon>
            </a>
            <a href="https://medium.com" target="_blank" rel="noopener" aria-label="Medium Profile" className="text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text transition-colors">
              <PenTool className="w-5 h-5" />
            </a>
            <a href="mailto:azeemifatima1@gmail.com" aria-label="Email Contact" className="text-cream-muted dark:text-dark-muted hover:text-cream-text dark:hover:text-dark-text transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
          <a href="#hero" aria-label="Back to top" className="p-3 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-surface dark:hover:bg-dark-surface transition-colors">
            <ArrowUp className="w-4 h-4" />
          </a>
        </div>
      </footer>

      <CvViewer open={cvOpen} onClose={() => setCvOpen(false)} />

      {projectGallery && (
        <div className="fixed inset-0 z-50 bg-cream-bg/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-cream-bg dark:bg-dark-surface text-cream-text dark:text-dark-text border border-cream-border dark:border-dark-border shadow-2xl w-full max-w-3xl rounded-3xl p-6 space-y-4 relative">
            <button type="button" onClick={() => setProjectGallery(null)} className="absolute top-4 right-4 p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-card dark:hover:bg-dark-card transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading text-xl font-bold mb-4">{projectGallery.title} — Media Showcase</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projectGallery.images.map((src) => (
                <div key={src} className="rounded-2xl overflow-hidden aspect-video bg-stone-800">
                  <img src={src} alt={DEFAULT_ALT} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminAuthOpen && (
        <div className="fixed inset-0 z-50 bg-cream-bg/70 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-cream-bg dark:bg-dark-surface text-cream-text dark:text-dark-text border border-cream-border dark:border-dark-border shadow-2xl w-full max-w-sm rounded-3xl p-6 space-y-4 relative">
            <button type="button" onClick={() => setAdminAuthOpen(false)} className="absolute top-4 right-4 p-2 rounded-full border border-cream-border dark:border-dark-border hover:bg-cream-card dark:hover:bg-dark-card transition-colors" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-heading text-xl font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
              <ShieldCheck className="w-5 h-5" /> Admin Management Login
            </h3>
            <p className="text-xs text-cream-muted dark:text-dark-muted">Sign in to unlock backend database controls and real-time content editing.</p>
            {loginStatus === "ok" && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-500 text-xs font-mono">
                Authentication successful. Unlocking admin dashboard...
              </div>
            )}
            {loginStatus === "error" && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                {loginError}
              </div>
            )}
            <form onSubmit={login} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wide font-mono text-cream-muted dark:text-dark-muted block mb-1">Passkey</label>
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Enter your admin passkey" className="w-full px-4 py-2.5 rounded-xl border border-cream-border dark:border-stone-700 bg-white dark:bg-stone-900 text-xs text-cream-text dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20" required />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">
                Authenticate Session
              </button>
            </form>
          </div>
        </div>
      )}

      {isAdmin && (
        <AdminDashboard
          open={dashOpen}
          onClose={() => setDashOpen(false)}
          onLogout={logout}
          data={data}
          onSaved={reload}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </>
  );
}
