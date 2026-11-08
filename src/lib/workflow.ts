import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { areas, demoPrice } from "./catalog";
import { storage } from "./storage";
import type { Prisma, User } from "../generated/prisma/client";
import type { InitialPhoto } from "./prepare-image";

export class WorkflowError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export function check(ok: unknown, message = "این اقدام در وضعیت فعلی مجاز نیست.", status = 409, code = "INVALID_STATE"): asserts ok {
  if (!ok) throw new WorkflowError(status, code, message);
}
const uuid = z.uuid();
const selected = z.array(z.enum(areas)).min(1).max(3);
const text = z.string().trim().min(1).max(5000);
const concern = z.string().trim().min(10).max(3000);
const action = z.discriminatedUnion("type", [
  z.strictObject({type:z.literal("request"), areas:selected, concern:concern.optional(), concerns:z.partialRecord(z.enum(areas),concern).optional(), consent:z.literal(true)}),
  z.strictObject({type:z.enum(["approve","prepare","start","resume","advance"]), id:uuid}),
  z.strictObject({type:z.enum(["reject","hold","correct"]), id:uuid, reason:text}),
  z.strictObject({type:z.literal("pay"), id:uuid, result:z.enum(["VERIFIED","FAILED","CANCELLED"])}),
  z.strictObject({type:z.literal("intake"), id:uuid, history:z.string().trim().max(5000), duration:z.string().trim().max(150), goal:z.string().trim().max(1000).default(""), height:z.string().trim().max(12).default(""), weight:z.string().trim().max(12).default(""), submit:z.boolean()}),
  z.strictObject({type:z.literal("note"), id:uuid, body:z.string().trim().max(5000)}),
  z.strictObject({type:z.literal("close"), id:uuid, episodeId:uuid}),
  z.strictObject({type:z.literal("message"), id:uuid, episodeId:uuid, clientId:uuid, body:z.string().trim().max(5000), files:z.array(uuid).max(6).default([]), urgent:z.boolean().default(false)}),
  z.strictObject({type:z.literal("edit-message"), id:uuid, messageId:uuid, body:text}),
  z.strictObject({type:z.literal("delete-message"), id:uuid, messageId:uuid}),
]);
type Tx = Prisma.TransactionClient;
export function allowed(user: User, patientId: string) {
  return user.role === "DOCTOR" || user.id === patientId;
}
export async function lock(tx: Tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(481731)`;
}
export function canWrite(episode: { state: string; eligibleAt: Date | null }, role: string, now: Date) {
  if (episode.state === "OPEN") return true;
  if (episode.state === "SCHEDULED") {
    return role === "DOCTOR" || (role === "PATIENT" && Boolean(episode.eligibleAt && now >= episode.eligibleAt));
  }
  return false;
}
export function canSendUrgent(episode: { number: number; state: string }, role: string) {
  return role === "PATIENT" && episode.number > 0 && (episode.state === "SCHEDULED" || episode.state === "OPEN");
}
const demoInterval = () => {
  const days = Number(process.env.FOLLOWUP_INTERVAL_DAYS ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error("Invalid FOLLOWUP_INTERVAL_DAYS");
  return days * 86400000;
};

export async function mutate(user: User, input: unknown, photos: Partial<Record<(typeof areas)[number], InitialPhoto[]>> = {}) {
  const data = action.parse(input);
  const result = await db.$transaction(async tx => {
    await lock(tx);
    if (data.type === "request") {
      check(user.role === "PATIENT", "دسترسی مجاز نیست.", 403, "ROLE_FORBIDDEN");
      const open = await tx.case.findFirst({where:{patientId:user.id,status:{in:["PENDING_REVIEW","AWAITING_PAYMENT","QUEUED","IN_INITIAL_CONSULTATION"]}},select:{id:true}});
      check(!open,"یک درخواست اولیهٔ باز دارید.");
      const chosen = areas.filter(area => data.areas.includes(area));
      check(Object.keys(photos).every(area=>data.areas.some(selected=>selected===area)),"موضوع تصویر را از میان موضوعات انتخاب‌شده تعیین کنید.",422,"VALIDATION_ERROR");
      const packageId = chosen.length > 1 ? randomUUID() : null;
      let firstId: string | undefined;
      for (const area of chosen) {
        const description = data.concerns ? data.concerns[area] : data.concern;
        check(description,"شرح مشکل را برای هر موضوع وارد کنید.",422,"VALIDATION_ERROR");
        const {id} = await tx.case.create({
          data:{
            patientId:user.id, packageId, areas:[area], concern:description, amount:BigInt(demoPrice),
            files:{create:photos[area]?.map(photo=>({...photo,ownerId:user.id,initial:true}))??[]},
          },
          select:{id:true},
        });
        firstId ??= id;
      }
      check(firstId);
      return {id:firstId};
    }
    const c = await tx.case.findUnique({ where:{id:data.id}, include:{queue:true,episodes:{orderBy:{number:"asc"}}} });
    check(c && allowed(user,c.patientId), "پرونده یافت نشد.",404,"RESOURCE_NOT_FOUND");
    const patientOnly = data.type === "pay" || data.type === "intake";
    if (data.type !== "message" && data.type !== "edit-message" && data.type !== "delete-message") check(user.role === (patientOnly ? "PATIENT" : "DOCTOR"), "دسترسی مجاز نیست.",403,"ROLE_FORBIDDEN");
    const id = c.id;
    const now = c.demoNow ?? new Date();
    const queue = c.queue;
    const notice = (key:string, caseId:string, message:string) => tx.notice.upsert({where:{key},create:{key,caseId,text:message},update:{}});
    const setQueue = (state:string) => tx.queueEntry.update({where:{caseId:id},data:{state}});
    switch (data.type) {
      case "approve":
        check(c.status === "PENDING_REVIEW");
        await tx.case.update({where:{id},data:{status:"AWAITING_PAYMENT"}});
        break;
      case "reject":
        check(c.status === "PENDING_REVIEW");
        await tx.case.update({where:{id},data:{status:"REJECTED",reason:data.reason}});
        break;
      case "pay": {
        if (queue && data.result === "VERIFIED") return {id};
        check(c.status === "AWAITING_PAYMENT");
        const bundle = c.packageId ? await tx.case.findMany({
          where:{patientId:c.patientId,packageId:c.packageId},
          select:{id:true,status:true,areas:true},
        }) : [c];
        check(!bundle.some(item=>item.status==="PENDING_REVIEW"),"پس از بررسی همهٔ پرونده‌های پکیج، پرداخت فعال می‌شود.");
        const payable = bundle.filter(item=>item.status==="AWAITING_PAYMENT").sort(
          (a,b)=>areas.findIndex(area=>area===a.areas[0])-areas.findIndex(area=>area===b.areas[0]),
        );
        await tx.payment.create({data:{caseId:payable[0].id,amount:c.amount,result:data.result}});
        if (data.result === "VERIFIED") {
          for (const item of payable) {
            await tx.queueEntry.create({data:{caseId:item.id}});
            await tx.case.update({where:{id:item.id},data:{status:"QUEUED"}});
          }
        }
        break;
      }
      case "prepare":
        if (queue?.state === "PREPARING") return {id};
        check(queue?.state === "WAITING");
        await setQueue("PREPARING");
        await notice(`prepare:${id}`,id,"لطفاً اطلاعات و تصاویر پرونده را تکمیل کنید.");
        break;
      case "intake":
        check(queue?.state === "PREPARING");
        if (data.submit) {
          check(data.history && (c.areas.every(area=>area==="DIET") || data.duration) && (!c.areas.includes("DIET") || data.goal),"فیلدهای مربوط به پکیج را تکمیل کنید.",422,"VALIDATION_ERROR");
        }
        for (const value of [data.height,data.weight]) {
          check(!value || (Number.isFinite(Number(value)) && Number(value)>0),"قد و وزن را به صورت عدد مثبت وارد کنید.",422,"VALIDATION_ERROR");
        }
        if (data.submit && c.areas.some(area=>area !== "DIET")) {
          check(await tx.attachment.count({where:{caseId:id,episodeId:null,initial:false}}), "حداقل یک تصویر برای تکمیل پروندهٔ پوست یا مو اضافه کنید.",422,"VALIDATION_ERROR");
        }
        await tx.case.update({where:{id},data:{intake:{history:data.history,duration:data.duration,...(c.areas.includes("DIET")?{goal:data.goal,height:data.height,weight:data.weight}:{})},reason:null}});
        if (data.submit) await setQueue("READY");
        break;
      case "correct":
        check(queue?.state === "READY");
        await tx.case.update({where:{id},data:{reason:data.reason}});
        await setQueue("PREPARING");
        break;
      case "hold":
        check(queue && ["WAITING","PREPARING","READY"].includes(queue.state));
        await tx.queueEntry.update({where:{caseId:id},data:{state:"ON_HOLD",previous:queue.state,holdReason:data.reason}});
        break;
      case "resume":
        check(queue?.state === "ON_HOLD" && queue.previous);
        await tx.queueEntry.update({where:{caseId:id},data:{state:queue.previous,previous:null,holdReason:null}});
        break;
      case "start": {
        if (queue?.state === "IN_PROGRESS") return {id};
        check(queue?.state === "READY" && c.intake);
        check(!(await tx.queueEntry.findFirst({where:{state:"IN_PROGRESS"}})), "ابتدا بررسی پروندهٔ فعال را تمام کنید.");
        const first = await tx.queueEntry.findFirst({where:{state:{in:["WAITING","PREPARING","READY"]}},orderBy:{ordinal:"asc"}});
        check(first?.caseId === id, "ابتدا پروندهٔ جلوی صف را بررسی یا موکول کنید.");
        await setQueue("IN_PROGRESS");
        await tx.case.update({where:{id},data:{status:"IN_INITIAL_CONSULTATION"}});
        await tx.episode.create({data:{caseId:id,number:0,state:"OPEN"}});
        const next = await tx.queueEntry.findFirst({where:{state:{in:["WAITING","PREPARING","READY"]}},orderBy:{ordinal:"asc"}});
        if (next) await notice(`next:${id}`,next.caseId,"نوبت بررسی پروندهٔ شما نزدیک شده است.");
        break;
      }
      case "note":
        await tx.case.update({where:{id},data:{note:data.body}});
        break;
      case "advance": {
        const episode = c.episodes.find(e=>e.state === "SCHEDULED");
        check(episode?.eligibleAt);
        await tx.case.update({where:{id},data:{demoNow:new Date(Math.max(now.getTime(),episode.eligibleAt.getTime()))}});
        break;
      }
      case "message": {
        const episode = c.episodes.find(e=>e.id === data.episodeId);
        check(episode,"گفت‌وگو یافت نشد.",404,"RESOURCE_NOT_FOUND");
        const existing = await tx.message.findUnique({where:{episodeId_clientId:{episodeId:episode.id,clientId:data.clientId}}});
        if (existing?.author === user.id) return {id};
        const writable = canWrite(episode,user.role,now);
        if (data.urgent) check(canSendUrgent(episode,user.role),"ارسال مورد ضروری فقط برای بیمار در پیگیری فعال مجاز است.",403,"URGENT_FORBIDDEN");
        check(writable || data.urgent,episode.state === "SCHEDULED" ? "موعد پیگیری هنوز نرسیده است." : "گفت‌وگو بسته است.",episode.state === "SCHEDULED" ? 423 : 409,episode.state === "SCHEDULED" ? "FOLLOWUP_NOT_DUE" : "EPISODE_CLOSED");
        check(writable || !data.files.length,"پیش از موعد، مورد ضروری را به صورت متن بفرستید.",422,"VALIDATION_ERROR");
        check(data.body || data.files.length, "متن یا تصویر اضافه کنید.",422,"VALIDATION_ERROR");
        const attachments = await tx.attachment.findMany({where:{id:{in:data.files},caseId:id,episodeId:episode.id,ownerId:user.id,messageId:null}});
        check(attachments.length === data.files.length,"پیوست مجاز نیست.",422,"VALIDATION_ERROR");
        if (episode.state === "SCHEDULED" && user.role === "PATIENT" && writable) await tx.episode.update({where:{id:episode.id},data:{state:"OPEN"}});
        await tx.message.create({data:{episodeId:episode.id,clientId:data.clientId,author:user.id,body:data.body,urgent:data.urgent,files:{connect:attachments.map(file=>({id:file.id}))}}});
        break;
      }
      case "edit-message":
      case "delete-message": {
        const message = await tx.message.findFirst({
          where: { id: data.messageId, author: user.id, episode: { caseId: id } },
          select: { id: true, episode: { select: { state: true } }, files: { select: { id: true } } },
        });
        check(message, "پیام یافت نشد.",404,"RESOURCE_NOT_FOUND");
        check(message.episode.state !== "CLOSED", "گفت‌وگو بسته است.",409,"EPISODE_CLOSED");
        if (data.type === "edit-message") {
          await tx.message.update({ where: { id: message.id }, data: { body: data.body } });
          break;
        }
        await tx.attachment.deleteMany({ where: { messageId: message.id } });
        await tx.message.delete({ where: { id: message.id } });
        await tx.audit.create({data:{caseId:id,actor:user.id,action:data.type}});
        return { id, removedFiles: message.files };
      }
      case "close": {
        const episode = c.episodes.find(e=>e.id === data.episodeId);
        check(episode,"گفت‌وگو یافت نشد.",404,"RESOURCE_NOT_FOUND");
        if (episode.state === "CLOSED") return {id};
        check(episode.state === "OPEN");
        await tx.episode.update({where:{id:episode.id},data:{state:"CLOSED",closedAt:now}});
        if (episode.number === 0) await setQueue("DONE");
        if (episode.number < 2) {
          await tx.episode.create({data:{caseId:id,number:episode.number+1,state:"SCHEDULED",eligibleAt:new Date(now.getTime()+demoInterval())}});
          await tx.case.update({where:{id},data:{status:"FOLLOWUP_PERIOD"}});
        } else await tx.case.update({where:{id},data:{status:"CLOSED"}});
        break;
      }
    }
    await tx.audit.create({data:{caseId:id,actor:user.id,action:data.type}});
    return {id};
  },{timeout:15000});
  if ("removedFiles" in result && result.removedFiles) {
    await Promise.allSettled(result.removedFiles.flatMap(({ id }) => [storage.remove(id, "original"), storage.remove(id, "preview")]));
  }
  return { id: result.id };
}
