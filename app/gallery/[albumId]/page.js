import { cookies } from "next/headers";
import GalleryView from "@/components/GalleryView";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { albumId } = await params;
  const db = await getDb();
  const album = (db.albums || []).find((item) => item.id === albumId);
  const title = album ? album.title : albumId === "uncategorized" ? "Uncategorized" : "Album";
  return { title: `${title} | Photo Gallery | 0xfatima` };
}

export default async function AlbumPage({ params }) {
  const { albumId } = await params;
  const jar = await cookies();
  const admin = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  return <GalleryView initialData={await getDb()} initialAdmin={admin} albumId={albumId} />;
}
