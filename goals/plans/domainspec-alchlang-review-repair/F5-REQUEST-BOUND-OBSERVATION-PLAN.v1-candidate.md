# F5 request-bound native observation — construction plan

Date: 2026-10-03. Status: candidate implementation unit, not F5 qualification.

## Product frontier

Join the existing post-TDE finalized execution request to actual local native
case observations. The current AlchLang case bridge checks exact reported
claims but never runs a provider; the TDE local-native runner runs exact cases
but does not know the finalized request. A detached policy runner would leave
that decisive join untouched, so this unit binds the case observations to the
finalized request first.

## Dependency DAG

1. **Select current request bytes.** Resolve the exact finalized-request ref
   and all selected source bytes. Re-run `finalizeApplicationExecutionRequest`
   from its base, obligation, projection and preservation refs; require the
   entire selected request to equal that result. Recheck mutable source bytes
   before and after execution.
2. **Derive native case inputs.** Read the selected TDE obligation set, derive
   sorted case IDs and witness digests independently of caller labels, and
   construct one canonical JSON stdin row per case containing obligation ID,
   case ID and normalized inputs. Record each input digest. An exact selected
   adapter describes this local stdin protocol; it does not certify provider
   equivalence.
3. **Observe and replay.** Run an exact selected local executable with one
   staged adapter file, request-bounded timeout/output capture, process-group
   termination and private temporary cleanup. Record each native output or
   incomplete execution. Replay reselects and re-executes, rejecting stale
   inputs, changed executable/adapter bytes and forged receipts even if their
   digest was recomputed. The opt-in diagnostic also rejects requests beyond
   its own local caps: 30-second per-case timeout, 1 MiB output, 256 cases,
   or a 1 MiB adapter. It kills same-group descendants even when the direct
   child exits successfully.
4. **Keep the claim ceiling.** This is opt-in local observation, not compiler
   lowering, TDE derivation replay, provider authentication, oracle checking,
   policy satisfaction or an automatic EVF join. The request's network and
   physical-memory guarantees remain unverified. Record `evf_join: forbidden`,
   `can_satisfy_obligation: false` and explicit F5 residue on every result.
5. **Validate.** Use a clearly synthetic two-case finalized-request fixture;
   test exact request/case/witness/input binding, source-buffer mutation,
   forged replay, nonzero/timeout/output limits, nondeterminism and no result
   promotion. Run focused tests and typecheck, then record any broad-suite
   failures separately.

## Decision and review

The owner selected request finalization *after* TDE case derivation. This
runner consumes that finalized artifact; AlchLang lowering does not rerun.
Independent plan review rejected a detached general policy runner as too
indirect and accepted this request-bound unit with the explicit limitations
above. Runtime and adapter bytes remain separate from the DomainSpec provider
runtime binding: matching a selected local program is not proof that the
declared provider executed. The synthetic fixture proves structural binding
only. R4's accepted meaning remains a separate owner decision.

## D65 lanes

- Current product frontier: exact finalized-request to local native case
  observation and replay, non-satisfying.
- Runnable product work: implement the bounded module and separating tests;
  review code and replay behavior against the current sources.
- Operational support: an independently isolated provider environment and
  provenance path are required before a satisfying F5 successor; this affects
  later v4 qualification, not this local observation unit.
- Causal blocker for satisfaction: no accepted current DomainSpec-v4
  FormalClaim/projection/preservation and TDE-neutral executable oracle chain,
  plus no authenticated provider-to-request policy evidence.
- Deferred residue: credentials, deployment, release and downstream
  E03/E05/L3X/P01-P03 requalification after exact successor bytes stabilize.

## Open Questions

- Which accepted claim/TDE producer will supply a non-synthetic finalized
  request and executable oracle?
- How will an independently authenticated provider bind its native command,
  build and environment to that request?
- What evidence will prove the request's network and physical-memory policy
  rather than only a separate namespace or virtual-address-space diagnostic?
