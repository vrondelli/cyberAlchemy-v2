import Std
import AuthGeneratedSubject
import AuthExprInterpreter

namespace AuthTypedPreservation

-- These definitional checks make the partial proof depend on the generated
-- Operation identity. They are not the missing AST-evaluator theorem.
theorem selected_guard :
    AuthGeneratedSubject.operationGuard =
      "auth-command-boundary:command-boundary-admissible" := by rfl

theorem selected_branches :
    AuthGeneratedSubject.operationSuccess = "Ready" ∧
      AuthGeneratedSubject.operationFailure = "Deny" := by
  constructor <;> rfl

-- This lemma is parametric in every finite resolver list and Boolean qualifier.
theorem singleton_filter_exists_iff {α : Type} (rows : List α)
    (qualifies agrees : α → Bool) :
    ((rows.filter (fun row => qualifies row)).length == 1 &&
      rows.any (fun row => qualifies row && agrees row)) = true ↔
    ∃ row, rows.filter (fun x => qualifies x) = [row] ∧ agrees row = true := by
  rw [← List.any_filter]
  cases h : rows.filter (fun x => qualifies x) with
  | nil => simp
  | cons head tail =>
    cases tail with
    | nil => simp
    | cons next rest => simp

-- This candidate meaning is deliberately separate from the generated AST and
-- executable projection. Its witnesses must be the unique qualifying rows.
def authQual (c : AuthGeneratedSubject.Context)
    (e : AuthGeneratedSubject.Evidence) : Bool :=
  (e.evidenceRef == c.request.authenticationEvidenceRef) &&
  (!(e.evidenceRef == "")) && (e.trusted == true) && (!(e.sessionId == ""))

def routeQual (c : AuthGeneratedSubject.Context)
    (r : AuthGeneratedSubject.RouteBinding) : Bool :=
  (r.routeId == c.request.routeId) && (!(r.routeId == "")) &&
  (r.complete == true) && (!(r.scopeEvidenceRef == "")) &&
  (!(r.permission.resource == "")) &&
  (!(r.permission.action == "")) &&
  (!(r.permission.scope == ""))

def authAgree (c : AuthGeneratedSubject.Context)
    (e : AuthGeneratedSubject.Evidence) : Bool :=
  e.sessionId == c.candidate.sessionId

def routeAgree (c : AuthGeneratedSubject.Context)
    (r : AuthGeneratedSubject.RouteBinding) : Bool :=
  (r.permission.resource == c.candidate.permission.resource) &&
  (r.permission.action == c.candidate.permission.action) &&
  (r.permission.scope == c.candidate.permission.scope) &&
  (r.scopeEvidenceRef == c.candidate.scopeEvidenceRef)

def candidateMeaning (c : AuthGeneratedSubject.Context) : Prop :=
  c.request.requestId ≠ "" ∧
  c.candidate.requestId = c.request.requestId ∧
  (∃ e, c.authRows.filter (authQual c) = [e] ∧ authAgree c e = true) ∧
  (∃ r, c.routeRows.filter (routeQual c) = [r] ∧ routeAgree c r = true)

theorem generated_auth_eq (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalAuth c =
      ((c.authRows.filter (authQual c)).length == 1) := by
  rfl

theorem generated_route_eq (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalRoute c =
      ((c.routeRows.filter (routeQual c)).length == 1) := by
  rfl

theorem generated_provenance_eq (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalProvenance c =
      ((!(c.request.requestId == "")) &&
       (c.candidate.requestId == c.request.requestId) &&
       c.authRows.any (fun e => authQual c e && authAgree c e) &&
       c.routeRows.any (fun r => routeQual c r && routeAgree c r)) := by
  simp only [AuthGeneratedSubject.evalProvenance, authQual, routeQual,
    authAgree, routeAgree, Bool.and_assoc]

theorem generated_aggregate_candidate (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalAggregate c = true ↔ candidateMeaning c := by
  rw [AuthGeneratedSubject.evalAggregate, generated_auth_eq,
    generated_route_eq, generated_provenance_eq]
  simp only [Bool.and_eq_true]
  constructor
  · intro h
    rcases h with ⟨⟨hAuth, hRoute⟩, ⟨⟨hId, hRequest⟩, hAuthAny⟩, hRouteAny⟩
    have hAuthPair : ((c.authRows.filter (authQual c)).length == 1 &&
        c.authRows.any (fun e => authQual c e && authAgree c e)) = true := by
      simpa only [Bool.and_eq_true] using And.intro hAuth hAuthAny
    have hRoutePair : ((c.routeRows.filter (routeQual c)).length == 1 &&
        c.routeRows.any (fun r => routeQual c r && routeAgree c r)) = true := by
      simpa only [Bool.and_eq_true] using And.intro hRoute hRouteAny
    have hAuthWitness := (singleton_filter_exists_iff c.authRows
      (authQual c) (authAgree c)).mp hAuthPair
    have hRouteWitness := (singleton_filter_exists_iff c.routeRows
      (routeQual c) (routeAgree c)).mp hRoutePair
    have hId' : c.request.requestId ≠ "" := by simpa using hId
    have hRequest' : c.candidate.requestId = c.request.requestId := by
      simpa using hRequest
    exact ⟨hId', hRequest', hAuthWitness, hRouteWitness⟩
  · rintro ⟨hId, hRequest, hAuthWitness, hRouteWitness⟩
    have hAuthPair := (singleton_filter_exists_iff c.authRows
      (authQual c) (authAgree c)).mpr hAuthWitness
    have hRoutePair := (singleton_filter_exists_iff c.routeRows
      (routeQual c) (routeAgree c)).mpr hRouteWitness
    have hAuthConj : ((c.authRows.filter (authQual c)).length == 1) = true ∧
        (c.authRows.any (fun e => authQual c e && authAgree c e)) = true := by
      simpa only [Bool.and_eq_true] using hAuthPair
    have hRouteConj : ((c.routeRows.filter (routeQual c)).length == 1) = true ∧
        (c.routeRows.any (fun r => routeQual c r && routeAgree c r)) = true := by
      simpa only [Bool.and_eq_true] using hRoutePair
    rcases hAuthConj with ⟨hAuth, hAuthAny⟩
    rcases hRouteConj with ⟨hRoute, hRouteAny⟩
    exact ⟨⟨hAuth, hRoute⟩,
      ⟨⟨by simpa using hId, by simpa using hRequest⟩, hAuthAny⟩,
      hRouteAny⟩

theorem generated_operation_ready_iff (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalOperation c = "Ready" ↔ candidateMeaning c := by
  rw [← generated_aggregate_candidate]
  cases h : AuthGeneratedSubject.evalAggregate c <;>
    simp [AuthGeneratedSubject.evalOperation, h,
      AuthGeneratedSubject.operationSuccess, AuthGeneratedSubject.operationFailure]

theorem generated_operation_deny_iff (c : AuthGeneratedSubject.Context) :
    AuthGeneratedSubject.evalOperation c = "Deny" ↔ ¬ candidateMeaning c := by
  rw [← generated_aggregate_candidate]
  cases h : AuthGeneratedSubject.evalAggregate c <;>
    simp [AuthGeneratedSubject.evalOperation, h,
      AuthGeneratedSubject.operationSuccess, AuthGeneratedSubject.operationFailure]

-- The fixed interpreter consumes the generated AuthExpr values. These bridge
-- lemmas connect that interpretation to the separately generated executable
-- projection, over every finite resolver list rather than sampled contexts.
section AstBridge

private theorem mapM_some {α β : Type} (rows : List α) (f : α → β) :
    rows.mapM (fun row => (some (f row) : Option β)) = some (rows.map f) := by
  induction rows with
  | nil => rfl
  | cons row rest ih => simp [ih]

private theorem map_filter_id_length {α : Type} (rows : List α) (p : α → Bool) :
    ((rows.map p).filter id).length = (rows.filter p).length := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      cases h : p row <;> simp [h, ih]

private theorem map_any_id {α : Type} (rows : List α) (p : α → Bool) :
    (rows.map p).any id = rows.any p := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      cases h : p row <;> simp [h, ih]

private def authWhere : AuthGeneratedSubject.AuthExpr :=
  match AuthGeneratedSubject.auth with
  | .exactlyOne _ _ where_ => where_
  | _ => .all []

private theorem auth_row_eval (c : AuthGeneratedSubject.Context)
    (e : AuthGeneratedSubject.Evidence) :
    AuthExprInterpreter.eval 7 { context := c, evidence := some e } authWhere =
      some (authQual c e) := by
  change some (([
    e.evidenceRef == c.request.authenticationEvidenceRef,
    !(e.evidenceRef == ""),
    e.trusted == true,
    !(e.sessionId == "")]).all id) = some (authQual c e)
  simp [authQual, Bool.and_assoc]

theorem interpreted_auth_eq (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.auth =
      some (AuthGeneratedSubject.evalAuth c) := by
  change (do
    let values ← c.authRows.mapM
      (fun e => AuthExprInterpreter.eval 7
        { context := c, evidence := some e } authWhere)
    some ((values.filter id).length == 1)) =
    some (AuthGeneratedSubject.evalAuth c)
  simp only [auth_row_eval, mapM_some]
  change some (((c.authRows.map (authQual c)).filter id).length == 1) =
    some (AuthGeneratedSubject.evalAuth c)
  rw [map_filter_id_length]
  rfl

private def routeWhere : AuthGeneratedSubject.AuthExpr :=
  match AuthGeneratedSubject.route with
  | .exactlyOne _ _ where_ => where_
  | _ => .all []

private theorem route_row_eval (c : AuthGeneratedSubject.Context)
    (r : AuthGeneratedSubject.RouteBinding) :
    AuthExprInterpreter.eval 7 { context := c, binding := some r } routeWhere =
      some (routeQual c r) := by
  change some (([
    r.routeId == c.request.routeId,
    !(r.routeId == ""),
    r.complete == true,
    !(r.scopeEvidenceRef == ""),
    !(r.permission.resource == ""),
    !(r.permission.action == ""),
    !(r.permission.scope == "")]).all id) = some (routeQual c r)
  simp [routeQual, Bool.and_assoc]

theorem interpreted_route_eq (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.route =
      some (AuthGeneratedSubject.evalRoute c) := by
  change (do
    let values ← c.routeRows.mapM
      (fun r => AuthExprInterpreter.eval 7
        { context := c, binding := some r } routeWhere)
    some ((values.filter id).length == 1)) =
    some (AuthGeneratedSubject.evalRoute c)
  simp only [route_row_eval, mapM_some]
  change some (((c.routeRows.map (routeQual c)).filter id).length == 1) =
    some (AuthGeneratedSubject.evalRoute c)
  rw [map_filter_id_length]
  rfl

private def provenanceAuthWhere : AuthGeneratedSubject.AuthExpr :=
  match AuthGeneratedSubject.provenance with
  | .all [_, _, .existsOne _ _ where_, _] => where_
  | _ => .all []

private def provenanceRouteWhere : AuthGeneratedSubject.AuthExpr :=
  match AuthGeneratedSubject.provenance with
  | .all [_, _, _, .existsOne _ _ where_] => where_
  | _ => .all []

private theorem provenance_auth_row_eval (c : AuthGeneratedSubject.Context)
    (e : AuthGeneratedSubject.Evidence) :
    AuthExprInterpreter.eval 6 { context := c, evidence := some e }
      provenanceAuthWhere = some (authQual c e && authAgree c e) := by
  change some (([
    e.evidenceRef == c.request.authenticationEvidenceRef,
    !(e.evidenceRef == ""),
    e.trusted == true,
    !(e.sessionId == ""),
    e.sessionId == c.candidate.sessionId]).all id) =
    some (authQual c e && authAgree c e)
  simp [authQual, authAgree, Bool.and_assoc]

private theorem provenance_route_row_eval (c : AuthGeneratedSubject.Context)
    (r : AuthGeneratedSubject.RouteBinding) :
    AuthExprInterpreter.eval 6 { context := c, binding := some r }
      provenanceRouteWhere = some (routeQual c r && routeAgree c r) := by
  change some (([
    r.routeId == c.request.routeId,
    !(r.routeId == ""),
    r.complete == true,
    !(r.scopeEvidenceRef == ""),
    !(r.permission.resource == ""),
    !(r.permission.action == ""),
    !(r.permission.scope == ""),
    r.permission.resource == c.candidate.permission.resource,
    r.permission.action == c.candidate.permission.action,
    r.permission.scope == c.candidate.permission.scope,
    r.scopeEvidenceRef == c.candidate.scopeEvidenceRef]).all id) =
    some (routeQual c r && routeAgree c r)
  simp [routeQual, routeAgree, Bool.and_assoc]

theorem interpreted_provenance_eq (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.provenance =
      some (AuthGeneratedSubject.evalProvenance c) := by
  change (do
    let values ← ([
      some (!(c.request.requestId == "")),
      some (c.candidate.requestId == c.request.requestId),
      (do
        let rows ← c.authRows.mapM (fun e => AuthExprInterpreter.eval 6
          { context := c, evidence := some e } provenanceAuthWhere)
        some (rows.any id)),
      (do
        let rows ← c.routeRows.mapM (fun r => AuthExprInterpreter.eval 6
          { context := c, binding := some r } provenanceRouteWhere)
        some (rows.any id))] : List (Option Bool)).mapM id
    some (values.all id)) = some (AuthGeneratedSubject.evalProvenance c)
  simp only [provenance_auth_row_eval, provenance_route_row_eval, mapM_some]
  change some (([
    !(c.request.requestId == ""),
    c.candidate.requestId == c.request.requestId,
    (c.authRows.map (fun e => authQual c e && authAgree c e)).any id,
    (c.routeRows.map (fun r => routeQual c r && routeAgree c r)).any id]).all id) =
    some (AuthGeneratedSubject.evalProvenance c)
  rw [map_any_id, map_any_id]
  simp [AuthGeneratedSubject.evalProvenance, authQual, routeQual,
    authAgree, routeAgree, Bool.and_assoc]

private theorem auth_fuel_sufficient (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.auth =
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.auth := by
  rfl

private theorem route_fuel_sufficient (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.route =
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.route := by
  rfl

private theorem provenance_fuel_sufficient (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.provenance =
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.provenance := by
  rfl

theorem interpreted_aggregate_eq (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.aggregate =
      some (AuthGeneratedSubject.evalAggregate c) := by
  change (do
    let values ← ([
      AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.auth,
      AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.route,
      AuthExprInterpreter.eval 6 { context := c } AuthGeneratedSubject.provenance] :
      List (Option Bool)).mapM id
    some (values.all id)) = some (AuthGeneratedSubject.evalAggregate c)
  rw [auth_fuel_sufficient, route_fuel_sufficient,
    provenance_fuel_sufficient, interpreted_auth_eq,
    interpreted_route_eq, interpreted_provenance_eq]
  simp [AuthGeneratedSubject.evalAggregate, Bool.and_assoc]

-- Totality is stated for the exact selected ASTs and guard, not arbitrary
-- malformed expressions. It is the prerequisite for comparing this eager
-- Option interpreter with the selected Rust fragment's lazy Boolean operators.
theorem interpreted_auth_total (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.auth =
        some value :=
  ⟨AuthGeneratedSubject.evalAuth c, interpreted_auth_eq c⟩

theorem interpreted_route_total (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.route =
        some value :=
  ⟨AuthGeneratedSubject.evalRoute c, interpreted_route_eq c⟩

theorem interpreted_provenance_total (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.provenance =
        some value :=
  ⟨AuthGeneratedSubject.evalProvenance c, interpreted_provenance_eq c⟩

theorem interpreted_aggregate_total (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.eval 8 { context := c } AuthGeneratedSubject.aggregate =
        some value :=
  ⟨AuthGeneratedSubject.evalAggregate c, interpreted_aggregate_eq c⟩

theorem selected_operation_guard_total (c : AuthGeneratedSubject.Context) :
    ∃ value : Bool,
      AuthExprInterpreter.rule 8 AuthGeneratedSubject.operationGuard c =
        some value := by
  refine ⟨AuthGeneratedSubject.evalAggregate c, ?_⟩
  unfold AuthExprInterpreter.rule
  simp only [AuthGeneratedSubject.operationGuard]
  exact interpreted_aggregate_eq c

theorem interpreted_operation_eq (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = AuthGeneratedSubject.evalOperation c := by
  unfold AuthExprInterpreter.operation AuthExprInterpreter.rule
  simp only [AuthGeneratedSubject.operationGuard]
  rw [interpreted_aggregate_eq]
  cases h : AuthGeneratedSubject.evalAggregate c <;>
    simp [AuthGeneratedSubject.evalOperation, h]

theorem interpreted_operation_ready_iff (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = "Ready" ↔ candidateMeaning c := by
  rw [interpreted_operation_eq]
  exact generated_operation_ready_iff c

theorem interpreted_operation_deny_iff (c : AuthGeneratedSubject.Context) :
    AuthExprInterpreter.operation c = "Deny" ↔ ¬ candidateMeaning c := by
  rw [interpreted_operation_eq]
  exact generated_operation_deny_iff c

theorem blank_request_id_deny (c : AuthGeneratedSubject.Context)
    (h : c.request.requestId = "") :
    AuthExprInterpreter.operation c = "Deny" := by
  apply (interpreted_operation_deny_iff c).2
  intro meaning
  exact meaning.1 h

theorem duplicate_qualifying_auth_deny (c : AuthGeneratedSubject.Context)
    (e : AuthGeneratedSubject.Evidence)
    (hRows : c.authRows = [e, e]) (hQual : authQual c e = true) :
    AuthExprInterpreter.operation c = "Deny" := by
  apply (interpreted_operation_deny_iff c).2
  intro meaning
  rcases meaning.2.2.1 with ⟨row, hSingleton, _⟩
  simp [hRows, hQual] at hSingleton

end AstBridge

end AuthTypedPreservation
