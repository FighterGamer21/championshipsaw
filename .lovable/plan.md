# ARCTIXMC Championship — Update Plan

I'll extend the existing app without breaking current routes/features. The current app already has: players, rounds, eliminations, settings, user_roles (admin only), admin login, players/rounds/settings/dashboard admin pages, register, live, results, bracket, rules.

## 1. Database changes (single migration)

**New tables:**
- `posts` — id, title, slug, excerpt, content, category (enum: announcement, event_update, result, rule_update, prize_update, maintenance), banner_url, is_published, is_featured, author_id, created_at, updated_at
- `bans` — id, ign (lowercase), discord_username, reason, banned_until (null = permanent), created_at, created_by

**Extend `app_role` enum:** add `owner`, `moderator` (keep existing `admin`)

**Extend `settings` table — add columns:**
- event_name, server_ip, homepage_title, homepage_subtitle, max_registrations
- rules_text, prize_details, discord_link, store_link, footer_text
- visible_sections (jsonb: which homepage sections to show)
- event_status enum widened via text check (UPCOMING / REGISTRATION_OPEN / REGISTRATION_CLOSED / LIVE / PAUSED / COMPLETED)

**Extend `players` status:** add `BANNED` to player_status enum

**Helper functions (SECURITY DEFINER):**
- `is_owner(uid)`, `is_admin_or_owner(uid)`, `is_moderator_or_above(uid)`
- `is_ign_banned(text)` — check active ban by IGN

**RLS:**
- posts: public can SELECT where `is_published = true`; admin/owner full manage; moderator read-only
- bans: only admin/owner manage; not publicly readable
- user_roles: only owner can INSERT/UPDATE/DELETE; admins read
- Update register policy on players to also block banned IGNs (via trigger that checks `is_ign_banned`)

**Trigger on players INSERT:** raise exception if IGN is banned.

**Storage bucket:** `post-banners` (public) for post images.

**Seed:** grant `owner` role to user with email `fightergamerofficial1@gmail.com` if exists (otherwise auto-grant owner on first signup with that email — handled in login page logic).

## 2. Frontend changes

**New library files:**
- `src/lib/posts.ts` — types and category metadata
- `src/lib/roles.ts` — role helpers, useRole hook (extends use-admin)

**New routes (public):**
- `/news` — list all published posts
- `/news/$slug` — single post page

**Updated routes:**
- `/` (homepage) — full redesign with editable sections: hero (title/subtitle/server IP w/ copy button + countdown + Register CTA), latest news (3 most recent), featured post banner, event details, schedule (3 days × rounds from event.ts), rules preview (truncated rules_text + link), Top 3 finalists section (pulled from players table), champion showcase (CHAMPION player or placeholder), footer with discord/store links from settings
- `/register` — simplify to: IGN (required), Discord (optional), Minecraft Version (optional, default 1.21), can_attend_all_days, agree to rules. Show "Registration is currently closed." when settings.event_status is REGISTRATION_CLOSED or registration_open is false. Success message: "You are registered for ARCTIXMC CHAMPIONSHIP — SEASON 1. Join play.arctixmc.net before the event starts." Handle banned IGN error with friendly message.
- `/admin/login` — auto-grant `owner` role to fightergamerofficial1@gmail.com on signup; otherwise grant admin only if no admins exist (bootstrap)

**New admin routes:**
- `/admin/posts` — list, create, edit, delete posts; upload banner to storage; toggle published/featured
- `/admin/posts/new` and `/admin/posts/$id` — editor with title, excerpt, content (textarea/markdown), category, banner upload, publish/feature toggles
- `/admin/bans` — list bans, create ban (by IGN/Discord, reason, duration or permanent), unban, history
- `/admin/users` — owner-only: list admins, create (invite via email/password), change role (owner/admin/moderator), disable, delete, password reset

**Updated admin routes:**
- `/admin/players` — add BANNED status, "Ban player" action that creates a ban + sets status to BANNED
- `/admin/settings` — expand form with all new editable fields; section visibility toggles (jsonb checkboxes); event status dropdown
- `/admin/dashboard` — add posts count, bans count
- `AdminShell` nav — add Posts, Bans, Users (owner-only) links

**Permissions:**
- Owner: everything including `/admin/users`
- Admin: posts, players, bans, settings, dashboard, rounds (no users)
- Moderator: players (check-in / mark alive / eliminate only) + dashboard view; no settings/posts/bans/users

Enforce in UI (hide buttons/routes) AND via RLS at DB level.

## 3. Confirmation & UX
- AlertDialog for delete/ban/disqualify/reset (already partially in place — extend to all destructive actions)
- Toast notifications via existing `sonner` setup

## 4. Out of scope (explicitly skipping)
- IP/device fingerprint banning — not safely supported in current stack without third-party services. Will note this in admin Bans page.
- Markdown rendering: keep content as plain text with line breaks for now (avoids dompurify dependency); can upgrade later.

## Technical notes
- Migration is one big SQL file with all schema changes, enum additions, helper functions, RLS, trigger, and storage bucket+policies.
- New TanStack route files use the flat naming convention (`admin.posts.tsx`, `admin.posts.$id.tsx`, `admin.bans.tsx`, `admin.users.tsx`, `news.tsx`, `news.$slug.tsx`).
- All new tables get RLS policies using existing `has_role` plus new `is_owner` / `is_moderator_or_above` helpers.
- Section visibility stored as jsonb `{ news: true, featured: true, schedule: true, rules: true, top3: true, champion: true }`.

Approve and I'll run the migration first, then implement code in a single pass.
