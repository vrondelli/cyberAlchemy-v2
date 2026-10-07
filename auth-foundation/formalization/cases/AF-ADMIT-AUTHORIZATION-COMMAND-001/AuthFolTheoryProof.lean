import AuthFolGeneratedTheory

namespace AuthFolTheoryProof

open AuthFolModel

abbrev Decision := AuthFolModel.Context → AuthFolModel.DecisionValue

noncomputable def expectedDecision (c : Context) : DecisionValue :=
  by
    classical
    exact if AuthFolOccurrenceBridge.folReady c then .ready else .deny

theorem clause1_valid (decision : Decision) :
    AuthFolGeneratedTheory.clause1 decision := by
  simp [AuthFolGeneratedTheory.clause1]

theorem clause2_valid (decision : Decision) :
    AuthFolGeneratedTheory.clause2 decision := by
  intro d
  cases d <;> simp

theorem clause3_valid (decision : Decision) :
    AuthFolGeneratedTheory.clause3 decision := by
  intro c a
  simpa [AuthFolGeneratedTheory.clause3, AuthFolModel.qa,
    AuthFolModel.authMember, AuthFolModel.evidenceRef,
    AuthFolModel.requestedEvidenceRef, AuthFolModel.sessionID,
    AuthFolModel.trusted, and_assoc] using
    (AuthFolOccurrenceBridge.qa_definition c a)

theorem clause4_valid (decision : Decision) :
    AuthFolGeneratedTheory.clause4 decision := by
  intro c r
  simpa [AuthFolGeneratedTheory.clause4, AuthFolModel.qr,
    AuthFolModel.routeMember, AuthFolModel.routeID,
    AuthFolModel.requestedRouteID, AuthFolModel.scopeEvidenceRef,
    AuthFolModel.complete, AuthFolModel.permissionResource,
    AuthFolModel.permissionAction, AuthFolModel.permissionScope,
    and_assoc] using (AuthFolOccurrenceBridge.qr_definition c r)

theorem clause5_valid (decision : Decision) :
    AuthFolGeneratedTheory.clause5 decision := by
  intro c
  simp only [AuthFolModel.readyCondition, AuthFolModel.requestID,
    AuthFolModel.candidateRequestID, AuthFolModel.candidateSessionID,
    AuthFolModel.sessionID, AuthFolModel.candidateResource,
    AuthFolModel.permissionResource, AuthFolModel.candidateAction,
    AuthFolModel.permissionAction, AuthFolModel.candidateScope,
    AuthFolModel.permissionScope, AuthFolModel.candidateScopeEvidenceRef,
    AuthFolModel.scopeEvidenceRef, AuthFolModel.qa, AuthFolModel.qr]
  simp only [and_assoc]
  constructor
  · intro h
    rcases h with ⟨hId, hRequest, ⟨a, hA, hAU, hAP⟩,
      ⟨r, hR, hRU, hRP⟩⟩
    have hRP' :
        c.candidate.permission.resource = r.2.1.permission.resource ∧
        c.candidate.permission.action = r.2.1.permission.action ∧
        c.candidate.permission.scope = r.2.1.permission.scope ∧
        c.candidate.scopeEvidenceRef = r.2.1.scopeEvidenceRef := by
      simpa [AuthFolOccurrenceBridge.routeProvenance,
        Bool.and_eq_true_iff, beq_iff_eq, and_assoc] using hRP
    rcases hRP' with ⟨hResource, hAction, hScope, hScopeEvidence⟩
    refine ⟨hId, a, r, hA, hR, hAU, hRU, hRequest, ?_, ?_, ?_, ?_, ?_⟩
    · exact beq_iff_eq.mp hAP
    · exact hResource
    · exact hAction
    · exact hScope
    · exact hScopeEvidence
  · rintro ⟨hId, a, r, hA, hR, hAU, hRU, hRequest,
      hSession, hResource, hAction, hScope, hScopeEvidence⟩
    refine ⟨hId, hRequest, ⟨a, hA, hAU, ?_⟩,
      ⟨r, hR, hRU, ?_⟩⟩
    · exact beq_iff_eq.mpr hSession
    · simpa [AuthFolOccurrenceBridge.routeProvenance,
        Bool.and_eq_true_iff, beq_iff_eq, and_assoc] using
        (show c.candidate.permission.resource = r.2.1.permission.resource ∧
          c.candidate.permission.action = r.2.1.permission.action ∧
          c.candidate.permission.scope = r.2.1.permission.scope ∧
          c.candidate.scopeEvidenceRef = r.2.1.scopeEvidenceRef from
            ⟨hResource, hAction, hScope, hScopeEvidence⟩)

theorem generated_theory_iff_expected (decision : Decision) :
    AuthFolGeneratedTheory.theory decision ↔
      ∀ c, decision c = expectedDecision c := by
  constructor
  · intro h c
    have h6 := h.2.2.2.2.2 c
    by_cases hr : AuthFolOccurrenceBridge.folReady c
    · have hd : decision c = .ready := h6.1.mpr hr
      simpa [expectedDecision, hr] using hd
    · have hd : decision c = .deny := h6.2.mpr hr
      simpa [expectedDecision, hr] using hd
  · intro h
    refine ⟨clause1_valid decision, clause2_valid decision,
      clause3_valid decision, clause4_valid decision,
      clause5_valid decision, ?_⟩
    intro c
    rw [h c]
    by_cases hr : AuthFolOccurrenceBridge.folReady c <;>
      simp [expectedDecision,
        AuthFolModel.readyCondition, hr]

theorem expected_satisfies_generated_theory :
    AuthFolGeneratedTheory.theory expectedDecision :=
  (generated_theory_iff_expected expectedDecision).2 (fun _ => rfl)

def operationDecision (c : Context) : DecisionValue :=
  if AuthExprInterpreter.operation c = "Ready" then .ready else .deny

theorem selected_operation_two_outcomes (c : Context) :
    AuthExprInterpreter.operation c = "Ready" ∨
      AuthExprInterpreter.operation c = "Deny" := by
  classical
  by_cases hr : AuthFolOccurrenceBridge.folReady c
  · exact Or.inl ((AuthFolOccurrenceBridge.fol_ready_iff_operation c).mp hr)
  · exact Or.inr ((AuthFolOccurrenceBridge.fol_deny_iff_operation c).mp hr)

theorem operation_decision_eq_expected (c : Context) :
    operationDecision c = expectedDecision c := by
  by_cases hr : AuthFolOccurrenceBridge.folReady c
  · have ho := (AuthFolOccurrenceBridge.fol_ready_iff_operation c).mp hr
    simp [operationDecision, expectedDecision, hr, ho]
  · have ho := (AuthFolOccurrenceBridge.fol_deny_iff_operation c).mp hr
    simp [operationDecision, expectedDecision, hr, ho]

theorem selected_operation_satisfies_generated_theory :
    AuthFolGeneratedTheory.theory operationDecision :=
  (generated_theory_iff_expected operationDecision).2 operation_decision_eq_expected

end AuthFolTheoryProof
