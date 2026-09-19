# Verifier receipt: spawn-0006 — FIX

- Identity: Meadows, Donella H.
- Action status: pass.
- Mutation: none.
- CR dispositions: 12 KEEP, 5 FIX, 0 DROP.
- Minimum stable slice: FIX.
- attacks.md and findings.md hashes match receipts/synthesis.json.
- Manifest SHA-256:
  1c8f1b4b13c9a1ebd821034aad43acb3475350c302459bc888893a1f0cdfc35d.

## Disposition ledger

- CR-01 KEEP. It separates product identity and authority from implementation
  proof. Claim only selection of the exact stable object. G0/R2 and G1/G2
  remain absent.
- CR-02 KEEP. It separates dirty frozen-byte identity from reconstructable
  release evidence. Claim only reproducible candidate identity on selected
  environments; dependency and host breadth remain gated.
- CR-03 KEEP. It keeps decisions, validation, admission, and release distinct.
  Claim only current admission for specifically named candidates; other types,
  promotion, and release remain unproved.
- CR-04 KEEP. Externally anchored topology addresses the false-green verifier
  without claiming semantics; crash safety and semantic correctness remain
  separate.
- CR-05 FIX. The representability defect is valid, but split reopening into a
  closed/versioned observation schema and a separately instrumented provider
  fault-and-restart proof. Evaluator fixtures may establish representability
  only; database atomicity and post-crash recovery remain unproved.
- CR-06 KEEP. It requires an owner-selected composition instead of inferring
  one from independent W3/W4 passes. The result remains one workflow, not
  exactly-once or general distributed behavior.
- CR-07 FIX. Partition version matrices and gates by owned interface surface.
  Only CLI input, diagnostic, and receipt boundaries gate the proposed slice.
  Schema acceptance cannot imply profile admission or runtime semantics.
- CR-08 FIX. Shape-schema and semantic-criterion stages must remain distinct.
  Require compiler output to equal their declared composition with
  stage-specific diagnostics; profile admission remains external.
- CR-09 FIX. Add fail-closed tests for an unknown/new meta-type, a newly
  introduced relation, and endpoint maturity change. Profile expansion
  requires fresh owner ratification.
- CR-10 KEEP. It separates byte/topology identity from semantic truth and
  current mode from history. Some historical evidence may remain unverifiable
  where immutable preimages do not exist.
- CR-11 FIX. Preserve separate owners for canonical definitions, selected
  profiles, and provider registrations. Ontology, projections, counts, and
  prose should be explicit authority-none derived views. Provider mapping
  cannot imply conformance or admission.
- CR-12 KEEP. It offers behavioral proof or claim narrowing and limits
  equivalence to the registered hostile corpus.
- CR-13 KEEP. Concrete package, lock, and source-coupling failures justify the
  clean-build gate; manager choice, audit, and environments remain unresolved.
- CR-14 KEEP. Crash, ambient-environment, snapshot, secret, and retention
  controls are tied to actual factory mechanisms and remain outside v1.
- CR-15 KEEP. Operator/resource controls are tied to the local CLI and have a
  concrete pilot/reopen rule. No present limit, pilot, support route, or
  withdrawal drill exists.
- CR-16 KEEP. Product integration remains blocked; factory evidence is not
  product integration. No target or admission is selected.
- CR-17 KEEP. Preserve the accepted frozen bytes and require a newly confirmed
  selector for future cache exclusion. That new aggregate cannot reuse this
  review.

## Minimum stable slice — FIX, not DROP

The private two-command structural CLI remains a coherent future candidate
because it is explicitly unimplemented, owner-gated, read-only, and excludes
semantic admission, runtime planes, integration, public distribution, release,
and deployment. Before it can be called a durable interface:

1. Resolve self-contained executable versus externally required pinned Node.
2. Specify stdout, stderr, and partial-output behavior: exactly one closed JSON
   document on declared receipt exits and no success-looking partial receipt
   after internal/resource failure.
3. Make the receipt machine-checkably structural and authority-none; it must
   not imply ontology admission, implementation conformance, promotion, or
   production stability.
4. Require profile, meta-type, runtime, or dependency changes to invalidate the
   exact acceptance binding.
5. Retain an independent green/red operator pilot and support handoff as
   release gates.

Claim ceiling: this receipt validates synthesis boundaries only. It does not
accept implementation bytes, select authority, prove conformance, or establish
production readiness, publication, release, or deployment.
