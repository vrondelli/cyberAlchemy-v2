# Independent L2 replay review

Reviewer: Codex independent technical reviewer `/root/l2_replay_final`.
Review result: **AGREE** with the author `PASS`.
Bounded decision: **promote** this exact L2 evidence package to its next
internal review state. Authority effect: none.

I completed the independent replay and controls before receiving the author
attempt or assessment path. The comparison phase then confirmed the author's
`PASS` against the same candidate digest. I did not inspect author control
attempts.

## Independent result

The candidate digest recomputed as
`bf54e23b5fd5d38058ce34fdd5845b2e2f2e7eb7951663ff3ac1fac4632765a7`.
All four candidate-bound manifest hashes matched. All 27 source hashes and
sizes, five tool hashes, and four sanitizer-runtime hashes matched their frozen
manifests.

The primary clean replay is
`20260912T180213908798Z__bf54e23b5fd5`. The native v2 entry point returned exit
0 after 156.35 seconds wall time (148.57 seconds user, 5.25 seconds system,
470012 KiB maximum resident set size). Its validator returned `valid: true`, no
findings, and `PASS`.

- Native: 48 completed, 48 unique case IDs, all exit 0, no counterexample;
  0.721992 seconds summed process time, 0.021919 seconds maximum.
- Sanitizer: 48 completed, 48 unique case IDs, all exit 0, no recognized
  ASan/UBSan/LSan finding; 1.61385 seconds summed process time, 0.04239 seconds
  maximum.
- CBMC `b-newer`: bound sufficiency passed in 52.04193 seconds; target
  `main.assertion.1` returned no counterexample at bound in 27.197512 seconds.
- CBMC `c-newer`: bound sufficiency passed in 46.934855 seconds; target
  `main.assertion.1` returned no counterexample at bound in 24.844141 seconds.

The generated harness contains the separately bound assertion text
`EVF_CBMC_B_NEWER_CONVERGENCE` and `EVF_CBMC_C_NEWER_CONVERGENCE`. The harness
bytes match the frozen source and CBMC-bound manifests.

## Independent controls

Reviewer-owned copies and raw probes detected every requested representative
negative class:

- Removing one native case produced `denominator:native` and
  `case-set:native`; validation exited 2.
- Changing one recorded BAC/CAB oracle binding produced
  `case-binding-mismatch`; validation exited 2.
- Changing raw native stdout after receipt creation produced `raw-drift` and
  `derived-mismatch`; validation exited 2.
- Running CBMC with the native local argv but `main.assertion.999` returned
  exit 1 and `property main.assertion.999 unknown` in 0.608656 seconds.
- A 0.15-second deadline produced typed `timeout`, exit -9, and
  `termination: deadline` in 0.247517 seconds.
- A 128-byte stream cap produced typed `output-limit`, exactly 128 retained
  bytes, exit -9, and `termination: stdout` in 0.033789 seconds.
- A missing executable produced typed `failed-to-start`, null exit, and
  `termination: launch-error` in 0.013126 seconds.
- Recovery saw one isolated reviewer-created running state and finalized it as
  `interrupted`, `PARTIAL_NOT_EVALUABLE`, `recovered-interruption` in 0.38
  seconds without rerunning it.

The shared historical `runs-v2.jsonl` contains none of the two reviewer replay
IDs or the recovery-control ID. Reviewer ledger writes were redirected to
reviewer-owned files.

## Author comparison

The author assessment names candidate digest
`bf54e23b5fd5d38058ce34fdd5845b2e2f2e7eb7951663ff3ac1fac4632765a7`,
48 native cases, 48 sanitizer cases, two CBMC representatives, valid receipt,
and `PASS`. Its author terminal hash
`5ec6b6af5c11d366629f7d84f073f4b542b2988dbab920e2c00cd430c1758acf`
and validation hash
`b260a36e9fa91a74ec729f328ad8edc935627d96aa635c7d8764dd9ec1b0082e`
recomputed exactly. The reviewer validation has the same validation hash
because both are the same canonical no-findings `PASS` document.

There is no result disagreement, denominator difference, bound difference,
property-ID difference, or source/tool-byte difference. The reviewer formal
runs were slower than the author's but remained within every frozen bound.

## Environment and shared assumptions

The review ran locally on Linux 6.18.33.2 Microsoft WSL2, x86_64, Python
3.14.4, repository GCC 15.2.0, and CBMC 6.11.0. The frozen command environment
used `LANG=C`, `LC_ALL=C`, the repository toolchain `PATH`, and its sysroot
`LD_LIBRARY_PATH`. Native, compile, and CBMC processes used the 4 GiB address
space cap; sanitizer processes had no address-space cap and retained the frozen
time and per-stream output limits.

This reviewer is distinct from the repair/evidence author but used the same
private checkout, host, source bytes, and tool bytes. This is an independent
execution and derivation replay, not an independent-host portability test.

## Limitations

The `cbmc-bound-manifest.json` descriptive argv still names an absent older
`domainspec-core/.formal-tools` executable and source tree. The native v2 runner
does not execute those path strings: it reconstructs the command from the
frozen loop/property bindings, the present byte-matched `/tmp` CBMC tool, and
the source-manifest-bound local repair export. The fresh run record preserves
the actual local argv. This does not change the bounded result, but it leaves
cross-host portability and direct replay of the descriptive argv unresolved.

An earlier reviewer replay `20260912T175527287719Z__bf54e23b5fd5` completed
all tests and wrote a valid `PASS` terminal, but its outer process exited 1
after terminalization because an initial `/dev/null` ledger shadow rejected
append. It is diagnostic evidence only; the primary result is the later clean
exit-0 replay.

The claim is limited to the frozen 48 cases, matching sanitizer executions,
and the two actual-C CBMC representatives at the declared unwind bounds. It is
not general CRDT convergence proof, whole-library safety evidence, admission,
product approval, certification, publication, release, deployment, or runtime
authority.

## Open Questions

- Should a successor construction normalize the descriptive CBMC argv to
  portable or current source/tool paths while preserving byte bindings?
- Should a later review repeat this package on an independent host to close the
  disclosed shared-host assumption?
- Work-pack blockers and any later authority decision remain owned by
  `repair-assurance-expansion-plan-v1/work-pack/WORK-PACK.md`.
