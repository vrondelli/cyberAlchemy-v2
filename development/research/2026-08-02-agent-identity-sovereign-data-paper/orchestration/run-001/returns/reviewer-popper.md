## Non-vacuity verdict

`FAIL_NON_VACUITY_GATE_WITH_REPAIRABLE_DESIGN`.

The architecture survives only as a falsifiable design hypothesis. The draft correctly labels all witnesses unexecuted, but its current suite does not instantiate wrong-agent/key, leakage, automatic-promotion, or a concrete human owner decision. Therefore:

- `SURVIVE`: the typed composition and denial semantics as a witness design.
- `KILL`: any claim that the controls have enforced sovereignty, prevented leakage, or changed a live decision. Zero controls were executed.
- Do not KILL the whole design as vacuous yet: the proposed controls have distinct expected decisions. KILL it if execution makes any negative control observationally equivalent to the positive path.

## Smallest concrete hand-built witness

Use one synthetic fixture, cloned before each negative mutation:

1. Store `SD1={"subject":"synthetic-A","birth_date":"2000-01-01"}` only in a human-controlled local store. Bind opaque reference `SR1`, digest `H(SD1)`, and deletion handle `DEL1`.
2. Authenticate `agent:age-checker:test` with key fingerprint `K-A`, runtime digest `R1`, audience `rp.test`, and a fixed validity interval.
3. Issue one-use grant `G1`, revocable through `REV1`, binding that agent/key, `SR1`, action `derive:age-over-threshold`, purpose `age-eligibility`, audience `rp.test`, and fixed evaluation date `2026-08-03`. Permit only `{age_over_18:boolean}`. Explicitly prohibit raw export, enrichment, training, retention, onward disclosure, and delegation.
4. Submit request `Q1`, binding `G1`, identity, source digest, purpose, audience, code digest, policy version, output schema, and limits: one source read, zero network, zero persistent writes.
5. An independent evaluator performs current identity/key, grant, purpose, audience, source, expiry, one-use, and online revocation checks. Expected decision: `PERMIT`.
6. The bounded computation returns only `{"age_over_18":true}`. Expected observations: source-read count `1`; raw-date egress `0`; network writes `0`; persistent writes `0`.
7. Evaluator and runtime sign a provenance receipt binding identity, grant, policy, source/code/output digests, decision, read/disclosure counts, and retention result.
8. CAV2 receives only the boolean claim and receipts as `candidate-local`, `authority_effect:none`; neither CAV2 nor the relying party receives the birth date.
9. A named human owner signs `OwnerDecision{disposition:"retain_candidate_for_challenge"}`. No promotion occurs.

Expected positive terminal state:

`AUTHN_OK → AUTHZ_PERMIT → READ_1 → CLAIM_TRUE → RECEIPT_VALID → CANDIDATE_ONLY → HUMAN_RETAIN`

## Negative controls

| Control | Single mutation | Required terminal state | Immediate KILL fact |
|---|---|---|---|
| Revoked authorization | Mark `G1` revoked before step 5 | `AUTHZ_DENY(grant_revoked)`, read `0`, no claim/candidate | Revoked grant reaches read, output, or candidate |
| Wrong agent | Substitute another authenticated agent while retaining `G1` | `AUTHZ_DENY(grantee_mismatch)`, read `0` | A different principal uses `G1` |
| Wrong key | Claim the expected agent ID but sign with `K-B` | `AUTHN_FAIL(key_mismatch)`, read `0` | Identifier equality bypasses key proof |
| Unauthorized purpose | Change purpose to `training` | `AUTHZ_DENY(purpose_mismatch)`, read `0` | Consent or identity becomes ambient permission |
| Deleted source | Tombstone `SR1` before reuse | `DENY(source_deleted)`, no claim; prior dependent candidate becomes blocked for owner review | Deleted data is read, or its old candidate remains promotion-eligible |
| Inference leakage | Mutated computation attempts `birth_year:2000` | Output-schema violation; output quarantined; no candidate | Extra inference reaches relying party or CAV2 |
| Retention leakage | Mutated computation attempts a cache write or outbound copy | Runtime abort; retention-violation receipt; no candidate | Side effect succeeds or is unobservable |
| Automatic promotion | Service actor promotes the positive candidate without signed owner decision | `DENY(owner_decision_absent)`; candidate remains non-authoritative | Candidate/confidence/receipt changes authority automatically |

The leakage controls demonstrate detection only for the injected observable attempts. They do not prove absence of hidden processing or undiscovered copies.

## Falsifiers

The candidate fails the non-vacuity gate if:

- any negative reaches the positive terminal state;
- a denial occurs only after a source read or disclosure;
- the positive path cannot prove exact source-read and egress counts;
- identity, grant, source, policy, code, output, and decision are not cryptographically bound together;
- CAV2 or the relying party receives the birth date;
- the owner decision is absent, agent-generated, or not attributable to the admitted human owner;
- no independent observer can detect the injected output/retention leak;
- automatic promotion changes authority.

## Dispositions and exact repairs

- `WIT-P1`: `SURVIVE_WITH_REPAIR`; add immutable fixture values, fixed evaluation time, observation points, signed receipt fields, and the human owner disposition.
- `WIT-N1`: `SURVIVE_SUPPLEMENTAL`; useful, but not a substitute for the required wrong-agent/key controls.
- `WIT-N2`: `KILL_AND_SPLIT`; “wrong purpose or audience” collapses independent failure modes. Add separate purpose, audience, wrong-agent, and wrong-key cases.
- `WIT-R1`: `SURVIVE_WITH_REPAIR`; require online revocation observation and prove zero reads.
- `WIT-R2`: `SURVIVE_SUPPLEMENTAL`; explicitly define cancellation, quarantine, and dependent-candidate states.
- `WIT-N3`: `KILL_AND_SPLIT`; source mismatch, deletion, and unlearning failure are not one control. Give each a distinct expected state.
- Add explicit inference-output, retention-side-effect, and automatic-promotion controls.
- Add observable state fields: authentication result, authorization reason, read count, output/disclosure count, side effects, receipt verification, candidate state, authority state, and owner-decision identity.
- Preserve the draft’s `UNVERIFIED, not executed` ceiling until the complete matrix is run and receipts are retained.

`action_id=spawn-0006`  
`role_id=reviewer-popper`  
`status=complete`  
`validation=FAIL_NON_VACUITY_GATE_WITH_REPAIRABLE_DESIGN — differential outcomes are specifiable, but no control has been executed and the current suite omits required identity, leakage, promotion, and owner-decision observations`  
`blockers=no executable evaluator/runtime; no canonical schemas; no independent leakage observer; no executed receipts; no human owner decision`  
`artifact_inputs=dispatch-sheet.json#groups[2].agents[1] sha256:b97cca7d120e58b1f2b8add6bd4aae61b259d31d93e5c79bef70081388390a52; SYNTHESIS-DRAFT.md sha256:a4c19b4ecd7141cffda7fe574896bba751018ce4c0d36fc88ae093e03e58bc82; explorer returns not opened`
