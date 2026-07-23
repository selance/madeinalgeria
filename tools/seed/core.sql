-- Seed: core reference data + billing plans (idempotent).
-- Run: pnpm --filter @mia/api seed:local  (or seed:staging)
-- Seeding is CLI-only — never add HTTP seeding endpoints.

INSERT OR IGNORE INTO languages (id, code, name) VALUES
  (1, 'fr', 'Français'),
  (2, 'ar', 'العربية'),
  (3, 'en', 'English');

INSERT OR IGNORE INTO countries (id, code, name, currency_code, phone_prefix, is_active, created_at, updated_at) VALUES
  (1, 'DZ', 'Algeria', 'DZD', '+213', 1, strftime('%s','now'), strftime('%s','now'));

INSERT OR IGNORE INTO country_translations (id, country_id, language_id, name) VALUES
  (1, 1, 1, 'Algérie'),
  (2, 1, 2, 'الجزائر'),
  (3, 1, 3, 'Algeria');

-- A few states to browse with (replace per product/market).
INSERT OR IGNORE INTO states (id, country_id, code, is_active) VALUES
  (16, 1, '16', 1),
  (31, 1, '31', 1),
  (25, 1, '25', 1);

INSERT OR IGNORE INTO state_translations (id, state_id, language_id, name) VALUES
  (1, 16, 1, 'Alger'),   (2, 16, 2, 'الجزائر'),
  (3, 31, 1, 'Oran'),    (4, 31, 2, 'وهران'),
  (5, 25, 1, 'Constantine'), (6, 25, 2, 'قسنطينة');

-- Project categories: the directory taxonomy (languages: 1=fr, 2=ar, 3=en).
INSERT OR IGNORE INTO categories (id, slug, sort_order, is_active) VALUES
  (1, 'web', 1, 1),
  (2, 'mobile', 2, 1),
  (3, 'libraries-frameworks', 3, 1),
  (4, 'devops-infra', 4, 1),
  (5, 'data-ai', 5, 1),
  (6, 'tools-cli', 6, 1),
  (7, 'games', 7, 1),
  (8, 'education', 8, 1);
INSERT OR IGNORE INTO category_translations (id, category_id, language_id, name) VALUES
  (1,  1, 1, 'Web'),                          (2,  1, 2, 'الويب'),               (3,  1, 3, 'Web'),
  (4,  2, 1, 'Mobile'),                       (5,  2, 2, 'الجوال'),              (6,  2, 3, 'Mobile'),
  (7,  3, 1, 'Bibliothèques et frameworks'),  (8,  3, 2, 'مكتبات وأطر عمل'),     (9,  3, 3, 'Libraries & Frameworks'),
  (10, 4, 1, 'DevOps et infrastructure'),     (11, 4, 2, 'DevOps وبنية تحتية'),  (12, 4, 3, 'DevOps & Infrastructure'),
  (13, 5, 1, 'Données et IA'),                (14, 5, 2, 'بيانات وذكاء اصطناعي'), (15, 5, 3, 'Data & AI'),
  (16, 6, 1, 'Outils et CLI'),                (17, 6, 2, 'أدوات وسطر أوامر'),    (18, 6, 3, 'Tools & CLI'),
  (19, 7, 1, 'Jeux'),                         (20, 7, 2, 'ألعاب'),               (21, 7, 3, 'Games'),
  (22, 8, 1, 'Éducation'),                    (23, 8, 2, 'تعليم'),               (24, 8, 3, 'Education');

-- Billing plans: the FREE fallback plan (id 1) must exist; entitlements
-- default to it when a user has no subscription.
INSERT OR IGNORE INTO plans (id, name, description, price, interval, features, is_active, created_at, updated_at) VALUES
  (1, 'free', 'الخطة المجانية', 0, 'monthly', '[]', 1, strftime('%s','now'), strftime('%s','now')),
  (2, 'pro',  'الخطة الاحترافية', 0, 'monthly', '[]', 1, strftime('%s','now'), strftime('%s','now'));

-- First admin user: sign up normally, then promote (see SETUP.md §10):
--   wrangler d1 execute mia-core --local --command "UPDATE user SET role='admin' WHERE email='you@example.com'"
