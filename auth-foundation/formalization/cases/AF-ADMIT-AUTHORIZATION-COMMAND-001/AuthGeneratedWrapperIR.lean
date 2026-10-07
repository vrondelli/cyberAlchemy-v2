-- GENERATED from exact source-extracted trusted wrapper bytes. Data only.
namespace AuthGeneratedWrapperIR

def sourceSha256 : String := "55f05b0c164e41129605ef944e68136681bad317403ae5958e6050978673d653"
def cargoSha256 : String := "d4714184346984c05aade3dd3ac4c00938bdd03888a6bd24e0981aa57402f56f"

inductive Action where
  | callDownstream
  | returnDeny
deriving Repr, DecidableEq

structure Branches where
  ready : List Action
  deny : List Action
deriving Repr, DecidableEq

def authorizeBranches : Branches :=
  { ready := [Action.callDownstream], deny := [Action.returnDeny] }

def authorizePrefixActions : List Action :=
  []

def authResolverDefault : Bool := true
def routeResolverDefault : Bool := true

inductive QualifierAtom where
  | eq (left right : String)
  | nonempty (path : String)
  | truthy (path : String)
deriving Repr, DecidableEq

def authQualifiers : List QualifierAtom :=
  [(QualifierAtom.eq "evidence.evidence_ref" "request.authentication_evidence_ref"), (QualifierAtom.nonempty "evidence.evidence_ref"), (QualifierAtom.truthy "evidence.trusted"), (QualifierAtom.nonempty "evidence.session_id")]

def routeQualifiers : List QualifierAtom :=
  [(QualifierAtom.eq "binding.route_id" "request.route_id"), (QualifierAtom.nonempty "binding.route_id"), (QualifierAtom.truthy "binding.complete"), (QualifierAtom.nonempty "binding.scope_evidence_ref"), (QualifierAtom.nonempty "binding.required_permission.resource"), (QualifierAtom.nonempty "binding.required_permission.action"), (QualifierAtom.nonempty "binding.required_permission.scope")]

def contextWiring : List (String × String) :=
  [("request.request_id", "request.request_id"), ("request.authentication_evidence_ref", "request.authentication_evidence_ref"), ("request.route_id", "request.route_id"), ("resolved_authentication_evidence", "authentication_evidence.into_iter().map(to_kernel_authentication_evidence).collect()"), ("resolved_route_bindings", "route_bindings.into_iter().map(to_kernel_route_binding).collect()"), ("candidate_command", "to_kernel_command(&candidate)")]

def candidateSuccessFields : List (String × String) :=
  [("request_id", "request.request_id"), ("session_id", "matching_authentication[0].session_id"), ("required_permission", "matching_bindings[0].required_permission"), ("scope_evidence_ref", "matching_bindings[0].scope_evidence_ref")]

def candidateFallbackFields : List (String × String) :=
  [("request_id", "String::new()"), ("session_id", "String::new()"), ("required_permission.resource", "String::new()"), ("required_permission.action", "String::new()"), ("required_permission.scope", "String::new()"), ("scope_evidence_ref", "String::new()")]

def authMapperFields : List (String × String) :=
  [("evidence_ref", "evidence.evidence_ref"), ("session_id", "evidence.session_id"), ("trusted", "evidence.trusted")]

def routeMapperFields : List (String × String) :=
  [("route_id", "binding.route_id"), ("required_permission", "to_kernel_permission(&binding.required_permission)"), ("scope_evidence_ref", "binding.scope_evidence_ref"), ("complete", "binding.complete")]

def commandMapperFields : List (String × String) :=
  [("request_id", "command.request_id"), ("session_id", "command.session_id"), ("required_permission", "to_kernel_permission(&command.required_permission)"), ("scope_evidence_ref", "command.scope_evidence_ref")]

def permissionMapperFields : List (String × String) :=
  [("resource", "permission.resource"), ("action", "permission.action"), ("scope", "permission.scope")]

end AuthGeneratedWrapperIR
