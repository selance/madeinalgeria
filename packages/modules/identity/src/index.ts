// Public surface of the identity module (plan §1 module anatomy).
export { IdentityRepo } from "./repo";
export { IdentityService } from "./service";
export { createIdentityRouter, type IdentityRouterDeps } from "./router";
export { createIdentityAdminRouter, type IdentityAdminDeps } from "./admin-router";
