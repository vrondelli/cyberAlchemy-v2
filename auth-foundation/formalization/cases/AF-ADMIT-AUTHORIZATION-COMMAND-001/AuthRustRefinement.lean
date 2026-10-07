import Std
import AuthGeneratedSubject
import AuthGeneratedRustIR
import AuthRustFragment
import AuthExprInterpreter
import AuthTypedPreservation

namespace AuthRustRefinement
open AuthGeneratedSubject

private def authWhere : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence with
  | .exactlyOne _ _ where_ => where_
  | _ => .bool false

private theorem auth_row_eval (c : Context) (e : Evidence) :
    AuthRustFragment.eval 63 { context := c, evidence := some e } authWhere =
      some (AuthRustFragment.Value.bool (AuthTypedPreservation.authQual c e)) := by
  simp [authWhere, AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence,
    AuthRustFragment.eval, AuthRustFragment.root, AuthRustFragment.fields,
    AuthRustFragment.field, AuthRustFragment.scalarEq,
    AuthTypedPreservation.authQual, Bool.and_assoc]
  cases hRef : e.evidenceRef == c.request.authenticationEvidenceRef <;>
    cases hEmptyRef : e.evidenceRef == "" <;>
    cases hTrusted : e.trusted <;>
    cases hEmptySession : e.sessionId == "" <;>
    simp

private def routeWhere : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.uniqueCompleteRouteBinding with
  | .exactlyOne _ _ where_ => where_
  | _ => .bool false

private theorem route_row_eval (c : Context) (r : RouteBinding) :
    AuthRustFragment.eval 63 { context := c, binding := some r } routeWhere =
      some (AuthRustFragment.Value.bool (AuthTypedPreservation.routeQual c r)) := by
  simp [routeWhere, AuthGeneratedRustIR.uniqueCompleteRouteBinding,
    AuthRustFragment.eval, AuthRustFragment.root, AuthRustFragment.fields,
    AuthRustFragment.field, AuthRustFragment.scalarEq,
    AuthTypedPreservation.routeQual, Bool.and_assoc]
  cases hRoute : r.routeId == c.request.routeId <;> simp
  cases hEmptyRoute : r.routeId == "" <;> simp
  cases hComplete : r.complete <;> simp
  cases hEmptyScope : r.scopeEvidenceRef == "" <;> simp
  cases hEmptyResource : r.permission.resource == "" <;> simp
  cases hEmptyAction : r.permission.action == "" <;> simp

private theorem mapM_some {α β : Type} (rows : List α) (f : α → β) :
    rows.mapM (fun row => (some (f row) : Option β)) = some (rows.map f) := by
  induction rows with
  | nil => rfl
  | cons row rest ih => simp [ih]

private theorem mapM_unbox (rows : List Bool) :
    (rows.map AuthRustFragment.Value.bool).mapM
      (fun value => match value with
        | .bool b => some b
        | _ => none) = some rows := by
  induction rows with
  | nil => rfl
  | cons row rest ih => simp [ih]

private theorem map_filter_id_length {α : Type} (rows : List α) (p : α → Bool) :
    ((rows.map p).filter id).length = (rows.filter p).length := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      cases h : p row <;> simp [h, ih]

theorem rust_auth_eval_eq (c : Context) :
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalAuth c)) := by
  change (do
    let values ← c.authRows.mapM
      (fun e => AuthRustFragment.eval 63 { context := c, evidence := some e } authWhere)
    let booleans ← values.mapM
      (fun value => match value with
        | .bool b => some b
        | _ => none)
    some (AuthRustFragment.Value.bool ((booleans.filter id).length == 1))) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalAuth c))
  simp only [auth_row_eval, mapM_some]
  change (do
    let booleans ← (c.authRows.map (AuthRustFragment.Value.bool ∘ AuthTypedPreservation.authQual c)).mapM
      (fun value => match value with
        | .bool b => some b
        | _ => none)
    some (AuthRustFragment.Value.bool ((booleans.filter id).length == 1))) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalAuth c))
  rw [show c.authRows.map (AuthRustFragment.Value.bool ∘ AuthTypedPreservation.authQual c) =
      (c.authRows.map (AuthTypedPreservation.authQual c)).map AuthRustFragment.Value.bool by
        simp [List.map_map, Function.comp_def]]
  rw [mapM_unbox]
  change some (AuthRustFragment.Value.bool
    (((c.authRows.map (AuthTypedPreservation.authQual c)).filter id).length == 1)) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalAuth c))
  rw [map_filter_id_length]
  rfl

theorem rust_auth_rule_eq (c : Context) :
    AuthRustFragment.rule 64 "unique_trusted_authentication_evidence" c =
      some (AuthGeneratedSubject.evalAuth c) := by
  simp [AuthRustFragment.rule, rust_auth_eval_eq]

theorem rust_route_eval_eq (c : Context) :
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.uniqueCompleteRouteBinding =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalRoute c)) := by
  change (do
    let values ← c.routeRows.mapM
      (fun r => AuthRustFragment.eval 63 { context := c, binding := some r } routeWhere)
    let booleans ← values.mapM
      (fun value => match value with
        | .bool b => some b
        | _ => none)
    some (AuthRustFragment.Value.bool ((booleans.filter id).length == 1))) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalRoute c))
  simp only [route_row_eval, mapM_some]
  change (do
    let booleans ← (c.routeRows.map (AuthRustFragment.Value.bool ∘ AuthTypedPreservation.routeQual c)).mapM
      (fun value => match value with
        | .bool b => some b
        | _ => none)
    some (AuthRustFragment.Value.bool ((booleans.filter id).length == 1))) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalRoute c))
  rw [show c.routeRows.map (AuthRustFragment.Value.bool ∘ AuthTypedPreservation.routeQual c) =
      (c.routeRows.map (AuthTypedPreservation.routeQual c)).map AuthRustFragment.Value.bool by
        simp [List.map_map, Function.comp_def]]
  rw [mapM_unbox]
  change some (AuthRustFragment.Value.bool
    (((c.routeRows.map (AuthTypedPreservation.routeQual c)).filter id).length == 1)) =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalRoute c))
  rw [map_filter_id_length]
  rfl

theorem rust_route_rule_eq (c : Context) :
    AuthRustFragment.rule 64 "unique_complete_route_binding" c =
      some (AuthGeneratedSubject.evalRoute c) := by
  simp [AuthRustFragment.rule, rust_route_eval_eq]

private def provenanceAuthWhere : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.candidateCommandProvenance with
  | .and (.and _ (.exists _ _ where_)) _ => where_
  | _ => .bool false

private def provenanceRouteWhere : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.candidateCommandProvenance with
  | .and _ (.exists _ _ where_) => where_
  | _ => .bool false

private theorem provenance_auth_row_eval (c : Context) (e : Evidence) :
    AuthRustFragment.eval 62 { context := c, evidence := some e }
      provenanceAuthWhere =
      some (AuthRustFragment.Value.bool
        (AuthTypedPreservation.authQual c e && AuthTypedPreservation.authAgree c e)) := by
  simp [provenanceAuthWhere, AuthGeneratedRustIR.candidateCommandProvenance,
    AuthRustFragment.eval, AuthRustFragment.root, AuthRustFragment.fields,
    AuthRustFragment.field, AuthRustFragment.scalarEq,
    AuthTypedPreservation.authQual, AuthTypedPreservation.authAgree, Bool.and_assoc]
  cases hRef : e.evidenceRef == c.request.authenticationEvidenceRef <;> simp
  cases hEmptyRef : e.evidenceRef == "" <;> simp
  cases hTrusted : e.trusted <;> simp
  cases hEmptySession : e.sessionId == "" <;> simp

private theorem provenance_route_row_eval (c : Context) (r : RouteBinding) :
    AuthRustFragment.eval 62 { context := c, binding := some r }
      provenanceRouteWhere =
      some (AuthRustFragment.Value.bool
        (AuthTypedPreservation.routeQual c r && AuthTypedPreservation.routeAgree c r)) := by
  simp [provenanceRouteWhere, AuthGeneratedRustIR.candidateCommandProvenance,
    AuthRustFragment.eval, AuthRustFragment.root, AuthRustFragment.fields,
    AuthRustFragment.field, AuthRustFragment.scalarEq,
    AuthTypedPreservation.routeQual, AuthTypedPreservation.routeAgree,
    Bool.and_assoc]
  cases hRoute : r.routeId == c.request.routeId <;> simp
  cases hEmptyRoute : r.routeId == "" <;> simp
  cases hComplete : r.complete <;> simp
  cases hEmptyScope : r.scopeEvidenceRef == "" <;> simp
  cases hEmptyResource : r.permission.resource == "" <;> simp
  cases hEmptyAction : r.permission.action == "" <;> simp
  cases hEmptyPermissionScope : r.permission.scope == "" <;> simp
  cases hResource : r.permission.resource == c.candidate.permission.resource <;> simp
  cases hAction : r.permission.action == c.candidate.permission.action <;> simp
  cases hPermissionScope : r.permission.scope == c.candidate.permission.scope <;> simp

private theorem anyM_some {α : Type} (rows : List α) (p : α → Bool) :
    AuthRustFragment.anyM rows (fun row => some (p row)) = some (rows.any p) := by
  induction rows with
  | nil => rfl
  | cons row rest ih =>
      cases h : p row <;> simp [AuthRustFragment.anyM, h, ih]

private def provenanceAuthExists : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.candidateCommandProvenance with
  | .and (.and _ expression) _ => expression
  | _ => .bool false

private def provenanceRouteExists : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.candidateCommandProvenance with
  | .and _ expression => expression
  | _ => .bool false

private theorem provenance_auth_exists_eval (c : Context) :
    AuthRustFragment.eval 62 { context := c } provenanceAuthExists =
      some (AuthRustFragment.Value.bool
        (c.authRows.any (fun e =>
          AuthTypedPreservation.authQual c e && AuthTypedPreservation.authAgree c e))) := by
  have hRow (e : Evidence) :
      AuthRustFragment.eval 61 { context := c, evidence := some e } provenanceAuthWhere =
        some (AuthRustFragment.Value.bool
          (AuthTypedPreservation.authQual c e && AuthTypedPreservation.authAgree c e)) := by
    simpa only [show AuthRustFragment.eval 61 { context := c, evidence := some e }
      provenanceAuthWhere = AuthRustFragment.eval 62 { context := c, evidence := some e }
      provenanceAuthWhere by rfl] using provenance_auth_row_eval c e
  change (AuthRustFragment.anyM c.authRows (fun e => do
    let value ← AuthRustFragment.eval 61 { context := c, evidence := some e }
      provenanceAuthWhere
    match value with
    | .bool b => some b
    | _ => none)).map AuthRustFragment.Value.bool = _
  simp [hRow, anyM_some]

private theorem provenance_route_exists_eval (c : Context) :
    AuthRustFragment.eval 63 { context := c } provenanceRouteExists =
      some (AuthRustFragment.Value.bool
        (c.routeRows.any (fun r =>
          AuthTypedPreservation.routeQual c r && AuthTypedPreservation.routeAgree c r))) := by
  change (AuthRustFragment.anyM c.routeRows (fun r => do
    let value ← AuthRustFragment.eval 62 { context := c, binding := some r }
      provenanceRouteWhere
    match value with
    | .bool b => some b
    | _ => none)).map AuthRustFragment.Value.bool = _
  simp [provenance_route_row_eval, anyM_some]

private def provenancePrefix : AuthGeneratedRustIR.Expr :=
  match AuthGeneratedRustIR.candidateCommandProvenance with
  | .and (.and expression _) _ => expression
  | _ => .bool false

private theorem provenance_prefix_eval (c : Context) :
    AuthRustFragment.eval 62 { context := c } provenancePrefix =
      some (AuthRustFragment.Value.bool
        (!(c.request.requestId == "") && c.candidate.requestId == c.request.requestId)) := by
  simp [provenancePrefix, AuthGeneratedRustIR.candidateCommandProvenance,
    AuthRustFragment.eval, AuthRustFragment.root, AuthRustFragment.fields,
    AuthRustFragment.field, AuthRustFragment.scalarEq]
  cases h : c.request.requestId == "" <;> simp

private theorem eval_and_eq (fuel : Nat) (env : AuthRustFragment.Env)
    (left right : AuthGeneratedRustIR.Expr) (a b : Bool)
    (hLeft : AuthRustFragment.eval fuel env left = some (.bool a))
    (hRight : AuthRustFragment.eval fuel env right = some (.bool b)) :
    AuthRustFragment.eval (fuel + 1) env (.and left right) =
      some (.bool (a && b)) := by
  cases a <;> simp [AuthRustFragment.eval, hLeft, hRight]

theorem rust_provenance_eval_eq (c : Context) :
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.candidateCommandProvenance =
      some (AuthRustFragment.Value.bool (AuthGeneratedSubject.evalProvenance c)) := by
  let requestGuard := (!(c.request.requestId == "") && c.candidate.requestId == c.request.requestId)
  let authWitness := c.authRows.any (fun e =>
    AuthTypedPreservation.authQual c e && AuthTypedPreservation.authAgree c e)
  let routeWitness := c.routeRows.any (fun r =>
    AuthTypedPreservation.routeQual c r && AuthTypedPreservation.routeAgree c r)
  have hLeft : AuthRustFragment.eval 63 { context := c }
      (.and provenancePrefix provenanceAuthExists) =
      some (.bool (requestGuard && authWitness)) :=
    eval_and_eq 62 { context := c } provenancePrefix provenanceAuthExists
      requestGuard authWitness (provenance_prefix_eval c) (provenance_auth_exists_eval c)
  have hAll : AuthRustFragment.eval 64 { context := c }
      (.and (.and provenancePrefix provenanceAuthExists) provenanceRouteExists) =
      some (.bool ((requestGuard && authWitness) && routeWitness)) :=
    eval_and_eq 63 { context := c } (.and provenancePrefix provenanceAuthExists)
      provenanceRouteExists (requestGuard && authWitness) routeWitness hLeft
      (provenance_route_exists_eval c)
  change AuthRustFragment.eval 64 { context := c }
      (.and (.and provenancePrefix provenanceAuthExists) provenanceRouteExists) = _
  rw [hAll]
  simp [requestGuard, authWitness, routeWitness,
    AuthGeneratedSubject.evalProvenance, AuthTypedPreservation.authQual,
    AuthTypedPreservation.authAgree, AuthTypedPreservation.routeQual,
    AuthTypedPreservation.routeAgree, Bool.and_assoc]

theorem rust_provenance_rule_eq (c : Context) :
    AuthRustFragment.rule 64 "candidate_command_provenance" c =
      some (AuthGeneratedSubject.evalProvenance c) := by
  simp [AuthRustFragment.rule, rust_provenance_eval_eq]

private theorem auth_fuel_stable (c : Context) :
    AuthRustFragment.eval 59 { context := c }
      AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence =
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence := by
  rfl

private theorem route_fuel_stable (c : Context) :
    AuthRustFragment.eval 59 { context := c }
      AuthGeneratedRustIR.uniqueCompleteRouteBinding =
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.uniqueCompleteRouteBinding := by
  rfl

private theorem provenance_fuel_stable (c : Context) :
    AuthRustFragment.eval 60 { context := c }
      AuthGeneratedRustIR.candidateCommandProvenance =
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.candidateCommandProvenance := by
  rfl

private def authRef : AuthGeneratedRustIR.Expr :=
  .ruleRef "unique_trusted_authentication_evidence" (.path "context" [])

private def routeRef : AuthGeneratedRustIR.Expr :=
  .ruleRef "unique_complete_route_binding" (.path "context" [])

private def provenanceRef : AuthGeneratedRustIR.Expr :=
  .ruleRef "candidate_command_provenance" (.path "context" [])

private theorem auth_ref_62 (c : Context) :
    AuthRustFragment.eval 62 { context := c } authRef =
      some (.bool (AuthGeneratedSubject.evalAuth c)) := by
  change AuthRustFragment.eval 61 { context := c }
    AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence = _
  rw [show AuthRustFragment.eval 61 { context := c }
    AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence =
    AuthRustFragment.eval 59 { context := c }
    AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence by rfl,
    auth_fuel_stable, rust_auth_eval_eq]

private theorem route_ref_62 (c : Context) :
    AuthRustFragment.eval 62 { context := c } routeRef =
      some (.bool (AuthGeneratedSubject.evalRoute c)) := by
  change AuthRustFragment.eval 61 { context := c }
    AuthGeneratedRustIR.uniqueCompleteRouteBinding = _
  rw [show AuthRustFragment.eval 61 { context := c }
    AuthGeneratedRustIR.uniqueCompleteRouteBinding =
    AuthRustFragment.eval 59 { context := c }
    AuthGeneratedRustIR.uniqueCompleteRouteBinding by rfl,
    route_fuel_stable, rust_route_eval_eq]

private theorem provenance_ref_63 (c : Context) :
    AuthRustFragment.eval 63 { context := c } provenanceRef =
      some (.bool (AuthGeneratedSubject.evalProvenance c)) := by
  change AuthRustFragment.eval 62 { context := c }
    AuthGeneratedRustIR.candidateCommandProvenance = _
  rw [show AuthRustFragment.eval 62 { context := c }
    AuthGeneratedRustIR.candidateCommandProvenance =
    AuthRustFragment.eval 60 { context := c }
    AuthGeneratedRustIR.candidateCommandProvenance by rfl,
    provenance_fuel_stable, rust_provenance_eval_eq]

theorem rust_aggregate_eval_eq (c : Context) :
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.commandBoundaryAdmissible =
      some (.bool (AuthGeneratedSubject.evalAggregate c)) := by
  have hLeft : AuthRustFragment.eval 63 { context := c }
      (.and authRef routeRef) =
      some (.bool (AuthGeneratedSubject.evalAuth c && AuthGeneratedSubject.evalRoute c)) :=
    eval_and_eq 62 { context := c } authRef routeRef
      (AuthGeneratedSubject.evalAuth c) (AuthGeneratedSubject.evalRoute c)
      (auth_ref_62 c) (route_ref_62 c)
  have hAll := eval_and_eq 63 { context := c } (.and authRef routeRef)
    provenanceRef (AuthGeneratedSubject.evalAuth c && AuthGeneratedSubject.evalRoute c)
    (AuthGeneratedSubject.evalProvenance c) hLeft (provenance_ref_63 c)
  change AuthRustFragment.eval 64 { context := c }
    (.and (.and authRef routeRef) provenanceRef) = _
  simpa [AuthGeneratedSubject.evalAggregate] using hAll

theorem rust_aggregate_rule_eq (c : Context) :
    AuthRustFragment.rule 64 "command_boundary_admissible" c =
      some (AuthGeneratedSubject.evalAggregate c) := by
  simp [AuthRustFragment.rule, rust_aggregate_eval_eq]

private theorem auth_ref_60 (c : Context) :
    AuthRustFragment.eval 60 { context := c } authRef =
      some (.bool (AuthGeneratedSubject.evalAuth c)) := by
  change AuthRustFragment.eval 59 { context := c }
    AuthGeneratedRustIR.uniqueTrustedAuthenticationEvidence = _
  rw [auth_fuel_stable, rust_auth_eval_eq]

private theorem route_ref_60 (c : Context) :
    AuthRustFragment.eval 60 { context := c } routeRef =
      some (.bool (AuthGeneratedSubject.evalRoute c)) := by
  change AuthRustFragment.eval 59 { context := c }
    AuthGeneratedRustIR.uniqueCompleteRouteBinding = _
  rw [route_fuel_stable, rust_route_eval_eq]

private theorem provenance_ref_61 (c : Context) :
    AuthRustFragment.eval 61 { context := c } provenanceRef =
      some (.bool (AuthGeneratedSubject.evalProvenance c)) := by
  change AuthRustFragment.eval 60 { context := c }
    AuthGeneratedRustIR.candidateCommandProvenance = _
  rw [provenance_fuel_stable, rust_provenance_eval_eq]

private theorem aggregate_eval_62 (c : Context) :
    AuthRustFragment.eval 62 { context := c }
      AuthGeneratedRustIR.commandBoundaryAdmissible =
      some (.bool (AuthGeneratedSubject.evalAggregate c)) := by
  have hLeft : AuthRustFragment.eval 61 { context := c }
      (.and authRef routeRef) =
      some (.bool (AuthGeneratedSubject.evalAuth c && AuthGeneratedSubject.evalRoute c)) :=
    eval_and_eq 60 { context := c } authRef routeRef
      (AuthGeneratedSubject.evalAuth c) (AuthGeneratedSubject.evalRoute c)
      (auth_ref_60 c) (route_ref_60 c)
  have hAll := eval_and_eq 61 { context := c } (.and authRef routeRef)
    provenanceRef (AuthGeneratedSubject.evalAuth c && AuthGeneratedSubject.evalRoute c)
    (AuthGeneratedSubject.evalProvenance c) hLeft (provenance_ref_61 c)
  change AuthRustFragment.eval 62 { context := c }
    (.and (.and authRef routeRef) provenanceRef) = _
  simpa [AuthGeneratedSubject.evalAggregate] using hAll

theorem rust_operation_eval_eq (c : Context) :
    AuthRustFragment.eval 64 { context := c }
      AuthGeneratedRustIR.admitAuthorizationCommand =
      some (.decision (AuthGeneratedSubject.evalOperation c)) := by
  have hGuard : AuthRustFragment.eval 63 { context := c }
      (.ruleRef "command_boundary_admissible" (.path "context" [])) =
      some (.bool (AuthGeneratedSubject.evalAggregate c)) := by
    change AuthRustFragment.eval 62 { context := c }
      AuthGeneratedRustIR.commandBoundaryAdmissible = _
    exact aggregate_eval_62 c
  change (do
    let value ← AuthRustFragment.eval 63 { context := c }
      (.ruleRef "command_boundary_admissible" (.path "context" []))
    match value with
    | .bool true => AuthRustFragment.eval 63 { context := c } (.variant "Ready")
    | .bool false => AuthRustFragment.eval 63 { context := c } (.variant "Deny")
    | _ => none) = _
  rw [hGuard]
  cases h : AuthGeneratedSubject.evalAggregate c <;>
    simp [AuthRustFragment.eval, AuthGeneratedSubject.evalOperation, h,
      AuthGeneratedSubject.operationSuccess, AuthGeneratedSubject.operationFailure]

theorem rust_operation_eq (c : Context) :
    AuthRustFragment.operation c = some (AuthExprInterpreter.operation c) := by
  rw [AuthTypedPreservation.interpreted_operation_eq]
  simp [AuthRustFragment.operation, rust_operation_eval_eq]

end AuthRustRefinement
