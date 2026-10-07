import AuthFolTheoryProofV3

/- Candidate obligations for the V3 typed model exports. The selected carrier
   is the entire generated Context, never filtered by a decision outcome. -/
namespace AuthFolModelObligationsV3

open AuthFolModel

def emptyContext : Context := {
  request := { requestId := "", authenticationEvidenceRef := "", routeId := "" },
  candidate := { requestId := "", sessionId := "", permission :=
    { resource := "", action := "", scope := "" }, scopeEvidenceRef := "" },
  authRows := [], routeRows := [] }

theorem context_inhabited : Nonempty Context := ⟨emptyContext⟩
def emptyEvidence : AuthGeneratedSubject.Evidence :=
  { evidenceRef := "", trusted := false, sessionId := "" }
def emptyRouteBinding : AuthGeneratedSubject.RouteBinding :=
  { routeId := "", complete := false, scopeEvidenceRef := "", permission := { resource := "", action := "", scope := "" } }
theorem auth_occurrence_inhabited : Nonempty AuthOccurrence :=
  ⟨(emptyContext, (emptyEvidence, 0))⟩
theorem route_occurrence_inhabited : Nonempty RouteOccurrence :=
  ⟨(emptyContext, (emptyRouteBinding, 0))⟩

theorem full_context_carrier (c : AuthGeneratedSubject.Context) :
    ∃ modelContext : AuthFolModel.Context, modelContext = c := ⟨c, rfl⟩

theorem auth_member_iff_position (c tag : Context) (row : AuthGeneratedSubject.Evidence) (pos : Nat) :
    AuthFolModel.authMember c (tag, (row, pos)) ↔
      tag = c ∧ c.authRows[pos]? = some row := by
  simp [AuthFolModel.authMember, AuthFolOccurrenceBridge.authMember,
    AuthFolOccurrenceBridge.authOccurrences, List.mem_map,
    List.mk_mem_zipIdx_iff_getElem?, and_comm, eq_comm]

theorem route_member_iff_position (c tag : Context) (row : AuthGeneratedSubject.RouteBinding) (pos : Nat) :
    AuthFolModel.routeMember c (tag, (row, pos)) ↔
      tag = c ∧ c.routeRows[pos]? = some row := by
  simp [AuthFolModel.routeMember, AuthFolOccurrenceBridge.routeMember,
    AuthFolOccurrenceBridge.routeOccurrences, List.mem_map,
    List.mk_mem_zipIdx_iff_getElem?, and_comm, eq_comm]

theorem auth_positions_distinct (c : Context) (row : AuthGeneratedSubject.Evidence) (i j : Nat)
    (h : i ≠ j) : (c, (row, i)) ≠ (c, (row, j)) := by
  intro heq
  exact h (congrArg (fun a : AuthOccurrence => a.2.2) heq)

theorem route_positions_distinct (c : Context) (row : AuthGeneratedSubject.RouteBinding) (i j : Nat)
    (h : i ≠ j) : (c, (row, i)) ≠ (c, (row, j)) := by
  intro heq
  exact h (congrArg (fun r : RouteOccurrence => r.2.2) heq)

theorem auth_projection_total (a : AuthOccurrence) :
    AuthFolModel.evidenceRef a = a.2.1.evidenceRef ∧
    AuthFolModel.sessionID a = a.2.1.sessionId ∧
    (AuthFolModel.trusted a ↔ a.2.1.trusted = true) := by
  simp [AuthFolModel.evidenceRef, AuthFolModel.sessionID, AuthFolModel.trusted]

theorem route_projection_total (r : RouteOccurrence) :
    AuthFolModel.routeID r = r.2.1.routeId ∧
    AuthFolModel.scopeEvidenceRef r = r.2.1.scopeEvidenceRef ∧
    AuthFolModel.permissionResource r = r.2.1.permission.resource ∧
    AuthFolModel.permissionAction r = r.2.1.permission.action ∧
    AuthFolModel.permissionScope r = r.2.1.permission.scope ∧
    (AuthFolModel.complete r ↔ r.2.1.complete = true) := by
  simp [AuthFolModel.routeID, AuthFolModel.scopeEvidenceRef,
    AuthFolModel.permissionResource, AuthFolModel.permissionAction,
    AuthFolModel.permissionScope, AuthFolModel.complete]

theorem auth_qualifier_selected (c : Context) (a : AuthOccurrence) :
    AuthFolModel.qa c a ↔ AuthFolModel.authMember c a ∧
      AuthTypedPreservation.authQual c a.2.1 = true := by
  simp [AuthFolModel.qa, AuthFolOccurrenceBridge.qa,
    AuthFolOccurrenceBridge.qaFields, AuthTypedPreservation.authQual,
    AuthFolModel.authMember, Bool.and_eq_true, beq_iff_eq,
    and_assoc, and_left_comm, and_comm]

theorem route_qualifier_selected (c : Context) (r : RouteOccurrence) :
    AuthFolModel.qr c r ↔ AuthFolModel.routeMember c r ∧
      AuthTypedPreservation.routeQual c r.2.1 = true := by
  simp [AuthFolModel.qr, AuthFolOccurrenceBridge.qr,
    AuthFolOccurrenceBridge.qrFields, AuthTypedPreservation.routeQual,
    AuthFolModel.routeMember, Bool.and_eq_true, beq_iff_eq,
    and_assoc, and_left_comm, and_comm]

def selectedScope (_c : Context) : Prop := True

theorem entire_context_carrier_in_scope (c : Context) : selectedScope c :=
  trivial

theorem selected_evaluator_normal_completion (c : Context) :
    ∃ value : Bool,
      AuthExprInterpreter.rule 8 AuthGeneratedSubject.operationGuard c = some value :=
  AuthTypedPreservation.selected_operation_guard_total c

def readyEvidence : AuthGeneratedSubject.Evidence :=
  { evidenceRef := "E", trusted := true, sessionId := "S" }
def readyRoute : AuthGeneratedSubject.RouteBinding :=
  { routeId := "route", complete := true, scopeEvidenceRef := "scope",
    permission := { resource := "res", action := "act", scope := "sc" } }
def readyContext : Context := {
  request := { requestId := "R", authenticationEvidenceRef := "E", routeId := "route" },
  candidate := { requestId := "R", sessionId := "S", permission :=
    { resource := "res", action := "act", scope := "sc" }, scopeEvidenceRef := "scope" },
  authRows := [readyEvidence], routeRows := [readyRoute] }
def duplicateAuthContext : Context :=
  { readyContext with authRows := [readyEvidence, readyEvidence] }
def wrongProvenanceContext : Context :=
  { readyContext with candidate := { readyContext.candidate with sessionId := "wrong" } }

theorem ready_witness : AuthExprInterpreter.operation readyContext = "Ready" := by decide
theorem empty_list_deny_witness : AuthExprInterpreter.operation emptyContext = "Deny" := by decide
theorem equal_duplicate_deny_witness :
    AuthExprInterpreter.operation duplicateAuthContext = "Deny" := by decide
theorem wrong_provenance_deny_witness :
    AuthExprInterpreter.operation wrongProvenanceContext = "Deny" := by decide

theorem all_witnesses_in_scope :
    selectedScope readyContext ∧ selectedScope emptyContext ∧
    selectedScope duplicateAuthContext ∧ selectedScope wrongProvenanceContext := by
  exact ⟨entire_context_carrier_in_scope _, entire_context_carrier_in_scope _,
    entire_context_carrier_in_scope _, entire_context_carrier_in_scope _⟩

end AuthFolModelObligationsV3
