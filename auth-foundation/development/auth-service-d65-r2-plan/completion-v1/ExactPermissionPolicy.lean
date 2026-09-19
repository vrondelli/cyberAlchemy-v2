-- Candidate policy lemmas. Open questions and claim limits: README.md.
-- These lemmas describe exact matching, not arbitrary Rust execution.
namespace AuthFoundation.ExactPermissionPolicy

structure Permission where
  resource : String
  action : String
  scope : String
deriving DecidableEq

def exactGrant (required : Permission) (grants : List Permission) : Bool :=
  grants.any (fun granted => decide (granted = required))

def allowDecision (admissible : Bool) (required : Permission)
    (activeRoleGrants : List Permission) : Bool :=
  admissible && exactGrant required activeRoleGrants

theorem allow_characterization (admissible : Bool) (required : Permission)
    (grants : List Permission) :
    allowDecision admissible required grants = true ↔
      admissible = true ∧ ∃ granted ∈ grants, granted = required := by
  simp [allowDecision, exactGrant, List.any_eq_true]

theorem no_exact_grant_denies (admissible : Bool) (required : Permission)
    (grants : List Permission) (absent : ∀ granted ∈ grants, granted ≠ required) :
    allowDecision admissible required grants = false := by
  have noGrant : exactGrant required grants = false := by
    simp only [exactGrant, List.any_eq_false, decide_eq_true_eq]
    exact absent
  simp [allowDecision, noGrant]

theorem resource_mismatch_denies (admissible : Bool) (required : Permission)
    (grants : List Permission)
    (mismatch : ∀ granted ∈ grants, granted.resource ≠ required.resource) :
    allowDecision admissible required grants = false := by
  apply no_exact_grant_denies
  intro granted member equal
  exact mismatch granted member (congrArg Permission.resource equal)

theorem action_mismatch_denies (admissible : Bool) (required : Permission)
    (grants : List Permission)
    (mismatch : ∀ granted ∈ grants, granted.action ≠ required.action) :
    allowDecision admissible required grants = false := by
  apply no_exact_grant_denies
  intro granted member equal
  exact mismatch granted member (congrArg Permission.action equal)

theorem scope_mismatch_denies (admissible : Bool) (required : Permission)
    (grants : List Permission)
    (mismatch : ∀ granted ∈ grants, granted.scope ≠ required.scope) :
    allowDecision admissible required grants = false := by
  apply no_exact_grant_denies
  intro granted member equal
  exact mismatch granted member (congrArg Permission.scope equal)

end AuthFoundation.ExactPermissionPolicy
