import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db, requireDemo } from "./db";
import { demoAccounts } from "./catalog";

const cookie = "derm_session";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export async function session() {
  requireDemo();
  const token = (await cookies()).get(cookie)?.value;
  if (!token) return null;
  const row = await db.session.findUnique({ where: { hash: digest(token) }, include: { user: true } });
  return row && row.expires > new Date() ? row.user : null;
}
export async function logout() {
  requireDemo();
  const jar = await cookies();
  const token = jar.get(cookie)?.value;
  if (token) await db.session.deleteMany({ where: { hash: digest(token) } });
  jar.delete(cookie);
}
export async function login(id: string, secure: boolean) {
  requireDemo();
  if (!demoAccounts.some(account => account.id === id)) return false;
  await logout();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 86400000);
  await db.session.create({ data: { hash: digest(token), userId: id, expires } });
  (await cookies()).set(cookie, token, { httpOnly: true, sameSite: "lax", secure, expires, path: "/" });
  return true;
}
