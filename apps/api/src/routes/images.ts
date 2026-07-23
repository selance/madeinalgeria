import { Hono } from "hono";
import { AppError } from "@mia/core";
import type { AppEnv } from "../env";

/**
 * Cloudflare Images upload (v1 parity: logos/avatars). Mounted behind
 * requireUser. Requires CLOUDFLARE_IMAGES_API_TOKEN (secret) — returns 503
 * until it's configured so frontends get a clear signal.
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (v1 limit)

export function createImagesRouter() {
  const router = new Hono<AppEnv>();

  router.post("/upload", async (c) => {
    if (!c.env.CLOUDFLARE_IMAGES_API_TOKEN || !c.env.CLOUDFLARE_ACCOUNT_ID) {
      return c.json(
        { error: { code: "internal", message: "Image uploads are not configured on this environment" } },
        503,
      );
    }

    const form = await c.req.formData().catch(() => {
      throw AppError.badRequest("multipart/form-data body required");
    });
    const image = form.get("image") as unknown;
    if (!(image instanceof File)) throw AppError.badRequest("Image file is required (field 'image')");
    if (!ALLOWED_TYPES.includes(image.type)) {
      throw AppError.badRequest(`Unsupported file type '${image.type}' (jpeg/png/webp only)`);
    }
    if (image.size > MAX_FILE_SIZE) throw AppError.badRequest("File exceeds the 10 MB limit");

    // Mounted behind requireUser, so a user is always present here.
    const user = c.get("user");
    if (!user) throw AppError.unauthorized("Sign in required");
    const metadata = {
      userId: user.id,
      uploadType: String(form.get("imageType") ?? "other"),
      uploadedAt: new Date().toISOString(),
    };

    const upstream = new FormData();
    upstream.append("file", image);
    upstream.append("metadata", JSON.stringify(metadata));
    upstream.append("requireSignedURLs", "false");

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_IMAGES_API_TOKEN}` },
        body: upstream,
      },
    );
    if (!res.ok) {
      console.error(`Cloudflare Images upload failed (${res.status}): ${await res.text()}`);
      throw AppError.internal("Image upload failed");
    }
    const body = (await res.json()) as {
      success: boolean;
      result?: { id: string; variants: string[] };
    };
    if (!body.success || !body.result) throw AppError.internal("Image upload failed");

    const url = body.result.variants.find((v) => v.endsWith("/public")) ?? body.result.variants[0];
    return c.json({ data: { id: body.result.id, url, variants: body.result.variants } }, 201);
  });

  return router;
}
