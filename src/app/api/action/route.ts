import { z } from "zod";
import { login, logout, session } from "@/lib/auth";
import { fail, mutationGuard } from "@/lib/http";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { check, lock, mutate } from "@/lib/workflow";

export async function POST(request: Request) {
  try {
    mutationGuard(request);
    const body = z.object({type:z.string()}).passthrough().parse(await request.json());
    if (body.type === "login") {
      const id = z.string().parse(body.id);
      check(await login(id,new URL(process.env.APP_ORIGIN ?? request.url).protocol === "https:"),"حساب نمونه یافت نشد.",404);
      return Response.json({data:{}});
    }
    if (body.type === "logout") {
      await logout();
      return Response.json({data:{}});
    }
    const user = await session();
    check(user,"ابتدا وارد شوید.",401,"UNAUTHENTICATED");
    if (body.type === "remove-file") {
      const id = z.uuid().parse(body.id);
      await db.$transaction(async tx=>{
        await lock(tx);
        const file = await tx.attachment.findUnique({where:{id},include:{case:{include:{queue:true}}}});
        check(file?.ownerId===user.id,"فایل یافت نشد.",404);
        check(user.role==="PATIENT" && !file.episodeId && file.case.queue?.state==="PREPARING");
        await tx.attachment.delete({where:{id}});
      });
      await Promise.allSettled([storage.remove(id,"original"),storage.remove(id,"preview")]);
      return Response.json({data:{}});
    }
    return Response.json({data:await mutate(user,body)});
  } catch(error) { return fail(error); }
}
