# User-cited project lookup

Status: candidate extension of the existing repository-routing capability.
Owner: CyberAlchemy v2 agent-routing owner. Authority effect: none.

## Prototype meaning and product behavior

A citation is a user-supplied project, product, capability, or protocol name.
An index entry is a navigation record linking aliases to source-owned identity,
owner, entry files, and whole-file source digests. It is not a new Project,
Product, canonical definition, authority owner, or construction approval.

Given a name q, normalize case and punctuation into space-separated tokens.
Match the entire normalized name against entry IDs, names, aliases, and identity
refs. Never use arbitrary substring matching or silently choose the first hit.
One current match is resolved; multiple current matches are ambiguous; no match
is not_found; missing, unsafe, or drifted selected sources are not_evaluable.
An invalid index shape is not_evaluable. Ambiguity is retained in the match list
even when one of its candidates is stale; a stale candidate cannot disappear to
make another candidate look unique. Source content is read only for matches.

The read-only implementation is `scripts/locate.py`. Example:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/agent-routing/scripts/locate.py alchLang KEP "agent runtime"
```

## Routing and discovery

Pure source-location work selects `CA2-ROUTE-LOCATE`. If an already selected
objective cites an unknown name, announce a bounded LOCATE prerequisite, read
its exact read_first files, perform lookup, then announce return to the original
objective and its read_first files. Keep one objective route active at a time.
An index is source evidence, never a fallback routing authority.
Explicit sibling `domainspec-core` lookup selects `CA2-ROUTE-DOMAINSPEC-CORE`
and its [separate inventory](DOMAINSPEC-CORE-INDEX.md). `locate.py` remains local;
it does not search that checkout or accept traversal paths automatically.

Before asking a user for a repository path:

1. Run lookup for each cited name and inspect all matches.
2. Announce exact matched entry files before reading them. Identity records own
   identity; narratives and old snapshots do not silently supersede them.
3. For not_found, announce filename discovery bounded to the literal cited name
   and spelling variants using `rg --files` (exclude .git, dependencies, build
   output, and generated snapshots). Inspect only matching entry documents such
   as README.md, profile.json, project.json, or identity decisions. If filenames
   miss, use bounded `rg -l -F` searches for those same names in entry documents.
   Announce the candidate paths before content reads. Do not load whole packages.
4. For stale/missing entries, report the exact source and search the same named
   target for its current entry. Do not refresh a digest automatically or claim
   a stale source is current. Propose an index refresh under IMPLEMENT.
5. Ask only after this lookup/discovery leaves no supported source or genuine
   competing identities. Show found candidates, why they differ, and the missing
   choice. Local searches do not authorize scanning sibling repositories,
   credentials, external systems, or the public subsystem's contents.
6. Add or refresh entries only under an explicit indexing request through
   IMPLEMENT. Preserve source-owned identities and record aliases and gaps.
   Then resume the original task with selected evidence and its existing ceiling.

## Construction chain and dependencies

This extends CA2-CAP-ROUTE-REPOSITORY-WORK within its existing source-selection
scope. Prototype meaning is above; the business scaffold remains
CA2-ROUTING-BUSINESS-ONTOLOGY (all nodes/relations in ontology.json). The exact
D65 and D67 heading sections, product-capability.json, and ontology.json are
pinned in domainspec/nodes/cyberalchemy-route-resolution.json. The route entity
and resolution rule are the authored DomainSpec prototype; scripts/build.ts
produces the compiled graph and system ontology, including index and lookup
implementation digests. No target package ontology records are dependencies.

The implementation prototype consists of project-index.json, its schema,
scripts/locate.py, the route registry, and root instruction integration.
Product tests cover actual cited names, multiple runtime matches, unknown names,
source drift/missing files, unsafe paths, malformed records, deterministic output,
and read-only behavior. scripts/validate.py checks route integration and compiled
bindings; tests/test_project_lookup.py exercises lookup behavior.

Product-construction frontier: source lookup implementation and product tests.
Runnable work: resolve cited names and retain ambiguity; test exact candidate.
Operational support: new product/project registration (owning Project route,
no current construction-stage dependency), runtime selection (requesting user,
future agent design), and live exchange/deployment (future operator, future
integration stage). These are deferred residue, not blockers for lookup tests.
Product approval and all operational authority remain ungranted.

## Prototype revision evidence

Baseline router validation on 2026-09-05 was BLOCK before this change: the D65
heading digest and generated root-instruction digest were stale. The current
D65 text was inspected: it permits bounded prototype epochs and defers authority
until exact tested-product approval. Existing dirty construction/operations
instructions are preserved. This epoch binds that inspected definition and
rebuilds candidate projections; it carries no prior approval forward.

Old D65 binding: `ba524beb8fb408f9abcd0805644f59ec2dbfcd810de24ac99c87296f843ba4ff`.
Current inspected D65 binding: `264088e26cb069e2c48ec4cdc78d794da6b3beec30f0c6ba87fb635866d8cd30`.

## Open Questions

- Which of Essays Agent Runtime and ARE Coding-Agent Runtime should host the
  new alchLang/KEP product? The generic alias deliberately returns both.
- Which KEP realization and alchLang carrier/version should the new product use?
- KEP has Exchange naming in its identity record and Expansion naming in the
  white-paper package; aliases do not decide a canonical rename.
- Index coverage is intentionally limited to verified user-cited sources;
  not_found is not proof that a project does not exist.

## Claim ceiling

Lookup proves source locations and selected-source currency only. It neither
registers projects nor proves target acceptance, runtime conformance, agent
execution, protocol transactions, publication, deployment, or authority.
