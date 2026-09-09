# Task Session Context — SWU-OCGP-004

Strict coverage pass. Evaluate only the named finite `candidate-policy-v1`.
Preserve carrier, edge, and grounding failures as `policy-fail`; return
`policy-indeterminate/POLICY_OWNER_UNBOUND` for `specializes`; otherwise
return `policy-pass`. All outputs use `authority_effect:none`. No projection,
writer, admission, or promotion is in scope.
