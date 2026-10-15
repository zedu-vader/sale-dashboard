import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { clientIp, fail, readJson } from "@/lib/auth/http";
import {
  checkMasterKey,
  generateMasterKey,
  MASTER_KEY_MAX,
  MASTER_KEY_MIN,
  presentedMasterKey,
  storeMasterKey,
} from "@/lib/auth/master-key";
import { rateLimit } from "@/lib/auth/rate-limit";

/**
 * Sets or rotates the master key.
 * Auth: the current master key (header), or a signed-in admin. Body: { newKey? }. Without newKey a strong
 * key is generated and returned once; the server only stores its hash.
 * Not behind the session middleware (see PUBLIC_API_PREFIXES), so every branch here must authenticate.
 */
export async function PUT(req: Request) {
  if (!rateLimit(`master-key:${clientIp(req)}`, 10, 10 * 60_000)) return fail("Too many attempts. Try again later.", 429);

  let actorId: string | null = null;
  if (presentedMasterKey(req)) {
    if (!(await checkMasterKey(req))) return fail("Invalid master key.", 401);
  } else {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;
    actorId = auth.user.id;
  }

  const body = (await readJson(req)) ?? {};
  const requested = body.newKey;
  if (requested !== undefined && (typeof requested !== "string" || requested.length < MASTER_KEY_MIN || requested.length > MASTER_KEY_MAX)) {
    return fail(`newKey must be ${MASTER_KEY_MIN}-${MASTER_KEY_MAX} characters, or omit it to generate one.`);
  }

  const key = (requested as string | undefined) ?? generateMasterKey();
  const row = await storeMasterKey(key, actorId);
  return NextResponse.json({
    ok: true,
    version: row.version,
    rotatedAt: row.rotatedAt.toISOString(),
    ...(requested === undefined ? { key } : {}),
  });
}
