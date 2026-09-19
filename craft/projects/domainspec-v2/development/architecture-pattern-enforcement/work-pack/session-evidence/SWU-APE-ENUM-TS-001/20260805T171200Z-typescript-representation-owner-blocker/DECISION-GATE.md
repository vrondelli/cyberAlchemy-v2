# Decision Gate — TypeScript Enum representation

Status: **BLOCKED — manual profile-owner decision required**

## Decision

Which TypeScript representation forms are admitted to the first Enum trust lane?

This decision changes the meaning of the TypeScript architecture profile. The
ontology treats the candidates as non-equivalent, and
`TASK-APE-L1-ENUM-TYPESCRIPT` assigns the choice to the manual profile owner.
Task Session therefore cannot select a form or start the adapter on its own.

## Current evidence

- W0 is complete through `SWU-APE-ONT-005`; its receipt digest is
  `3492d0ae6ae46fff79c66c123319645dca5d7a52cbd4bd0a109eab28f10494f3`.
- The current ontology digest is
  `dd2ac2b5fe3bfa5c60bf6807c182e2c46d1adc2dd48a580c93cb6ad3c1651dfc`.
- The current TypeScript profile digest is
  `fe617d6136d7b9997b1bfcbafd1739fe733c321f475f6782ff6396178e13d6e1`.
- The admissibility prefilter accepted all three choices and requires this gate.
- No TypeScript adapter, fixture, or BTE implementation file was changed while
  establishing the gate.

## Options

### 1. `NATIVE-ENUM-FIRST` — recommended

- `enum`: admitted for the first trust slice.
- string literal union: unsupported for this slice.
- `as const` object: unsupported for this slice.

This follows the chosen simplest-to-harder progression and gives the adapter one
direct compiler syntax identity to prove first. `Unsupported` is a typed boundary,
not a permanent rejection; the owner can expand the profile later with new proof.

### 2. `ALL-THREE-TYPESCRIPT-FORMS`

- `enum`: admitted.
- string literal union: admitted.
- `as const` object: admitted.

This starts with the widest useful TypeScript surface, but it makes the first
adapter, identity rules, fixtures, and exact-cause negative matrix materially
larger.

### 3. `DEFER-TYPESCRIPT-LANE`

- All three forms remain owner-unselected.
- The TypeScript lane stops before product mutation.

This preserves the current state but prevents `SWU-APE-ENUM-TS-002` through
`SWU-APE-ENUM-TS-004` and keeps Python and Rust closed behind the trust-lane gate.

## Required owner response

Reply with `1`, `2`, or `3`. A previous numeric response selected a different
ontology mechanism gate and is not reused for this TypeScript semantic decision.

