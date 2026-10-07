-- GENERATED from production-mode extraction of exact selected Rust bytes.
-- Rust fragment syntax is data; this module does not define its semantics.
namespace AuthGeneratedRustIR
inductive Expr where
  | path (root : String) (fields : List String)
  | string (value : String)
  | bool (value : Bool)
  | eq (left right : Expr)
  | not (term : Expr)
  | and (left right : Expr)
  | exactlyOne (binding : String) (collection where_ : Expr)
  | exists (binding : String) (collection where_ : Expr)
  | ruleRef (name : String) (argument : Expr)
  | variant (name : String)
  | branch (guard success failure : Expr)
deriving Repr
def selectedRustSha256 : String := "7c19fdb91f4098d7f12cc0c05804dd50c852c69902125af0c3b2d55ba5e497f0"
def candidateCommandProvenance : Expr :=
  (Expr.and (Expr.and (Expr.and (Expr.not (Expr.eq (Expr.path "context" ["request", "request_id"]) (Expr.string ""))) (Expr.eq (Expr.path "context" ["candidate_command", "request_id"]) (Expr.path "context" ["request", "request_id"]))) (Expr.exists "evidence" (Expr.path "context" ["resolved_authentication_evidence"]) (Expr.and (Expr.and (Expr.and (Expr.and (Expr.eq (Expr.path "evidence" ["evidence_ref"]) (Expr.path "context" ["request", "authentication_evidence_ref"])) (Expr.not (Expr.eq (Expr.path "evidence" ["evidence_ref"]) (Expr.string "")))) (Expr.eq (Expr.path "evidence" ["trusted"]) (Expr.bool true))) (Expr.not (Expr.eq (Expr.path "evidence" ["session_id"]) (Expr.string "")))) (Expr.eq (Expr.path "evidence" ["session_id"]) (Expr.path "context" ["candidate_command", "session_id"]))))) (Expr.exists "binding" (Expr.path "context" ["resolved_route_bindings"]) (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.eq (Expr.path "binding" ["route_id"]) (Expr.path "context" ["request", "route_id"])) (Expr.not (Expr.eq (Expr.path "binding" ["route_id"]) (Expr.string "")))) (Expr.eq (Expr.path "binding" ["complete"]) (Expr.bool true))) (Expr.not (Expr.eq (Expr.path "binding" ["scope_evidence_ref"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "resource"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "action"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "scope"]) (Expr.string "")))) (Expr.eq (Expr.path "binding" ["required_permission", "resource"]) (Expr.path "context" ["candidate_command", "required_permission", "resource"]))) (Expr.eq (Expr.path "binding" ["required_permission", "action"]) (Expr.path "context" ["candidate_command", "required_permission", "action"]))) (Expr.eq (Expr.path "binding" ["required_permission", "scope"]) (Expr.path "context" ["candidate_command", "required_permission", "scope"]))) (Expr.eq (Expr.path "binding" ["scope_evidence_ref"]) (Expr.path "context" ["candidate_command", "scope_evidence_ref"])))))

def uniqueCompleteRouteBinding : Expr :=
  (Expr.exactlyOne "binding" (Expr.path "context" ["resolved_route_bindings"]) (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.and (Expr.eq (Expr.path "binding" ["route_id"]) (Expr.path "context" ["request", "route_id"])) (Expr.not (Expr.eq (Expr.path "binding" ["route_id"]) (Expr.string "")))) (Expr.eq (Expr.path "binding" ["complete"]) (Expr.bool true))) (Expr.not (Expr.eq (Expr.path "binding" ["scope_evidence_ref"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "resource"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "action"]) (Expr.string "")))) (Expr.not (Expr.eq (Expr.path "binding" ["required_permission", "scope"]) (Expr.string "")))))

def uniqueTrustedAuthenticationEvidence : Expr :=
  (Expr.exactlyOne "evidence" (Expr.path "context" ["resolved_authentication_evidence"]) (Expr.and (Expr.and (Expr.and (Expr.eq (Expr.path "evidence" ["evidence_ref"]) (Expr.path "context" ["request", "authentication_evidence_ref"])) (Expr.not (Expr.eq (Expr.path "evidence" ["evidence_ref"]) (Expr.string "")))) (Expr.eq (Expr.path "evidence" ["trusted"]) (Expr.bool true))) (Expr.not (Expr.eq (Expr.path "evidence" ["session_id"]) (Expr.string "")))))

def commandBoundaryAdmissible : Expr :=
  (Expr.and (Expr.and (Expr.ruleRef "unique_trusted_authentication_evidence" (Expr.path "context" [])) (Expr.ruleRef "unique_complete_route_binding" (Expr.path "context" []))) (Expr.ruleRef "candidate_command_provenance" (Expr.path "context" [])))

def admitAuthorizationCommand : Expr :=
  (Expr.branch (Expr.ruleRef "command_boundary_admissible" (Expr.path "context" [])) (Expr.variant "Ready") (Expr.variant "Deny"))
end AuthGeneratedRustIR
