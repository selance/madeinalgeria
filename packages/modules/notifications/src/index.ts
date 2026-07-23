// Public surface of the notifications module (plan §1 module anatomy).
export { NotificationsRepo } from "./repo";
export { NotificationsService } from "./service";
export { createNotificationsRouter, type NotificationsRouterDeps } from "./router";
export { createNotificationsAdminRouter, type NotificationsAdminDeps } from "./admin-router";
// Unsubscribe-link signing for bulk mail sent outside the campaign pipeline
// (e.g. the monthly performance digest) — same signature the public
// /newsletter/unsubscribe route verifies.
export { signEmail } from "./token";
