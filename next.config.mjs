import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: root,
  // The CV is read from disk by /api/cv, so ship it with that function.
  outputFileTracingIncludes: {
    "/api/cv": ["./private/**/*"],
  },
};

export default nextConfig;
