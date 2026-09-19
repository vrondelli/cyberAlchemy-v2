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

end AuthFoundation.ExactSessionRolePermission
