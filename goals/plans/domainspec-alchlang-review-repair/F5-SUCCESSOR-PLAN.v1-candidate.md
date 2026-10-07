# F5 versioned case-evidence successor — candidate plan

## Product frontier and scope

The current exported AlchLang EVF bridge rejects execution `pass` because
its v2 provider receipt merely echoes one aggregate outcome and one `passed`
row per selected TDE case. The next product frontier is an executable,
versioned case-evidence path that keeps the owner-selected order: TDE derives
the exact cases and witnesses, then AlchLang finalizes the execution request.
This plan is a construction candidate, not admitted execution state.

The smallest safe vertical has two distinct gates. First, accept and check
one exact *claimed* case artifact per finalized case, but remain
non-satisfying; this proves no execution fact. Second, a runner-owned replay must independently bind and
verify the execution of those cases before any satisfying EVF join is
possible. Exact JSON references and aggregate `pass` are not that replay.

## Context and controlling contracts

| Obligation | Selected source/selector | Consequence |
| --- | --- | --- |
| TDE-before-AlchLang ordering | `application-execution-request.ts` finalized case domain and witness-input fingerprints | Recompute the finalized request from selected TDE bytes; never compile a new case set by re-lowering AlchLang. |
| Current false-pass guard | `application-evf-evidence.ts` execution-pass rejection | Keep v1/v2 bytes and their fail-closed behavior; add a separate successor path. |
| Aggregate cannot create case results | `evf-provider-outcome.v2.schema.json` `causal_outcome: pass` and `case_results[].normalized_outcome: passed` | Every case outcome must come from a distinct case artifact, not an aggregate projection. |
| Coordinated join semantics | `evf-causal-join.schema.json` conditional `pass => PASS_BOUNDED/true/no residue` | Version causal join with the provider outcome, binding and EVF join. |
| Local execution precedent | TDE `r4-case-observation-link.ts` and current R4 receipt replay | Reuse the separation of authored cases, runner observation, and exact replay. R4 remains candidate-local, not a general neutral set. |

## Dependency DAG and implementation analysis

1. **TDE producer and replay**: select a current FormalClaim-v2-capable
   executable slice; derive a neutral obligation set with exact case IDs,
   witness inputs, oracles, and source/projection/assessment refs. Replay from
   current authored source, not caller-supplied `derivation_status: derived`.
   R4's current five-row authored projection is not this producer until its
   semantic/acceptance decision and preservation proof are resolved.
2. **Post-TDE finalization**: retain the existing AlchLang finalizer's 1:N
   obligation-to-case cardinality and exact case/witness fingerprints. Its
   output is a request, not evidence that any case ran.
3. **Non-satisfying case-evidence v3**: add an input/v2,
   case-claim-artifact/v1 and provider-outcome/v3 candidate with one exact
   artifact ref per selected case, obligation
   ID, case ID, witness-input digest, claimed native output, claimed normalized
   outcome, claimed oracle evaluation, and aggregate consistency fields.
   Define the per-case digest as SHA-256 of the same canonical JSON witness
   row that contributes to the finalizer's whole-set fingerprint; recompute
   from the selected set rather than trusting a caller digest. Require exact
   cardinality, sorted canonical order, identity and unique artifact paths;
   reject missing, extra, duplicate, stale, mismatched, or contradictory
   rows. Validate artifact bytes and projection structure, but mark
   `case_evidence_verification: unverified` and preserve residue. The free-
   text `expected_relation_or_oracle` is not an executable oracle, so this
   stage can check only an exact claimed evaluation, never its truth. Fork
   from the old `outcomeMap.pass` before it maps to `PASS_BOUNDED`. A new
   provider-evidence-binding/v3, EVF-evidence-join/v3, causal-join/v2, and
   trace/v2 must encode
   `join_status: BLOCKED` and `can_satisfy_obligation: false` even when the
   caller reports `pass`. Do not label claimed execution as observed
   `completed`/`passed`/`current` facts. The old v1/v2 route remains fail-
   closed and cannot alias to v3.
4. **Runner-owned verification v4**: retain the existing R4 candidate-local
   observation-and-replay slice as a bounded precedent over five exact pinned
   pure-Boolean cases. Extend that pattern to a selected provider-native
   case set with per-case output and bounded-process metadata; its EVF read
   model remains `BLOCKED`. This is a runnable observation precursor, not a
   TDE-neutral obligation set or an executable FormalClaim proof. Then define
   a general local runner contract with
   source/runtime/environment identity, exact finalized request, per-case
   invocation and observed native output, a TDE-owned executable oracle or
   evaluator binding, bounded execution metadata,
   timeout/error handling, digest/ref set, and a replay verifier that
   re-executes or independently checks each selected case. No caller field
   can upgrade `unverified` to observed. Only this verified receipt may
   support a satisfying EVF result, and only within the selected claim and
   provider's native semantics. Provider authentication and runtime
   guarantees require their own evidence; local replay alone is not
   application equivalence. The existing L2 `runBoundedProcess` is only a
   precedent for process capture: its network namespace values are supplied
   labels rather than an isolation proof, and it does not enforce the
   finalized request's memory ceiling. It cannot by itself satisfy v4.
5. **Qualification**: test every link and then requalify E03/E04/E05 against
   exact successor bytes. Historical v2 qualifications stay historical.

## Candidate contract-registration unit

After the isolated v3 builder and seven schemas pass their focused checks,
register only the two DomainSpec formalization v3 schemas as construction
candidates. Preserve the already-dirty registry, manifest, fixture matrix
and validator edits unrelated to F5. The coherent four-file unit is:

1. Add `ProviderEvidenceBinding/v3-candidate` as an unverified case-claim
   preflight at DSF-S5, non-canonical, owned/produced by the EVF/AlchLang
   bridge—not by a selected provider. Add `EvfEvidenceJoin/v3-candidate` as
   an EVF `BLOCKED` read model at S7, non-canonical. Do not use an
   `evidences` or `supersedes-candidate` relation to v2's pass-only path.
2. Add the two exact schema artifacts to `formalization-package.json`,
   following the package's candidate inventory shape.
3. Add positive fixture cases showing the v3 binding and join remain
   `unverified`/`BLOCKED`, plus negative mutations attempting observed
   execution or `PASS_BOUNDED` promotion.
4. Extend the validator's exact contract-ID and fixture denominators for
   those two candidates, then run package validation and inspect only
   relevant check IDs for regression. The current package validator is
   already blocked by DSF-V008 and DSF-V053 for unrelated missing legacy
   sources/stale authority refs; these are not repaired by F5 and must not
   be disguised as a passing package verdict.

The registration review confirmed DSF-S6 means actual provider execution
and cannot be claimed by v3. This four-file unit records the constructed
artifact shapes, not provider completion, FormalClaim admission, or a
satisfying EVF result.

## Separating controls and done criteria

- v3 schema/producer/validator reject: one missing, extra, duplicate or
  reordered case; changed obligation ID or witness-input digest; an envelope
  output/oracle claim that differs from its referenced artifact; stale or
  missing artifact bytes/ref; aggregate disagreement; and incomplete
  comparability. A self-consistent but false output/oracle claim may remain
  structurally accepted and must still be `BLOCKED`, never satisfying. A
  complete synthetic v3 `pass` remains
  `BLOCKED`, non-satisfying, and carries explicit unverified-case residue.
  Theorem and typed non-pass paths do not regress.
- v4 replay rejects: a fabricated provider receipt, swapped case outputs,
  stale runtime/source/environment, incomplete execution, timeout, malformed
  output, missing/extra case, and a caller-edited receipt with recomputed
  digest. No `PASS_BOUNDED` without all replayed observations and the exact
  finalized request.
- A satisfying v4 route additionally requires current TDE-owned neutral-set
  derivation and replay, an executable oracle independent of caller-reported
  output, enforced network and memory policy (or an explicitly narrower
  claim), accepted FormalClaim/projection/preservation semantics, and an
  exact provider-native result mapping. A pinned local observation precursor
  lacking any of these remains `BLOCKED` even when every observed case matches.
- Run AlchLang focused and full relevant suites, typecheck, DomainSpec schema
  validation and TDE producer/replay tests; record failing unrelated
  baseline tests separately. Check current E03/E04/E05 coverage rather than
  relabeling old exact-byte receipts.

## Decisions, gates, and residue

Independent implementation-analysis review accepted the isolated v3
construction path only with the explicit `BLOCKED` ceiling. It rejected an
earlier expectation that v3 could detect a self-consistent false output or
oracle claim; the separating control now requires such a claim to remain
non-satisfying. The review also required coordinated input/trace versions,
the per-case digest definition, and no observed provider-state labels in
the v3 binding. This is plan review, not qualification or admission.

The owner has selected finalization *after* TDE derivation. This is not a
choice to make the AlchLang compiler depend on TDE outputs during lowering.
The present finalizer checks exact artifact structure and digests but does
not itself authenticate a TDE producer or establish FormalClaim semantics;
synthetic test sets cannot close that gap.
The exact general producer cannot be promoted from R4 until R4's meaning is
selected and a current accepted FormalClaim/preservation binding exists.
That semantic decision is recorded separately in
`F5-R4-SEMANTIC-DECISION.v1-candidate.md` and remains open. Candidate v3
design and fail-closed implementation can progress independently; v4
satisfying behavior cannot be claimed from synthetic artifacts.

Operational work: a provider-native runner, environment, credentials if any,
and E03/E04/E05 requalification have separate owners and affected stages.
No deployment, network provider call, release, or authority effect is in
this plan's scope. Deferred residue must remain visible rather than being
treated as a blocker for local non-satisfying construction.

Current product frontier: generalize the existing candidate-local R4
observation/replay precedent to one provider-native case set while retaining
an explicit `BLOCKED` read model. Runnable product work: select and execute
the pinned set, verify per-case observations, and test tampering, timeouts,
incomplete output and changed selected bytes. Operational support:
select and provision an actually isolated provider environment before a
general satisfying route; this affects v4 satisfaction, not the local
observation precursor. Deferred operational residue: credentials, deployment,
release and current E03/E04/E05 qualification after the successor bytes stop
changing. The causal blocker for satisfaction is the missing accepted
FormalClaim/TDE producer/oracle chain, not lack of a synthetic pass fixture.

## Open Questions

- Which current FormalClaim-v2 source and TDE-owned producer will anchor the
  first general executable slice if R4's meaning remains deferred?
- Which local provider runner and native protocol will produce independently
  replayable case observations for the first satisfying successor?
- What exact v3/v4 schema fields and result vocabulary survive plan review?
