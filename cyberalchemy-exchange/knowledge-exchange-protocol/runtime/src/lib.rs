//! Deterministic protocol-state kernel for encrypted knowledge co-ownership.
//!
//! D65 binding: system ontology `knowledge-exchange.system.encrypted-coownership`,
//! admitted as digest `32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60`
//! by `CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002`.
//!
//! This crate performs no cryptography, storage, Solana calls, payment,
//! publication, or deployment. Opaque values are verified by caller-owned code.

use std::collections::{BTreeMap, BTreeSet};

pub mod encrypted_durable_devnet;

pub const ADMITTED_SYSTEM_ONTOLOGY_DIGEST: &str =
    "32a354721df128dd3ba8b11e8f1a435914a8718952c93b5a7e69f12edae60a60";
pub const ADMISSION_DECISION_ID: &str = "CA2-DECISION-KEP-SYSTEM-ONTOLOGY-ADMISSION-002";

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Digest32([u8; 32]);

impl Digest32 {
    pub fn try_new(bytes: [u8; 32]) -> Result<Self, ProtocolError> {
        if bytes == [0; 32] {
            Err(ProtocolError::ZeroDigest)
        } else {
            Ok(Self(bytes))
        }
    }

    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct EncryptionKeyBinding {
    pub binding_id: Digest32,
    pub fingerprint: Digest32,
    pub version: u64,
    pub valid_from: u64,
    pub valid_until: u64,
    pub challenge_digest: Digest32,
}

impl EncryptionKeyBinding {
    fn validate(&self) -> Result<(), ProtocolError> {
        if self.version == 0 {
            return Err(ProtocolError::InvalidBindingVersion);
        }
        if self.valid_from > self.valid_until {
            return Err(ProtocolError::InvalidBindingValidityWindow);
        }
        Ok(())
    }

    fn validate_current_at(&self, evaluation_time: u64) -> Result<(), ProtocolError> {
        self.validate()?;
        if evaluation_time < self.valid_from || evaluation_time > self.valid_until {
            return Err(ProtocolError::BindingNotCurrent);
        }
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct KnowledgeIdentity {
    pub identity_id: Digest32,
    pub authorization_key_fingerprint: Digest32,
    pub encryption_key: EncryptionKeyBinding,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ArtifactVersion {
    pub artifact_id: Digest32,
    pub version_id: Digest32,
    pub plaintext_commitment: Digest32,
    pub policy_id: Digest32,
    pub originator_id: Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AuthorityRule {
    OriginatorOnly,
    AnyCurrentCoowner,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct PropagationPolicy {
    pub policy_id: Digest32,
    pub originator_id: Digest32,
    pub grant_authority: AuthorityRule,
    pub reissue_authority: AuthorityRule,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct RecipientKeyEnvelope {
    pub envelope_digest: Digest32,
    pub artifact_version_id: Digest32,
    pub encryption_epoch: u64,
    pub recipient_id: Digest32,
    pub recipient_key_binding_id: Digest32,
    pub recipient_key_binding_version: u64,
    pub recipient_key_fingerprint: Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DecryptionAcknowledgement {
    pub command_digest: Digest32,
    pub expected_state_revision: u64,
    pub artifact_version_id: Digest32,
    pub encryption_epoch: u64,
    pub recipient_id: Digest32,
    pub envelope_digest: Digest32,
    pub ciphertext_digest: Digest32,
    pub challenge_digest: Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct CoownershipGrant {
    pub command_digest: Digest32,
    pub expected_state_revision: u64,
    pub evaluation_time: u64,
    pub artifact_version_id: Digest32,
    pub policy_id: Digest32,
    pub grantor_id: Digest32,
    pub recipient_id: Digest32,
    pub recipient_key_binding_id: Digest32,
    pub recipient_key_binding_version: u64,
    pub recipient_key_fingerprint: Digest32,
    pub envelope_digest: Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ReissueReason {
    Lost,
    Compromised,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct KeyReissueRequest {
    pub command_digest: Digest32,
    pub expected_state_revision: u64,
    pub evaluation_time: u64,
    pub artifact_version_id: Digest32,
    pub recipient_id: Digest32,
    pub previous_key_binding_id: Digest32,
    pub previous_key_binding_version: u64,
    pub previous_key_fingerprint: Digest32,
    pub replacement_key_binding_id: Digest32,
    pub replacement_key_binding_version: u64,
    pub replacement_key_fingerprint: Digest32,
    pub reason: ReissueReason,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct KeyReissue {
    pub reissue_digest: Digest32,
    pub request_digest: Digest32,
    pub expected_state_revision: u64,
    pub artifact_version_id: Digest32,
    pub encryption_epoch: u64,
    pub issuer_id: Digest32,
    pub recipient_id: Digest32,
    pub replacement_key_binding_id: Digest32,
    pub replacement_key_binding_version: u64,
    pub previous_envelope_digest: Digest32,
    pub replacement_envelope_digest: Digest32,
    pub protected_state_before_digest: Digest32,
    pub protected_state_after_digest: Digest32,
    pub unaffected_envelopes_before_digest: Digest32,
    pub unaffected_envelopes_after_digest: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochRotation {
    pub command_digest: Digest32,
    pub expected_state_revision: u64,
    pub evaluation_time: u64,
    pub artifact_version_id: Digest32,
    pub actor_id: Digest32,
    pub prior_epoch: u64,
    pub successor_epoch: u64,
    pub ciphertext_digest: Digest32,
    pub external_retrieval_reference_digest: Digest32,
    pub envelopes: Vec<RecipientKeyEnvelope>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AuthorizationProof {
    pub signer_id: Digest32,
    pub command_digest: Digest32,
    pub signature: Vec<u8>,
}

pub trait AuthorizationVerifier {
    fn verify(&self, proof: &AuthorizationProof) -> bool;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EncryptedCoownershipState {
    artifact: ArtifactVersion,
    state_revision: u64,
    owners: BTreeSet<Digest32>,
    encryption_epoch: u64,
    ciphertext_digest: Digest32,
    external_retrieval_reference_digest: Digest32,
    envelopes: BTreeMap<Digest32, RecipientKeyEnvelope>,
    acknowledgements: BTreeMap<Digest32, DecryptionAcknowledgement>,
    consumed_command_digests: BTreeSet<Digest32>,
    consumed_challenge_digests: BTreeSet<Digest32>,
}

impl EncryptedCoownershipState {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        artifact: ArtifactVersion,
        policy: &PropagationPolicy,
        originator: &KnowledgeIdentity,
        evaluation_time: u64,
        encryption_epoch: u64,
        ciphertext_digest: Digest32,
        external_retrieval_reference_digest: Digest32,
        originator_envelope: RecipientKeyEnvelope,
    ) -> Result<Self, ProtocolError> {
        if encryption_epoch == 0 {
            return Err(ProtocolError::InvalidEpoch);
        }
        validate_policy(&artifact, policy)?;
        if originator.identity_id != artifact.originator_id {
            return Err(ProtocolError::IdentityMismatch);
        }
        originator
            .encryption_key
            .validate_current_at(evaluation_time)?;
        validate_envelope(
            &originator_envelope,
            artifact.version_id,
            encryption_epoch,
            originator,
        )?;
        Ok(Self {
            artifact,
            state_revision: 0,
            owners: BTreeSet::from([originator.identity_id]),
            encryption_epoch,
            ciphertext_digest,
            external_retrieval_reference_digest,
            envelopes: BTreeMap::from([(originator.identity_id, originator_envelope)]),
            acknowledgements: BTreeMap::new(),
            consumed_command_digests: BTreeSet::new(),
            consumed_challenge_digests: BTreeSet::new(),
        })
    }

    pub fn artifact(&self) -> &ArtifactVersion {
        &self.artifact
    }
    pub fn state_revision(&self) -> u64 {
        self.state_revision
    }
    pub fn owners(&self) -> &BTreeSet<Digest32> {
        &self.owners
    }
    pub fn encryption_epoch(&self) -> u64 {
        self.encryption_epoch
    }
    pub fn ciphertext_digest(&self) -> Digest32 {
        self.ciphertext_digest
    }
    pub fn external_retrieval_reference_digest(&self) -> Digest32 {
        self.external_retrieval_reference_digest
    }
    pub fn envelope_for(&self, recipient: Digest32) -> Option<&RecipientKeyEnvelope> {
        self.envelopes.get(&recipient)
    }
    pub fn acknowledgement(&self, command: Digest32) -> Option<&DecryptionAcknowledgement> {
        self.acknowledgements.get(&command)
    }
    pub fn acknowledgement_count(&self) -> usize {
        self.acknowledgements.len()
    }
    pub fn has_consumed_command(&self, command: Digest32) -> bool {
        self.consumed_command_digests.contains(&command)
    }
    pub fn has_consumed_challenge(&self, challenge: Digest32) -> bool {
        self.consumed_challenge_digests.contains(&challenge)
    }

    pub fn grant_coownership(
        &self,
        policy: &PropagationPolicy,
        recipient: &KnowledgeIdentity,
        grant: &CoownershipGrant,
        envelope: RecipientKeyEnvelope,
        proof: &AuthorizationProof,
        verifier: &impl AuthorizationVerifier,
    ) -> Result<Self, ProtocolError> {
        validate_policy(&self.artifact, policy)?;
        self.require_revision(grant.expected_state_revision)?;
        self.require_fresh_command(grant.command_digest)?;
        if grant.artifact_version_id != self.artifact.version_id {
            return Err(ProtocolError::ArtifactVersionMismatch);
        }
        if grant.policy_id != policy.policy_id {
            return Err(ProtocolError::PolicyMismatch);
        }
        if !self.owners.contains(&grant.grantor_id) {
            return Err(ProtocolError::GrantorNotOwner);
        }
        if !authorized(
            policy.grant_authority,
            policy.originator_id,
            grant.grantor_id,
        ) {
            return Err(ProtocolError::GrantorNotAuthorized);
        }
        if recipient.identity_id != grant.recipient_id {
            return Err(ProtocolError::IdentityMismatch);
        }
        if self.owners.contains(&grant.recipient_id) {
            return Err(ProtocolError::RecipientAlreadyOwner);
        }
        recipient
            .encryption_key
            .validate_current_at(grant.evaluation_time)?;
        validate_binding_reference(
            &recipient.encryption_key,
            grant.recipient_key_binding_id,
            grant.recipient_key_binding_version,
            grant.recipient_key_fingerprint,
        )?;
        if envelope.envelope_digest != grant.envelope_digest {
            return Err(ProtocolError::EnvelopeMismatch);
        }
        validate_envelope(
            &envelope,
            self.artifact.version_id,
            self.encryption_epoch,
            recipient,
        )?;
        require_authorization(proof, grant.grantor_id, grant.command_digest, verifier)?;

        let prior_owners = self.owners.clone();
        let mut successor = self.clone();
        successor.owners.insert(grant.recipient_id);
        successor.envelopes.insert(grant.recipient_id, envelope);
        successor.consume_command(grant.command_digest);
        successor.advance_revision()?;
        if !prior_owners.is_subset(&successor.owners)
            || !successor.owners.contains(&self.artifact.originator_id)
        {
            return Err(ProtocolError::ExistingOwnerRemoved);
        }
        Ok(successor)
    }

    pub fn acknowledge_decryption(
        &self,
        acknowledgement: DecryptionAcknowledgement,
        proof: &AuthorizationProof,
        verifier: &impl AuthorizationVerifier,
    ) -> Result<Self, ProtocolError> {
        self.require_revision(acknowledgement.expected_state_revision)?;
        self.require_fresh_command(acknowledgement.command_digest)?;
        if self
            .consumed_challenge_digests
            .contains(&acknowledgement.challenge_digest)
        {
            return Err(ProtocolError::ChallengeAlreadyConsumed);
        }
        if acknowledgement.artifact_version_id != self.artifact.version_id {
            return Err(ProtocolError::ArtifactVersionMismatch);
        }
        if acknowledgement.encryption_epoch != self.encryption_epoch {
            return Err(ProtocolError::EnvelopeEpochMismatch);
        }
        if acknowledgement.ciphertext_digest != self.ciphertext_digest {
            return Err(ProtocolError::CiphertextMismatch);
        }
        if !self.owners.contains(&acknowledgement.recipient_id) {
            return Err(ProtocolError::RecipientNotOwner);
        }
        let envelope = self
            .envelopes
            .get(&acknowledgement.recipient_id)
            .ok_or(ProtocolError::EnvelopeMissing)?;
        if envelope.envelope_digest != acknowledgement.envelope_digest {
            return Err(ProtocolError::EnvelopeMismatch);
        }
        require_authorization(
            proof,
            acknowledgement.recipient_id,
            acknowledgement.command_digest,
            verifier,
        )?;
        let mut successor = self.clone();
        successor
            .acknowledgements
            .insert(acknowledgement.command_digest, acknowledgement);
        successor.consume_command(acknowledgement.command_digest);
        successor
            .consumed_challenge_digests
            .insert(acknowledgement.challenge_digest);
        successor.advance_revision()?;
        Ok(successor)
    }

    #[allow(clippy::too_many_arguments)]
    pub fn reissue_lost_key(
        &self,
        policy: &PropagationPolicy,
        previous_identity: &KnowledgeIdentity,
        replacement_identity: &KnowledgeIdentity,
        request: &KeyReissueRequest,
        reissue: &KeyReissue,
        replacement_envelope: RecipientKeyEnvelope,
        recipient_proof: &AuthorizationProof,
        issuer_proof: &AuthorizationProof,
        verifier: &impl AuthorizationVerifier,
    ) -> Result<Self, ProtocolError> {
        validate_policy(&self.artifact, policy)?;
        self.require_revision(request.expected_state_revision)?;
        self.require_revision(reissue.expected_state_revision)?;
        self.require_fresh_command(request.command_digest)?;
        self.require_fresh_command(reissue.reissue_digest)?;
        if request.command_digest == reissue.reissue_digest {
            return Err(ProtocolError::DuplicateCommandDigest);
        }
        if request.reason == ReissueReason::Compromised {
            return Err(ProtocolError::RequiresNewEncryptionEpoch);
        }
        if request.artifact_version_id != self.artifact.version_id
            || reissue.artifact_version_id != self.artifact.version_id
        {
            return Err(ProtocolError::ArtifactVersionMismatch);
        }
        if request.recipient_id != previous_identity.identity_id
            || request.recipient_id != replacement_identity.identity_id
            || request.recipient_id != reissue.recipient_id
        {
            return Err(ProtocolError::IdentityMismatch);
        }
        if !self.owners.contains(&request.recipient_id) {
            return Err(ProtocolError::RecipientNotOwner);
        }
        if !self.owners.contains(&reissue.issuer_id)
            || !authorized(
                policy.reissue_authority,
                policy.originator_id,
                reissue.issuer_id,
            )
        {
            return Err(ProtocolError::GrantorNotAuthorized);
        }
        validate_binding_reference(
            &previous_identity.encryption_key,
            request.previous_key_binding_id,
            request.previous_key_binding_version,
            request.previous_key_fingerprint,
        )?;
        replacement_identity
            .encryption_key
            .validate_current_at(request.evaluation_time)?;
        validate_binding_reference(
            &replacement_identity.encryption_key,
            request.replacement_key_binding_id,
            request.replacement_key_binding_version,
            request.replacement_key_fingerprint,
        )?;
        if previous_identity.encryption_key.binding_id
            == replacement_identity.encryption_key.binding_id
            || previous_identity.encryption_key.fingerprint
                == replacement_identity.encryption_key.fingerprint
        {
            return Err(ProtocolError::ReplacementKeyUnchanged);
        }
        let previous_envelope = self
            .envelopes
            .get(&request.recipient_id)
            .ok_or(ProtocolError::EnvelopeMissing)?;
        validate_envelope(
            previous_envelope,
            self.artifact.version_id,
            self.encryption_epoch,
            previous_identity,
        )?;
        if previous_envelope.envelope_digest != reissue.previous_envelope_digest {
            return Err(ProtocolError::PreviousEnvelopeMismatch);
        }
        validate_envelope(
            &replacement_envelope,
            self.artifact.version_id,
            self.encryption_epoch,
            replacement_identity,
        )?;
        if replacement_envelope.envelope_digest != reissue.replacement_envelope_digest
            || reissue.request_digest != request.command_digest
            || reissue.encryption_epoch != self.encryption_epoch
            || reissue.replacement_key_binding_id != request.replacement_key_binding_id
            || reissue.replacement_key_binding_version != request.replacement_key_binding_version
        {
            return Err(ProtocolError::ReissueResultMismatch);
        }
        if reissue.protected_state_before_digest != reissue.protected_state_after_digest {
            return Err(ProtocolError::ProtectedStateMutation);
        }
        if reissue.unaffected_envelopes_before_digest != reissue.unaffected_envelopes_after_digest {
            return Err(ProtocolError::UnaffectedEnvelopeMutation);
        }
        require_authorization(
            recipient_proof,
            request.recipient_id,
            request.command_digest,
            verifier,
        )?;
        require_authorization(
            issuer_proof,
            reissue.issuer_id,
            reissue.reissue_digest,
            verifier,
        )?;

        let protected = (
            self.artifact,
            self.owners.clone(),
            self.encryption_epoch,
            self.ciphertext_digest,
            self.external_retrieval_reference_digest,
        );
        let unaffected: BTreeMap<_, _> = self
            .envelopes
            .iter()
            .filter(|(recipient, _)| **recipient != request.recipient_id)
            .map(|(recipient, envelope)| (*recipient, *envelope))
            .collect();
        let mut successor = self.clone();
        successor
            .envelopes
            .insert(request.recipient_id, replacement_envelope);
        successor.consume_command(request.command_digest);
        successor.consume_command(reissue.reissue_digest);
        successor.advance_revision()?;
        let successor_protected = (
            successor.artifact,
            successor.owners.clone(),
            successor.encryption_epoch,
            successor.ciphertext_digest,
            successor.external_retrieval_reference_digest,
        );
        let successor_unaffected: BTreeMap<_, _> = successor
            .envelopes
            .iter()
            .filter(|(recipient, _)| **recipient != request.recipient_id)
            .map(|(recipient, envelope)| (*recipient, *envelope))
            .collect();
        if successor_protected != protected {
            return Err(ProtocolError::ProtectedStateMutation);
        }
        if successor_unaffected != unaffected {
            return Err(ProtocolError::UnaffectedEnvelopeMutation);
        }
        Ok(successor)
    }

    pub fn rotate_compromised_epoch(
        &self,
        policy: &PropagationPolicy,
        identities: &BTreeMap<Digest32, KnowledgeIdentity>,
        rotation: &EpochRotation,
        proof: &AuthorizationProof,
        verifier: &impl AuthorizationVerifier,
    ) -> Result<Self, ProtocolError> {
        validate_policy(&self.artifact, policy)?;
        self.require_revision(rotation.expected_state_revision)?;
        self.require_fresh_command(rotation.command_digest)?;
        if rotation.artifact_version_id != self.artifact.version_id {
            return Err(ProtocolError::ArtifactVersionMismatch);
        }
        if !self.owners.contains(&rotation.actor_id) {
            return Err(ProtocolError::GrantorNotOwner);
        }
        if !authorized(
            policy.reissue_authority,
            policy.originator_id,
            rotation.actor_id,
        ) {
            return Err(ProtocolError::GrantorNotAuthorized);
        }
        if rotation.prior_epoch != self.encryption_epoch
            || rotation.successor_epoch != self.encryption_epoch + 1
        {
            return Err(ProtocolError::EpochMustAdvance);
        }
        require_authorization(proof, rotation.actor_id, rotation.command_digest, verifier)?;
        let mut successor_envelopes = BTreeMap::new();
        for envelope in &rotation.envelopes {
            if successor_envelopes.contains_key(&envelope.recipient_id) {
                return Err(ProtocolError::DuplicateEnvelopeRecipient);
            }
            let identity = identities
                .get(&envelope.recipient_id)
                .ok_or(ProtocolError::IdentityMissing)?;
            identity
                .encryption_key
                .validate_current_at(rotation.evaluation_time)?;
            validate_envelope(
                envelope,
                self.artifact.version_id,
                rotation.successor_epoch,
                identity,
            )?;
            successor_envelopes.insert(envelope.recipient_id, *envelope);
        }
        let covered: BTreeSet<_> = successor_envelopes.keys().copied().collect();
        if covered != self.owners {
            return Err(ProtocolError::IncompleteOwnerEnvelopeCoverage);
        }
        let mut successor = self.clone();
        successor.encryption_epoch = rotation.successor_epoch;
        successor.ciphertext_digest = rotation.ciphertext_digest;
        successor.external_retrieval_reference_digest =
            rotation.external_retrieval_reference_digest;
        successor.envelopes = successor_envelopes;
        successor.acknowledgements.clear();
        successor.consume_command(rotation.command_digest);
        successor.advance_revision()?;
        Ok(successor)
    }

    fn require_revision(&self, expected: u64) -> Result<(), ProtocolError> {
        if expected == self.state_revision {
            Ok(())
        } else {
            Err(ProtocolError::StateRevisionMismatch)
        }
    }
    fn require_fresh_command(&self, command: Digest32) -> Result<(), ProtocolError> {
        if self.consumed_command_digests.contains(&command) {
            Err(ProtocolError::CommandAlreadyConsumed)
        } else {
            Ok(())
        }
    }
    fn consume_command(&mut self, command: Digest32) {
        self.consumed_command_digests.insert(command);
    }
    fn advance_revision(&mut self) -> Result<(), ProtocolError> {
        self.state_revision = self
            .state_revision
            .checked_add(1)
            .ok_or(ProtocolError::StateRevisionOverflow)?;
        Ok(())
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ProtocolError {
    ZeroDigest,
    InvalidEpoch,
    InvalidBindingVersion,
    InvalidBindingValidityWindow,
    BindingNotCurrent,
    BindingIdMismatch,
    BindingVersionMismatch,
    ArtifactVersionMismatch,
    PolicyMismatch,
    IdentityMismatch,
    AuthorizationFailed,
    CommandDigestMismatch,
    CommandAlreadyConsumed,
    DuplicateCommandDigest,
    ChallengeAlreadyConsumed,
    StateRevisionMismatch,
    StateRevisionOverflow,
    GrantorNotOwner,
    GrantorNotAuthorized,
    RecipientAlreadyOwner,
    RecipientKeyMismatch,
    ExistingOwnerRemoved,
    EnvelopeMissing,
    EnvelopeMismatch,
    EnvelopeEpochMismatch,
    CiphertextMismatch,
    RecipientNotOwner,
    PreviousEnvelopeMismatch,
    ReplacementKeyUnchanged,
    ReissueResultMismatch,
    ProtectedStateMutation,
    UnaffectedEnvelopeMutation,
    RequiresNewEncryptionEpoch,
    EpochMustAdvance,
    DuplicateEnvelopeRecipient,
    IdentityMissing,
    IncompleteOwnerEnvelopeCoverage,
}

fn validate_policy(
    artifact: &ArtifactVersion,
    policy: &PropagationPolicy,
) -> Result<(), ProtocolError> {
    if artifact.policy_id != policy.policy_id {
        return Err(ProtocolError::PolicyMismatch);
    }
    if artifact.originator_id != policy.originator_id {
        return Err(ProtocolError::IdentityMismatch);
    }
    Ok(())
}

fn validate_binding_reference(
    binding: &EncryptionKeyBinding,
    binding_id: Digest32,
    binding_version: u64,
    fingerprint: Digest32,
) -> Result<(), ProtocolError> {
    binding.validate()?;
    if binding.binding_id != binding_id {
        return Err(ProtocolError::BindingIdMismatch);
    }
    if binding.version != binding_version {
        return Err(ProtocolError::BindingVersionMismatch);
    }
    if binding.fingerprint != fingerprint {
        return Err(ProtocolError::RecipientKeyMismatch);
    }
    Ok(())
}

fn validate_envelope(
    envelope: &RecipientKeyEnvelope,
    artifact_version_id: Digest32,
    encryption_epoch: u64,
    recipient: &KnowledgeIdentity,
) -> Result<(), ProtocolError> {
    if envelope.artifact_version_id != artifact_version_id {
        return Err(ProtocolError::ArtifactVersionMismatch);
    }
    if envelope.encryption_epoch != encryption_epoch || encryption_epoch == 0 {
        return Err(ProtocolError::EnvelopeEpochMismatch);
    }
    if envelope.recipient_id != recipient.identity_id {
        return Err(ProtocolError::IdentityMismatch);
    }
    validate_binding_reference(
        &recipient.encryption_key,
        envelope.recipient_key_binding_id,
        envelope.recipient_key_binding_version,
        envelope.recipient_key_fingerprint,
    )
}

fn authorized(rule: AuthorityRule, originator: Digest32, actor: Digest32) -> bool {
    match rule {
        AuthorityRule::OriginatorOnly => actor == originator,
        AuthorityRule::AnyCurrentCoowner => true,
    }
}

fn require_authorization(
    proof: &AuthorizationProof,
    expected_signer: Digest32,
    expected_command: Digest32,
    verifier: &impl AuthorizationVerifier,
) -> Result<(), ProtocolError> {
    if proof.signer_id != expected_signer {
        return Err(ProtocolError::AuthorizationFailed);
    }
    if proof.command_digest != expected_command {
        return Err(ProtocolError::CommandDigestMismatch);
    }
    if !verifier.verify(proof) {
        return Err(ProtocolError::AuthorizationFailed);
    }
    Ok(())
}
