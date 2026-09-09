# Mint improvement audit — explorer returns

These are mechanically preserved, non-authoritative research returns. They do not establish implementation, authority, promotion, publication, deployment, release, shipment, production readiness, or Inventory authority.

## Agent 1 — current state and reliability

## SUBSTANTIVE RETURN

### Plain-language finding

Mint has a substantial, evidence-backed design and template corpus, but it is not a callable or recoverable repository generator. Its current installed “runtime” is an agent instruction file plus Markdown templates. The declared L0 scaffolder is absent, authority-triage is source-only and contractually classifies/routes rather than emits, and there is no executable Mint plan/apply/check/resume path.

The strongest current bytes are the 21 templates and `EMIT-PROCEDURE.md`; two historical smoke reports say agents instantiated them successfully in scratch space. Those scratch outputs are not persisted, while the checked-in `release-approval` example contains only the older core surface and fails the expanded checks by absence.

Mint’s L2 blocker is also misclassified. Attestation L1 is built, and its checked-in seal executed `valid` against the current decision bytes. Mint has not integrated it. Thus the current block is Mint integration and owner-act wiring, not absence of the L1 capability. External actor-identity signing remains unbuilt.

All identities below use repository `HEAD ab46061bf14db23a01054c2fd3fafec60fb5eb2f` unless another immutable commit/blob is stated. Explorer return references are stable local IDs `CS-*`.

### Surface and status drift matrix

| Ref | Surface classification and current claim | Immutable source identity, path, selector | Evidence scope | Proof |
|---|---|---|---|---|
| CS-01 | **Current source contract, older authoring state.** Source `SKILL.md` describes L0/L1 as buildable, L2 blocked, future telemetry, and future task sessions. It omits the later 13 additions and universal baseline. | blob `45268fd8d005bc4599ee0dd8161492b3f6b2fa63`; `cyberAlchemy-v2/development/mint/SKILL.md` §§process, observability, origin; last changed at `5662be19ae7b054bc30a2d1d180e6013e69c8926` | Source contract only; not proof of runtime | observed |
| CS-02 | **Installed runtime/projection, newer but unsynchronized.** It carries the additions/baseline and says emit logic is built, but is byte-divergent from the source contract: SHA-256 `d2e29d…` versus `31ce21…`; diff is 116 insertions/70 deletions. No source-to-installed generation/version declaration exists. | blob `9d6b260905dc2755e5c41344046ac4e5ff0bd231`; `.claude/skills/mint/SKILL.md` `<status>`, `<process>`, `<gates>`, `<origin>`; commit `fad671aed4ebf6c1405e4264a40d14e3ee33e740` | Installed agent instructions; not executable implementation | observed |
| CS-03 | **Plans containing stale status.** SPEC calls the additions “committed, NOT yet built”; EXECUTION-PACK and IMPLEMENTATION-LAYERING say “committed-not-built.” | `HEAD:cyberAlchemy-v2/development/mint/SPEC.md#Committed additions` lines 46–67; `HEAD:.../EXECUTION-PACK.md` lines 23–30; `HEAD:.../IMPLEMENTATION-LAYERING.md` lines 22–29 | Plan/define projections | observed |
| CS-04 | **Work-pack has the later state.** It says SWU-2 and SWU-5..10 emit logic are built but non-executed, with live Mint and N=3 work still outstanding. | `HEAD:cyberAlchemy-v2/development/mint/WORK-PACK.md#Build status` lines 37–45 | Work-pack status; does not prove execution | observed |
| CS-05 | **Harness source is stale.** It says “no examples run yet — Mint is not implemented,” while installed run reports record two smoke passes. | blob `54b87bacd99f9c994930833f5ea161c1059c5797`; `cyberAlchemy-v2/development/mint/development/HARNESS.md` lines 1–4; commit `fad671ae…` | Harness projection | observed |
| CS-06 | **Installed README is stale internally.** It says templates/additions “are being built” and invoking Mint will block at spine seed, while the adjacent installed SKILL says emit logic is built. | `HEAD:.claude/skills/mint/README.md` lines 7–12 versus `HEAD:.claude/skills/mint/SKILL.md` lines 8–15 | Installed documentation | observed |
| CS-07 | **Historical smoke evidence.** Reports record one fresh-domain core/additions pass and one baseline pass. The outputs were scratch test evidence, are not in the current tree, and therefore cannot be replayed from a persisted output fixture. | `HEAD:.claude/skills/mint/development/runs/20260701T180723Z-mint-smoke-01.md` lines 14–25, 27–51; `.../20260701T182000Z-mint-smoke-02.md` lines 8–38 | Historical handoff/run reports; runner output absent | observed report; execution unverified this turn |
| CS-08 | **Frozen experiment status differs from installed “future N=3” prose.** The original kind-level N=3 criterion completed and was FALSIFIED on research Obs-A; the corrected content-autonomy criterion later SURVIVED. Neither is shipment or live-mint proof. | `HEAD:cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/findings.md` lines 14–24, 39–61; `HEAD:.../experiment-content-autonomy/run-findings.md` lines 19–27, 136–142 | Frozen experimental artifacts | observed |
| CS-09 | **Inventory is discovery only.** Its source/runtime drift lead was confirmed, but its Mint status is not treated as authority. | `strategy-inventory-packet.json#direct_live_observations` and `#non_authority_notice`, packet ID `strategy-inventory-packet-2026-08-06-mint-improvement-audit` | Non-authority Inventory | observed |
| CS-10 | **Current Git state is clean for existing Mint/dependency files.** Only the active audit folder is untracked. Current bytes therefore match the cited tracked objects. | `HEAD ab46061…`; `git status --short -- cyberAlchemy-v2/development/mint .claude/skills/mint development/authority-triage`, observed `2026-08-06T13:14:19-03:00` | Current checkout | executed |

### Executable-path map

| Ref | Stage | Current path and behavior | Immutable source identity / selector | Evidence scope | Proof |
|---|---|---|---|---|---|
| CS-11 | Operator entry | `.claude/skills/mint/SKILL.md` is an agent instruction surface. Mint source and installed trees contain **zero executable files**. No Mint CLI/script exists. | `HEAD:.claude/skills/mint/SKILL.md`; `HEAD:cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md` lines 27–34 | Current installed/source bytes | executed file-mode scan |
| CS-12 | L0 scaffold | Contract calls `domainspec-new-repo … --mode plan|apply`; `command -v domainspec-new-repo` returned missing, and the contract’s named source path `implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md` does not exist in the checkout. | `HEAD:cyberAlchemy-v2/development/mint/templates/L0-compose-contract.md` lines 19–30, 33–61 | Current PATH and checkout | executed |
| CS-13 | L1 classification | `development/authority-triage/SKILL.md` exists at version 0.1.0, but `.claude/skills/authority-triage/SKILL.md` does not. Its contract says it classifies/routes and writes nothing into authority surfaces; Mint must own emission separately. | blob `5658e76bc81bef69b83ef81537b6355cb1e87a9e`; `development/authority-triage/SKILL.md` lines 1–11, 62–73, 102–110, 125–133 | Direct dependency contract | executed existence check; observed contract |
| CS-14 | L1 emission | `EMIT-PROCEDURE.md` is prose instantiation logic over 21 Markdown templates, not a runtime tool. | blob `ba3ce8456fa344b70162600d1062956d0946acc7`; `cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md` lines 27–34, 75–225 | Current source | observed |
| CS-15 | Validation | Checks 1–13 are prose/grep obligations. No parser, validator, fixture runner, or receipt emitter implements them. | same blob; `EMIT-PROCEDURE.md` lines 246–297 | Current source | observed plus executable scan |
| CS-16 | L2 attestation | `attest.py` exists. `verify` returned `valid` against the live decision whose SHA-256 equals the artifact’s recorded hash. Mint contains no call/integration. | `HEAD:cyberAlchemy-v2/development/attestation-capability/attest.py`; `.../development/2026-07-12-l1-status-refresh.md` lines 12–42; attestation JSON lines 1–12 | Direct Mint dependency, L1 only | executed |
| CS-17 | Receipt/observability | Installed harness says observability is “not yet wired.” No Mint execution receipt exists. | `HEAD:.claude/skills/mint/development/EXPERIMENT-HARNESS.md` lines 22–30 | Installed lifecycle sidecar | observed |

### Verified defects and reliability gaps

| Ref | Classification | Defect or gap | Immutable source identity / selector | Evidence scope | Proof |
|---|---|---|---|---|---|
| CS-18 | defect | **L0 dependency is unavailable.** A conforming Mint cannot begin its required plan phase in this checkout. | CS-12 | Current checkout | executed |
| CS-19 | defect | **No executable Mint runtime.** “Deterministic, repeatable instantiation logic” is presently agent-mediated prose; behavior, ordering, and checks are not mechanically fixed. | CS-11, CS-14, CS-15 | Current source/runtime | executed/observed |
| CS-20 | defect | **Authority-triage integration contract is conflated.** Mint says “emit via authority-triage”; triage explicitly promotes/writes nothing and only returns a routing result. It is also not installed. | CS-13 plus `EMIT-PROCEDURE.md` lines 97–115 | Direct integration seam | observed/executed |
| CS-21 | defect | **Truth surfaces disagree.** Source, installed runtime, README, SPEC, plan, layering, work-pack, and harness describe different build/run states. | CS-01–CS-08 | Status/projection layer | observed |
| CS-22 | defect | **No current expanded golden fixture.** The persisted `release-approval` tree has zero placeholders and passes the narrow no-leak grep, but contains four `PROPOSED` occurrences, no ratify file, and none of METHODS-CATALOGUE, DEFINITIONS-INDEX, DRIFT-AUDIT, baseline constitution/primitives, or project-space roles. | `HEAD:cyberAlchemy-v2/development/mint/examples/release-approval/**`; comparison to `EMIT-PROCEDURE.md` checks 6–13 | Persisted fixture | executed |
| CS-23 | hardening gap | **The no-leak check is non-discriminating for other forbidden phrasings.** Target-owned regex did not match `route to cav2 for promotion`, although the procedure expressly forbids routing to cav2. | `EMIT-PROCEDURE.md` lines 59–71, 251–259; executed negative control | Validator design | executed |
| CS-24 | defect | **Closure contract contradicts itself.** Installed quality bar says no kind remains `PROPOSED`; ratify template and check #7 allow a deferred kind to remain `PROPOSED` with a matching record. | `.claude/skills/mint/SKILL.md` lines 108–115; `decision-mint-ratify.md` lines 35–55; `EMIT-PROCEDURE.md` lines 263–265 | Contract semantics | observed |
| CS-25 | reliability gap | **No mutation recovery contract.** L0 defines dry plan and “stop” on Step-7 failure; L1 blocks before record on failed checks. There is no target-exists/conflict/overwrite rule, staging transaction, rollback, cleanup, resumability, idempotent replay, or partial-apply receipt. | `L0-compose-contract.md` lines 27–61, 77–96; `EMIT-PROCEDURE.md` lines 246–290; recovery-term search | Failure behavior | observed/executed search |
| CS-26 | lifecycle gap | **No template version or upgrade posture.** Twenty-one templates have zero `version`, `template_version`, or `schema_version` fields; there is no manifest/lock/migration/upgrade file. Generated outputs do not pin template/source commit or hashes. | `HEAD:cyberAlchemy-v2/development/mint/templates/*.md`; commit `fad671ae…`; executed inventory | Template lifecycle | executed |
| CS-27 | stale dependency status | **Attestation L1 is no longer capability-blocked.** L1 is built and verified; Mint has not integrated it. Correct current split: L1 dependency available, Mint integration missing, L2 external identity/signature unbuilt. | CS-16; `attestation-capability/SKILL.md` lines 44–61; status refresh lines 12–42 | Direct dependency | executed/observed |
| CS-28 | reproducibility gap | Attestation DEMO gives a placeholder command but does not persist the claimed decision under `specimen/`; the obvious local `decision.md` replay failed missing-file. Verification succeeds only when resolved to the live authority decision path. | `HEAD:.../specimen/DEMO.md` lines 7–20; `attestation.json`; executed commands | Dependency specimen | executed |
| CS-29 | stale fixture classification | Installed harness calls resonantos a golden fixture; source harness correctly classifies it as an Obs-B negative control and `release-approval` as the N=1 positive fixture. | `.claude/skills/mint/development/EXPERIMENT-HARNESS.md` lines 7–20 versus `cyberAlchemy-v2/development/mint/development/HARNESS.md` lines 13–26 | Harness semantics | observed |

### Failure and recovery behavior

| Ref | Situation | Current specified/observed result | Proof |
|---|---|---|---|
| CS-30 | Start L0 | Shell cannot resolve `domainspec-new-repo`; no typed Mint block/receipt is emitted. | executed |
| CS-31 | Target has no clean domain-kind enumeration | Prose says emit `blocked-default-deny` and route to owner; exact artifact path/schema and replay behavior are unspecified. | observed, unverified |
| CS-32 | Self-check 1–13 fails after files are written | Prose says block before emitting the decision record; cleanup or rollback of already-written spine bytes is unspecified. | observed, unverified |
| CS-33 | Owner defers a kind | Ratify template permits deferred `PROPOSED`; installed quality bar says none may remain. | observed conflict |
| CS-34 | Apply is interrupted or collides with existing bytes | No behavior is specified. | verified absence |
| CS-35 | Attestation step | Separate L1 verifier works, but Mint has no stage binding, artifact destination, failure propagation, or retry contract. | executed dependency; integration unverified |

### Ranked candidate fixes

| Ref | Priority/class | Candidate, owner, and acceptance boundary | Immutable evidence / scope | Proof |
|---|---|---|---|---|
| CS-36 | P0 fix | **Choose and declare the canonical Mint source**, then generate/synchronize installed SKILL/README/harness with a source commit and hash. Owner: sigil-development. Acceptance: one status vocabulary; projection check detects drift. | CS-01–CS-08, CS-21 | candidate from observed defects |
| CS-37 | P0 dependency fix | **Restore or owner-route the exact `domainspec-new-repo` plan/apply capability.** Do not reimplement it in Mint. Mint must fail preflight with a typed missing-dependency block before target mutation. | CS-12, CS-18 | candidate |
| CS-38 | P0 implementation | **Create one executable Mint plan/apply front door** that stages output, validates all checks, then commits atomically; define target-exists, overwrite denial, cleanup, resume, and replay receipts. Owner: Mint/sigil-development. | CS-19, CS-25, CS-30–CS-34 | candidate |
| CS-39 | P0 integration fix | **Separate triage from emission.** Triage returns classification/owner-route evidence; Mint alone instantiates files after ratification. Install or explicitly invoke the source contract. | CS-20 | candidate |
| CS-40 | P0 validation fix | **Turn checks 1–13 into executable validators** with persisted normal and negative fixtures, including broader resolution-edge detection, malformed tables, missing methods, dangling links, cav2-row leakage, unresolved defer, and partial apply. | CS-22, CS-23 | candidate |
| CS-41 | P0 dependency integration | **Integrate attestation L1** into the Mint owner-close stage and update stale blocker prose. Keep external actor signature explicitly deferred. | CS-27, CS-28 | candidate |
| CS-42 | P1 contract fix | **Resolve defer semantics:** either deferred kinds are typed pending rows allowed by the quality bar, or closure removes every `PROPOSED`; encode one rule and validator. | CS-24 | candidate |
| CS-43 | P1 lifecycle hardening | **Add a template manifest/version and output provenance receipt** containing Mint version, template set version, source commit/hashes, attach mode/source identity, and migration compatibility. Add explicit upgrade/migration rules before supporting existing repos. | CS-26 | candidate |
| CS-44 | P1 evidence hardening | **Persist the expanded fresh-domain output as a fixture or provide a deterministic regeneration command.** Historical scratch reports alone are insufficient for current replay. Correct resonantos negative/golden terminology. | CS-07, CS-22, CS-29 | candidate |
| CS-45 | P1 operability | **Emit structured plan/apply/block receipts and stage telemetry** with files planned/written, checks, rollback/cleanup, owner verdicts, attestation result, and residue. | CS-17, CS-25 | candidate |

### Acceptance commands

Current read-only baseline commands, already executed:

```bash
command -v domainspec-new-repo
find cyberAlchemy-v2/development/mint -type f -perm /111
find .claude/skills/mint -type f -perm /111
test -f development/authority-triage/SKILL.md
test -f .claude/skills/authority-triage/SKILL.md
sha256sum cyberAlchemy-v2/development/mint/SKILL.md .claude/skills/mint/SKILL.md
git diff --no-index --stat cyberAlchemy-v2/development/mint/SKILL.md .claude/skills/mint/SKILL.md
python3 cyberAlchemy-v2/development/attestation-capability/attest.py verify \
  cyberAlchemy-v2/development/attestation-capability/development/specimen/attestation.json \
  cyberAlchemy-v2/authority/decisions/2026-06-24-saturn-domainspec-public-disclosure.md
```

Required executable acceptance after candidate implementation; these command names are proposed contracts and are currently unverified:

```bash
mint preflight --domain tide-tables --target /absolute/sibling/path --source /absolute/framework/path
mint plan --domain tide-tables --target /absolute/sibling/path --source /absolute/framework/path --attach submodule
mint apply --plan <plan-receipt.json>
mint validate --target /absolute/sibling/path --checks 1-13
mint resume --receipt <failed-apply-receipt.json>
mint verify-provenance --target /absolute/sibling/path
mint upgrade --target /absolute/sibling/path --plan
```

Acceptance boundaries:

- `preflight` blocks before writes when the scaffolder, triage contract, owner, target policy, or attestation integration is unavailable.
- `plan` writes no target bytes and records exact source/template identities.
- `apply` either commits a fully validated tree or leaves a typed recoverable receipt with no unaccounted partial bytes.
- `validate` passes persisted positive fixtures and rejects explicit negative fixtures, including `route to cav2 for promotion`.
- stage 3 encodes one non-contradictory defer policy.
- attestation L1 returns `valid` on the exact minted close-state and `tampered` on a content mutation.
- no result implies promotion, publication, deployment, release, shipment, or production readiness.

## RECEIPT PAYLOAD

```json
{
  "status": "pass",
  "validation": "pass",
  "artifacts": [
    "cyberAlchemy-v2/development/mint/SKILL.md",
    ".claude/skills/mint/SKILL.md",
    ".claude/skills/mint/README.md",
    "cyberAlchemy-v2/development/mint/SPEC.md",
    "cyberAlchemy-v2/development/mint/EXECUTION-PACK.md",
    "cyberAlchemy-v2/development/mint/WORK-PACK.md",
    "cyberAlchemy-v2/development/mint/IMPLEMENTATION-LAYERING.md",
    "cyberAlchemy-v2/development/mint/development/HARNESS.md",
    "cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md",
    "cyberAlchemy-v2/development/mint/templates/L0-compose-contract.md",
    "cyberAlchemy-v2/development/mint/templates/decision-mint-ratify.md",
    "cyberAlchemy-v2/development/mint/examples/release-approval/",
    ".claude/skills/mint/development/EXPERIMENT-HARNESS.md",
    ".claude/skills/mint/development/EXPERIMENT-PROFILE.md",
    ".claude/skills/mint/development/runs/20260701T180723Z-mint-smoke-01.md",
    ".claude/skills/mint/development/runs/20260701T182000Z-mint-smoke-02.md",
    "development/authority-triage/SKILL.md",
    "cyberAlchemy-v2/development/attestation-capability/SKILL.md",
    "cyberAlchemy-v2/development/attestation-capability/attest.py",
    "cyberAlchemy-v2/development/attestation-capability/development/2026-07-12-l1-status-refresh.md",
    "cyberAlchemy-v2/development/attestation-capability/development/specimen/DEMO.md",
    "cyberAlchemy-v2/development/attestation-capability/development/specimen/attestation.json",
    "cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/findings.md",
    "cyberAlchemy-v2/development/mint/experiment-content-autonomy/run-findings.md",
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/strategy-inventory-packet.json"
  ],
  "blockers": [],
  "started_at": "2026-08-06T13:07:42-03:00",
  "finished_at": "2026-08-06T13:15:25-03:00"
}
```

## Agent 2 — evidence, security, and authority boundary

## SUBSTANTIVE RETURN

### Bottom line

Mint’s evidence supports a narrow claim: three frozen authority spines survived the corrected content-autonomy criterion. It does not prove that current Mint bytes can safely generate a repository, protect paths or private material, recover from partial failure, or emit a verifiable Mint attestation.

Attestation L1 is no longer a missing capability. Its checked-in implementation successfully distinguishes the existing valid fixture from a content mutation. Mint L2 is now blocked primarily by missing integration: no Mint-side `attest(mint-act)` call, deterministic multi-file manifest, sidecar/storage contract, mint-kind fixture, or transactional commit sequence exists.

External actor authentication is a separate blocker for attestation L2—the moat rung—not for Mint L2 if the current owner decision continues to accept L1 integrity sealing as sufficient. The term “signed” must therefore not imply authenticated actor identity at L1.

### Current-byte source identity ledger

All identities below are SHA-256 over the current read bytes.

| ID | Source identity |
|---|---|
| P1 | `36a6dd94306ab17beb2bcf193232c6c9db9e1e5718d29f91e272716dd38c9e33` — `mint/experiment-foundry-boundary/criterion.md` |
| P2 | `dc29508a2fa7b6e5790d4e4a425ad0541b36a568b4a8ddfe093414963a8147c4` — `mint/experiment-foundry-boundary/run/findings.md` |
| P3 | `5c2ce5a110a9c36a0e8c1c415bf0e4beae178ad130016f33e22ba43b17f21779` — `mint/experiment-content-autonomy/criterion.md` |
| P4 | `e116ffc0890d42d7031c236ffd2484558d538efac92e6fa381bfcc7b96cd40e4` — `mint/experiment-content-autonomy/run-findings.md` |
| P5 | `31ce212627ab3f2bad0ac390a258aa7c2b270768a97dc287a781700f733e6ddf` — `mint/SKILL.md` |
| P6 | `d4912b881e89cda44ccc1a1565cbea14479e5435993f19055337c703a49f3e2f` — `mint/templates/EMIT-PROCEDURE.md` |
| P7 | `772157b91733b712122c6df6947347759ae7a64089ebd7e104504b82c5f54717` — `attestation-capability/attest.py` |
| P8 | `b4df95c7cc0840732588160719cd9e6622e99508bac9c968b4ddfcb538480d85` — `attestation-capability/development/specimen/DEMO.md` |
| P9 | `7f73e9a2a0367aaf5a29ddd69220431fd1742b9266190eacfb70840256da9f59` — `attestation-capability/development/HARNESS.md` |
| P10 | `4cbade43c954b0849fdbb4c5e84bbee98503e9c0a998482c47117095b5433b6d` — `authority/decisions/2026-06-29-mint-signer-and-boundary.md` |
| P11 | `eaf4ad6c9bfa251ac4ecd3a5d5d39871b7005ae3982269371d7ac93c0f5d495e` — `mint/HANDOFF.md` |
| P12 | `aee9bf9572c3ed32e4c362efdcfa66226613bf32610fb2445944001ce94881c5` — `implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md` |
| P13 | `baef87f817baa6edd661d4a67ec2668213fdb370f20bc0b8a3b792434747a5ba` — `mint/SPEC.md` |
| P14 | `07ab5a84e60261c9fb8d2bd9baadf0d53f649cbaa3d5abefff32da4bec30fca2` — `attestation-capability/SPEC.md` |
| P15 | `d441e603902427424bfc77fa01870a6d950d13649d0154821c44c9f2e5e5e582` — `attestation-capability/HANDOFF.md` |
| P16 | `b148877cf2dce9cf106afeb88ddb0c98b0856bb0ce849c7e1053164032327842` — Inventory Body War relation query; read-model only |

### Positive evidence rows

| ID | Evidence and selector | Status | Supported claim | Proof ceiling |
|---|---|---|---|---|
| E-POS-01 | P1 lines 62–89, 120–220; P2 lines 16–61 | observed | The original kind-level autonomy criterion was genuinely discriminating and rendered `FALSIFIED`: research failed Obs-A while Obs-B/C held across all three spines. | Applies only to the frozen research/process/product artifacts and criterion. It does not test Mint implementation, safety, shipment, or other domains. |
| E-POS-02 | P3 lines 13–62, 84–107; P4 lines 19–27, 95–114 | observed | The corrected content-autonomy criterion rendered `SURVIVED`: all nine A′/B/C cells held on the three frozen spines. | P3 lines 60–62 explicitly reuse existing spines with no re-mint. This proves properties of those artifacts under that criterion, not that current Mint generates them. |
| E-POS-03 | P4 lines 29–64, 116–134 | observed | Research’s content-localization result has at least one stronger entailment-based carrier; the verdict is not dependent only on a domain-flavored noun. | The lexical limb remains weak, and most research rules are still localized versions of cav2 rigor. No generalization beyond N=3. |
| E-POS-04 | P7 lines 19–52; P8 lines 14–27 | executed | Current L1 verifier returned `valid` on the checked-in decision and `tampered` after a content mutation. | Demonstrates unkeyed integrity checking for one decision-shaped file. It does not authenticate the actor, prevent recomputation, resist replay, or cover a multi-file Mint spine. |
| E-POS-05 | P10 lines 15–39; P14 lines 116–125 | observed | Owner selected a dedicated attestation capability, and the current contract states its L1 integrity seal is sufficient to unblock Mint L2. | The decision did not build Mint integration. “Sufficient” means tamper-evident under the current contract, not external actor-authenticated. |
| E-POS-06 | P10 lines 41–55; P5 lines 15–18, 63–67 | observed | Private-only MVP is an explicit owner decision; public-attached mints remain blocked. | This is a policy boundary. No executable target-visibility or leakage gate was found. |
| E-POS-07 | P11 lines 47–54; Body War `PROJECT-DECISIONS.md` lines 10–18 and `domainspec/CONSTITUTION.md` lines 8–35 | observed | Body War is explicitly adjacent: it may become a separate valid/tampered witness for verifier-pattern generality and has project-local ownership rules. | No Body War attestation specimen or runnable verifier evidence exists. It is not a fourth Mint spine. P16 only aided discovery and is not direct proof. |

### Negative evidence and absent controls

| ID | Evidence and selector | Status | Defect or missing witness | Consequence |
|---|---|---|---|---|
| E-NEG-01 | Corpus scan of Mint sources; P5 lines 46–52; P6 lines 232–244; P9 lines 40–45 | observed | Mint still describes an L0 attributional placeholder and contains no Mint-side `attest(mint-act)` call, attestation sidecar, manifest builder, or mint-kind specimen. | Mint L2 is integration-blocked, not capability-absence-blocked. |
| E-NEG-02 | P7 lines 42–52; executed `verify({}, "/dev/null")` | executed | Malformed artifact raised `KeyError: 'header'` instead of producing one verdict. | The documented “decidable and total; every input yields one verdict” claim is false for malformed input. |
| E-NEG-03 | P7 lines 19–25; P8 lines 17–25; P9 lines 24–27 | observed | Canonicalization intentionally accepts trailing-whitespace and newline differences, while the harness describes `valid` as byte-for-byte equality. | The supported statement is canonical-equivalence, not exact-byte equality. Claims and tests need correction. |
| E-NEG-04 | P7 lines 27–40 | observed | L1 is an unkeyed hash. Actor, act, timestamp, content digest, and seal can all be replaced and recomputed by anyone able to run or reproduce the mechanism. Actor is an unchecked string. | L1 detects drift relative to a trusted sidecar; it does not establish authorship or resist deliberate forgery. This is a proof ceiling, not evidence that L2 exists. |
| E-NEG-05 | P7 lines 35–40; P15 lines 55–65 | observed | No nonce, repository identity, commit identity, predecessor seal, sequence, expiry, or trusted time source is bound. | Old valid attestations can be replayed; sidecars may be swapped where content/header align; timestamps are caller assertions. |
| E-NEG-06 | P9 lines 40–61 | observed | Medium promotion fixture, complex Mint fixture, `bad-signature`, and `unknown-actor` controls are explicitly absent. | Low-regime decision evidence cannot be generalized to Mint’s multi-file state or external identity. |
| E-NEG-07 | P12 lines 42–50, 105–135 | observed, unexecuted risk | The scaffolder permits populated targets after confirmation, conflicts with overwrite-with-backup, and partial operation. It names idempotence but no atomic staging or rollback protocol. | Partial L0/L1 state, backup ambiguity, and resume behavior remain unproved. Ownership belongs to the scaffolder for L0 and Mint for cross-stage composition. |
| E-NEG-08 | P12 lines 113–135; P13 lines 33–39 | observed, unexecuted risk | No explicit canonical-realpath containment, symlink-ancestor rejection, source/target overlap rejection, option-like path rejection, or filesystem-root/current-repo rejection is specified. | A malicious or mistaken target/domain could escape the intended sibling repository or redirect writes. |
| E-NEG-09 | P12 lines 42–68, 125–135; P10 lines 41–55 | observed, unexecuted risk | `copy` can materialize private framework bytes; submodule may preserve a local/private source locator; symlink is movable-path fragile. Public/private enforcement is prose, not a pre-write classifier/scrub. | A public or misclassified target could leak private source, paths, metadata, or mechanism. |
| E-NEG-10 | P6 lines 59–71, 246–290 | observed | No-leak assurance relies substantially on phrase grep and prose resolution scans. No graph/path validator or adversarial paraphrase fixture is named. | A semantic runtime dependency can evade the banned phrase while violating Obs-B. |
| E-NEG-11 | P5 lines 80–85; attestation SKILL lines 94–101 | observed | Both telemetry destinations are future/optional. No current attempt ID, stage state, source/target digest, verifier error, rollback/resume event, or privacy-scrub receipt is evidenced. | Failures and security-relevant transitions are not reconstructable from owned current telemetry. |

### Exact L2 blocker diagnosis

1. **Missing capability? No for L1.** `attest.py`, the checked-in specimen, and current positive/tampered execution establish a usable low-regime L1 primitive.

2. **Missing integration? Yes, primary current blocker.** Mint has no complex `kind=mint` fixture, deterministic manifest of its authority surface, invocation, sidecar placement, atomic commit sequence, or recovery behavior.

3. **Actor identity? Not for current Mint-L2-as-L1-integrity contract; yes for authenticated “signed” claims and attestation L2.** The actor is currently an unchecked label. The per-owner versus organization key model and public identity distribution remain decision-gated.

4. **Another owner decision? Two narrower decisions remain:**

   - Mint/attestation owners must settle the exact Mint attested object: decision record only versus deterministic full-spine manifest, sidecar name/location, and whether `actor` is one identity or a structured `{producer, ratifier}` pair.
   - `decision-gate + boundaries` still owns public-attached Mint policy and executable target classification. Public Mint remains blocked.

### Security threat matrix

| Surface | Threat | Current control | Required ceiling-preserving repair |
|---|---|---|---|
| Target/domain input | Traversal, option injection, symlink escape, source/target overlap | “Sibling path” prose and one human gate | Resolve canonical paths; reject root/current/source/`.git`/nested/ancestor overlap; reject symlink ancestors and option-like names; bind approved resolved path into plan and apply. |
| Attach: submodule | Local absolute URL, inaccessible private remote, dirty/unpinned source | Default “clone-safe” claim | Pin source commit and remote identity; clean-clone fixture in an isolated checkout; block local-only locator when portability is claimed. |
| Attach: copy | Private files, credentials, history-derived configuration copied into target | Private-only MVP policy | Explicit allowlist, synthetic-secret canary scan, source manifest, visibility gate, and privacy receipt. Never use real credentials in testing. |
| Attach: symlink | Path escape and post-plan target substitution | Warning only; Mint says it never selects symlink in L0 contract | Mint should reject symlink mode unless separately owner-authorized; test ancestor and leaf retargeting between plan/apply. |
| Template fill | Markdown/frontmatter/table injection; `<DOMAIN>` used in filenames | Placeholder checks only | Typed slug/display-name split, escaping rules, reserved-name checks, and traversal/newline/pipe fixtures. |
| Overwrite | Existing authority bytes replaced after broad confirmation | Skip/conflict/overwrite-with-backup prose | Per-file hashes, exact overwrite set, backup locator, atomic rename, no-overwrite default, and post-failure restoration test. |
| Partial failure | L0 succeeds, L1 or attestation fails, leaving ambiguous repo | Partial session intention; no Mint transaction contract | Stage state machine with attempt ID, immutable plan digest, resumable checkpoints, explicit rollback/abandon outcome, and no mint record over failed checks. |
| Canonicalization | Semantic or byte distinctions collapse unexpectedly | Frozen `attest.canon.v1` | Specify canonical-equivalence honestly; add Unicode whitespace, invalid UTF-8, final-newline, and version-mismatch fixtures. |
| Multi-file seal | Add/delete/rename/symlink changes not represented by single-file `attest.py` | Future “deterministic manifest” note | Canonical relative-path manifest including file type and content digest; reject duplicate/escaping paths and symlink ambiguity; bind manifest version and target repo identity. |
| Forgery/replay | Recompute unkeyed seal, spoof actor, replay old valid state | L1 only | Explicitly document expected L1 forgery/replay ceiling; bind commit/repo/sequence for freshness where appropriate; route authenticated identity to L2 without claiming it now. |
| Keys/identity | Secret exposure, stale keys, unknown actor, no revocation | None; decision deferred | Owner decision covering trust anchor, per-owner/org model, rotation, revocation, custody, public-key distribution, signing interface, and log redaction. Do not place keys in repository or receipts. |
| Observability | Security failures invisible or mechanism leaked in logs | Future telemetry prose | Record attempt/stage/verdict/digests/canon version/block and scrub result; never record content, secrets, private mechanism, or key material. |

### Candidate improvements and acceptance fixtures

| Candidate | Class | Owner/dependency | Smallest acceptance boundary |
|---|---|---|---|
| MINT-SEC-01 — canonical target admission | fix/hardening | Mint + `domainspec-new-repo` owner | `PATH-VALID-SIBLING` passes; current repo, source subtree, `.git`, root, option-like name, symlink ancestor/leaf escape, and existing non-empty target all block before writes. |
| MINT-SEC-02 — privacy/attach gate | hardening + deferred owner dependency | Mint; `decision-gate + boundaries`; scaffolder owner | Private target with pinned submodule passes clean clone. Unknown/public target blocks. Copy-mode synthetic secret/private-mechanism canaries do not escape the allowlist. Symlink is blocked by Mint. |
| MINT-REL-01 — transaction and recovery contract | fix/hardening | Mint for cross-stage state; scaffolder for L0 behavior | Inject failures after L0, mid-L1, before attest, and after attest-before-commit. Each ends as either restored pre-state or a typed resumable state with exact touched-file hashes; rerun cannot duplicate or silently overwrite. |
| MINT-ATT-01 — deterministic Mint manifest integration | dependency/integration | Mint + attestation capability | Manifest binds normalized relative paths, content hashes, repo identity, source revision, and manifest version. Valid spine verifies; one-file modify/add/delete/rename and symlink-target drift return non-valid. |
| ATT-FIX-01 — total verifier/schema | confirmed fix | Attestation capability | Malformed JSON, missing/wrong types, invalid UTF-8, missing claimed file, unsupported canon, and invalid kind/timestamp all yield a typed non-valid/error verdict without traceback. Do not collapse malformed input into cryptographic `tampered`. |
| ATT-CLAIM-01 — canonical-equivalence language | confirmed fix | Attestation capability + harness/docs | Whitespace-normalized variants pass only under an explicitly named equivalence statement; byte-exact claims are absent. A semantic character change still returns `tampered`. |
| ATT-EXP-01 — L1 ceiling controls | experiment | Attestation + experiment-harness | Actor-only mutation without recomputation fails; actor/content mutation with full recomputation is expected to verify under L1 and is recorded as the forgery ceiling; old-state replay and cross-repo sidecar swap are separately exercised. |
| ATT-L2-01 — actor identity decision | deferred owner decision/dependency | `decision-gate`, attestation `sigil-development` | Decision chooses trust anchor, identity granularity, custody, rotation/revocation, public distribution, and verification errors before key-bearing implementation begins. |
| MINT-EXP-01 — prospective current-byte Mint experiment | experiment | Mint + experiment-harness | New criterion and fresh generated outputs; do not edit frozen N=3. Include positive content-localized spines plus hollow-restamp, semantic runtime-leak, hidden symlink edge, and D49-mutation negatives. Distinguish generator execution evidence from artifact adjudication. |
| BW-ATT-01 — separate Body War verifier witness | experiment/dependency | Body War owner + attestation experiment owner | One Body War-owned valid state verifies; the predeclared meaningful tamper—such as the planned late-arriving in-window activity—fails. File separately as attestation-pattern generality evidence, never as a fourth Mint spine. |
| OBS-01 — security receipt | observability hardening | Mint/attestation + observability owner | Receipt records attempt ID, resolved target, stage transitions, source/manifest digests, attach mode, validation verdicts, recovery result, and privacy scrub status without content, secrets, mechanisms, or keys. |

### Explicit proof ceilings

- Frozen foundry evidence proves criterion outcomes for three selected spines, not Mint implementation behavior or general domain coverage.
- The corrected content criterion reused existing artifacts and performed no fresh re-mint.
- Passing Obs-A′/B/C does not prove safe path handling, non-destructive writes, privacy, rollback, observability, or attestation.
- L1 proves canonical-state integrity relative to a trusted sidecar, modulo SHA-256. It does not prove who attested, when the act truly occurred, freshness, non-replay, or resistance to recomputing both content and seal.
- The current verifier is not total over malformed inputs.
- No Mint-shaped, multi-file attestation has been demonstrated.
- Body War currently supplies only an adjacent candidate and local-boundary precedent; it supplies no attestation execution evidence.
- Public Mint remains owner-blocked. Private MVP policy is not executable leakage prevention.
- None of these findings authorize implementation, authority changes, promotion, publication, deployment, release, shipment, or production claims.

## RECEIPT PAYLOAD

```json
{
  "status": "pass",
  "validation": "pass",
  "artifacts": [
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/dispatch-sheet.json",
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/strategy-inventory-packet.json",
    "cyberAlchemy-v2/development/mint/experiment-foundry-boundary/criterion.md",
    "cyberAlchemy-v2/development/mint/experiment-foundry-boundary/run/findings.md",
    "cyberAlchemy-v2/development/mint/experiment-content-autonomy/criterion.md",
    "cyberAlchemy-v2/development/mint/experiment-content-autonomy/run-findings.md",
    "cyberAlchemy-v2/development/mint/SPEC.md",
    "cyberAlchemy-v2/development/mint/SKILL.md",
    "cyberAlchemy-v2/development/mint/templates/L0-compose-contract.md",
    "cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md",
    "implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md",
    "cyberAlchemy-v2/development/attestation-capability/SPEC.md",
    "cyberAlchemy-v2/development/attestation-capability/SKILL.md",
    "cyberAlchemy-v2/development/attestation-capability/attest.py",
    "cyberAlchemy-v2/development/attestation-capability/development/HARNESS.md",
    "cyberAlchemy-v2/development/attestation-capability/development/specimen/DEMO.md",
    "cyberAlchemy-v2/development/attestation-capability/development/specimen/attestation.json",
    "cyberAlchemy-v2/authority/decisions/2026-06-29-mint-signer-and-boundary.md",
    "cyberAlchemy-v2/development/mint/HANDOFF.md",
    ".arcanum/inventory/queries/2026-07-04-mint-body-war-relation/findings.md",
    "projects/body-war/docs/PROJECT-DECISIONS.md",
    "projects/body-war/domainspec/CONSTITUTION.md"
  ],
  "blockers": [
    "Mint L2 lacks integration with the now-demonstrated attestation L1 capability: no deterministic Mint manifest, attest(mint-act) invocation, sidecar/storage contract, complex fixture, or transaction sequence.",
    "Attestation L2 external actor authentication remains blocked on the per-owner versus organization identity model, trust distribution, key custody, rotation, and revocation decision.",
    "Public-attached Mint remains blocked by BLK-CAV2-PUBLIC-PRIVATE-001.",
    "Target-path, attach-mode privacy, overwrite, partial-failure, replay, and observability negative controls are absent."
  ],
  "started_at": "2026-08-06T16:09:25Z",
  "finished_at": "2026-08-06T16:14:44Z"
}
```

## Agent 3 — precedent and operator outcome

## SUBSTANTIVE RETURN

### Scope and proof ceiling

Read-only precedent and operator-outcome research completed against repository commit `ab46061bf14db23a01054c2fd3fafec60fb5eb2f` and DomainSpec source commit `4e8834ddf54baa28f8de91abcf86f9a367f63948`.

No exact external precedent was found for Mint’s combination of repository generation, private authority casting, local semantic autonomy, owner ratification, and no-runtime-parent constraint. The useful precedents are narrower contract patterns. They should inform tests and interfaces, not import another tool’s authority model.

This report establishes candidate improvements only. It does not establish implementation, approval, promotion, publication, deployment, release, shipment, or production readiness.

### Exact current operator contract

Mint’s public input surface names only `domain`, target path, framework source, and attach mode. Its L1 procedure actually needs a much richer domain specification: objective, governed subject, primary source, separable concerns, conflation risks, proposal unit, candidate kinds, and owner routes (`SKILL.md:27-54`; `templates/EMIT-PROCEDURE.md:36-42`).

The current journey is:

1. L0 invokes `domainspec-new-repo` in no-write plan mode, displays a tree diff and ordered actions, then runs apply after the scaffolder’s single confirmation. L0 verifies the attached canon before handing the tree to L1 (`templates/L0-compose-contract.md:27-61,77-96`).
2. L1 derives a fill-set, routes proposed kinds through authority-triage, emits a locally owned authority spine, and runs thirteen checks. A failed check blocks the mint record (`templates/EMIT-PROCEDURE.md:75-148,246-290`).
3. Stage 3 currently emits only an attributional placeholder. Cryptographic L2 remains blocked on attestation (`templates/EMIT-PROCEDURE.md:232-244`).
4. The result reports stages, observables, path, blocks, owner-ratify posture, and next route (`SKILL.md:80-90`).
5. Lifecycle implementation remains routed to `sigil-development`; experiment validation and the public/private decision are separate owners (`HANDOFF.md:27-45`).

What is already strong:

- No-write L0 preview and a named master gate.
- Explicit separation between generic scaffolding and Mint-owned casting.
- Default-deny and no-runtime-leak invariants.
- A finite validation checklist and honest blocked/deferred outputs.
- A handoff that does not inflate candidate evidence into shipment.

What remains undefined at the operator-contract level:

- A Mint-wide preview covering L0 and L1 together.
- Binding between the reviewed plan and the bytes later applied.
- Source/template version pinning and target-drift detection.
- Whether L1 writes are staged, atomic, backed up, or left partially present after failure.
- Resume semantics and stable run identity.
- L1 conflict policy for re-runs or pre-existing localized files.
- Template upgrade and migration ownership.
- Machine-readable plan, result, error codes, and per-step journal.
- Privacy policy for plans and logs.
- Concurrency control on the target.
- A single ratifier actor definition: the top-level contract names the cav2 authority owner, while the emit procedure routes ratification to the domain owner (`SKILL.md:46-52`; `templates/EMIT-PROCEDURE.md:104-115,232-244`).

### Novice and expert journeys

A novice must currently discover the richer L1 interview contract indirectly, understand the distinction between scaffold confirmation and semantic ratification, interpret thirteen checks, and understand why “L0+L1 complete” can coexist with “L2 blocked.” The likely failure is not a bad command; it is consenting to a scaffold plan without seeing the consequential authority-casting diff.

An expert can inspect templates and manually reconstruct the stages, but lacks a stable manifest for automation. They cannot prove that apply consumed the reviewed source/template revisions, resume safely after an injected failure, or distinguish template-owned unchanged bytes from locally owned authority edits during an upgrade.

The smallest coherent target journey is:

`typed intake → full preflight → immutable plan/diff → owner review → exact-plan apply → staged validation → commit/promote-or-preserve-failure → structured receipt → optional later upgrade plan`

“Promote” in that sequence means moving staged local files into the target transaction, not governance promotion.

### Primary-source precedent fit matrix

| Precedent | Behavior worth borrowing | Fit for Mint | Explicit non-fit |
|---|---|---|---|
| Copier | Versioned templates, persisted answers, clean-tree precondition, update from a known template version, and explicit inline or `.rej` conflicts. It warns against manually changing the answer record. [Official update documentation](https://copier.readthedocs.io/en/stable/updating/) | Record Mint input answers and template/source identity; generate an opt-in upgrade diff; preserve local edits; make conflicts explicit. | A minted repo must not remain runtime-governed by cav2. Copier migrations/tasks may execute arbitrary code and are disabled without explicit trust; that mechanism should not be copied wholesale. [Official security warning](https://copier.readthedocs.io/en/latest/configuring/#unsafe) |
| Backstage Software Templates | Guided inputs, review-before-run, per-step logs, cancellation, restart with prior parameters, and dry-run filesystem results. [Operator flow](https://backstage.io/docs/features/software-templates/), [dry-run and failure behavior](https://backstage.io/docs/features/software-templates/writing-templates/) | Useful UX precedent for novice review, step visibility, structured failure, and repeatable retry. | Do not introduce a hosted portal, repository publisher, credentials, or external actions merely to obtain this UX. |
| Terraform CLI | A saved plan can be applied as the reviewed action set; planning supports machine-readable output and locking. Saved plans can contain sensitive values. [Official plan contract](https://developer.hashicorp.com/terraform/cli/commands/plan) | Bind Mint apply to a plan digest, recheck target/source preconditions, lock the target, and treat plans as private artifacts. | Mint is not a continuously converging desired-state engine. No permanent cav2 state controller should govern the autonomous minted repository. |
| Open Policy Agent | Versioned policy bundles, schema validation, signature verification before activation, revision-bearing decision logs, and sensitive-field masking. [Bundle contract](https://www.openpolicyagent.org/docs/management-bundles), [decision logs](https://www.openpolicyagent.org/docs/management-decision-logs) | Pattern for named invariant IDs, input/result/revision receipts, fail-closed activation, and redacted observability. | Do not add centralized runtime policy distribution or make the minted repo depend on cav2 for decisions. Reuse Mint’s owned checks unless an owner separately selects an engine. |
| in-toto Attestation Framework | Separates subject binding, typed predicate, authentication envelope, and bundles. [Official specification](https://github.com/in-toto/attestation/blob/main/spec/README.md) | Good structural precedent for binding a mint act to input, plan, template, source, and output digests without conflating evidence with authority. | It does not decide who Mint’s ratifier is or authorize L2 integration. |
| Sigstore/Cosign | Verification can require artifact digest, signer identity, and identity issuer; attestations and local-key verification are supported. [Official verification documentation](https://docs.sigstore.dev/cosign/verifying/verify/) | Useful negative controls: tampered output, wrong identity, wrong issuer, or replayed subject must fail. | Public transparency logging and external OIDC are poor defaults for a private capability. Integration must remain owned by the existing attestation capability and its trust decision. |
| SLSA | Separates authenticated provenance from verifier-defined expectations. [Official terminology](https://slsa.dev/spec/v1.1/terminology) | Reinforces that a receipt is evidence checked against Mint expectations, not authority or success by itself. | Mint must not claim a SLSA build level or present itself as a certified build platform. |

### Candidate improvements

| ID | Class | Candidate | Cost | Reversibility | Exact owner route | Smallest acceptance test |
|---|---|---|---|---|---|---|
| MINT-OX-01 | Operator experience | Define one versioned, typed `MintInput` containing the full L0 and L1 interview fields. Provide guided prompts for novices and a machine-readable manifest for experts. | M | High | `invoke` refreshes the contract → `sigil-development` builds → `task-session` executes | Invalid or incomplete input blocks before target mutation; identical manifests produce identical plans. |
| MINT-HARD-02 | Hardening | Emit a Mint-wide plan covering L0, every L1 output, checks, blocks, source/template revisions, target snapshot, and expected ownership posture. | M | High | `sigil-development` → `task-session`; the scaffolder owner changes only if its existing output cannot be consumed | Snapshot target, run plan, prove zero byte changes and complete L0/L1 action coverage. |
| MINT-HARD-03 | Hardening | Bind apply to the reviewed plan digest and revalidate source, template, target, attach mode, and private/public posture immediately before mutation. | M | High | `sigil-development` → `task-session` | Change one template or target file after plan; apply must reject with `PLAN_STALE`. |
| MINT-HARD-04 | Hardening | Stage L1 in an isolated local workspace; validate there; then install the validated file set under a defined commit/backup boundary. Preserve a diagnostic receipt on failure. | M/L | Medium | `sigil-development` → `task-session` | Inject failure after the third emit: no unreported partial authority surface may be accepted; the receipt names staged files and safe next action. |
| MINT-OX-05 | Operator experience | Add run ID, per-step journal, deterministic exit codes, and explicit `resume`, `restart`, and `abandon` semantics. | M | High | `sigil-development` → `task-session`; standard sink coordinated with repository observability owner | Resume an interrupted run without duplicating or overwriting localized content; receipt records skipped, retried, and completed steps. |
| MINT-HARD-06 | Hardening | Define L1 conflict classes: unchanged generated, locally modified, missing, foreign-owned, and semantic authority conflict. Default to block; never auto-merge authority decisions. | M | High | `invoke` contract refresh → `sigil-development` implementation | Pre-edit a generated constitution and a ratify record; re-run must preserve both and emit separate typed conflicts. |
| MINT-OX-07 | Operator experience / dependency | Record template bundle version, source commit, normalized input answers, output manifest, and ownership markers. Add an opt-in `check-update` and `upgrade-plan`; never automatic upgrade. | L | Medium | Mint lifecycle owner; locally owned authority changes remain with the minted repo’s owners | Upgrade fixture from template v1 to v2: unchanged generated files update, local edits conflict, authority rows are never silently replaced. |
| MINT-HARD-08 | Hardening | Convert checks 1–13 into stable check IDs with structured input, result, evidence selector, and redaction policy. Keep their current local ownership; an external policy engine is not required. | M | High | `sigil-development` + `experiment-harness` | Each existing positive passes; leak, re-skin, dangling placeholder, absent method, and copied cav2-row controls fail with the intended single check ID. |
| MINT-DEP-09 | Dependency | Bind the L2 act to typed subject/output digests, ratifier identity policy, nonce or run ID, and verification expectations through the existing attestation capability. | M/L | Medium | `decision-gate` resolves ratifier/trust policy → attestation-capability owner builds/verifies → Mint integrates later | Valid act passes; tampered output, wrong actor, wrong subject, and replay fail. Body War remains a separate adjacent witness, not part of frozen N=3. |
| MINT-HARD-10 | Hardening | Add a target lock and treat plans, logs, domain interviews, and receipts as private-by-default with field-level redaction. | S | High | `sigil-development`; public/private changes remain `decision-gate` | Concurrent apply is rejected; a secret-marker fixture never appears in console or persisted receipt. |
| MINT-OX-11 | Documentation | Publish one novice runbook, one expert non-interactive example, an error/recovery catalogue, and a stage/status glossary distinguishing applied, blocked, ratified, attested, and experimentally survived. | S | High | `invoke` refresh → Mint lifecycle owner | A novice can identify the last completed stage and correct next owner from a supplied failed receipt without reading implementation files. |

### Priority and adoption sequence

1. Resolve the ratifier actor inconsistency through `decision-gate`; do not encode an identity policy while “cav2 owner” versus “domain owner” remains ambiguous.
2. Build MINT-OX-01, MINT-HARD-02, MINT-HARD-03, and MINT-HARD-10 first. These close the consent, exact-plan, drift, concurrency, and privacy gaps without changing Mint semantics.
3. Add MINT-HARD-04 through MINT-HARD-08 before claiming reliable re-runs or upgrades.
4. Keep MINT-DEP-09 blocked on the existing attestation owner and explicit trust decision.
5. Validate the operator contract with `experiment-harness`; keep the frozen N=3 autonomy criterion unchanged.
6. Route implementation as bounded `task-session` work only after the relevant authoring and owner decisions are refreshed.

The most valuable smallest experiment is one disposable private target exercised through four traces: successful full-plan/apply, stale-plan rejection, injected mid-L1 failure plus resume, and a locally edited upgrade conflict. That experiment tests operator recoverability without crossing the L2, public/private, promotion, or shipment boundaries.

## RECEIPT PAYLOAD

```json
{
  "status": "pass",
  "validation": "pass",
  "artifacts": [
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/dispatch-sheet.json",
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/strategy-inventory-packet.json",
    "cyberAlchemy-v2/development/mint/development/research/2026-08-06-mint-improvement-audit/orchestration/run-2026-08-06-mint-improvement-audit-01/actions/spawn-0003.json",
    "cyberAlchemy-v2/development/mint/SKILL.md",
    "cyberAlchemy-v2/development/mint/SPEC.md",
    "cyberAlchemy-v2/development/mint/EXECUTION-PACK.md",
    "cyberAlchemy-v2/development/mint/WORK-PACK.md",
    "cyberAlchemy-v2/development/mint/HANDOFF.md",
    "cyberAlchemy-v2/development/mint/development/HARNESS.md",
    "cyberAlchemy-v2/development/mint/templates/L0-compose-contract.md",
    "cyberAlchemy-v2/development/mint/templates/EMIT-PROCEDURE.md",
    "implementation/domainspec/.claude/skills/domainspec-new-repo/SKILL.md",
    "https://copier.readthedocs.io/en/stable/updating/",
    "https://copier.readthedocs.io/en/latest/configuring/",
    "https://backstage.io/docs/features/software-templates/",
    "https://backstage.io/docs/features/software-templates/writing-templates/",
    "https://developer.hashicorp.com/terraform/cli/commands/plan",
    "https://www.openpolicyagent.org/docs/management-bundles",
    "https://www.openpolicyagent.org/docs/management-decision-logs",
    "https://github.com/in-toto/attestation/blob/main/spec/README.md",
    "https://docs.sigstore.dev/cosign/verifying/verify/",
    "https://slsa.dev/spec/v1.1/terminology"
  ],
  "blockers": [],
  "started_at": "2026-08-06T13:03:00-03:00",
  "finished_at": "2026-08-06T13:15:18-03:00"
}
```
