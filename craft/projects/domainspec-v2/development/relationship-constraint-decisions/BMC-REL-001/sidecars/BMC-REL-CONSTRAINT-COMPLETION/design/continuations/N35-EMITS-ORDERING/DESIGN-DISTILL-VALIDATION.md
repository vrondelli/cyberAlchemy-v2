# N35 Distill Validation

- Unit: whether ordering applies to one authored canonical
  `Entity --[emits]--> Event` concept fact.
- Unit selection: `pass`.
- Split pressure: none inside A; authored order identity, runtime sequence, delivery,
  retry, replay, timestamp, payload, numeric, and representation concerns are separate
  concepts and remain excluded.
- Recomposition: N34 fixes the occurrence unit at the concept fact; N35 asks only
  whether ordering is not applicable, deferred, or stopped.
- Hidden gaps: any future ordered emission model requires its own order-bearing object,
  identity, semantics, completeness, and validation contract.
- Collapsed alternative: `unordered` is not independently admissible because the
  selected sources define neither set semantics nor a distinct validator/generator
  consequence beyond not-applicable.
- Authority: selection remains null and `authority_effect: none`.
