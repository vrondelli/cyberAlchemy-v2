# F5 case-evidence gate candidate

## Bounded task and context

Task: prevent an aggregate caller-declared `pass` from becoming one
`passed` result per selected TDE case without case-level observation.
This is one F5 safety slice, not the complete non-synthetic TDE/provider
qualification. The owner-selected order remains: TDE derives cases and
witnesses, then AlchLang finalizes a separate executable request.

The lean context pack selects the accepted-finding plan and ledger, the
AlchLang post-TDE finalizer and its test, the EVF evidence join, and the
DomainSpec neutral-set, provider-outcome-v2, provider-binding-v2 and
EVF-join-v2 schemas. Their controlling facts are: the finalizer recomputes
case/witness fingerprints from selected bytes but does not replay TDE;
the EVF join currently fabricates `normalized_outcome: passed` for every
selected case from one aggregate `pass`; the v2 schemas describe a
caller-supplied receipt projection, not authenticated provider execution.

## Invariant and implementation path

The TDE prerequisite is a candidate-local R4 case projection with replay,
not a fabricated neutral set. Derive it only by replaying the exact current
R4 graph/semantic capsule/binding/fixture. Preserve the one-obligation-to-
five-cases relation, exact source refs, authored truth-table expectations,
fixture inputs, deterministic digests, and a pure-decision-only ceiling.
Replay recomputes from current source and rejects changed rows or refs.
Do not emit a `derived` neutral set until a current R4 FormalClaim v2,
executable-bounded capability assessment, and preservation-backed projection
have separate evidence. The R4 truth table is authored and exact-checked;
this is not general formula-driven derivation. AlchLang's finalizer must
accept multiple distinct cases per obligation while rejecting duplicate
case IDs. Independent review found this cardinality repair necessary and
reviewed the candidate-local replay boundary.

1. Preserve v1/v2 artifacts and schemas as historical construction evidence.
   Do not change their bytes in place or call them provider-native results.
   First retire the exported v2 execution-`pass` path: it must fail closed
   before emitting `PASS_BOUNDED` or `can_satisfy_obligation: true` from an
   aggregate pass and echoed projection. Keep theorem and typed non-pass
   routes unchanged. This safety gate is the current bounded unit.
2. In a successor unit, add a versioned case-evidence candidate route that
   requires one exact current artifact per finalized case. Bind each case ID,
   obligation ID, selected witness-input digest, claimed output, oracle
   evaluation, and artifact ref. Reject missing, extra, duplicate, stale, or
   mismatched cases. These are unverified claims until a runner-owned replay
   checks execution; set `case_evidence_verification: unverified`, retain
   residue, and make the result non-satisfying.
3. Keep aggregate causal outcome as a consistency check, never as a source
   of individual case outcomes. An exact echoed projection alone cannot
   assert provider authentication; that remains a separate native-runner
   gate. Only a runner-owned receipt with replayed case checks can upgrade to
   observed `PASS_BOUNDED`; exact JSON references alone cannot.
4. Make existing v2 synthetic-pass tests fail-closed compatibility controls;
   do not silently reinterpret them as observed execution. Keep theorem and
   non-pass routes intact. A non-satisfying successor requires a new causal
   join schema/version too, because the current causal-join schema mandates
   `causal_outcome: pass` to imply `PASS_BOUNDED` and true.
   The successor must version provider outcome, provider binding, EVF join,
   and causal join together; an old export cannot bypass the new route.
5. For the first safety unit, test that a complete synthetic v2 receipt,
   including all echoed case rows, cannot yield `PASS_BOUNDED`; run the
   non-pass and theorem controls. For the successor, add separating controls
   for one missing, extra, duplicate, changed
   witness input, changed observed output, changed oracle result, stale
   observation ref, and aggregate/pass disagreement. Run AlchLang focused
   tests, typecheck, and DomainSpec schema/contract validations relevant
   to any new version.

## Decision and gate

The reviewed recommendation is to fail-close the currently exported v2
execution-pass path now, while retaining v2 artifact/schema bytes for
history, then build a versioned successor with case observations and a new
causal-join contract. Exact successor schema and native-observation receipt
shape require separate plan review before that implementation. No provider,
credential, network, deployment, or release effect is authorized by this
slice.

E03 v2 exact-binds the old join and synthetic-pass test. E04 and E05 inherit
those bytes. After this safety change, those qualifications remain historical;
they do not establish current E03/E04/E05 closure. Requalify successor exact
bytes only after the non-satisfying route and native observation gate exist.

## Candidate-local R4 observation bridge (implemented)

The existing R4 verifier already owns the local standalone execution and
exact-current terminal-receipt replay. A separate TDE link now replays that
receipt and the authored R4 case projection, then requires an ordered 1:1
match on case ID, control class, normalized-input digest, authored Boolean
oracle, and observed Boolean. It binds the exact terminal receipt and
execution refs and returns a digest-bearing, candidate-local link. Replay
recomputes the entire link; it does not trust caller-held status. The
frozen `attempt-002` output set and hashed verifier are unchanged.

This proves only that five authored cases matched five locally replayed
standalone pure-decision observations. It does not produce a FormalClaim,
TDE neutral obligation set, EVF satisfying join, application equivalence,
side-effect evidence, or `runtime_guarantees_observed`. The general
provider-native successor in steps 2-4 remains open.

## Open Questions

- Which local provider runner will produce case-level observation artifacts
  with a verifiable execution binding? No current AlchLang EVF join does so.
- Which TDE-owned producer/replay verifier will materialize the neutral set
  from real current authored source instead of caller-supplied `derived` JSON?
