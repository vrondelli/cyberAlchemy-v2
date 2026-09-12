# CRABS private replay package

Status: execution candidate. Authority effect: none.
Purpose: reproduce an existing bounded defect/repair assessment with accessible
exact inputs and independently reviewable evidence. See [PROPERTY.md](PROPERTY.md)
for the property, correspondence argument, exclusions and resource policy.

## Inputs and provenance

The inputs directory exports the selected C translation units, headers, changed
test sources, historical harnesses and recovered patch from the exact revisions
in [source-manifest.json](source-manifest.json). Source bytes were checked against
the historical manifests. The source is private: do not publish this package.
No Git checkout, network source lookup or unavailable original paths are needed
to replay. Unrelated CRABS sources, large documents and dependencies are omitted.

The checked-in historical patch has whitespace drift; the recovered patch in
inputs/repair.patch is reconstructed from the exact two commits and matches the
historical SHA-256. The historical artifact is not changed.

## Environment

Linux x86_64 with Python 3, dpkg-deb for provider extraction, and this repository's
tools/toolchain/run installation. The provider is the exact CBMC 6.11.0 binary.
The compiler is current pinned GCC 15.2.0, not unavailable historical GCC13.
The new compiler identity is disclosed in every result. The repository launcher
and lock are operational dependencies; this package is not a hermetic OS image.

Run from this directory. Set REPLAY_REPO to the actual CyberAlchemy checkout:

```sh
export REPLAY_REPO=/home/vrondelli/projects/cyberAlchemy-v2
python3 setup_cbmc.py
python3 -B replay.py check
"$REPLAY_REPO/tools/toolchain/run" python3 -B replay.py run \
  --repo "$REPLAY_REPO" --cbmc .cache/cbmc/usr/bin/cbmc \
  --output /tmp/crabs-replay-reviewer-attempt-001
python3 -B replay.py verify --output /tmp/crabs-replay-reviewer-attempt-001
```

Select a NEW output directory for each attempt; existing directories reject.
If an already verified CBMC binary is available, supply its absolute path and
omit setup_cbmc.py. No download is performed during provider execution.
Do not run freeze as a reviewer. check verifies the author's existing freeze.
A changed input or script requires a new reviewed freeze and a new attempt.

## What runs

1. Original historical fixture: native and CBMC named order assertion.
2. Repair historical fixture: native and CBMC order plus merge-return assertions.
3. Common fixture on original C: native and all four main assertions.
4. Common fixture on repaired C: native and the same four assertions.
5. Five existing native repair regression groups.

The common fixture adds successful-return and retained-membership requirements,
uses one allocator/equality shim and identical loop bounds on both code versions.
It prevents treating rejected valid merges as repair success. REPAIRED_LAYOUT
changes only placement metadata initialization, not the oracle. Inspect it.
The CBMC main assertions are selected deliberately: this does not validate every
auxiliary safety or unwind assertion or all inputs of the general API.

Original native assertion failure is expected evidence, not a runner crash.
The adapter records raw output, termination reason, exact commands, tool and
input identity, timing and typed outcomes. verify recomputes raw hashes and
normalization rather than trusting a stored pass flag. Receipts are unsigned
integrity records, not protection against an actor who replaces the entire
package and its trust anchor. Live replay supplies stronger independent evidence.

## Reviewer checklist

- Verify freeze and exported source identities; inspect the property and harness
  mapping before running. Challenge any unsupported correspondence claim.
- Reproduce in a separately prepared output directory without author coaching.
- Inspect original failing assertion identity and concrete order output.
- Inspect repaired order, successful merges and preserved member checks.
- Confirm the five regression examples ran; retain their limited scope.
- Recompute evidence integrity and inspect exact flags, limits and exclusions.
- Record replay time, environment differences, corrections and unresolved risks.
- Give an attributable conclusion. Technical subagent review shares a host and
  model lineage and is not an external organizational audit or certification.

## Open Questions

See PROPERTY.md for unproved behavior. A broader run, second implementation,
production reachability and commercial readiness remain separate milestones.
Any independently found defect in this package must be fixed and re-frozen with
fresh author and reviewer evidence before claiming milestone completion.
