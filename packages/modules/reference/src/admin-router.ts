import { Hono, type Context } from "hono";
import { z } from "zod";
import { AppError } from "@mia/core";
import {
  createCountrySchema,
  createLanguageSchema,
  createStateSchema,
  createTranslatedItemSchema,
  updateCategorySchema,
  updateLanguageSchema,
} from "@mia/contracts";
import type { ReferenceService } from "./service";
import type { ReferenceRepo } from "./repo";

/**
 * Admin CRUD — mounted ONLY by apps/admin-api, behind requireAdmin.
 * Every write invalidates the KV cache (version bump).
 */

export interface ReferenceAdminDeps {
  getRepo: (c: Context) => ReferenceRepo;
  getService: (c: Context) => ReferenceService;
}

const idParam = z.coerce.number().int().positive();

function parseId(c: Context): number {
  const parsed = idParam.safeParse(c.req.param("id"));
  if (!parsed.success) throw AppError.badRequest("id must be a positive integer");
  return parsed.data;
}

async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const json = await c.req.json().catch(() => {
    throw AppError.badRequest("Invalid JSON body");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw AppError.badRequest("Validation failed", parsed.error.issues);
  return parsed.data;
}

export function createReferenceAdminRouter({ getRepo, getService }: ReferenceAdminDeps) {
  const router = new Hono();

  const invalidate = (c: Context) => getService(c).invalidate();

  // ── Languages ─────────────────────────────────────────────────────────
  router.post("/languages", async (c) => {
    const input = await parseBody(c, createLanguageSchema);
    const language = await getRepo(c).createLanguage(input);
    await invalidate(c);
    return c.json({ data: language }, 201);
  });

  router.put("/languages/:id", async (c) => {
    const input = await parseBody(c, updateLanguageSchema);
    const language = await getRepo(c).updateLanguage(parseId(c), input);
    if (!language) throw AppError.notFound("Language not found");
    await invalidate(c);
    return c.json({ data: language });
  });

  router.delete("/languages/:id", async (c) => {
    if (!(await getRepo(c).deleteLanguage(parseId(c)))) throw AppError.notFound("Language not found");
    await invalidate(c);
    return c.json({ data: { deleted: true } });
  });

  // ── Countries ─────────────────────────────────────────────────────────
  router.post("/countries", async (c) => {
    const input = await parseBody(c, createCountrySchema);
    const id = await getRepo(c).createCountry(input);
    await invalidate(c);
    return c.json({ data: { id } }, 201);
  });

  router.put("/countries/:id", async (c) => {
    const input = await parseBody(c, createCountrySchema.partial());
    if (!(await getRepo(c).updateCountry(parseId(c), input))) throw AppError.notFound("Country not found");
    await invalidate(c);
    return c.json({ data: { updated: true } });
  });

  router.delete("/countries/:id", async (c) => {
    if (!(await getRepo(c).deleteCountry(parseId(c)))) throw AppError.notFound("Country not found");
    await invalidate(c);
    return c.json({ data: { deleted: true } });
  });

  // ── States ────────────────────────────────────────────────────────────
  router.post("/states", async (c) => {
    const input = await parseBody(c, createStateSchema);
    const id = await getRepo(c).createState(input);
    await invalidate(c);
    return c.json({ data: { id } }, 201);
  });

  router.put("/states/:id", async (c) => {
    const input = await parseBody(c, createStateSchema.partial());
    if (!(await getRepo(c).updateState(parseId(c), input))) throw AppError.notFound("State not found");
    await invalidate(c);
    return c.json({ data: { updated: true } });
  });

  router.delete("/states/:id", async (c) => {
    if (!(await getRepo(c).deleteState(parseId(c)))) throw AppError.notFound("State not found");
    await invalidate(c);
    return c.json({ data: { deleted: true } });
  });

  // ── Categories (dedicated: auto-slug on create, slug/sortOrder/isActive) ──
  // Unlike the generic translated entities below, categories carry directory
  // metadata (stable slug, sort order, active flag) and a deactivate-first
  // delete policy — no FK protects category ids anywhere.
  router.post("/categories", async (c) => {
    const input = await parseBody(c, createTranslatedItemSchema);
    const id = await getRepo(c).createCategory(input);
    await invalidate(c);
    return c.json({ data: { id } }, 201);
  });

  router.put("/categories/:id", async (c) => {
    const input = await parseBody(c, updateCategorySchema);
    if (!(await getRepo(c).updateCategory(parseId(c), input))) {
      throw AppError.notFound("Category not found");
    }
    await invalidate(c);
    return c.json({ data: { updated: true } });
  });

  router.delete("/categories/:id", async (c) => {
    const id = parseId(c);
    const isActive = await getRepo(c).getCategoryActive(id);
    if (isActive === undefined) throw AppError.notFound("Category not found");
    if (isActive) throw AppError.conflict("عطّل الفئة قبل حذفها");
    if (!(await getRepo(c).deleteCategory(id))) throw AppError.notFound("Category not found");
    await invalidate(c);
    return c.json({ data: { deleted: true } });
  });

  return router;
}
