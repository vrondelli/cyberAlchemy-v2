# APE-ENUM-PROFILE-ORDER-001 — Enum profile ownership and ordering

Status: **PASS**  
Target: `SWU-APE-ONT-003`  
Owner gate: architecture-profile owner  
Source of current state: unresolved package contract, not an implementation failure

## Decision question

Should W0 define only the profile applicability/conflict mechanism and leave
concrete language forms for their language-owner lanes, or should W0 select the
initial TypeScript/Python/Rust representation sets now?

## Why this blocks

`SWU-APE-ONT-003` requires profile-owner decisions for admitted representation
sets. The specification deliberately keeps those forms owner-selected, while
`SWU-APE-ENUM-TS-001` schedules the exact TypeScript decision only after every
W0 receipt. Continuing without a choice would either invent an owner decision
or silently change the package order.

## Admissible options

### PROFILE-MECHANISM-FIRST — recommended

Define executable inheritance, applicability, conflict, and typed unsupported
behavior in W0. Concrete TypeScript/Python/Rust forms remain owner-unselected
until their language lanes. This preserves the current W1 TypeScript decision,
keeps W0 language-neutral, and requires an Invoke Refresh clarification of the
SWU-003 done condition.

Cost: profile fixtures prove the decision mechanism and unselected state, not a
concrete language syntax. The later language decisions remain mandatory.

### NATIVE-ENUMS-NOW

Select TypeScript native `enum`, Python `enum.Enum`, and Rust `enum` as the only
initially admitted forms. This is the smallest concrete cross-language set and
allows W0 to test concrete child constraints immediately.

Cost: it moves architecture-profile decisions earlier than the current plan,
supersedes part of `SWU-APE-ENUM-TS-001`, and rejects or marks unsupported the
other TypeScript forms before native evidence exists.

### MULTI-FORM-NOW

Admit a bounded multi-form profile now, including the three TypeScript
alternatives named by the specification plus explicitly selected Python and
Rust alternatives.

Cost: largest profile/conflict matrix, additional owner decisions, and the
highest risk of modeling forms before the native adapters and toolchains can
prove them.

### DEFER-PACKAGE

Keep the current package unchanged and stop after SWU-APE-ONT-002 until all
profile owners provide their exact selections.

Cost: W0 and every downstream package lane remain blocked.

## Selection

Selected option: `PROFILE-MECHANISM-FIRST`.

Rationale: preserve W0 as a language-neutral mechanism proof, avoid inventing
unproven language syntax policy, and retain the explicit per-language owner
decisions already scheduled by the Work Pack.

Source of decision: workspace operator reply `1` on 2026-08-05, selecting the
recommended option from the presented gate.

Remaining blockers: none for the SWU-003 contract refresh. Concrete language
representation decisions remain intentionally deferred to their declared
language lanes and do not block W0 mechanism authoring.

Admissibility receipt:
`option-admissibility-receipt.json` (`daf6e60eae9a918b69a5a4e717f195b382f546ae35692e42ae4e3b1979b74a8a`).

## Standing context option

The context option was not selected.
