import { cookies } from "next/headers";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function requireAdmin() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return await verifyAdminSessionToken(token);
}
