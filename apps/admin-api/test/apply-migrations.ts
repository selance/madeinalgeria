import { applyD1Migrations, env } from "cloudflare:test";

// Runs once per test file (isolated storage rolls back between tests).
await applyD1Migrations(env.DB_CORE, env.TEST_CORE_MIGRATIONS);
