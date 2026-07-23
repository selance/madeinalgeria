import type { PublicProject } from "@mia/contracts";
import { cn } from "@mia/ui";
import { Card } from "@mia/ui/components/card";
import RatingStarIcon from "@mia/ui/icons/RatingStarIcon";
import { localizePath, ui, type Locale } from "../../lib/i18n";

/**
 * One directory card. Rendered server-side in the featured grid (no directive)
 * and client-side inside ProjectsExplorer — same component, both worlds, so it
 * must stay free of hooks and browser APIs. Avatar is a plain <img> (base-ui
 * Avatar breaks in SSR islands).
 */

/** 12345 → "12.3k" — compact star counts, Western digits in both locales. */
export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/** GitHub's language dot colors for the most common languages; neutral otherwise. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Go: "#00ADD8",
  Rust: "#dea584",
  Dart: "#00B4AB",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  Jupyter: "#DA5B0B",
};

interface ProjectCardProps {
  project: PublicProject;
  locale?: Locale;
  categoryName?: string;
}

export default function ProjectCard({ project, locale = "en", categoryName }: ProjectCardProps) {
  const t = ui[locale];
  const description =
    locale === "ar" && project.descriptionAr ? project.descriptionAr : project.description;

  return (
    <a
      href={localizePath(`/projects/${project.slug}`, locale)}
      className="group block h-full focus-visible:outline-none"
    >
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:!border-primary-300 group-focus-visible:!border-primary-500">
        <div className="flex items-center gap-3">
          {project.ownerAvatarUrl ? (
            <img
              src={project.ownerAvatarUrl}
              alt=""
              loading="lazy"
              className="size-9 shrink-0 rounded-full border !border-neutral-200"
            />
          ) : (
            <span className="bg-primary-50 text-primary-600 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              {project.ownerLogin.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-bold text-neutral-900 group-hover:text-primary-600">
              {project.name}
            </h3>
            <p dir="ltr" className="truncate text-start text-xs text-neutral-400">
              {project.repoFullName}
            </p>
          </div>
        </div>

        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-neutral-500">
          <span className="flex items-center gap-1 font-semibold text-neutral-700">
            <RatingStarIcon className="fill-warning-400 size-3.5" />
            {compactCount(project.stars)}
          </span>
          {project.primaryLanguage && (
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: LANGUAGE_COLORS[project.primaryLanguage] ?? "#9ca3af" }}
              />
              {project.primaryLanguage}
            </span>
          )}
          {categoryName && (
            <span className="rounded-md bg-neutral-200 px-2 py-0.5 text-neutral-600">
              {categoryName}
            </span>
          )}
          {(project.isArchived || project.isActive) && (
            <span
              className={cn(
                "ms-auto rounded-md px-2 py-0.5 font-medium",
                project.isArchived
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-success-50 text-success-700",
              )}
            >
              {project.isArchived ? t.projects.archived : t.projects.active}
            </span>
          )}
        </div>
      </Card>
    </a>
  );
}
