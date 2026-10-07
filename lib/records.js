import { randomUUID } from "crypto";
import { HttpError } from "./errors";
import { persistImage } from "./images";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80";

function text(value, max, required, label) {
  if (value == null || value === "") {
    if (required) throw new HttpError(400, `${label} is required`);
    return "";
  }
  if (typeof value !== "string") throw new HttpError(400, `${label} is invalid`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new HttpError(400, `${label} is required`);
  if (trimmed.length > max) throw new HttpError(400, `${label} is too long`);
  return trimmed;
}

async function httpUrl(value, label, required = false) {
  const trimmed = text(value, 2000, required, label);
  if (!trimmed) return "";
  if (trimmed.startsWith("data:image") || trimmed.startsWith("/uploads/")) {
    return persistImage(trimmed);
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new HttpError(400, `${label} must be a valid URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new HttpError(400, `${label} must start with http or https`);
  }
  return trimmed;
}

async function buildProject(input, id) {
  const stackSource = Array.isArray(input.stack)
    ? input.stack
    : typeof input.stack === "string"
      ? input.stack.split(",")
      : [];
  const stack = stackSource.map((item) => text(String(item), 40, false, "Tech stack")).filter(Boolean);
  if (!stack.length) throw new HttpError(400, "Tech stack is required");
  if (stack.length > 20) throw new HttpError(400, "Tech stack is too long");

  const cover = (await httpUrl(input.cover, "Cover image")) || DEFAULT_COVER;
  return {
    id,
    title: text(input.title, 140, true, "Project title"),
    stack,
    description: text(input.description, 800, true, "Description"),
    live: await httpUrl(input.live, "Live link"),
    github: await httpUrl(input.github, "GitHub link"),
    cover,
    gallery: [cover],
  };
}

async function buildSkill(input, id) {
  const row = Number(input.row);
  if (![1, 2, 3].includes(row)) throw new HttpError(400, "Target row must be 1, 2, or 3");
  const icon = row === 2 ? await httpUrl(input.icon, "Skill icon") : "";
  if (row === 2 && !icon) throw new HttpError(400, "Middle row skills need an icon");
  return {
    id,
    name: text(input.name, 60, true, "Skill name"),
    row,
    icon,
  };
}

async function buildExperience(input, id) {
  return {
    id,
    title: text(input.title, 140, true, "Job title"),
    company: text(input.company, 140, true, "Company name"),
    duration: text(input.duration, 80, true, "Duration"),
    type: text(input.type, 40, true, "Employment type"),
    logo: await httpUrl(input.logo, "Company logo"),
    description: text(input.description, 1200, true, "Description"),
  };
}

async function buildEducation(input, id) {
  return {
    id,
    stepLabel: text(input.stepLabel, 80, true, "Step label"),
    degree: text(input.degree, 160, true, "Degree"),
    school: text(input.school, 160, true, "Institution"),
    dates: text(input.dates, 80, true, "Years"),
    logo: await httpUrl(input.logo, "Institution logo"),
    description: text(input.description, 1200, true, "Details"),
  };
}

async function buildCourse(input, id) {
  return {
    id,
    title: text(input.title, 160, true, "Course title"),
    issuer: text(input.issuer, 160, true, "Issuing authority"),
    spec: text(input.spec, 80, true, "Specialization"),
    link: await httpUrl(input.link, "Verification link"),
    issuerLogo: await httpUrl(input.issuerLogo || input.logo, "Issuing authority logo"),
    certificate: await httpUrl(input.certificate, "Certificate image"),
  };
}

async function buildAlbum(input, id) {
  return {
    id,
    title: text(input.title, 120, true, "Album title"),
    description: text(input.description, 400, false, "Album description"),
    cover: await httpUrl(input.cover, "Album cover"),
  };
}

async function buildGallery(input, id) {
  const url = await httpUrl(input.url, "Photo", true);
  return {
    id,
    url,
    caption: text(input.caption, 140, false, "Caption"),
    albumId: text(input.albumId, 80, false, "Album"),
  };
}

async function buildPublication(input, id) {
  return {
    id,
    title: text(input.title, 220, true, "Publication title"),
    authors: text(input.authors, 220, false, "Authors"),
    venue: text(input.venue, 160, false, "Venue"),
    year: text(input.year, 12, false, "Year"),
    link: await httpUrl(input.link, "Publication link"),
    cover: await httpUrl(input.cover, "Cover image"),
    abstract: text(input.abstract, 1200, false, "Abstract"),
  };
}

export async function buildRecord(collection, input, existingId) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new HttpError(400, "Invalid body");
  }
  const id = existingId || randomUUID();
  switch (collection) {
    case "projects":
      return buildProject(input, id);
    case "skills":
      return buildSkill(input, id);
    case "experience":
      return buildExperience(input, id);
    case "education":
      return buildEducation(input, id);
    case "courses":
      return buildCourse(input, id);
    case "albums":
      return buildAlbum(input, id);
    case "gallery":
      return buildGallery(input, id);
    case "publications":
      return buildPublication(input, id);
    default:
      throw new HttpError(404, "Unknown collection");
  }
}
