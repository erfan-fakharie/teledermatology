import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdir } from "node:fs/promises";
if (process.env.APP_MODE !== "demo") throw new Error("Local database is for APP_MODE=demo");
const directory = process.env.DERM_DATA_DIR ?? ".data";
await mkdir(directory,{recursive:true});
const db = await PGlite.create(directory + "/local-pg");
const server = new PGLiteSocketServer({db,host:"127.0.0.1",port:Number(process.env.DERM_DB_PORT ?? 55432),maxConnections:16});
await server.start();
console.log("Local PostgreSQL engine ready");
for (const signal of ["SIGINT","SIGTERM"]) process.once(signal,async()=>{
  await server.stop();
  await db.close();
  process.exit(0);
});
