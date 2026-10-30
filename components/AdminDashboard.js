"use client";

import { useState } from "react";
import { Database, LogOut, PlusCircle, RotateCcw, Trash2, X } from "lucide-react";
import { api, compressImage, compressGalleryImage, compressLogoImage } from "@/lib/client";

const inputClass =
  "w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-stone-100 focus:outline-none";
const labelClass = "text-[10px] font-mono uppercase text-stone-400 block mb-1";

const emptyProject = { id: "", title: "", stack: "", live: "", github: "", description: "", cover: "" };
const emptySkill = { id: "", name: "", row: "1", icon: "" };
const emptyExperience = { id: "", title: "", company: "", duration: "", type: "", logo: "", description: "" };
const emptyEducation = { id: "", stepLabel: "", degree: "", school: "", dates: "", logo: "", description: "" };
const emptyCourse = { id: "", title: "", issuer: "", spec: "", link: "", issuerLogo: "", certificate: "" };
const emptyAlbum = { id: "", title: "", description: "", cover: "" };
const emptyGallery = { id: "", url: "", caption: "", albumId: "" };
const emptyPublication = { id: "", title: "", authors: "", venue: "", year: "", link: "", cover: "", abstract: "" };

const tabs = [
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["experience", "Experience"],
  ["education", "Education"],
  ["courses", "Courses"],
  ["gallery", "Gallery"],
  ["publications", "Publications"],
];

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function UploadField({ label, value, onChange, onFile, uploadLabel = "Upload" }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="text"
          placeholder="https://..."
          className={`flex-1 ${inputClass}`}
        />
        <label className="cursor-pointer px-3 py-2 rounded-xl border border-stone-700 bg-stone-800 text-xs hover:bg-stone-700 font-medium transition-colors whitespace-nowrap">
          {uploadLabel}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
      </div>
      {value ? <img src={value} alt="Fatima Azeemi AI Engineer" className="mt-2 h-12 w-12 rounded-lg object-cover border border-stone-700" /> : null}
    </Field>
  );
}

export default function AdminDashboard({ open, onClose, onLogout, data, onSaved, activeTab, setActiveTab }) {
  const [project, setProject] = useState(emptyProject);
  const [skill, setSkill] = useState(emptySkill);
  const [experience, setExperience] = useState(emptyExperience);
  const [education, setEducation] = useState(emptyEducation);
  const [course, setCourse] = useState(emptyCourse);
  const [album, setAlbum] = useState(emptyAlbum);
  const [gallery, setGallery] = useState(emptyGallery);
  const [publication, setPublication] = useState(emptyPublication);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(collection, id, payload, reset) {
    setError("");
    setSaving(true);
    try {
      if (id) {
        await api(`/api/${collection}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(`/api/${collection}`, { method: "POST", body: JSON.stringify(payload) });
      }
      reset();
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(collection, id) {
    setError("");
    try {
      await api(`/api/${collection}/${id}`, { method: "DELETE" });
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  async function seed() {
    setError("");
    setSaving(true);
    try {
      await api("/api/admin/seed", { method: "POST", body: "{}" });
      setProject(emptyProject);
      setExperience(emptyExperience);
      setEducation(emptyEducation);
      setCourse(emptyCourse);
      setSkill(emptySkill);
      setGallery(emptyGallery);
      setPublication(emptyPublication);
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onImage(event, apply, maxDim = 800, quality = 0.85) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const dataUrl = await compressImage(file, maxDim, quality);
      const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl }) });
      apply(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onGalleryImage(event, apply) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const dataUrl = await compressGalleryImage(file);
      const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl }) });
      apply(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onLogoImage(event, apply) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const dataUrl = await compressLogoImage(file);
      const { url } = await api("/api/upload", { method: "POST", body: JSON.stringify({ dataUrl }) });
      apply(url);
    } catch (err) {
      setError(err.message);
    }
  }

  function saveProject(event) {
    event.preventDefault();
    const stack = project.stack.split(",").map((item) => item.trim()).filter(Boolean);
    persist(
      "projects",
      project.id,
      {
        title: project.title,
        stack,
        live: project.live,
        github: project.github,
        description: project.description,
        cover: project.cover,
      },
      () => setProject(emptyProject)
    );
  }

  return (
    <div id="admin-dashboard-modal" className={`fixed inset-0 z-[70] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 ${open ? "" : "hidden"}`}>
      <div className="glass-panel w-full max-w-5xl rounded-3xl p-6 space-y-6 relative max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full border border-cream-border dark:border-dark-border z-10" aria-label="Close console">
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10 border-b border-cream-border dark:border-dark-border pb-4">
          <div>
            <h3 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-amber-500" /> Backend Database Console
            </h3>
            <p className="text-xs text-cream-muted dark:text-dark-muted">
              Manage projects, skills, institution images, certificates, gallery albums, and publications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={seed} disabled={saving} className="text-xs px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-medium transition-colors flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Default DB Seed
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs px-3.5 py-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-medium transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Exit Admin
            </button>
          </div>
        </div>

        {error && <p className="text-xs font-mono text-rose-400">{error}</p>}

        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-cream-border dark:border-dark-border text-xs font-semibold">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`admin-tab-btn px-4 py-2 rounded-xl whitespace-nowrap ${activeTab === id ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-stone-500/10 text-stone-400 hover:bg-stone-500/20"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "projects" && (
          <div className="space-y-6">
            <form onSubmit={saveProject} className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50">
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Project Record
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Project Title">
                  <input required value={project.title} onChange={(event) => setProject({ ...project, title: event.target.value })} type="text" placeholder="e.g. Nexus Analytics" className={inputClass} />
                </Field>
                <Field label="Tech Stack (comma separated)">
                  <input required value={project.stack} onChange={(event) => setProject({ ...project, stack: event.target.value })} type="text" placeholder="React, TypeScript, Tailwind" className={inputClass} />
                </Field>
                <Field label="Deployed Live Link URL">
                  <input value={project.live} onChange={(event) => setProject({ ...project, live: event.target.value })} type="url" placeholder="https://app.example.com" className={inputClass} />
                </Field>
                <Field label="GitHub Repo URL">
                  <input value={project.github} onChange={(event) => setProject({ ...project, github: event.target.value })} type="url" placeholder="https://github.com/..." className={inputClass} />
                </Field>
              </div>
              <Field label="Description (1-2 lines)">
                <input required value={project.description} onChange={(event) => setProject({ ...project, description: event.target.value })} type="text" placeholder="Real-time web metrics intelligence platform..." className={inputClass} />
              </Field>
              <UploadField
                label="Project Cover Image (Upload or Image URL)"
                value={project.cover}
                onChange={(cover) => setProject({ ...project, cover })}
                onFile={(event) => onImage(event, (cover) => setProject((current) => ({ ...current, cover })), 600, 0.8)}
                uploadLabel="Upload File"
              />
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setProject(emptyProject)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Project Record</button>
              </div>
            </form>
            <div className="space-y-2">
              {data.projects.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.cover} alt="Fatima Azeemi AI Engineer" className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <h5 className="font-bold">{item.title}</h5>
                      <p className="text-[10px] text-stone-400">{(item.stack || []).join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setProject({ ...item, stack: (item.stack || []).join(", "), live: item.live || "", github: item.github || "", cover: item.cover || "" })} className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200">Edit</button>
                    <button type="button" onClick={() => remove("projects", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "skills" && (
          <div className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist(
                  "skills",
                  skill.id,
                  {
                    name: skill.name,
                    row: Number(skill.row),
                    icon: skill.row === "2" ? skill.icon : "",
                  },
                  () => setSkill(emptySkill)
                );
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Skill
              </h4>
              <p className="text-[11px] text-stone-400">
                Rows 1 and 3 are text-only marquees. Row 2 is the icon strip — upload a skill icon for middle-row items.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Skill Name">
                  <input required value={skill.name} onChange={(event) => setSkill({ ...skill, name: event.target.value })} type="text" placeholder="e.g. GraphQL" className={inputClass} />
                </Field>
                <Field label="Target Marquee Row">
                  <select value={skill.row} onChange={(event) => setSkill({ ...skill, row: event.target.value, icon: event.target.value === "2" ? skill.icon : "" })} className={inputClass}>
                    <option value="1">Row 1 — Text only</option>
                    <option value="2">Row 2 — Icons</option>
                    <option value="3">Row 3 — Text only</option>
                  </select>
                </Field>
              </div>
              {skill.row === "2" && (
                <UploadField
                  label="Skill Icon (required for middle row)"
                  value={skill.icon}
                  onChange={(icon) => setSkill({ ...skill, icon })}
                  onFile={(event) => onLogoImage(event, (icon) => setSkill((current) => ({ ...current, icon })))}
                />
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSkill(emptySkill)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Skill</button>
              </div>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {data.skills.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon ? <img src={item.icon} alt="Fatima Azeemi AI Engineer" className="w-8 h-8 rounded-lg object-contain bg-stone-800 p-1" /> : null}
                    <div className="min-w-0">
                      <span className="font-semibold block truncate">{item.name}</span>
                      <span className="text-[10px] text-stone-400">Row {item.row || 1}{item.row === 2 ? " · icon" : " · text"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setSkill({ id: item.id, name: item.name || "", row: String(item.row || 1), icon: item.icon || "" })} className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700">Edit</button>
                    <button type="button" onClick={() => remove("skills", item.id)} className="p-1 rounded text-rose-400 hover:bg-rose-500/20" aria-label={`Delete ${item.name}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "experience" && (
          <div className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("experience", experience.id, experience, () => setExperience(emptyExperience));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Experience Route Stop
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Job Title">
                  <input required value={experience.title} onChange={(event) => setExperience({ ...experience, title: event.target.value })} type="text" placeholder="Senior Engineer" className={inputClass} />
                </Field>
                <Field label="Company Name">
                  <input required value={experience.company} onChange={(event) => setExperience({ ...experience, company: event.target.value })} type="text" placeholder="MetaLabs Inc." className={inputClass} />
                </Field>
                <Field label="Duration / Dates">
                  <input required value={experience.duration} onChange={(event) => setExperience({ ...experience, duration: event.target.value })} type="text" placeholder="2023 — Present" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employment Type">
                  <input required value={experience.type} onChange={(event) => setExperience({ ...experience, type: event.target.value })} type="text" placeholder="Full-time" className={inputClass} />
                </Field>
                <UploadField
                  label="Company / Institution Image"
                  value={experience.logo}
                  onChange={(logo) => setExperience({ ...experience, logo })}
                  onFile={(event) => onLogoImage(event, (logo) => setExperience((current) => ({ ...current, logo })))}
                  uploadLabel="Upload image"
                />
              </div>
              <Field label="Description (2-3 lines)">
                <textarea required rows={2} value={experience.description} onChange={(event) => setExperience({ ...experience, description: event.target.value })} placeholder="Architected microservices and core web platform..." className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setExperience(emptyExperience)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Experience Stop</button>
              </div>
            </form>
            <div className="space-y-2">
              {data.experience.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-3">
                    {item.logo ? <img src={item.logo} alt="Fatima Azeemi AI Engineer" className="w-10 h-10 rounded-lg object-cover" /> : null}
                    <div>
                      <h5 className="font-bold">{item.title}</h5>
                      <p className="text-[10px] text-stone-400">{item.company} ({item.duration})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setExperience({ ...emptyExperience, ...item, logo: item.logo || "" })} className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200">Edit</button>
                    <button type="button" onClick={() => remove("experience", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "education" && (
          <div className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("education", education.id, education, () => setEducation(emptyEducation));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Education Step
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Step Badge Label">
                  <input required value={education.stepLabel} onChange={(event) => setEducation({ ...education, stepLabel: event.target.value })} type="text" placeholder="Step 03 / Master's Level" className={inputClass} />
                </Field>
                <Field label="Degree / Qualification">
                  <input required value={education.degree} onChange={(event) => setEducation({ ...education, degree: event.target.value })} type="text" placeholder="M.S. in Computer Science" className={inputClass} />
                </Field>
                <Field label="Institution Name">
                  <input required value={education.school} onChange={(event) => setEducation({ ...education, school: event.target.value })} type="text" placeholder="Stanford University" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Years / Duration">
                  <input required value={education.dates} onChange={(event) => setEducation({ ...education, dates: event.target.value })} type="text" placeholder="2020 — 2022" className={inputClass} />
                </Field>
                <UploadField
                  label="Institution Image"
                  value={education.logo}
                  onChange={(logo) => setEducation({ ...education, logo })}
                  onFile={(event) => onLogoImage(event, (logo) => setEducation((current) => ({ ...current, logo })))}
                  uploadLabel="Upload image"
                />
              </div>
              <Field label="Details & Specializations">
                <textarea required rows={2} value={education.description} onChange={(event) => setEducation({ ...education, description: event.target.value })} placeholder="Specialization in AI & Distributed Systems..." className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEducation(emptyEducation)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Education Step</button>
              </div>
            </form>
            <div className="space-y-2">
              {data.education.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-3">
                    {item.logo ? <img src={item.logo} alt="Fatima Azeemi AI Engineer" className="w-10 h-10 rounded-lg object-cover" /> : null}
                    <div>
                      <h5 className="font-bold">{item.degree}</h5>
                      <p className="text-[10px] text-stone-400">{item.school}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEducation({ ...emptyEducation, ...item, logo: item.logo || "" })} className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200">Edit</button>
                    <button type="button" onClick={() => remove("education", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("courses", course.id, course, () => setCourse(emptyCourse));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Certification Record
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Course Title">
                  <input required value={course.title} onChange={(event) => setCourse({ ...course, title: event.target.value })} type="text" placeholder="AWS Solutions Architect" className={inputClass} />
                </Field>
                <Field label="Issuing Authority Name">
                  <input required value={course.issuer} onChange={(event) => setCourse({ ...course, issuer: event.target.value })} type="text" placeholder="Amazon Web Services" className={inputClass} />
                </Field>
                <Field label="Specialization / Domain">
                  <input required value={course.spec} onChange={(event) => setCourse({ ...course, spec: event.target.value })} type="text" placeholder="Cloud Engineering" className={inputClass} />
                </Field>
              </div>
              <Field label="Verification Link">
                <input value={course.link} onChange={(event) => setCourse({ ...course, link: event.target.value })} type="url" placeholder="https://aws.amazon.com" className={inputClass} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UploadField
                  label="Issuing Authority Logo (shown on top of card)"
                  value={course.issuerLogo}
                  onChange={(issuerLogo) => setCourse({ ...course, issuerLogo })}
                  onFile={(event) => onLogoImage(event, (issuerLogo) => setCourse((current) => ({ ...current, issuerLogo })))}
                />
                <UploadField
                  label="Certificate Image / Credential Photo"
                  value={course.certificate}
                  onChange={(certificate) => setCourse({ ...course, certificate })}
                  onFile={(event) => onGalleryImage(event, (certificate) => setCourse((current) => ({ ...current, certificate })))}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCourse(emptyCourse)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Credential</button>
              </div>
            </form>
            <div className="space-y-2">
              {data.courses.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-3">
                    {(item.issuerLogo || item.logo) ? <img src={item.issuerLogo || item.logo} alt="Fatima Azeemi AI Engineer" className="w-10 h-10 rounded-lg object-cover" /> : null}
                    <div>
                      <h5 className="font-bold">{item.title}</h5>
                      <p className="text-[10px] text-stone-400">{item.issuer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCourse({
                          ...emptyCourse,
                          ...item,
                          link: item.link || "",
                          issuerLogo: item.issuerLogo || item.logo || "",
                          certificate: item.certificate || "",
                        })
                      }
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove("courses", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "gallery" && (
          <div className="space-y-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("albums", album.id, album, () => setAlbum(emptyAlbum));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Album
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Album Title">
                  <input required value={album.title} onChange={(event) => setAlbum({ ...album, title: event.target.value })} type="text" placeholder="Travel & Landscapes" className={inputClass} />
                </Field>
                <UploadField
                  label="Album Cover Image"
                  value={album.cover}
                  onChange={(cover) => setAlbum({ ...album, cover })}
                  onFile={(event) => onGalleryImage(event, (cover) => setAlbum((current) => ({ ...current, cover })))}
                  uploadLabel="Upload cover"
                />
              </div>
              <Field label="Description">
                <input value={album.description} onChange={(event) => setAlbum({ ...album, description: event.target.value })} type="text" placeholder="Short note about this album" className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setAlbum(emptyAlbum)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Album</button>
              </div>
            </form>

            <div className="space-y-2">
              {(data.albums || []).map((item) => {
                const count = (data.gallery || []).filter((photo) => photo.albumId === item.id).length;
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.cover ? <img src={item.cover} alt="Fatima Azeemi AI Engineer" className="w-12 h-12 rounded-lg object-cover shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-stone-800 shrink-0" />}
                      <div className="min-w-0">
                        <h5 className="font-bold truncate">{item.title}</h5>
                        <p className="text-[10px] text-stone-400">{count} photo{count === 1 ? "" : "s"}{item.description ? ` · ${item.description}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => setAlbum({ ...emptyAlbum, ...item, cover: item.cover || "", description: item.description || "" })} className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200">Edit</button>
                      <button type="button" onClick={() => remove("albums", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("gallery", gallery.id, gallery, () => setGallery(emptyGallery));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Gallery Photo
              </h4>
              <UploadField
                label="Photo Upload or URL"
                value={gallery.url}
                onChange={(url) => setGallery({ ...gallery, url })}
                onFile={(event) => onGalleryImage(event, (url) => setGallery((current) => ({ ...current, url })))}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Caption">
                  <input value={gallery.caption} onChange={(event) => setGallery({ ...gallery, caption: event.target.value })} type="text" placeholder="Workspace setup" className={inputClass} />
                </Field>
                <Field label="Album">
                  <select
                    value={gallery.albumId}
                    onChange={(event) => setGallery({ ...gallery, albumId: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Uncategorized</option>
                    {(data.albums || []).map((item) => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setGallery(emptyGallery)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Photo</button>
              </div>
            </form>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data.gallery || []).map((item) => {
                const albumTitle = (data.albums || []).find((entry) => entry.id === item.albumId)?.title || "Uncategorized";
                return (
                  <div key={item.id} className="rounded-xl overflow-hidden bg-stone-900 border border-stone-800">
                    <img src={item.url} alt={item.caption || "Fatima Azeemi AI Engineer"} className="w-full aspect-square object-cover" />
                    <div className="p-3 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="block truncate text-stone-300">{item.caption || "Untitled"}</span>
                        <span className="block truncate text-[10px] text-stone-500">{albumTitle}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setGallery({ id: item.id, url: item.url || "", caption: item.caption || "", albumId: item.albumId || "" })}
                          className="px-2 py-1 rounded bg-stone-800"
                        >
                          Edit
                        </button>
                        <button type="button" onClick={() => remove("gallery", item.id)} className="px-2 py-1 rounded bg-rose-500/20 text-rose-400">Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "publications" && (
          <div className="space-y-6">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                persist("publications", publication.id, publication, () => setPublication(emptyPublication));
              }}
              className="glass-panel p-5 rounded-2xl space-y-4 border border-stone-700/50"
            >
              <h4 className="font-heading font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Add / Edit Publication
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Title">
                  <input required value={publication.title} onChange={(event) => setPublication({ ...publication, title: event.target.value })} type="text" placeholder="Paper or article title" className={inputClass} />
                </Field>
                <Field label="Authors">
                  <input value={publication.authors} onChange={(event) => setPublication({ ...publication, authors: event.target.value })} type="text" placeholder="Fatima, et al." className={inputClass} />
                </Field>
                <Field label="Venue / Journal">
                  <input value={publication.venue} onChange={(event) => setPublication({ ...publication, venue: event.target.value })} type="text" placeholder="Systems Engineering Journal" className={inputClass} />
                </Field>
                <Field label="Year">
                  <input value={publication.year} onChange={(event) => setPublication({ ...publication, year: event.target.value })} type="text" placeholder="2024" className={inputClass} />
                </Field>
                <Field label="Link (DOI, PDF, Scholar)">
                  <input value={publication.link} onChange={(event) => setPublication({ ...publication, link: event.target.value })} type="url" placeholder="https://..." className={inputClass} />
                </Field>
                <UploadField
                  label="Cover / Thumbnail"
                  value={publication.cover}
                  onChange={(cover) => setPublication({ ...publication, cover })}
                  onFile={(event) => onImage(event, (cover) => setPublication((current) => ({ ...current, cover })), 800, 0.85)}
                />
              </div>
              <Field label="Abstract / Summary">
                <textarea rows={3} value={publication.abstract} onChange={(event) => setPublication({ ...publication, abstract: event.target.value })} placeholder="Short summary..." className={inputClass} />
              </Field>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setPublication(emptyPublication)} className="px-4 py-2 rounded-xl border border-stone-700 text-xs">Clear</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-colors">Save Publication</button>
              </div>
            </form>
            <div className="space-y-2">
              {(data.publications || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {item.cover ? <img src={item.cover} alt="Fatima Azeemi AI Engineer" className="w-12 h-12 rounded-lg object-cover" /> : null}
                    <div className="min-w-0">
                      <h5 className="font-bold truncate">{item.title}</h5>
                      <p className="text-[10px] text-stone-400 truncate">{[item.venue, item.year].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPublication({
                          ...emptyPublication,
                          ...item,
                          authors: item.authors || "",
                          venue: item.venue || "",
                          year: item.year || "",
                          link: item.link || "",
                          cover: item.cover || "",
                          abstract: item.abstract || "",
                        })
                      }
                      className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => remove("publications", item.id)} className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
