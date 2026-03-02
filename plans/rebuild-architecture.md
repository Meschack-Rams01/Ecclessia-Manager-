# Rebuild Plan (Senior Level) — ChurchReport / Emerge in Christ

## 0) Executive summary

The current codebase works as a single-page app (SPA) built with Vite + TypeScript, but it mixes UI rendering, routing, business rules, persistence, and sync concerns in one large file. This creates high maintenance risk, security risk (client-side passwords), and makes scaling to real multi-user usage difficult.

**Target end-state**: production-grade architecture with:

- clear separation (Presentation / Application / Domain / Infrastructure)
- robust authentication + authorization
- one source of truth for data
- consistent validation + error handling
- predictable real-time sync
- improved DX (lint/format/tests/docs)

This document provides:

1) an analysis of the project and its issues
2) a proposed architecture (clean + scalable)
3) a new folder structure
4) a progressive migration plan
5) standards & practices to enforce
6) performance/scalability recommendations
7) examples of refactored code (illustrative)

---

## 1) Analyse initiale (objectif métier + constats)

### 1.1 Objectif métier réel

The product is a **multi-extension church reporting system**:

- Admin creates and manages “extensions” (local churches/sites)
- Extensions submit service reports (“rapports”) containing:
  - attendance breakdown
  - offerings breakdown
  - computed deductions (tithe/social) and remaining balance
  - expenses and final balance
  - new converts (contact info)
- Dashboards provide analytics and comparison
- Exports: print-friendly HTML + PDF + DOCX + CSV

### 1.2 Current architecture (what it actually is)

- UI is built as string templates and written into the DOM (no framework)
- Routing is hash-based
- Persistence is primarily localStorage, with optional remote sync:
  - Firebase Firestore CRUD + snapshot listeners
  - Supabase Postgres realtime subscription (for extensions) and sync fetch

### 1.3 Problems / anti-patterns

#### A) Responsibilities not separated (God file)

- Most behavior lives in `src/app/index.ts` (routing + pages + exports + domain rules).
- Changes are risky because unrelated concerns are coupled.

#### B) Global functions + inline event handlers

- Many `window.*` exports and inline `onclick="..."`.
- Refactors break UI silently; no type-safety for handler names.

#### C) Duplicate business rules

- “ventilation” computation exists in multiple places; drift risk.
- Totals and validations are recomputed inconsistently.

#### D) Security risks (production-critical)

- Passwords stored and checked entirely on the client.
- Any user can inspect or modify localStorage.
- No real authorization boundary.

If this is used by multiple people in production, this must be replaced with server-backed auth + RLS.

#### E) Data consistency and sync ambiguity

- Firebase and Supabase are both used.
- “source of truth” and conflict rules are unclear.
- Local storage is mutated directly by realtime callbacks.

#### F) Maintainability and testability

- Business logic is embedded in view templates.
- Hard to unit test.

### 1.4 Performance / scalability issues

- All reports are loaded into memory and filtered client-side.
- No pagination; exports build large HTML strings.
- Repeated sorting/filtering across pages.

---

## 2) Proposed architecture (Senior level)

### 2.1 Core principles

- **Single source of truth** (remote DB), client cache optional.
- **Clean Architecture layering**:
  - **Domain**: entities + pure business rules (no DOM, no storage)
  - **Application**: use-cases (orchestrate domain + repositories)
  - **Infrastructure**: Supabase/Firebase/Local adapters
  - **Presentation**: UI, routing, components
- **Security by design**: Auth, permissions, DB RLS.
- **Progressive migration**: don’t rewrite everything at once.

### 2.2 Technology choice (recommended baseline)

You have two viable rebuild tracks:

#### Track A (Minimal change, faster): keep “vanilla TS” UI

- Keep Vite + TS.
- Replace string-template UI with small view helpers and event delegation.
- Still implement Clean Architecture in modules.

Pros: fastest, minimal UX changes.
Cons: still more manual than a component framework.

#### Track B (Recommended for long-term): React (or Vue/Svelte) + typed routing

- React + Vite + TypeScript.
- Componentized pages, controlled forms, safer rendering.

Pros: maintainable at scale, easier tests, safer UI.
Cons: bigger migration.

This plan describes Track B as the recommended end-state, but the layering works for both.

### 2.3 Frontend / Backend separation

#### Backend (Supabase-first)

Use Supabase as primary backend:

- Postgres DB for `extensions`, `rapports`, `settings`.
- Supabase Auth for users.
- RLS policies:
  - Admin can read/write all
  - Extension users can read/write their own extension + its reports
- Realtime subscriptions to keep UI updated.

Firebase can be retired *or* kept only as legacy migration input.

#### Frontend

- Authenticated SPA.
- Local caching layer (optional) for offline/poor network.
- Domain rules in shared TS modules.

---

## 3) New project structure (Clean Architecture)

### 3.1 Target monorepo structure (single repo)

```
.
├─ apps/
│  └─ web/
│     ├─ index.html
│     ├─ src/
│     │  ├─ app/                    # app bootstrap, routing, DI
│     │  ├─ pages/                  # route-level pages
│     │  ├─ components/             # reusable UI components
│     │  ├─ features/               # feature slices (admin, rapports, exports)
│     │  ├─ domain/                 # pure business logic
│     │  ├─ application/            # use-cases
│     │  ├─ infrastructure/         # supabase adapters, storage, logging
│     │  ├─ styles/
│     │  └─ main.ts
│     ├─ tests/
│     └─ vite.config.ts
├─ packages/
│  ├─ shared/                       # types, validators, utilities
│  └─ eslint-config/ (optional)
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql
│  └─ policies.sql
├─ docs/
│  ├─ architecture.md
│  ├─ security.md
│  └─ migration-plan.md
├─ .env.example
├─ package.json
└─ README.md
```

### 3.2 What to remove / refactor from current project

- Refactor `src/app/index.ts` into:
  - `pages/*` (UI only)
  - `domain/*` (pure functions)
  - `application/*` (use cases)
  - `infrastructure/*` (storage/sync)

- Remove client-side password storage from `Extension.password`.
  - Replace with user accounts in Supabase Auth.
  - If you must keep “extension password” behavior: store **hashed** password server-side and validate via backend function.

- Unify sync: pick **one** remote backend. Recommended: Supabase.

---

## 4) Progressive migration plan (without breaking everything)

### Phase 0 — Stabilize current app (1–2 days)

- Fix runtime errors (DOM IDs, broken markup).
- Centralize ventilation computation into one helper.
- Add HTML escaping for user-provided strings.
- Add `.env.example` and document required env vars.

### Phase 1 — Create the “new core” alongside old UI (3–7 days)

- Introduce `domain/` and `application/` modules.
- Keep current pages but call new modules.
- Write unit tests for domain rules.

### Phase 2 — Replace persistence layer (1–2 weeks)

- Implement `RapportRepository` and `ExtensionRepository` interfaces.
- Create a `Supabase*Repository` adapter.
- Use feature flags:
  - `USE_REMOTE=true` to write/read remote
  - fallback to local cache for offline

### Phase 3 — Rebuild UI incrementally (1–3 weeks)

- Migrate one route at a time to React (or improved vanilla).
- Keep existing hash router temporarily; later move to proper router.

### Phase 4 — Security hardening (parallel)

- Supabase Auth integration.
- RLS policies.
- Role mapping: admin vs extension user.
- Remove passwords from client state.

---

## 5) Standards & best practices (production)

### 5.1 SOLID + Clean Architecture mapping

- **S**: each module has one responsibility (domain rules ≠ UI)
- **O**: repositories are interfaces; infra adapters are swappable
- **L**: mock repositories in tests without changing use cases
- **I**: small interfaces (`RapportRepository`, `AuthGateway`)
- **D**: DI in app bootstrap (construct use-cases with adapters)

### 5.2 Error handling + logging

- Use typed `Result<T, E>` for application layer.
- Infrastructure logs are structured (level, event, context).
- UI displays user-friendly errors.

### 5.3 Validation

- Validate DTOs at boundaries:
  - UI form → DTO validation (client)
  - API / DB write → validation (server)
- Use a schema library (zod) in `packages/shared`.

### 5.4 Environments

- `.env` for client public keys (Supabase anon key is public).
- server-side secrets only in Supabase environment (service role key never shipped).

### 5.5 Security (auth + permissions)

- Use Supabase Auth users.
- Implement RLS policies:
  - extension user can only access rows for their `extension_id`.
- Store PII (phones) with access control.

---

## 6) Performance & scalability recommendations

### 6.1 Database model

Option 1 (fastest migration): keep `data` as JSONB

- `extensions (id uuid/text primary key, data jsonb, updated_at)`
- `rapports (id uuid/text primary key, extension_id, date, data jsonb, updated_at)`

Option 2 (recommended long-term): normalize key fields

- keep analytics fields as columns for indexing (date, totals, counts)
- keep full payload in JSONB if needed

### 6.2 Indexing

- Index `rapports(extension_id, date desc)`
- Index `rapports(date desc)` for admin browsing

### 6.3 Pagination

- Admin “all rapports” should paginate (limit/offset or cursor)
- Extension list for admin can be cached

### 6.4 Caching

- Client-side cache (in-memory + localStorage) with versioning.
- Cache invalidation via realtime events.

---

## 7) Examples of refactored code (illustrative)

These examples show how to centralize business rules and isolate infrastructure.

### 7.1 Domain: compute ventilation (single source of truth)

```ts
// domain/finance/computeVentilation.ts
export type OfferingBreakdown = {
  ordinaires: number;
  orateur: number;
  dimes: number;
  actionsGrace: number;
};

export type Ventilation = {
  ordinaires: { dime: number; social: number; reste: number };
  orateur: { dime: number; social: number; reste: number };
  dimes: { dime: number; social: number; reste: number };
  actionsGrace: { dime: number; social: number; reste: number };
  totalDime: number;
  totalSocial: number;
  reste: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeVentilation(input: OfferingBreakdown, socialPct: number): Ventilation {
  const social = socialPct / 100;

  const ord = input.ordinaires;
  const ora = input.orateur;
  const dim = input.dimes;
  const ag = input.actionsGrace;

  const calc = (amount: number, applyDime: boolean, applySocial: boolean) => {
    const dime = applyDime ? round2(amount * 0.1) : 0;
    const soc = applySocial ? round2(amount * social) : 0;
    const reste = round2(amount - dime - soc);
    return { dime, social: soc, reste };
  };

  const ordinaires = calc(ord, true, true);
  const orateur = calc(ora, false, false);
  const dimes = calc(dim, true, true);
  const actionsGrace = calc(ag, true, true);

  const totalDime = round2(ordinaires.dime + dimes.dime + actionsGrace.dime);
  const totalSocial = round2(ordinaires.social + dimes.social + actionsGrace.social);
  const reste = round2(ordinaires.reste + orateur.reste + dimes.reste + actionsGrace.reste);

  return { ordinaires, orateur, dimes, actionsGrace, totalDime, totalSocial, reste };
}
```

### 7.2 Application: use case example

```ts
// application/usecases/createRapport.ts
import { computeVentilation } from "../domain/finance/computeVentilation";

export interface RapportRepository {
  save(input: { id: string; extensionId: string; date: string; data: unknown }): Promise<void>;
}

export async function createRapport(deps: { repo: RapportRepository; socialPct: number }, dto: {
  id: string;
  extensionId: string;
  date: string;
  offrandes: { ordinaires: number; orateur: number; dimes: number; actionsGrace: number };
  // ...other fields
}) {
  const ventilation = computeVentilation(dto.offrandes, deps.socialPct);
  const data = { ...dto, ventilation };
  await deps.repo.save({ id: dto.id, extensionId: dto.extensionId, date: dto.date, data });
}
```

### 7.3 Infrastructure: Supabase repository adapter (sketch)

```ts
// infrastructure/supabase/SupabaseRapportRepository.ts
export class SupabaseRapportRepository {
  constructor(private client: any) {}

  async save(input: { id: string; extensionId: string; date: string; data: unknown }) {
    const { error } = await this.client
      .from("rapports")
      .upsert({ id: input.id, extension_id: input.extensionId, date: input.date, data: input.data });
    if (error) throw error;
  }
}
```

---

## 8) Concrete, actionable recommendations (next steps)

1) Decide backend: **Supabase-only** recommended.
2) Implement Auth + RLS.
3) Extract domain rules (ventilation, totals, validations) into pure functions.
4) Introduce repository interfaces and adapters.
5) Migrate UI route-by-route.
6) Add tooling: ESLint/Prettier, unit tests, CI.

---

## 9) Notes about the current repo (specific observations)

- Env-based Firebase config exists and is optional.
- Supabase client exists but is used mainly for realtime changes.
- LocalStorage store currently syncs extensions to Firebase but not rapports consistently; unify.

