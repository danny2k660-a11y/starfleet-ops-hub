# Starfleet Ops Hub — Implementation Audit and Completion Plan

Audit basis: repository, CI and connected Supabase inspection on 2026-10-12. The active data-bearing Supabase project has been inspected and additive schema migrations applied; hosted deployment environment values remain inaccessible, so the exact backend used by the public Lovable URL still needs confirmation. Do not interpret "present in source" as "verified working".

## Current source observations

- The repository is a React 19 / TypeScript application using TanStack Start/Router, Tailwind CSS, shadcn/Radix UI components, Supabase, React Query, Capacitor, and Playwright.
- The README describes character registry, ship catalogue and personal ship records, build/loadout relationships, equipment/inventory, theme tracking, and Android APK workflow.
- `src/components/app-shell.tsx` has desktop sidebar navigation, mobile drawer, and a five-item fixed bottom navigation. Mobile labels were raised to 11px and the LCARS panel/status tokens were expanded.
- `src/styles.css` already defines a dark space palette, Orbitron/Rajdhani typography, panels and a coarse-pointer 16px control rule intended to prevent Android focus zoom. This is a useful base for a more authentic LCARS command console.
- The landing page is an entry/sign-in page, not evidence of the authenticated operational dashboard.
- The repository has multiple dated Supabase migrations, catalogue seed/reconciliation migrations, and CI/E2E/web-build/Android workflows. Their existence alone does not establish that migrations are safe or tests pass.
- The package scripts shown in `package.json` include dev/build/lint/Android sync; no direct `test` or `typecheck` script was visible in the scripts object. Inspect workflow files and Playwright configuration before deciding how to run each check.

## Feature matrix

Status definitions: **Present in source** means repository documentation or files indicate an implementation exists; **Needs runtime verification** means no successful test is claimed; **Not audited** means source evidence is insufficient.

| Feature | Current status | Required work | Test method | Verified result |
|---|---|---|---|---|
| LCARS / Star Trek computer appearance | Partial; dark sci-fi theme exists | Improve authentic LCARS information hierarchy, segmented panels, system status, restrained amber/cyan accents; retain readable mobile controls | Visual review at 360px, 390px and desktop widths | Not run |
| Mobile navigation and zoom prevention | E2E smoke test passed; Android WebView still needs a device check | Test drawer, bottom nav, safe-area padding, 16px inputs, pinch zoom, browser back and scroll restoration | Playwright mobile viewport + real Android WebView | CI E2E passed; no physical device run |
| Three independent captains | Described in README | Verify create/edit/switch/refresh/delete confirmation and user scoping | E2E CRUD + refresh + repeat switching | Not run |
| Character data supplied by user | Not verified in database | Reconcile Daniel David Smith, Jehkem, Temman'Rax without duplicating records | Backup/export, compare, then safe import/merge preview | Not run |
| Ship reference catalogue | Present in source/migrations; accuracy unknown | Validate canonical IDs, duplicate names, source/version and completeness metadata | SQL integrity report + sample source checks | Not run |
| Personal ship ownership vs catalogue | Separation described in README | Verify catalogue entries never imply ownership; report separate counts | Seed unowned ship, verify all counters and assignments | Not run |
| Account-wide vs character-specific ship access | Described in README | Validate entitlement and character assignment relationships, faction rules, unique constraints | Integration tests for account-wide and restricted ships | Not run |
| User's 87 listed ships and 16 bundles | User-provided list; not reconciled to live data | Import as a reviewable proposed collection only; deduplicate canonical references; ownership must be explicitly confirmed and not inferred from catalogue | Import preview, duplicate report, user confirmation, export diff | Not run |
| Bundle entitlement and included unlocks | Needs audit | Store bundle ownership separately; map verified contents; show claimable unlocks without auto-equipping | Bundle mapping tests and duplicate prevention | Not run |
| Ship stats / slots / BOff seating | Seed and reconciliation migrations exist; full accuracy unknown | Validate sourced fields; unknown stays unknown; track verification provenance | Compare sample records against STO Wiki and source date | Not run |
| T6-X / T6-X2 upgrade slots | Not verified | Model ship upgrade state and derive extra universal console/device/trait capacity according to confirmed game rules | Unit tests per upgrade tier and slot category | Not run |
| Space build editor / loadout IDs | README says build library exists; runtime unknown | Verify stable IDs, slot capacity, saves/reloads, versions, compatibility and no cross-character overwrite | Create/edit/save/refresh/duplicate/restore E2E | Not run |
| Ground builds / trait search | Component exists; user reports trait workflow needs work | Inspect ground build selector/query and repair end-to-end search and assignment | Search partial name, filter category, assign/remove, refresh | Not run |
| Equipment catalogue and inventory | Migration files and README indicate implementation | Verify owned/unlocked/claimable/equipped/missing/unverified distinctions and safe deletes | CRUD + foreign-key + isolation tests | Not run |
| Traits and unlocks | Migration files and README indicate implementation | Separate character unlocks from equipped slots; validate compatibility | Search/assign/remove and persistence tests | Not run |
| Bridge officers and abilities | Migration file exists; runtime unknown | Validate station seating and specialisation, persist per build, warn on unavailable officers | Compatible/incompatible station tests | Not run |
| Duty officers and reputation | User requested; completeness unknown | Audit existing schema/UI; implement only missing pieces | Character-separated CRUD and persistence tests | Not run |
| Carrier hangars/pets | Not verified | Enforce hangar capacity, support pet variants and ship compatibility | Carrier and non-carrier test fixtures | Not run |
| Theme checker | README says theme tracking exists | Audit rules; add captain-specific Terran/Tal Shiar/Borg/Dominion guidance without blocking intentional off-theme choices | Unit tests on themed and mixed builds | Not run |
| Set-bonus tracking | Not verified | Catalogue set membership and piece counts, show thresholds without inventing effects | Known set fixtures + incomplete data behavior | Not run |
| Copy build to another ship | Not verified | Copy compatible slots, preserve source, report skipped/incompatible items before commit | Cross-layout copy tests | Not run |
| Share build | Not verified | Generate portable text/JSON export with privacy-safe fields | Round-trip and escaping tests | Not run |
| Bundle/store catalogue and upgrade planning | Partially described | Search, acquisition sources, owned bundle status, missing item goals and project checklists | CRUD/search and ownership separation tests | Not run |
| Wiki reference lookup for newly claimed ships | Not verified | Add STO Wiki link/import preview; record source URL/retrieval date/verification status; never auto-claim or equip | Fixture-based import validation and manual live-source test | Not run |
| JSON backup/import/recovery | Not verified | Export all personal data, preview/validate imports, preserve IDs/relationships, audit log, safe restore | Round-trip, malformed JSON, duplicate and FK tests | Not run |
| Database RLS and privacy | Key ownership paths audited; wider legacy-table audit remains | Inspect every table policy and user_id ownership path before changes | SQL policy audit + two-user isolation tests | New-table RLS verified; cross-user character read returned zero rows; internal catalogue audit table is explicitly denied to clients |
| Build/lint/type-check/CI | Automated workflows now run on the overhaul branch | Inspect workflow scripts, run checks, fix errors and report exact outcomes | GitHub Actions CI, web build and Playwright E2E | Latest runs must be checked before release; previous branch revision passed CI, web build and E2E |
| PWA / APK | Capacitor and APK workflow described | Verify install manifest/offline boundaries and APK workflow artifact | Workflow run and device install smoke test | Not run |

## Safe implementation sequence

1. Finish repository/schema/RLS/CI audit and capture a database backup/export before any destructive operation.
2. Establish repeatable build, lint, type-check and E2E test commands.
3. Fix character persistence, ownership/access relationships, duplicate constraints and loadout foreign keys.
4. Reconcile the user's listed ships and bundles via a preview; do not treat a supplied catalogue list as verified ownership.
5. Repair slot modelling, T6-X/T6-X2, build editors, equipment and trait search.
6. Complete theme/set bonuses, BOff/DOFF/reputation/carrier management, copy/share, upgrade planning.
7. Add verified STO Wiki lookup with source attribution and import review.
8. Complete backup/restore, diagnostics, responsive LCARS redesign, regression/security tests and deployment verification.

## Guardrails

- No destructive cleanup or live database migration before backup and review.
- Never seed the user's ownership from public catalogue data.
- Never mark a ship's included equipment as installed automatically.
- Never invent ship statistics, acquisition sources, set bonuses or unlocks.
- Do not mark tests passed until the corresponding command or workflow has actually succeeded.
- Keep this document updated with real test output and links to commits/CI runs.


## Additional implementation progress (2026-10-12)

### Implemented on `work/starfleet-computer-overhaul`

- Repaired project and resource screens to use the actual migration-backed `projects`, `project_tasks`, and `resource_balances` tables instead of stale `sto_*` names. Project tasks now use the schema's `done` boolean.
- Separated stored inventory from equipped character equipment. The inventory screen uses `inventory_items`; added nullable gear metadata columns for slot, rarity, mark and source. Existing equipment rows are not automatically copied or deleted.
- Added character-owned bridge officer records for user-entered officer names/careers rather than writing unsupported columns into the catalogue-linked `character_boffs` table.
- Added a per-character reputation tracker with editable tier, progress percentage, daily-project flag and notes. Reputation names are user-entered; no assumed progress is seeded.
- Added build snapshot history, side-by-side build comparison, JSON snapshot copying and a transactional copy-to-ship RPC. Cross-character copy deliberately omits character-bound equipment, duty officers, hangar pets and ground selections.
- Added a carrier hangar pet roster per loadout. Names are explicitly user-entered, with optional source links and notes; the app does not guess pets from ship class.
- Added an equipment set tracker based on assigned items linked to the equipment catalogue. Bonus effects are displayed only when a verified source record exists; the new reference table is intentionally not seeded with guessed bonus data.
- Added Tal Shiar/Borg Integration and Dominion Vanguard theme presets.
- Expanded portable backup coverage to include reputation records, custom bridge officers, build versions and hangar pets. Restore remaps user IDs, imports parents before children, handles the circular build/ship relationship in a second pass, and uses upserts rather than deleting records.
- Corrected ship-claim default naming, made ship-derived traits available without auto-equipping them, improved partial-failure messages, and added validate/apply actions to the STOWiki ship-catalog import review.
- Added missing table/function type definitions and a TypeScript check to CI. Fixed a strict TypeScript error in settings diagnostics. The mobile viewport now preserves user pinch-zoom accessibility while keeping controls at 16px or larger. The ship-unlock helper uses the canonical `Experimental` equipment category, and ship registration waits for a confirmed fleet record.

### Live database work and remaining release gate

- The active data-bearing Supabase project was inspected before changes. It contained 28 character rows, 831 shared ship catalogue rows, 2 builds, 1 loadout, 3 equipment rows, and no personal ship assignments. Those counts were rechecked after migration; no character, ship, build, loadout or equipment rows were deleted or rewritten.
- Applied additive compatibility and feature migrations to the active project: current `projects`, `project_tasks`, `resource_balances`, `inventory_items`, and `profiles` tables; project category and inventory metadata; crew/DOFF/BOFF catalog and roster schema; character ship unlocks; ground-loadout integrity with JSONB trait/specialization arrays; loadout trait ownership/catalog links; build planning fields; ship visual identity; custom bridge officers; build version snapshots; copy-to-ship RPC; verified set-bonus reference table; carrier hangar pets; character reputation tracking; user audit log; and security/performance indexes and policies. Legacy `sto_projects`, `sto_project_tasks`, and `sto_resource_balances` tables were preserved rather than renamed or deleted.
- Verified RLS is enabled on new personal tables and policies scope rows to the signed-in owner. A cross-user character visibility check returned zero rows. A transaction-scoped ship-claim/copy test left the personal ship, ownership, build and loadout counts unchanged; the connector did not expose the RPC result reliably, so a full authenticated UI-level test remains required.
- Supabase advisors now report no unindexed foreign keys, duplicate indexes, duplicate permissive policies, or RLS-enabled tables without a policy. Remaining warnings are unused indexes on a sparse/catalogue-heavy database and anonymous sign-in being enabled; the latter is intentional for the current no-friction sign-in flow and should not be disabled without a product decision.
- A separate Supabase project named for the app was restored, but it currently has zero public tables and zero auth users. The repository's configured project ID is not accessible through the current connection, so the public Lovable deployment's exact Supabase URL still cannot be confirmed. Do not seed user records or switch the app to the empty project until that mapping is verified.
- Eleven duplicate migration version prefixes in the repository were normalized, and CI now checks that every migration has a unique 14-digit version. The live migration ledger still differs from repository filenames because earlier changes were applied through the connected database tool; do not run a blanket `supabase db push` until the ledger is reconciled.
- CI, web-build and Playwright E2E all passed on commit `d2c406b9` (including migration filename validation). The pull request remains draft because authenticated integration testing against the backend actually used by the hosted app remains a release gate.
