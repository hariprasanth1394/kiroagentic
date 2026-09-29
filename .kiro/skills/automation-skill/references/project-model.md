# Project Model (app-level domain map)

The **project model** is the human/AI-readable business map of an application, read BEFORE touching code so generation is grounded in the app's real domain structure — not guessed. It is **app-agnostic**: every application fills in its own model; nothing here names a specific application.

It lives in the per-app suite at `{suiteDir}/project/` (resolved from `pipeline-config.json → apps[appKey].suiteDir`). Each app has its own isolated `project/`.

```
{suiteDir}/project/
├── project.yaml          # app identity + high-level metadata
├── domain-map.yaml       # business domains → capabilities (the map you read first)
└── dependency-map.yaml   # cross-domain / data dependencies between capabilities
```

> These are **optional but recommended**. If a suite has no `project/` yet, the Automation skill infers domains from the story + `@domain` tags and MAY scaffold `domain-map.yaml` from what it learns. A brand-new app suite gets an initial `project/` created alongside `core/` and `playwright.config.ts`.

---

## project.yaml (identity)

```yaml
app: "{APP_KEY}"                 # resolved app key (story prefix), e.g. the part before the dash
displayName: "{human app name}"
suiteDir: "{suiteDir}"
domains:                         # list of business domain tags this app owns
  - "{domain-a}"
  - "{domain-b}"
```

## domain-map.yaml (domains → capabilities)

The map a QE/dev/business reader should understand before reading any TypeScript. Conceptually a tree of **Domain → Capabilities**:

```yaml
domains:
  "{domain-a}":
    capabilities:
      - id: "{APP}-{DOMAIN-A}-{VERB}"      # matches naming-policy capabilityId
        name: "{human capability name}"
        kind: "ui | api | hybrid"
      - id: "{APP}-{DOMAIN-A}-{OTHER-VERB}"
        name: "..."
        kind: "..."
  "{domain-b}":
    capabilities:
      - id: "{APP}-{DOMAIN-B}-{VERB}"
        name: "..."
        kind: "..."
```

Each capability `id` here is the SAME stable id used in `registry/flow-catalog.json` / `service-catalog.json` and in `scenario-catalog.json`. The domain map is the business view; the registry is the implementation view; they share capability IDs so the AI can resolve **business name → capability id → implementation `{file, method}`** without guessing.

## dependency-map.yaml (cross-domain data/order dependencies)

Declares when one capability needs data produced by another (mirrors the Planner's `dataDependencies[]` at app scope):

```yaml
dependencies:
  - capability: "{APP}-{DOMAIN-B}-{VERB}"
    needs:
      - from: "{APP}-{DOMAIN-A}-{VERB}"
        data: "{what it produces, e.g. an id/token}"
        via: "api | fixture | prior-flow"
```

This is what lets a **journey** order its flows correctly (produce-before-consume) and lets the AI wire a data factory instead of dropping a scenario as "not executable".

---

## How the pipeline uses the project model

1. **Automation — read before generating (Step 1 discovery):** load `project/domain-map.yaml` (if present) alongside the registry catalogs. Resolve the story's domain(s) and the capabilities it touches. This drives capability-first reuse: a needed operation is matched to an existing capability id (reuse) before any new method is written.
2. **Automation — keep it current:** when a new capability is created (a new flow/service method), add it to the registry catalogs AND upsert it into `domain-map.yaml` under its domain so the business map stays accurate. When a cross-story data dependency is satisfied programmatically, record it in `dependency-map.yaml`.
3. **Planner — awareness only (read-only):** the Planner MAY read `domain-map.yaml` to align its `scope.businessDomain` and scenario grouping to the app's existing domains (so a new story reuses existing domain names rather than inventing near-duplicates). The Planner never writes the project model — it only writes `scenario-inventory.json` + the env config.
4. **Resolution chain the AI follows for a new requirement:**
   `new requirement → identify DOMAIN (domain-map) → identify CAPABILITY (domain-map/registry) → search registry by capability id → EXISTS: reuse method | MISSING: create method + register capability id + update domain-map → create/extend test → update registry → validate.`

All identifiers (`{APP}`, `{DOMAIN}`, `{VERB}`) are resolved from the app and the story at runtime. No application-specific domain, capability, or file name is baked into the framework.
