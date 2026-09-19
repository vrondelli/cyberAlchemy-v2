---- MODULE UnfairCounter ----
EXTENDS Naturals
CONSTANT Max
VARIABLE x
Init == x = 0
Next == \/ /\ x < Max
           /\ x' = x + 1
        \/ /\ x = Max
           /\ UNCHANGED x
Spec == Init /\ [][Next]_x
Bounds == x \in 0..Max
EventuallyDone == <>(x = Max)
====
