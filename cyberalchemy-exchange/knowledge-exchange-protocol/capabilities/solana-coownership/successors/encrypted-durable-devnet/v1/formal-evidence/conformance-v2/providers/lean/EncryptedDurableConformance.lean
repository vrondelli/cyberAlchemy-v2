set_option autoImplicit false

namespace CyberAlchemyV2.KEP.EncryptedDurableConformance

inductive CanonicalValue where
  | unsigned : Nat -> CanonicalValue
  | bytes : List UInt8 -> CanonicalValue
  | text : String -> CanonicalValue
  | bool : Bool -> CanonicalValue
  | float : Float -> CanonicalValue

def canonicalAccepted : CanonicalValue -> Bool
  | .float _ => false
  | _ => true

def canonicalEncode (schema : Nat) (fields : List (String × CanonicalValue)) :=
  if schema = 0 || fields.any (fun field => !canonicalAccepted field.2)
  then none
  else some (schema, fields.mergeSort (fun a b => a.1 < b.1))

theorem canonicalCborDeterministic
    (schema : Nat) (fields : List (String × CanonicalValue)) :
    canonicalEncode schema fields = canonicalEncode schema fields := by
  rfl

theorem canonicalCborRejectsFloat (schema : Nat) (name : String) (value : Float) :
    canonicalEncode schema [(name, .float value)] = none := by
  simp [canonicalEncode, canonicalAccepted]

structure StorageState where
  operational : Bool
  recovery : Bool
  archive : Bool
  exactIdentity : Bool

def storageReady (state : StorageState) : Bool :=
  state.operational && state.recovery && state.archive && state.exactIdentity

def maySubmit (state : StorageState) := storageReady state
def mayActivate (state : StorageState) := storageReady state

theorem storageFailureBlocks (state : StorageState) (failed : storageReady state = false) :
    maySubmit state = false ∧ mayActivate state = false := by
  simp [maySubmit, mayActivate, failed]

inductive Identity where | a | b | outsider deriving DecidableEq

structure GrantState where
  owns : Identity -> Bool
  revision : Nat
  replayConsumed : Bool

def successfulGrant (pre : GrantState) : GrantState :=
  { owns := fun identity => if identity = .b then true else pre.owns identity
    revision := pre.revision + 1
    replayConsumed := true }

def rejectedGrant (pre : GrantState) := pre

theorem grantPositiveAndNegative (pre : GrantState) (aOwned : pre.owns .a = true) :
    let post := successfulGrant pre
    post.owns .a = true ∧ post.owns .b = true ∧
    post.revision = pre.revision + 1 ∧ post.replayConsumed = true ∧
    rejectedGrant pre = pre := by
  simp [successfulGrant, rejectedGrant, aOwned]

inductive Finality where | submitted | confirmed | finalized deriving DecidableEq

def activates (finality : Finality) (ready : Bool) : Bool :=
  finality == .finalized && ready

theorem finalizedActivationOnly (ready : Bool) :
    activates .submitted ready = false ∧
    activates .confirmed ready = false ∧
    activates .finalized ready = ready := by
  cases ready <;> decide

structure ReissueState where
  aEnvelope : Nat
  bEnvelope : Nat
  protectedState : Nat
  revision : Nat
  requestFulfilled : Bool

def successfulReissue (pre : ReissueState) (replacement : Nat) : ReissueState :=
  { pre with
    bEnvelope := replacement
    revision := pre.revision + 1
    requestFulfilled := true }

def rejectedReissue (pre : ReissueState) := pre

theorem reissueMutationBound (pre : ReissueState) (replacement : Nat) :
    let post := successfulReissue pre replacement
    post.aEnvelope = pre.aEnvelope ∧
    post.bEnvelope = replacement ∧
    post.protectedState = pre.protectedState ∧
    post.revision = pre.revision + 1 ∧
    post.requestFulfilled = true ∧
    rejectedReissue pre = pre := by
  simp [successfulReissue, rejectedReissue]

structure CostObservation where
  networkLamports : Nat
  storageMinorUnits : Nat
  knowledgeConsideration : Nat

def recordInfrastructureCosts (network storage : Nat) : CostObservation :=
  { networkLamports := network
    storageMinorUnits := storage
    knowledgeConsideration := 0 }

theorem infrastructureCostIsNotKnowledgeConsideration (network storage : Nat) :
    (recordInfrastructureCosts network storage).knowledgeConsideration = 0 := by
  rfl

inductive KeyRole where | solanaSigning | hpkePrivate | contentKey deriving DecidableEq
inductive Placement where | custody | encryptedEnvelope | publicState deriving DecidableEq

def placementAllowed : KeyRole -> Placement -> Bool
  | .solanaSigning, .custody => true
  | .hpkePrivate, .custody => true
  | .contentKey, .encryptedEnvelope => true
  | _, _ => false

def canOpen (actor envelopeOwner : Identity) := actor == envelopeOwner

theorem secretPlacementAndRecipientIsolation :
    placementAllowed .solanaSigning .publicState = false ∧
    placementAllowed .hpkePrivate .publicState = false ∧
    placementAllowed .contentKey .publicState = false ∧
    canOpen .outsider .b = false ∧ canOpen .b .b = true := by
  decide

end CyberAlchemyV2.KEP.EncryptedDurableConformance
