import AuthFolTheoryProof
import AuthFolGeneratedTheoryV3

namespace AuthFolTheoryProofV3

open AuthFolModel

abbrev Decision := AuthFolTheoryProof.Decision

theorem clause5_equivalent (decision : Decision) :
    AuthFolGeneratedTheoryV3.clause5 decision ↔
      AuthFolGeneratedTheory.clause5 decision := by
  simp only [AuthFolGeneratedTheoryV3.clause5,
    AuthFolGeneratedTheory.clause5, and_assoc, and_left_comm, and_comm]

theorem generated_theory_iff_expected (decision : Decision) :
    AuthFolGeneratedTheoryV3.theory decision ↔
      ∀ c, decision c = AuthFolTheoryProof.expectedDecision c := by
  rw [← AuthFolTheoryProof.generated_theory_iff_expected]
  simp only [AuthFolGeneratedTheoryV3.theory,
    AuthFolGeneratedTheory.theory]
  have h1 : AuthFolGeneratedTheoryV3.clause1 decision ↔
      AuthFolGeneratedTheory.clause1 decision := Iff.rfl
  have h2 : AuthFolGeneratedTheoryV3.clause2 decision ↔
      AuthFolGeneratedTheory.clause2 decision := Iff.rfl
  have h3 : AuthFolGeneratedTheoryV3.clause3 decision ↔
      AuthFolGeneratedTheory.clause3 decision := Iff.rfl
  have h4 : AuthFolGeneratedTheoryV3.clause4 decision ↔
      AuthFolGeneratedTheory.clause4 decision := Iff.rfl
  have h6 : AuthFolGeneratedTheoryV3.clause6 decision ↔
      AuthFolGeneratedTheory.clause6 decision := Iff.rfl
  simp only [h1, h2, h3, h4, h6, clause5_equivalent]

theorem expected_satisfies_generated_theory :
    AuthFolGeneratedTheoryV3.theory AuthFolTheoryProof.expectedDecision :=
  (generated_theory_iff_expected AuthFolTheoryProof.expectedDecision).2
    (fun _ => rfl)

theorem selected_operation_satisfies_generated_theory :
    AuthFolGeneratedTheoryV3.theory AuthFolTheoryProof.operationDecision :=
  (generated_theory_iff_expected AuthFolTheoryProof.operationDecision).2
    AuthFolTheoryProof.operation_decision_eq_expected

end AuthFolTheoryProofV3
