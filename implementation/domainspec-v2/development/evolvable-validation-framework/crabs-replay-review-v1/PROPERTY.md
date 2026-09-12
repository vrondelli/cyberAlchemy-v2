# Frozen comparison property

Status: candidate technical comparison selected by the user's execution request.
Meaning provenance: manually bound from the two historical neutral obligations;
this replay does not claim fresh automatic TDE derivation.

## A: Scope and acceptance

Original commit: 9e3a0a6fbaa3f163d0afc5afa94a65fbc5be1937.
Repair commit: 477799721668652988bf98a4a9067d08f5bdaebf.
Component: actual C ordered-set merge, with the existing patch reused.
Success requires fresh original and repair runs, comparable evidence, a private
replay package and a separate reviewer replay. No whole-library conclusion.

## B: Property and exact fixture

Two singleton replicas A and B must produce equal ordered element-ID sequences
after successful merges in opposite directions. Each merge must retain both
elements and succeed; returning an error or an empty result is not a repair.

The historical harnesses instantiate FIXED IDs ('A',1) and ('B',1), zero-filled
remaining ID bytes, payload bytes 1 and 2, no tombstones and no position maps.
They do not quantify over all singleton IDs. This fixture limit is part of the
claim, even though the historical high-level bound says two singletons.
Allocation succeeds and returns fresh objects; zero allocation returns cleared
memory. Production allocation failure is excluded.

## C/E: Harness correspondence and reviewed comparison

Both historical same_order functions compare the full ordered sequence through
crabs_ot_op_id_equal. Both build four independent stack singleton states; merge
is not used to clone the initial fixture. The repair additionally initializes
placement_id from the existing element ID, matching its changed representation.
The original final assertion is main.assertion.1. The repair has two preceding
merge-return assertions and its order assertion is main.assertion.3.

The original dependency shim uses malloc/calloc plus allocation assertions; the
repair uses CBMC fresh allocations directly. They express successful allocation
for this fixture but are not byte-identical models. Historical replay remains
separate from a common harness comparison that uses the SAME dependency shim,
explicit success and member-preservation checks on both code versions.

Historical loop limits: original 8; repair 4 with memcmp/strncmp 65. They are
reported as historical settings, not falsely described as identical. The common
comparison uses 8 and memcmp/strncmp 65 for BOTH subjects. It adds no new input
exclusion. Only representation initialization differs via REPAIRED_LAYOUT.
Additional checks are additive; the original order requirement is unchanged.

CBMC named-property checks do not establish all auxiliary memory, arithmetic
or unwinding assertions. Native checks additionally require successful returns,
two preserved IDs and expected counts. The existing five regression groups are
concrete examples; their merge-based cloning does not establish general laws.

## D/X: Execution envelope

Use repository tools/toolchain/run and its locked GCC 15.2.0. Use the verified
CBMC 6.11.0 binary. Per process: 180 seconds, 4 MiB combined output and 4 GiB
address space. Disable core dumps; kill the process group on timeout/output
overflow. Execute locally with no network needed after input setup. This is
not a security sandbox; network absence is a command property, not OS isolation.
Write fresh evidence only to the explicitly supplied new output directory.
Historical results remain unchanged. Record host/compiler difference from GCC13.

User authorization: execute this plan. Covers local construction, exact source
recovery and fresh bounded runs; no upstream writes or deployment. Freeze exact
package inputs before the first run. Changed runner or contract requires a new
freeze digest and new results; previous runs remain attributable to old bytes.

## Open Questions and exclusions

No general convergence, all-ID singleton property, allocation-failure safety,
position-map behavior, production reachability, serialization migration,
whole-library sanitizers or abstract-to-C equivalence is established here.
The independent reviewer must confirm or challenge the stated correspondence.
