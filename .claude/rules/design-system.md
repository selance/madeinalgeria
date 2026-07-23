# Design system & dashboard UI standards

Read this before touching any React page in `apps/app` or `apps/admin-web` (and UI islands in `apps/web`).

## The showcase page

`apps/app` serves a design-system showcase at `/` (`apps/app/src/pages/design-system/DesignSystemPage.tsx`) — every token scale, primitive, overlay, table, pagination, skeleton, and the canonical form on one page. It exists so a rebrand (editing `packages/ui/src/styles/config.css`) can be reviewed at a glance. **When you add or visually change a `@mia/ui` primitive, add/update its specimen on this page in the same task.** Products keep it during design iteration and repoint `/` when they ship.

## Source of truth

- All primitives live in `packages/ui`. Import per file: `@mia/ui/components/button`, `…/dialog`, `…/select`, `…/pagination`, `…/skeleton`, `…/table`, `…/toast`, `…/input-group`, `…/label` (`FieldRoot`/`Label`). Root `@mia/ui` exports only `cn`, `buttonVariants`/`inputVariants`, avatar helpers, `useIsMobile`.
- Tokens: `packages/ui/src/styles/config.css` — the editorial "print on paper" palette: `primary-*` is deep pine green, `neutral-*` is warm paper, `secondary-*` is a muted steel-blue accent, semantic scales are muted to print chroma (success sits at hue 140 to stay distinct from the green primary; info at hue 205 to stay distinct from the blue secondary). `--radius: 6px` (controls), `rounded-card` (12px), shadows are flat zero-blur "print block" offsets (`shadow-*`, `drop-shadow-default*`) — depth comes from hairline borders + one hard offset, never soft glows. Solid buttons rest on a 2px offset block and translate down onto it when pressed (see `styles/ui/buttons.ts`). Almarai font. Never hardcode hex colors or ad-hoc shadows/radii in pages. Rebranding a product = editing the OKLCH scales in this one file.
- Everything is Arabic RTL: `dir="rtl"`, Arabic labels/empty states. Numbers in Western digits (`toLocaleString("ar-DZ")`), never Arabic-Indic numerals.
- **Reuse before writing.** Check `@mia/ui` and the app's `components/` dir first; if a pattern appears on 2+ pages, extract it into a shared component (app-level `components/` or `packages/ui` if both apps need it). `apps/admin-web` shared pieces: `DataTable`, `SearchBar`, `FilterPopover`.

## Pagination — the standard

The canonical implementation is `PaginationControls` (`packages/ui/src/components/ui/pagination.tsx`):

- Numbered pages with "صفحة X من Y", first/prev/next/last icon buttons, windowed page numbers, and a clickable ellipsis that turns into a go-to-page input.
- Page state lives in the URL (`?page=`), resets to 1 on new search/filter, scrolls to top on change.
- Render only when `total_pages > 1`.

Admin's `DataTable` (`apps/admin-web/src/components/DataTable.tsx`) accepts `pagination` + `onPageChange` (numbered) and falls back to keyset "load more" only where the endpoint has no total count. Usage reference: `apps/admin-web/src/pages/UsersPage.tsx`. **Every admin list page should use numbered `PaginationControls` when totals are available — do not leave lists on load-more or unpaginated when they can be numbered.**

Keyset infinite lists on the user side use `useInfiniteQuery` with the endpoint's `nextCursor` — see `apps/app/src/lib/api/queries.tsx`.

## Skeletons — the standard

Every page/data view gets a loading skeleton that mirrors the real layout anatomy:

- References: `apps/app/src/pages/dashboard/DashboardPage.tsx` (its skeleton block) and `apps/admin-web/src/pages/skeletons/AdminSkeletons.tsx`.
- Idiom: real `Card`/table structure with `animate-pulse` neutral-200 blocks sized like the actual content (avatar tile, heading line, text lines, button block), so nothing jumps when data arrives.
- **Anti-pattern** (never do): one big gray `h-64 animate-pulse` box, or plain gray rows without the column structure of the real table.

## Forms — the standard (inherited from the auth forms)

Every form in every app follows the anatomy of **`apps/app/src/components/auth/LoginForm.tsx`** and **`RegisterForm.tsx`** — copy them, do not invent new form plumbing:

1. **Schema first**: a zod schema declared above the component with **Arabic validation messages** on every rule (`z.string().min(1, "البريد الإلكتروني مطلوب").email("البريد الإلكتروني غير صحيح")`), and the values type derived via `z.infer<typeof schema>`.
2. **`useForm` + `zodResolver`** with explicit `defaultValues` — never uncontrolled ad-hoc state forms, never manual validation.
3. **Field anatomy**: `FieldRoot` wrapping the field stack; each field is `Label htmlFor` + design-system `Input`/`Textarea`/`InputGroup`/`Select` with `{...register("name")}`, `data-invalid={errors.name}`, and `disabled={isPending}`; the error rendered directly under the control as `{errors.name && <p className="text-error-600 pr-2.5 text-xs">{errors.name.message}</p>}`.
4. **Submission**: a typed `SubmitHandler`, pending boolean state, top-level submit-error rendered in the `error-*` token banner style LoginForm uses, submit `Button` with `disabled={isPending}` and a pending label ("جاري ..."). Each button reflects only its **own** pending state (see the LoginForm comment about the Google button).
5. **Feedback**: toast on success/failure for in-page forms; forms inside a `Dialog` also reset on close (see `apps/app/src/pages/account/AccountSettingsPage.tsx` for the dialog-form variant with `Dialog`/`DialogPopup`/`DialogHeader`/`DialogTitle`/`DialogClose`).

A live copyable demo of this pattern is on the design-system page (`/` in apps/app), section "النموذج القياسي".

**Known trap**: when adding a `Select` inside a `Dialog`, verify the popup layers above subsequent fields (stacking/z-index inside the dialog) — this has bitten before.
