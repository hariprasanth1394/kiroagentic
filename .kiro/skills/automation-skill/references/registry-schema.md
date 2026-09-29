# Registry Schema

> **Per-app path:** `regression-suite/registry/` in this document means the resolved per-app `{suiteDir}/registry/` (from `pipeline-config.json → apps[appKey].suiteDir`, e.g. `regression-suite-BREW/registry/`). Each app has its OWN isolated registry — catalogs never mix across apps. The concurrency `.lock` is per-app.

Concise reference for the catalog files in `{suiteDir}/registry/`. They are the reuse map: the Automation skill reads them before generating (to reuse) and updates them after (to record what was built). The catalog JSON files themselves carry per-file `description` fields; this doc covers the shape, the read/write discipline, and concurrency. Everything here is **app-agnostic** — each app fills its own isolated registry.

## Files

| File | Tracks | Key entry fields |
|------|--------|------------------|
| `flow-catalog.json` | Single-domain business capabilities | name, file, domain, pages[], services[], capabilities[], parameters[], stories[], createdAt, lastModified |
| `journey-catalog.json` | Cross-feature orchestrations | name, file, flows[] (ordered), domains[], stories[], createdAt, lastModified |
| `service-catalog.json` | API implementation objects | name, file, domain, capabilities[]{id,method}, stories[], createdAt, lastModified |
| `page-catalog.json` | Page objects | name, file, url, locators[], components[], stories[], createdAt, lastModified |
| `component-catalog.json` | UI widgets | name, file, widgetType, locators[], methods[], usedByPages[], stories[], … |
| `fixture-catalog.json` | Fixtures | name, file, providers[]{name,type,source}, flows[], journeys[], domain, stories[], … |
| `scenario-catalog.json` | Business scenarios | id (`{APP}-{DOMAIN}-{NNN}`), name, domain, capabilities[] (capability IDs), stories[], createdAt, lastModified |
| `domain-index.json` | Domain tags | tag, tests[], flows[], journeys[], stories[], firstSeen, lastActivity |

Common envelope on every file: `{ "version", "lastUpdated" (ISO-8601), "<collection>": [] }`. Paths are flat (`flows/place-order.flow.ts`, `services/order.service.ts`, `journeys/signup-to-first-order.journey.ts`, `pages/checkout.page.ts`).

## Capability Model (business name → implementation)

A **capability** is a named, reusable business operation with a stable ID (`{APP}-{DOMAIN}-{VERB}`, see `naming-policy.json → patterns.capabilityId`). It is the unit the AI searches to decide *reuse vs create*.

```
CapabilityEntry (in flow-catalog[].capabilities[] and service-catalog[].capabilities[]):
  id       // e.g. APP-ORDER-CREATE, APP-USER-VALIDATE-EMAIL (app-agnostic; APP = resolved app key)
  name     // human business name, e.g. "Create Order"
  method   // the implementing method, e.g. "createOrder"
  kind?    // "ui" | "api" | "hybrid" (a flow capability may drive page and/or service)
```

- **Exactly one implementation per capability ID** — `{file, method}`. Two entries MUST NOT claim the same ID with different implementations (defeats reuse).
- `scenario-catalog.json` entries reference capability IDs only (never files) — the chain is **business scenario → capabilities[] → implementation** resolved through flow/service catalogs.
- Before generating a new flow/service method, search the catalogs by domain + verb / capability ID. **Match → reuse the existing method; no match → create + register a new capability ID.** Never generate a second method for a capability that already exists.

### LocatorEntry (page & component catalogs)

Mirrors the manifest `LocatorEntry` (authoritative: `automation-manifest.schema.json`, rules: `selector-policy.json`):

```
name, strategy, value,
evidence: { source, count(===1), verifiedBy, discoveredAt }
fallbacks?: [ { strategy, value, evidence:{ source, count(===1), verifiedBy, discoveredAt } } ]   // each fallback proven
unstable?: boolean   // primary failed, passed on a fallback → needs re-inspection
```

`evidence.count` MUST equal 1 for the primary and every fallback, and it MUST be the value MEASURED by executing the locator (`verifiedBy` = `browser_evaluate` / `locator.count()` / `page-snapshot-match`) — not a value assumed by the agent. See `references/validation-rules.md §3`.

## Read (reuse-first)

Before generating any artifact, load the relevant catalog and search by natural identity — **capability `id` (flow/service)**, flow `name`/`domain`, journey `name`/`flows`, service `name`/`domain`/capability, page `name`/`url`, component `name`/`widgetType`, fixture `domain`, scenario `id`, domain `tag`. Then:
- **Exact match** (same capability ID, or same page/url, etc.) → reuse (`action: reused`)
- **Partial match** (same page, changed locators; a flow that needs one new capability) → modify (`action: modified`)
- **No match** → create (`action: created`) and register a new capability ID if it's a flow/service method

Capability-first reuse: when a test case needs an operation, resolve it to a capability ID by domain + verb; if the ID exists, call the registered method — do NOT write a second implementation.

## Write (atomic, upsert)

Code file and catalog update are one atomic operation — if either fails, roll back (see below). Rules:
- **Never remove entries.** Only add or update.
- **Idempotent upsert by key** — if the entry key already exists, UPDATE in place (bump `lastModified`); never add a duplicate.
- **Append `stories[]` as a set** (dedupe) — a shared artifact accumulates story keys, never loses one.
- Set `createdAt` on new entries; update `lastModified` on changed entries; update the envelope `lastUpdated`.
- `evidence.count === 1` for all locators (incl. fallbacks).

## Rollback

If the catalog write fails after the code file was written: delete the orphaned code file, leave the registry unchanged, report `action: failed` in the manifest, retry once; if retry fails, halt this artifact and continue with the rest. If the catalog JSON is malformed, restore from last-known-good and retry.

## Concurrency & Idempotency (shared registry)

All catalogs live in ONE shared `registry/` dir; parallel story runs can race. Safety:
1. **One writer at a time** — wrap the read→merge→write in a critical section using an exclusive `registry/.lock` marker (wait+retry a bounded number of times if present; release after write). Hold the lock ONLY around the registry update, never across DOM inspection or code generation.
2. **Read-modify-write** — re-read the catalog inside the lock immediately before writing; merge your delta into the just-read state, never a stale in-memory copy.
3. **Idempotent upserts** — same story re-run converges to the same registry (update in place, dedupe `stories[]`), never grows it.
4. **Stale lock** — a `.lock` older than a sane timeout is treated as abandoned and reclaimed (log it). It's a coordination hint, not a security boundary.

Invariant: **no entry is ever lost, and no duplicate key is ever created.** If runs still conflict (e.g. different machines), fall back to re-read → merge → retry.

## Domain Index

Update `domain-index.json` when: a new domain tag appears (new entry), a test is tagged with an existing domain (append `tests[]`), a flow or journey is added in a domain (append `flows[]` / `journeys[]`), or a story contributes (append `stories[]`, bump `lastActivity`). Domain tags emerge from story content and the app's domain map — no predefined taxonomy hardcoded in the framework.

## Capability / Scenario Catalog Writes

- When a flow or service implements a new business operation → add a `CapabilityEntry` to that artifact's `capabilities[]` with a fresh `{APP}-{DOMAIN}-{VERB}` ID and the implementing `method`. Reuse (don't duplicate) an existing capability ID.
- When a business scenario is realized → upsert its `scenario-catalog.json` entry (`{APP}-{DOMAIN}-{NNN}`) listing the capability IDs it composes. Never list a capability ID that isn't implemented in a flow/service catalog (validation-policy enforces this).
- All the atomic-upsert, never-remove, dedupe-`stories[]`, and rollback rules above apply equally to `journey-catalog.json`, `service-catalog.json`, and `scenario-catalog.json`.
