import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { pickName, queryKeys, useApiClient } from "@mia/api-client";
import type { PaginationData } from "@mia/ui/components/pagination";
import type {
  CampaignProgress,
  CategoryItem,
  Country,
  CreateCampaign,
  CreatePlan,
  CreateTemplate,
  Language,
  NewsletterStatus,
  NewsletterSubscriberSummary,
  State,
  TranslatedItem,
} from "@mia/contracts";

export { pickName };

// ── Local response types (rows the modules return, not in contracts) ────────

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  emailVerified?: boolean;
  createdAt: string;
}

export interface PlanRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  interval: "monthly" | "yearly";
  features: string[] | string | null;
  isActive: boolean | number;
}

export interface SubscriptionRow {
  id: number;
  userId: string;
  planId: number;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export interface InvoiceRow {
  id: number;
  userId: string;
  subscriptionId: number | null;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface TemplateRow {
  id: number;
  name: string;
  subject: string;
  content: string;
}

export interface CampaignRow {
  id: number;
  name: string;
  templateId: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  scheduledAt: string | null;
  createdAt: string;
}

const keys = {
  users: (search: string, role: string, offset: number) =>
    ["admin", "users", search, role, offset] as const,
  reference: (entity: string) => ["admin", "reference", entity] as const,
  plans: ["admin", "plans"] as const,
  subscriptions: ["admin", "subscriptions"] as const,
  invoices: ["admin", "invoices"] as const,
  templates: ["admin", "templates"] as const,
  campaigns: ["admin", "campaigns"] as const,
  progress: (id: number) => ["admin", "campaign-progress", id] as const,
};

// ── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers(search: string, role: "" | "user" | "admin", offset = 0, limit = 20) {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.users(search, role, offset),
    queryFn: () =>
      api.get<{ users: AdminUser[]; total: number }>("v1/users", {
        limit,
        offset,
        ...(search ? { search } : {}),
        ...(role ? { role } : {}),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useBanUser() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason?: string; expiresInDays?: number }) =>
      api.post(`v1/users/${input.id}/ban`, { reason: input.reason, expiresInDays: input.expiresInDays }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useUnbanUser() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`v1/users/${id}/unban`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetUserRole() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; role: "user" | "admin" }) =>
      api.post(`v1/users/${input.id}/role`, { role: input.role }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

// ── Reference data (reads = public router mounted on admin host) ────────────

export type ReferenceEntity = "languages" | "countries" | "states" | "categories";

export function useReferenceList(entity: ReferenceEntity, countryId?: number) {
  const api = useApiClient();
  return useQuery({
    queryKey: [...keys.reference(entity), countryId ?? null],
    queryFn: () =>
      api.get<(Language | Country | State | TranslatedItem | CategoryItem)[]>(
        `v1/reference/${entity}`,
        entity === "states" && countryId ? { countryId } : undefined,
      ),
    enabled: entity !== "states" || countryId !== undefined,
  });
}

export function useReferenceMutations(entity: ReferenceEntity) {
  const api = useApiClient();
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin", "reference"] });
  return {
    create: useMutation({
      mutationFn: (body: unknown) => api.post(`v1/reference/${entity}`, body),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: number; body: unknown }) =>
        api.put(`v1/reference/${entity}/${id}`, body),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete(`v1/reference/${entity}/${id}`),
      onSuccess: invalidate,
    }),
  };
}

// ── Billing ──────────────────────────────────────────────────────────────────

export function useBilling() {
  const api = useApiClient();
  const qc = useQueryClient();
  return {
    plans: useQuery({ queryKey: keys.plans, queryFn: () => api.get<PlanRow[]>("v1/billing/plans") }),
    subscriptions: useQuery({
      queryKey: keys.subscriptions,
      queryFn: async () =>
        (await api.get<{ items: SubscriptionRow[]; nextCursor: number | null }>("v1/billing/subscriptions")).items,
    }),
    invoices: useQuery({
      queryKey: keys.invoices,
      queryFn: async () =>
        (await api.get<{ items: InvoiceRow[]; nextCursor: number | null }>("v1/billing/invoices")).items,
    }),
    createPlan: useMutation({
      mutationFn: (body: CreatePlan) => api.post("v1/billing/plans", body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.plans }),
    }),
    updatePlan: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<CreatePlan> }) =>
        api.put(`v1/billing/plans/${id}`, body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.plans }),
    }),
    cancelSubscription: useMutation({
      mutationFn: (id: number) => api.post(`v1/billing/subscriptions/${id}/cancel`),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.subscriptions }),
    }),
    markInvoicePaid: useMutation({
      mutationFn: (id: number) => api.post(`v1/billing/invoices/${id}/mark-paid`),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.invoices }),
    }),
  };
}

// ── Campaigns / templates ────────────────────────────────────────────────────

export function useNotifications() {
  const api = useApiClient();
  const qc = useQueryClient();
  return {
    templates: useQuery({
      queryKey: keys.templates,
      queryFn: () => api.get<TemplateRow[]>("v1/notifications/templates"),
    }),
    campaigns: useQuery({
      queryKey: keys.campaigns,
      queryFn: async () =>
        (await api.get<{ items: CampaignRow[]; nextCursor: number | null }>("v1/notifications/campaigns")).items,
    }),
    createTemplate: useMutation({
      mutationFn: (body: CreateTemplate) => api.post("v1/notifications/templates", body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.templates }),
    }),
    updateTemplate: useMutation({
      mutationFn: ({ id, body }: { id: number; body: Partial<CreateTemplate> }) =>
        api.put(`v1/notifications/templates/${id}`, body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.templates }),
    }),
    deleteTemplate: useMutation({
      mutationFn: (id: number) => api.delete(`v1/notifications/templates/${id}`),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.templates }),
    }),
    createCampaign: useMutation({
      mutationFn: (body: CreateCampaign) => api.post("v1/notifications/campaigns", body),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.campaigns }),
    }),
    sendCampaign: useMutation({
      mutationFn: (id: number) => api.post(`v1/notifications/campaigns/${id}/send`),
      onSuccess: () => void qc.invalidateQueries({ queryKey: keys.campaigns }),
    }),
  };
}

export function useCampaignProgress(id: number | undefined, enabled: boolean) {
  const api = useApiClient();
  return useQuery({
    queryKey: keys.progress(id ?? 0),
    queryFn: () => api.get<CampaignProgress>(`v1/notifications/campaigns/${id}/progress`),
    enabled: enabled && id !== undefined,
    refetchInterval: 3000,
  });
}

// ── Projects (open-source directory review) ─────────────────────────────────

export type ProjectStatus = "pending" | "approved" | "rejected";

/** Row shape of packages/db-core/src/schema/projects.ts over JSON (dates as ISO strings). */
export interface ProjectRow {
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
  topics: string[] | null;
  license: string | null;
  isArchived: boolean;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  ownerType: "User" | "Organization";
  categoryId: number | null;
  status: ProjectStatus;
  isFeatured: boolean;
  source: "seed" | "submission";
  submitterEmail: string | null;
  submissionNotes: string | null;
  reviewNotes: string | null;
  repoCreatedAt: string | null;
  repoPushedAt: string | null;
  approvedAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface UpdateProjectBody {
  name?: string;
  description?: string | null;
  descriptionAr?: string | null;
  categoryId?: number | null;
  isFeatured?: boolean;
}

export function useAdminProjects(params: {
  status: ProjectStatus | "";
  q: string;
  page: number;
  limit?: number;
}) {
  const api = useApiClient();
  const { status, q, page, limit = 20 } = params;
  return useQuery({
    queryKey: queryKeys.projects.list({ status: status || undefined, q: q || undefined, page }),
    queryFn: () =>
      api.get<{ items: ProjectRow[]; pagination: PaginationData }>("v1/projects", {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
      }),
    placeholderData: keepPreviousData,
  });
}

export function useProjectCounts() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.projects.counts(),
    queryFn: () => api.get<ProjectCounts>("v1/projects/counts"),
  });
}

export function useReviewProject() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; status: "approved" | "rejected"; reviewNotes?: string }) =>
      api.post<ProjectRow>(`v1/projects/${input.id}/review`, {
        status: input.status,
        ...(input.reviewNotes ? { reviewNotes: input.reviewNotes } : {}),
      }),
    // `projects.all` prefixes both the list and the counts keys.
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useUpdateProject() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    // ApiClient exposes no `patch` helper — go through the raw ky instance and
    // unwrap the `{ data }` envelope ourselves.
    mutationFn: async (input: { id: number; body: UpdateProjectBody }) =>
      (
        await api.http
          .patch(`v1/projects/${input.id}`, { json: input.body })
          .json<{ data: ProjectRow }>()
      ).data,
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

export function useRefreshProject() {
  const api = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<ProjectRow>(`v1/projects/${id}/refresh`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}

// ── Newsletter subscribers ───────────────────────────────────────────────────

export interface NewsletterSubscribersResult {
  items: NewsletterSubscriberSummary[];
  pagination: PaginationData;
  isLoading: boolean;
}

/** Footer opt-ins. `pending` rows have not confirmed their double opt-in yet. */
export function useNewsletterSubscribers(
  status: NewsletterStatus | "",
  q: string,
  page: number,
  limit = 20,
): NewsletterSubscribersResult {
  const api = useApiClient();
  const query = useQuery({
    queryKey: ["admin", "newsletter-subscribers", { status, q, page, limit }],
    queryFn: () =>
      api.get<{
        items: NewsletterSubscriberSummary[];
        pagination: { page: number; limit: number; totalCount: number; totalPages: number };
      }>("v1/notifications/newsletter/subscribers", {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
      }),
    placeholderData: keepPreviousData,
  });
  return {
    items: query.data?.items ?? [],
    pagination: {
      page: query.data?.pagination.page ?? page,
      limit,
      total_count: query.data?.pagination.totalCount ?? 0,
      total_pages: query.data?.pagination.totalPages ?? 1,
    },
    isLoading: query.isLoading,
  };
}
