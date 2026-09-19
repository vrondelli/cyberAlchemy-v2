namespace AuthFoundation.ExactSessionRolePermission

inductive AuthorizationDecision where
  | allow
  | deny
deriving DecidableEq

structure Signature where
  AuthorizationRequest : Type
  Session : Type
  Role : Type
  Permission : Type
  DecisionTime : Type
  AuthorizationRevision : Type
  Decision : AuthorizationRequest -> AuthorizationDecision
  decisionTime : AuthorizationRequest -> DecisionTime
  currentAuthorizationRevision : AuthorizationRequest -> AuthorizationRevision
  requiredPermission : AuthorizationRequest -> Permission
  authorizationAdmissible :
    AuthorizationRequest -> Session -> DecisionTime -> AuthorizationRevision -> Prop
  resolvedActiveRole : Session -> Role -> Prop
  grants : Role -> Permission -> Prop
  permissionExactEqual : Permission -> Permission -> Prop

def exactSessionRolePermission (s : Signature) : Prop :=
  -- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN
  (forall q : s.AuthorizationRequest,
    ((s.Decision q = .allow) <->
      exists session : s.Session, exists role : s.Role, exists permission : s.Permission,
        s.authorizationAdmissible q session (s.decisionTime q)
          (s.currentAuthorizationRevision q) /\
        s.resolvedActiveRole session role /\
        s.grants role permission /\
        s.permissionExactEqual permission (s.requiredPermission q)) /\
    ((s.Decision q = .deny) <->
      Not (exists session : s.Session, exists role : s.Role, exists permission : s.Permission,
        s.authorizationAdmissible q session (s.decisionTime q)
          (s.currentAuthorizationRevision q) /\
        s.resolvedActiveRole session role /\
        s.grants role permission /\
        s.permissionExactEqual permission (s.requiredPermission q)))) /\
  (exists request : s.AuthorizationRequest, exists session : s.Session,
    exists role : s.Role, exists permission : s.Permission,
      s.authorizationAdmissible request session (s.decisionTime request)
        (s.currentAuthorizationRevision request) /\
      s.resolvedActiveRole session role /\
      s.grants role permission /\
      s.permissionExactEqual permission (s.requiredPermission request)) /\
  (exists request : s.AuthorizationRequest, exists session : s.Session,
    s.authorizationAdmissible request session (s.decisionTime request)
      (s.currentAuthorizationRevision request) /\
    Not (exists role : s.Role, exists permission : s.Permission,
      s.resolvedActiveRole session role /\
      s.grants role permission /\
      s.permissionExactEqual permission (s.requiredPermission request))) /\
  (exists request : s.AuthorizationRequest,
    Not (exists session : s.Session,
      s.authorizationAdmissible request session (s.decisionTime request)
        (s.currentAuthorizationRevision request)))
  -- DOMAINSPEC-CANONICAL-PROPOSITION-END

def authorizationEvidence (s : Signature) (q : s.AuthorizationRequest) : Prop :=
  exists session : s.Session, exists role : s.Role, exists permission : s.Permission,
    s.authorizationAdmissible q session (s.decisionTime q)
      (s.currentAuthorizationRevision q) /\
    s.resolvedActiveRole session role /\
    s.grants role permission /\
    s.permissionExactEqual permission (s.requiredPermission q)

structure AuthorizationLaws (s : Signature) : Prop where
  decisionCharacterization : forall q : s.AuthorizationRequest,
    ((s.Decision q = .allow) <-> authorizationEvidence s q) /\
    ((s.Decision q = .deny) <-> Not (authorizationEvidence s q))
  permittedCase : exists request : s.AuthorizationRequest,
    authorizationEvidence s request
  admissibleWithoutRoleCase :
    exists request : s.AuthorizationRequest, exists session : s.Session,
      s.authorizationAdmissible request session (s.decisionTime request)
        (s.currentAuthorizationRevision request) /\
      Not (exists role : s.Role, exists permission : s.Permission,
        s.resolvedActiveRole session role /\
        s.grants role permission /\
        s.permissionExactEqual permission (s.requiredPermission request))
  inadmissibleCase :
    exists request : s.AuthorizationRequest,
      Not (exists session : s.Session,
        s.authorizationAdmissible request session (s.decisionTime request)
          (s.currentAuthorizationRevision request))

theorem exactSessionRolePermission_of_laws
    (s : Signature) (laws : AuthorizationLaws s) :
    exactSessionRolePermission s := by
  unfold exactSessionRolePermission
  constructor
  · intro q
    simpa only [authorizationEvidence] using laws.decisionCharacterization q
  constructor
  · simpa only [authorizationEvidence] using laws.permittedCase
  constructor
  · exact laws.admissibleWithoutRoleCase
  · exact laws.inadmissibleCase

inductive ReferenceRequest where
  | valid
  | missingRole
  | invalidSession
deriving DecidableEq

inductive ReferenceSession where
  | active
  | roleless
deriving DecidableEq

inductive ReferenceRole where
  | administrator
deriving DecidableEq

inductive ReferencePermission where
  | read
deriving DecidableEq

def referenceDecision : ReferenceRequest -> AuthorizationDecision
  | .valid => .allow
  | .missingRole => .deny
  | .invalidSession => .deny

def referenceAuthorizationAdmissible
    (request : ReferenceRequest) (session : ReferenceSession)
    (_ : Unit) (_ : Unit) : Prop :=
  match request, session with
  | .valid, .active => True
  | .missingRole, .roleless => True
  | _, _ => False

def referenceResolvedActiveRole
    (session : ReferenceSession) (role : ReferenceRole) : Prop :=
  match session, role with
  | .active, .administrator => True
  | _, _ => False

def referenceGrants
    (role : ReferenceRole) (permission : ReferencePermission) : Prop :=
  match role, permission with
  | .administrator, .read => True

def referencePermissionExactEqual
    (permission required : ReferencePermission) : Prop :=
  permission = required

def referenceSignature : Signature where
  AuthorizationRequest := ReferenceRequest
  Session := ReferenceSession
  Role := ReferenceRole
  Permission := ReferencePermission
  DecisionTime := Unit
  AuthorizationRevision := Unit
  Decision := referenceDecision
  decisionTime := fun _ => ()
  currentAuthorizationRevision := fun _ => ()
  requiredPermission := fun _ => .read
  authorizationAdmissible := referenceAuthorizationAdmissible
  resolvedActiveRole := referenceResolvedActiveRole
  grants := referenceGrants
  permissionExactEqual := referencePermissionExactEqual

private theorem referenceValidEvidence :
    authorizationEvidence referenceSignature .valid := by
  refine ⟨.active, .administrator, .read, ?_⟩
  simp [referenceSignature, referenceAuthorizationAdmissible,
    referenceResolvedActiveRole, referenceGrants, referencePermissionExactEqual]

private theorem referenceMissingRoleNoEvidence :
    Not (authorizationEvidence referenceSignature .missingRole) := by
  intro evidence
  rcases evidence with ⟨session, role, permission, admissible, resolved, _⟩
  cases session <;> cases role <;> cases permission <;>
    simp [referenceSignature, referenceAuthorizationAdmissible,
      referenceResolvedActiveRole] at admissible resolved

private theorem referenceInvalidSessionNoEvidence :
    Not (authorizationEvidence referenceSignature .invalidSession) := by
  intro evidence
  rcases evidence with ⟨session, role, permission, admissible, _⟩
  cases session <;> cases role <;> cases permission <;>
    simp [referenceSignature, referenceAuthorizationAdmissible] at admissible

private theorem referenceDecisionCharacterization :
    forall q : referenceSignature.AuthorizationRequest,
      ((referenceSignature.Decision q = .allow) <->
        authorizationEvidence referenceSignature q) /\
      ((referenceSignature.Decision q = .deny) <->
        Not (authorizationEvidence referenceSignature q)) := by
  intro request
  cases request with
  | valid =>
      constructor
      · constructor
        · intro _
          exact referenceValidEvidence
        · intro _
          rfl
      · constructor
        · intro impossible
          cases impossible
        · intro noEvidence
          exact False.elim (noEvidence referenceValidEvidence)
  | missingRole =>
      constructor
      · constructor
        · intro impossible
          cases impossible
        · intro evidence
          exact False.elim (referenceMissingRoleNoEvidence evidence)
      · constructor
        · intro _
          exact referenceMissingRoleNoEvidence
        · intro _
          rfl
  | invalidSession =>
      constructor
      · constructor
        · intro impossible
          cases impossible
        · intro evidence
          exact False.elim (referenceInvalidSessionNoEvidence evidence)
      · constructor
        · intro _
          exact referenceInvalidSessionNoEvidence
        · intro _
          rfl

theorem referenceAuthorizationLaws : AuthorizationLaws referenceSignature := by
  constructor
  · exact referenceDecisionCharacterization
  · exact Exists.intro .valid referenceValidEvidence
  · refine ⟨.missingRole, .roleless, ?_, ?_⟩
    · simp [referenceSignature, referenceAuthorizationAdmissible]
    · intro roleEvidence
      apply referenceMissingRoleNoEvidence
      rcases roleEvidence with ⟨role, permission, resolved, grants, exactPermission⟩
      exact ⟨.roleless, role, permission, by
        simp [referenceSignature, referenceAuthorizationAdmissible],
        resolved, grants, exactPermission⟩
  · refine Exists.intro .invalidSession ?_
    intro sessionEvidence
    rcases sessionEvidence with ⟨session, admissible⟩
    cases session <;> simp [referenceSignature, referenceAuthorizationAdmissible] at admissible

theorem referenceModelSatisfies :
    exactSessionRolePermission referenceSignature :=
  exactSessionRolePermission_of_laws referenceSignature referenceAuthorizationLaws

end AuthFoundation.ExactSessionRolePermission
