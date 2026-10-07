import AuthGeneratedWrapperIR
import AuthGeneratedSubject
import AuthWrapperCandidate
import AuthWrapperMapping
import AuthWrapperTrace
import AuthRustRefinement

namespace AuthWrapperAuthorize
open AuthGeneratedSubject

-- `Except Unit` models the resolver's normal `Ok`/`Err` returns. It does not
-- model effects within resolver implementations, panics or nontermination.
def resolved {α : Type} : Except Unit (List α) → List α
  | .ok rows => rows
  | .error _ => []

def fromResolver {α : Type} (defaultOnError : Bool)
    (result : Except Unit (List α)) : Option (List α) :=
  match result with
  | .ok rows => some rows
  | .error _ => if defaultOnError then some [] else none

def seed (request : Request) (authRows : List Evidence)
    (routeRows : List RouteBinding) : Context :=
  { request, authRows, routeRows, candidate := AuthWrapperCandidate.blank }

def expectedContext (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding)) : Context :=
  let base := seed request (resolved authentication) (resolved bindings)
  { base with candidate := AuthWrapperCandidate.intended base }

-- Parsed resolver-default flags, qualifier/constructor descriptors and
-- parsed context/mapper descriptors are consumed in this exact order.
def buildContext (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding)) : Option Context := do
  let authRows ← fromResolver AuthGeneratedWrapperIR.authResolverDefault authentication
  let routeRows ← fromResolver AuthGeneratedWrapperIR.routeResolverDefault bindings
  let base := seed request authRows routeRows
  let candidate ← AuthWrapperCandidate.construct base
  AuthWrapperMapping.mapContext { base with candidate }

theorem build_context_eq (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding)) :
    buildContext request authentication bindings =
      some (expectedContext request authentication bindings) := by
  cases authentication <;> cases bindings <;>
    simp [buildContext, fromResolver, AuthGeneratedWrapperIR.authResolverDefault,
      AuthGeneratedWrapperIR.routeResolverDefault, expectedContext, resolved,
      AuthWrapperCandidate.construct_eq_intended,
      AuthWrapperMapping.ordered_rows_and_fields_preserved]

def kernelReady (c : Context) : Option Bool := do
  let decision ← AuthRustFragment.operation c
  if decision == "Ready" then some true
  else if decision == "Deny" then some false
  else none

theorem selected_kernel_ready_eq (c : Context) :
    kernelReady c = some (AuthGeneratedSubject.evalAggregate c) := by
  unfold kernelReady
  rw [AuthRustRefinement.rust_operation_eq,
    AuthTypedPreservation.interpreted_operation_eq]
  cases h : AuthGeneratedSubject.evalAggregate c <;>
    simp [AuthGeneratedSubject.evalOperation, h,
      AuthGeneratedSubject.operationSuccess, AuthGeneratedSubject.operationFailure]

def authorize (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision) : Option AuthWrapperTrace.Trace := do
  let context ← buildContext request authentication bindings
  let ready ← kernelReady context
  AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches
    ready context.candidate downstreamResult

theorem authorize_eq_intended (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision) :
    authorize request authentication bindings downstreamResult =
      some (AuthWrapperTrace.intended
        (AuthGeneratedSubject.evalAggregate
          (expectedContext request authentication bindings))
        (expectedContext request authentication bindings).candidate
        downstreamResult) := by
  simp [authorize, build_context_eq, selected_kernel_ready_eq,
    AuthWrapperTrace.extracted_trace_eq_intended]

theorem kernel_deny_zero_direct_calls (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision)
    (hDeny : AuthGeneratedSubject.evalAggregate
      (expectedContext request authentication bindings) = false) :
    authorize request authentication bindings downstreamResult =
      some { result := .deny, directCalls := [] } := by
  rw [authorize_eq_intended, hDeny]
  rfl

theorem kernel_ready_one_direct_call (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision)
    (hReady : AuthGeneratedSubject.evalAggregate
      (expectedContext request authentication bindings) = true) :
    authorize request authentication bindings downstreamResult =
      some { result := downstreamResult, directCalls :=
        [(expectedContext request authentication bindings).candidate] } := by
  rw [authorize_eq_intended, hReady]
  rfl

end AuthWrapperAuthorize
