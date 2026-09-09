# Mint — sigil (README)

**Status:** in-development · **INTERNAL** (moat-adjacent — the authority-casting is private; do
NOT copy into public `arcanum/`) · **intended-not-shipped** · **promotes nothing** · tier: **Arcana**
(private cav2 capability — not a public Arcanum sigil; lives in `cyberAlchemy-v2/development/mint/`
until the experiment SURVIVES and the blocks below resolve, then an owner route decides promotion).

## Problem solved
Minting a new domain-specialized repository from the cav2 framework is currently **hand-done**
(precedent: `resonantos-economy-research`) — slow, inconsistent, and prone to the failure the
experiment names (see *Open blocks*). Mint mechanizes it: **compose** `domainspec-new-repo` for the
doc-tree scaffold and **cast** the cav2 authority spine onto the domain as a distinct, cav2-owned
governance act.

## Use this sigil when
- standing up a NEW domain/research/project repo that should carry a cav2-shaped authority spine;
- the domain should **inherit the cav2 meta-authority machinery** (lifecycle D48, the closure *rule*
  D49, non-collapse, claim≤proof, promotion structure) and **localize its own object-authority**.

## Do NOT use when
- the target is a public Arcanum sigil/spell (Mint casts the *private* cav2 spine);
- you only need the doc-tree scaffold (use `domainspec-new-repo` directly — Mint composes it);
- a **public-attached** mint is wanted while `BLK-CAV2-PUBLIC-PRIVATE-001` is open (blocked).

## Inputs / outputs
**Inputs:** `domain`, `target-repo-path`, `--source <framework>`, `--attach submodule|copy|symlink`.
**Outputs:** a new repo = scaffold tree + a domain-local authority-model (proposed kinds), source-spine,
promotion-policy, domain constitution, definitions skeleton, framework crosswalk, and a signed
`authority/decisions/<date>-mint.md` record. Mint is the *authoring* capability; the minted artifacts
belong to the new repo's lifecycle.

## Lifecycle expectations + open blocks (claim ≤ proof)
Buildable now: **L0** (scaffold compose) + **L1** (authority-spine seed = MVP). Named blocks:
- **L2 (signed decision-gate) — BLOCKED** on the new **attestation/signer capability** ([../attestation-capability/](../attestation-capability/)) — owner decision [2026-06-29](../../authority/decisions/2026-06-29-mint-signer-and-boundary.md) chose to build verifiable attestation (the moat); L2 waits on its L1 MVP.
- **Public-attached mints — BLOCKED** on `BLK-CAV2-PUBLIC-PRIVATE-001` — **deferred by decision 2026-06-29** (MVP is private-only), not resolved.
- **L3 (adopt-back) — deferred.**
- **Falsification target:** the build must pass [`experiment-foundry-boundary/criterion.md`](./experiment-foundry-boundary/criterion.md). Its named most-likely falsifier — a **runtime governance leak at the mint-act output** — is the precedent's actual failure; Mint must author **self-standing** object-policy in the mint act, not defer to cav2.

## Provenance
Design package (this folder): [SPEC](./SPEC.md) · [ARCHITECTURE-BUNDLE](./ARCHITECTURE-BUNDLE.md) ·
[EXECUTION-PACK](./EXECUTION-PACK.md) · [IMPLEMENTATION-LAYERING](./IMPLEMENTATION-LAYERING.md) ·
[WORK-PACK](./WORK-PACK.md). Authored by `invoke`, review-corrected (`mint-design-plan-review` FIX),
pre-registered by `experiment` (frozen `criterion.md`). The contract is [SKILL.md](./SKILL.md).
