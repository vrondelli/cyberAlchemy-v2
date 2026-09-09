set_option autoImplicit false

namespace CyberAlchemyV2.KnowledgeExchangeProtocol.NoPriceSolanaCoOwnership

universe u v

structure ProtocolState (Identity : Type u) (OperationId : Type v) where
  owns : Identity -> Bool
  envelopeCommitted : Identity -> Bool
  replayConsumed : OperationId -> Bool
  revision : Nat
  knowledgeConsideration : Nat

def successfulGrant
    {Identity : Type u} {OperationId : Type v}
    [DecidableEq Identity] [DecidableEq OperationId]
    (pre : ProtocolState Identity OperationId)
    (recipient : Identity) (operation : OperationId) :
    ProtocolState Identity OperationId :=
  {
    owns := fun identity =>
      if identity = recipient then true else pre.owns identity
    envelopeCommitted := fun identity =>
      if identity = recipient then true else pre.envelopeCommitted identity
    replayConsumed := fun candidate =>
      if candidate = operation then true else pre.replayConsumed candidate
    revision := pre.revision + 1
    knowledgeConsideration := pre.knowledgeConsideration
  }

def rejectedGrant
    {Identity : Type u} {OperationId : Type v}
    (pre : ProtocolState Identity OperationId) :
    ProtocolState Identity OperationId := pre

def coreGrantClaim
    {Identity : Type u} {OperationId : Type v}
    [DecidableEq Identity] [DecidableEq OperationId]
    (pre : ProtocolState Identity OperationId)
    (grantor recipient : Identity) (operation : OperationId) : Prop :=
  -- DOMAINSPEC-CANONICAL-PROPOSITION-BEGIN
  ((pre.owns grantor = true /\
    pre.owns recipient = false /\
    grantor ≠ recipient /\
    pre.knowledgeConsideration = 0) ->
    let post := successfulGrant pre recipient operation
    post.owns grantor = true /\
    post.owns recipient = true /\
    post.envelopeCommitted recipient = true /\
    post.replayConsumed operation = true /\
    post.revision = pre.revision + 1 /\
    post.knowledgeConsideration = 0) /\
  rejectedGrant pre = pre
  -- DOMAINSPEC-CANONICAL-PROPOSITION-END

theorem coreGrantClaim_of_model
    {Identity : Type u} {OperationId : Type v}
    [DecidableEq Identity] [DecidableEq OperationId]
    (pre : ProtocolState Identity OperationId)
    (grantor recipient : Identity) (operation : OperationId) :
    coreGrantClaim pre grantor recipient operation := by
  constructor
  · intro hypotheses
    rcases hypotheses with ⟨grantorOwned, recipientAbsent, distinct, noPrice⟩
    simp [successfulGrant, grantorOwned, distinct, noPrice]
  · rfl

end CyberAlchemyV2.KnowledgeExchangeProtocol.NoPriceSolanaCoOwnership
