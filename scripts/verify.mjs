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

await mkdir(".data",{recursive:true});
const work = await mkdtemp(resolve(".data/verification-"));
const base = "http://127.0.0.1:3311";
const env = {...process.env, APP_MODE:"demo", APP_ORIGIN:base, DERM_DATA_DIR:work, DERM_DB_PORT:"55433", DATABASE_URL:"postgresql://derm:derm_local@127.0.0.1:55433/derm", NEXT_TELEMETRY_DISABLED:"1"};
const children = [];
let browser;
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
  const id=(await request(patient,{type:"request",areas:["HAIR","SKIN"],concern:"شرح کاملاً ساختگی برای آزمون",consent:true})).data.id;
  const apply=(cookie,type,extra={},expected=200)=>request(cookie,{type,id,...extra},expected);
  await apply(patient,"pay",{result:"VERIFIED"},409);
  await apply(patient,"approve",{},403);
  await apply(doctor,"approve");
  await apply(patient,"pay",{result:"FAILED"});
  await apply(doctor,"prepare",{},409);
  await Promise.all([apply(patient,"pay",{result:"VERIFIED"}),apply(patient,"pay",{result:"VERIFIED"})]);
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
  const {Client}=await import("pg");
  const client=new Client({connectionString:env.DATABASE_URL});
  await client.connect();
  try {
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
    assert.equal((await client.query('SELECT count(*)::int AS n FROM "Payment" WHERE "caseId"=$1 AND "result"=\'VERIFIED\'',[id])).rows[0].n,1);
    assert.equal((await client.query('SELECT count(*)::int AS n FROM "Message" WHERE "episodeId"=$1 AND "clientId"=$2',[episodeId,clientId])).rows[0].n,1);
  } finally { await client.end(); }
  const patientHtml=await (await fetch(base+"/app?case="+id+"&tab=note",{headers:{cookie:patient}})).text();
  assert.ok(!patientHtml.includes("PRIVATE-DOCTOR-NOTE"));
  console.log("API workflow, payment and message idempotency, private originals, queue and follow-up gates passed.");
  const executablePath=process.env.CHROMIUM_PATH ?? resolve(work,"chromium");
  if (!process.env.CHROMIUM_PATH) {
    await pipeline(createReadStream("node_modules/@sparticuz/chromium/bin/chromium.br"),createBrotliDecompress(),createWriteStream(executablePath));
    await chmod(executablePath,0o700);
  }
  browser=await chromium.launch({executablePath,args:["--no-sandbox","--disable-gpu","--disable-software-rasterizer","--no-zygote","--single-process"],headless:true});
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
  console.log("Chromium login, persisted chat and layout passed for both roles at 360px and 1440px.");
} finally {
  await browser?.close();
  for (const child of children.reverse()) child.kill();
  await Promise.all(children.map(child=>child.exitCode!==null?undefined:new Promise(resolve=>child.once("exit",resolve))));
  await rm(work,{recursive:true,force:true});
}
