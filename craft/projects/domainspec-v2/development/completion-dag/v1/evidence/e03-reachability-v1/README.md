# E03 — Owns-reachability adapter candidate

This is the bounded E03 implementation prototype for E02. It prepares compiler
output for portable EVF 0.4.0 and provides a separate consumer of the evidence.
All outputs carry `authority_effect: none`.

- `producer.py`: pure tuple-preserving graph projection, canonical metadata,
  audit requests, and exact-epoch evidence handles. It does not choose an
  independent verdict oracle or import the consumer.
- `adapter.py`: compiler byte verification, compilation, source snapshot,
  safe file collection, runtime-tree freezing, contained execution and transfer.
  Native result interpretation is EVF-owned; it is not treated as consumer PASS.
- `compile_bridge.mjs`: calls the approved compiler and validates its certificate.
- `consumer.py`: independent pure reconstruction, positive-length closure,
  profile/request/raw-record/stage-chain joins, native digest checks and six
  condition verdicts. It imports only Python standard-library parsing/hash modules.
- `consume.py`: separate bounded reader for the consumer. It checks its own source
  manifest and requires a caller-supplied expected-epoch digest. There are no
  producer or adapter imports.
- `test_adapter.py`: synthetic unit fixtures, not native execution or review evidence.

The three-vertex test exhausts all 512 directed graphs and nine source/target pairs
per graph. The consumer's closure is compared to a separate traversal oracle;
producer/consumer projection equality alone is not the test oracle.

## Use

Run commands from the repository root with Python 3.12 and `-B`. Every output
path must be new. The CLI's `--help` lists exact arguments.

```text
python3 -B <candidate>/adapter.py prepare \
  --source <source-project> --query <query.json> \
  --compiler <approved-compiler-directory> --destination <new-run-root>

python3 -B <candidate>/adapter.py freeze-runtime \
  --kit <exact-extracted-0.4.0-kit> --runtime <pinned-Souffle-installation> \
  --destination <new-runtime-tree-lock.json>

python3 -B <candidate>/adapter.py run \
  --prepared <run-root> --kit <exact-extracted-0.4.0-kit> \
  --runtime-lock <runtime-tree-lock.json>

python3 -B <candidate>/adapter.py collect \
  --prepared <run-root> --consumer-manifest <candidate>/consumer-source-manifest.json

python3 -B <candidate>/consume.py \
  --expected <run-root>/trusted/expected.json \
  --expected-sha256 <caller-retained-expected-digest> \
  --handle <run-root>/handle.json --transfer <run-root>/transfer
```

The compiler directory is verified against the exact approved package, not trusted
because its version string says 1.0.0. The selected Node executable is also hashed.
Source files are reread after compilation and checked against the compiler manifest.
Expected inputs and source snapshots stay outside the provider-writable workspace.
The consumer trusts this caller-selected compiler result; it does not independently
prove the compiler's language semantics. Certificate validation occurs through the
approved compiler, with raw certificate/graph identities then pinned for consumption.

The supplied kit must be extracted from the pinned archive. The shell verifies its
regular files against that archive before execution. Runtime freezing records the
whole explicitly granted installation, kit and fixed system-support trees, including
symlink targets as link metadata. Runtime inputs and mounted host trees must remain
quiescent; this is not a defense against hostile concurrent host writers. The wrapper
requires that lock to match before execution and again afterward. It uses the public
contained launcher for both tool binding and execution, has no host fallback, bounds
output/time, kills descendant process groups, records an attempt before execution,
and refuses a second attempt in the same run directory. Failed run bytes are retained.

`collect --review <exact-review.json>` includes an existing review. `consume
--review-sha256 <independently-selected-review-file-digest>` selects it outside the
provider's data. Without that externally selected review, independence remains
`not_evaluable`; the mere presence of a review-shaped JSON file never grants PASS.
Review binds the exact consumer-source-manifest and execution-dependency-lock file
hashes. The review schema is `dsv2.consumer-source-review/v1-candidate`, with fields
`schema_version`, `consumer_source_sha256`, `dependency_lock_sha256`, `reviewer`,
`result`, `authority_effect`. The review is not product approval. No actual review
is manufactured or recorded by this package.

## Protocol refinements discovered during implementation

These are local E03 additions; E01/E02 bytes remain unchanged.

1. Large host runtime binaries are verified by the external collector against the
   frozen runtime-tree lock. Their exact path/hash/size joins are carried in the
   small `dsv2.e03-execution-lock/v1-candidate` document. Binary payloads are not
   stuffed into the 16 MiB-per-evidence-file transfer. That execution lock binds
   E02's dependency-lock hash and the runtime-tree manifest hash. It is selected
   by the caller in the expected epoch.
2. An unavailable or unsuccessful native job may have no complete handle. Its
   retained files are not converted into a passing bundle. `collect` invokes the
   explicitly separate consumer's partial diagnostic over the pinned graph/query:
   a missing path yields BLOCK; a true graph property with incomplete native
   evidence yields `not_evaluable`. This diagnostic can never return PASS and
   establishes no native execution claim. Raw failed-job material remains local
   for E04 diagnosis; it is not represented as a complete transferred handle.
3. If expected input itself is malformed, a diagnostic receipt can use a null
   expected epoch rather than crashing while attempting to hash invalid metadata.

Native Python record digests and Rust stage digests retain their own encodings.
Integration metadata has its own specified scalar/control-character encoding.
Unknown input fields, invalid identifiers, duplicate roles/keys, extra files,
wrong claims, mixed runs, surviving negative controls and stale epochs fail closed.

## Evidence and remaining frontier

E03 verifies implementation/unit behavior only. It has not run a live EVF audit,
completed the E04 fixture campaign, obtained an independent consumer-source review,
or approved the integration product. The real compiler preparation smoke is
recorded separately from synthetic raw-record and synthetic-review unit fixtures.
The producer's source manifest and the consumer's separate manifest are explicit.
A formal proof of pure-function behavior is not claimed; source inspection and
unit checks establish the bounded tested behavior.

E04 may continue product-test construction. Before it can claim overall PASS,
its execution owner must freeze/recheck the selected runtime closure and a separate
reviewer must assess the exact consumer source and dependency lock. No reviewer
is impersonated or assigned by this implementation. E05 final product review and
approval remain separate.

Operational residue: O01 release evidence remains with the Repository/release
owner; O06 package coordination remains with the portable EVF owner. Full runtime
verification belongs to the E04 execution owner. The EVF/TLC owner retains its
unexplained TLC failure; this profile does not use TLC. These items did not block
E03 coding. R00/U00/L00 remain independently runnable construction nodes.
