import AuthRustRefinement

open AuthGeneratedSubject

example (c : Context) :
    AuthRustFragment.rule 64 "unique_trusted_authentication_evidence" c =
      some (evalAuth c) :=
  AuthRustRefinement.rust_auth_rule_eq c

example (c : Context) :
    AuthRustFragment.rule 64 "unique_complete_route_binding" c =
      some (evalRoute c) :=
  AuthRustRefinement.rust_route_rule_eq c

example (c : Context) :
    AuthRustFragment.rule 64 "candidate_command_provenance" c =
      some (evalProvenance c) :=
  AuthRustRefinement.rust_provenance_rule_eq c

example (c : Context) :
    AuthRustFragment.rule 64 "command_boundary_admissible" c =
      some (evalAggregate c) :=
  AuthRustRefinement.rust_aggregate_rule_eq c

example (c : Context) :
    AuthRustFragment.operation c = some (AuthExprInterpreter.operation c) :=
  AuthRustRefinement.rust_operation_eq c

#print axioms AuthRustRefinement.rust_auth_rule_eq
#print axioms AuthRustRefinement.rust_route_rule_eq
#print axioms AuthRustRefinement.rust_provenance_rule_eq
#print axioms AuthRustRefinement.rust_aggregate_rule_eq
#print axioms AuthRustRefinement.rust_operation_eq
