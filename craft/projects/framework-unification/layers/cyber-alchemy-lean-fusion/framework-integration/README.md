# Framework Integration — DomainSpec Framework × the Foundry

This packet is a SEED for fusing two things you already own — adding a **second
axis** to the capability foundry:

- **The foundry (Arcanum × Lean)** (`../DESIGN.md`, `../README.md`) — the
  **horizontal** axis: the lifecycle machine (intent→sigil→spell) + the
  typed-residue epistemic core. Owns the residue currency, the Pass/Flag/Block
  gate vocabulary, the dispatch ontology, and the OPEN seams this packet targets.
- **The DomainSpec framework** (`TAXONOMY.md`, `RELATIONSHIPS.md`, the
  spec→test→…→verify pipeline, `governance/tags/CODE-TAG-SCHEMA.md`,
  `register-dispatch`) — the **vertical** axis: the ontology tower
  (business→system→code), with a typed-residue ledger at each floor boundary.

**One-line thesis.** The foundry runs lifecycle *across* (intent→artifact); the
framework runs ontology *down* (business→system→code); **residue is the currency
of both.** The framework's typed edges are the strongest candidate to give a
*type* to the residue the foundry leaves OPEN — but only where the type
**mechanically fires a gate**, not where it narrates one.

**Naming hazard (read first).** In `MAP.md`/the views, "domainspec" = the
**theorem + core** (epistemic conscience). **This packet means the FRAMEWORK** —
the taxonomy/vault/pipeline tooling. Different artifact, same token. See
`DESIGN.md §2`.

## Starting Point

- Design packet: `DESIGN.md` — the two-axis fusion grid, the honest-typing line,
  and the collapse-test (`§5`) that decides whether the framework FILLS a seam or
  collapses to prose the sibling `../DESIGN.md §5` already kills.
- The load-bearing open seam lives in `DESIGN.md §7`: *the system-ontology floor
  has no home* — no `system_design_knowledge/`, only `@sys` tags + the taxonomy
  "Primary Layer" column. Until that floor has an artifact home, the vertical axis
  has a hole between business and code.

## What this project is NOT (yet)

Nothing here is built or promoted. Only the spec→test (`@source`) and spec→code
(drift/waivers) boundaries are LIVE and fire mechanically. The business floor is a
single example (`lean-code-validator`); vault `layer:domain`/`layer:application`
are self-described aspirational; the system floor has no home. Do not narrate the
tower as complete — two of its three floors are OPEN/PARTLY OWNED (`DESIGN.md §7`).

## Next route

Run a `research` dispatch on the §7 BLOCKER (home vs `@sys`-projection for the
system floor), then build the smallest unit that fires today: the spec→test
`@source` residue gate on a foundry sigil's output (`DESIGN.md §6`).
