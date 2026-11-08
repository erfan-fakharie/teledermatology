import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

export function requireDemo() {
  if (process.env.APP_MODE !== "demo") throw new Error("This build requires APP_MODE=demo");
}
const globalDb = globalThis as typeof globalThis & { dermDb?: PrismaClient };
export const db = globalDb.dermDb ?? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
if (process.env.NODE_ENV !== "production") globalDb.dermDb = db;
