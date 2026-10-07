import Std
import AuthTypedPreservation

/- Candidate finite-occurrence interpretation of the Auth FOL READY condition.
   This file is not yet a checked interpretation of the parsed FOL source. -/
namespace AuthFolOccurrenceBridge

open AuthGeneratedSubject

private theorem nodup_of_snd_nodup {α : Type} (xs : List (α × Nat))
    (h : (xs.map Prod.snd).Nodup) : xs.Nodup := by
  induction xs with
  | nil => simp
  | cons head tail ih =>
      simp only [List.map_cons, List.nodup_cons] at h ⊢
      refine ⟨?_, ih h.2⟩
      intro hm
      exact h.1 (List.mem_map.mpr ⟨head, hm, rfl⟩)

private theorem indexed_nodup {α : Type} (rows : List α) (start : Nat) :
    (rows.zipIdx start).Nodup := by
  apply nodup_of_snd_nodup
  rw [List.zipIdx_map_snd]
  exact List.nodup_range' 1

private theorem indexed_filter_values {α : Type} (rows : List α)
    (start : Nat) (p : α → Bool) :
    ((rows.zipIdx start).filter (fun occ => p occ.1)).map Prod.fst =
      rows.filter p := by
  induction rows generalizing start with
  | nil => rfl
  | cons head tail ih =>
      cases hp : p head <;> simp [List.zipIdx_cons, hp, ih (start + 1)]

private theorem unique_filter_iff {α : Type} (rows : List α)
    (hNodup : rows.Nodup) (p agrees : α → Bool) :
    (∃ x, x ∈ rows ∧ p x = true ∧
        (∀ y, y ∈ rows → p y = true → y = x) ∧ agrees x = true) ↔
      (∃ x, rows.filter p = [x] ∧ agrees x = true) := by
  constructor
  · rintro ⟨x, hx, hp, hunique, hagree⟩
    have hFiltered : x ∈ rows.filter p := List.mem_filter.mpr ⟨hx, hp⟩
    have hFilterNodup : (rows.filter p).Nodup :=
      List.Nodup.sublist List.filter_sublist hNodup
    cases hf : rows.filter p with
    | nil => simp [hf] at hFiltered
    | cons first tail =>
        have hFirstMem : first ∈ rows.filter p := by rw [hf]; simp
        have hFirstQual := List.mem_filter.mp hFirstMem
        have hFirst : first = x :=
          hunique first hFirstQual.1 hFirstQual.2
        cases tail with
        | nil =>
            refine ⟨x, ?_, hagree⟩
            simp [hFirst]
        | cons second rest =>
            have hSecondMem : second ∈ rows.filter p := by rw [hf]; simp
            have hSecondQual := List.mem_filter.mp hSecondMem
            have hSecond : second = x :=
              hunique second hSecondQual.1 hSecondQual.2
            rw [hf] at hFilterNodup
            rw [hFirst, hSecond] at hFilterNodup
            simp at hFilterNodup
  · rintro ⟨x, hf, hagree⟩
    have hx : x ∈ rows ∧ p x = true :=
      List.mem_filter.mp (by simp [hf])
    refine ⟨x, hx.1, hx.2, ?_, hagree⟩
    intro y hy hpy
    have : y ∈ rows.filter p := List.mem_filter.mpr ⟨hy, hpy⟩
    simpa [hf] using this

private theorem indexed_singleton_iff {α : Type} (rows : List α)
    (p agrees : α → Bool) :
    (∃ occ, (rows.zipIdx).filter (fun a => p a.1) = [occ] ∧
        agrees occ.1 = true) ↔
      (∃ row, rows.filter p = [row] ∧ agrees row = true) := by
  constructor
  · rintro ⟨occ, h, ha⟩
    refine ⟨occ.1, ?_, ha⟩
    rw [← indexed_filter_values rows 0 p, h]
    rfl
  · rintro ⟨row, h, ha⟩
    have hm : ((rows.zipIdx).filter (fun a => p a.1)).map Prod.fst = [row] := by
      rw [indexed_filter_values]
      exact h
    cases hf : (rows.zipIdx).filter (fun a => p a.1) with
    | nil => simp [hf] at hm
    | cons occ tail =>
        cases tail with
        | nil =>
            have hv : occ.1 = row := by simpa [hf] using hm
            refine ⟨occ, rfl, ?_⟩
            simpa [hv] using ha
        | cons next rest => simp [hf] at hm

private theorem tagged_nodup {tagType rowType : Type} (tag : tagType)
    (rows : List rowType) (h : rows.Nodup) :
    (rows.map (fun row => (tag, row))).Nodup := by
  induction rows with
  | nil => simp
  | cons head tail ih =>
      have hCons := List.nodup_cons.mp h
      apply List.nodup_cons.mpr
      constructor
      · intro hm
        obtain ⟨row, hrow, hp⟩ := List.mem_map.mp hm
        have heq : head = row := congrArg Prod.snd hp.symm
        exact hCons.1 (heq ▸ hrow)
      · exact ih hCons.2

private theorem tagged_filter {tagType rowType : Type} (tag : tagType)
    (rows : List rowType) (p : rowType → Bool) :
    (rows.map (fun row => (tag, row))).filter (fun occ => p occ.2) =
      (rows.filter p).map (fun row => (tag, row)) := by
  induction rows with
  | nil => rfl
  | cons head tail ih =>
      cases hp : p head <;> simp [hp, ih]

private theorem tagged_singleton_iff {tagType rowType : Type} (tag : tagType)
    (rows : List rowType) (p agrees : rowType → Bool) :
    (∃ occ, (rows.map (fun row => (tag, row))).filter
        (fun a => p a.2) = [occ] ∧ agrees occ.2 = true) ↔
      (∃ row, rows.filter p = [row] ∧ agrees row = true) := by
  constructor
  · rintro ⟨occ, h, ha⟩
    have hm := congrArg (List.map Prod.snd) h
    rw [tagged_filter] at hm
    simp only [List.map_map, List.map_cons, List.map_nil] at hm
    refine ⟨occ.2, ?_, ha⟩
    simpa using hm
  · rintro ⟨row, h, ha⟩
    refine ⟨(tag, row), ?_, ha⟩
    rw [tagged_filter, h]
    rfl

abbrev AuthOccurrence := Context × (Evidence × Nat)
abbrev RouteOccurrence := Context × (RouteBinding × Nat)

def authOccurrences (c : Context) : List AuthOccurrence :=
  (c.authRows.zipIdx).map (fun pos => (c, pos))
def routeOccurrences (c : Context) : List RouteOccurrence :=
  (c.routeRows.zipIdx).map (fun pos => (c, pos))

def authMember (c : Context) (a : AuthOccurrence) : Prop :=
  a ∈ authOccurrences c

def routeMember (c : Context) (r : RouteOccurrence) : Prop :=
  r ∈ routeOccurrences c

def qaFields (c : Context) (a : AuthOccurrence) : Bool :=
  (a.2.1.evidenceRef == c.request.authenticationEvidenceRef) &&
  (!(a.2.1.evidenceRef == "")) && (!(a.2.1.sessionId == "")) &&
  (a.2.1.trusted == true)

def qrFields (c : Context) (r : RouteOccurrence) : Bool :=
  (r.2.1.routeId == c.request.routeId) && (!(r.2.1.routeId == "")) &&
  (!(r.2.1.scopeEvidenceRef == "")) && (r.2.1.complete == true) &&
  (!(r.2.1.permission.resource == "")) &&
  (!(r.2.1.permission.action == "")) &&
  (!(r.2.1.permission.scope == ""))

def qa (c : Context) (a : AuthOccurrence) : Prop :=
  authMember c a ∧ qaFields c a = true

def qr (c : Context) (r : RouteOccurrence) : Prop :=
  routeMember c r ∧ qrFields c r = true

theorem qa_definition (c : Context) (a : AuthOccurrence) :
    qa c a ↔ authMember c a ∧
      a.2.1.evidenceRef = c.request.authenticationEvidenceRef ∧
      a.2.1.evidenceRef ≠ "" ∧ a.2.1.sessionId ≠ "" ∧
      a.2.1.trusted = true := by
  simp [qa, qaFields, Bool.and_eq_true, beq_iff_eq, Bool.and_assoc]

theorem qr_definition (c : Context) (r : RouteOccurrence) :
    qr c r ↔ routeMember c r ∧
      r.2.1.routeId = c.request.routeId ∧ r.2.1.routeId ≠ "" ∧
      r.2.1.scopeEvidenceRef ≠ "" ∧ r.2.1.complete = true ∧
      r.2.1.permission.resource ≠ "" ∧
      r.2.1.permission.action ≠ "" ∧
      r.2.1.permission.scope ≠ "" := by
  simp [qr, qrFields, Bool.and_eq_true, beq_iff_eq, Bool.and_assoc]

def authProvenance (c : Context) (a : AuthOccurrence) : Bool :=
  c.candidate.sessionId == a.2.1.sessionId

def routeProvenance (c : Context) (r : RouteOccurrence) : Bool :=
  (c.candidate.permission.resource == r.2.1.permission.resource) &&
  (c.candidate.permission.action == r.2.1.permission.action) &&
  (c.candidate.permission.scope == r.2.1.permission.scope) &&
  (c.candidate.scopeEvidenceRef == r.2.1.scopeEvidenceRef)

def folReady (c : Context) : Prop :=
  c.request.requestId ≠ "" ∧
  c.candidate.requestId = c.request.requestId ∧
  (∃ a : AuthOccurrence, qa c a ∧
    (∀ a2 : AuthOccurrence, qa c a2 → a2 = a) ∧
    authProvenance c a = true) ∧
  (∃ r : RouteOccurrence, qr c r ∧
    (∀ r2 : RouteOccurrence, qr c r2 → r2 = r) ∧
    routeProvenance c r = true)

private theorem qa_fields_eq (c : Context) (a : AuthOccurrence) :
    qaFields c a = AuthTypedPreservation.authQual c a.2.1 := by
  simp [qaFields, AuthTypedPreservation.authQual, Bool.and_assoc, Bool.and_comm]

private theorem qr_fields_eq (c : Context) (r : RouteOccurrence) :
    qrFields c r = AuthTypedPreservation.routeQual c r.2.1 := by
  simp [qrFields, AuthTypedPreservation.routeQual, Bool.and_assoc, Bool.and_comm]

private theorem string_beq_comm (x y : String) : (x == y) = (y == x) := by
  cases h : (x == y) <;> cases h2 : (y == x) <;> simp_all [beq_iff_eq]

private theorem auth_provenance_eq (c : Context) (a : AuthOccurrence) :
    authProvenance c a = AuthTypedPreservation.authAgree c a.2.1 := by
  simp [authProvenance, AuthTypedPreservation.authAgree, string_beq_comm]

private theorem route_provenance_eq (c : Context) (r : RouteOccurrence) :
    routeProvenance c r = AuthTypedPreservation.routeAgree c r.2.1 := by
  simp [routeProvenance, AuthTypedPreservation.routeAgree, string_beq_comm,
    Bool.and_comm, Bool.and_left_comm]

theorem fol_ready_iff_candidate (c : Context) :
    folReady c ↔ AuthTypedPreservation.candidateMeaning c := by
  unfold folReady qa qr authMember routeMember authOccurrences routeOccurrences
  simp only [and_assoc, and_imp]
  rw [show (∃ a : AuthOccurrence,
      a ∈ (c.authRows.zipIdx).map (fun pos => (c, pos)) ∧ qaFields c a = true ∧
      (∀ a2 : AuthOccurrence,
        a2 ∈ (c.authRows.zipIdx).map (fun pos => (c, pos)) →
        qaFields c a2 = true → a2 = a) ∧
      authProvenance c a = true) ↔
      (∃ row, c.authRows.filter (AuthTypedPreservation.authQual c) = [row] ∧
        AuthTypedPreservation.authAgree c row = true) from ?_]
  · rw [show (∃ r : RouteOccurrence,
        r ∈ (c.routeRows.zipIdx).map (fun pos => (c, pos)) ∧ qrFields c r = true ∧
        (∀ r2 : RouteOccurrence,
          r2 ∈ (c.routeRows.zipIdx).map (fun pos => (c, pos)) →
          qrFields c r2 = true → r2 = r) ∧
        routeProvenance c r = true) ↔
        (∃ row, c.routeRows.filter (AuthTypedPreservation.routeQual c) = [row] ∧
          AuthTypedPreservation.routeAgree c row = true) from ?_]
    · rfl
    · simp only [qr_fields_eq, route_provenance_eq]
      rw [unique_filter_iff
        ((c.routeRows.zipIdx).map (fun pos => (c, pos)))
        (tagged_nodup c (c.routeRows.zipIdx) (indexed_nodup c.routeRows 0))
        (fun r => AuthTypedPreservation.routeQual c r.2.1)
        (fun r => AuthTypedPreservation.routeAgree c r.2.1)]
      rw [tagged_singleton_iff c (c.routeRows.zipIdx)
        (fun r => AuthTypedPreservation.routeQual c r.1)
        (fun r => AuthTypedPreservation.routeAgree c r.1)]
      exact indexed_singleton_iff c.routeRows
        (AuthTypedPreservation.routeQual c) (AuthTypedPreservation.routeAgree c)
  · simp only [qa_fields_eq, auth_provenance_eq]
    rw [unique_filter_iff
      ((c.authRows.zipIdx).map (fun pos => (c, pos)))
      (tagged_nodup c (c.authRows.zipIdx) (indexed_nodup c.authRows 0))
      (fun a => AuthTypedPreservation.authQual c a.2.1)
      (fun a => AuthTypedPreservation.authAgree c a.2.1)]
    rw [tagged_singleton_iff c (c.authRows.zipIdx)
      (fun a => AuthTypedPreservation.authQual c a.1)
      (fun a => AuthTypedPreservation.authAgree c a.1)]
    exact indexed_singleton_iff c.authRows
      (AuthTypedPreservation.authQual c) (AuthTypedPreservation.authAgree c)

theorem fol_ready_iff_operation (c : Context) :
    folReady c ↔ AuthExprInterpreter.operation c = "Ready" := by
  rw [fol_ready_iff_candidate, AuthTypedPreservation.interpreted_operation_ready_iff]

theorem fol_deny_iff_operation (c : Context) :
    ¬ folReady c ↔ AuthExprInterpreter.operation c = "Deny" := by
  rw [fol_ready_iff_candidate, AuthTypedPreservation.interpreted_operation_deny_iff]

end AuthFolOccurrenceBridge
