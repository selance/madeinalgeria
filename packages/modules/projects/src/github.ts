import type { GitHubClient, GitHubRepoData } from "@mia/contracts";

/**
 * GitHub REST client over plain fetch — no SDK (same idiom as the Resend
 * sender in @mia/email). Token is optional: unauthenticated calls share the
 * Worker egress IP's 60 req/h quota, which is fine for the odd submission but
 * unreliable at volume — deployed envs should set the GITHUB_TOKEN secret.
 */

const API_BASE = "https://api.github.com";

/** Raw REST shape — only the fields we consume. */
interface GitHubRepoResponse {
  full_name: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics?: string[];
  license?: { spdx_id: string | null } | null;
  archived: boolean;
  fork: boolean;
  private: boolean;
  owner: { login: string; avatar_url: string | null; type: string };
  created_at: string;
  pushed_at: string | null;
}

export function mapRepo(repo: GitHubRepoResponse): GitHubRepoData {
  return {
    fullName: repo.full_name,
    name: repo.name,
    description: repo.description,
    htmlUrl: repo.html_url,
    homepage: repo.homepage || null,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    topics: repo.topics ?? [],
    license: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : null,
    isArchived: repo.archived,
    isFork: repo.fork,
    isPrivate: repo.private,
    ownerLogin: repo.owner.login,
    ownerAvatarUrl: repo.owner.avatar_url,
    ownerType: repo.owner.type === "Organization" ? "Organization" : "User",
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
  };
}

export function createGitHubClient(token?: string): GitHubClient {
  return {
    async getRepo(fullName: string): Promise<GitHubRepoData | null> {
      const res = await fetch(`${API_BASE}/repos/${fullName}`, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "madeinalgeria.dev",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`GitHub repo fetch failed (${res.status}): ${body}`);
      }
      return mapRepo((await res.json()) as GitHubRepoResponse);
    },
  };
}
