# Independent feature-coverage review

Reviewer: architecture proposer acting as independent reviewer of Pair 3.
Reviewed 2026-09-16: [FEATURE-COVERAGE.md](FEATURE-COVERAGE.md) and
[feature-coverage.json](feature-coverage.json). The reviewer did not edit those
proposal files. This is documentation research review, not runtime validation
or product approval.

## Disposition

Accept the proposal as a bounded documentation inventory with the refinements
below. It maps every item in the earlier audit and adds a source-defined
capability the audit missed. Do not describe it as an exhaustive inventory of
all functionality: the proposal itself correctly disclaims that stronger
claim. Public exports, CLI flags, schema fields and profile options still need
an explicit reconciliation pass before complete reference coverage is claimed.

## Independent checks

| Check | Result |
|---|---|
| Machine-readable feature identities | 43 rows and 43 unique IDs |
| Earlier audit coverage | Audit numbers 1–42 occur exactly once |
| Additional capability | F43 contextual framings has a separate null audit number |
| Required mappings | Every row has destination, acceptance condition, source evidence and status |
| Local source paths | All feature source paths exist |
| Markdown correspondence | All 43 JSON feature IDs appear in the Markdown matrix |
| Local Markdown links | All local links resolve |
| Current versus proposed pages | Destinations explicitly marked planned; no fabricated links |
| Completeness dimensions | Implementation, integration, default and evidence are separated |
| Test claims | Prior outcomes identified as not rerun; no new release total manufactured |

The contextual-framing status agrees with the current
[product capability](../../agent-reasoning-engine/framings/product-capability.json):
candidate, not adopted, not implemented and no measured user outcome. The
proposed roadmap page correctly preserves source provenance, uncertainty,
analogy limits and expiry rather than advertising an available generation API.

## Findings and required refinements before published reference

1. **Bind profile-derived statuses to profile evidence.** F03, F06, F09 and
   F10 mention default settings or source-and-profile reads but their row-level
   evidence lists point only to module documentation/directories. Add the
   [repository profile](../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json)
   to these evidence lists when reconciling. The claims agree with the inspected
   profile, but the machine-readable lineage currently omits that dependency.

2. **Separate activation from interpretation provider selection.** F04's
   `default: optional provider` describes an integration option rather than an
   activation default. The wrapper README says objective resolution is opt-in
   and disabled by default. Use `disabled; explicit profile opt-in` for default
   and keep optional provider under integration. A reader must not infer that
   injecting a provider alone activates the feature.

3. **Preserve the governance correction now present in F35.** The first
   inspected draft inferred `binding unadmitted` from the Rust verifier's
   intentionally nonauthorizing receipt. The current revision correctly says
   separate selected cutover records can permit enforcement while effects
   remain unauthorized. The actual
   [cutover implementation](../../implementation/agent-reasoning-engine/packages/module-port-governance-cutover/index.mjs)
   verifies these distinct records and should be added alongside the README
   in the evidence list. This corrected issue is closed at proposal level.

4. **Finish artifact-level enumeration before an exhaustive claim.** The
   16-README extraction is useful discovery but cannot find undocumented
   exports and misses packages without a README. Values such as `false`,
   `none`, and `PASS` appear among operation-name candidates; the extraction
   correctly labels these candidates rather than verified public API names.
   The next pass should join exports, entrypoints, schemas and profile options
   to feature/thesis IDs and require a documented or internal disposition for
   each item. This remains outstanding, explicitly acknowledged in the proposal.

5. **Make F43's teaching destination explicit.** The narrative promises
   explanation and roadmap pages for contextual framings, while its JSON has
   only the roadmap destination. Keep that primary destination, and add a
   secondary explanation destination or an exact link to the thesis/definition
   page. This lets readers understand the capability without confusing it with
   an implementation commitment.

6. **Join destination aliases during synthesis.** Feature-level pages such as
   `reference/model-transports.md` and module-level pages under
   `reference/modules/` serve different purposes. Keep one canonical page
   register with links/aliases so they do not become duplicate contradictory
   references. The proposal's parent/sideways/downward navigation is an
   appropriate rule; it still needs a machine-readable page join.

## Independent online lens

The reviewer independently opened the same three primary documentation sites.
[Diátaxis](https://diataxis.fr/) supports the proposal's reader-oriented division
between tutorials, how-to guides, reference and explanation. Evidence and
roadmap collections are ARE's additional information architecture, not a claim
that Diátaxis specifies six forms. The credential-free bounded tutorial and
separate unimplemented-roadmap treatments are appropriate applications.

[OpenTelemetry's signals documentation](https://opentelemetry.io/docs/concepts/signals/)
shows a shared concept vocabulary alongside SDK/component navigation. This
supports the common glossary plus separate integration pages. The proposal
explicitly avoids claiming an exporter exists and correctly distinguishes
diagnostic signals from durable reasoning-state products.

[Temporal's introduction](https://docs.temporal.io/evaluate/understanding-temporal)
provides a useful teaching sequence for durable execution concepts. The
proposal's explicit refusal to transfer service guarantees to ARE's local
single-writer ledger is necessary. The persistence tutorial should demonstrate
the exact checkpoint boundary and observed recovery, not promise distributed
workflow durability.

These external examples support documentation choices only. They do not verify
ARE runtime behavior or justify expanding the release scope to a hosted service.

## Open Questions

- Which concrete export/schema/entrypoint inventory artifact will close the
  acknowledged gap between heading coverage and all public functionality?
- Which artifact owns canonical page IDs across all three proposal pairs?
- Who will attach reproducible source identities and test receipts to each
  future tested example badge?
- Which optional gateway, SDK and hosted-service proposals enter supported
  product scope after this documentation research?
