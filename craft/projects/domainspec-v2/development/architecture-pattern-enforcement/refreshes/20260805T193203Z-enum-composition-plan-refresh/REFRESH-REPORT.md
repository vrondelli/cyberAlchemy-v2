# Invoke Refresh — Enum composition graph

Status: `applied / ready for SWU-APE-ONT-006 Task Session`

## Selection and scope

- Selected unit: `SWU-APE-ONT-006` (`Generic Enum composition ontology`).
- Exact mutation scope: twelve architecture-enforcement planning artifacts.
- Product ontology files remain unchanged by this refresh.
- Authority/publication: private, internal, `authority_effect: none`.

## Planning correction

The earlier aggregate component-reference model was rejected because it could not
prove nested composition, repeated diamond contributions, cycles, or exact member
origin. The refreshed plan instead requires non-canonical representation-unit nodes,
structured member records, and directed acyclic `architecture.composed_from` edges.

The TypeScript lane is split into four distinct boundaries: generic ontology
(`ONT-006`), owner decision (`ENUM-TS-001`), owned runtime provider
(`ENUM-TS-001A`), and digest-bound profile activation (`ENUM-TS-001B`). The
existing adapter task follows those gates. No runtime form is admitted by this
planning refresh.

## Validation

- Material package validation: pass.
- Refresh handoff: ready.
- Both JSON planning artifacts parse.
- Dispatch validation: pass.
- All twelve applied targets match their validated staged post-images byte-for-byte.
- Scoped `git diff --check`: pass.

## Claim boundary

This refresh changes the candidate-local work plan only. It does not materialize
the ontology, select or activate a language profile, implement the runtime helper,
promote authority, publish, release, deploy, or establish production readiness.

