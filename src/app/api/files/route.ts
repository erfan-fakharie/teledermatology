import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import { session } from "@/lib/auth";
import { db } from "@/lib/db";
import { fail, mutationGuard } from "@/lib/http";
import { storage } from "@/lib/storage";
import { allowed, canWrite, check, lock, WorkflowError } from "@/lib/workflow";

const limit = 25 * 1024 * 1024;
const formats = {jpeg:"image/jpeg",png:"image/png",webp:"image/webp"} as const;
export async function POST(request: Request) {
  let staged: string | undefined;
  try {
    mutationGuard(request);
    const user = await session();
    check(user,"ابتدا وارد شوید.",401,"UNAUTHENTICATED");
    const length = Number(request.headers.get("content-length"));
    check(length > 0 && length <= limit + 65536,"حداکثر اندازهٔ تصویر ۲۵ مگابایت است.",413,"FILE_TOO_LARGE");
    const form = await request.formData();
    const caseId = z.uuid().parse(form.get("caseId"));
    const episodeId = z.uuid().nullable().parse(form.get("episodeId"));
    const file = form.get("file");
    check(file instanceof File && file.size > 0,"تصویر انتخاب کنید.",422,"VALIDATION_ERROR");
    check(file.size <= limit,"حداکثر اندازهٔ تصویر ۲۵ مگابایت است.",413,"FILE_TOO_LARGE");
    const original = Buffer.from(await file.arrayBuffer());
    const image = sharp(original,{limitInputPixels:80000000});
    let preview: Buffer, mime: string;
    try {
      const metadata = await image.metadata();
      if (!metadata.format || !(metadata.format in formats) || (metadata.pages ?? 1) > 1) throw new Error();
      mime = formats[metadata.format as keyof typeof formats];
      preview = await image.autoOrient().resize(840,840,{fit:"inside",withoutEnlargement:true}).webp().toBuffer();
    } catch {
      throw new WorkflowError(422,"FILE_UNSUPPORTED","یک تصویر معتبر JPEG، PNG یا WebP انتخاب کنید.");
    }
    const attachment = await db.$transaction(async tx=>{
      await lock(tx);
      const c = await tx.case.findUnique({where:{id:caseId},include:{queue:true,episodes:true}});
      check(c && allowed(user,c.patientId),"پرونده یافت نشد.",404);
      if (episodeId) {
        const e = c.episodes.find(episode=>episode.id===episodeId);
        check(e,"گفت‌وگو یافت نشد.",404);
        check(canWrite(e,user.role,c.demoNow ?? new Date()),"ارسال پیوست در این مرحله مجاز نیست.",e.state==="SCHEDULED"?423:409);
      } else check(user.role==="PATIENT" && c.queue?.state==="PREPARING");
      const count = await tx.attachment.count({where:{caseId,episodeId,...(episodeId?{messageId:null,ownerId:user.id}:{})}});
      check(count < (episodeId?6:12),"حداکثر تعداد تصاویر اضافه شده است.",422);
      const id = randomUUID();
      staged = id;
      await storage.put(id,"original",original);
      await storage.put(id,"preview",preview);
      return tx.attachment.create({data:{id,caseId,episodeId,ownerId:user.id,filename:file.name.slice(0,180),mime,bytes:file.size,sha256:createHash("sha256").update(original).digest("hex")},select:{id:true,filename:true}});
    },{timeout:15000});
    return Response.json({data:attachment});
  } catch(error) {
    if (staged) await Promise.allSettled([storage.remove(staged,"original"),storage.remove(staged,"preview")]);
    return fail(error);
  }
}
