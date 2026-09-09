use crate::Digest32;

use super::cryptography::{ByteIdentityProvider, CryptographyError, CryptographyPort};
use super::durable_storage::{
    persist_and_verify_material, retrieve_verified, DurableStorageError, DurableStoragePort,
};
use super::model::{
    ActivatedDelivery, CryptographicContext, CryptographicProfile, PreparedDelivery,
    RecipientBinding, ReconciliationRequired, StorageLayer, SubmissionIntent,
};
use super::solana::{
    activate_finalized_delivery as validate_finalized_activation, SolanaObservationError,
    SolanaObservationPort,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LocalProtocolError {
    Cryptography(CryptographyError),
    DurableStorage(DurableStorageError),
    SolanaObservation(SolanaObservationError),
    StorageNotReady,
    TrialMismatch,
    ProgramMismatch,
    ArtifactMismatch,
    RevisionMismatch,
    CommitmentMismatch,
    NotFinalized,
}

impl From<CryptographyError> for LocalProtocolError {
    fn from(value: CryptographyError) -> Self {
        Self::Cryptography(value)
    }
}

impl From<DurableStorageError> for LocalProtocolError {
    fn from(value: DurableStorageError) -> Self {
        Self::DurableStorage(value)
    }
}

impl From<SolanaObservationError> for LocalProtocolError {
    fn from(value: SolanaObservationError) -> Self {
        Self::SolanaObservation(value)
    }
}

pub async fn prepare_and_persist_material(
    cryptography: &impl CryptographyPort,
    storage: &mut impl DurableStoragePort,
    identity: &impl ByteIdentityProvider,
    profile: &CryptographicProfile,
    context: &CryptographicContext,
    plaintext: &[u8],
    recipients: &[RecipientBinding],
) -> Result<PreparedDelivery, LocalProtocolError> {
    let material = cryptography.prepare(profile, context, plaintext, recipients, identity)?;
    let (storage_readiness, _) =
        persist_and_verify_material(storage, identity, 1, &material.ciphertext).await?;
    Ok(PreparedDelivery {
        material,
        storage_readiness,
    })
}

pub fn construct_submission_intent(
    prepared: &PreparedDelivery,
    trial_id: Digest32,
    program_id: Digest32,
    expected_state_revision: u64,
) -> Result<SubmissionIntent, LocalProtocolError> {
    if !prepared.storage_readiness.is_ready()
        || prepared.storage_readiness.byte_identity != prepared.material.ciphertext_identity
    {
        return Err(LocalProtocolError::StorageNotReady);
    }
    Ok(SubmissionIntent {
        trial_id,
        program_id,
        artifact_version_id: prepared.material.context.artifact_version_id,
        expected_state_revision,
        ciphertext_identity: prepared.material.ciphertext_identity.clone(),
    })
}

pub async fn activate_finalized_delivery(
    observations: &impl SolanaObservationPort,
    intent: &SubmissionIntent,
    prepared: &PreparedDelivery,
) -> Result<ActivatedDelivery, LocalProtocolError> {
    if !prepared.storage_readiness.is_ready()
        || prepared.storage_readiness.byte_identity != intent.ciphertext_identity
    {
        return Err(LocalProtocolError::StorageNotReady);
    }
    let observation = observations
        .observe_program_state(
            intent.trial_id,
            intent.program_id,
            intent.artifact_version_id,
        )
        .await?;
    validate_finalized_activation(observation, intent).map_err(|error| match error {
        SolanaObservationError::TrialMismatch => LocalProtocolError::TrialMismatch,
        SolanaObservationError::ProgramMismatch => LocalProtocolError::ProgramMismatch,
        SolanaObservationError::ArtifactMismatch => LocalProtocolError::ArtifactMismatch,
        SolanaObservationError::RevisionMismatch => LocalProtocolError::RevisionMismatch,
        SolanaObservationError::CommitmentMismatch => LocalProtocolError::CommitmentMismatch,
        SolanaObservationError::NotFinalized => LocalProtocolError::NotFinalized,
        other => LocalProtocolError::SolanaObservation(other),
    })
}

pub async fn retrieve_and_open_for_recipient(
    cryptography: &impl CryptographyPort,
    storage: &impl DurableStoragePort,
    identity: &impl ByteIdentityProvider,
    profile: &CryptographicProfile,
    context: &CryptographicContext,
    prepared: &PreparedDelivery,
    recipient: &RecipientBinding,
) -> Result<Vec<u8>, LocalProtocolError> {
    let locator = prepared
        .storage_readiness
        .locator(StorageLayer::Operational)
        .ok_or(LocalProtocolError::StorageNotReady)?;
    let ciphertext = retrieve_verified(
        storage,
        identity,
        prepared.material.ciphertext_identity.schema_version,
        locator,
        &prepared.material.ciphertext_identity,
    )
    .await?;
    let mut material = prepared.material.clone();
    material.ciphertext = ciphertext;
    Ok(cryptography.open(profile, context, &material, recipient, identity)?)
}

pub trait KnowledgeExchangeProtocolPort {
    fn accepted_binding_id(&self) -> &'static str;
    fn environment_id(&self) -> &'static str;

    fn operation_ids(&self) -> &'static [&'static str] {
        super::solana::encrypted_durable_devnet_workflow()
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ReissueState {
    Idle,
    Requested,
    Fulfilled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReissueFulfilled {
    pub fulfillment_operation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub post_revision: u64,
    pub recipient_identity_id: Digest32,
}

impl ReissueState {
    pub fn request(self) -> Result<Self, LocalProtocolError> {
        if self == Self::Idle {
            Ok(Self::Requested)
        } else {
            Err(LocalProtocolError::RevisionMismatch)
        }
    }

    pub fn fulfill(self) -> Result<Self, LocalProtocolError> {
        if self == Self::Requested {
            Ok(Self::Fulfilled)
        } else {
            Err(LocalProtocolError::RevisionMismatch)
        }
    }
}

pub async fn reconcile_delivery(
    observations: &impl SolanaObservationPort,
    intent: &SubmissionIntent,
    prepared: &PreparedDelivery,
    reconciliation_observation_id: Digest32,
) -> Result<ActivatedDelivery, ReconciliationRequired> {
    activate_finalized_delivery(observations, intent, prepared)
        .await
        .map_err(|error| ReconciliationRequired {
            observation_id: reconciliation_observation_id,
            artifact_version_id: intent.artifact_version_id,
            reason_code: format!("{error:?}"),
        })
}

pub fn enforce_failure_no_submission_or_activation(
    storage_ready: bool,
    submission_constructed: bool,
    activation_claimed: bool,
) -> Result<(), LocalProtocolError> {
    if !storage_ready && (submission_constructed || activation_claimed) {
        Err(LocalProtocolError::StorageNotReady)
    } else {
        Ok(())
    }
}
