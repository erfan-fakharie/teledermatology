import { db, requireDemo } from "../src/lib/db";
import { demoAccounts, demoPrice } from "../src/lib/catalog";

requireDemo();
try {
  await db.$transaction(async tx=>{
    for (const account of demoAccounts) await tx.user.upsert({where:{id:account.id},create:account,update:{name:account.name}});
    const queueId = "c0300000-0000-4000-8000-000000000001";
    if (!(await tx.case.findUnique({where:{id:queueId}}))) {
      await tx.case.create({data:{
        id:queueId,patientId:"patient_queue",areas:["SKIN"],
        concern:"این یک پروندهٔ ساختگی برای نمایش بررسی پوست است.",
        amount:BigInt(demoPrice),status:"QUEUED",
        intake:{duration:"حدود سه ماه",history:"اطلاعات آزمایشی؛ سابقهٔ ثبت‌شده ندارد."},
        queue:{create:{state:"PREPARING"}},payments:{create:{result:"VERIFIED",amount:BigInt(demoPrice)}},
        notices:{create:{key:"seed-prepare",text:"لطفاً اطلاعات و تصاویر پرونده را تکمیل کنید."}},
      }});
    }
    const followId = "c0300000-0000-4000-8000-000000000002";
    if (!(await tx.case.findUnique({where:{id:followId}}))) {
      const now = Date.now();
      await tx.case.create({data:{
        id:followId,patientId:"patient_followup",areas:["DIET"],concern:"نمونهٔ نمایشی برای بررسی پیگیری دوره‌ای.",
        amount:BigInt(demoPrice),status:"FOLLOWUP_PERIOD",queue:{create:{state:"DONE"}},payments:{create:{result:"VERIFIED",amount:BigInt(demoPrice)}},
        episodes:{create:[
          {number:0,state:"CLOSED",closedAt:new Date(now-10*86400000)},
          {number:1,state:"SCHEDULED",eligibleAt:new Date(now+20*86400000)},
        ]},
      }});
    }
    const chatId = "c0300000-0000-4000-8000-000000000003";
    if (!(await tx.case.findUnique({where:{id:chatId}}))) {
      const now = Date.now();
      await tx.case.create({data:{
        id:chatId,patientId:"patient_chat",areas:["SKIN"],
        concern:"پروندهٔ ساختگی برای نمایش گفت‌وگو دربارهٔ خشکی پوست.",
        amount:BigInt(demoPrice),status:"IN_INITIAL_CONSULTATION",
        intake:{duration:"حدود دو هفته",history:"احساس کشیدگی پوست بعد از شست‌وشو."},
        queue:{create:{state:"IN_PROGRESS"}},
        payments:{create:{result:"VERIFIED",amount:BigInt(demoPrice)}},
        episodes:{create:{
          number:0,state:"OPEN",messages:{create:[
            {author:"patient_chat",clientId:"seed-chat-1",body:"سلام دکتر. حدود دو هفته است بعد از شستن صورتم احساس کشیدگی می‌کنم.",createdAt:new Date(now-15*60_000)},
            {author:"doctor_demo",clientId:"seed-chat-2",body:"سلام. این احساس بیشتر در کدام قسمت صورت است؟ اخیراً محصول جدیدی هم استفاده کرده‌اید؟",createdAt:new Date(now-10*60_000)},
            {author:"patient_chat",clientId:"seed-chat-3",body:"بیشتر روی گونه‌هاست. بله، از دو هفته پیش شوینده‌ام را عوض کرده‌ام.",createdAt:new Date(now-5*60_000)},
          ]},
        }},
      }});
    }
  });
  console.log("Demo accounts and cases are ready.");
} finally { await db.$disconnect(); }
