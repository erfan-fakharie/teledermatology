import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface FileStorage {
  put(id: string, variant: "original" | "preview", bytes: Buffer): Promise<void>;
  get(id: string, variant: "original" | "preview"): Promise<Buffer>;
  remove(id: string, variant: "original" | "preview"): Promise<void>;
}
const directory = resolve(process.env.DERM_DATA_DIR ?? ".data", "files");
function path(id: string, variant: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid storage ID");
  return resolve(directory, `${id}.${variant}`);
}
export const storage: FileStorage = {
  async put(id, variant, bytes) {
    await mkdir(directory, {recursive:true,mode:0o700});
    await writeFile(path(id,variant),bytes,{flag:"wx",mode:0o600});
  },
  get:(id,variant)=>readFile(path(id,variant)),
  remove:(id,variant)=>rm(path(id,variant),{force:true}),
};
