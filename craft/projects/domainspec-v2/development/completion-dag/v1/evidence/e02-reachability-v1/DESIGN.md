# E02 — Compiler-to-EVF integration design

Candidate system prototype. Product construction, authority effect none.
Meaning is frozen by E01 `DSV2-E01-OWNS-REACHABILITY-001`.

## Product flow and implementation boundary

1. A collector outside the provider workspace reads a caller-selected source
   snapshot, query and expected dependency lock. The approved compiler validates
   and compiles that source. Its certificate is checked against the graph.
2. A pure projector selects every Entity and every explicit `owns` edge, maps
   identities bijectively, and prepares positive and negative graph requests.
3. An effectful adapter writes a new audit workspace and invokes the exact
   portable 0.4.0 public launcher with explicit runtime grants. It records
   failure evidence and never falls back to uncontained execution.
4. A collector reads the finite evidence closure into immutable byte buffers.
   A pure evaluator validates the buffers and returns six observations plus
   their aggregate. It cannot read files, resolve paths, inspect the clock,
   spawn processes, use randomness, or access a network.
5. A separate consumer implementation reconstructs the projection directly from
   the trusted compiler graph, computes positive transitive reachability using
   its own traversal, parses the raw records itself, and produces its own receipt.
   It does not import producer projection, verdict or EVF adapter logic.

The compiler is a shared trusted input dependency, not an independent proof of
source-language semantics. Provider and consumer may share this written protocol
and test vectors; they may not share executable projection or verdict logic.
The external shell is responsible for reads, writes, permissions and execution.

## Exact data and byte contracts

`contracts.json` is the closed candidate field/type contract. Unknown fields,
duplicate JSON keys, invalid UTF-8, non-finite numbers and lone surrogates are
rejected. Buffer maps contain bytes, not callable resolvers or filesystem paths.
All limits are checked before parsing or allocating dependent collections.

File references hash the exact raw bytes with SHA-256. Do not normalize an
existing compiler certificate or EVF record and treat its file hash as a semantic
digest. Native embedded digests retain their native algorithm. In particular,
the compiler certificate's graph digest excludes `project_root` using the
compiler's own semantic-graph algorithm; it is not the raw graph file hash.

New integration metadata uses canonical JSON: object keys sorted lexicographically
by Unicode scalar value, no insignificant whitespace, UTF-8 with non-ASCII
characters unescaped, quote/backslash escaped, control characters encoded as
lowercase `\u00xx`, no trailing newline. Arrays retain order; only integers in
the safe range -(2^53-1)..(2^53-1) are permitted, with zero encoded as `0`.
The new metadata carries file digests rather than embedding arbitrary graph-body
numbers. No Unicode normalization is performed. DomainSpec/EVF native digests
must use their separately pinned source algorithms, never this encoding by guess.

An epoch is `SHA256(canonical(expected-inputs))`. Expected inputs arrive from the
caller, outside provider-writable storage: source-file manifest, raw graph and
certificate file digests, query digest, E01 definition digest, E02 profile digest,
dependency-lock digest and independently selected consumer-code identity.
An evidence handle is `SHA256(canonical(handle-body))`; the digest lives outside
the body to avoid self-reference. The handle binds its epoch and every transferred
file by logical name, byte size and SHA-256. Repeated logical names, duplicate
roles, path aliases and missing expected roles are rejected. A new run may create
a different handle within the same epoch; neither run IDs nor timestamps replace
dependency hashes. Expected epoch equality is mandatory before any PASS reuse.

Evidence closure is capped at 256 regular files, 16 MiB per file and 64 MiB total.
Logical names are relative POSIX paths: no empty, dot or dot-dot segments,
backslashes, NUL, symlinks or special files. Collectors retain only explicit
references; arbitrary directory scans and ambient tool discovery are forbidden.

## Projection and obligation closure

The source query is exactly one pair of two-element `[feature_id,node_id]` arrays.
Select all Entities in the compiled project, 1..64 inclusive. Sort identity tuples
by UTF-8 byte ordering, feature first then node, and assign `N0` through `N63`.
Store the reverse map, compiler selector and kind. Reject duplicate tuples,
ambiguous selectors, wrong endpoint kinds and unresolved edge endpoints.

Select only explicit `owns` relationships. Resolve endpoints by tuples, not
concatenation. Sort provider pairs by numeric node indices and deduplicate pairs
only while preserving every source edge ID, scope and endpoint tuple in a reverse
provenance list. Generated `owned-by` and explicit `belongs-to` never substitute.
All nodes are retained, including disconnected Entities. No subset truncation.

Provider graph fields are exactly `nodes`, `edges`, `required_sources`, `target`.
There is one required source and one target. Reachability is E+, not E*: equal
endpoints need a nonempty cycle. The negative graph retains every node and removes
every edge whose target is the selected target. It necessarily falsifies E+
reachability and is tagged as a provider control, not a compiled source project.

Exactly one claim, `owns-reachability`, joins the query, positive graph, negative
graph, provider `souffle`, and consumer `dsv2-owns-reachability-consumer-v1`.
There is one semantic obligation and six acceptance conditions. Portable 0.4.0
requires two repetitions of each case: exactly four distinct raw records, two
positive and two negative, tied to the same job/profile/tool/request closure.

## Native evidence validation and result semantics

Validate the pinned formal bundle's spec/tools/job/claim references, EVF profile
and stage-chain identities, raw receipt digests, input and source references,
dependency references, runtime argv, process results, generated Datalog and
`Violation.csv` content. Require the exact Souffle query from the pinned archive,
`--no-preprocessor`, exact fact/output/model arguments, and the pinned executable.
Reject extra native outputs, duplicate CSV rows and undeclared source IDs.
Positive CSV must be empty; negative CSV must contain exactly the mapped source.
Two repetitions must agree. Recompute reachability from the caller's compiled
graph and compare it to both model and evidence; provider summary text is not an
oracle. Required evidence includes the complete finite native closure, not merely
FORMAL-CLAIMS.json or an EVF verifier's stdout.

The six E01 conditions are input identity, graph correspondence, positive evidence,
negative control, evidence integrity, and consumer independence. Independence
requires a separately owned review binding the exact consumer source/dependency
manifest. A caller-supplied boolean cannot satisfy it. Until that review exists,
the condition is not_evaluable even if synthetic prototype checks pass.

Collect all non-effectful observations. Any observed failure makes the aggregate
BLOCK; otherwise any unevaluable condition makes it not_evaluable; otherwise PASS.
Preserve causal unknowns even when another condition fails. Missing bytes,
timeout or unavailable containment are not_evaluable. Present malformed data,
stale references, mismatched mappings, extra claims and counterexamples are BLOCK.
The portable wrapper can report `not_established` after a counterexample: inspect
retained raw evidence to preserve the observed BLOCK rather than collapsing it to
unknown. Missing dependent stages are still not_evaluable. Effectful execution
stops on failure; it does not execute successor effects to collect diagnostics.

`verdict_prototype.py` exercises only the six-condition aggregate contract. It is
not the raw-evidence evaluator, independently reviewed consumer, or E03 adapter.

## Compiler-produced system scaffold and trace

`system-model/` is the DomainSpec source for four artifact Entities, five boundary
Operations and the bounded-verdict Rule. `compiled/system-model/` contains the
actual compiler graph and checked certificate. `trace.json` connects all four E01
concepts to existing compiled nodes. `example-project/` is a separate three-Entity
source example; it is not evidence that the integration implementation works.
Compiled descriptions model contracts but do not implement operation semantics.
Local scaffold IDs are not registered ontology identities and grant no admission.

## Dependencies, construction frontier and operational residue

The dependency lock pins the approved compiler package, Node binary, EVF archive,
selected archive members and the observed owner-supplied Souffle binary. It names
explicit Bubblewrap and Python dependencies. E03 must freeze its adapter and
consumer implementations plus the full runtime-directory/support-library closure
before product tests; those future sources do not exist yet and are not assigned
invented digests. E03 also requires a separately owned consumer-source review
before E04 can claim an overall PASS. E05 independently reviews the final product
and its complete evidence; it is not a prerequisite for running E04 tests.

E02 closes when both models compile, traces and contract references close, selected
source bytes are current, and the pure aggregate prototype preserves the complete
verdict truth table. E03 is next; R00/U00/L00 remain independent ready construction.
No production adapter or live provider audit runs in E02.

O01 release evidence belongs to the Repository/release owner; O06 distribution
coordination belongs to the portable EVF owner. Runtime verification belongs to
E03/E04 execution owners and blocks execution only when its selected dependencies
are unavailable. TLC's unexplained failure remains with the EVF/TLC owner and is
outside this Souffle profile. These operational items do not block E03 coding.
No compiler approval, EVF approval, publication or enforcement scope is extended.
