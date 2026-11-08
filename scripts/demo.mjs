import "dotenv/config";
import { spawn, spawnSync } from "node:child_process";
const env={...process.env,NEXT_TELEMETRY_DISABLED:"1"};
const appPort=env.DERM_APP_PORT??"3000";
env.APP_ORIGIN ??= `http://127.0.0.1:${appPort}`;
if (env.APP_MODE!=="demo") throw new Error("Set APP_MODE=demo in .env before starting the demo");
const children=[];
function start(args){
  const child=spawn(process.execPath,args,{env,stdio:"inherit"});
  children.push(child);
  return child;
}
function run(args){
  const result=spawnSync(process.execPath,args,{env,stdio:"inherit"});
  if(result.status!==0) throw new Error("Demo setup failed: "+args.join(" "));
}
function stop(){for(const child of children.reverse()) child.kill();}
for(const signal of ["SIGINT","SIGTERM"]) process.on(signal,stop);
try{
  if (!process.argv.includes("--external-db")){
    const { default: net }=await import("node:net");
    const localDb=start(["scripts/local-db.mjs"]);
    const port=Number(env.DERM_DB_PORT??55432);
    let connected=false;
    for(let i=0;i<60&&!connected;i++){
      connected=await new Promise(resolve=>{
        const socket=net.connect(port,"127.0.0.1");
        socket.once("connect",()=>{socket.end();resolve(true);});
        socket.once("error",()=>resolve(false));
      });
      if(!connected) await new Promise(resolve=>setTimeout(resolve,250));
    }
    if(!connected||localDb.exitCode!==null)throw new Error("Local demo database did not start");
  }
  run(["node_modules/prisma/build/index.js","generate"]);
  run(["node_modules/prisma/build/index.js","migrate","deploy"]);
  run(["--import","tsx","scripts/seed.ts"]);
  const app=start(["node_modules/next/dist/bin/next","dev","-H","127.0.0.1","-p",appPort]);
  await new Promise(resolve=>app.once("exit",resolve));
}finally{stop();}
