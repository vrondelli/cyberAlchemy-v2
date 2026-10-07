import AuthGeneratedSubject
import AuthGeneratedWrapperIR

namespace AuthWrapperTrace
open AuthGeneratedSubject

-- This fixed trace interpreter consumes source-extracted wrapper actions.
-- It counts only direct calls at TrustedAuthorizationBoundary::authorize's
-- downstream call site; resolver/kernel/downstream internals are opaque.
inductive Decision where
  | allow
  | deny
deriving Repr, DecidableEq

structure Trace where
  result : Decision
  directCalls : List Command
deriving Repr, DecidableEq

def interpretActions : List AuthGeneratedWrapperIR.Action → Command → Decision → Option Trace
  | [], _, _ => none
  | .returnDeny :: _, _, _ => some { result := .deny, directCalls := [] }
  | .callDownstream :: [], candidate, downstreamResult =>
      some { result := downstreamResult, directCalls := [candidate] }
  | .callDownstream :: rest, candidate, downstreamResult => do
      let later ← interpretActions rest candidate downstreamResult
      some { later with directCalls := candidate :: later.directCalls }

def prefixCalls : List AuthGeneratedWrapperIR.Action → Command → Option (List Command)
  | [], _ => some []
  | .callDownstream :: rest, candidate => do
      let later ← prefixCalls rest candidate
      some (candidate :: later)
  | .returnDeny :: _, _ => none

def interpret (branches : AuthGeneratedWrapperIR.Branches) (kernelReady : Bool)
    (candidate : Command) (downstreamResult : Decision) : Option Trace := do
  let beforeMatch ← prefixCalls AuthGeneratedWrapperIR.authorizePrefixActions candidate
  let branch ← if kernelReady then
    interpretActions branches.ready candidate downstreamResult
  else interpretActions branches.deny candidate downstreamResult
  some { branch with directCalls := beforeMatch ++ branch.directCalls }

-- Independent intended trace, not defined in terms of the extracted IR.
def intended (kernelReady : Bool) (candidate : Command)
    (downstreamResult : Decision) : Trace :=
  if kernelReady then { result := downstreamResult, directCalls := [candidate] }
  else { result := .deny, directCalls := [] }

theorem extracted_trace_eq_intended (kernelReady : Bool) (candidate : Command)
    (downstreamResult : Decision) :
    interpret AuthGeneratedWrapperIR.authorizeBranches kernelReady candidate downstreamResult =
      some (intended kernelReady candidate downstreamResult) := by
  cases kernelReady <;> rfl

theorem kernel_deny_no_direct_call (candidate : Command) (downstreamResult : Decision) :
    interpret AuthGeneratedWrapperIR.authorizeBranches false candidate downstreamResult =
      some { result := .deny, directCalls := [] } := by
  exact extracted_trace_eq_intended false candidate downstreamResult

theorem kernel_ready_one_direct_call (candidate : Command) (downstreamResult : Decision) :
    interpret AuthGeneratedWrapperIR.authorizeBranches true candidate downstreamResult =
      some { result := downstreamResult, directCalls := [candidate] } := by
  exact extracted_trace_eq_intended true candidate downstreamResult

end AuthWrapperTrace
