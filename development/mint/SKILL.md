# Sigil: Mint

<objective>
Mint a new domain-specialized repository from the cav2 framework by COMPOSING `domainspec-new-repo`
for the doc-tree scaffold and CASTING the cav2 authority spine onto the domain as a distinct,
cav2-owned governance act — such that the minted authority is AUTONOMOUS (localizes its own
object-authority, inherits only the meta-machinery, stays non-circular w.r.t. cav2).
</objective>

<logic-type>
Arcana: recursive authority-casting with a signed governance act and a pre-registered falsification
gate. Private cav2 capability (moat-adjacent); intended-not-shipped; promotes nothing.
</logic-type>

<boundary>
INTERNAL. Mint casts the PRIVATE cav2 authority spine — never publish to `arcanum/`. **MVP is
private-only** (owner decision 2026-06-29): a mint that emits a public-attached repo is BLOCKED by
`BLK-CAV2-PUBLIC-PRIVATE-001` (deferred by that decision, not resolved).
</boundary>

<applicability>
Use to stand up a NEW domain/research/project repo carrying a cav2-shaped authority spine. Continue
from the invoke handoff (this folder). NOT for: public Arcanum sigils; doc-tree-only scaffolds (use
`domainspec-new-repo`); promotion of a domain kind into cav2 (that is a separate owner-gated act).
</applicability>

<inputs>
`domain`; `target-repo-path`; `--source <framework-path>`; `--attach submodule|copy|symlink` (default submodule).
</inputs>

<process>
Five stages (the mint flow). **L0+L1 are the buildable MVP; L2 is BLOCKED; L3 deferred.**

1. **L0 — scaffold compose (owned).** Call `domainspec-new-repo --source <fw> --attach submodule --mode plan`,
   surface the plan, then `--mode apply` (which crosses the scaffolder's own master gate — one human confirm).
   Inherits its clone-safe + single-sessions defect-fixes. (Do NOT edit `domainspec-new-repo`; compose it.)
2. **L1 — authority-spine seed (MVP, the cav2-owned core).** Emit, via the authority-triage front-door
   (review-mode, internal — `<repo-root>/development/authority-triage/`): a domain authority-model with
   **proposed** domain-originated kinds, source-spine, promotion-policy, a domain constitution, a
   definitions skeleton. **Invariant — inherit/localize boundary:** inherit the cav2 *meta-machinery*
   (lifecycle D48, the closure *rule* D49 applied to the domain's OWN table, non-collapse, claim≤proof,
   the promotion/source-movement/table FORMAT); localize the *object* content (the domain's own kinds,
   definitions, rules). cav2 stays harvested precedent, never a runtime parent. **Invariant — no leak:**
   the mint-act output MUST author self-standing object-policy — no minted runtime decision may resolve
   through the cav2 attachment (the criterion's predicted falsifier; the precedent failed exactly here).
3. **L2 — signed decision-gate + owner ratify — BLOCKED.** Emit a signed `authority/decisions/<date>-mint.md`;
   the cav2 authority owner ratifies the proposed kinds (actor = cav2 authority owner; moment = after L1,
   before L3; observable = the committed decision record). **Blocked:** gated on the new
   **attestation/signer capability** (`cyberAlchemy-v2/development/attestation-capability/`) — owner
   decision [2026-06-29-mint-signer-and-boundary](../../authority/decisions/2026-06-29-mint-signer-and-boundary.md)
   chose to build *verifiable attestation* (the moat) over the attributional record; L2 waits on that
   capability's L1 (integrity-seal) MVP.
4. **L3 — adopt-back — deferred.** Register the cav2 import surface for two-way adoption (VAULT-CONCEPT-ADOPTION).
5. **Crosswalk.** Emit `RELATED-FRAMEWORK-CROSSWALK.md` (borrow / block / analogy-only / promotion-candidate).
</process>

<quality-bar>
A successful Mint must:
- pass [`experiment-foundry-boundary/criterion.md`](./experiment-foundry-boundary/criterion.md) on the
  tested domain — specifically **no runtime governance leak at the mint-act output** (Obs-B), genuine
  **autonomous localization** (Obs-A, lexical-AND-owner-route-new kinds — no re-skin), and **non-circular**
  (Obs-C — operable without cav2 opening its D49 enumeration);
- hold the inherit/localize boundary (meta inherited, object localized; cav2 = harvested precedent);
- keep the D49 owner-gate (propose kinds; owner ratifies — never unilaterally alter cav2's enumeration);
- respect the public/private boundary (no public-attached mint while `BLK-CAV2-PUBLIC-PRIVATE-001` is open);
- compose `domainspec-new-repo` unchanged; claim≤proof (intended-not-shipped; one casting organ, not the foundry);
- carry experiment-harness evidence (or a named block) before any promotion-readiness claim.
</quality-bar>

<anti-patterns>
Avoid:
- **runtime governance leak** — the mint-act output naming cav2 as the method authority that resolves
  promotion/source-posture/non-collapse (the precedent's failure; FALSIFIES Obs-B);
- **re-skin** — emitting a domain kinds table that is lexically OR owner-route identical to cav2's (FALSIFIES Obs-A);
- **mold mutation** — a casting that can't operate unless cav2 adds/alters a D49 row (FALSIFIES Obs-C);
- folding Mint into `domainspec-new-repo` (re-fuses meta and object — the foundry goes circular);
- building L2 while the signer capability is absent; claiming Mint is shipped/promoted.
</anti-patterns>

<observability>
Meaningful execution = a mint attempt (a minted repo or a recorded block). Emit telemetry (to a future
`cyberAlchemy-v2/development/mint/development/telemetry/` or the repo observability package): mode; domain;
stages reached (L0/L1/L2-blocked); per-criterion observable HOLDS/FAILS at the mint-act output; leak detected;
re-skin detected; D49-mutation detected; blocks hit; owner-ratify pending. Reflection trigger: any Obs-B leak
is a **severe gap** (immediate reflection) — it is the contract's load-bearing failure.
</observability>

<output-contract>
Return: target domain; stages completed (L0/L1) + blocked (L2/L3); the per-observable HOLDS/FAILS table
at the mint-act output; minted repo path; signed decision record (or "owner-ratify pending"); blocks; next route.
</output-contract>

<origin>
Authored by `invoke` (define→design→plan), corrected by `mint-design-plan-review` (FIX), pre-registered by
`experiment` (`mint-foundry-boundary-criterion`, frozen criterion). Lifecycle owner: `sigil-development`.
Next: `task-session` for the MVP SWUs (WORK-PACK SWU-1..3); the run (mint N=3 → SURVIVED/FALSIFIED) is a
separate downstream `experiment` run dispatch.
</origin>
