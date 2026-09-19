# Exact W2 local-fallback amendment

## Scope

The proposal changes exactly three private planning artifacts:

1. `projects/domainspec-v2/development/architecture-pattern-enforcement/WORK-PACK.md`
   - staged SHA-256: `abb738d3603788a9c59e632ee9f8426fc9dc7bd9b4750fa3deaec416e74848bf`
2. `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/tasks/TASK-APE-L2-ENUM-PARITY.md`
   - staged SHA-256: `1113d74238eb212a3c7efd4ae423a2d17f49d96ce990266a14a9df038c0a4113`
3. `projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/SWU-MANIFEST.json`
   - staged SHA-256: `a958ec592bda0a68ceb47322dc95113ff0272055700a62d4177ca98ba3e694ec`

## Semantic change

- Replace the unavailable two-subagent W2 fan-out with Python-then-Rust
  local-fallback Task Sessions.
- Make Python the only nearest candidate without selecting it.
- Keep Rust semantically independent while delaying its lifecycle selection
  until Python closeout is current.
- Bind network-free CPython and Rust toolchains and exact validation argv before
  either product mutation.

The proposal does not weaken any lane acceptance criterion, alter the frozen
observation contract, authorize product writes, or claim parity/closeout.

## Exact approval phrase

`Approve the exact three-file W2 local-fallback amendment.`
