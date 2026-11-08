import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createBrotliDecompress } from "node:zlib";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";
import sharp from "sharp";
import pg from "pg";

await mkdir(".data",{recursive:true});
const work = await mkdtemp(resolve(".data/verification-"));
const base = "http://127.0.0.1:3311";
const env = {...process.env, APP_MODE:"demo", APP_ORIGIN:base, DERM_DATA_DIR:work, DERM_DB_PORT:"55433", DATABASE_URL:"postgresql://derm:derm_local@127.0.0.1:55433/derm", NEXT_TELEMETRY_DISABLED:"1"};
const children = [];
let browser;
const client = new pg.Client({connectionString:env.DATABASE_URL});
function start(args) {
  const child = spawn(process.execPath,args,{env,stdio:["ignore","pipe","pipe"]});
  let output = "";
  child.stdout.on("data",data=>{output+=data;});
  child.stderr.on("data",data=>{output+=data;});
  children.push(child);
  return {child,log:()=>output};
}
async function ready(process, condition) {
  for (let index=0; index<100; index++) {
    if (await condition()) return;
    if (process.child.exitCode!==null) break;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw Error(process.log());
}
function run(args) {
  const result=spawnSync(process.execPath,args,{env,encoding:"utf8"});
  assert.equal(result.status,0,result.stdout+result.stderr);
}
async function request(cookie, data, expected=200) {
  const form=data instanceof FormData;
  const response=await fetch(base+(form?"/api/files":"/api/action"),{
    method:"POST",headers:{origin:base,cookie,...(!form?{"content-type":"application/json"}:{})},body:form?data:JSON.stringify(data),
  });
  const json=await response.json();
  assert.equal(response.status,expected,JSON.stringify({action:data.type,status:response.status,body:json}));
  return { ...json, cookie: response.headers.get("set-cookie")?.match(/derm_session=[^;]+/)?.[0] };
}
const login=async id=>(await request("",{type:"login",id})).cookie;
try {
  const database=start(["scripts/local-db.mjs"]);
  await ready(database,()=>database.log().includes("engine ready"));
  run(["node_modules/prisma/build/index.js","migrate","deploy"]);
  run(["--import","tsx","scripts/seed.ts"]);
  const app=start(["node_modules/next/dist/bin/next","start","-H","127.0.0.1","-p","3311"]);
  await ready(app,async()=>{try{return (await fetch(base+"/login")).ok;}catch{return false;}});
  const doctor=await login("doctor_demo"), patient=await login("patient_new"), other=await login("patient_followup");
  const seeded="c0300000-0000-4000-8000-000000000001";
  await client.connect();
  const seededChat = "c0300000-0000-4000-8000-000000000003";
  const chat = (await client.query('SELECT id FROM "Episode" WHERE "caseId"=$1 AND "number"=0',[seededChat])).rows[0];
  await request(doctor,{type:"close",id:seededChat,episodeId:chat.id});
  const concerns={SKIN:"شرح ساختگی مشکل پوست برای آزمون",HAIR:"شرح ساختگی مشکل مو برای آزمون"};
  const id=(await request(patient,{type:"request",areas:["HAIR","SKIN"],concerns,consent:true})).data.id;
  const split=(await client.query('SELECT id,areas,concern FROM "Case" WHERE "packageId"=(SELECT "packageId" FROM "Case" WHERE id=$1)',[id])).rows;
  assert.equal(split.length,2);
  assert.deepEqual(split.find(item=>item.id===id).areas,["SKIN"]);
  const hair=split.find(item=>item.areas[0]==="HAIR");
  assert.equal(hair.concern,concerns.HAIR);
  const apply=(cookie,type,extra={},expected=200)=>request(cookie,{type,id,...extra},expected);
  await apply(patient,"pay",{result:"VERIFIED"},409);
  await apply(patient,"approve",{},403);
  await apply(doctor,"approve");
  await apply(patient,"pay",{result:"VERIFIED"},409);
  await apply(doctor,"approve",{id:hair.id});
  await apply(patient,"pay",{result:"FAILED"});
  await apply(doctor,"prepare",{},409);
  await Promise.all([apply(patient,"pay",{result:"VERIFIED"}),apply(patient,"pay",{id:hair.id,result:"VERIFIED"})]);
  assert.equal((await client.query('SELECT count(*)::int AS n FROM "QueueEntry" WHERE "caseId"=ANY($1)',[[id,hair.id]])).rows[0].n,2);
  await apply(doctor,"prepare");
  await apply(doctor,"prepare");
  await apply(doctor,"start",{},409);
  await apply(patient,"intake",{history:"آزمایشی",duration:"یک ماه",submit:true},422);
  const original=await sharp({create:{width:12,height:12,channels:3,background:"#83c9ba"}}).png().toBuffer();
  const form=new FormData();
  form.set("caseId",id);
  form.set("file",new Blob([original],{type:"image/png"}),"fixture.png");
  const file=(await request(patient,form)).data.id;
  for (const variant of ["original","preview"]) assert.equal((await fetch(base+"/api/files/"+file+"?variant="+variant,{headers:{cookie:other}})).status,404);
  const download=await fetch(base+"/api/files/"+file+"?variant=original",{headers:{cookie:doctor}});
  assert.equal(download.status,200);
  assert.match(download.headers.get("cache-control"),/no-store/);
  assert.equal(download.headers.get("x-content-sha256"),createHash("sha256").update(original).digest("hex"));
  assert.deepEqual(Buffer.from(await download.arrayBuffer()),original);
  await apply(patient,"intake",{history:"آزمایشی",duration:"یک ماه",submit:true});
  await apply(doctor,"start",{},409);
  await request(doctor,{type:"hold",id:seeded,reason:"تعویق نمایشی"});
  await apply(doctor,"start");
  await request(doctor,{type:"resume",id:seeded});
  await apply(doctor,"note",{body:"PRIVATE-DOCTOR-NOTE"});
  {
    const episodes=()=>client.query('SELECT * FROM "Episode" WHERE "caseId"=$1 ORDER BY "number"',[id]).then(r=>r.rows);
    const episodeId=(await episodes())[0].id;
    const clientId=randomUUID();
    await apply(patient,"message",{episodeId,clientId,body:"سلام، پیام نمونه"});
    await apply(patient,"message",{episodeId,clientId,body:"سلام، پیام نمونه"});
    await apply(doctor,"message",{episodeId,clientId:randomUUID(),body:"پاسخ نمونه"});
    assert.equal((await episodes())[0].state,"OPEN");
    await apply(doctor,"close",{episodeId});
    await apply(doctor,"close",{episodeId});
    const follow=(await episodes())[1];
    await apply(patient,"message",{episodeId:follow.id,clientId:randomUUID(),body:"پیگیری قبل موعد"},423);
    await apply(doctor,"advance");
    await apply(patient,"message",{episodeId:follow.id,clientId:randomUUID(),body:"شروع پیگیری"});
    await apply(doctor,"message",{episodeId:follow.id,clientId:randomUUID(),body:"پاسخ به پیگیری"});
    await apply(patient,"message",{episodeId:follow.id,clientId:randomUUID(),body:"ادامهٔ پیگیری"});
    await apply(doctor,"close",{episodeId:follow.id});
    await apply(patient,"message",{episodeId:follow.id,clientId:randomUUID(),body:"پس از بسته شدن"},409);
    assert.equal((await episodes()).length,3);
    const verified=(await client.query('SELECT amount FROM "Payment" WHERE "caseId"=ANY($1) AND "result"=\'VERIFIED\'',[[id,hair.id]])).rows;
    assert.deepEqual(verified,[{amount:"10000000"}]);
    assert.equal((await client.query('SELECT count(*)::int AS n FROM "Message" WHERE "episodeId"=$1 AND "clientId"=$2',[episodeId,clientId])).rows[0].n,1);
  }
  const patientHtml=await (await fetch(base+"/app?case="+id+"&tab=note",{headers:{cookie:patient}})).text();
  assert.ok(!patientHtml.includes("PRIVATE-DOCTOR-NOTE"));
  console.log("API workflow, payment and message idempotency, private originals, queue and follow-up gates passed.");
  const executablePath=process.env.CHROMIUM_PATH ?? resolve(work,"chromium");
  if (!process.env.CHROMIUM_PATH) {
    await pipeline(createReadStream("node_modules/@sparticuz/chromium/bin/chromium.br"),createBrotliDecompress(),createWriteStream(executablePath));
    await chmod(executablePath,0o700);
  }
  const args=process.env.CHROMIUM_PATH?[]:["--no-sandbox","--disable-gpu","--disable-software-rasterizer","--no-zygote","--single-process"];
  browser=await chromium.launch({executablePath,args,headless:true});
  const context=await browser.newContext();
  const page=await context.newPage();
  for (const width of [360,1440]) {
    for (const account of ["پزشک نمونه","سارا رضایی"]) {
      await context.clearCookies();
      await page.setViewportSize({width,height:900});
      await page.goto(base+"/login");
      await page.getByRole("button",{name:new RegExp(account)}).click();
      await page.waitForURL(base+"/app");
      const target=base+"/app?view="+(account==="پزشک نمونه"?"followups":"cases")+"&case="+id+"&tab=chat";
      await page.goto(target);
      await page.getByText("پیگیری ۲",{exact:true}).waitFor();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
      await page.reload();
      await page.getByText("پیگیری ۲",{exact:true}).waitFor();
      console.log("Layout checked:",width,account);
    }
  }
  await context.clearCookies();
  await page.setViewportSize({width:360,height:900});
  await page.goto(base+"/login");
  await page.getByRole("button",{name:/علی محمدی/}).click();
  await page.waitForURL(base+"/app");
  await page.goto(base+"/app?view=new");
  await page.getByRole("checkbox",{name:"پوست",exact:true}).check();
  await page.getByRole("checkbox",{name:"مو",exact:true}).check();
  await page.getByRole("button",{name:"ادامه و شرح مشکل"}).click();
  await page.getByRole("textbox",{name:"شرح مشکل پوست"}).fill(concerns.SKIN);
  await page.getByRole("textbox",{name:"شرح مشکل مو"}).fill(concerns.HAIR);
  await page.getByLabel(/افزودن عکس پوست/).setInputFiles({name:"skin-initial.png",mimeType:"image/png",buffer:original});
  await page.getByLabel(/افزودن عکس مو/).setInputFiles({name:"hair-initial.png",mimeType:"image/png",buffer:original});
  await page.getByRole("button",{name:"حذف عکس hair-initial.png"}).click();
  await page.getByLabel(/افزودن عکس مو/).setInputFiles({name:"hair-initial.png",mimeType:"image/png",buffer:original});
  await page.getByRole("checkbox",{name:/شرایط استفاده/}).check();
  await page.getByRole("button",{name:"ثبت درخواست"}).click();
  await page.waitForURL(base+"/app?view=cases");
  await page.getByRole("link",{name:/پروندهٔ پوست/}).waitFor();
  await page.getByRole("link",{name:/پروندهٔ مو/}).click();
  await page.getByText(concerns.HAIR,{exact:true}).waitFor();
  assert.equal(await page.getByText(concerns.SKIN,{exact:true}).count(),0);
  await page.getByText("عکس‌های شرح اولیه",{exact:true}).waitFor();
  await page.getByText("hair-initial.png",{exact:true}).waitFor();
  assert.equal(await page.getByText("skin-initial.png",{exact:true}).count(),0);
  const initialPhotos=(await client.query(
    'SELECT a.id, a.filename, c.id AS "caseId", c.areas, c.status FROM "Attachment" a JOIN "Case" c ON a."caseId"=c.id WHERE a.initial=true ORDER BY a.filename',
  )).rows;
  assert.deepEqual(initialPhotos.map(({filename,areas,status})=>({filename,areas,status})),[
    {filename:"hair-initial.png",areas:["HAIR"],status:"PENDING_REVIEW"},
    {filename:"skin-initial.png",areas:["SKIN"],status:"PENDING_REVIEW"},
  ]);
  for (const photo of initialPhotos) {
    const url=base+"/api/files/"+photo.id+"?variant=original";
    const doctorView=await fetch(base+`/app?view=requests&case=${photo.caseId}`,{headers:{cookie:doctor}});
    assert.match(await doctorView.text(),new RegExp(photo.filename));
    const doctorPhoto=await fetch(url,{headers:{cookie:doctor}});
    assert.equal(doctorPhoto.status,200);
    assert.deepEqual(Buffer.from(await doctorPhoto.arrayBuffer()),original);
    assert.equal((await fetch(url,{headers:{cookie:patient}})).status,404);
  }
  await page.getByRole("heading",{name:"قدم بعدی"}).waitFor();
  console.log("Separate descriptions and private initial photos passed in the mobile patient and doctor views.");
  await context.clearCookies();
  await page.goto(base+"/login");
  await page.getByRole("button",{name:/پزشک نمونه/}).click();
  await page.waitForURL(base+"/app");
  await page.getByRole("link",{name:"درخواست‌ها",exact:true}).click();
  const filters=page.getByRole("navigation",{name:"فیلتر نوع پرونده"});
  const rows=page.locator(".queue-item");
  await filters.getByRole("link",{name:"پوست",exact:true}).click();
  await page.waitForURL("**/app?view=requests&area=SKIN");
  assert.equal(await rows.count(),1);
  assert.match(await rows.first().innerText(),/پوست/);
  await filters.getByRole("link",{name:"مو",exact:true}).click();
  await page.waitForURL("**/app?view=requests&area=HAIR");
  assert.equal(await rows.count(),1);
  assert.match(await rows.first().innerText(),/مو/);
  await rows.first().click();
  await page.getByRole("link",{name:"بازگشت به فهرست"}).click();
  await page.waitForURL("**/app?view=requests&area=HAIR");
  assert.equal(await filters.getByRole("link",{name:"مو",exact:true}).getAttribute("aria-current"),"page");
  await filters.getByRole("link",{name:"رژیم غذایی",exact:true}).click();
  await page.getByText("درخواستی برای این نوع پرونده وجود ندارد.").waitFor();
  await filters.getByRole("link",{name:"همه",exact:true}).click();
  await page.waitForURL(base+"/app?view=requests");
  assert.equal(await rows.count(),2);
  console.log("Verified request type filters and preserved selection on mobile back navigation.");
  console.log("Chromium login, persisted chat and layout passed for both roles at 360px and 1440px.");
} finally {
  await browser?.close();
  await client.end();
  for (const child of children.reverse()) child.kill();
  await Promise.all(children.map(child=>child.exitCode!==null?undefined:new Promise(resolve=>child.once("exit",resolve))));
  await rm(work,{recursive:true,force:true});
}
