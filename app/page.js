import { cookies } from "next/headers";
import PortfolioSite from "@/components/PortfolioSite";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  const jar = await cookies();
  const admin = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  return <PortfolioSite initialData={await getDb()} initialAdmin={admin} />;
}
