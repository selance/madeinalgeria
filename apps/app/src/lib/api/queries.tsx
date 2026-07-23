import { useMutation, useQuery } from "@tanstack/react-query";
import type { CategoryItem, Entitlements, Profile } from "@mia/contracts";
import { queryKeys, useApiClient } from "@mia/api-client";

/**
 * TanStack Query idiom reference for the app. Every hook keys through the
 * shared `queryKeys` factory and talks to the flat public API (no market
 * segment) via `useApiClient`.
 */

/** The signed-in user's identity profile. */
export function useProfile() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.me.profile,
    queryFn: () => api.get<Profile>("v1/me/profile"),
  });
}

/** Billing entitlements for the current user (free by default). */
export function useSubscription() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.me.subscription,
    queryFn: () => api.get<Entitlements>("v1/me/subscription"),
  });
}

/** Reference dropdown data — category taxonomy (reference idiom sample). */
export function useCategories() {
  const api = useApiClient();
  return useQuery({
    queryKey: queryKeys.reference.categories(),
    queryFn: () => api.get<CategoryItem[]>("v1/reference/categories"),
    staleTime: 60_000,
  });
}

/**
 * Multipart image upload. Posts the raw `FormData` through the ky instance
 * (`api.http`) so the browser sets the multipart boundary itself, and returns
 * the stored asset `{ url }`.
 */
export function useUploadImage() {
  const api = useApiClient();
  return useMutation({
    mutationFn: async ({ file, imageType }: { file: File; imageType?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (imageType) form.append("imageType", imageType);
      const res = await api.http
        .post("v1/images/upload", { body: form })
        .json<{ data: { url: string } }>();
      return res.data;
    },
  });
}
