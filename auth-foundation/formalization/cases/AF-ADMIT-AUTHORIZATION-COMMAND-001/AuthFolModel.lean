import AuthFolOccurrenceBridge

/- Fixed candidate interpretation for the generated six-clause FOL theory.
   Decision is supplied separately; it is not defined by the operation. -/
namespace AuthFolModel

abbrev Context := AuthGeneratedSubject.Context
abbrev AuthOccurrence := AuthFolOccurrenceBridge.AuthOccurrence
abbrev RouteOccurrence := AuthFolOccurrenceBridge.RouteOccurrence

inductive DecisionValue where
  | ready
  | deny
deriving DecidableEq, Repr

def requestID (c : Context) : String := c.request.requestId
def requestedEvidenceRef (c : Context) : String := c.request.authenticationEvidenceRef
def requestedRouteID (c : Context) : String := c.request.routeId
def evidenceRef (a : AuthOccurrence) : String := a.2.1.evidenceRef
def sessionID (a : AuthOccurrence) : String := a.2.1.sessionId
def routeID (r : RouteOccurrence) : String := r.2.1.routeId
def scopeEvidenceRef (r : RouteOccurrence) : String := r.2.1.scopeEvidenceRef
def permissionResource (r : RouteOccurrence) : String := r.2.1.permission.resource
def permissionAction (r : RouteOccurrence) : String := r.2.1.permission.action
def permissionScope (r : RouteOccurrence) : String := r.2.1.permission.scope
def candidateRequestID (c : Context) : String := c.candidate.requestId
def candidateSessionID (c : Context) : String := c.candidate.sessionId
def candidateResource (c : Context) : String := c.candidate.permission.resource
def candidateAction (c : Context) : String := c.candidate.permission.action
def candidateScope (c : Context) : String := c.candidate.permission.scope
def candidateScopeEvidenceRef (c : Context) : String := c.candidate.scopeEvidenceRef

def authMember (c : Context) (a : AuthOccurrence) : Prop :=
  AuthFolOccurrenceBridge.authMember c a
def routeMember (c : Context) (r : RouteOccurrence) : Prop :=
  AuthFolOccurrenceBridge.routeMember c r
def trusted (a : AuthOccurrence) : Prop := a.2.1.trusted = true
def complete (r : RouteOccurrence) : Prop := r.2.1.complete = true
def qa (c : Context) (a : AuthOccurrence) : Prop := AuthFolOccurrenceBridge.qa c a
def qr (c : Context) (r : RouteOccurrence) : Prop := AuthFolOccurrenceBridge.qr c r
def readyCondition (c : Context) : Prop := AuthFolOccurrenceBridge.folReady c

end AuthFolModel
