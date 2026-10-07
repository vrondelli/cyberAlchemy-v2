import Std
import AuthGeneratedSubject

namespace AuthExprInterpreter
open AuthGeneratedSubject

-- Fixed interpreter for the source-derived AST. Unknown paths, types, scopes,
-- selectors and exhausted fuel remain errors through `not`; only the final
-- Operation boundary turns an error into Deny. This module is not generated.
inductive Value where
  | string (value : String)
  | bool (value : Bool)
  | context (value : Context)
  | request (value : Request)
  | command (value : Command)
  | permission (value : Permission)
  | evidence (value : Evidence)
  | route (value : RouteBinding)
  | evidenceRows (value : List Evidence)
  | routeRows (value : List RouteBinding)

structure Env where
  context : Context
  evidence : Option Evidence := none
  binding : Option RouteBinding := none

def root (env : Env) (name : String) : Option Value :=
  if name == "context" then some (.context env.context)
  else if name == "evidence" then env.evidence.map Value.evidence
  else if name == "binding" then env.binding.map Value.route
  else none

def field : Value → String → Option Value
  | .context c, "AUTH-CB-CONTEXT#request" => some (.request c.request)
  | .context c, "AUTH-CB-CONTEXT#candidate_command" => some (.command c.candidate)
  | .context c, "AUTH-CB-CONTEXT#resolved_authentication_evidence" => some (.evidenceRows c.authRows)
  | .context c, "AUTH-CB-CONTEXT#resolved_route_bindings" => some (.routeRows c.routeRows)
  | .request r, "AUTH-CB-BOUNDARY-REQUEST#request_id" => some (.string r.requestId)
  | .request r, "AUTH-CB-BOUNDARY-REQUEST#authentication_evidence_ref" => some (.string r.authenticationEvidenceRef)
  | .request r, "AUTH-CB-BOUNDARY-REQUEST#route_id" => some (.string r.routeId)
  | .command c, "AUTH-CB-AUTHORIZATION-COMMAND#request_id" => some (.string c.requestId)
  | .command c, "AUTH-CB-AUTHORIZATION-COMMAND#session_id" => some (.string c.sessionId)
  | .command c, "AUTH-CB-AUTHORIZATION-COMMAND#required_permission" => some (.permission c.permission)
  | .command c, "AUTH-CB-AUTHORIZATION-COMMAND#scope_evidence_ref" => some (.string c.scopeEvidenceRef)
  | .permission p, "AUTH-CB-PERMISSION#resource" => some (.string p.resource)
  | .permission p, "AUTH-CB-PERMISSION#action" => some (.string p.action)
  | .permission p, "AUTH-CB-PERMISSION#scope" => some (.string p.scope)
  | .evidence e, "AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#evidence_ref" => some (.string e.evidenceRef)
  | .evidence e, "AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#session_id" => some (.string e.sessionId)
  | .evidence e, "AUTH-CB-AUTHENTICATED-SESSION-EVIDENCE#trusted" => some (.bool e.trusted)
  | .route r, "AUTH-CB-ROUTE-AUTHORIZATION-BINDING#route_id" => some (.string r.routeId)
  | .route r, "AUTH-CB-ROUTE-AUTHORIZATION-BINDING#required_permission" => some (.permission r.permission)
  | .route r, "AUTH-CB-ROUTE-AUTHORIZATION-BINDING#scope_evidence_ref" => some (.string r.scopeEvidenceRef)
  | .route r, "AUTH-CB-ROUTE-AUTHORIZATION-BINDING#complete" => some (.bool r.complete)
  | _, _ => none

def fields : Value → List String → Option Value
  | value, [] => some value
  | value, name :: rest => do
      let next ← field value name
      fields next rest

def term (env : Env) : AuthTerm → Option Value
  | .string s => some (.string s)
  | .bool b => some (.bool b)
  | .path name properties => do
      let value ← root env name
      fields value properties

def scalarEq : Value → Value → Option Bool
  | .string a, .string b => some (a == b)
  | .bool a, .bool b => some (a == b)
  | _, _ => none

-- Fuel is consumed only by AST/rule-reference descent. List rows each receive
-- the same remaining fuel, so arbitrary finite resolver multiplicity is in
-- the theorem domain. The checked selected graph has maximum expanded depth 7.
def eval : Nat → Env → AuthExpr → Option Bool
  | 0, _, _ => none
  | fuel + 1, env, expression =>
    match expression with
    | .eq left right => do
        let a ← term env left
        let b ← term env right
        scalarEq a b
    | .not inner => (eval fuel env inner).map (!·)
    | .all parts => do
        let values ← parts.mapM (eval fuel env)
        some (values.all id)
    | .exactlyOne binder collection where_ =>
        if binder == "evidence" then
          match term env collection with
          | some (.evidenceRows rows) => do
              let values ← rows.mapM (fun row => eval fuel { env with evidence := some row } where_)
              some ((values.filter id).length == 1)
          | _ => none
        else if binder == "binding" then
          match term env collection with
          | some (.routeRows rows) => do
              let values ← rows.mapM (fun row => eval fuel { env with binding := some row } where_)
              some ((values.filter id).length == 1)
          | _ => none
        else none
    | .existsOne binder collection where_ =>
        if binder == "evidence" then
          match term env collection with
          | some (.evidenceRows rows) => do
              let values ← rows.mapM (fun row => eval fuel { env with evidence := some row } where_)
              some (values.any id)
          | _ => none
        else if binder == "binding" then
          match term env collection with
          | some (.routeRows rows) => do
              let values ← rows.mapM (fun row => eval fuel { env with binding := some row } where_)
              some (values.any id)
          | _ => none
        else none
    | .ruleRef selector parameter argument =>
        if parameter != "context" then none
        else match term env argument with
          | some (.context context) =>
              let next : Env := { context }
              if selector == "auth-command-boundary:unique-trusted-authentication-evidence" then
                eval fuel next auth
              else if selector == "auth-command-boundary:unique-complete-route-binding" then
                eval fuel next route
              else if selector == "auth-command-boundary:candidate-command-provenance" then
                eval fuel next provenance
              else none
          | _ => none

def rule (fuel : Nat) (selector : String) (context : Context) : Option Bool :=
  let env : Env := { context }
  if selector == "auth-command-boundary:unique-trusted-authentication-evidence" then eval fuel env auth
  else if selector == "auth-command-boundary:unique-complete-route-binding" then eval fuel env route
  else if selector == "auth-command-boundary:candidate-command-provenance" then eval fuel env provenance
  else if selector == "auth-command-boundary:command-boundary-admissible" then eval fuel env aggregate
  else none

def operation (context : Context) : String :=
  match rule 8 operationGuard context with
  | some true => operationSuccess
  | some false => operationFailure
  | none => operationFailure

end AuthExprInterpreter
