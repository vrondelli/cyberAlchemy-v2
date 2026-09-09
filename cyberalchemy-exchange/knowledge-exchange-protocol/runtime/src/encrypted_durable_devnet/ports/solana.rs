use std::collections::BTreeSet;

use crate::Digest32;

use super::model::{ActivatedDelivery, QualifiedByteIdentity, SubmissionIntent};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Finality {
    Submitted,
    Confirmed,
    Finalized,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProgramObservation {
    pub trial_id: Digest32,
    pub program_id: Digest32,
    pub artifact_version_id: Digest32,
    pub state_revision: u64,
    pub active_identity: QualifiedByteIdentity,
    pub finality: Finality,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NetworkCostObservation {
    pub trial_id: Digest32,
    pub fee_lamports: u64,
    pub rent_lamports: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SolanaObservationError {
    ObservationUnavailable,
    TrialMismatch,
    ProgramMismatch,
    ArtifactMismatch,
    RevisionMismatch,
    CommitmentMismatch,
    NotFinalized,
    PolicyViolation,
}

/// Read-only observation boundary. It deliberately exposes no submit, sign,
/// deploy, airdrop, wallet, keypair, or RPC operation.
#[allow(async_fn_in_trait)]
pub trait SolanaObservationPort {
    async fn observe_program_state(
        &self,
        trial_id: Digest32,
        program_id: Digest32,
        artifact_version_id: Digest32,
    ) -> Result<ProgramObservation, SolanaObservationError>;

    async fn observe_network_cost(
        &self,
        trial_id: Digest32,
    ) -> Result<NetworkCostObservation, SolanaObservationError>;
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DevnetExecutionPolicy {
    pub disposable_identity_required: bool,
    pub nonproduction_only: bool,
    pub environment_bounded_evidence: bool,
}

impl DevnetExecutionPolicy {
    pub const CLOSED: Self = Self {
        disposable_identity_required: true,
        nonproduction_only: true,
        environment_bounded_evidence: true,
    };
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProgramRealization {
    pub program_realization_id: Digest32,
    pub source_digest: Digest32,
    pub build_digest: Digest32,
    pub program_id: Digest32,
    pub cluster_genesis: Digest32,
    pub loader_id: Digest32,
    pub upgrade_posture: String,
    pub fixture_id: Digest32,
    pub rpc_class: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FinalizedStateObservation {
    pub observation_id: Digest32,
    pub transaction_signature: String,
    pub slot: u64,
    pub revision: u64,
    pub envelope_commitment: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FinalizedDeliveryActivated {
    pub activation_observation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub activation_revision: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DurableGrantFinalized {
    pub grant_operation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub post_revision: u64,
    pub recipient_identity_id: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DevnetTrialObserved {
    pub trial_observation_id: Digest32,
    pub program_realization_id: Digest32,
    pub storage_realization_id: Digest32,
    pub environment_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OnChainPublicState {
    pub artifact_version_id: Digest32,
    pub revision: u64,
    pub owner_commitment: Digest32,
    pub envelope_commitment: Digest32,
    pub opaque_locator_commitment: Digest32,
}

pub fn activate_finalized_delivery(
    observation: ProgramObservation,
    intent: &SubmissionIntent,
) -> Result<ActivatedDelivery, SolanaObservationError> {
    if observation.trial_id != intent.trial_id {
        return Err(SolanaObservationError::TrialMismatch);
    }
    if observation.program_id != intent.program_id {
        return Err(SolanaObservationError::ProgramMismatch);
    }
    if observation.artifact_version_id != intent.artifact_version_id {
        return Err(SolanaObservationError::ArtifactMismatch);
    }
    if observation.state_revision != intent.expected_state_revision {
        return Err(SolanaObservationError::RevisionMismatch);
    }
    if observation.active_identity != intent.ciphertext_identity {
        return Err(SolanaObservationError::CommitmentMismatch);
    }
    if observation.finality != Finality::Finalized {
        return Err(SolanaObservationError::NotFinalized);
    }
    Ok(ActivatedDelivery {
        artifact_version_id: observation.artifact_version_id,
        state_revision: observation.state_revision,
        active_identity: observation.active_identity,
    })
}

pub fn encrypted_durable_devnet_workflow() -> &'static [&'static str] {
    &[
        "prepare-encrypted-material",
        "persist-and-verify-material",
        "grant-coownership",
        "activate-finalized-delivery",
        "retrieve-active-material",
        "verify-recipient-decryption",
        "request-key-reissue",
        "fulfill-key-reissue",
        "reconcile-delivery",
        "observe-infrastructure-costs",
    ]
}

pub fn enforce_atomic_chain_grant(
    owners_before: &BTreeSet<Digest32>,
    owners_after: &BTreeSet<Digest32>,
    originator: Digest32,
    recipient: Digest32,
    revision_before: u64,
    revision_after: u64,
    replay_consumed: bool,
) -> Result<(), SolanaObservationError> {
    if owners_before.is_subset(owners_after)
        && owners_after.contains(&originator)
        && owners_after.contains(&recipient)
        && revision_after == revision_before.saturating_add(1)
        && replay_consumed
    {
        Ok(())
    } else {
        Err(SolanaObservationError::PolicyViolation)
    }
}

pub fn enforce_devnet_nonproduction(
    environment_id: &str,
    disposable_identity: bool,
) -> Result<(), SolanaObservationError> {
    if environment_id == "solana-devnet" && disposable_identity {
        Ok(())
    } else {
        Err(SolanaObservationError::PolicyViolation)
    }
}

pub fn enforce_finalized_activation(
    observation: &ProgramObservation,
    intent: &SubmissionIntent,
) -> Result<(), SolanaObservationError> {
    activate_finalized_delivery(observation.clone(), intent).map(|_| ())
}

pub fn enforce_no_cross_system_atomicity(
    claims_atomic_storage_and_solana: bool,
) -> Result<(), SolanaObservationError> {
    if claims_atomic_storage_and_solana {
        Err(SolanaObservationError::PolicyViolation)
    } else {
        Ok(())
    }
}

pub fn enforce_onchain_no_secrets(
    _state: &OnChainPublicState,
    includes_plaintext_keys_private_or_ciphertext_bytes: bool,
) -> Result<(), SolanaObservationError> {
    if includes_plaintext_keys_private_or_ciphertext_bytes {
        Err(SolanaObservationError::PolicyViolation)
    } else {
        Ok(())
    }
}

pub fn enforce_program_and_trial_identity_exact(
    expected_trial: Digest32,
    expected_program: Digest32,
    observation: &ProgramObservation,
) -> Result<(), SolanaObservationError> {
    if observation.trial_id != expected_trial {
        Err(SolanaObservationError::TrialMismatch)
    } else if observation.program_id != expected_program {
        Err(SolanaObservationError::ProgramMismatch)
    } else {
        Ok(())
    }
}
