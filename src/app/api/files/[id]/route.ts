import { session } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail } from "@/lib/http";
import { storage } from "@/lib/storage";
import { allowed, check } from "@/lib/workflow";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const user = await session();
    check(user,"ابتدا وارد شوید.",401,"UNAUTHENTICATED");
    const {id} = await params;
    const file = await db.attachment.findUnique({where:{id},include:{case:{select:{patientId:true}}}});
    check(file && allowed(user,file.case.patientId) && (!file.episodeId || file.messageId || file.ownerId===user.id),"فایل یافت نشد.",404);
    const original = new URL(request.url).searchParams.get("variant")==="original";
    const bytes = await storage.get(id,original?"original":"preview");
    return new Response(new Uint8Array(bytes),{headers:{"Content-Type":original?file.mime:"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",...(original?{"X-Content-SHA256":file.sha256}:{})}});
  } catch(error) { return fail(error); }
}
