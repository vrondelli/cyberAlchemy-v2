namespace EVF

def canonicalPair (a b : Nat) : Nat × Nat := (a, b)

-- The arrival-order implementation cannot satisfy even this concrete instance.
theorem canonicalPair_comm : canonicalPair 1 2 = canonicalPair 2 1 := by
  decide

end EVF
