module evf_l2_exact_instance

abstract sig Node {}
one sig N0, N1, N2, N3, N4 extends Node {}

fun SelectedEdge : Node -> Node { N1->N3 + N2->N1 + N4->N1 }
fun RequiredSource : set Node { N2 + N4 }
fun Target : one Node { N3 }

fun Reach : Node -> Node { ^SelectedEdge }
pred Violation[r: Node] { r in RequiredSource and Target not in r.Reach }
assert NoViolation { no r: RequiredSource | Violation[r] }
check NoViolation for exactly 5 Node
