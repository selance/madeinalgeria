// Public surface of the reference module (plan §1 module anatomy).
export { ReferenceRepo } from "./repo";
export { ReferenceService, type ReferenceKV } from "./service";
export { createReferenceRouter } from "./router";
export { createReferenceAdminRouter, type ReferenceAdminDeps } from "./admin-router";
