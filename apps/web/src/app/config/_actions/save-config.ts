"use server";

import { configRepo } from "@/lib/shared";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function saveConfig(formData: FormData): Promise<void> {
  try {
    const raw = Object.fromEntries(formData);
    const result = z
      .object({
        wansoft_base_url: z.string().min(1),
        wansoft_user_code: z.string().transform((input) => {
          const trimmed = input.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }),
        remote_api_base_url: z.string().min(1),
        remote_api_token: z.string().transform((input) => {
          const trimmed = input.trim();
          return trimmed.length > 0 ? trimmed : undefined;
        }),
        replication_interval_ms: z.coerce.number().int().positive(),
      })
      .safeParse(raw);

    // TODO: handle errors
    if (!result.success) {
      console.error(result.error);
      return;
    }

    const data = result.data;
    await configRepo.updateConfig(data);

    revalidatePath("/config");
  } catch (err) {
    // TODO: handle errors
    console.error(err);
    return;
  }
}
