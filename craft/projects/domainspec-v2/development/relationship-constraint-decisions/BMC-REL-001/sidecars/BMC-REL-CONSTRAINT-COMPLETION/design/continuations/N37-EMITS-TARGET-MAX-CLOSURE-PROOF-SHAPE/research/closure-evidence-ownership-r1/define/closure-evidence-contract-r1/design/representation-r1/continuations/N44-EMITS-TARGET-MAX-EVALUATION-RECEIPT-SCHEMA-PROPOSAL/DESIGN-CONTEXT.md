# N44 Design context

N43 supplies one exact candidate closure-envelope schema. N44 supplies the separately owned, digest-bound evaluation receipt that records how `emits.target_max=1` was evaluated for one exact snapshot.

The repository precedents converge on recursively closed JSON Schema Draft 2020-12 receipts, exact artifact bindings, typed diagnostics, explicit unresolved/error results, semantic and receipt digests, immutable historical evidence, and no admission authority. No competing formalism is evidence-backed, so N44 is a direct proposal rather than a Decision Gate.

Result precedence is fixed by the Define contract: binding errors -> `error`; visible duplicate or target-max violation -> `invalid` even with missing closure; otherwise missing proof -> `not-evaluated-incomplete-closure`; otherwise -> `pass`.
