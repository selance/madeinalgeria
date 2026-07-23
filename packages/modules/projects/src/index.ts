// Public surface of the projects module (module anatomy per CLAUDE.md).
export { ProjectsRepo, type ProjectRow, type NewProjectRow } from "./repo";
export {
  ProjectsService,
  toPublicProject,
  repoFullNameFromUrl,
  type ProjectsKV,
} from "./service";
export { createGitHubClient } from "./github";
export { createProjectsRouter, type ProjectsRouterDeps } from "./router";
export { createProjectsAdminRouter, type ProjectsAdminDeps } from "./admin-router";
