import { z } from "zod";

/**
 * Reference-data contracts. Public read shapes carry all translations keyed
 * by language code (`names: { fr: "...", ar: "..." }`); clients pick their
 * locale. Write inputs are admin-only.
 */

export const languageSchema = z.object({
  id: z.number().int(),
  code: z.string().min(2).max(5),
  name: z.string().min(1).max(50),
});
export type Language = z.infer<typeof languageSchema>;

export const createLanguageSchema = languageSchema.omit({ id: true });
export const updateLanguageSchema = createLanguageSchema.partial();

/** Map of language code → translated name. */
export const namesByLangSchema = z.record(z.string(), z.string());
export type NamesByLang = z.infer<typeof namesByLangSchema>;

export const translationInputSchema = z.object({
  languageId: z.number().int(),
  name: z.string().min(1).max(100),
});
export type TranslationInput = z.infer<typeof translationInputSchema>;

// Categories share this shape: id + translations.
export const translatedItemSchema = z.object({
  id: z.number().int(),
  names: namesByLangSchema,
});
export type TranslatedItem = z.infer<typeof translatedItemSchema>;

export const createTranslatedItemSchema = z.object({
  translations: z.array(translationInputSchema).min(1),
});
export type CreateTranslatedItem = z.infer<typeof createTranslatedItemSchema>;

// Categories carry extra directory metadata on top of the translated shape:
// a stable URL slug (auto-generated server-side), an active flag, and a sort
// order. `listCategories` returns ALL rows (incl. inactive) — consumers filter.
export const categoryItemSchema = translatedItemSchema.extend({
  slug: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});
export type CategoryItem = z.infer<typeof categoryItemSchema>;

/** Category update: translations (renamed) + optional sortOrder/isActive.
 * The slug is never updatable — it is set once at creation and stays stable. */
export const updateCategorySchema = z.object({
  translations: z.array(translationInputSchema).min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateCategory = z.infer<typeof updateCategorySchema>;

export const countrySchema = z.object({
  id: z.number().int(),
  code: z.string().length(2),
  name: z.string().min(1).max(100),
  currencyCode: z.string().length(3).nullable(),
  phonePrefix: z.string().max(10).nullable(),
  isActive: z.boolean(),
  names: namesByLangSchema,
});
export type Country = z.infer<typeof countrySchema>;

export const createCountrySchema = z.object({
  code: z.string().length(2),
  name: z.string().min(1).max(100),
  currencyCode: z.string().length(3).optional(),
  phonePrefix: z.string().max(10).optional(),
  isActive: z.boolean().default(true),
  translations: z.array(translationInputSchema).default([]),
});
export type CreateCountry = z.infer<typeof createCountrySchema>;

export const stateSchema = z.object({
  id: z.number().int(),
  countryId: z.number().int(),
  code: z.string().max(10).nullable(),
  isActive: z.boolean(),
  names: namesByLangSchema,
});
export type State = z.infer<typeof stateSchema>;

export const createStateSchema = z.object({
  countryId: z.number().int(),
  code: z.string().max(10).optional(),
  isActive: z.boolean().default(true),
  translations: z.array(translationInputSchema).default([]),
});
export type CreateState = z.infer<typeof createStateSchema>;

/** Read surface other modules may depend on (service interface, plan §1 rule 2). */
export interface ReferenceReadService {
  listLanguages(): Promise<Language[]>;
  listCountries(): Promise<Country[]>;
  listStates(countryId?: number): Promise<State[]>;
  listCategories(): Promise<CategoryItem[]>;
}
