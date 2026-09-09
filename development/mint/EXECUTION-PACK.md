---
node_type: plan
is_session: false
status: candidate
boundary: INTERNAL — intended-not-shipped; non-executed plan
created: 2026-06-29
authored_by: invoke (mode=plan)
note: Paths are repo-root-relative from domainspec-core/.
---

# Mint — EXECUTION PACK (plan, non-executed)

## Implementation plan (buildable steps)
1. **L0 — scaffold compose.** Wrap `domainspec-new-repo`: Mint calls it `--source <fw> --attach submodule --mode plan`
   (dry, default), surfaces the plan, then `--mode apply` (which crosses the scaffolder's own master gate).
   Output: the partition tree + clone-safe attach. *Owned; low risk.*
2. **L1 — authority-spine seed contract (MVP, the net-new core).** Build the **emit-template set** (see provenance),
   then emit, via authority-triage (review-mode): domain `AUTHORITY-MODEL` (proposed kinds), `source-spine`,
   `promotion-policy`, a domain constitution stub, a `DEFINITIONS` skeleton.
3. **L2 — signed decision-gate + crosswalk.** Emit the signed mint decision record + the framework crosswalk.
4. **L3 — adopt-back (deferred).** Register the cav2 import surface.

**Committed additions (audit + decision 2026-07-01 — extends L1, committed-NOT-built).** Beyond the 6
templates, L1 also emits the 13 additions ([SPEC §Committed additions](./SPEC.md)): Tier-1 definitions
drift-audit/index stubs (#8), ratify-CLOSE record (#11 — also touches L2), methods catalogue (#13); the
Tier-2 meta patterns (#1/#2/#5/#9/#12) and seed-format contracts (#3/#4/#6/#7/#17) + cheap nav/schema
(#10/#18). **Validation additions (D9):** the DRIFT-AUDIT stub must exist so the seeded load-bearing-term
rule resolves (closes #8); the ratify-close record moves kinds `PROPOSED`→ratified (closes #11); the
resonantos golden fixture is updated to the expanded spine shape. Seed-format items are validated to carry
the *empty contract*, not cav2's rows (guardrail). Tier-3 surfaces are disclosed non-seeds ([SPEC](./SPEC.md)).

## The owner-gate, actored (review C7)
"An owner ratifies" is made concrete:
- **actor:** the cav2 authority owner (definitions-governance / constitution-governance per kind).
- **moment:** after L1 kind-proposal, **before** L2 crosswalk templates over those kinds.
- **observable:** a committed `authority/decisions/<date>-mint-<domain>.md` record naming the ratified kinds.
- **capability:** RESOLVED by owner decision [2026-06-29-mint-signer-and-boundary](../../authority/decisions/2026-06-29-mint-signer-and-boundary.md) → build a dedicated **attestation/signer capability** ([../attestation-capability/](../attestation-capability/)); Mint L2 calls `attest(mint-act)`. L2 waits on that capability's L1 (integrity-seal) MVP. (The attributional fallback — Mint emits the record + AskUserQuestion — was the rejected lighter option.)

## External template provenance (review C4)
Day-1 (L1) templates are reverse-engineered from the **external sibling** (outside domainspec-core):
`<repo-root>/../resonantos-economy-research/authority/{AUTHORITY-MODEL,source-spine,promotion-policy}.md`,
`.../definitions/DEFINITIONS.md`, `.../RELATED-FRAMEWORK-CROSSWALK.md`. Day-1 concrete output: copy these →
strip domain content → parameterized skeletons. The cav2 import surface does **not** hold them.

## Failure mode (review C4-adjacent / A3-F4)
**No-clean-kind-enumeration branch:** if the target domain has no derivable kind-set, L2 emits a
`blocked-default-deny` and routes to the owner to enumerate kinds before proceeding. Emit-templates are
validated on **one** domain (resonantos) only — mark as such; do not claim general coverage.

## MVP / validation strategy per slice
- **MVP = L0 + L1** (+ L2's signed record for honesty). MVP is buildable **now**: L0 owned; L1 uses
  authority-triage in review-mode (internal — not blocked on its public promotion).
- **L0 validation:** the minted tree resolves clone-safe (the scaffolder's Step-7 verify).
- **L1 validation:** the emitted authority-model parses + every proposed kind has a default-deny row; golden fixture = resonantos.
- **L2 validation:** a committed signed decision record exists naming the ratified kinds.

## Dispatch-Spec technique trace
`sequence` (the 5-stage flow) · `frame_handoff` + `handle_handoff` (compose `domainspec-new-repo`; hand to sigil-development) ·
`owner_boundary_check` (cav2 owns casting, scaffolder owns tree; D49 owner-gate) · `authority_split_gate` (propose-vs-ratify) ·
`residue_ledger` (open: signer capability; public/private blocker) · `concrete_path_evidence` (external template paths) ·
`observability_grouping` (by this package). No full dispatch JSON required (single-capability authoring; delegation is the named sigil-development handoff).

## Distill validation
**flag** — the selected unit (Mint feature) is small enough to plan and recomposes into the resolved design,
but two gaps are named with owner + repair path: (1) the **signer capability** for the owner-gate (owner: sigil-development);
(2) **`BLK-CAV2-PUBLIC-PRIVATE-001`** must be resolved before a public-attached mint (owner: decision-gate). MVP (L0+L1)
routes despite these because they gate L2+/public mints, not the internal MVP.

## Pre-L0 executable planner (refresh 2026-08-07)

Before scaffold compose, implement `SWU-MINT-RUNTIME-PLAN-01` as a dependency-free private runtime:

1. parse and strictly validate one JSON domain manifest;
2. verify the explicit allowed root, absent target, private posture, and pinned source digests;
3. verify the owned hardcoded template allowlist and derive the ordered stage/effect inventory;
4. fail closed on missing, symlinked, or digest-drifted templates and on unsafe, duplicate, or
   case/prefix-colliding output paths; and
5. emit canonical JSON describing every planned write, with hashes and sizes, without mutating the
   target or invoking downstream capabilities.

Acceptance is the runtime's unit test suite plus an integration fixture proving deterministic output,
zero target writes, strict-schema refusal, digest-drift refusal, existing-target refusal, traversal
and symlink-escape refusal, public-attach refusal, collision refusal, and confinement of every planned
effect below the target. P0 does not render Markdown; a typed render IR is the next runtime contract.
Passing this slice does not satisfy L0, L1, ratification, experiment, or promotion evidence.
