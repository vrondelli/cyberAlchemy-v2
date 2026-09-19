# R13 commerce preparation package

Candidate direct DomainSpec source; authority effect: none. This package owns the
Open Questions for its closed-schema source and selection JSON via [RESULT.md](RESULT.md#open-questions).

- [source/project.json](source/project.json) loads an inert two-feature graph with
  21 nodes spanning the configured 13 metatypes.
- [selection.json](selection.json) is the existing reconciled TypeScript selection,
  with exact factory, identity-reference, Operation and Workflow bindings.
- [scenarios.json](scenarios.json) supplies stable R13-C01 through R13-C22 IDs,
  source selectors, input vectors, expected observations and unexecuted language cells.
- [values.json](values.json) supplies concrete values and seven distinct Event inputs.
  Its integer strings are transport vectors, not generated-language objects.
- [build-corpus.ts](build-corpus.ts) imports the existing compound helper and
  returns the package as JSON on stdout. It cleans its uniquely owned temporary
  source in a finally block. It does not overwrite the checked-in package.
- [check.ts](check.ts) checks reproducibility, source loading, selections, field
  shapes, bindings, the public source planner, five negative controls, manifest
  coverage and input stability. It emits JSON; it does not run generated code.

From the explicit DomainSpec checkout:

```bash
cd /home/vrondelli/projects/domainspec-core/projects/domainspec-v2
NODE_NO_WARNINGS=1 node --import ./impl/cli/node_modules/tsx/dist/loader.mjs development/reconciliation-v1/profile-compiler-reconciliation/parallel/r13-commerce/check.ts
```

Use the same invocation with `build-corpus.ts` to inspect reconstructed source.
All authored files were materialized using apply_patch. No native verifier,
Docker, Cargo, provider, publication or runtime operation is invoked.

The Calculation-to-Mapping pipeline is a **scenario consumer specification**.
It is not passed off as a DomainSpec composition artifact or executable adapter.
The native consumer implementation and three-language observations remain the
parent's R13 task after R12. No Python/Rust selection schema is invented here.

## Open Questions

See [RESULT.md](RESULT.md#open-questions).

