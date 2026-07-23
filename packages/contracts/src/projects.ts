import { z } from "zod";

/**
 * Projects-directory contracts. Public read shapes serve the Astro site and
 * islands; write inputs split between the anonymous submit form and admin
 * review. The GitHub client interface lives here so the module depends on a
 * contract, not a concrete fetch implementation.
 */

export const projectStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type ProjectStatusValue = z.infer<typeof projectStatusSchema>;

export const projectSortSchema = z.enum(["stars", "recent", "name", "new"]);
export type ProjectSort = z.infer<typeof projectSortSchema>;

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  language: z.string().trim().max(60).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  /** Filter to one GitHub owner login — powers /developers/[login] pages. */
  owner: z.string().trim().max(80).optional(),
  /** Filter to one repo topic — powers /projects/topic/[topic] pages. */
  topic: z.string().trim().max(60).optional(),
  sort: projectSortSchema.default("stars"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/** Feed/list "how many" — bounded so the RSS + recent endpoints stay cheap. */
export const projectsFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export type ProjectsFeedQuery = z.infer<typeof projectsFeedQuerySchema>;

export const listAdminProjectsQuerySchema = z.object({
  status: projectStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminProjectsQuery = z.infer<typeof listAdminProjectsQuerySchema>;

const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;

export const submitProjectSchema = z.object({
  repoUrl: z
    .string()
    .trim()
    .max(200)
    .regex(GITHUB_REPO_URL, "Must be a GitHub repository URL (https://github.com/owner/repo)"),
  email: z.email().max(254).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type SubmitProject = z.infer<typeof submitProjectSchema>;

export const reviewProjectSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNotes: z.string().trim().max(500).optional(),
});
export type ReviewProject = z.infer<typeof reviewProjectSchema>;

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(1000).nullable(),
    descriptionAr: z.string().trim().max(1000).nullable(),
    categoryId: z.number().int().positive().nullable(),
    isFeatured: z.boolean(),
  })
  .partial();
export type UpdateProject = z.infer<typeof updateProjectSchema>;

/** Public card/detail shape. Dates are ISO strings on the wire. */
export interface PublicProject {
  id: number;
  slug: string;
  repoFullName: string;
  name: string;
  description: string | null;
  descriptionAr: string | null;
  htmlUrl: string;
  homepage: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  topics: string[];
  license: string | null;
  isArchived: boolean;
  /** Derived: pushed to within the last 365 days. Never stored. */
  isActive: boolean;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  ownerType: "User" | "Organization";
  categoryId: number | null;
  isFeatured: boolean;
  repoCreatedAt: string | null;
  repoPushedAt: string | null;
}

export interface ProjectLanguageFacet {
  name: string;
  count: number;
}

/** One approved GitHub owner and how many of their projects are listed. */
export interface ProjectOwnerFacet {
  login: string;
  avatarUrl: string | null;
  count: number;
}

/** One repo topic and how many approved projects carry it. */
export interface ProjectTopicFacet {
  topic: string;
  count: number;
}

/** A single sitemap row: the slug + an ISO lastmod (freshest known timestamp). */
export interface SitemapEntry {
  slug: string;
  lastmod: string;
}

export interface OffsetPagination {
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
}

/** GitHub repo metadata as the module consumes it (mapped from the REST shape). */
export interface GitHubRepoData {
  fullName: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  license: string | null;
  isArchived: boolean;
  isFork: boolean;
  isPrivate: boolean;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  ownerType: "User" | "Organization";
  createdAt: string;
  pushedAt: string | null;
}

export interface GitHubClient {
  /** Resolves to null when the repository does not exist (404). */
  getRepo(fullName: string): Promise<GitHubRepoData | null>;
}
