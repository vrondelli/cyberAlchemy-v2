import AuthWrapperTrace
import AuthWrapperQualifiers
import AuthWrapperCandidate
import AuthWrapperMapping
import AuthWrapperAuthorize

open AuthGeneratedSubject

example (kernelReady : Bool) (candidate : Command)
    (downstreamResult : AuthWrapperTrace.Decision) :
    AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches
      kernelReady candidate downstreamResult =
        some (AuthWrapperTrace.intended kernelReady candidate downstreamResult) :=
  AuthWrapperTrace.extracted_trace_eq_intended kernelReady candidate downstreamResult

example (candidate : Command) (downstreamResult : AuthWrapperTrace.Decision) :
    AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches
      false candidate downstreamResult =
        some { result := .deny, directCalls := [] } :=
  AuthWrapperTrace.kernel_deny_no_direct_call candidate downstreamResult

example (candidate : Command) (downstreamResult : AuthWrapperTrace.Decision) :
    AuthWrapperTrace.interpret AuthGeneratedWrapperIR.authorizeBranches
      true candidate downstreamResult =
        some { result := downstreamResult, directCalls := [candidate] } :=
  AuthWrapperTrace.kernel_ready_one_direct_call candidate downstreamResult

example (c : Context) (e : Evidence) :
    AuthWrapperQualifiers.auth c e =
      some (AuthTypedPreservation.authQual c e) :=
  AuthWrapperQualifiers.auth_eq_kernel_qualifier c e

example (c : Context) (r : RouteBinding) :
    AuthWrapperQualifiers.route c r =
      some (AuthTypedPreservation.routeQual c r) :=
  AuthWrapperQualifiers.route_eq_kernel_qualifier c r

example (c : Context) :
    AuthWrapperCandidate.construct c = some (AuthWrapperCandidate.intended c) :=
  AuthWrapperCandidate.construct_eq_intended c

example (c : Context) : AuthWrapperMapping.mapContext c = some c :=
  AuthWrapperMapping.ordered_rows_and_fields_preserved c

example (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding)) :
    AuthWrapperAuthorize.buildContext request authentication bindings =
      some (AuthWrapperAuthorize.expectedContext request authentication bindings) :=
  AuthWrapperAuthorize.build_context_eq request authentication bindings

example (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision) :
    AuthWrapperAuthorize.authorize request authentication bindings downstreamResult =
      some (AuthWrapperTrace.intended
        (evalAggregate (AuthWrapperAuthorize.expectedContext request authentication bindings))
        (AuthWrapperAuthorize.expectedContext request authentication bindings).candidate
        downstreamResult) :=
  AuthWrapperAuthorize.authorize_eq_intended request authentication bindings downstreamResult

example (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision)
    (hDeny : evalAggregate
      (AuthWrapperAuthorize.expectedContext request authentication bindings) = false) :
    AuthWrapperAuthorize.authorize request authentication bindings downstreamResult =
      some { result := .deny, directCalls := [] } :=
  AuthWrapperAuthorize.kernel_deny_zero_direct_calls
    request authentication bindings downstreamResult hDeny

example (request : Request)
    (authentication : Except Unit (List Evidence))
    (bindings : Except Unit (List RouteBinding))
    (downstreamResult : AuthWrapperTrace.Decision)
    (hReady : evalAggregate
      (AuthWrapperAuthorize.expectedContext request authentication bindings) = true) :
    AuthWrapperAuthorize.authorize request authentication bindings downstreamResult =
      some { result := downstreamResult, directCalls :=
        [(AuthWrapperAuthorize.expectedContext request authentication bindings).candidate] } :=
  AuthWrapperAuthorize.kernel_ready_one_direct_call
    request authentication bindings downstreamResult hReady

#print axioms AuthWrapperTrace.extracted_trace_eq_intended
#print axioms AuthWrapperTrace.kernel_deny_no_direct_call
#print axioms AuthWrapperTrace.kernel_ready_one_direct_call
#print axioms AuthWrapperQualifiers.auth_eq_kernel_qualifier
#print axioms AuthWrapperQualifiers.route_eq_kernel_qualifier
#print axioms AuthWrapperCandidate.construct_eq_intended
#print axioms AuthWrapperMapping.ordered_rows_and_fields_preserved
#print axioms AuthWrapperAuthorize.build_context_eq
#print axioms AuthWrapperAuthorize.authorize_eq_intended
#print axioms AuthWrapperAuthorize.kernel_deny_zero_direct_calls
#print axioms AuthWrapperAuthorize.kernel_ready_one_direct_call
