namespace EVF

def canonicalPair (a b : Nat) : Nat × Nat := (min a b, max a b)

theorem canonicalPair_comm (a b : Nat) :
    canonicalPair a b = canonicalPair b a := by
  apply Prod.ext
  · exact Nat.min_comm a b
  · exact Nat.max_comm a b

end EVF
