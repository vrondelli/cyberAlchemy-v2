---- MODULE AuthRevocation ----
EXTENDS Naturals
CONSTANT Sessions
VARIABLES status, decision
vars == <<status, decision>>
Statuses == {"active", "revoked", "expired", "superseded"}
Init == /\ status = [s \in Sessions |-> "active"]
        /\ decision = [s \in Sessions |-> "DENY"]
Authorize(s) == /\ decision' = [decision EXCEPT ![s] = IF status[s] = "active" THEN "ALLOW" ELSE "DENY"]
                /\ UNCHANGED status
Invalidate(s, newStatus) == /\ newStatus \in Statuses \ {"active"}
                            /\ status' = [status EXCEPT ![s] = newStatus]
                            /\ decision' = [decision EXCEPT ![s] = "DENY"]
Next == \E s \in Sessions: Authorize(s) \/ Invalidate(s, "revoked") \/ Invalidate(s, "expired") \/ Invalidate(s, "superseded")
Spec == Init /\ [][Next]_vars
InvalidNeverAllows == \A s \in Sessions: status[s] # "active" => decision[s] = "DENY"
TypeOK == /\ status \in [Sessions -> Statuses] /\ decision \in [Sessions -> {"ALLOW", "DENY"}]
====
