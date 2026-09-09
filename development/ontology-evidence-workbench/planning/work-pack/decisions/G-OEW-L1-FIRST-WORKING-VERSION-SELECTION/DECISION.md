# Decision Gate — G-OEW-L1-FIRST-WORKING-VERSION-SELECTION

Status: **RESOLVED — A**

## Question

Should the four-unit first-working-version frontier execute one Task Session at
a time until its first blocker or automated browser acceptance closes, or
should OEW remain at the verified L0/store foundation?

## Evidence

- `SWU-OEW-006P` and `SWU-OEW-007` passed and are preserved.
- Historical `SWU-OEW-008` blocked before implementation mutation.
- The component selectors 008–013 were never executed and are superseded by
  one coherent vertical source selector, `SWU-OEW-008F`.
- The active path is `008F → 013B → 014 → 014V`.
- The existing implementation `package.json` remains the only package root and
  is not a target of any active SWU.
- The frontier-readiness validator binds every registered command to a live or
  same-SWU-owned entrypoint.

## Options

### A — Build the first working version

Select `SWU-OEW-008F` first and authorize the finite frontier
`008F → 013B → 014 → 014V`, one fresh Task Session per selector, stopping at
the first blocker or after the independent 014V receipt.

This produces one local Poker evidence-review workbench, then a clean immutable
build, automated browser evidence, and independent acceptance verification.

### D — Stop at the verified foundation

Retain the completed L0 and UI-store/toolchain evidence and perform no further
L1 implementation mutation.

## Recommendation

Option A. It is the shortest dependency-closed path to a browser-verified first
working version, while preserving independent build and acceptance evidence.

## Decision

Selected: **A — Build the first working version**

Selection source: direct user instruction `do next steps` on 2026-07-28,
immediately after the exact sequence was presented as:

1. reconcile the stale Define question;
2. select option A; and
3. execute `008F → 013B → 014 → 014V`.

The instruction authorizes this exact finite frontier, one fresh Task Session
per selector, stopping at the first genuine blocker or after the independent
014V receipt. It does not authorize a wider or recomputed frontier.

## Boundaries

This gate can select only the four-unit private L1 frontier. Every selector
still requires Task Session preflight, exact target enforcement, validation,
and owner closeout. L2 source access, multi-user state, editing, authority,
promotion, publication, deployment, release, and production remain
unauthorized.
