set_option autoImplicit false

namespace CyberAlchemyV2.KEP.DeploymentContinuation013

structure ReconciledProgress where
  bufferCreated : Bool
  observedWrites : List Nat
  totalChunks : Nat
  firstUnwritten : Nat
  deriving DecidableEq

structure ContinuationPlan where
  writes : List Nat
  finalDeploySubmissions : Nat
  protocolSubmissions : Nat
  deriving DecidableEq

def expectedPrefix (firstUnwritten : Nat) : List Nat :=
  List.range firstUnwritten

def progressValid (progress : ReconciledProgress) : Bool :=
  progress.bufferCreated &&
  progress.observedWrites == expectedPrefix progress.firstUnwritten &&
  progress.firstUnwritten <= progress.totalChunks

def buildContinuation (progress : ReconciledProgress) : Option ContinuationPlan :=
  if progressValid progress then
    some {
      writes := (List.range (progress.totalChunks - progress.firstUnwritten)).map
        (fun offset => progress.firstUnwritten + offset)
      finalDeploySubmissions := 1
      protocolSubmissions := 0
    }
  else
    none

def exactProgress : ReconciledProgress := {
  bufferCreated := true
  observedWrites := List.range 56
  totalChunks := 128
  firstUnwritten := 56
}

def exactContinuation : ContinuationPlan := {
  writes := (List.range 72).map (fun offset => 56 + offset)
  finalDeploySubmissions := 1
  protocolSubmissions := 0
}

def gappedProgress : ReconciledProgress := {
  exactProgress with observedWrites := (List.range 55)
}

theorem exactProgressProducesContinuation :
    buildContinuation exactProgress = some exactContinuation := by
  native_decide

theorem continuationStartsAtFirstUnwritten :
    exactContinuation.writes.head? = some 56 := by
  native_decide

theorem continuationEndsAtFinalChunk :
    exactContinuation.writes.getLast? = some 127 := by
  native_decide

theorem continuationWritesExactlyOnce :
    exactContinuation.writes.length = 72 ∧
    (exactContinuation.writes.eraseDups).length = 72 := by
  native_decide

theorem continuationDoesNotReplayPrefix :
    exactContinuation.writes.all (fun chunk => 56 <= chunk) = true := by
  native_decide

theorem continuationSubmissionBound :
    exactContinuation.writes.length + exactContinuation.finalDeploySubmissions = 73 ∧
    exactContinuation.protocolSubmissions = 0 := by
  native_decide

theorem gappedPrefixIsRejected :
    buildContinuation gappedProgress = none := by
  native_decide

inductive SemanticEffect where
  | bufferCreate
  | writeChunk (index : Nat)
  | finalDeploy
  deriving DecidableEq

structure DeploymentIdentities where
  payer : Nat
  program : Nat
  buffer : Nat
  deriving DecidableEq

structure ContinuationState where
  prefixVerified : Bool
  finalizedWrites : List Nat
  inFlight : Option SemanticEffect
  ambiguousEffect : Bool
  finalDeployed : Bool
  protocolExecutions : Nat
  deriving DecidableEq

def initialContinuationState : ContinuationState := {
  prefixVerified := false
  finalizedWrites := []
  inFlight := none
  ambiguousEffect := false
  finalDeployed := false
  protocolExecutions := 0
}

def verifiedContinuationState : ContinuationState := {
  initialContinuationState with prefixVerified := true
}

def effectAllowed (state : ContinuationState) (effect : SemanticEffect) : Bool :=
  match effect with
  | .bufferCreate => false
  | .writeChunk index =>
      index == 56 + state.finalizedWrites.length &&
      index < 128
  | .finalDeploy => state.finalizedWrites == exactContinuation.writes

def startEffect (state : ContinuationState) (effect : SemanticEffect) : Option ContinuationState :=
  if state.prefixVerified && !state.ambiguousEffect && state.inFlight.isNone &&
      effectAllowed state effect then
    some { state with inFlight := some effect }
  else
    none

def finalizeEffect (state : ContinuationState) : Option ContinuationState :=
  if state.ambiguousEffect then
    none
  else
    match state.inFlight with
    | none => none
    | some .bufferCreate => none
    | some (.writeChunk index) =>
        some {
          state with
          finalizedWrites := state.finalizedWrites ++ [index]
          inFlight := none
        }
    | some .finalDeploy =>
        if state.finalizedWrites == exactContinuation.writes then
          some { state with inFlight := none, finalDeployed := true }
        else
          none

def markAmbiguous (state : ContinuationState) : ContinuationState :=
  { state with ambiguousEffect := true }

def firstWriteInFlight : ContinuationState := {
  verifiedContinuationState with inFlight := some (.writeChunk 56)
}

def allWritesFinalized : ContinuationState := {
  verifiedContinuationState with finalizedWrites := exactContinuation.writes
}

theorem prefixVerificationRequiredBeforeSigning :
    startEffect initialContinuationState (.writeChunk 56) = none := by
  native_decide

theorem oneContinuationEffectAtATime :
    startEffect firstWriteInFlight (.writeChunk 57) = none := by
  native_decide

theorem ambiguousEffectStopsContinuation :
    startEffect (markAmbiguous firstWriteInFlight) (.writeChunk 57) = none ∧
    finalizeEffect (markAmbiguous firstWriteInFlight) = none := by
  native_decide

theorem finalDeployRejectedBeforeAllWritesFinalize :
    startEffect verifiedContinuationState .finalDeploy = none := by
  native_decide

theorem finalDeployAllowedAfterAllWritesFinalize :
    (startEffect allWritesFinalized .finalDeploy).isSome = true := by
  native_decide

theorem modeledTransitionsPreserveZeroProtocolExecution :
    initialContinuationState.protocolExecutions = 0 ∧
    verifiedContinuationState.protocolExecutions = 0 ∧
    firstWriteInFlight.protocolExecutions = 0 ∧
    allWritesFinalized.protocolExecutions = 0 := by
  native_decide

structure PredecessorRecord where
  recordDigest : String
  effects : List SemanticEffect
  identities : DeploymentIdentities
  deriving DecidableEq

structure SuccessorJournal where
  journalId : String
  predecessorDigest : String
  effects : List SemanticEffect
  signatures : List (SemanticEffect × Nat)
  identities : DeploymentIdentities
  deriving DecidableEq

def exactIdentities : DeploymentIdentities := {
  payer := 101
  program := 202
  buffer := 303
}

def predecessorEffects : List SemanticEffect :=
  .bufferCreate :: (List.range 56).map SemanticEffect.writeChunk

def successorEffects : List SemanticEffect :=
  exactContinuation.writes.map SemanticEffect.writeChunk ++ [.finalDeploy]

def exactPredecessor : PredecessorRecord := {
  recordDigest := "9455a345e5b0840e6d8d3e051f746bae05ff59924020a515b19cfab330ecbdbc"
  effects := predecessorEffects
  identities := exactIdentities
}

def exactSuccessorJournal : SuccessorJournal := {
  journalId := "candidate-013-successor-journal"
  predecessorDigest := exactPredecessor.recordDigest
  effects := successorEffects
  signatures := successorEffects.zip ((List.range successorEffects.length).map (fun index => 1000 + index))
  identities := exactIdentities
}

theorem predecessorRemainsImmutable :
    exactPredecessor.effects = predecessorEffects := by
  rfl

theorem successorJournalIsSeparateAndBoundToPredecessor :
    exactSuccessorJournal.journalId != exactPredecessor.recordDigest ∧
    exactSuccessorJournal.predecessorDigest = exactPredecessor.recordDigest := by
  native_decide

theorem successorHasOneUniqueSignaturePerSemanticEffect :
    exactSuccessorJournal.signatures.length = exactSuccessorJournal.effects.length ∧
    exactSuccessorJournal.signatures.map Prod.fst = exactSuccessorJournal.effects ∧
    (exactSuccessorJournal.signatures.map Prod.snd).eraseDups.length =
      exactSuccessorJournal.effects.length := by
  native_decide

theorem successorEffectsDoNotOverlapPredecessorEffects :
    exactSuccessorJournal.effects.all (fun effect =>
      !exactPredecessor.effects.contains effect) = true := by
  native_decide

theorem deploymentIdentitiesRemainStable :
    exactSuccessorJournal.identities = exactPredecessor.identities := by
  native_decide

end CyberAlchemyV2.KEP.DeploymentContinuation013
