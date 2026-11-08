import { randomUUID } from "node:crypto";
import { session } from "@/lib/auth";
import { areas, maxImageBytes, maxInitialPhotos } from "@/lib/catalog";
import { fail, mutationGuard } from "@/lib/http";
import { prepareImage, type InitialPhoto } from "@/lib/prepare-image";
import { storage } from "@/lib/storage";
import { check, mutate } from "@/lib/workflow";

export async function POST(request: Request) {
  const staged: string[] = [];
  try {
    mutationGuard(request);
    const user = await session();
    check(user, "ابتدا وارد شوید.", 401, "UNAUTHENTICATED");
    check(user.role === "PATIENT", "دسترسی مجاز نیست.", 403, "ROLE_FORBIDDEN");
    const length = Number(request.headers.get("content-length"));
    check(length > 0 && length <= maxImageBytes + 65536, "حجم مجموع تصاویر باید حداکثر ۲۵ مگابایت باشد.", 413, "FILE_TOO_LARGE");
    const form = await request.formData();
    const raw = form.get("payload");
    check(typeof raw === "string", "اطلاعات درخواست را وارد کنید.", 422, "VALIDATION_ERROR");
    const payload = JSON.parse(raw);
    check(payload?.type === "request", "اطلاعات درخواست معتبر نیست.", 422, "VALIDATION_ERROR");

    const photos: Partial<Record<(typeof areas)[number], InitialPhoto[]>> = {};
    let total = 0;
    for (const area of areas) {
      const selected = form.getAll(area);
      if (!selected.length) continue;
      check(selected.length <= maxInitialPhotos, "برای هر موضوع حداکثر دو تصویر اضافه کنید.", 422, "VALIDATION_ERROR");
      const group: InitialPhoto[] = [];
      photos[area] = group;
      for (const file of selected) {
        check(file instanceof File, "فایل تصویر معتبر نیست.", 422, "VALIDATION_ERROR");
        total += file.size;
        check(total <= maxImageBytes, "حجم مجموع تصاویر باید حداکثر ۲۵ مگابایت باشد.", 413, "FILE_TOO_LARGE");
        const { original, preview, info } = await prepareImage(file);
        const id = randomUUID();
        staged.push(id);
        await storage.put(id, "original", original);
        await storage.put(id, "preview", preview);
        group.push({ id, ...info });
      }
    }
    return Response.json({ data: await mutate(user, payload, photos) });
  } catch (error) {
    await Promise.allSettled(staged.flatMap(id => [storage.remove(id, "original"), storage.remove(id, "preview")]));
    return fail(error);
  }
}
