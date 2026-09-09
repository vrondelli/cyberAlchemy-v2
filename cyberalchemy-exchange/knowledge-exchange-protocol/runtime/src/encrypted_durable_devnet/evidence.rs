use crate::Digest32;

use super::model::{QualifiedByteIdentity, StorageLayer};
use super::solana::NetworkCostObservation;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EvidenceEnvironment {
    LocalNoNetwork,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EvidenceKind {
    MaterialPrepared,
    LayerWritten(StorageLayer),
    LayerRetrieved(StorageLayer),
    StorageReadinessEstablished,
    SubmissionIntentConstructed,
    FinalizedDeliveryActivated,
    ReconciliationRequired,
    RecipientDecryptionVerified,
    CostObserved,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtocolEvidence {
    pub environment: EvidenceEnvironment,
    pub trial_id: Digest32,
    pub artifact_version_id: Digest32,
    pub kind: EvidenceKind,
    pub byte_identity: Option<QualifiedByteIdentity>,
    pub detail: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeparatedCostObservation {
    pub trial_id: Digest32,
    pub network_lamports: u64,
    pub storage_minor_units: u64,
    pub knowledge_consideration_minor_units: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EvidenceError {
    KnowledgeConsiderationPresent,
    IncompleteEvidence,
    EnvironmentMismatch,
}

impl SeparatedCostObservation {
    pub fn validate_no_price(&self) -> Result<(), EvidenceError> {
        if self.knowledge_consideration_minor_units != 0 {
            Err(EvidenceError::KnowledgeConsiderationPresent)
        } else {
            Ok(())
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EvidenceClosureStatus {
    Complete,
    NotEvaluable,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EndToEndEvidenceContract {
    pub evidence_bundle_id: Digest32,
    pub source_manifest_digest: Digest32,
    pub environment_id: String,
    pub closure_status: EvidenceClosureStatus,
    pub required_proof_ids: Vec<String>,
    pub resolved_proof_ids: Vec<String>,
}

pub fn observe_infrastructure_costs(
    network: NetworkCostObservation,
    storage_minor_units: u64,
) -> SeparatedCostObservation {
    SeparatedCostObservation {
        trial_id: network.trial_id,
        network_lamports: network.fee_lamports.saturating_add(network.rent_lamports),
        storage_minor_units,
        knowledge_consideration_minor_units: 0,
    }
}

pub fn enforce_evidence_closure(contract: &EndToEndEvidenceContract) -> Result<(), EvidenceError> {
    let all_resolved = contract
        .required_proof_ids
        .iter()
        .all(|proof| contract.resolved_proof_ids.contains(proof));
    if contract.closure_status == EvidenceClosureStatus::Complete && all_resolved {
        Ok(())
    } else {
        Err(EvidenceError::IncompleteEvidence)
    }
}

pub fn enforce_evidence_environment_bounded(
    evidence: &ProtocolEvidence,
    claimed_environment: EvidenceEnvironment,
) -> Result<(), EvidenceError> {
    if evidence.environment == claimed_environment {
        Ok(())
    } else {
        Err(EvidenceError::EnvironmentMismatch)
    }
}

pub fn enforce_no_price_cost_separation(
    observation: &SeparatedCostObservation,
) -> Result<(), EvidenceError> {
    observation.validate_no_price()
}
