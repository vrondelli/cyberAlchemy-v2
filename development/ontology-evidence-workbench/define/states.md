# States

## Bundle Admission

```text
unselected
  -> verifying
  -> verified | rejected
```

Only `verified` may reach adapter generation.

## Adapter Run

```text
absent
  -> projecting
  -> mapped
  -> verified
  -> served
```

Any failure terminates in a new failed run directory; no existing output is
overwritten.

## Evidence Disposition

The UI projects, but never replaces, source states:

- policy-pass;
- policy-fail;
- policy-indeterminate;
- contradiction/residue;
- excluded-from-grounding;
- verifier-fail.

## View State

- mode: graph | outline | table | code-context
- selected reference: zero or one source object
- filters: kind, exact relation, disposition, diagnostic, authority effect
- receipt drawer: open | closed
- tour: idle | active(step) | completed

View state is ephemeral and carries no authority.

## Trust Rail

The top rail is independently derived from receipts:

```text
SOURCE VERIFIED | ADAPTER VERIFIED | CANDIDATE ONLY | AUTHORITY EFFECT: NONE
```

A missing or failed receipt cannot be visually softened into a warning-only
state; serving blocks.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
