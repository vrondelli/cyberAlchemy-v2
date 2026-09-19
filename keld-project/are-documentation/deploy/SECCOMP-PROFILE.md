# Public chat Node seccomp profile

Date: 2026-09-18. Status: local deployment candidate.

`seccomp-node.json` is derived from Moby's default profile at commit
`245180c51918481c0525424b3ee025d2b435d46c`. The upstream file SHA-256 is
`785b2429264afba4d594320337cb17f144f3c7d51585f9805eef72e28f4f9334`;
the tightened local profile SHA-256 is
`dcc1925102b4f7d5535c3fb1ac238613bd43ef4c7b34b7fba6d71fa38c1491e5`.
The upstream source is
<https://github.com/moby/profiles/blob/245180c51918481c0525424b3ee025d2b435d46c/seccomp/default.json>.

The local profile retains an `SCMP_ACT_ERRNO` default and removes all allow
rules for cross-process memory/inspection, kernel instrumentation, keyring,
mount/namespace, module, clock, swap, raw-I/O, and privileged system-control
calls. `cap_drop: [ALL]`, `no-new-privileges`, non-root UIDs, read-only roots,
Node's permission model, and Docker network segmentation remain independent
controls; this profile does not replace them.

Run `node scripts/verify-seccomp-profile.mjs` and `npm run test:seccomp` from the
ARE documentation package, then start the exact containers before accepting a
profile change. The runtime probe is compiled with the repository-pinned C
toolchain and requires both `process_vm_readv` and `ptrace` to fail with `EPERM`.
A JSON parser pass alone is insufficient: the runtime smoke must show every
service healthy under this profile.

## Open Questions

- Rebase deliberately when Moby's default changes; never overwrite this file
  mechanically without reviewing additions and removals.
- Production acceptance still needs the target host kernel, Docker, runc, and
  architecture recorded because seccomp behavior is host-runtime dependent.
- Consider an allowlist reduced from observed production syscall telemetry only
  after representative traffic, shutdown, DNS failure, and certificate rotation
  paths have been exercised.
