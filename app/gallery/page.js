import { cookies } from "next/headers";
import GalleryView from "@/components/GalleryView";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Photo Gallery | 0xfatima",
  description: "Photo albums by Fatima Azeemi.",
};

export default async function GalleryPage() {
  const jar = await cookies();
  const admin = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  return <GalleryView initialData={await getDb()} initialAdmin={admin} albumId={null} />;
}
