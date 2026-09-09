module EncryptedDurableConformance

abstract sig Identity {}
one sig A, B, Outsider extends Identity {}

abstract sig KeyRole {}
one sig SolanaSigningKey, HpkePrivateKey, ContentKey extends KeyRole {}

sig State {
  owners: set Identity,
  aEnvelope: one Int,
  bEnvelope: one Int,
  protectedState: one Int,
  revision: one Int,
  requestPending: one Int,
  publicSecrets: set KeyRole,
  knowledgeConsideration: one Int
}

pred Init[s: State] {
  s.owners = A
  s.revision = 0
  s.requestPending = 0
  no s.publicSecrets
  s.knowledgeConsideration = 0
}

pred Grant[pre, post: State] {
  pre.owners = A
  post.owners = A + B
  post.revision = add[pre.revision, 1]
  post.aEnvelope = pre.aEnvelope
  post.protectedState = pre.protectedState
  post.publicSecrets = pre.publicSecrets
  post.knowledgeConsideration = pre.knowledgeConsideration
}

pred Reissue[pre, post: State] {
  pre.owners = A + B
  pre.knowledgeConsideration = 0
  post.owners = pre.owners
  post.aEnvelope = pre.aEnvelope
  post.bEnvelope != pre.bEnvelope
  post.protectedState = pre.protectedState
  post.revision = add[pre.revision, 1]
  post.requestPending = 0
  post.publicSecrets = pre.publicSecrets
  post.knowledgeConsideration = pre.knowledgeConsideration
}

assert GrantPreservesAAndAddsOnlyB {
  all pre, post: State | Grant[pre, post] implies
    A in post.owners and B in post.owners and Outsider not in post.owners
}

assert ReissueChangesOnlyPermittedState {
  all pre, post: State | Reissue[pre, post] implies
    post.owners = pre.owners and
    post.aEnvelope = pre.aEnvelope and
    post.protectedState = pre.protectedState and
    post.publicSecrets = pre.publicSecrets and
    post.knowledgeConsideration = 0
}

assert SecretRolesDoNotCollapse {
  SolanaSigningKey != HpkePrivateKey and
  HpkePrivateKey != ContentKey and
  SolanaSigningKey != ContentKey
}

assert PublicStateHasNoSecretsOrPrice {
  all s: State | Init[s] implies no s.publicSecrets and s.knowledgeConsideration = 0
}

check GrantPreservesAAndAddsOnlyB for 6 but exactly 3 Identity, exactly 3 KeyRole, 4 Int
check ReissueChangesOnlyPermittedState for 6 but exactly 3 Identity, exactly 3 KeyRole, 4 Int
check SecretRolesDoNotCollapse for 6 but exactly 3 Identity, exactly 3 KeyRole, 4 Int
check PublicStateHasNoSecretsOrPrice for 6 but exactly 3 Identity, exactly 3 KeyRole, 4 Int
