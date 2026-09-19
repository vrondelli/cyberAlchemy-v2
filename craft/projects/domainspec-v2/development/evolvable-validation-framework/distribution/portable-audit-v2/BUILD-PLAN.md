# Portable EVF adapters and formal claims — 0.2.0 candidate

User intent: include executable formal-tool adapters with the runnable package
and provide the formal claims that their actual evidence supports.

Current frontier: implementation and example product-test work completed for
the archive bound in `VALIDATION.json`. Four real provider runs, their formal
verification, and 50 tests passed after extraction outside the repository.
No construction blocker remains for this bounded package task. Product approval,
publication, recipient access, and audits of actual owner code remain separate
deferred work, not hidden prerequisites for the completed example package.

## Construction and operations

Product-construction frontier: a new portable adapter/claim candidate built on
the unchanged 0.1.0 Rust runner and independent verifier. Runnable work is the
four adapter contracts, positive and negative examples, evidence collection,
and claim verification. This is not approval inherited from EVF v3 or 0.1.0.

Definitions and navigation scaffold: an audit requirement names the property;
an adapter request binds a source/model to one tool; raw tool evidence records
the result; EVF checks expected positive and deliberate negative outcomes;
a FormalClaim records only the property, assumptions, checked bytes, evidence
kind, and bounds that those records support. No result activates anything.

Implementation candidate: adapters for Soufflé 2.5, Alloy 6.2.0 with Java 17,
CBMC 6.11.0, and Lean 4.33.1. TLA+/TLC is outside this candidate because no
existing adapter is present. Lean checking must bind an explicit theorem type
and audit transitive axioms, not merely count theorem names or accept exit zero.
CBMC must check the declared assertion and complete property results; too-small
unwinding, malformed output, unknown results, and missing checks cannot pass.

Operational support owner: this task. Exact scope: this new directory only,
its generated kit, temporary test workspaces, and versioned archive/checksum.
The 0.1.0 archive is an immutable input. Runtime installation/binding is an
explicit owner operation; the portable adapter code is included, while large
third-party runtimes remain separately installed. Provide exact versions and
upstream download sources, with local byte bindings and prerequisite checks.

Deferred operations: product approval and another commit/push or recipient
delivery. Do not change the previous publication or imply authority from it.
No CRABS source changes, CRABS experiments, public Arcanum export, credentials,
system installation, or changes to the existing EVF adapters are authorized.

## Evidence before completion

1. Rehash the immutable 0.1.0 archive and preserve original source/runtime bytes.
2. Exercise all four real runtimes with positive and cause-specific negative
   cases; parser-only test doubles never create supported formal claims.
3. Test missing runtime, bad versions, source drift, truncated/missing results,
   weak bounds, unexpected axioms, wrong theorem type, and altered evidence.
4. Recheck EVF's existing executable example and independent verifier.
5. Extract the completed kit elsewhere and exercise its owner commands.
6. Provide plain-language requirements, commands, claim limits, and actual
   measured outcomes. Keep unavailable checks visible as not evaluable.
