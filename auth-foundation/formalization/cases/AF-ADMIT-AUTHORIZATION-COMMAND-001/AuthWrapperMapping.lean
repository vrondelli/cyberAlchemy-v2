import AuthGeneratedWrapperIR
import AuthGeneratedSubject
import AuthWrapperCandidate

namespace AuthWrapperMapping
open AuthGeneratedSubject

private def lookup := AuthWrapperCandidate.lookup

def permissionString (p : Permission) : String → Option String
  | "permission.resource" => some p.resource
  | "permission.action" => some p.action
  | "permission.scope" => some p.scope
  | _ => none

def mapPermission (p : Permission) : Option Permission := do
  let fields := AuthGeneratedWrapperIR.permissionMapperFields
  let resource ← lookup fields "resource" >>= permissionString p
  let action ← lookup fields "action" >>= permissionString p
  let scope ← lookup fields "scope" >>= permissionString p
  some { resource, action, scope }

def evidenceString (e : Evidence) : String → Option String
  | "evidence.evidence_ref" => some e.evidenceRef
  | "evidence.session_id" => some e.sessionId
  | _ => none

def evidenceBool (e : Evidence) : String → Option Bool
  | "evidence.trusted" => some e.trusted
  | _ => none

def mapEvidence (e : Evidence) : Option Evidence := do
  let fields := AuthGeneratedWrapperIR.authMapperFields
  let evidenceRef ← lookup fields "evidence_ref" >>= evidenceString e
  let sessionId ← lookup fields "session_id" >>= evidenceString e
  let trusted ← lookup fields "trusted" >>= evidenceBool e
  some { evidenceRef, sessionId, trusted }

def routeString (r : RouteBinding) : String → Option String
  | "binding.route_id" => some r.routeId
  | "binding.scope_evidence_ref" => some r.scopeEvidenceRef
  | _ => none

def routeBool (r : RouteBinding) : String → Option Bool
  | "binding.complete" => some r.complete
  | _ => none

def routePermission (r : RouteBinding) : String → Option Permission
  | "to_kernel_permission(&binding.required_permission)" => mapPermission r.permission
  | _ => none

def mapRoute (r : RouteBinding) : Option RouteBinding := do
  let fields := AuthGeneratedWrapperIR.routeMapperFields
  let routeId ← lookup fields "route_id" >>= routeString r
  let permission ← lookup fields "required_permission" >>= routePermission r
  let scopeEvidenceRef ← lookup fields "scope_evidence_ref" >>= routeString r
  let complete ← lookup fields "complete" >>= routeBool r
  some { routeId, permission, scopeEvidenceRef, complete }

def commandString (c : Command) : String → Option String
  | "command.request_id" => some c.requestId
  | "command.session_id" => some c.sessionId
  | "command.scope_evidence_ref" => some c.scopeEvidenceRef
  | _ => none

def commandPermission (c : Command) : String → Option Permission
  | "to_kernel_permission(&command.required_permission)" => mapPermission c.permission
  | _ => none

def mapCommand (c : Command) : Option Command := do
  let fields := AuthGeneratedWrapperIR.commandMapperFields
  let requestId ← lookup fields "request_id" >>= commandString c
  let sessionId ← lookup fields "session_id" >>= commandString c
  let permission ← lookup fields "required_permission" >>= commandPermission c
  let scopeEvidenceRef ← lookup fields "scope_evidence_ref" >>= commandString c
  some { requestId, sessionId, permission, scopeEvidenceRef }

def requestString (request : Request) : String → Option String
  | "request.request_id" => some request.requestId
  | "request.authentication_evidence_ref" => some request.authenticationEvidenceRef
  | "request.route_id" => some request.routeId
  | _ => none

def authRowsFromWiring (c : Context) : String → Option (List Evidence)
  | "authentication_evidence.into_iter().map(to_kernel_authentication_evidence).collect()" =>
      c.authRows.mapM mapEvidence
  | "authentication_evidence.into_iter().take(1).map(to_kernel_authentication_evidence).collect()" =>
      (c.authRows.take 1).mapM mapEvidence
  | _ => none

def routeRowsFromWiring (c : Context) : String → Option (List RouteBinding)
  | "route_bindings.into_iter().map(to_kernel_route_binding).collect()" =>
      c.routeRows.mapM mapRoute
  | "route_bindings.into_iter().take(1).map(to_kernel_route_binding).collect()" =>
      (c.routeRows.take 1).mapM mapRoute
  | _ => none

def candidateFromWiring (c : Context) : String → Option Command
  | "to_kernel_command(&candidate)" => mapCommand c.candidate
  | "to_kernel_command(&candidate.clone())" => mapCommand c.candidate
  | _ => none

def mapContext (c : Context) : Option Context := do
  let fields := AuthGeneratedWrapperIR.contextWiring
  let requestId ← lookup fields "request.request_id" >>= requestString c.request
  let authenticationEvidenceRef ←
    lookup fields "request.authentication_evidence_ref" >>= requestString c.request
  let routeId ← lookup fields "request.route_id" >>= requestString c.request
  let authRows ← lookup fields "resolved_authentication_evidence" >>= authRowsFromWiring c
  let routeRows ← lookup fields "resolved_route_bindings" >>= routeRowsFromWiring c
  let candidate ← lookup fields "candidate_command" >>= candidateFromWiring c
  let mappedRequest : Request :=
    { requestId := requestId,
      authenticationEvidenceRef := authenticationEvidenceRef,
      routeId := routeId }
  some (Context.mk mappedRequest candidate authRows routeRows)

theorem permission_preserved (p : Permission) : mapPermission p = some p := by rfl
theorem evidence_preserved (e : Evidence) : mapEvidence e = some e := by rfl
theorem route_preserved (r : RouteBinding) : mapRoute r = some r := by rfl
theorem command_preserved (c : Command) : mapCommand c = some c := by rfl

private theorem mapM_identity {α : Type} (rows : List α) (f : α → Option α)
    (h : ∀ row, f row = some row) : rows.mapM f = some rows := by
  induction rows with
  | nil => rfl
  | cons row rest ih => simp [h row, ih]

theorem ordered_rows_and_fields_preserved (c : Context) :
    mapContext c = some c := by
  simp [mapContext, AuthGeneratedWrapperIR.contextWiring, requestString,
    authRowsFromWiring, routeRowsFromWiring, candidateFromWiring,
    lookup, AuthWrapperCandidate.lookup,
    mapM_identity c.authRows mapEvidence evidence_preserved,
    mapM_identity c.routeRows mapRoute route_preserved,
    command_preserved]

end AuthWrapperMapping
