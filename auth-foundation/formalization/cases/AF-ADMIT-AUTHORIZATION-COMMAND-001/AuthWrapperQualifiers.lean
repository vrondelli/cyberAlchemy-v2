import AuthGeneratedWrapperIR
import AuthGeneratedSubject
import AuthTypedPreservation

namespace AuthWrapperQualifiers
open AuthGeneratedSubject

inductive Scalar where
  | string (value : String)
  | bool (value : Bool)

-- Fixed interpretation of the wrapper's selected Rust-named field paths.
-- Unknown fields are errors, rather than silently qualifying a row.
def field (c : Context) (e : Option Evidence) (r : Option RouteBinding) :
    String → Option Scalar
  | "request.request_id" => some (.string c.request.requestId)
  | "request.authentication_evidence_ref" => some (.string c.request.authenticationEvidenceRef)
  | "request.route_id" => some (.string c.request.routeId)
  | "evidence.evidence_ref" => e.map (fun row => .string row.evidenceRef)
  | "evidence.session_id" => e.map (fun row => .string row.sessionId)
  | "evidence.trusted" => e.map (fun row => .bool row.trusted)
  | "binding.route_id" => r.map (fun row => .string row.routeId)
  | "binding.complete" => r.map (fun row => .bool row.complete)
  | "binding.scope_evidence_ref" => r.map (fun row => .string row.scopeEvidenceRef)
  | "binding.required_permission.resource" => r.map (fun row => .string row.permission.resource)
  | "binding.required_permission.action" => r.map (fun row => .string row.permission.action)
  | "binding.required_permission.scope" => r.map (fun row => .string row.permission.scope)
  | _ => none

def atom (c : Context) (e : Option Evidence) (r : Option RouteBinding) :
    AuthGeneratedWrapperIR.QualifierAtom → Option Bool
  | .eq left right => do
      let lhs ← field c e r left
      let rhs ← field c e r right
      match lhs, rhs with
      | .string a, .string b => some (a == b)
      | .bool a, .bool b => some (a == b)
      | _, _ => none
  | .nonempty path => do
      let value ← field c e r path
      match value with
      | .string text => some (!(text == ""))
      | _ => none
  | .truthy path => do
      let value ← field c e r path
      match value with
      | .bool flag => some flag
      | _ => none

def all : List AuthGeneratedWrapperIR.QualifierAtom → Context → Option Evidence →
    Option RouteBinding → Option Bool
  | [], _, _, _ => some true
  | clause :: rest, c, e, r => do
      let flag ← atom c e r clause
      if flag then all rest c e r else some false

def auth (c : Context) (e : Evidence) : Option Bool :=
  all AuthGeneratedWrapperIR.authQualifiers c (some e) none

def route (c : Context) (r : RouteBinding) : Option Bool :=
  all AuthGeneratedWrapperIR.routeQualifiers c none (some r)

theorem auth_eq_kernel_qualifier (c : Context) (e : Evidence) :
    auth c e = some (AuthTypedPreservation.authQual c e) := by
  simp [auth, AuthGeneratedWrapperIR.authQualifiers, all, atom, field,
    AuthTypedPreservation.authQual, Bool.and_assoc]
  cases hRef : e.evidenceRef == c.request.authenticationEvidenceRef <;>
    cases hEmptyRef : e.evidenceRef == "" <;>
    cases hTrusted : e.trusted <;>
    cases hEmptySession : e.sessionId == "" <;> simp_all

theorem route_eq_kernel_qualifier (c : Context) (r : RouteBinding) :
    route c r = some (AuthTypedPreservation.routeQual c r) := by
  simp [route, AuthGeneratedWrapperIR.routeQualifiers, all, atom, field,
    AuthTypedPreservation.routeQual, Bool.and_assoc]
  cases hRoute : r.routeId == c.request.routeId <;>
    cases hEmptyRoute : r.routeId == "" <;>
    cases hComplete : r.complete <;>
    cases hEmptyScope : r.scopeEvidenceRef == "" <;>
    cases hEmptyResource : r.permission.resource == "" <;>
    cases hEmptyAction : r.permission.action == "" <;>
    cases hEmptyPermissionScope : r.permission.scope == "" <;> simp_all

theorem auth_filter_eq_kernel (c : Context) :
    c.authRows.filter (fun e => (auth c e).getD false) =
      c.authRows.filter (AuthTypedPreservation.authQual c) := by
  simp [auth_eq_kernel_qualifier]

theorem route_filter_eq_kernel (c : Context) :
    c.routeRows.filter (fun r => (route c r).getD false) =
      c.routeRows.filter (AuthTypedPreservation.routeQual c) := by
  simp [route_eq_kernel_qualifier]

end AuthWrapperQualifiers
