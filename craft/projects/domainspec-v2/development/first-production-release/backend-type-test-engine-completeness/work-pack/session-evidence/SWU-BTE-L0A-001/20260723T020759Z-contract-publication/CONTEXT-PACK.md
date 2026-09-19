# SWU-BTE-L0A-001 Runtime Context Pack

## Selection

The user request `task-session all next swus` selects the sole dependency-ready
unit, `SWU-BTE-L0A-001`, for this Task Session. It does not preselect
`SWU-BTE-L0B-001` or any later unit. This session stops after L0A at the
validation-owner and Invoke Refresh continuation boundary.

## Objective

Publish the nine L0 machine-shape contracts and one closed diagnostic registry
as immutable, deterministic bytes. Emit a non-admitting publication receipt
that an independent validation owner can use to author the L0 red manifest.

## Authoritative Inputs

| Selector | SHA-256 | Purpose |
| --- | --- | --- |
| `DESIGN.md` | `b99abbd87d73106cfc9c2f06e886930f6151d53c6f2e4a854e65f73013827296` | proof identity, authority, receipt, and replay boundaries |
| `DESIGN-VALIDATION.json` | `f05f376fe726cf5b013ffa5280ab5a6cd6b00b8d2a950f97ce2098b0c26ecec9` | accepted Design validation |
| `DESIGN-LAYERING-SEED.md` | `01ae2c6589a412ebd2d847c40e38745fe891b3bf087928af0f3aaff8a35ca5d8` | preserved layering seed |
| accepted bootstrap `decision-gate.json` | `4d1150618e370703ea409132508a55865e46b9d1e9e2aec1a0d0d95da0e32527` | accepted L0A/publication then owner-freeze then L0B split |
| `WORK-PACK.md` | `2f68612fd0293c54335d235a4600337d0b3068db699d622c37a6d20057cdfd95` | atomic route and readiness state |
| `TASK-BTE-L0-PROOF-PRIMITIVES.md` | `9a7f8c336e7d09f17abe063911bad60e39b30df02f305a224f74f3562df30a7f` | exact SWU contract |
| `W1-L0-PROOF-PRIMITIVES.md` | `886ebba87de6db69816c3c8dc514e3672466986e9738425eead708e69477203a` | L0A entry/exit boundary |
| refresh apply receipt | `e218c03728f8d6c430501cad9a148238fe0f800ceba869a821675c5181e1160b` | applied plan state and next candidate |

All paths are relative to the BTE package except implementation paths, which
are relative to `projects/domainspec-v2/impl/`.

## Implementation Context

- Root implementation package pre-session SHA-256:
  `296ea410c8a01621a3c689bf8ad0f49ea636d1dc62e2b7de07545060f6a08b9a`.
  It already contains user changes; only the exact
  `verify:bte:contract-publication` script row may be added.
- Engine package SHA-256:
  `b99def8eb19b364ee3dafdd8a5dc5355e01355593951da2b470eb6b48973149c`.
- Engine TypeScript configuration SHA-256:
  `08788315d1342433eaf87a2cb28b36219e5b68ba3e8f201b585042b4a2946fb9`.
- No JSON Schema validator is declared. L0A must not expand dependency scope.
  The bounded implementation therefore validates the supported Draft 2020-12
  subset, rejects every unlisted keyword, and validates one positive instance
  per contract.
- `validation-inputs/l0/` and `src/bte/` were absent at entry.

## Allowed Writes

- the exact nine files under
  `impl/test-derivation-engine/src/bte/contracts/` named by the SWU;
- `impl/test-derivation-engine/src/bte/validation/diagnostics.ts`;
- focused L0A publication verifier and positive-fixture/test files under
  `impl/test-derivation-engine/src/bte/`;
- only the `verify:bte:contract-publication` row in `impl/package.json`;
- `runs/20260723T020759Z/l0a/contract-publication-receipt.json`;
- `runs/20260723T020759Z/l0a/output-write-manifest.json`;
- this new Task Session evidence directory.

## Forbidden Reads And Writes

Do not read or write `validation-inputs/`. Do not implement L0B semantics,
formation, compiler, graph, catalogues, consumers, admissions, UI, or public
Arcanum. Do not alter current-v1 sources or historical session evidence.

## Gates And Stop Conditions

- preserve all four consumed hashes exactly;
- use Draft 2020-12 and a closed supported-keyword set;
- keep diagnostic schema and TypeScript registry exactly equal and unique;
- validate all nine contracts and their positive instances;
- obtain identical publication receipt bytes across two invocations;
- independently recompute receipt handles instead of trusting receipt counts;
- grant no admission and emit no `ValidationReceipt`;
- stop on unknown keyword, nondeterminism, scope escape, source drift, or any
  access to validation-owned inputs.
