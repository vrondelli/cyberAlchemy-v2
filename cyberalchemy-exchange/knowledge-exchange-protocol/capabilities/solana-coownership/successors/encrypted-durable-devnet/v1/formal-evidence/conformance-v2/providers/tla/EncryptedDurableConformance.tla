---------------- MODULE EncryptedDurableConformance ----------------
EXTENDS Naturals, FiniteSets, TLC

CONSTANTS A, B, Outsider, Operational, Recovery, Archive,
          Submitted, Confirmed, Finalized

Identities == {A, B, Outsider}
Layers == {Operational, Recovery, Archive}
Finalities == {Submitted, Confirmed, Finalized}

VARIABLES owners, readyLayers, finality, revision, replay,
          requestPending, active, bEnvelope, protectedState,
          knowledgeConsideration, reconciliationRequired, lastCase

vars == <<owners, readyLayers, finality, revision, replay,
          requestPending, active, bEnvelope, protectedState,
          knowledgeConsideration, reconciliationRequired, lastCase>>

FailureCases == {"storage-missing", "storage-corrupt", "grant-unauthorized",
  "grant-stale", "grant-replay", "activation-not-finalized",
  "request-outsider", "reissue-stale", "reissue-replay",
  "recipient-mismatch"}

Init == /\ owners = {A}
        /\ readyLayers = {}
        /\ finality = Submitted
        /\ revision = 0
        /\ replay = {}
        /\ requestPending = FALSE
        /\ active = FALSE
        /\ bEnvelope = 0
        /\ protectedState = 0
        /\ knowledgeConsideration = 0
        /\ reconciliationRequired = FALSE
        /\ lastCase = "init"

WriteLayer ==
  \E layer \in Layers \ readyLayers:
    /\ readyLayers' = readyLayers \cup {layer}
    /\ UNCHANGED <<owners, finality, revision, replay, requestPending,
                    active, bEnvelope, protectedState, knowledgeConsideration,
                    reconciliationRequired, lastCase>>

GrantSuccess ==
  /\ readyLayers = Layers
  /\ B \notin owners
  /\ revision < 3
  /\ "grant" \notin replay
  /\ owners' = owners \cup {B}
  /\ revision' = revision + 1
  /\ replay' = replay \cup {"grant"}
  /\ lastCase' = "grant-success"
  /\ UNCHANGED <<readyLayers, finality, requestPending, active,
                  bEnvelope, protectedState, knowledgeConsideration,
                  reconciliationRequired>>

AdvanceFinality ==
  /\ finality # Finalized
  /\ finality' = IF finality = Submitted THEN Confirmed ELSE Finalized
  /\ lastCase' = "finality-advance"
  /\ UNCHANGED <<owners, readyLayers, revision, replay, requestPending,
                  active, bEnvelope, protectedState, knowledgeConsideration,
                  reconciliationRequired>>

Activate ==
  /\ finality = Finalized
  /\ readyLayers = Layers
  /\ active' = TRUE
  /\ lastCase' = "activation-success"
  /\ UNCHANGED <<owners, readyLayers, finality, revision, replay,
                  requestPending, bEnvelope, protectedState,
                  knowledgeConsideration, reconciliationRequired>>

RequestReissue ==
  /\ B \in owners
  /\ ~requestPending
  /\ requestPending' = TRUE
  /\ replay' = replay \cup {"request"}
  /\ lastCase' = "request-success"
  /\ UNCHANGED <<owners, readyLayers, finality, revision, active,
                  bEnvelope, protectedState, knowledgeConsideration,
                  reconciliationRequired>>

FulfillReissue ==
  /\ requestPending
  /\ readyLayers = Layers
  /\ revision < 3
  /\ "fulfill" \notin replay
  /\ bEnvelope' = bEnvelope + 1
  /\ revision' = revision + 1
  /\ requestPending' = FALSE
  /\ replay' = replay \cup {"fulfill"}
  /\ lastCase' = "reissue-success"
  /\ UNCHANGED <<owners, readyLayers, finality, active,
                  protectedState, knowledgeConsideration,
                  reconciliationRequired>>

RejectedFailure ==
  \E failure \in FailureCases:
    /\ lastCase # failure
    /\ lastCase' = failure
    /\ reconciliationRequired' = TRUE
    /\ UNCHANGED <<owners, readyLayers, finality, revision, replay,
                    requestPending, active, bEnvelope, protectedState,
                    knowledgeConsideration>>

Next == WriteLayer \/ GrantSuccess \/ AdvanceFinality \/ Activate \/
        RequestReissue \/ FulfillReissue \/ RejectedFailure

Spec == Init /\ [][Next]_vars

TypeOK == /\ owners \subseteq Identities
          /\ readyLayers \subseteq Layers
          /\ finality \in Finalities
          /\ revision \in 0..3
          /\ replay \subseteq {"grant", "request", "fulfill"}
          /\ requestPending \in BOOLEAN
          /\ active \in BOOLEAN
          /\ bEnvelope \in 0..3
          /\ protectedState = 0
          /\ knowledgeConsideration = 0
          /\ reconciliationRequired \in BOOLEAN
          /\ lastCase \in FailureCases \cup {"init", "grant-success",
               "finality-advance", "activation-success", "request-success",
               "reissue-success"}

OriginatorPreserved == A \in owners
AtMostRecipientAdded == owners \subseteq {A, B}
ActivationSafe == active => (finality = Finalized /\ readyLayers = Layers)
SecretFreePublicModel == protectedState = 0
NoKnowledgeConsideration == knowledgeConsideration = 0

=============================================================================
