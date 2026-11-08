import { ZodError } from "zod";
import { WorkflowError } from "./workflow";
import { requireDemo } from "./db";
import { randomUUID } from "node:crypto";

export function mutationGuard(request: Request) {
  requireDemo();
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_ORIGIN ?? request.url);
  if (origin === expected.origin) return;

  // The local demo can be opened using either loopback name on the same port.
  if (expected.hostname === "localhost" || expected.hostname === "127.0.0.1") {
    expected.hostname = expected.hostname === "localhost" ? "127.0.0.1" : "localhost";
    if (origin === expected.origin) return;
  }

  throw new WorkflowError(403,"ORIGIN_FORBIDDEN","مبدأ درخواست معتبر نیست.");
}
export function fail(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof WorkflowError) return Response.json({code:error.code,message:error.message,requestId},{status:error.status});
  if (error instanceof ZodError || error instanceof SyntaxError) return Response.json({code:"VALIDATION_ERROR",message:"لطفاً اطلاعات ورودی را بررسی کنید.",requestId},{status:422});
  console.error("Derm request failed",requestId,error instanceof Error ? error.name : "Unknown");
  return Response.json({code:"INTERNAL_ERROR",message:"خطایی رخ داد. دوباره تلاش کنید.",requestId},{status:500});
}
