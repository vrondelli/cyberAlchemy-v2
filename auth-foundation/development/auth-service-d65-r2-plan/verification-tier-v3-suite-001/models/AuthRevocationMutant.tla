---- MODULE AuthRevocationMutant ----
EXTENDS Naturals
CONSTANT Sessions
VARIABLES status, decision
vars == <<status, decision>>
Statuses == {"active", "revoked", "expired", "superseded"}
Init == /\ status = [s \in Sessions |-> "active"]
        /\ decision = [s \in Sessions |-> "DENY"]
Authorize(s) == /\ decision' = [decision EXCEPT ![s] = "ALLOW"]
                /\ UNCHANGED status
Invalidate(s, newStatus) == /\ newStatus \in Statuses \ {"active"}
                            /\ status' = [status EXCEPT ![s] = newStatus]
                            /\ UNCHANGED decision
Next == \E s \in Sessions: Authorize(s) \/ Invalidate(s, "revoked") \/ Invalidate(s, "expired") \/ Invalidate(s, "superseded")
Spec == Init /\ [][Next]_vars
InvalidNeverAllows == \A s \in Sessions: status[s] # "active" => decision[s] = "DENY"
TypeOK == /\ status \in [Sessions -> Statuses] /\ decision \in [Sessions -> {"ALLOW", "DENY"}]
====
