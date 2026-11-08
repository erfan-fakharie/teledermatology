import { createHash } from "node:crypto";
import sharp from "sharp";
import { maxImageBytes } from "./catalog";
import { check, WorkflowError } from "./workflow";

const formats = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

export async function prepareImage(file: FormDataEntryValue | null) {
  check(file instanceof File && file.size > 0,"تصویر انتخاب کنید.",422,"VALIDATION_ERROR");
  check(file.size <= maxImageBytes,"حداکثر اندازهٔ تصویر ۲۵ مگابایت است.",413,"FILE_TOO_LARGE");
  const original = Buffer.from(await file.arrayBuffer());
  const image = sharp(original,{limitInputPixels:80000000});
  try {
    const metadata = await image.metadata();
    if (!metadata.format || !(metadata.format in formats) || (metadata.pages ?? 1) > 1) throw new Error();
    const preview = await image.autoOrient().resize(840,840,{fit:"inside",withoutEnlargement:true}).webp().toBuffer();
    return {
      original, preview,
      info: {
        filename:file.name.slice(0,180),
        mime:formats[metadata.format as keyof typeof formats],
        bytes:file.size,
        sha256:createHash("sha256").update(original).digest("hex"),
      },
    };
  } catch {
    throw new WorkflowError(422,"FILE_UNSUPPORTED","یک تصویر معتبر JPEG، PNG یا WebP انتخاب کنید.");
  }
}

export type InitialPhoto = Awaited<ReturnType<typeof prepareImage>>["info"] & { id: string };
