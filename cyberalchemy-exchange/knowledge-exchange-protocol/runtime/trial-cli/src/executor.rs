use std::{
    collections::{BTreeMap, BTreeSet},
    env, fs,
    fs::{File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    thread,
    time::Duration,
};

use borsh::BorshDeserialize;
use cyberalchemy_kep_adapters::{
    production_profile, PostgresThreeLayerStorage, ProductionCryptography, Sha256Identity,
};
use cyberalchemy_kep_solana_program::{
    key_envelope_binding, ArtifactState, ProtocolInstruction, ReissueRequest, ARTIFACT_SEED,
    REISSUE_SEED, REPLAY_SEED,
};
use cyberalchemy_knowledge_exchange_protocol::{
    encrypted_durable_devnet::{
        cryptography::{ByteIdentityProvider, CryptographyError, CryptographyPort, KeyCustodyPort},
        durable_storage::{persist_and_verify_material, retrieve_verified},
        model::{
            CryptographicContext, OpaqueRecipientEnvelope, PreparedMaterial, RecipientBinding,
            SecretHandle, StorageLayer, StorageReadiness,
        },
    },
    Digest32,
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_client::{rpc_client::RpcClient, rpc_config::RpcSendTransactionConfig};
use solana_commitment_config::CommitmentConfig;
use solana_keypair::{read_keypair_file, Keypair};
use solana_loader_v3_interface::{
    get_program_data_address, instruction as loader_instruction, state::UpgradeableLoaderState,
};
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::Signer,
    transaction::Transaction,
};
use solana_sdk_ids::system_program;
use zeroize::Zeroizing;

use crate::{
    hex_lower, validate_envelope, DeploymentContinuationEnvelope, DevnetEnvelope, TrialGateError,
};

const DEPLOY_CHUNK_SIZE: usize = 768;
const SOLANA_PACKET_DATA_SIZE: u64 = 1_232;

#[derive(Debug, Serialize)]
pub(crate) struct TrialEvidence {
    schema_version: &'static str,
    result: &'static str,
    cluster: &'static str,
    genesis_hash: String,
    program_id: String,
    sbf_sha256: String,
    funding: FundingEvidence,
    deployment: DeploymentEvidence,
    storage: StorageEvidence,
    cases: Vec<CaseEvidence>,
    observations: Vec<ObservationEvidence>,
    finalized_grant_revision: u64,
    finalized_reissue_revision: u64,
    recipient_decryption: &'static str,
    replacement_recipient_decryption: &'static str,
    protocol_transaction_fee_lamports: u64,
    deployment_transaction_fee_lamports: u64,
    payer_balance_delta_lamports: u64,
    retained_program_rent_lamports: u64,
    storage_cost_observation: &'static str,
    knowledge_consideration_lamports: u64,
    protocol_signed_submissions: u16,
    packet_digest: String,
    attempt_journal_record_count: u64,
    attempt_journal_root_sha256: String,
    attempt_journal_integrity: &'static str,
    authority_effect: &'static str,
    observed_external_effect: &'static str,
    authorization_attestation: &'static str,
    claim_ceiling: &'static str,
}

#[derive(Debug, Serialize)]
struct StorageEvidence {
    provider: &'static str,
    encrypted_object_count: u16,
    every_object_ready_in_three_layers: bool,
    locator_commitment_sha256: String,
}

#[derive(Debug, Serialize)]
struct FundingEvidence {
    mode: &'static str,
    observed_balance_lamports: u64,
    minimum_balance_lamports: u64,
    maximum_balance_lamports: u64,
    result: &'static str,
}

#[derive(Debug, Serialize)]
struct DeploymentEvidence {
    signed_submissions: u16,
    transactions: Vec<CaseEvidence>,
    programdata_address: String,
    program_rent_lamports: u64,
    programdata_rent_lamports: u64,
    remote_sbf_sha256: String,
    upgrade_authority: String,
}

#[derive(Debug, Serialize)]
struct CaseEvidence {
    case_id: String,
    expected: &'static str,
    observed: &'static str,
    signature: String,
    slot: Option<u64>,
    fee_lamports: u64,
    error_digest: Option<String>,
}

#[derive(Debug, Serialize)]
struct ObservationEvidence {
    case_id: &'static str,
    expected: &'static str,
    observed: &'static str,
    input_sha256: String,
    output_sha256: String,
}

struct DeploymentResult {
    cases: Vec<CaseEvidence>,
    programdata_address: Pubkey,
    program_rent_lamports: u64,
    programdata_rent_lamports: u64,
    remote_sbf_sha256: String,
    upgrade_authority: Pubkey,
}

struct FileCustody {
    secrets: BTreeMap<SecretHandle, Zeroizing<Vec<u8>>>,
}

struct AttemptJournal {
    file: std::sync::Mutex<File>,
    state: std::sync::Mutex<JournalState>,
    packet_digest: String,
}

#[derive(Debug)]
struct JournalState {
    next_sequence: u64,
    previous_record_sha256: String,
}

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct AttemptRecord {
    schema_version: String,
    packet_digest: String,
    sequence: u64,
    previous_record_sha256: String,
    effect_id: String,
    stage: String,
    observed_effect: String,
    signature: Option<String>,
    detail_sha256: Option<String>,
    failure_stage: Option<String>,
    failure_class: Option<String>,
    record_sha256: String,
}

#[derive(Serialize)]
struct AttemptRecordPayload<'a> {
    schema_version: &'static str,
    packet_digest: &'a str,
    sequence: u64,
    previous_record_sha256: &'a str,
    effect_id: &'a str,
    stage: &'a str,
    observed_effect: &'a str,
    signature: Option<&'a str>,
    detail_sha256: Option<&'a str>,
    failure_stage: Option<&'a str>,
    failure_class: Option<&'a str>,
}

const EMPTY_JOURNAL_ROOT: &str = "0000000000000000000000000000000000000000000000000000000000000000";
const JOURNAL_SCHEMA: &str = "cav2-kep-attempt-journal/v3";

fn attempt_record_sha256(payload: &AttemptRecordPayload<'_>) -> Result<String, TrialGateError> {
    let mut hasher = Sha256::new();
    hasher.update(b"CA2-KEP-ATTEMPT-JOURNAL-v3\0");
    hasher.update(serde_json::to_vec(payload).map_err(|_| TrialGateError::EvidenceWrite)?);
    Ok(hex_lower(&hasher.finalize()))
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
struct SanitizedRpcFailure {
    stage: &'static str,
    class: &'static str,
    detail_sha256: String,
}

impl SanitizedRpcFailure {
    fn from_error(stage: &'static str, error: &impl std::fmt::Display) -> Self {
        let detail = error.to_string();
        let lower = detail.to_ascii_lowercase();
        let class = if lower.contains("429")
            || lower.contains("too many requests")
            || lower.contains("rate limit")
        {
            "rate-limited-rejection"
        } else if lower.contains("timeout")
            || lower.contains("timed out")
            || lower.contains("connection")
        {
            "transport-ambiguous"
        } else if lower.contains("rpc response") || lower.contains("rpc error") {
            "rpc-rejection"
        } else {
            "unclassified-rpc-or-transport"
        };
        Self {
            stage,
            class,
            detail_sha256: hex_lower(&Sha256::digest(detail.as_bytes())),
        }
    }

    fn into_gate_error(self) -> TrialGateError {
        TrialGateError::SolanaRpc {
            stage: self.stage,
            class: self.class,
            detail_sha256: self.detail_sha256,
        }
    }
}

impl AttemptJournal {
    fn create(path: &str, packet_digest: &str) -> Result<Self, TrialGateError> {
        let file = OpenOptions::new()
            .create_new(true)
            .append(true)
            .open(path)
            .map_err(|error| {
                if error.kind() == std::io::ErrorKind::AlreadyExists {
                    TrialGateError::ReconciliationRequired
                } else {
                    TrialGateError::EvidenceWrite
                }
            })?;
        Ok(Self {
            file: std::sync::Mutex::new(file),
            state: std::sync::Mutex::new(JournalState {
                next_sequence: 0,
                previous_record_sha256: EMPTY_JOURNAL_ROOT.to_owned(),
            }),
            packet_digest: packet_digest.to_owned(),
        })
    }

    fn open_existing(
        path: &str,
        packet_digest: &str,
        analysis: &JournalAnalysis,
    ) -> Result<Self, TrialGateError> {
        let file = OpenOptions::new()
            .append(true)
            .open(path)
            .map_err(|_| TrialGateError::ReconciliationRequired)?;
        Ok(Self {
            file: std::sync::Mutex::new(file),
            state: std::sync::Mutex::new(JournalState {
                next_sequence: analysis.record_count,
                previous_record_sha256: analysis.journal_root_sha256.clone(),
            }),
            packet_digest: packet_digest.to_owned(),
        })
    }

    fn record(
        &self,
        effect_id: &str,
        stage: &str,
        signature: Option<&str>,
        detail: Option<&[u8]>,
    ) -> Result<(), TrialGateError> {
        self.record_with_effect(
            effect_id,
            stage,
            "external-journal-write",
            signature,
            detail,
            None,
        )
    }

    fn record_with_effect(
        &self,
        effect_id: &str,
        stage: &str,
        observed_effect: &str,
        signature: Option<&str>,
        detail: Option<&[u8]>,
        failure: Option<&SanitizedRpcFailure>,
    ) -> Result<(), TrialGateError> {
        let detail_sha256 = failure
            .map(|value| value.detail_sha256.clone())
            .or_else(|| detail.map(|value| hex_lower(&Sha256::digest(value))));
        let mut state = self
            .state
            .lock()
            .map_err(|_| TrialGateError::EvidenceWrite)?;
        let payload = AttemptRecordPayload {
            schema_version: JOURNAL_SCHEMA,
            packet_digest: &self.packet_digest,
            sequence: state.next_sequence,
            previous_record_sha256: &state.previous_record_sha256,
            effect_id,
            stage,
            observed_effect,
            signature,
            detail_sha256: detail_sha256.as_deref(),
            failure_stage: failure.map(|value| value.stage),
            failure_class: failure.map(|value| value.class),
        };
        let record_sha256 = attempt_record_sha256(&payload)?;
        let record = AttemptRecord {
            schema_version: JOURNAL_SCHEMA.to_owned(),
            packet_digest: self.packet_digest.clone(),
            sequence: state.next_sequence,
            previous_record_sha256: state.previous_record_sha256.clone(),
            effect_id: effect_id.to_owned(),
            stage: stage.to_owned(),
            observed_effect: observed_effect.to_owned(),
            signature: signature.map(str::to_owned),
            detail_sha256,
            failure_stage: failure.map(|value| value.stage.to_owned()),
            failure_class: failure.map(|value| value.class.to_owned()),
            record_sha256: record_sha256.clone(),
        };
        let mut raw = serde_json::to_vec(&record).map_err(|_| TrialGateError::EvidenceWrite)?;
        raw.push(b'\n');
        let mut file = self
            .file
            .lock()
            .map_err(|_| TrialGateError::EvidenceWrite)?;
        file.write_all(&raw)
            .and_then(|()| file.sync_all())
            .map_err(|_| TrialGateError::EvidenceWrite)?;
        state.next_sequence += 1;
        state.previous_record_sha256 = record_sha256;
        Ok(())
    }

    fn snapshot(&self) -> Result<(u64, String), TrialGateError> {
        let state = self
            .state
            .lock()
            .map_err(|_| TrialGateError::EvidenceWrite)?;
        Ok((state.next_sequence, state.previous_record_sha256.clone()))
    }

    fn record_rpc_failure(
        &self,
        effect_id: &str,
        stage: &str,
        signature: Option<&str>,
        failure: &SanitizedRpcFailure,
    ) -> Result<(), TrialGateError> {
        self.record_with_effect(
            effect_id,
            stage,
            "public-solana-finalized-read+external-journal-write",
            signature,
            None,
            Some(failure),
        )
    }
}

#[derive(Debug, Serialize)]
pub(crate) struct ReconciliationReceipt {
    schema_version: &'static str,
    result: &'static str,
    signatures_checked: usize,
    finalized_successes: usize,
    finalized_failures: usize,
    still_pending: usize,
    unsigned_ambiguous_effects: usize,
    proven_pre_effect_stops: usize,
    packet_digest: String,
    attempt_journal_record_count: u64,
    attempt_journal_root_sha256: String,
    attempt_journal_integrity: &'static str,
    payer_balance_lamports: u64,
    resubmissions: u8,
    authority_effect: &'static str,
    local_effect: &'static str,
    observed_external_effect: &'static str,
    authorization_attestation: &'static str,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
struct DeploymentContinuationPlan {
    total_sbf_chunks: u16,
    finalized_prefix_chunks: u16,
    first_unwritten_chunk_index: u16,
    predecessor_deployment_submissions: u16,
    remaining_write_submissions: u16,
    final_deploy_submissions: u16,
    exact_additional_deployment_submissions: u16,
    protocol_submissions: u16,
}

#[derive(Debug, Serialize)]
pub(crate) struct DeploymentContinuationValidationReceipt {
    schema_version: &'static str,
    result: &'static str,
    continuation_packet_digest: String,
    candidate_binding_digest: String,
    predecessor_packet_digest: String,
    predecessor_attempt_journal_sha256: String,
    predecessor_attempt_journal_record_count: u64,
    predecessor_attempt_journal_root_sha256: String,
    predecessor_journal_integrity: &'static str,
    predecessor_reconciliation: &'static str,
    plan: DeploymentContinuationPlan,
    replayed_predecessor_submissions: u16,
    authority_effect: &'static str,
    external_effect: &'static str,
    claim_ceiling: &'static str,
}

#[derive(Debug, Serialize)]
pub(crate) struct DeploymentContinuationEvidence {
    schema_version: &'static str,
    result: &'static str,
    continuation_packet_digest: String,
    candidate_binding_digest: String,
    predecessor_packet_digest: String,
    predecessor_attempt_journal_sha256: String,
    predecessor_attempt_journal_root_sha256: String,
    plan: DeploymentContinuationPlan,
    replayed_predecessor_submissions: u16,
    transactions: Vec<CaseEvidence>,
    program_id: String,
    programdata_address: String,
    remote_sbf_sha256: String,
    payer_balance_lamports_before: u64,
    payer_balance_lamports_after: u64,
    continuation_attempt_journal_record_count: u64,
    continuation_attempt_journal_root_sha256: String,
    protocol_submissions: u16,
    authority_effect: &'static str,
    observed_external_effect: &'static str,
    authorization_attestation: &'static str,
    claim_ceiling: &'static str,
}

struct VerifiedContinuationPredecessor {
    predecessor: DevnetEnvelope,
    analysis: JournalAnalysis,
    plan: DeploymentContinuationPlan,
}

#[derive(Clone, Copy)]
enum ContinuationPathMode {
    Fresh,
    Reconcile,
}

#[derive(Debug, Serialize)]
pub(crate) struct DeploymentContinuationReconciliationReceipt {
    schema_version: &'static str,
    result: &'static str,
    continuation_packet_digest: String,
    predecessor_packet_digest: String,
    signatures_checked: usize,
    finalized_successes: usize,
    finalized_failures: usize,
    still_pending: usize,
    unsigned_ambiguous_effects: usize,
    continuation_attempt_journal_record_count: u64,
    continuation_attempt_journal_root_sha256: String,
    payer_balance_lamports: u64,
    resubmissions: u8,
    protocol_submissions: u8,
    authority_effect: &'static str,
    observed_external_effect: &'static str,
    authorization_attestation: &'static str,
}

#[derive(Debug, Default, Eq, PartialEq)]
struct JournalAnalysis {
    signatures: BTreeSet<String>,
    deployment_effect_by_signature: BTreeMap<String, String>,
    deployment_signatures_by_effect: BTreeMap<String, BTreeSet<String>>,
    deployment_attempted_effects: BTreeSet<String>,
    deployment_finalized_effects: BTreeSet<String>,
    reconciled_finalized_signatures: BTreeSet<String>,
    reconciled_failed_or_pending_signatures: BTreeSet<String>,
    unsigned_ambiguous_effects: usize,
    proven_pre_effect_stops: usize,
    record_count: u64,
    journal_root_sha256: String,
}

fn analyze_attempt_journal(
    raw: &str,
    packet_digest: &str,
) -> Result<JournalAnalysis, TrialGateError> {
    let mut analysis = JournalAnalysis {
        journal_root_sha256: EMPTY_JOURNAL_ROOT.to_owned(),
        ..JournalAnalysis::default()
    };
    for line in raw.lines().filter(|line| !line.trim().is_empty()) {
        let record: AttemptRecord =
            serde_json::from_str(line).map_err(|_| TrialGateError::ReconciliationRequired)?;
        if record.schema_version != JOURNAL_SCHEMA
            || record.packet_digest != packet_digest
            || record.sequence != analysis.record_count
            || record.previous_record_sha256 != analysis.journal_root_sha256
        {
            return Err(TrialGateError::ReconciliationRequired);
        }
        let payload = AttemptRecordPayload {
            schema_version: JOURNAL_SCHEMA,
            packet_digest: &record.packet_digest,
            sequence: record.sequence,
            previous_record_sha256: &record.previous_record_sha256,
            effect_id: &record.effect_id,
            stage: &record.stage,
            observed_effect: &record.observed_effect,
            signature: record.signature.as_deref(),
            detail_sha256: record.detail_sha256.as_deref(),
            failure_stage: record.failure_stage.as_deref(),
            failure_class: record.failure_class.as_deref(),
        };
        let expected_record_sha256 = attempt_record_sha256(&payload)?;
        if record.record_sha256 != expected_record_sha256 {
            return Err(TrialGateError::ReconciliationRequired);
        }
        analysis.record_count += 1;
        analysis.journal_root_sha256 = record.record_sha256;
        if let Some(signature) = record.signature.as_ref() {
            analysis.signatures.insert(signature.clone());
            if record.effect_id.starts_with("deployment-") {
                analysis
                    .deployment_attempted_effects
                    .insert(record.effect_id.clone());
                analysis
                    .deployment_signatures_by_effect
                    .entry(record.effect_id.clone())
                    .or_default()
                    .insert(signature.clone());
                match analysis
                    .deployment_effect_by_signature
                    .insert(signature.clone(), record.effect_id.clone())
                {
                    Some(previous) if previous != record.effect_id => {
                        return Err(TrialGateError::ReconciliationRequired);
                    }
                    _ => {}
                }
                if record.stage == "finalized-success" {
                    analysis
                        .deployment_finalized_effects
                        .insert(record.effect_id.clone());
                }
            } else if record.effect_id == "reconciliation" {
                match record.stage.as_str() {
                    "reconciled-finalized-success" => {
                        analysis
                            .reconciled_finalized_signatures
                            .insert(signature.clone());
                    }
                    "reconciled-finalized-failure" | "reconciled-still-pending" => {
                        analysis
                            .reconciled_failed_or_pending_signatures
                            .insert(signature.clone());
                    }
                    _ => {}
                }
            }
        }

        match (
            record.failure_stage.as_deref(),
            record.failure_class.as_deref(),
        ) {
            (
                Some("execution-genesis-hash" | "execution-prefunded-balance"),
                Some("rate-limited-rejection" | "rpc-rejection"),
            ) => analysis.proven_pre_effect_stops += 1,
            (Some(_), Some("transport-ambiguous" | "unclassified-rpc-or-transport")) => {
                analysis.unsigned_ambiguous_effects += 1;
            }
            (Some(_), Some(_)) | (Some(_), None) | (None, Some(_)) => {
                analysis.unsigned_ambiguous_effects += 1;
            }
            (None, None)
                if matches!(
                    record.stage.as_str(),
                    "genesis-hash-mismatch-proven-pre-effect"
                        | "prefunded-balance-insufficient"
                        | "prefunded-balance-above-authorized-maximum"
                ) =>
            {
                analysis.proven_pre_effect_stops += 1;
            }
            (None, None) => {}
        }
    }
    for signature in &analysis.reconciled_finalized_signatures {
        if let Some(effect_id) = analysis.deployment_effect_by_signature.get(signature) {
            analysis
                .deployment_finalized_effects
                .insert(effect_id.clone());
        }
    }
    Ok(analysis)
}

fn deployment_continuation_plan(
    analysis: &JournalAnalysis,
    sbf_size_bytes: u64,
) -> Result<DeploymentContinuationPlan, TrialGateError> {
    if analysis.signatures.is_empty()
        || analysis.reconciled_finalized_signatures != analysis.signatures
        || !analysis.reconciled_failed_or_pending_signatures.is_empty()
        || analysis.unsigned_ambiguous_effects != 0
        || analysis.deployment_attempted_effects != analysis.deployment_finalized_effects
        || analysis
            .deployment_signatures_by_effect
            .values()
            .any(|signatures| signatures.len() != 1)
        || !analysis
            .deployment_finalized_effects
            .contains("deployment-buffer-create")
        || analysis
            .deployment_attempted_effects
            .contains("deployment-finalize")
    {
        return Err(TrialGateError::ContinuationProof);
    }

    let total_chunks_u64 = sbf_size_bytes.div_ceil(DEPLOY_CHUNK_SIZE as u64);
    let total_sbf_chunks =
        u16::try_from(total_chunks_u64).map_err(|_| TrialGateError::DeploymentBudgetImpossible)?;
    let mut finalized_indices = BTreeSet::new();
    for effect_id in &analysis.deployment_finalized_effects {
        if effect_id == "deployment-buffer-create" {
            continue;
        }
        let encoded = effect_id
            .strip_prefix("deployment-write-")
            .ok_or(TrialGateError::ContinuationProof)?;
        let index: u16 = encoded
            .parse()
            .map_err(|_| TrialGateError::ContinuationProof)?;
        if effect_id != &format!("deployment-write-{index:03}")
            || index >= total_sbf_chunks
            || !finalized_indices.insert(index)
        {
            return Err(TrialGateError::ContinuationProof);
        }
    }
    for expected in 0..u16::try_from(finalized_indices.len())
        .map_err(|_| TrialGateError::DeploymentBudgetImpossible)?
    {
        if !finalized_indices.contains(&expected) {
            return Err(TrialGateError::ContinuationProof);
        }
    }
    let first_unwritten_chunk_index = u16::try_from(finalized_indices.len())
        .map_err(|_| TrialGateError::DeploymentBudgetImpossible)?;
    if first_unwritten_chunk_index == 0 || first_unwritten_chunk_index >= total_sbf_chunks {
        return Err(TrialGateError::ContinuationProof);
    }
    let predecessor_deployment_submissions = first_unwritten_chunk_index
        .checked_add(1)
        .ok_or(TrialGateError::DeploymentBudgetImpossible)?;
    let remaining_write_submissions = total_sbf_chunks - first_unwritten_chunk_index;
    let exact_additional_deployment_submissions = remaining_write_submissions
        .checked_add(1)
        .ok_or(TrialGateError::DeploymentBudgetImpossible)?;
    Ok(DeploymentContinuationPlan {
        total_sbf_chunks,
        finalized_prefix_chunks: first_unwritten_chunk_index,
        first_unwritten_chunk_index,
        predecessor_deployment_submissions,
        remaining_write_submissions,
        final_deploy_submissions: 1,
        exact_additional_deployment_submissions,
        protocol_submissions: 0,
    })
}

fn verified_continuation_predecessor(
    envelope: &DeploymentContinuationEnvelope,
    path_mode: ContinuationPathMode,
) -> Result<VerifiedContinuationPredecessor, TrialGateError> {
    let repository = trusted_repository_root()?;
    let predecessor_path = Path::new(&envelope.predecessor_terminal_envelope_path)
        .canonicalize()
        .map_err(|_| TrialGateError::ContinuationProof)?;
    let predecessor_journal_path = Path::new(&envelope.predecessor_attempt_journal_path)
        .canonicalize()
        .map_err(|_| TrialGateError::ContinuationProof)?;
    // The predecessor terminal envelope is non-secret governed evidence and may
    // be preserved in the repository. The effect journal and credentials must
    // remain external.
    if predecessor_journal_path.starts_with(&repository) {
        return Err(TrialGateError::RepositoryBoundary);
    }
    let predecessor_bytes =
        fs::read(&predecessor_path).map_err(|_| TrialGateError::ContinuationProof)?;
    let predecessor_sha256 = hex_lower(&Sha256::digest(&predecessor_bytes));
    if predecessor_sha256 != envelope.predecessor_terminal_envelope_sha256
        || predecessor_sha256 != envelope.predecessor_packet_digest
    {
        return Err(TrialGateError::ContinuationProof);
    }
    let predecessor: DevnetEnvelope = serde_json::from_slice(&predecessor_bytes)
        .map_err(|_| TrialGateError::ContinuationProof)?;
    validate_envelope(&predecessor).map_err(|_| TrialGateError::ContinuationProof)?;
    let bound_journal_path = Path::new(&predecessor.external_inputs.attempt_journal_path)
        .canonicalize()
        .map_err(|_| TrialGateError::ContinuationProof)?;
    if bound_journal_path != predecessor_journal_path
        || predecessor.sbf_path != envelope.sbf_path
        || predecessor.sbf_sha256 != envelope.sbf_sha256
        || predecessor.sbf_size_bytes != envelope.sbf_size_bytes
        || predecessor.external_inputs.payer_keypair_path != envelope.payer_keypair_path
        || predecessor.external_inputs.program_keypair_path != envelope.program_keypair_path
        || predecessor.external_inputs.buffer_keypair_path != envelope.buffer_keypair_path
        || predecessor.external_inputs.upgrade_authority_keypair_path
            != envelope.upgrade_authority_keypair_path
        || predecessor.candidate_binding_digest == envelope.candidate_binding_digest
    {
        return Err(TrialGateError::ContinuationProof);
    }
    let journal_bytes =
        fs::read(&predecessor_journal_path).map_err(|_| TrialGateError::ContinuationProof)?;
    if hex_lower(&Sha256::digest(&journal_bytes)) != envelope.predecessor_attempt_journal_sha256 {
        return Err(TrialGateError::ContinuationProof);
    }
    let journal_raw =
        std::str::from_utf8(&journal_bytes).map_err(|_| TrialGateError::ContinuationProof)?;
    let analysis = analyze_attempt_journal(journal_raw, &envelope.predecessor_packet_digest)
        .map_err(|_| TrialGateError::ContinuationProof)?;
    if analysis.journal_root_sha256 != envelope.predecessor_attempt_journal_root_sha256 {
        return Err(TrialGateError::ContinuationProof);
    }
    let plan = deployment_continuation_plan(&analysis, envelope.sbf_size_bytes)?;
    if plan.first_unwritten_chunk_index != envelope.first_unwritten_chunk_index
        || plan.exact_additional_deployment_submissions
            != envelope.max_additional_deployment_signed_transactions
        || u32::from(plan.predecessor_deployment_submissions)
            + u32::from(plan.exact_additional_deployment_submissions)
            > u32::from(predecessor.max_deployment_signed_transactions)
    {
        return Err(TrialGateError::ContinuationProof);
    }
    validate_continuation_paths(envelope, &repository, path_mode)?;
    Ok(VerifiedContinuationPredecessor {
        predecessor,
        analysis,
        plan,
    })
}

fn validate_continuation_paths(
    envelope: &DeploymentContinuationEnvelope,
    repository: &Path,
    path_mode: ContinuationPathMode,
) -> Result<(), TrialGateError> {
    let existing = [
        &envelope.sbf_path,
        &envelope.payer_keypair_path,
        &envelope.program_keypair_path,
        &envelope.buffer_keypair_path,
        &envelope.upgrade_authority_keypair_path,
    ];
    for selected in existing {
        let path = Path::new(selected)
            .canonicalize()
            .map_err(|_| TrialGateError::ExternalMaterial)?;
        if path.starts_with(repository) {
            return Err(TrialGateError::RepositoryBoundary);
        }
    }
    let journal = Path::new(&envelope.continuation_attempt_journal_path);
    let evidence = Path::new(&envelope.continuation_evidence_output_path);
    if journal == evidence || journal == Path::new(&envelope.predecessor_attempt_journal_path) {
        return Err(TrialGateError::EvidenceWrite);
    }
    match path_mode {
        ContinuationPathMode::Fresh if journal.exists() || evidence.exists() => {
            return Err(TrialGateError::EvidenceWrite);
        }
        ContinuationPathMode::Reconcile if !journal.exists() || evidence.exists() => {
            return Err(TrialGateError::ReconciliationRequired);
        }
        ContinuationPathMode::Fresh | ContinuationPathMode::Reconcile => {}
    }
    for output in [journal, evidence] {
        let parent = output
            .parent()
            .ok_or(TrialGateError::RepositoryBoundary)?
            .canonicalize()
            .map_err(|_| TrialGateError::RepositoryBoundary)?;
        if parent.starts_with(repository) {
            return Err(TrialGateError::RepositoryBoundary);
        }
    }
    Ok(())
}

pub(crate) fn validate_deployment_continuation(
    envelope: &DeploymentContinuationEnvelope,
    packet_digest: &str,
) -> Result<DeploymentContinuationValidationReceipt, TrialGateError> {
    let verified = verified_continuation_predecessor(envelope, ContinuationPathMode::Fresh)?;
    Ok(DeploymentContinuationValidationReceipt {
        schema_version: "cav2-kep-deployment-continuation-validation/v1",
        result: "PASS_BOUNDED_NO_EFFECT",
        continuation_packet_digest: packet_digest.to_owned(),
        candidate_binding_digest: envelope.candidate_binding_digest.clone(),
        predecessor_packet_digest: envelope.predecessor_packet_digest.clone(),
        predecessor_attempt_journal_sha256: envelope
            .predecessor_attempt_journal_sha256
            .clone(),
        predecessor_attempt_journal_record_count: verified.analysis.record_count,
        predecessor_attempt_journal_root_sha256: verified
            .analysis
            .journal_root_sha256,
        predecessor_journal_integrity: "verified-packet-bound-sha256-chain",
        predecessor_reconciliation: "all-recorded-signatures-finalized-success",
        plan: verified.plan,
        replayed_predecessor_submissions: 0,
        authority_effect: "none",
        external_effect: "none",
        claim_ceiling: "Offline continuation-envelope and predecessor-journal validation only; no RPC, credential use, signing, submission, deployment, admission, or publication.",
    })
}

fn reconciliation_result(
    signatures_checked: usize,
    still_pending: usize,
    unsigned_ambiguous_effects: usize,
    proven_pre_effect_stops: usize,
) -> &'static str {
    if still_pending > 0 || unsigned_ambiguous_effects > 0 {
        "PENDING"
    } else if signatures_checked > 0 {
        "RECONCILED"
    } else if proven_pre_effect_stops > 0 {
        "PROVEN_PRE_EFFECT_STOP"
    } else {
        "PENDING"
    }
}

fn validate_prefunded_balance(
    observed_lamports: u64,
    minimum_lamports: u64,
    maximum_lamports: u64,
) -> Result<(), TrialGateError> {
    if observed_lamports < minimum_lamports || observed_lamports > maximum_lamports {
        Err(TrialGateError::FundingPrerequisite {
            observed_lamports,
            minimum_lamports,
            maximum_lamports,
        })
    } else {
        Ok(())
    }
}

pub(crate) fn reconcile(
    envelope: &DevnetEnvelope,
    packet_digest: &str,
) -> Result<ReconciliationReceipt, TrialGateError> {
    let repository = trusted_repository_root()?;
    let journal_path = Path::new(&envelope.external_inputs.attempt_journal_path)
        .canonicalize()
        .map_err(|_| TrialGateError::ReconciliationRequired)?;
    if journal_path.starts_with(repository) {
        return Err(TrialGateError::RepositoryBoundary);
    }
    let raw =
        fs::read_to_string(&journal_path).map_err(|_| TrialGateError::ReconciliationRequired)?;
    let analysis = analyze_attempt_journal(&raw, packet_digest)?;
    let signatures = analysis.signatures.clone();
    let unsigned_ambiguous_effects = analysis.unsigned_ambiguous_effects;
    let proven_pre_effect_stops = analysis.proven_pre_effect_stops;
    let rpc =
        RpcClient::new_with_commitment(envelope.rpc_url.clone(), CommitmentConfig::finalized());
    let genesis = rpc.get_genesis_hash().map_err(|error| {
        SanitizedRpcFailure::from_error("reconcile-genesis-hash", &error).into_gate_error()
    })?;
    if genesis.to_string() != envelope.expected_genesis_hash {
        return Err(TrialGateError::Solana);
    }
    let journal = AttemptJournal::open_existing(
        journal_path
            .to_str()
            .ok_or(TrialGateError::ReconciliationRequired)?,
        packet_digest,
        &analysis,
    )?;
    let payer = keypair(&envelope.external_inputs.payer_keypair_path)?;
    let payer_balance_lamports = rpc.get_balance(&payer.pubkey()).map_err(|error| {
        SanitizedRpcFailure::from_error("reconcile-payer-balance", &error).into_gate_error()
    })?;
    let mut successes = 0;
    let mut failures = 0;
    let mut pending = 0;
    for encoded in &signatures {
        let signature = encoded
            .parse()
            .map_err(|_| TrialGateError::ReconciliationRequired)?;
        match rpc
            .get_signature_status_with_commitment_and_history(
                &signature,
                CommitmentConfig::finalized(),
                true,
            )
            .map_err(|error| {
                SanitizedRpcFailure::from_error("reconcile-signature-status", &error)
                    .into_gate_error()
            })? {
            Some(Ok(())) => {
                successes += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-finalized-success",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    None,
                    None,
                )?;
            }
            Some(Err(error)) => {
                failures += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-finalized-failure",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    Some(error.to_string().as_bytes()),
                    None,
                )?;
            }
            None => {
                pending += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-still-pending",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    None,
                    None,
                )?;
            }
        }
    }
    let (attempt_journal_record_count, attempt_journal_root_sha256) = journal.snapshot()?;
    Ok(ReconciliationReceipt {
        schema_version: "cav2-kep-devnet-reconciliation/v3",
        result: reconciliation_result(
            signatures.len(),
            pending,
            unsigned_ambiguous_effects,
            proven_pre_effect_stops,
        ),
        signatures_checked: signatures.len(),
        finalized_successes: successes,
        finalized_failures: failures,
        still_pending: pending,
        unsigned_ambiguous_effects,
        proven_pre_effect_stops,
        packet_digest: packet_digest.to_owned(),
        attempt_journal_record_count,
        attempt_journal_root_sha256,
        attempt_journal_integrity: "verified-packet-bound-sha256-chain",
        payer_balance_lamports,
        resubmissions: 0,
        authority_effect: "none",
        local_effect: "appended-reconciliation-observations-to-external-journal",
        observed_external_effect: "read-finalized-solana-signature-statuses-no-resubmission",
        authorization_attestation: "external-not-attested-by-runner",
    })
}

pub(crate) fn reconcile_deployment_continuation(
    envelope: &DeploymentContinuationEnvelope,
    packet_digest: &str,
) -> Result<DeploymentContinuationReconciliationReceipt, TrialGateError> {
    verified_continuation_predecessor(envelope, ContinuationPathMode::Reconcile)?;
    let journal_path = Path::new(&envelope.continuation_attempt_journal_path)
        .canonicalize()
        .map_err(|_| TrialGateError::ReconciliationRequired)?;
    let raw =
        fs::read_to_string(&journal_path).map_err(|_| TrialGateError::ReconciliationRequired)?;
    let analysis = analyze_attempt_journal(&raw, packet_digest)?;
    let signatures = analysis.signatures.clone();
    let rpc =
        RpcClient::new_with_commitment(envelope.rpc_url.clone(), CommitmentConfig::finalized());
    let genesis = rpc.get_genesis_hash().map_err(|error| {
        SanitizedRpcFailure::from_error("continuation-reconcile-genesis-hash", &error)
            .into_gate_error()
    })?;
    if genesis.to_string() != envelope.expected_genesis_hash {
        return Err(TrialGateError::Solana);
    }
    let journal = AttemptJournal::open_existing(
        journal_path
            .to_str()
            .ok_or(TrialGateError::ReconciliationRequired)?,
        packet_digest,
        &analysis,
    )?;
    let payer = keypair(&envelope.payer_keypair_path)?;
    let payer_balance_lamports = rpc.get_balance(&payer.pubkey()).map_err(|error| {
        SanitizedRpcFailure::from_error("continuation-reconcile-payer-balance", &error)
            .into_gate_error()
    })?;
    let mut successes = 0;
    let mut failures = 0;
    let mut pending = 0;
    for encoded in &signatures {
        let signature = encoded
            .parse()
            .map_err(|_| TrialGateError::ReconciliationRequired)?;
        match rpc
            .get_signature_status_with_commitment_and_history(
                &signature,
                CommitmentConfig::finalized(),
                true,
            )
            .map_err(|error| {
                SanitizedRpcFailure::from_error("continuation-reconcile-signature-status", &error)
                    .into_gate_error()
            })? {
            Some(Ok(())) => {
                successes += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-finalized-success",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    None,
                    None,
                )?;
            }
            Some(Err(error)) => {
                failures += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-finalized-failure",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    Some(error.to_string().as_bytes()),
                    None,
                )?;
            }
            None => {
                pending += 1;
                journal.record_with_effect(
                    "reconciliation",
                    "reconciled-still-pending",
                    "public-solana-finalized-read+external-journal-write",
                    Some(encoded),
                    None,
                    None,
                )?;
            }
        }
    }
    let (continuation_attempt_journal_record_count, continuation_attempt_journal_root_sha256) =
        journal.snapshot()?;
    Ok(DeploymentContinuationReconciliationReceipt {
        schema_version: "cav2-kep-deployment-continuation-reconciliation/v1",
        result: reconciliation_result(
            signatures.len(),
            pending,
            analysis.unsigned_ambiguous_effects,
            analysis.proven_pre_effect_stops,
        ),
        continuation_packet_digest: packet_digest.to_owned(),
        predecessor_packet_digest: envelope.predecessor_packet_digest.clone(),
        signatures_checked: signatures.len(),
        finalized_successes: successes,
        finalized_failures: failures,
        still_pending: pending,
        unsigned_ambiguous_effects: analysis.unsigned_ambiguous_effects,
        continuation_attempt_journal_record_count,
        continuation_attempt_journal_root_sha256,
        payer_balance_lamports,
        resubmissions: 0,
        protocol_submissions: 0,
        authority_effect: "none",
        observed_external_effect: "read-finalized-solana-signature-statuses-no-resubmission",
        authorization_attestation: "external-not-attested-by-runner",
    })
}

impl KeyCustodyPort for FileCustody {
    fn with_secret<R>(
        &self,
        handle: &SecretHandle,
        operation: impl FnOnce(&[u8]) -> Result<R, CryptographyError>,
    ) -> Result<R, CryptographyError> {
        let secret = self
            .secrets
            .get(handle)
            .ok_or(CryptographyError::SecretHandleMismatch)?;
        if secret.len() != 32 {
            return Err(CryptographyError::InvalidMaterial);
        }
        operation(secret.as_slice())
    }
}

struct SubmissionBudget {
    used: u16,
    limit: u16,
}

struct PreparedTrial {
    cryptography: ProductionCryptography<FileCustody>,
    material: PreparedMaterial,
    originator_binding: RecipientBinding,
    recipient_binding: RecipientBinding,
    replacement_binding: RecipientBinding,
    replacement_envelope: OpaqueRecipientEnvelope,
    plaintext: Zeroizing<Vec<u8>>,
}

impl SubmissionBudget {
    fn consume(&mut self) -> Result<(), TrialGateError> {
        if self.used >= self.limit {
            Err(TrialGateError::ProtocolBudget)
        } else {
            self.used += 1;
            Ok(())
        }
    }
}

fn digest(label: &[u8]) -> Digest32 {
    let bytes: [u8; 32] = Sha256::digest(label).into();
    Digest32::try_new(bytes).expect("SHA-256 cannot be the zero digest")
}

fn commitment(label: &[u8]) -> [u8; 32] {
    Sha256::digest(label).into()
}

fn raw32(path: &str) -> Result<[u8; 32], TrialGateError> {
    fs::read(path)
        .map_err(|_| TrialGateError::ExternalMaterial)?
        .try_into()
        .map_err(|_| TrialGateError::ExternalMaterial)
}

fn secret_snapshot(path: &str) -> Result<Zeroizing<Vec<u8>>, TrialGateError> {
    let secret = Zeroizing::new(fs::read(path).map_err(|_| TrialGateError::ExternalMaterial)?);
    if secret.len() != 32 {
        return Err(TrialGateError::ExternalMaterial);
    }
    Ok(secret)
}

fn keypair(path: &str) -> Result<Keypair, TrialGateError> {
    read_keypair_file(path).map_err(|_| TrialGateError::ExternalMaterial)
}

fn ensure_external_paths(envelope: &DevnetEnvelope) -> Result<(), TrialGateError> {
    let repository = trusted_repository_root()?;
    let inputs = &envelope.external_inputs;
    let existing = [
        &envelope.sbf_path,
        &inputs.payer_keypair_path,
        &inputs.originator_keypair_path,
        &inputs.recipient_keypair_path,
        &inputs.outsider_keypair_path,
        &inputs.program_keypair_path,
        &inputs.buffer_keypair_path,
        &inputs.upgrade_authority_keypair_path,
        &inputs.plaintext_fixture_path,
        &inputs.originator_hpke_public_path,
        &inputs.originator_hpke_private_path,
        &inputs.recipient_hpke_public_path,
        &inputs.recipient_hpke_private_path,
        &inputs.replacement_hpke_public_path,
        &inputs.replacement_hpke_private_path,
    ];
    let mut distinct_paths = BTreeSet::new();
    for selected in existing {
        let path = Path::new(selected)
            .canonicalize()
            .map_err(|_| TrialGateError::ExternalMaterial)?;
        if path.starts_with(&repository) || !distinct_paths.insert(path) {
            return Err(TrialGateError::RepositoryBoundary);
        }
    }
    if Path::new(&inputs.evidence_output_path).exists() {
        return Err(TrialGateError::EvidenceWrite);
    }
    if Path::new(&inputs.evidence_output_path) == Path::new(&inputs.attempt_journal_path) {
        return Err(TrialGateError::RepositoryBoundary);
    }
    for output in [&inputs.evidence_output_path, &inputs.attempt_journal_path] {
        let output_parent = Path::new(output)
            .parent()
            .ok_or(TrialGateError::RepositoryBoundary)?
            .canonicalize()
            .map_err(|_| TrialGateError::RepositoryBoundary)?;
        if output_parent.starts_with(&repository) {
            return Err(TrialGateError::RepositoryBoundary);
        }
    }
    Ok(())
}

fn trusted_repository_root() -> Result<PathBuf, TrialGateError> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .canonicalize()
        .map_err(|_| TrialGateError::RepositoryBoundary)?;
    let repository = manifest_dir
        .ancestors()
        .nth(5)
        .ok_or(TrialGateError::RepositoryBoundary)?
        .to_path_buf();
    if repository
        .join("cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli")
        .canonicalize()
        .map_err(|_| TrialGateError::RepositoryBoundary)?
        != manifest_dir
    {
        return Err(TrialGateError::RepositoryBoundary);
    }
    Ok(repository)
}

fn prepare_material(envelope: &DevnetEnvelope) -> Result<PreparedTrial, TrialGateError> {
    let inputs = &envelope.external_inputs;
    let plaintext = Zeroizing::new(
        fs::read(&inputs.plaintext_fixture_path).map_err(|_| TrialGateError::ExternalMaterial)?,
    );
    if plaintext.is_empty() {
        return Err(TrialGateError::ExternalMaterial);
    }
    let a_public = raw32(&inputs.originator_hpke_public_path)?;
    let b_public = raw32(&inputs.recipient_hpke_public_path)?;
    let b2_public = raw32(&inputs.replacement_hpke_public_path)?;
    if a_public == b_public || a_public == b2_public || b_public == b2_public {
        return Err(TrialGateError::ExternalMaterial);
    }
    let a_handle = SecretHandle("originator-hpke-v1".to_owned());
    let b_handle = SecretHandle("recipient-hpke-v1".to_owned());
    let b2_handle = SecretHandle("recipient-hpke-v2".to_owned());
    let custody = FileCustody {
        secrets: BTreeMap::from([
            (
                a_handle.clone(),
                secret_snapshot(&inputs.originator_hpke_private_path)?,
            ),
            (
                b_handle.clone(),
                secret_snapshot(&inputs.recipient_hpke_private_path)?,
            ),
            (
                b2_handle.clone(),
                secret_snapshot(&inputs.replacement_hpke_private_path)?,
            ),
        ]),
    };
    let cryptography = ProductionCryptography::new(custody);
    let a = RecipientBinding {
        recipient_id: digest(b"CA2-DEVNET-A"),
        key_binding_id: digest(&a_public),
        key_binding_version: 1,
        key_fingerprint: digest(&[b"fingerprint-a".as_slice(), &a_public].concat()),
    };
    let b = RecipientBinding {
        recipient_id: digest(b"CA2-DEVNET-B"),
        key_binding_id: digest(&b_public),
        key_binding_version: 1,
        key_fingerprint: digest(&[b"fingerprint-b".as_slice(), &b_public].concat()),
    };
    let b2 = RecipientBinding {
        recipient_id: b.recipient_id,
        key_binding_id: digest(&b2_public),
        key_binding_version: 2,
        key_fingerprint: digest(&[b"fingerprint-b2".as_slice(), &b2_public].concat()),
    };
    cryptography
        .keys()
        .register(a.key_binding_id, a_public, a_handle)
        .map_err(|_| TrialGateError::Cryptography)?;
    cryptography
        .keys()
        .register(b.key_binding_id, b_public, b_handle)
        .map_err(|_| TrialGateError::Cryptography)?;
    cryptography
        .keys()
        .register(b2.key_binding_id, b2_public, b2_handle)
        .map_err(|_| TrialGateError::Cryptography)?;
    let identity = Sha256Identity;
    let mut opaque_artifact_id = [0_u8; 32];
    getrandom::fill(&mut opaque_artifact_id).map_err(|_| TrialGateError::Cryptography)?;
    let context = CryptographicContext {
        artifact_version_id: Digest32::try_new(opaque_artifact_id)
            .map_err(|_| TrialGateError::Cryptography)?,
        policy_id: digest(b"CA2-KEP-NO-PRICE-POLICY-v1"),
        encryption_epoch: 1,
        plaintext_commitment: identity.digest(&plaintext),
    };
    let profile = production_profile(digest(b"CA2-KEP-PRODUCTION-CRYPTO-v1"));
    let material = cryptography
        .prepare(
            &profile,
            &context,
            &plaintext,
            &[a.clone(), b.clone()],
            &identity,
        )
        .map_err(|_| TrialGateError::Cryptography)?;
    for recipient in [&a, &b] {
        let opened = cryptography
            .open(&profile, &context, &material, recipient, &identity)
            .map_err(|_| TrialGateError::Cryptography)?;
        if opened != plaintext.as_slice() {
            return Err(TrialGateError::Cryptography);
        }
    }
    let replacement_envelope = cryptography
        .rewrap_for_reissue(&material, &a, &b2, b2_public, &identity)
        .map_err(|_| TrialGateError::Cryptography)?;
    let mut replacement_material = material.clone();
    replacement_material
        .envelopes
        .retain(|item| item.recipient.recipient_id != b.recipient_id);
    replacement_material
        .envelopes
        .push(replacement_envelope.clone());
    let replacement_opened = cryptography
        .open(&profile, &context, &replacement_material, &b2, &identity)
        .map_err(|_| TrialGateError::Cryptography)?;
    if replacement_opened != plaintext.as_slice() {
        return Err(TrialGateError::Cryptography);
    }
    Ok(PreparedTrial {
        cryptography,
        material,
        originator_binding: a,
        recipient_binding: b,
        replacement_binding: b2,
        replacement_envelope,
        plaintext,
    })
}

async fn persist(
    storage: &mut PostgresThreeLayerStorage,
    bytes: &[u8],
) -> Result<StorageReadiness, TrialGateError> {
    let (readiness, _) = persist_and_verify_material(storage, &Sha256Identity, 1, bytes)
        .await
        .map_err(|_| TrialGateError::Storage)?;
    if !readiness.is_ready() {
        return Err(TrialGateError::Storage);
    }
    Ok(readiness)
}

fn locator_commitment(readiness: &[StorageReadiness]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(b"CA2-KEP-LOCATOR-COMMITMENT-v1");
    for object in readiness {
        for layer in cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::model::StorageLayer::REQUIRED {
            let locator = object.locator(layer).expect("ready storage has every locator");
            hasher.update([layer as u8]);
            hasher.update(locator.token.as_bytes());
        }
    }
    hasher.finalize().into()
}

fn decryption_observation_digest(
    label: &[u8],
    material: &PreparedMaterial,
    recipient: &RecipientBinding,
    envelope_digest: &Digest32,
    finalized_revision: u64,
) -> String {
    let mut hasher = Sha256::new();
    hasher.update(b"CA2-KEP-DECRYPTION-OBSERVATION-v2\0");
    hasher.update(label);
    hasher.update(material.context.artifact_version_id.as_bytes());
    hasher.update(material.context.policy_id.as_bytes());
    hasher.update(material.context.encryption_epoch.to_be_bytes());
    hasher.update(material.ciphertext_identity.digest.as_bytes());
    hasher.update(recipient.recipient_id.as_bytes());
    hasher.update(recipient.key_binding_id.as_bytes());
    hasher.update(recipient.key_binding_version.to_be_bytes());
    hasher.update(recipient.key_fingerprint.as_bytes());
    hasher.update(envelope_digest.as_bytes());
    hasher.update(finalized_revision.to_be_bytes());
    hex_lower(&hasher.finalize())
}

fn protocol_instruction(
    program_id: Pubkey,
    data: ProtocolInstruction,
    accounts: Vec<AccountMeta>,
) -> Result<Instruction, TrialGateError> {
    Ok(Instruction {
        program_id,
        accounts,
        data: borsh::to_vec(&data).map_err(|_| TrialGateError::Solana)?,
    })
}

fn signed_transaction(
    rpc: &RpcClient,
    instruction: Instruction,
    payer: &Keypair,
    additional_signers: &[&Keypair],
) -> Result<Transaction, TrialGateError> {
    signed_instructions(rpc, &[instruction], payer, additional_signers)
}

fn signed_instructions(
    rpc: &RpcClient,
    instructions: &[Instruction],
    payer: &Keypair,
    additional_signers: &[&Keypair],
) -> Result<Transaction, TrialGateError> {
    let blockhash = rpc
        .get_latest_blockhash()
        .map_err(|_| TrialGateError::Solana)?;
    let mut signers: Vec<&dyn Signer> = vec![payer];
    signers.extend(additional_signers.iter().map(|item| *item as &dyn Signer));
    let transaction = Transaction::new_signed_with_payer(
        instructions,
        Some(&payer.pubkey()),
        &signers,
        blockhash,
    );
    if bincode::serialized_size(&transaction).map_err(|_| TrialGateError::Solana)?
        > SOLANA_PACKET_DATA_SIZE
    {
        return Err(TrialGateError::DeploymentBudgetImpossible);
    }
    Ok(transaction)
}

fn submit_success(
    rpc: &RpcClient,
    journal: &AttemptJournal,
    budget: &mut SubmissionBudget,
    case_id: &str,
    transaction: Transaction,
) -> Result<CaseEvidence, TrialGateError> {
    budget.consume()?;
    let local_signature = transaction.signatures[0].to_string();
    journal.record(
        case_id,
        "signed-before-submit",
        Some(&local_signature),
        None,
    )?;
    let fee = rpc
        .get_fee_for_message(&transaction.message)
        .map_err(|_| TrialGateError::Solana)?;
    let signature = match rpc.send_transaction_with_config(
        &transaction,
        RpcSendTransactionConfig {
            preflight_commitment: Some(CommitmentConfig::processed().commitment),
            max_retries: Some(0),
            ..RpcSendTransactionConfig::default()
        },
    ) {
        Ok(signature) => signature,
        Err(error) => {
            journal.record_with_effect(
                case_id,
                "ambiguous-send-error",
                "public-solana-transaction-submit+external-journal-write",
                Some(&local_signature),
                Some(error.to_string().as_bytes()),
                None,
            )?;
            return Err(TrialGateError::Solana);
        }
    };
    journal.record_with_effect(
        case_id,
        "submitted",
        "public-solana-transaction-submit+external-journal-write",
        Some(&signature.to_string()),
        None,
        None,
    )?;
    let outcome = match wait_for_finalized(rpc, &signature) {
        Ok(outcome) => outcome,
        Err(error) => {
            journal.record_with_effect(
                case_id,
                "ambiguous-finality-timeout-or-query-error",
                "public-solana-finalized-read+external-journal-write",
                Some(&signature.to_string()),
                None,
                None,
            )?;
            return Err(error);
        }
    };
    if outcome.is_err() {
        journal.record_with_effect(
            case_id,
            "finalized-failure",
            "public-solana-finalized-read+external-journal-write",
            Some(&signature.to_string()),
            outcome.err().as_deref().map(str::as_bytes),
            None,
        )?;
        return Err(TrialGateError::Solana);
    }
    journal.record_with_effect(
        case_id,
        "finalized-success",
        "public-solana-finalized-read+external-journal-write",
        Some(&signature.to_string()),
        None,
        None,
    )?;
    let statuses = rpc
        .get_signature_statuses_with_history(&[signature])
        .map_err(|_| TrialGateError::Solana)?;
    let slot = statuses
        .value
        .first()
        .and_then(|item| item.as_ref().map(|value| value.slot))
        .ok_or(TrialGateError::Solana)?;
    Ok(CaseEvidence {
        case_id: case_id.to_owned(),
        expected: "success-finalized",
        observed: "success-finalized",
        signature: signature.to_string(),
        slot: Some(slot),
        fee_lamports: fee,
        error_digest: None,
    })
}

fn submit_rejection(
    rpc: &RpcClient,
    journal: &AttemptJournal,
    budget: &mut SubmissionBudget,
    case_id: &str,
    transaction: Transaction,
) -> Result<CaseEvidence, TrialGateError> {
    budget.consume()?;
    let local_signature = transaction.signatures[0].to_string();
    journal.record(
        case_id,
        "signed-before-submit",
        Some(&local_signature),
        None,
    )?;
    let fee = rpc.get_fee_for_message(&transaction.message).unwrap_or(0);
    let signature = match rpc.send_transaction_with_config(
        &transaction,
        RpcSendTransactionConfig {
            skip_preflight: true,
            max_retries: Some(0),
            ..RpcSendTransactionConfig::default()
        },
    ) {
        Ok(signature) => signature,
        Err(error) => {
            journal.record_with_effect(
                case_id,
                "ambiguous-send-error",
                "public-solana-transaction-submit+external-journal-write",
                Some(&local_signature),
                Some(error.to_string().as_bytes()),
                None,
            )?;
            return Err(TrialGateError::Solana);
        }
    };
    journal.record_with_effect(
        case_id,
        "submitted",
        "public-solana-transaction-submit+external-journal-write",
        Some(&signature.to_string()),
        None,
        None,
    )?;
    let outcome = match wait_for_finalized(rpc, &signature) {
        Ok(outcome) => outcome,
        Err(error) => {
            journal.record_with_effect(
                case_id,
                "ambiguous-finality-timeout-or-query-error",
                "public-solana-finalized-read+external-journal-write",
                Some(&signature.to_string()),
                None,
                None,
            )?;
            return Err(error);
        }
    };
    let error = outcome
        .err()
        .ok_or(TrialGateError::NegativeCaseUnexpectedlySucceeded)?;
    journal.record_with_effect(
        case_id,
        "finalized-expected-failure",
        "public-solana-finalized-read+external-journal-write",
        Some(&signature.to_string()),
        Some(error.as_bytes()),
        None,
    )?;
    let statuses = rpc
        .get_signature_statuses_with_history(&[signature])
        .map_err(|_| TrialGateError::Solana)?;
    let slot = statuses
        .value
        .first()
        .and_then(|item| item.as_ref().map(|value| value.slot))
        .ok_or(TrialGateError::Solana)?;
    Ok(CaseEvidence {
        case_id: case_id.to_owned(),
        expected: "rejected-finalized-no-state-change",
        observed: "rejected-finalized-no-state-change",
        signature: signature.to_string(),
        slot: Some(slot),
        fee_lamports: fee,
        error_digest: Some(hex_lower(&Sha256::digest(error.as_bytes()))),
    })
}

fn wait_for_finalized(
    rpc: &RpcClient,
    signature: &solana_sdk::signature::Signature,
) -> Result<Result<(), String>, TrialGateError> {
    for _ in 0..240 {
        let status = rpc
            .get_signature_status_with_commitment_and_history(
                signature,
                CommitmentConfig::finalized(),
                true,
            )
            .map_err(|_| TrialGateError::Solana)?;
        if let Some(outcome) = status {
            return Ok(outcome.map_err(|error| error.to_string()));
        }
        thread::sleep(Duration::from_millis(500));
    }
    Err(TrialGateError::Solana)
}

fn finalized_artifact(
    rpc: &RpcClient,
    program_id: Pubkey,
    artifact: Pubkey,
) -> Result<ArtifactState, TrialGateError> {
    let account = rpc
        .get_account_with_commitment(&artifact, CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    if account.owner != program_id {
        return Err(TrialGateError::Solana);
    }
    ArtifactState::try_from_slice(&account.data).map_err(|_| TrialGateError::Solana)
}

#[allow(deprecated)]
fn deploy(
    rpc: &RpcClient,
    journal: &AttemptJournal,
    envelope: &DevnetEnvelope,
    payer: &Keypair,
    program: &Keypair,
    buffer: &Keypair,
    upgrade_authority: &Keypair,
) -> Result<DeploymentResult, TrialGateError> {
    let sbf = fs::read(&envelope.sbf_path).map_err(|_| TrialGateError::SbfIdentity)?;
    if rpc.get_account(&program.pubkey()).is_ok() || rpc.get_account(&buffer.pubkey()).is_ok() {
        return Err(TrialGateError::Solana);
    }
    let mut budget = SubmissionBudget {
        used: 0,
        limit: envelope.max_deployment_signed_transactions,
    };
    let mut cases = Vec::new();
    let buffer_rent = rpc
        .get_minimum_balance_for_rent_exemption(UpgradeableLoaderState::size_of_buffer(sbf.len()))
        .map_err(|_| TrialGateError::Solana)?;
    let create = loader_instruction::create_buffer(
        &payer.pubkey(),
        &buffer.pubkey(),
        &upgrade_authority.pubkey(),
        buffer_rent,
        sbf.len(),
    )
    .map_err(|_| TrialGateError::Solana)?;
    cases.push(submit_success(
        rpc,
        journal,
        &mut budget,
        "deployment-buffer-create",
        signed_instructions(rpc, &create, payer, &[buffer])?,
    )?);
    for (index, chunk) in sbf.chunks(DEPLOY_CHUNK_SIZE).enumerate() {
        let write = loader_instruction::write(
            &buffer.pubkey(),
            &upgrade_authority.pubkey(),
            u32::try_from(index * DEPLOY_CHUNK_SIZE)
                .map_err(|_| TrialGateError::DeploymentBudgetImpossible)?,
            chunk.to_vec(),
        );
        cases.push(submit_success(
            rpc,
            journal,
            &mut budget,
            &format!("deployment-write-{index:03}"),
            signed_transaction(rpc, write, payer, &[upgrade_authority])?,
        )?);
    }
    let program_rent = rpc
        .get_minimum_balance_for_rent_exemption(UpgradeableLoaderState::size_of_program())
        .map_err(|_| TrialGateError::Solana)?;
    let finalize = loader_instruction::deploy_with_max_program_len(
        &payer.pubkey(),
        &program.pubkey(),
        &buffer.pubkey(),
        &upgrade_authority.pubkey(),
        program_rent,
        sbf.len(),
    )
    .map_err(|_| TrialGateError::Solana)?;
    cases.push(submit_success(
        rpc,
        journal,
        &mut budget,
        "deployment-finalize",
        signed_instructions(rpc, &finalize, payer, &[program, upgrade_authority])?,
    )?);
    if budget.used > envelope.max_deployment_signed_transactions {
        return Err(TrialGateError::DeploymentBudgetImpossible);
    }
    let program_account = rpc
        .get_account_with_commitment(&program.pubkey(), CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    if !program_account.executable
        || program_account.owner != solana_sdk_ids::bpf_loader_upgradeable::id()
    {
        return Err(TrialGateError::Solana);
    }
    let program_state: UpgradeableLoaderState =
        bincode::deserialize(&program_account.data).map_err(|_| TrialGateError::Solana)?;
    let programdata_address = get_program_data_address(&program.pubkey());
    if program_state
        != (UpgradeableLoaderState::Program {
            programdata_address,
        })
    {
        return Err(TrialGateError::Solana);
    }
    let programdata = rpc
        .get_account_with_commitment(&programdata_address, CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    if programdata.owner != solana_sdk_ids::bpf_loader_upgradeable::id() {
        return Err(TrialGateError::Solana);
    }
    let metadata_size = UpgradeableLoaderState::size_of_programdata_metadata();
    let metadata: UpgradeableLoaderState = bincode::deserialize(
        programdata
            .data
            .get(..metadata_size)
            .ok_or(TrialGateError::Solana)?,
    )
    .map_err(|_| TrialGateError::Solana)?;
    match metadata {
        UpgradeableLoaderState::ProgramData {
            upgrade_authority_address: Some(authority),
            ..
        } if authority == upgrade_authority.pubkey() => {}
        _ => return Err(TrialGateError::Solana),
    }
    let remote_bytes = programdata
        .data
        .get(metadata_size..)
        .ok_or(TrialGateError::Solana)?;
    if remote_bytes != sbf {
        return Err(TrialGateError::Solana);
    }
    Ok(DeploymentResult {
        cases,
        programdata_address,
        program_rent_lamports: program_account.lamports,
        programdata_rent_lamports: programdata.lamports,
        remote_sbf_sha256: hex_lower(&Sha256::digest(remote_bytes)),
        upgrade_authority: upgrade_authority.pubkey(),
    })
}

#[allow(deprecated)]
pub(crate) fn continue_deployment(
    envelope: &DeploymentContinuationEnvelope,
    packet_digest: &str,
) -> Result<DeploymentContinuationEvidence, TrialGateError> {
    let verified = verified_continuation_predecessor(envelope, ContinuationPathMode::Fresh)?;
    let plan = verified.plan.clone();
    let journal =
        AttemptJournal::create(&envelope.continuation_attempt_journal_path, packet_digest)?;
    let predecessor_binding = serde_json::to_vec(&serde_json::json!({
        "predecessor_packet_digest": envelope.predecessor_packet_digest,
        "predecessor_attempt_journal_sha256": envelope.predecessor_attempt_journal_sha256,
        "predecessor_attempt_journal_root_sha256": envelope.predecessor_attempt_journal_root_sha256,
        "first_unwritten_chunk_index": plan.first_unwritten_chunk_index,
    }))
    .map_err(|_| TrialGateError::EvidenceWrite)?;
    journal.record(
        "deployment-continuation",
        "predecessor-proof-verified-before-effect",
        None,
        Some(&predecessor_binding),
    )?;

    let sbf = fs::read(&envelope.sbf_path).map_err(|_| TrialGateError::SbfIdentity)?;
    let payer = keypair(&envelope.payer_keypair_path)?;
    let program = keypair(&envelope.program_keypair_path)?;
    let buffer = keypair(&envelope.buffer_keypair_path)?;
    let upgrade_authority = keypair(&envelope.upgrade_authority_keypair_path)?;
    let identities = [
        payer.pubkey(),
        program.pubkey(),
        buffer.pubkey(),
        upgrade_authority.pubkey(),
    ];
    if identities.iter().collect::<BTreeSet<_>>().len() != identities.len() {
        return Err(TrialGateError::ExternalMaterial);
    }

    let rpc =
        RpcClient::new_with_commitment(envelope.rpc_url.clone(), CommitmentConfig::finalized());
    let genesis = rpc.get_genesis_hash().map_err(|error| {
        SanitizedRpcFailure::from_error("continuation-genesis-hash", &error).into_gate_error()
    })?;
    if genesis.to_string() != envelope.expected_genesis_hash {
        return Err(TrialGateError::Solana);
    }
    let payer_balance_lamports_before = rpc.get_balance(&payer.pubkey()).map_err(|error| {
        SanitizedRpcFailure::from_error("continuation-payer-balance", &error).into_gate_error()
    })?;
    validate_prefunded_balance(
        payer_balance_lamports_before,
        verified.predecessor.minimum_prefunded_lamports,
        verified.predecessor.maximum_prefunded_lamports,
    )?;
    if rpc
        .get_account_with_commitment(&program.pubkey(), CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .is_some()
    {
        return Err(TrialGateError::ContinuationProof);
    }
    let buffer_account = rpc
        .get_account_with_commitment(&buffer.pubkey(), CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::ContinuationProof)?;
    if buffer_account.executable
        || buffer_account.owner != solana_sdk_ids::bpf_loader_upgradeable::id()
    {
        return Err(TrialGateError::ContinuationProof);
    }
    let buffer_metadata_size = UpgradeableLoaderState::size_of_buffer_metadata();
    let buffer_state: UpgradeableLoaderState = bincode::deserialize(
        buffer_account
            .data
            .get(..buffer_metadata_size)
            .ok_or(TrialGateError::ContinuationProof)?,
    )
    .map_err(|_| TrialGateError::ContinuationProof)?;
    match buffer_state {
        UpgradeableLoaderState::Buffer {
            authority_address: Some(authority),
        } if authority == upgrade_authority.pubkey() => {}
        _ => return Err(TrialGateError::ContinuationProof),
    }
    let remote_buffer = buffer_account
        .data
        .get(buffer_metadata_size..)
        .ok_or(TrialGateError::ContinuationProof)?;
    let prefix_end = usize::from(plan.first_unwritten_chunk_index)
        .checked_mul(DEPLOY_CHUNK_SIZE)
        .ok_or(TrialGateError::DeploymentBudgetImpossible)?;
    if remote_buffer.len() != sbf.len()
        || prefix_end > sbf.len()
        || remote_buffer.get(..prefix_end) != sbf.get(..prefix_end)
        || remote_buffer
            .get(prefix_end..)
            .ok_or(TrialGateError::ContinuationProof)?
            .iter()
            .any(|byte| *byte != 0)
    {
        return Err(TrialGateError::ContinuationProof);
    }
    journal.record_with_effect(
        "deployment-continuation",
        "finalized-buffer-prefix-verified",
        "public-solana-finalized-read+external-journal-write",
        None,
        Some(&Sha256::digest(&remote_buffer[..prefix_end])),
        None,
    )?;

    let mut budget = SubmissionBudget {
        used: 0,
        limit: envelope.max_additional_deployment_signed_transactions,
    };
    let mut transactions = Vec::new();
    for (index, chunk) in sbf
        .chunks(DEPLOY_CHUNK_SIZE)
        .enumerate()
        .skip(usize::from(plan.first_unwritten_chunk_index))
    {
        let write = loader_instruction::write(
            &buffer.pubkey(),
            &upgrade_authority.pubkey(),
            u32::try_from(index * DEPLOY_CHUNK_SIZE)
                .map_err(|_| TrialGateError::DeploymentBudgetImpossible)?,
            chunk.to_vec(),
        );
        transactions.push(submit_success(
            &rpc,
            &journal,
            &mut budget,
            &format!("deployment-write-{index:03}"),
            signed_transaction(&rpc, write, &payer, &[&upgrade_authority])?,
        )?);
    }
    let program_rent = rpc
        .get_minimum_balance_for_rent_exemption(UpgradeableLoaderState::size_of_program())
        .map_err(|_| TrialGateError::Solana)?;
    let finalize = loader_instruction::deploy_with_max_program_len(
        &payer.pubkey(),
        &program.pubkey(),
        &buffer.pubkey(),
        &upgrade_authority.pubkey(),
        program_rent,
        sbf.len(),
    )
    .map_err(|_| TrialGateError::Solana)?;
    transactions.push(submit_success(
        &rpc,
        &journal,
        &mut budget,
        "deployment-finalize",
        signed_instructions(&rpc, &finalize, &payer, &[&program, &upgrade_authority])?,
    )?);
    if budget.used != plan.exact_additional_deployment_submissions {
        return Err(TrialGateError::DeploymentBudgetImpossible);
    }

    let program_account = rpc
        .get_account_with_commitment(&program.pubkey(), CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    if !program_account.executable
        || program_account.owner != solana_sdk_ids::bpf_loader_upgradeable::id()
    {
        return Err(TrialGateError::Solana);
    }
    let programdata_address = get_program_data_address(&program.pubkey());
    let program_state: UpgradeableLoaderState =
        bincode::deserialize(&program_account.data).map_err(|_| TrialGateError::Solana)?;
    if program_state
        != (UpgradeableLoaderState::Program {
            programdata_address,
        })
    {
        return Err(TrialGateError::Solana);
    }
    let programdata = rpc
        .get_account_with_commitment(&programdata_address, CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    let metadata_size = UpgradeableLoaderState::size_of_programdata_metadata();
    let metadata: UpgradeableLoaderState = bincode::deserialize(
        programdata
            .data
            .get(..metadata_size)
            .ok_or(TrialGateError::Solana)?,
    )
    .map_err(|_| TrialGateError::Solana)?;
    match metadata {
        UpgradeableLoaderState::ProgramData {
            upgrade_authority_address: Some(authority),
            ..
        } if authority == upgrade_authority.pubkey() => {}
        _ => return Err(TrialGateError::Solana),
    }
    let remote_sbf = programdata
        .data
        .get(metadata_size..)
        .ok_or(TrialGateError::Solana)?;
    if remote_sbf != sbf {
        return Err(TrialGateError::Solana);
    }
    journal.record_with_effect(
        "deployment-continuation",
        "exact-remote-sbf-verified",
        "public-solana-finalized-read+external-journal-write",
        None,
        Some(&Sha256::digest(remote_sbf)),
        None,
    )?;
    let payer_balance_lamports_after = rpc.get_balance(&payer.pubkey()).map_err(|error| {
        SanitizedRpcFailure::from_error("continuation-ending-balance", &error).into_gate_error()
    })?;
    let (continuation_attempt_journal_record_count, continuation_attempt_journal_root_sha256) =
        journal.snapshot()?;
    Ok(DeploymentContinuationEvidence {
        schema_version: "cav2-kep-deployment-continuation-evidence/v1-candidate",
        result: "PASS_BOUNDED_DEVNET_DEPLOYMENT_CONTINUATION",
        continuation_packet_digest: packet_digest.to_owned(),
        candidate_binding_digest: envelope.candidate_binding_digest.clone(),
        predecessor_packet_digest: envelope.predecessor_packet_digest.clone(),
        predecessor_attempt_journal_sha256: envelope
            .predecessor_attempt_journal_sha256
            .clone(),
        predecessor_attempt_journal_root_sha256: envelope
            .predecessor_attempt_journal_root_sha256
            .clone(),
        plan,
        replayed_predecessor_submissions: 0,
        transactions,
        program_id: program.pubkey().to_string(),
        programdata_address: programdata_address.to_string(),
        remote_sbf_sha256: hex_lower(&Sha256::digest(remote_sbf)),
        payer_balance_lamports_before,
        payer_balance_lamports_after,
        continuation_attempt_journal_record_count,
        continuation_attempt_journal_root_sha256,
        protocol_submissions: 0,
        authority_effect: "none",
        observed_external_effect: "bounded-public-devnet-deployment-continuation-only",
        authorization_attestation: "external-not-attested-by-runner",
        claim_ceiling: "Exact deployment continuation only; no protocol cases, PostgreSQL, Mainnet, production security, availability, admission, publication, or release claim.",
    })
}

pub(crate) fn write_continuation_evidence(
    envelope: &DeploymentContinuationEnvelope,
    evidence: &DeploymentContinuationEvidence,
) -> Result<(), TrialGateError> {
    let raw = serde_json::to_vec_pretty(evidence).map_err(|_| TrialGateError::EvidenceWrite)?;
    for path in [
        &envelope.payer_keypair_path,
        &envelope.program_keypair_path,
        &envelope.buffer_keypair_path,
        &envelope.upgrade_authority_keypair_path,
    ] {
        let secret = Zeroizing::new(fs::read(path).map_err(|_| TrialGateError::ExternalMaterial)?);
        if !secret.is_empty()
            && raw
                .windows(secret.len())
                .any(|window| window == secret.as_slice())
        {
            return Err(TrialGateError::EvidenceLeak);
        }
    }
    fs::write(
        &envelope.continuation_evidence_output_path,
        [raw, b"\n".to_vec()].concat(),
    )
    .map_err(|_| TrialGateError::EvidenceWrite)
}

pub(crate) async fn execute(
    envelope: &DevnetEnvelope,
    packet_digest: &str,
) -> Result<TrialEvidence, TrialGateError> {
    ensure_external_paths(envelope)?;
    let journal = AttemptJournal::create(
        &envelope.external_inputs.attempt_journal_path,
        packet_digest,
    )?;
    journal.record("trial", "operator-invoked-execution-start", None, None)?;
    let database_url = env::var("KEP_POSTGRES_TRIAL_URL").map_err(|_| TrialGateError::Storage)?;
    let parsed_database_url =
        url::Url::parse(&database_url).map_err(|_| TrialGateError::Storage)?;
    if !matches!(parsed_database_url.scheme(), "postgres" | "postgresql")
        || !matches!(
            parsed_database_url.host_str(),
            Some("127.0.0.1" | "localhost" | "::1")
        )
    {
        return Err(TrialGateError::Storage);
    }

    let inputs = &envelope.external_inputs;
    let payer = keypair(&inputs.payer_keypair_path)?;
    let originator = keypair(&inputs.originator_keypair_path)?;
    let recipient = keypair(&inputs.recipient_keypair_path)?;
    let outsider = keypair(&inputs.outsider_keypair_path)?;
    let program = keypair(&inputs.program_keypair_path)?;
    let buffer = keypair(&inputs.buffer_keypair_path)?;
    let upgrade_authority = keypair(&inputs.upgrade_authority_keypair_path)?;
    let wallet_keys = [
        payer.pubkey(),
        originator.pubkey(),
        recipient.pubkey(),
        outsider.pubkey(),
        program.pubkey(),
        buffer.pubkey(),
        upgrade_authority.pubkey(),
    ];
    if wallet_keys.iter().collect::<BTreeSet<_>>().len() != wallet_keys.len() {
        return Err(TrialGateError::ExternalMaterial);
    }
    let rpc =
        RpcClient::new_with_commitment(envelope.rpc_url.clone(), CommitmentConfig::finalized());
    let genesis = match rpc.get_genesis_hash() {
        Ok(genesis) => genesis,
        Err(error) => {
            let failure = SanitizedRpcFailure::from_error("execution-genesis-hash", &error);
            journal.record_rpc_failure(
                "devnet-cluster",
                "genesis-hash-query-failed",
                None,
                &failure,
            )?;
            return Err(failure.into_gate_error());
        }
    };
    if genesis.to_string() != envelope.expected_genesis_hash {
        journal.record(
            "devnet-cluster",
            "genesis-hash-mismatch-proven-pre-effect",
            None,
            None,
        )?;
        return Err(TrialGateError::Solana);
    }
    let prefunded_balance = match rpc.get_balance(&payer.pubkey()) {
        Ok(balance) => balance,
        Err(error) => {
            let failure = SanitizedRpcFailure::from_error("execution-prefunded-balance", &error);
            journal.record_rpc_failure(
                "devnet-funding",
                "prefunded-balance-query-failed",
                None,
                &failure,
            )?;
            return Err(failure.into_gate_error());
        }
    };
    if let Err(error) = validate_prefunded_balance(
        prefunded_balance,
        envelope.minimum_prefunded_lamports,
        envelope.maximum_prefunded_lamports,
    ) {
        let stage = if prefunded_balance < envelope.minimum_prefunded_lamports {
            "prefunded-balance-insufficient"
        } else {
            "prefunded-balance-above-authorized-maximum"
        };
        journal.record("devnet-funding", stage, None, None)?;
        return Err(error);
    }
    journal.record("devnet-funding", "prefunded-balance-verified", None, None)?;
    let funding = FundingEvidence {
        mode: "prefunded-only",
        observed_balance_lamports: prefunded_balance,
        minimum_balance_lamports: envelope.minimum_prefunded_lamports,
        maximum_balance_lamports: envelope.maximum_prefunded_lamports,
        result: "prefunded-balance-verified",
    };

    let PreparedTrial {
        cryptography,
        material,
        originator_binding: a_binding,
        recipient_binding: b_binding,
        replacement_binding: b2_binding,
        replacement_envelope,
        plaintext,
    } = prepare_material(envelope)?;
    let identity = Sha256Identity;
    let profile = production_profile(material.profile_id);
    let mut storage = PostgresThreeLayerStorage::connect(&database_url, 4)
        .await
        .map_err(|_| TrialGateError::Storage)?;
    let a_envelope = material
        .envelopes
        .iter()
        .find(|item| item.recipient == a_binding)
        .ok_or(TrialGateError::Cryptography)?;
    let b_envelope = material
        .envelopes
        .iter()
        .find(|item| item.recipient == b_binding)
        .ok_or(TrialGateError::Cryptography)?;
    journal.record_with_effect(
        "storage-initial-material",
        "write-before-effect",
        "loopback-postgresql-read-write+external-journal-write",
        None,
        None,
        None,
    )?;
    let ciphertext_readiness = persist(&mut storage, &material.ciphertext).await?;
    let a_readiness = persist(&mut storage, &a_envelope.envelope_bytes).await?;
    let b_readiness = persist(&mut storage, &b_envelope.envelope_bytes).await?;
    let mut readiness = vec![
        ciphertext_readiness.clone(),
        a_readiness.clone(),
        b_readiness.clone(),
    ];
    let durable_locator_commitment = locator_commitment(&readiness);
    journal.record_with_effect(
        "storage-initial-material",
        "three-layer-verified",
        "loopback-postgresql-read-write+external-journal-write",
        None,
        Some(&durable_locator_commitment),
        None,
    )?;

    let funded_balance = prefunded_balance;
    let deployment = deploy(
        &rpc,
        &journal,
        envelope,
        &payer,
        &program,
        &buffer,
        &upgrade_authority,
    )?;

    let program_id = program.pubkey();
    let artifact_id = *material.context.artifact_version_id.as_bytes();
    let (artifact, _) = Pubkey::find_program_address(&[ARTIFACT_SEED, &artifact_id], &program_id);
    let mut budget = SubmissionBudget {
        used: 0,
        limit: envelope.max_protocol_signed_transactions,
    };
    let mut cases = Vec::new();
    let op_init = commitment(b"initialize-v1");
    let (init_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_init], &program_id);
    let init = protocol_instruction(
        program_id,
        ProtocolInstruction::InitializeArtifact {
            artifact_id,
            policy_commitment: *material.context.policy_id.as_bytes(),
            epoch: material.context.encryption_epoch,
            ciphertext_commitment: *material.ciphertext_identity.digest.as_bytes(),
            originator_envelope_commitment: *a_envelope.envelope_identity.digest.as_bytes(),
            locator_commitment: durable_locator_commitment,
            operation_id: op_init,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(init_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_success(
        &rpc,
        &journal,
        &mut budget,
        "initialize-positive",
        signed_transaction(&rpc, init, &payer, &[&originator])?,
    )?);
    let initialized_state = finalized_artifact(&rpc, program_id, artifact)?;
    if initialized_state.originator != originator.pubkey()
        || initialized_state.has_recipient
        || initialized_state.revision != 0
    {
        return Err(TrialGateError::Solana);
    }

    let op_wrong = commitment(b"grant-wrong-signer-v1");
    let (wrong_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_wrong], &program_id);
    let grant_wrong = protocol_instruction(
        program_id,
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: *b_binding.key_binding_id.as_bytes(),
            recipient_envelope_commitment: *b_envelope.envelope_identity.digest.as_bytes(),
            expected_revision: 0,
            operation_id: op_wrong,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(outsider.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(wrong_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_rejection(
        &rpc,
        &journal,
        &mut budget,
        "grant-wrong-signer",
        signed_transaction(&rpc, grant_wrong, &payer, &[&outsider])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != initialized_state {
        return Err(TrialGateError::Solana);
    }

    let op_stale = commitment(b"grant-stale-v1");
    let (stale_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_stale], &program_id);
    let grant_stale = protocol_instruction(
        program_id,
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: *b_binding.key_binding_id.as_bytes(),
            recipient_envelope_commitment: *b_envelope.envelope_identity.digest.as_bytes(),
            expected_revision: 9,
            operation_id: op_stale,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(stale_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_rejection(
        &rpc,
        &journal,
        &mut budget,
        "grant-stale-revision",
        signed_transaction(&rpc, grant_stale, &payer, &[&originator])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != initialized_state {
        return Err(TrialGateError::Solana);
    }

    let op_grant = commitment(b"grant-positive-v1");
    let (grant_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_grant], &program_id);
    let grant = protocol_instruction(
        program_id,
        ProtocolInstruction::GrantCoownership {
            recipient: recipient.pubkey(),
            recipient_key_commitment: *b_binding.key_binding_id.as_bytes(),
            recipient_envelope_commitment: *b_envelope.envelope_identity.digest.as_bytes(),
            expected_revision: 0,
            operation_id: op_grant,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(grant_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_success(
        &rpc,
        &journal,
        &mut budget,
        "grant-positive",
        signed_transaction(&rpc, grant, &payer, &[&originator])?,
    )?);
    let grant_state = finalized_artifact(&rpc, program_id, artifact)?;
    if grant_state.originator != originator.pubkey()
        || grant_state.recipient != recipient.pubkey()
        || !grant_state.has_recipient
        || grant_state.revision != 1
        || grant_state.recipient_key_commitment != *b_binding.key_binding_id.as_bytes()
        || grant_state.recipient_key_envelope_binding
            != key_envelope_binding(
                b_binding.key_binding_id.as_bytes(),
                b_envelope.envelope_identity.digest.as_bytes(),
            )
    {
        return Err(TrialGateError::Solana);
    }
    drop(storage);
    let mut storage = PostgresThreeLayerStorage::connect(&database_url, 4)
        .await
        .map_err(|_| TrialGateError::Storage)?;
    let retrieved_ciphertext = retrieve_verified(
        &storage,
        &identity,
        1,
        ciphertext_readiness
            .locator(StorageLayer::Operational)
            .ok_or(TrialGateError::Storage)?,
        &material.ciphertext_identity,
    )
    .await
    .map_err(|_| TrialGateError::Storage)?;
    let retrieved_a_envelope = retrieve_verified(
        &storage,
        &identity,
        1,
        a_readiness
            .locator(StorageLayer::Operational)
            .ok_or(TrialGateError::Storage)?,
        &a_envelope.envelope_identity,
    )
    .await
    .map_err(|_| TrialGateError::Storage)?;
    let retrieved_b_envelope = retrieve_verified(
        &storage,
        &identity,
        1,
        b_readiness
            .locator(StorageLayer::Operational)
            .ok_or(TrialGateError::Storage)?,
        &b_envelope.envelope_identity,
    )
    .await
    .map_err(|_| TrialGateError::Storage)?;
    let mut retrieved_material = material.clone();
    retrieved_material.ciphertext = retrieved_ciphertext;
    for envelope in &mut retrieved_material.envelopes {
        if envelope.recipient == a_binding {
            envelope.envelope_bytes = retrieved_a_envelope.clone();
        } else if envelope.recipient == b_binding {
            envelope.envelope_bytes = retrieved_b_envelope.clone();
        }
    }
    let opened = cryptography
        .open(
            &profile,
            &retrieved_material.context,
            &retrieved_material,
            &b_binding,
            &identity,
        )
        .map_err(|_| TrialGateError::Cryptography)?;
    if opened != plaintext.as_slice() {
        return Err(TrialGateError::Cryptography);
    }

    journal.record_with_effect(
        "storage-replacement-envelope",
        "write-before-effect",
        "loopback-postgresql-read-write+external-journal-write",
        None,
        None,
        None,
    )?;
    let replacement_readiness = persist(&mut storage, &replacement_envelope.envelope_bytes).await?;
    readiness.push(replacement_readiness.clone());
    journal.record_with_effect(
        "storage-replacement-envelope",
        "three-layer-verified",
        "loopback-postgresql-read-write+external-journal-write",
        None,
        Some(replacement_envelope.envelope_identity.digest.as_bytes()),
        None,
    )?;
    let op_request_bad = commitment(b"request-outsider-v1");
    let (request, _) = Pubkey::find_program_address(
        &[
            REISSUE_SEED,
            &artifact_id,
            recipient.pubkey().as_ref(),
            &1_u64.to_le_bytes(),
        ],
        &program_id,
    );
    let (request_bad_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_request_bad], &program_id);
    let request_bad = protocol_instruction(
        program_id,
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment: *b2_binding.key_binding_id.as_bytes(),
            expected_revision: 1,
            operation_id: op_request_bad,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(outsider.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(request_bad_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_rejection(
        &rpc,
        &journal,
        &mut budget,
        "reissue-request-outsider",
        signed_transaction(&rpc, request_bad, &payer, &[&outsider])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != grant_state {
        return Err(TrialGateError::Solana);
    }

    let op_request = commitment(b"request-positive-v1");
    let (request_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_request], &program_id);
    let request_positive = protocol_instruction(
        program_id,
        ProtocolInstruction::RequestReissue {
            replacement_key_commitment: *b2_binding.key_binding_id.as_bytes(),
            expected_revision: 1,
            operation_id: op_request,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(recipient.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(request_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_success(
        &rpc,
        &journal,
        &mut budget,
        "reissue-request-positive",
        signed_transaction(&rpc, request_positive.clone(), &payer, &[&recipient])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != grant_state {
        return Err(TrialGateError::Solana);
    }
    cases.push(submit_rejection(
        &rpc,
        &journal,
        &mut budget,
        "reissue-request-replay",
        signed_transaction(&rpc, request_positive, &payer, &[&recipient])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != grant_state {
        return Err(TrialGateError::Solana);
    }

    let op_self = commitment(b"fulfill-self-v1");
    let (self_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_self], &program_id);
    let fulfill_self = protocol_instruction(
        program_id,
        ProtocolInstruction::FulfillReissue {
            replacement_envelope_commitment: *replacement_envelope
                .envelope_identity
                .digest
                .as_bytes(),
            expected_revision: 1,
            operation_id: op_self,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(recipient.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(self_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_rejection(
        &rpc,
        &journal,
        &mut budget,
        "reissue-self-fulfillment",
        signed_transaction(&rpc, fulfill_self, &payer, &[&recipient])?,
    )?);
    if finalized_artifact(&rpc, program_id, artifact)? != grant_state {
        return Err(TrialGateError::Solana);
    }

    let op_fulfill = commitment(b"fulfill-positive-v1");
    let (fulfill_replay, _) =
        Pubkey::find_program_address(&[REPLAY_SEED, &artifact_id, &op_fulfill], &program_id);
    let fulfill = protocol_instruction(
        program_id,
        ProtocolInstruction::FulfillReissue {
            replacement_envelope_commitment: *replacement_envelope
                .envelope_identity
                .digest
                .as_bytes(),
            expected_revision: 1,
            operation_id: op_fulfill,
        },
        vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new_readonly(originator.pubkey(), true),
            AccountMeta::new(artifact, false),
            AccountMeta::new(request, false),
            AccountMeta::new(fulfill_replay, false),
            AccountMeta::new_readonly(system_program::id(), false),
        ],
    )?;
    cases.push(submit_success(
        &rpc,
        &journal,
        &mut budget,
        "reissue-fulfill-positive",
        signed_transaction(&rpc, fulfill, &payer, &[&originator])?,
    )?);
    let reissue_state = finalized_artifact(&rpc, program_id, artifact)?;
    let mut expected_reissue_state = grant_state.clone();
    expected_reissue_state.recipient_key_commitment = *b2_binding.key_binding_id.as_bytes();
    expected_reissue_state.recipient_envelope_commitment =
        *replacement_envelope.envelope_identity.digest.as_bytes();
    expected_reissue_state.recipient_key_envelope_binding = key_envelope_binding(
        b2_binding.key_binding_id.as_bytes(),
        replacement_envelope.envelope_identity.digest.as_bytes(),
    );
    expected_reissue_state.revision = 2;
    if reissue_state != expected_reissue_state {
        return Err(TrialGateError::Solana);
    }
    let request_account = rpc
        .get_account_with_commitment(&request, CommitmentConfig::finalized())
        .map_err(|_| TrialGateError::Solana)?
        .value
        .ok_or(TrialGateError::Solana)?;
    let request_state = ReissueRequest::try_from_slice(&request_account.data)
        .map_err(|_| TrialGateError::Solana)?;
    if !request_state.fulfilled {
        return Err(TrialGateError::Solana);
    }
    drop(storage);
    let storage = PostgresThreeLayerStorage::connect(&database_url, 4)
        .await
        .map_err(|_| TrialGateError::Storage)?;
    let retrieved_ciphertext = retrieve_verified(
        &storage,
        &identity,
        1,
        ciphertext_readiness
            .locator(StorageLayer::Operational)
            .ok_or(TrialGateError::Storage)?,
        &material.ciphertext_identity,
    )
    .await
    .map_err(|_| TrialGateError::Storage)?;
    let retrieved_replacement = retrieve_verified(
        &storage,
        &identity,
        1,
        replacement_readiness
            .locator(StorageLayer::Operational)
            .ok_or(TrialGateError::Storage)?,
        &replacement_envelope.envelope_identity,
    )
    .await
    .map_err(|_| TrialGateError::Storage)?;
    let mut replacement_material = material.clone();
    replacement_material.ciphertext = retrieved_ciphertext;
    replacement_material
        .envelopes
        .retain(|item| item.recipient.recipient_id != b_binding.recipient_id);
    let mut retrieved_replacement_envelope = replacement_envelope;
    retrieved_replacement_envelope.envelope_bytes = retrieved_replacement;
    replacement_material
        .envelopes
        .push(retrieved_replacement_envelope);
    let replacement_opened = cryptography
        .open(
            &profile,
            &replacement_material.context,
            &replacement_material,
            &b2_binding,
            &identity,
        )
        .map_err(|_| TrialGateError::Cryptography)?;
    if replacement_opened != plaintext.as_slice() {
        return Err(TrialGateError::Cryptography);
    }
    let ending_balance = rpc
        .get_balance(&payer.pubkey())
        .map_err(|_| TrialGateError::Solana)?;
    let fee_total = cases.iter().map(|item| item.fee_lamports).sum();
    let deployment_fee_total = deployment.cases.iter().map(|item| item.fee_lamports).sum();
    let final_locator_commitment = locator_commitment(&readiness);
    let grant_state_bytes = borsh::to_vec(&grant_state).map_err(|_| TrialGateError::Solana)?;
    let reissue_state_bytes = borsh::to_vec(&reissue_state).map_err(|_| TrialGateError::Solana)?;
    let observations = vec![
        ObservationEvidence {
            case_id: "storage-three-layer-ready",
            expected: "four encrypted objects ready in all three layers",
            observed: "verified-after-two-provider-restarts",
            input_sha256: hex_lower(material.ciphertext_identity.digest.as_bytes()),
            output_sha256: hex_lower(&final_locator_commitment),
        },
        ObservationEvidence {
            case_id: "grant-finalized-fetch",
            expected: "A preserved and B added at finalized revision one",
            observed: "finalized-state-exact",
            input_sha256: hex_lower(&Sha256::digest(initialized_state.artifact_id)),
            output_sha256: hex_lower(&Sha256::digest(&grant_state_bytes)),
        },
        ObservationEvidence {
            case_id: "recipient-decryption",
            expected: "B opens restart-retrieved ciphertext and envelope",
            observed: "runner-local-decrypt-and-exact-compare",
            input_sha256: hex_lower(material.ciphertext_identity.digest.as_bytes()),
            output_sha256: decryption_observation_digest(
                b"recipient-v1",
                &material,
                &b_binding,
                &b_envelope.envelope_identity.digest,
                grant_state.revision,
            ),
        },
        ObservationEvidence {
            case_id: "reissue-state-isolation",
            expected: "only B key-envelope binding and permitted revision/request state change",
            observed: "exact-structural-equality-except-permitted-fields",
            input_sha256: hex_lower(&Sha256::digest(&grant_state_bytes)),
            output_sha256: hex_lower(&Sha256::digest(&reissue_state_bytes)),
        },
        ObservationEvidence {
            case_id: "replacement-recipient-decryption",
            expected: "B2 opens restart-retrieved ciphertext and replacement envelope",
            observed: "runner-local-decrypt-and-exact-compare",
            input_sha256: hex_lower(
                replacement_material
                    .envelopes
                    .last()
                    .ok_or(TrialGateError::Cryptography)?
                    .envelope_identity
                    .digest
                    .as_bytes(),
            ),
            output_sha256: decryption_observation_digest(
                b"recipient-v2",
                &replacement_material,
                &b2_binding,
                &replacement_material
                    .envelopes
                    .last()
                    .ok_or(TrialGateError::Cryptography)?
                    .envelope_identity
                    .digest,
                reissue_state.revision,
            ),
        },
        ObservationEvidence {
            case_id: "cost-observation",
            expected: "infrastructure costs recorded separately from zero consideration",
            observed: "fees-rent-and-local-storage-class-separated",
            input_sha256: hex_lower(&Sha256::digest(
                [
                    fee_total,
                    deployment_fee_total,
                    funded_balance,
                    ending_balance,
                ]
                .into_iter()
                .flat_map(u64::to_be_bytes)
                .collect::<Vec<_>>(),
            )),
            output_sha256: hex_lower(&Sha256::digest(0_u64.to_be_bytes())),
        },
    ];
    let observed_case_ids: BTreeSet<&str> = cases
        .iter()
        .map(|item| item.case_id.as_str())
        .chain(observations.iter().map(|item| item.case_id))
        .collect();
    let required_case_ids: BTreeSet<&str> = envelope
        .enumerated_case_ids
        .iter()
        .map(String::as_str)
        .collect();
    if observed_case_ids != required_case_ids {
        return Err(TrialGateError::ExternalMaterial);
    }
    journal.record("trial", "complete-before-evidence-write", None, None)?;
    let (attempt_journal_record_count, attempt_journal_root_sha256) = journal.snapshot()?;
    Ok(TrialEvidence {
        schema_version: "cav2-kep-devnet-trial-evidence/v2-candidate",
        result: "PASS_BOUNDED_DEVNET",
        cluster: "solana-devnet",
        genesis_hash: genesis.to_string(),
        program_id: program_id.to_string(),
        sbf_sha256: envelope.sbf_sha256.clone(),
        funding,
        deployment: DeploymentEvidence {
            signed_submissions: u16::try_from(deployment.cases.len())
                .map_err(|_| TrialGateError::DeploymentBudgetImpossible)?,
            transactions: deployment.cases,
            programdata_address: deployment.programdata_address.to_string(),
            program_rent_lamports: deployment.program_rent_lamports,
            programdata_rent_lamports: deployment.programdata_rent_lamports,
            remote_sbf_sha256: deployment.remote_sbf_sha256,
            upgrade_authority: deployment.upgrade_authority.to_string(),
        },
        storage: StorageEvidence {
            provider: "postgresql-v1",
            encrypted_object_count: readiness.len() as u16,
            every_object_ready_in_three_layers: readiness.iter().all(StorageReadiness::is_ready),
            locator_commitment_sha256: hex::encode(final_locator_commitment),
        },
        cases,
        observations,
        finalized_grant_revision: grant_state.revision,
        finalized_reissue_revision: reissue_state.revision,
        recipient_decryption: "exact-fixture-match",
        replacement_recipient_decryption: "exact-fixture-match",
        protocol_transaction_fee_lamports: fee_total,
        deployment_transaction_fee_lamports: deployment_fee_total,
        payer_balance_delta_lamports: funded_balance.saturating_sub(ending_balance),
        retained_program_rent_lamports: deployment
            .program_rent_lamports
            .saturating_add(deployment.programdata_rent_lamports),
        storage_cost_observation: "local-postgresql-no-billed-knowledge-consideration",
        knowledge_consideration_lamports: 0,
        protocol_signed_submissions: budget.used,
        packet_digest: packet_digest.to_owned(),
        attempt_journal_record_count,
        attempt_journal_root_sha256,
        attempt_journal_integrity: "verified-packet-bound-sha256-chain",
        authority_effect: "none",
        observed_external_effect: "bounded-public-devnet-effects-executed",
        authorization_attestation: "external-not-attested-by-runner",
        claim_ceiling: "Exact operator-invoked public Devnet v1 trial executed after an external authorization decision that the runner does not authenticate or attest; no Mainnet, production security, availability, publication, or release claim.",
    })
}

pub(crate) fn write_evidence(
    envelope: &DevnetEnvelope,
    evidence: &TrialEvidence,
) -> Result<(), TrialGateError> {
    let raw = serde_json::to_vec_pretty(evidence).map_err(|_| TrialGateError::EvidenceWrite)?;
    let inputs = &envelope.external_inputs;
    let plaintext = Zeroizing::new(
        fs::read(&inputs.plaintext_fixture_path).map_err(|_| TrialGateError::ExternalMaterial)?,
    );
    let private_paths = [
        &inputs.originator_hpke_private_path,
        &inputs.recipient_hpke_private_path,
        &inputs.replacement_hpke_private_path,
        &inputs.payer_keypair_path,
        &inputs.originator_keypair_path,
        &inputs.recipient_keypair_path,
        &inputs.outsider_keypair_path,
        &inputs.program_keypair_path,
        &inputs.buffer_keypair_path,
        &inputs.upgrade_authority_keypair_path,
    ];
    if !plaintext.is_empty()
        && raw
            .windows(plaintext.len())
            .any(|window| window == plaintext.as_slice())
    {
        return Err(TrialGateError::EvidenceLeak);
    }
    for path in private_paths {
        let secret = Zeroizing::new(fs::read(path).map_err(|_| TrialGateError::ExternalMaterial)?);
        if !secret.is_empty()
            && raw
                .windows(secret.len())
                .any(|window| window == secret.as_slice())
        {
            return Err(TrialGateError::EvidenceLeak);
        }
    }
    fs::write(&inputs.evidence_output_path, [raw, b"\n".to_vec()].concat())
        .map_err(|_| TrialGateError::EvidenceWrite)
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEST_PACKET: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    fn journal_line(
        stage: &str,
        signature: Option<&str>,
        failure_stage: Option<&str>,
        failure_class: Option<&str>,
    ) -> String {
        let payload = AttemptRecordPayload {
            schema_version: JOURNAL_SCHEMA,
            packet_digest: TEST_PACKET,
            sequence: 0,
            previous_record_sha256: EMPTY_JOURNAL_ROOT,
            effect_id: "test-effect",
            stage,
            observed_effect: "external-journal-write",
            signature,
            detail_sha256: None,
            failure_stage,
            failure_class,
        };
        let record = AttemptRecord {
            schema_version: JOURNAL_SCHEMA.to_owned(),
            packet_digest: TEST_PACKET.to_owned(),
            sequence: 0,
            previous_record_sha256: EMPTY_JOURNAL_ROOT.to_owned(),
            effect_id: "test-effect".to_owned(),
            stage: stage.to_owned(),
            observed_effect: "external-journal-write".to_owned(),
            signature: signature.map(str::to_owned),
            detail_sha256: None,
            failure_stage: failure_stage.map(str::to_owned),
            failure_class: failure_class.map(str::to_owned),
            record_sha256: attempt_record_sha256(&payload).expect("hash journal record"),
        };
        serde_json::to_string(&record).expect("serialize journal record")
    }

    fn append_journal_record(
        raw: &mut String,
        sequence: &mut u64,
        previous: &mut String,
        effect_id: &str,
        stage: &str,
        signature: Option<&str>,
    ) {
        let payload = AttemptRecordPayload {
            schema_version: JOURNAL_SCHEMA,
            packet_digest: TEST_PACKET,
            sequence: *sequence,
            previous_record_sha256: previous,
            effect_id,
            stage,
            observed_effect: "external-journal-write",
            signature,
            detail_sha256: None,
            failure_stage: None,
            failure_class: None,
        };
        let record_sha256 = attempt_record_sha256(&payload).expect("hash journal record");
        let record = AttemptRecord {
            schema_version: JOURNAL_SCHEMA.to_owned(),
            packet_digest: TEST_PACKET.to_owned(),
            sequence: *sequence,
            previous_record_sha256: previous.clone(),
            effect_id: effect_id.to_owned(),
            stage: stage.to_owned(),
            observed_effect: "external-journal-write".to_owned(),
            signature: signature.map(str::to_owned),
            detail_sha256: None,
            failure_stage: None,
            failure_class: None,
            record_sha256: record_sha256.clone(),
        };
        raw.push_str(&serde_json::to_string(&record).expect("serialize journal record"));
        raw.push('\n');
        *sequence += 1;
        *previous = record_sha256;
    }

    fn deployment_journal(finalized_write_indices: &[u16], reconcile: bool) -> String {
        let mut raw = String::new();
        let mut sequence = 0;
        let mut previous = EMPTY_JOURNAL_ROOT.to_owned();
        let mut effects = vec!["deployment-buffer-create".to_owned()];
        effects.extend(
            finalized_write_indices
                .iter()
                .map(|index| format!("deployment-write-{index:03}")),
        );
        let mut signatures = Vec::new();
        for (ordinal, effect_id) in effects.iter().enumerate() {
            let signature = format!("signature-{ordinal:03}");
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                effect_id,
                "signed-before-submit",
                Some(&signature),
            );
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                effect_id,
                "submitted",
                Some(&signature),
            );
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                effect_id,
                "finalized-success",
                Some(&signature),
            );
            signatures.push(signature);
        }
        if reconcile {
            for signature in signatures {
                append_journal_record(
                    &mut raw,
                    &mut sequence,
                    &mut previous,
                    "reconciliation",
                    "reconciled-finalized-success",
                    Some(&signature),
                );
            }
        }
        raw
    }

    #[test]
    fn sanitized_rpc_failure_classifies_rate_limit_without_retaining_raw_detail() {
        let raw = "HTTP status 429 Too Many Requests: secret-provider-message";
        let failure = SanitizedRpcFailure::from_error("funding", &raw);
        assert_eq!("funding", failure.stage);
        assert_eq!("rate-limited-rejection", failure.class);
        assert_eq!(64, failure.detail_sha256.len());
        assert!(!failure.detail_sha256.contains("secret-provider-message"));
    }

    #[test]
    fn sanitized_rpc_failure_distinguishes_transport_ambiguity() {
        let failure =
            SanitizedRpcFailure::from_error("balance", &"connection timed out before response");
        assert_eq!("transport-ambiguous", failure.class);
    }

    #[test]
    fn actual_transport_ambiguity_record_remains_pending() {
        let raw = journal_line(
            "prefunded-balance-query-failed",
            None,
            Some("execution-prefunded-balance"),
            Some("transport-ambiguous"),
        );
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert_eq!(0, analysis.signatures.len());
        assert_eq!(1, analysis.unsigned_ambiguous_effects);
        assert_eq!(0, analysis.proven_pre_effect_stops);
        assert_eq!(
            "PENDING",
            reconciliation_result(
                analysis.signatures.len(),
                0,
                analysis.unsigned_ambiguous_effects,
                analysis.proven_pre_effect_stops,
            )
        );
    }

    #[test]
    fn unclassified_unsigned_failure_remains_pending() {
        let raw = journal_line(
            "genesis-hash-query-failed",
            None,
            Some("execution-genesis-hash"),
            Some("unclassified-rpc-or-transport"),
        );
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert_eq!(1, analysis.unsigned_ambiguous_effects);
        assert_eq!(
            "PENDING",
            reconciliation_result(0, 0, analysis.unsigned_ambiguous_effects, 0)
        );
    }

    #[test]
    fn known_genesis_rejection_is_a_proven_pre_effect_stop() {
        let raw = journal_line(
            "genesis-hash-query-failed",
            None,
            Some("execution-genesis-hash"),
            Some("rpc-rejection"),
        );
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert_eq!(0, analysis.unsigned_ambiguous_effects);
        assert_eq!(1, analysis.proven_pre_effect_stops);
        assert_eq!(
            "PROVEN_PRE_EFFECT_STOP",
            reconciliation_result(0, 0, 0, analysis.proven_pre_effect_stops)
        );
    }

    #[test]
    fn known_balance_bound_rejection_is_a_proven_pre_effect_stop() {
        let raw = journal_line("prefunded-balance-insufficient", None, None, None);
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert_eq!(1, analysis.proven_pre_effect_stops);
        assert_eq!(
            "PROVEN_PRE_EFFECT_STOP",
            reconciliation_result(0, 0, 0, analysis.proven_pre_effect_stops)
        );
    }

    #[test]
    fn zero_signatures_without_terminal_evidence_remains_pending() {
        let raw = journal_line("operator-invoked-execution-start", None, None, None);
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert!(analysis.signatures.is_empty());
        assert_eq!(0, analysis.unsigned_ambiguous_effects);
        assert_eq!(0, analysis.proven_pre_effect_stops);
        assert_eq!(1, analysis.record_count);
        assert_eq!("PENDING", reconciliation_result(0, 0, 0, 0));
    }

    #[test]
    fn signed_attempt_requires_a_final_status_before_reconciliation() {
        let raw = journal_line(
            "signed-before-submit",
            Some("1111111111111111111111111111111111111111111111111111111111111111"),
            None,
            None,
        );
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert_eq!(1, analysis.signatures.len());
        assert_eq!(
            "PENDING",
            reconciliation_result(analysis.signatures.len(), 1, 0, 0)
        );
        assert_eq!(
            "RECONCILED",
            reconciliation_result(analysis.signatures.len(), 0, 0, 0)
        );
    }

    #[test]
    fn journal_rejects_record_mutation_and_wrong_packet() {
        let raw = journal_line("operator-invoked-execution-start", None, None, None);
        let mutated = raw.replace(
            "operator-invoked-execution-start",
            "operator-invoked-execution-stop",
        );
        assert!(matches!(
            analyze_attempt_journal(&mutated, TEST_PACKET),
            Err(TrialGateError::ReconciliationRequired)
        ));
        assert!(matches!(
            analyze_attempt_journal(
                &raw,
                "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
            ),
            Err(TrialGateError::ReconciliationRequired)
        ));
    }

    #[test]
    fn journal_rejects_sequence_or_predecessor_substitution() {
        let raw = journal_line("operator-invoked-execution-start", None, None, None);
        let sequence_mutation = raw.replace("\"sequence\":0", "\"sequence\":1");
        assert!(matches!(
            analyze_attempt_journal(&sequence_mutation, TEST_PACKET),
            Err(TrialGateError::ReconciliationRequired)
        ));
        let predecessor_mutation = raw.replace(EMPTY_JOURNAL_ROOT, TEST_PACKET);
        assert!(matches!(
            analyze_attempt_journal(&predecessor_mutation, TEST_PACKET),
            Err(TrialGateError::ReconciliationRequired)
        ));
    }

    #[test]
    fn continuation_plan_starts_at_first_unwritten_chunk_without_replay() {
        let finalized: Vec<u16> = (0..56).collect();
        let raw = deployment_journal(&finalized, true);
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        let plan = deployment_continuation_plan(&analysis, 98_016).expect("plan is proven");
        assert_eq!(128, plan.total_sbf_chunks);
        assert_eq!(56, plan.finalized_prefix_chunks);
        assert_eq!(56, plan.first_unwritten_chunk_index);
        assert_eq!(57, plan.predecessor_deployment_submissions);
        assert_eq!(72, plan.remaining_write_submissions);
        assert_eq!(73, plan.exact_additional_deployment_submissions);
        assert_eq!(0, plan.protocol_submissions);
    }

    #[test]
    fn reconciliation_promotes_the_ambiguous_last_write_without_replaying_it() {
        let mut raw = String::new();
        let mut sequence = 0;
        let mut previous = EMPTY_JOURNAL_ROOT.to_owned();
        let mut signatures = Vec::new();
        for ordinal in 0..57_u16 {
            let effect_id = if ordinal == 0 {
                "deployment-buffer-create".to_owned()
            } else {
                format!("deployment-write-{:03}", ordinal - 1)
            };
            let signature = format!("signature-{ordinal:03}");
            for stage in ["signed-before-submit", "submitted"] {
                append_journal_record(
                    &mut raw,
                    &mut sequence,
                    &mut previous,
                    &effect_id,
                    stage,
                    Some(&signature),
                );
            }
            let terminal_stage = if ordinal == 56 {
                "ambiguous-finality-timeout-or-query-error"
            } else {
                "finalized-success"
            };
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                &effect_id,
                terminal_stage,
                Some(&signature),
            );
            signatures.push(signature);
        }
        for signature in signatures {
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                "reconciliation",
                "reconciled-finalized-success",
                Some(&signature),
            );
        }
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        let plan = deployment_continuation_plan(&analysis, 98_016).expect("plan is proven");
        assert_eq!(56, plan.first_unwritten_chunk_index);
        assert_eq!(73, plan.exact_additional_deployment_submissions);
    }

    #[test]
    fn continuation_plan_rejects_a_finalized_chunk_gap() {
        let raw = deployment_journal(&[0, 2], true);
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert!(matches!(
            deployment_continuation_plan(&analysis, 98_016),
            Err(TrialGateError::ContinuationProof)
        ));
    }

    #[test]
    fn continuation_plan_rejects_two_signatures_for_one_deployment_effect() {
        let mut raw = deployment_journal(&[0], true);
        let last: AttemptRecord =
            serde_json::from_str(raw.lines().last().expect("journal has a terminal record"))
                .expect("terminal record parses");
        let mut sequence = raw.lines().count() as u64;
        let mut previous = last.record_sha256;
        let replay_signature = "signature-replay";
        for stage in ["signed-before-submit", "submitted", "finalized-success"] {
            append_journal_record(
                &mut raw,
                &mut sequence,
                &mut previous,
                "deployment-write-000",
                stage,
                Some(replay_signature),
            );
        }
        append_journal_record(
            &mut raw,
            &mut sequence,
            &mut previous,
            "reconciliation",
            "reconciled-finalized-success",
            Some(replay_signature),
        );
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert!(matches!(
            deployment_continuation_plan(&analysis, 98_016),
            Err(TrialGateError::ContinuationProof)
        ));
    }

    #[test]
    fn continuation_plan_rejects_progress_before_reconciliation() {
        let finalized: Vec<u16> = (0..56).collect();
        let raw = deployment_journal(&finalized, false);
        let analysis = analyze_attempt_journal(&raw, TEST_PACKET).expect("journal parses");
        assert!(matches!(
            deployment_continuation_plan(&analysis, 98_016),
            Err(TrialGateError::ContinuationProof)
        ));
    }

    #[test]
    fn prefunded_balance_must_be_inside_both_bounds() {
        assert!(validate_prefunded_balance(2_000_000_000, 2_000_000_000, 10_000_000_000).is_ok());
        assert!(matches!(
            validate_prefunded_balance(0, 2_000_000_000, 10_000_000_000),
            Err(TrialGateError::FundingPrerequisite { .. })
        ));
        assert!(matches!(
            validate_prefunded_balance(10_000_000_001, 2_000_000_000, 10_000_000_000),
            Err(TrialGateError::FundingPrerequisite { .. })
        ));
    }
}
