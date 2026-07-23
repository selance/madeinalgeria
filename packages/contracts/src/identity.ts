import { z } from "zod";

// ── Profile ─────────────────────────────────────────────────────────────
export const profileSchema = z.object({
  firstName: z.string().max(100).nullable(),
  lastName: z.string().max(100).nullable(),
  avatarUrl: z.string().nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  avatarUrl: z.url().optional(),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

// ── User administration (admin plugin surface) ──────────────────────────
export const listUsersQuerySchema = z.object({
  search: z.string().max(200).optional(),
  /** Filter by account role (maps to the admin plugin's field filter). */
  role: z.enum(["user", "admin"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const banUserSchema = z.object({
  reason: z.string().max(500).optional(),
  /** Days until the ban lifts; omit for permanent. */
  expiresInDays: z.number().int().positive().max(3650).optional(),
});

export const setRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});
