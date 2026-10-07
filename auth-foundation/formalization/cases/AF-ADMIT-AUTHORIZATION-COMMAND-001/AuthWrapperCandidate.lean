import AuthGeneratedWrapperIR
import AuthGeneratedSubject
import AuthTypedPreservation
import AuthWrapperQualifiers

namespace AuthWrapperCandidate
open AuthGeneratedSubject

-- Interpret source-extracted destination/source pairs. A missing field or an
-- unrecognized source is an error rather than a silent default.
def lookup (fields : List (String × String)) (destination : String) : Option String :=
  (fields.find? (fun entry => entry.1 == destination)).map Prod.snd

def stringSource (c : Context) (e : Evidence) (r : RouteBinding) :
    String → Option String
  | "request.request_id" => some c.request.requestId
  | "request.authentication_evidence_ref" => some c.request.authenticationEvidenceRef
  | "request.route_id" => some c.request.routeId
  | "matching_authentication[0].evidence_ref" => some e.evidenceRef
  | "matching_authentication[0].session_id" => some e.sessionId
  | "matching_bindings[0].route_id" => some r.routeId
  | "matching_bindings[0].scope_evidence_ref" => some r.scopeEvidenceRef
  | "matching_bindings[0].required_permission.resource" => some r.permission.resource
  | "matching_bindings[0].required_permission.action" => some r.permission.action
  | "matching_bindings[0].required_permission.scope" => some r.permission.scope
  | "String::new()" => some ""
  | _ => none

def permissionSource (r : RouteBinding) : String → Option Permission
  | "matching_bindings[0].required_permission" => some r.permission
  | _ => none

def success (c : Context) (e : Evidence) (r : RouteBinding) : Option Command := do
  let fields := AuthGeneratedWrapperIR.candidateSuccessFields
  let requestId ← lookup fields "request_id" >>= stringSource c e r
  let sessionId ← lookup fields "session_id" >>= stringSource c e r
  let permission ← lookup fields "required_permission" >>= permissionSource r
  let scopeEvidenceRef ← lookup fields "scope_evidence_ref" >>= stringSource c e r
  some { requestId, sessionId, permission, scopeEvidenceRef }

def fallback (c : Context) : Option Command := do
  let fields := AuthGeneratedWrapperIR.candidateFallbackFields
  let dummyEvidence : Evidence := { evidenceRef := "", trusted := false, sessionId := "" }
  let dummyRoute : RouteBinding := {
    routeId := "", complete := false, scopeEvidenceRef := "",
    permission := { resource := "", action := "", scope := "" } }
  let source := stringSource c dummyEvidence dummyRoute
  let requestId ← lookup fields "request_id" >>= source
  let sessionId ← lookup fields "session_id" >>= source
  let resource ← lookup fields "required_permission.resource" >>= source
  let action ← lookup fields "required_permission.action" >>= source
  let scope ← lookup fields "required_permission.scope" >>= source
  let scopeEvidenceRef ← lookup fields "scope_evidence_ref" >>= source
  some { requestId, sessionId, permission := { resource, action, scope }, scopeEvidenceRef }

def filterM {α : Type} : List α → (α → Option Bool) → Option (List α)
  | [], _ => some []
  | row :: rest, predicate => do
      let selected ← predicate row
      let retained ← filterM rest predicate
      if selected then some (row :: retained) else some retained

def construct (c : Context) : Option Command := do
  let authRows ← filterM c.authRows (AuthWrapperQualifiers.auth c)
  let routeRows ← filterM c.routeRows (AuthWrapperQualifiers.route c)
  match authRows, routeRows with
  | [e], [r] => success c e r
  | _, _ => fallback c

def blank : Command := {
  requestId := "", sessionId := "",
  permission := { resource := "", action := "", scope := "" },
  scopeEvidenceRef := "" }

def intended (c : Context) : Command :=
  match c.authRows.filter (AuthTypedPreservation.authQual c),
    c.routeRows.filter (AuthTypedPreservation.routeQual c) with
  | [e], [r] => {
      requestId := c.request.requestId,
      sessionId := e.sessionId,
      permission := r.permission,
      scopeEvidenceRef := r.scopeEvidenceRef }
  | _, _ => blank

private theorem filterM_auth (c : Context) (rows : List Evidence) :
    filterM rows (AuthWrapperQualifiers.auth c) =
      some (rows.filter (AuthTypedPreservation.authQual c)) := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      simp [filterM, AuthWrapperQualifiers.auth_eq_kernel_qualifier, ih]
      cases h : AuthTypedPreservation.authQual c row <;> simp [h]

private theorem filterM_route (c : Context) (rows : List RouteBinding) :
    filterM rows (AuthWrapperQualifiers.route c) =
      some (rows.filter (AuthTypedPreservation.routeQual c)) := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      simp [filterM, AuthWrapperQualifiers.route_eq_kernel_qualifier, ih]
      cases h : AuthTypedPreservation.routeQual c row <;> simp [h]

theorem success_copies_unique_rows (c : Context) (e : Evidence) (r : RouteBinding) :
    success c e r = some {
      requestId := c.request.requestId,
      sessionId := e.sessionId,
      permission := r.permission,
      scopeEvidenceRef := r.scopeEvidenceRef } := by
  rfl

theorem fallback_is_blank (c : Context) : fallback c = some blank := by
  rfl

theorem construct_eq_intended (c : Context) :
    construct c = some (intended c) := by
  simp only [construct, filterM_auth, filterM_route]
  cases hAuth : c.authRows.filter (AuthTypedPreservation.authQual c) with
  | nil => simp [intended, hAuth, fallback_is_blank]
  | cons e remainingAuth =>
      cases remainingAuth with
      | nil =>
          cases hRoute : c.routeRows.filter (AuthTypedPreservation.routeQual c) with
          | nil => simp [intended, hAuth, hRoute, fallback_is_blank]
          | cons r remainingRoute =>
              cases remainingRoute with
              | nil => simp [intended, hAuth, hRoute, success_copies_unique_rows]
              | cons r2 tail => simp [intended, hAuth, hRoute, fallback_is_blank]
      | cons e2 tail => simp [intended, hAuth, fallback_is_blank]

theorem unique_rows_copy (c : Context) (e : Evidence) (r : RouteBinding)
    (hAuth : c.authRows.filter (AuthTypedPreservation.authQual c) = [e])
    (hRoute : c.routeRows.filter (AuthTypedPreservation.routeQual c) = [r]) :
    construct c = some {
      requestId := c.request.requestId,
      sessionId := e.sessionId,
      permission := r.permission,
      scopeEvidenceRef := r.scopeEvidenceRef } := by
  rw [construct_eq_intended]
  simp [intended, hAuth, hRoute]

end AuthWrapperCandidate
