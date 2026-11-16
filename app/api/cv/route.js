import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The CV lives outside /public so it has no public download URL. Only the
// on-site viewer can fetch it: it sends a custom header (which a plain link,
// address-bar visit or <iframe>/<embed> cannot add) from the same origin.
// Note: anything a browser can display can still be captured by a determined
// visitor (screenshots, dev tools). This stops casual downloading and copying.
const CV_PATH = path.join(process.cwd(), "private", "Fatima-Azeemi-CV.pdf");

function deny() {
  return NextResponse.json({ error: "The CV can only be viewed on the website." }, { status: 403 });
}

export async function GET(req) {
  if (req.headers.get("x-cv-viewer") !== "1") return deny();
  const site = req.headers.get("sec-fetch-site");
  const dest = req.headers.get("sec-fetch-dest");
  if (site && site !== "same-origin") return deny();
  if (dest && dest !== "empty") return deny();

  try {
    const file = await readFile(CV_PATH);
    return new NextResponse(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return NextResponse.json({ error: "CV not available" }, { status: 404 });
  }
}
