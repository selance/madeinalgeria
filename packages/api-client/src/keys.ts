/** Central query-key factory — every hook keys through here, no ad-hoc keys. */
export const queryKeys = {
  reference: {
    all: ["reference"] as const,
    languages: () => [...queryKeys.reference.all, "languages"] as const,
    countries: () => [...queryKeys.reference.all, "countries"] as const,
    states: (countryId: number) => [...queryKeys.reference.all, "states", countryId] as const,
    categories: () => [...queryKeys.reference.all, "categories"] as const,
    legalForms: () => [...queryKeys.reference.all, "legal-forms"] as const,
    companyNatures: () => [...queryKeys.reference.all, "company-natures"] as const,
  },
  me: {
    profile: ["me", "profile"] as const,
    subscription: ["me", "subscription"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: (filters: { status?: string; q?: string; page?: number }) =>
      [...queryKeys.projects.all, "list", filters] as const,
    counts: () => [...queryKeys.projects.all, "counts"] as const,
  },
} as const;
