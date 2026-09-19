---
node_type: work-pack
is_session: false
status: candidate
created: 2026-07-02
authored_by: invoke (mode: plan)
define: ./DEFINE.md
design: ./DESIGN.md
target_artifact: meta-type definitions
complexity: medium
promotion_boundary: PUBLIC vocabulary; approval-gated; canonical cards cite public schemas, never δ-rules.
---

# Meta-Type Definitions — Work-Pack

Promote the meta-type vocabulary to real definitions, **approval-gated**. [CANDIDATES.md](./CANDIDATES.md) is
the approval artifact; the execution SWUs run **only after** the owner approves the relevant candidates.

## Current maturity ledger

- The 14 backend cards and schemas now exist as shape/fixture-backed candidates;
  their candidate-to-active confirmation contracts remain in force.
- The 11 UI labels remain formation-deferred. Their presence in active DS-D8
  signatures does not promote them into DS-D1 formation authority.
- `CANDIDATES.md` preserves the 25-name candidate trail; root
  `definitions/meta-types/` carries only the 14 currently carded backend
  members.

## SWU manifest
| SWU | Layer | Scope | Acceptance (green) |
| --- | --- | --- | --- |
| **DD0** | L0 | candidate list + **owner approval gate** | `CANDIDATES.md` complete (all tiers: term, proposed ID, one-line meaning, recommendation); owner marks approve / defer / reject per item or tier |
| **DD1** | L1 | Tier-2 method-term cards (approved) | each approved method term → a 3-voice card in `definitions/DEFINITIONS.md` (`domainspec-v2-D6+`) + `DEFINITIONS-INDEX` row + drift-audit pass |
| **DD2** | L2 | Tier-1 backend meta-type cards (approved) → via R7 | 14 backend meta-types → `DS-D1.<n>` cards citing their `.schema.yml`; landed in root `definitions/DEFINITIONS.md` + `definitions/DEFINITIONS-INDEX.md` by batch-1 **R7** |
| **DD3** | L2 | Tier-3 disposition (approved) | rule-kinds + attribute-keys documented in the schema-format reference (or promoted if the owner pulled any up a tier) |
| **DD4** | L3 | Tier-1 UI deferred; edge verbs/signatures promoted | UI-11 descriptive cards deferred to MT5; `DS-D2`/`DS-D8` relationship cards promoted from R3A root authority |

## Implementation layering (compact — a definitions-authoring package)
L0 approval gate → L1 method terms (root `definitions/`) → L2 domain meta-types (via R7) + Tier-3 disposition →
L3 deferred UI + promoted DS-D2/DS-D8 relationship cards from R3A authority. **Promotion evidence per layer:** approved candidate rows + index row + drift-audit
pass (no term used-as-authority left untracked).

## Approval gate (hard)
No card is written to any canonical surface until the owner approves its candidate row. **DD0 blocks DD1–DD4.**
This is the definitions-governance rule ("candidate promotion is never automatic") made explicit.

## Distill validation
- **Smallest coherent unit:** one term → one card. ✓
- **Recomposition:** approved cards + index + drift-audit = the governed meta-type vocabulary; makes R7 concrete. ✓
- **Gaps named + routed:** Tier-3 disposition (DD-D2), UI criteria (deferred, MT5), the
  Tier-2 scheme (DD-D1).
- **Verdict: flag** (routable; the approval gate + the 3 open decisions are the named gaps — no mutation-capable
  promotion until DD0 approval).

## Dispatch technique trace
`sequence` (L0→L3) · `owner_boundary_check` (definitions-governance owns canonical cards; R7 owns DS-D1/D2; the
moat holds — cards cite the public `.schema.yml`, never the δ-rules) · `artifact_contract_bridge` (each card must
satisfy the 3-voice format + index + drift-audit) · `authority_split_gate` (candidate → canonical requires owner
approval) · `residue_ledger` (DD-D1/D2/D3 + promoted DS-D2/DS-D8 + deferred UI). No full dispatch JSON — single
package, single-owner-per-tier.

## Next route
Owner reviews + approves [CANDIDATES.md](./CANDIDATES.md) → **task-session DD1** (method terms, definitions-governance)
+ **DD2 via R7** (backend meta-types) → definitions-governance promotes; index + drift-audit updated.
