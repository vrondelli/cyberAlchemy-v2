# Mint improvement audit — synthesis candidate package

Status: read-only, non-authoritative candidate synthesis. This establishes no implementation, approval, authority, promotion, publication, deployment, release, shipment, or production readiness.

## Evidence identity

- Exact explorer-return corpus: SHA-256 `78b45e397b0e7877b54438987a8d261406a68a2f10d2a00514f0957f21c6b977`, `research.md`.
- Current-state receipt: SHA-256 `ab9a24ce79d1c7bb46edcb2362d477adc779247cf416cf1a357fe603516e6451`.
- Evidence/security receipt: SHA-256 `dbed62737519bd0d390108107204fa3a154b705f1d541fe405a0dca50be1b95c`.
- Precedent/operator receipt: SHA-256 `fa2990eefaabda6b9a445b0015b88bd780e9f6a796d8aff1728157cf7e3b6402`.
- Repository baseline used by explorers 1 and 3: `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`.
- DomainSpec source identity used by explorers 2 and 3: `4e8834ddf54baa28f8de91abcf86f9a367f63948`.

`observed` means source bytes or reports were inspected. `executed` means an explorer ran a bounded read-only check. `unverified` means proposed behavior or an unexecuted risk.

## Plain-language conclusion

Mint has a substantial private design corpus, 21 templates, two historical scratch smoke reports, and a frozen N=3 artifact experiment whose corrected content-autonomy criterion survived. It does not currently have a callable, mechanically repeatable, recoverable Mint runtime in this checkout.

The urgent gaps are missing execution and contradictory truth surfaces:

- Source, installed skill, README, plans, work-pack, harness, and experiment prose disagree.
- The L0 scaffolder has a contract in another DomainSpec source identity but is unavailable through Mint's named path and current `PATH`.
- Authority-triage classifies/routes; it does not emit authority files.
- Checks 1–13 are prose obligations rather than executable validators.
- There is no Mint-wide immutable plan, atomic apply, rollback/resume contract, structured receipt, or current expanded fixture.
- Attestation L1 exists, but Mint has not integrated it. L1 is an unkeyed integrity seal, not authenticated identity, freshness, or replay protection.
- Public-attached Mint and external actor signing remain separate owner decisions.

## Exact as-built baseline

| Surface | State | Evidence and proof |
|---|---|---|
| Mint entry/runtime | Agent instruction package plus Markdown templates; zero executable files. | Installed blob `9d6b2609…`; emit blob `ba3ce845…:27–34`; Explorer 1 `CS-11, CS-14`; executed scan/observed. |
| L0 | Contract requires `domainspec-new-repo plan/apply`; named checkout path and command are unavailable, although a separate DomainSpec source contract exists. | `L0-compose-contract.md:19–61`; DomainSpec blob `aee9bf95…:42–50,105–135`; `CS-12, CS-18`, `E-NEG-07`; executed/observed. |
| L1 triage | Source-only triage returns classification/owner route and performs no authority mutation. | Triage blob `5658e76b…:62–73,102–110,125–133`; `CS-13, CS-20`; observed/executed existence. |
| L1 emission | Mint owns prose instantiation over 21 templates; historical scratch outputs are absent. | Emit blob `ba3ce845…:75–225`; two 2026-07-01 reports; `CS-07, CS-14`; observed, replay unverified. |
| Validation | Checks 1–13 are prose/grep; no executable validator. No-leak grep missed `route to cav2 for promotion`. | Emit blob `ba3ce845…:59–71,246–297`; `CS-15, CS-23`; scan and negative executed. |
| Fixture | `release-approval` is older/core-only, lacks later surfaces, and retains four `PROPOSED` values. | Example tree plus checks 6–13; `CS-22`; executed comparison. |
| Attestation | L1 returned valid then tampered for a content mutation; Mint has no manifest/invocation/sidecar/transaction binding. | Attest blob `772157b9…:19–52`; `CS-16, CS-27`, `E-POS-04, E-NEG-01`; primitive executed, integration absent. |
| Attestation ceiling | Unkeyed, unchecked actor, replay/recompute possible; malformed `{}` raised `KeyError`. | Same blob; `E-NEG-02–05`; malformed and mutation tests executed/algorithm observed. |
| Frozen experiment | Original kind-level N=3 was falsified on research Obs-A; corrected content criterion survived reused N=3 artifacts with no re-mint. | Criterion/findings hashes `36a6dd…`, `dc2950…`, `5c2ce5…`, `e116ff…`; `CS-08`, `E-POS-01–03`; observed. |
| Body War | Adjacent attestation-pattern witness candidate only; no execution and not a fourth Mint spine. | Handoff hash `eaf4ad…:47–54`; `E-POS-07`, `BW-ATT-01`; observed/unverified. |
| Privacy/public | Private MVP is an owner decision; public-attached Mint blocked; no executable visibility/leakage gate. | Decision hash `4cbade…:41–55`; `E-POS-06, E-NEG-09`; observed. |
| Recovery/observability | Future/unwired; no run journal, partial receipt, rollback/resume, lock, or scrub evidence. | Installed harness `:22–30`; `CS-17, CS-25, CS-30–35`, `E-NEG-11`; absence observed. |

## Drift matrix

| Surface | Drift verdict |
|---|---|
| Source `SKILL.md` blob `45268f…` | Older authoring source; canonical status undeclared. |
| Installed `SKILL.md` blob `9d6b26…` | Newer but unsynchronized; SHA `d2e29d…` versus source `31ce21…`, 116 insertions/70 deletions; no generation binding. |
| Installed README | Conflicts with installed skill about whether additions are built. |
| SPEC/execution/layering | Says committed-not-built; stale relative to installed skill/work-pack and not runtime proof. |
| Work-pack | Says selected emit logic built but unexecuted; still planning status. |
| Harnesses | Stale versus smoke reports/frozen experiments and disagree on fixture classification. |
| Inventory | Discovery/read model only; confirmed drift lead remains non-authoritative. |

## Preserved disagreements

1. L0 source contract exists in another source identity, but Mint's declared invocation is unavailable in this checkout. Contract existence is not callable availability.
2. Mint prose says attestation-blocked, but L1 exists. Mint is integration-blocked for L1 integrity; external actor authentication is a separate attestation-L2 decision.
3. Installed harness calls resonantos golden; source harness treats it as an Obs-B negative. Preserve the source classification until an owner changes it.
4. Missing runtime/recovery, security controls, and operator consent/resume are one sequencing constraint: convenience UX cannot precede an exact, transactional apply path.
5. External tools supply narrower patterns, not an exact Mint authority precedent; external links are contextual, not load-bearing proof.

## Ranked candidates

These are recommendations for owner review, not approval.

| Rank / ID / class | Candidate | Impact, cost, risk, reversibility | Owner/prerequisite | Finite acceptance |
|---|---|---|---|---|
| 1 C01 fix | Choose canonical Mint source; regenerate/synchronize installed skill, README, harness, plans, status with revision/hashes. | Critical, M, M, High | Mint lifecycle/`sigil-development`; explicit adopt-back choice. | Projection passes; one byte drift fails; frozen experiment unchanged. |
| 2 C02 dependency | Restore/owner-route exact `domainspec-new-repo`; do not duplicate scaffolder in Mint. | Critical, M, M, High | Scaffolder + Mint integration owners; callable interface decision. | Unavailable dependency yields typed pre-write block; admitted dependency returns versioned plan. |
| 3 C03 fix | Executable preflight/plan/apply with staging, plan binding, validators, no-overwrite, receipt, resume/abandon, atomic boundary. | Critical, L, H, Medium | Mint `sigil-development`; C02/C04–C06. | Clean success, stale-plan reject, injected failure/recovery, replay without overwrite. |
| 4 C04 fix | Separate triage evidence from Mint-owned emission. | High, S/M, M, High | Mint + triage owners; stable return schema. | Unknown/failed triage leaves target unchanged; Mint emits only after admissible result. |
| 5 C05 fix | Executable checks 1–13 with stable IDs and positive/negative fixtures. | Critical, M, M, High | Mint + experiment harness; C06. | Expanded positive passes; leak paraphrase, copied row, malformed table, dangling reference, missing method, unresolved defer, partial apply fail correctly. |
| 6 C06 fix | Resolve `PROPOSED` defer contradiction. | High, S, H, High | Mint contract owner/`invoke`; owner choice. | One deferred fixture has one consistent result across skill/template/validator/docs. |
| 7 C07 fix | Total attestation schema/error handling and canonical-equivalence claim correction. | High, S/M, Low, High | Attestation owner. | Malformed cases return typed result; whitespace behavior matches docs; semantic mutation tampered. |
| 8 C08 hardening | Canonical target/path/symlink/overlap/slug/lock/attach privacy/redaction controls. | Critical, M/L, M, High | Mint + scaffolder; public decisions remain decision-gated. | Valid private sibling passes; forbidden paths/symlinks/concurrency block; synthetic canary never leaks. |
| 9 C09 dependency | Integrate L1 via deterministic multi-file manifest and sidecar/storage/transaction contract. | High, M/L, H, Medium | Mint + attestation; decide subject/repo/sidecar/producer/ratifier. | Valid passes; modify/add/delete/rename/symlink/wrong repo/version fail; failed attest cannot close. |
| 10 C10 operator experience | Typed `MintInput` plus full private no-write L0/L1 preview. | High, M, Low, High | `invoke` then Mint; stable C02/C04 inputs. | Incomplete blocks; same manifest gives same plan; all prospective bytes accounted. |
| 11 C11 operator experience | Run ID, journal, error catalogue, resume/restart/abandon, novice/expert docs, redacted receipt. | High, M, Low/M, High | Mint + observability; C03 state machine. | Failed-receipt user finds stage, safe action, owner; replay preserves local bytes. |
| 12 C12 hardening | Template bundle/version, provenance, ownership markers, opt-in update check/plan; no automatic authority migration. | High, L, H, Medium | Mint lifecycle; minted repo retains authority. | v1→v2 updates unchanged generated bytes, reports local/foreign conflicts, never overwrites decisions. |
| 13 C13 experiment | Persist expanded fixture/regeneration and run prospective current-byte experiment without changing frozen N=3. | High, M, Low, High | Mint + experiment harness; C03/C05. | Success/stale/failure/upgrade plus hollow restamp, runtime leak, hidden symlink, D49 negatives. |
| 14 C14 experiment | Separate Body War valid/tampered attestation witness. | Medium, S/M, Low, High | Body War + attestation experiment owners. | Predeclared state valid and meaningful mutation fails; filed only as attestation evidence. |
| 15 C15 deferred/non-goal | Decide authenticated identity/trust/custody/rotation/revocation/replay before L2; do not infer from L1. | High potential, unknown/L, H, Low after adoption | `decision-gate` + attestation owner. | Decision binds identity, errors, distribution, rotation, revocation, secret handling before keys. |
| 16 C16 deferred/non-goal | Keep public Mint blocked; reject hosted portal, centralized runtime policy, arbitrary tasks, public OIDC/transparency, or permanent cav2 controller as convenience imports. | Boundary protection | Boundaries/decision-gate. | Boundary-crossing proposals block and route to owner; private tests claim no public portability. |

Load-bearing evidence for C01–C16 is the exact `CS-*`, `E-POS-*`, `E-NEG-*`, `MINT-*`, `ATT-*`, and `BW-*` rows in `research.md`; the synthesizer return bound them respectively to source blob `45268f…`, installed blob `9d6b26…`, emit blob `ba3ce8…`, triage blob `5658e7…`, attestation blob `772157…`, DomainSpec blob `aee9bf…`, decision hash `4cbade…`, criterion hash `5c2ce5…`, and handoff hash `eaf4ad…`.

## Operator and failure sequence

Normal candidate path:

1. Typed intake: completion is not authority admission.
2. Preflight: dependency/version, canonical path, privacy, lock, target/source, triage and attestation regime; block before writes.
3. Private no-write plan: L0+L1 diff/manifest with exact revisions, owners, checks and hashes.
4. Separate scaffold-consent and semantic-ratification review gates.
5. Apply only reviewed digest into isolated staging; drift rejects.
6. Execute checks 1–13 against staging.
7. Build deterministic manifest, run L1, then atomically install; L1 means integrity only.
8. Return redacted receipt with stages/digests/checks/recovery/attestation/blocks/residue/next owner.

Failure boundaries:

- Missing L0/triage/attestation dependency: typed preflight block, zero target writes, exact owner route.
- Unsafe path/privacy: reject root/current/source/`.git`/overlap/symlink/public-unknown before approval.
- Target/template/source drift: `PLAN_STALE`, no silent re-plan.
- Partial L1: restore pre-state or preserve typed resumable staging with touched hashes; no decision over failed checks.
- Defer/conflict: preserve local bytes and route typed owner conflict under one chosen defer rule.
- Malformed/tampered attestation: typed non-valid/error, no traceback, no commit.
- Upgrade conflict: update only unchanged generated bytes; never auto-merge authority decisions.

## Threat and evidence-gap map

| Threat/gap | Candidate witness/control |
|---|---|
| Path traversal/symlink/overlap | Canonical binding and explicit forbidden-target negatives. |
| Unsafe attach/private leakage | Visibility gate, pinned portable submodule, allowlisted copy, synthetic canary, symlink rejection. |
| Template input injection | Typed slug/display, escaping, reserved/newline/pipe/traversal fixtures. |
| Authority overwrite | No-overwrite, ownership classes, exact hashes/set, backup/atomic restore. |
| Partial failure | Plan/run identity, staging, checkpoints, rollback/resume/abandon, touched hashes. |
| Semantic runtime leak | Graph/path/ownership validation plus paraphrase negatives. |
| Multi-file substitution | Versioned relative-path/type/digest/repo/source manifest. |
| Forgery/replay | State L1 ceiling; repo/run/sequence where needed; defer authentication to L2. |
| Key/identity | No key implementation before trust/custody/rotation/revocation/distribution decision. |
| Observability leak | Private receipt with identifiers/digests/verdicts only; no content, secrets, mechanisms, keys. |
| Current generation | Persist expanded output or deterministic fresh regeneration. |
| Frozen criterion | Preserve N=3 exactly; any generator test uses a new prospective criterion. |
| Validator discrimination | Positive expanded fixture plus single-fault negative per check. |
| Apply recovery | Four traces: success, stale plan, partial failure/resume, upgrade conflict. |
| Mint attestation | Multi-file modify/add/delete/rename/symlink negatives. |
| Body War | Separate owner-approved valid/meaningful-tamper witness only. |
| Public Mint | Remains decision-blocked; private canaries cannot resolve public policy. |

## Migration, observability, and adopt-back

- Installed content is newer but not authoritative by proximity/recency; owners must choose adopt-back before generation.
- Treat `release-approval` as an older fixture version; create an upgrade plan rather than silently rewriting it.
- Template updates require versions, normalized answers, source/output manifests, ownership markers, opt-in plan, no automatic authority replacement.
- Attestation canonicalization/manifest versions are explicit; unsupported versions return typed non-valid/error. L1 sidecars cannot retroactively establish identity.
- Receipts may include attempt and digest metadata, stages/checks/recovery/scrub status, but exclude content, mechanisms, secrets, and keys.
- Passing experiments may justify a source-change proposal; outputs do not mutate canonical Mint, installed projections, frozen criteria, Inventory, or decisions.

## Candidate 30/60/90 sequence

- 0–30 days: owner decisions for C01/C02/C06; C07 repair; specify C08/C10/C11 schemas without target mutation.
- 31–60 days: if admitted, bounded implementation of C03/C04/C05/C08/C11 and persisted fixtures under `sigil-development` then `task-session`.
- 61–90 days: if prior acceptance passes, C09 L1 integration, C13 prospective experiment, C12 upgrade-plan evaluation, optional C14 Body War witness. Keep C15/C16 deferred.

## Proof ceilings

- Mint remains private, intended-not-shipped, and non-callable as a mechanically fixed runtime in this checkout.
- Historical scratch reports do not prove current replayability.
- Frozen N=3 remains research/process/product: original criterion falsified; corrected content criterion survived; neither proves current Mint execution.
- Body War is not a fourth Mint spine.
- Attestation L1 is a narrow available primitive; Mint integration is absent; L1 does not authenticate actor/time, resist recomputation, or prevent replay.
- Public Mint and authenticated signing remain owner decisions.
- Inventory, explorer returns, and synthesis are non-authoritative evidence/projections.
- Candidate acceptance would establish only its bounded evidence, never promotion, publication, deployment, release, shipment, or production readiness.
