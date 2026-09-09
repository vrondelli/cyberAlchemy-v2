//! Operator-gated Devnet evidence runner.
//!
//! This binary validates the exact technical envelope. Human authorization is
//! established by the CyberAlchemy operator workflow before invocation; the
//! binary does not claim to authenticate that human decision.

mod executor;
mod setup;

use std::{env, fs, path::PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

const MAX_PROTOCOL_TRANSACTIONS: u16 = 24;
const MAX_DEPLOYMENT_TRANSACTIONS: u16 = 192;
const MAX_TEST_SOL_LAMPORTS: u64 = 10_000_000_000;
const PUBLIC_DEVNET_RPC: &str = "https://api.devnet.solana.com";
const DEVNET_GENESIS_HASH: &str = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
const AUTHORIZATION_MODEL: &str = "operator-mediated-explicit-human-authorization";
const CRYPTOGRAPHIC_GOVERNANCE_PROVENANCE: &str = "deferred";
const FUNDING_MODE: &str = "prefunded-only";
const REQUIRED_EFFECT_SURFACE: &[&str] = &[
    "external-journal-write",
    "external-terminal-evidence-write",
    "loopback-postgresql-read-write",
    "public-solana-finalized-read",
    "public-solana-transaction-submit",
];
const REQUIRED_CASE_IDS: &[&str] = &[
    "storage-three-layer-ready",
    "initialize-positive",
    "grant-wrong-signer",
    "grant-stale-revision",
    "grant-positive",
    "grant-finalized-fetch",
    "recipient-decryption",
    "reissue-request-outsider",
    "reissue-request-positive",
    "reissue-request-replay",
    "reissue-self-fulfillment",
    "reissue-fulfill-positive",
    "reissue-state-isolation",
    "replacement-recipient-decryption",
    "cost-observation",
];
const CONTINUATION_EFFECT_SURFACE: &[&str] = &[
    "external-continuation-evidence-write",
    "external-journal-write",
    "public-solana-finalized-read",
    "public-solana-transaction-submit",
];

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct DevnetEnvelope {
    schema_version: u16,
    candidate_binding_digest: String,
    trial_cli_sha256: String,
    authorization_model: String,
    cryptographic_governance_provenance: String,
    pub(crate) cluster: String,
    pub(crate) rpc_class: String,
    pub(crate) rpc_url: String,
    pub(crate) expected_genesis_hash: String,
    pub(crate) max_protocol_signed_transactions: u16,
    pub(crate) max_deployment_signed_transactions: u16,
    pub(crate) deployment_max_sign_attempts: u16,
    pub(crate) funding_mode: String,
    pub(crate) minimum_prefunded_lamports: u64,
    pub(crate) maximum_prefunded_lamports: u64,
    pub(crate) sbf_path: String,
    pub(crate) sbf_sha256: String,
    pub(crate) sbf_size_bytes: u64,
    pub(crate) external_inputs: ExternalInputs,
    pub(crate) enumerated_effect_surface: Vec<String>,
    pub(crate) disposable_keypairs_outside_repository: bool,
    pub(crate) paid_provider_fallback: bool,
    pub(crate) mainnet_allowed: bool,
    pub(crate) enumerated_case_ids: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct ExternalInputs {
    pub(crate) payer_keypair_path: String,
    pub(crate) originator_keypair_path: String,
    pub(crate) recipient_keypair_path: String,
    pub(crate) outsider_keypair_path: String,
    pub(crate) program_keypair_path: String,
    pub(crate) buffer_keypair_path: String,
    pub(crate) upgrade_authority_keypair_path: String,
    pub(crate) plaintext_fixture_path: String,
    pub(crate) originator_hpke_public_path: String,
    pub(crate) originator_hpke_private_path: String,
    pub(crate) recipient_hpke_public_path: String,
    pub(crate) recipient_hpke_private_path: String,
    pub(crate) replacement_hpke_public_path: String,
    pub(crate) replacement_hpke_private_path: String,
    pub(crate) attempt_journal_path: String,
    pub(crate) evidence_output_path: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct DeploymentContinuationEnvelope {
    schema_version: u16,
    pub(crate) candidate_binding_digest: String,
    pub(crate) trial_cli_sha256: String,
    authorization_model: String,
    pub(crate) cluster: String,
    pub(crate) rpc_class: String,
    pub(crate) rpc_url: String,
    pub(crate) expected_genesis_hash: String,
    pub(crate) predecessor_terminal_envelope_path: String,
    pub(crate) predecessor_terminal_envelope_sha256: String,
    pub(crate) predecessor_packet_digest: String,
    pub(crate) predecessor_attempt_journal_path: String,
    pub(crate) predecessor_attempt_journal_sha256: String,
    pub(crate) predecessor_attempt_journal_root_sha256: String,
    pub(crate) sbf_path: String,
    pub(crate) sbf_sha256: String,
    pub(crate) sbf_size_bytes: u64,
    pub(crate) payer_keypair_path: String,
    pub(crate) program_keypair_path: String,
    pub(crate) buffer_keypair_path: String,
    pub(crate) upgrade_authority_keypair_path: String,
    pub(crate) continuation_attempt_journal_path: String,
    pub(crate) continuation_evidence_output_path: String,
    pub(crate) first_unwritten_chunk_index: u16,
    pub(crate) max_additional_deployment_signed_transactions: u16,
    max_protocol_signed_transactions: u16,
    deployment_max_sign_attempts: u16,
    same_trial_disposable_credential_reuse: bool,
    pub(crate) enumerated_effect_surface: Vec<String>,
    paid_provider_fallback: bool,
    mainnet_allowed: bool,
}

#[derive(Debug, thiserror::Error)]
pub(crate) enum TrialGateError {
    #[error("usage: cyberalchemy-kep-devnet-trial prepare <new-external-directory> | validate <terminal-envelope.json> | reconcile <terminal-envelope.json> | validate-continuation <continuation-envelope.json> | continue-deployment <continuation-envelope.json> | reconcile-continuation <continuation-envelope.json> | <terminal-envelope.json>")]
    Usage,
    #[error("cannot prepare disposable external trial material")]
    Preparation,
    #[error("cannot read terminal envelope")]
    Read,
    #[error("terminal envelope is malformed")]
    Malformed,
    #[error("terminal envelope violates the bounded Devnet policy")]
    Policy,
    #[error("terminal packet digest does not bind the exact envelope bytes")]
    PacketDigest,
    #[error("the running trial executable does not match the envelope")]
    ExecutableIdentity,
    #[error("SBF bytes do not match the terminal envelope")]
    SbfIdentity,
    #[error("the signed-submission cap cannot contain the exact SBF deployment")]
    DeploymentBudgetImpossible,
    #[error("external trial input or output is inside the repository")]
    RepositoryBoundary,
    #[error("external trial material is missing or malformed")]
    ExternalMaterial,
    #[error("PostgreSQL trial storage is unavailable")]
    Storage,
    #[error("cryptographic preparation, opening, or reissue failed")]
    Cryptography,
    #[error("Solana CLI, RPC, deployment, transaction, or finality failed")]
    Solana,
    #[error("Solana RPC failed at {stage} ({class}; sanitized detail sha256 {detail_sha256})")]
    SolanaRpc {
        stage: &'static str,
        class: &'static str,
        detail_sha256: String,
    },
    #[error(
        "prefunded payer balance {observed_lamports} is outside the required range {minimum_lamports}..={maximum_lamports} lamports"
    )]
    FundingPrerequisite {
        observed_lamports: u64,
        minimum_lamports: u64,
        maximum_lamports: u64,
    },
    #[error("an expected negative case did not fail closed")]
    NegativeCaseUnexpectedlySucceeded,
    #[error("protocol transaction budget exhausted")]
    ProtocolBudget,
    #[error("evidence would contain plaintext or private material")]
    EvidenceLeak,
    #[error("cannot write external evidence")]
    EvidenceWrite,
    #[error("an earlier attempt journal requires reconciliation; execution will not resubmit")]
    ReconciliationRequired,
    #[error("the deployment continuation predecessor or progress proof is invalid")]
    ContinuationProof,
}

#[tokio::main]
async fn main() -> Result<(), TrialGateError> {
    let mut arguments = env::args_os().skip(1);
    let first = arguments.next().ok_or(TrialGateError::Usage)?;
    if first == "prepare" {
        let directory = arguments
            .next()
            .map(PathBuf::from)
            .ok_or(TrialGateError::Usage)?;
        if arguments.next().is_some() {
            return Err(TrialGateError::Usage);
        }
        let receipt = setup::prepare(&directory)?;
        println!(
            "{}",
            serde_json::to_string_pretty(&receipt).map_err(|_| TrialGateError::Preparation)?
        );
        return Ok(());
    }
    if first == "validate-continuation"
        || first == "continue-deployment"
        || first == "reconcile-continuation"
    {
        let execute_continuation = first == "continue-deployment";
        let reconcile_continuation = first == "reconcile-continuation";
        let path = arguments
            .next()
            .map(PathBuf::from)
            .ok_or(TrialGateError::Usage)?;
        if arguments.next().is_some() {
            return Err(TrialGateError::Usage);
        }
        let bytes = fs::read(path).map_err(|_| TrialGateError::Read)?;
        let envelope: DeploymentContinuationEnvelope =
            serde_json::from_slice(&bytes).map_err(|_| TrialGateError::Malformed)?;
        validate_continuation_envelope(&envelope)?;
        validate_continuation_sbf(&envelope)?;
        validate_continuation_executable(&envelope)?;
        let observed_packet = hex_lower(&Sha256::digest(&bytes));
        if env::var("CA2_DEVNET_CONTINUATION_PACKET_DIGEST")
            .ok()
            .as_deref()
            != Some(observed_packet.as_str())
        {
            return Err(TrialGateError::PacketDigest);
        }
        if execute_continuation {
            let evidence = executor::continue_deployment(&envelope, &observed_packet)?;
            executor::write_continuation_evidence(&envelope, &evidence)?;
            println!(
                "{}",
                serde_json::to_string_pretty(&evidence)
                    .map_err(|_| TrialGateError::EvidenceWrite)?
            );
        } else if reconcile_continuation {
            let receipt = executor::reconcile_deployment_continuation(&envelope, &observed_packet)?;
            println!(
                "{}",
                serde_json::to_string_pretty(&receipt)
                    .map_err(|_| TrialGateError::EvidenceWrite)?
            );
        } else {
            let receipt = executor::validate_deployment_continuation(&envelope, &observed_packet)?;
            println!(
                "{}",
                serde_json::to_string_pretty(&receipt)
                    .map_err(|_| TrialGateError::EvidenceWrite)?
            );
        }
        return Ok(());
    }
    let validate_only = first == "validate";
    let (reconcile_only, path) = if first == "reconcile" || validate_only {
        (
            first == "reconcile",
            arguments
                .next()
                .map(PathBuf::from)
                .ok_or(TrialGateError::Usage)?,
        )
    } else {
        (false, PathBuf::from(first))
    };
    let bytes = fs::read(path).map_err(|_| TrialGateError::Read)?;
    let envelope: DevnetEnvelope =
        serde_json::from_slice(&bytes).map_err(|_| TrialGateError::Malformed)?;
    validate_envelope(&envelope)?;
    validate_sbf(&envelope)?;
    validate_current_executable(&envelope)?;

    let external_packet = env::var("CA2_DEVNET_PACKET_DIGEST").ok();
    let observed_packet = hex_lower(&Sha256::digest(&bytes));
    if external_packet.as_deref() != Some(observed_packet.as_str()) {
        return Err(TrialGateError::PacketDigest);
    }
    if validate_only {
        println!(
            "{}",
            serde_json::to_string_pretty(&serde_json::json!({
                "schema_version": "cav2-kep-devnet-envelope-validation/v1",
                "result": "PASS_BOUNDED_NO_EFFECT",
                "candidate_binding_digest": envelope.candidate_binding_digest,
                "packet_digest": observed_packet,
                "trial_cli_sha256": envelope.trial_cli_sha256,
                "sbf_sha256": envelope.sbf_sha256,
                "exact_native_deployment_submissions": exact_native_deployment_submissions(envelope.sbf_size_bytes),
                "max_deployment_signed_transactions": envelope.max_deployment_signed_transactions,
                "max_protocol_signed_transactions": envelope.max_protocol_signed_transactions,
                "enumerated_case_count": envelope.enumerated_case_ids.len(),
                "enumerated_effect_surface": envelope.enumerated_effect_surface,
                "authority_effect": "none",
                "external_effect": "none"
            }))
            .map_err(|_| TrialGateError::Malformed)?
        );
        return Ok(());
    }
    if reconcile_only {
        let receipt = executor::reconcile(&envelope, &observed_packet)?;
        println!(
            "{}",
            serde_json::to_string_pretty(&receipt).map_err(|_| TrialGateError::EvidenceWrite)?
        );
        return Ok(());
    }

    let evidence = executor::execute(&envelope, &observed_packet).await?;
    executor::write_evidence(&envelope, &evidence)?;
    println!(
        "{}",
        serde_json::to_string_pretty(&evidence).map_err(|_| TrialGateError::EvidenceWrite)?
    );
    Ok(())
}

pub(crate) fn validate_envelope(envelope: &DevnetEnvelope) -> Result<(), TrialGateError> {
    let mut observed_cases: Vec<&str> = envelope
        .enumerated_case_ids
        .iter()
        .map(String::as_str)
        .collect();
    observed_cases.sort_unstable();
    let mut required_cases = REQUIRED_CASE_IDS.to_vec();
    required_cases.sort_unstable();
    let mut observed_effects: Vec<&str> = envelope
        .enumerated_effect_surface
        .iter()
        .map(String::as_str)
        .collect();
    observed_effects.sort_unstable();
    let mut required_effects = REQUIRED_EFFECT_SURFACE.to_vec();
    required_effects.sort_unstable();
    if envelope.schema_version != 4
        || envelope.cluster != "solana-devnet"
        || envelope.rpc_class != "public-no-paid-fallback"
        || envelope.rpc_url != PUBLIC_DEVNET_RPC
        || envelope.expected_genesis_hash != DEVNET_GENESIS_HASH
        || !is_sha256(&envelope.candidate_binding_digest)
        || !is_sha256(&envelope.trial_cli_sha256)
        || !is_sha256(&envelope.sbf_sha256)
        || envelope.authorization_model != AUTHORIZATION_MODEL
        || envelope.cryptographic_governance_provenance != CRYPTOGRAPHIC_GOVERNANCE_PROVENANCE
        || envelope.max_protocol_signed_transactions == 0
        || envelope.max_protocol_signed_transactions > MAX_PROTOCOL_TRANSACTIONS
        || envelope.max_deployment_signed_transactions == 0
        || envelope.max_deployment_signed_transactions > MAX_DEPLOYMENT_TRANSACTIONS
        || envelope.deployment_max_sign_attempts != 1
        || envelope.funding_mode != FUNDING_MODE
        || envelope.minimum_prefunded_lamports == 0
        || envelope.minimum_prefunded_lamports > envelope.maximum_prefunded_lamports
        || envelope.maximum_prefunded_lamports > MAX_TEST_SOL_LAMPORTS
        || envelope.sbf_size_bytes == 0
        || !envelope.disposable_keypairs_outside_repository
        || envelope.paid_provider_fallback
        || envelope.mainnet_allowed
        || observed_cases != required_cases
        || observed_effects != required_effects
    {
        return Err(TrialGateError::Policy);
    }
    if exact_native_deployment_submissions(envelope.sbf_size_bytes)
        > u64::from(envelope.max_deployment_signed_transactions)
    {
        return Err(TrialGateError::DeploymentBudgetImpossible);
    }
    Ok(())
}

fn is_sha256(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn validate_sbf(envelope: &DevnetEnvelope) -> Result<(), TrialGateError> {
    let bytes = fs::read(&envelope.sbf_path).map_err(|_| TrialGateError::SbfIdentity)?;
    if bytes.len() as u64 != envelope.sbf_size_bytes
        || hex_lower(&Sha256::digest(&bytes)) != envelope.sbf_sha256
    {
        return Err(TrialGateError::SbfIdentity);
    }
    Ok(())
}

fn validate_current_executable(envelope: &DevnetEnvelope) -> Result<(), TrialGateError> {
    let executable = env::current_exe().map_err(|_| TrialGateError::ExecutableIdentity)?;
    let bytes = fs::read(executable).map_err(|_| TrialGateError::ExecutableIdentity)?;
    if hex_lower(&Sha256::digest(bytes)) != envelope.trial_cli_sha256 {
        return Err(TrialGateError::ExecutableIdentity);
    }
    Ok(())
}

fn validate_continuation_envelope(
    envelope: &DeploymentContinuationEnvelope,
) -> Result<(), TrialGateError> {
    let mut observed_effects: Vec<&str> = envelope
        .enumerated_effect_surface
        .iter()
        .map(String::as_str)
        .collect();
    observed_effects.sort_unstable();
    let mut required_effects = CONTINUATION_EFFECT_SURFACE.to_vec();
    required_effects.sort_unstable();
    if envelope.schema_version != 1
        || envelope.cluster != "solana-devnet"
        || envelope.rpc_class != "public-no-paid-fallback"
        || envelope.rpc_url != PUBLIC_DEVNET_RPC
        || envelope.expected_genesis_hash != DEVNET_GENESIS_HASH
        || !is_sha256(&envelope.candidate_binding_digest)
        || !is_sha256(&envelope.trial_cli_sha256)
        || !is_sha256(&envelope.predecessor_terminal_envelope_sha256)
        || !is_sha256(&envelope.predecessor_packet_digest)
        || envelope.predecessor_terminal_envelope_sha256 != envelope.predecessor_packet_digest
        || !is_sha256(&envelope.predecessor_attempt_journal_sha256)
        || !is_sha256(&envelope.predecessor_attempt_journal_root_sha256)
        || !is_sha256(&envelope.sbf_sha256)
        || envelope.authorization_model != AUTHORIZATION_MODEL
        || envelope.sbf_size_bytes == 0
        || envelope.first_unwritten_chunk_index == 0
        || envelope.max_additional_deployment_signed_transactions == 0
        || envelope.max_additional_deployment_signed_transactions > MAX_DEPLOYMENT_TRANSACTIONS
        || envelope.max_protocol_signed_transactions != 0
        || envelope.deployment_max_sign_attempts != 1
        || !envelope.same_trial_disposable_credential_reuse
        || observed_effects != required_effects
        || envelope.paid_provider_fallback
        || envelope.mainnet_allowed
    {
        return Err(TrialGateError::Policy);
    }
    Ok(())
}

fn validate_continuation_sbf(
    envelope: &DeploymentContinuationEnvelope,
) -> Result<(), TrialGateError> {
    let bytes = fs::read(&envelope.sbf_path).map_err(|_| TrialGateError::SbfIdentity)?;
    if bytes.len() as u64 != envelope.sbf_size_bytes
        || hex_lower(&Sha256::digest(&bytes)) != envelope.sbf_sha256
    {
        return Err(TrialGateError::SbfIdentity);
    }
    Ok(())
}

fn validate_continuation_executable(
    envelope: &DeploymentContinuationEnvelope,
) -> Result<(), TrialGateError> {
    let executable = env::current_exe().map_err(|_| TrialGateError::ExecutableIdentity)?;
    let bytes = fs::read(executable).map_err(|_| TrialGateError::ExecutableIdentity)?;
    if hex_lower(&Sha256::digest(bytes)) != envelope.trial_cli_sha256 {
        return Err(TrialGateError::ExecutableIdentity);
    }
    Ok(())
}

fn exact_native_deployment_submissions(sbf_size_bytes: u64) -> u64 {
    // Keep this preflight identical to executor::deploy_exact_program: one
    // buffer/program creation, 768-byte writes, then one final deployment.
    sbf_size_bytes.div_ceil(768) + 2
}

fn hex_lower(bytes: &[u8]) -> String {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let mut output = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        output.push(HEX[(byte >> 4) as usize] as char);
        output.push(HEX[(byte & 0x0f) as usize] as char);
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;

    fn external_inputs() -> ExternalInputs {
        ExternalInputs {
            payer_keypair_path: "/outside/payer.json".to_owned(),
            originator_keypair_path: "/outside/a.json".to_owned(),
            recipient_keypair_path: "/outside/b.json".to_owned(),
            outsider_keypair_path: "/outside/outsider.json".to_owned(),
            program_keypair_path: "/outside/program.json".to_owned(),
            buffer_keypair_path: "/outside/buffer.json".to_owned(),
            upgrade_authority_keypair_path: "/outside/upgrade.json".to_owned(),
            plaintext_fixture_path: "/outside/fixture.bin".to_owned(),
            originator_hpke_public_path: "/outside/a.pub".to_owned(),
            originator_hpke_private_path: "/outside/a.key".to_owned(),
            recipient_hpke_public_path: "/outside/b.pub".to_owned(),
            recipient_hpke_private_path: "/outside/b.key".to_owned(),
            replacement_hpke_public_path: "/outside/b2.pub".to_owned(),
            replacement_hpke_private_path: "/outside/b2.key".to_owned(),
            attempt_journal_path: "/outside/attempts.jsonl".to_owned(),
            evidence_output_path: "/outside/evidence.json".to_owned(),
        }
    }

    fn envelope(size: u64) -> DevnetEnvelope {
        DevnetEnvelope {
            schema_version: 4,
            candidate_binding_digest: "a".repeat(64),
            trial_cli_sha256: "b".repeat(64),
            authorization_model: AUTHORIZATION_MODEL.to_owned(),
            cryptographic_governance_provenance: CRYPTOGRAPHIC_GOVERNANCE_PROVENANCE.to_owned(),
            cluster: "solana-devnet".to_owned(),
            rpc_class: "public-no-paid-fallback".to_owned(),
            rpc_url: "https://api.devnet.solana.com".to_owned(),
            expected_genesis_hash: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG".to_owned(),
            max_protocol_signed_transactions: 24,
            max_deployment_signed_transactions: 192,
            deployment_max_sign_attempts: 1,
            funding_mode: FUNDING_MODE.to_owned(),
            minimum_prefunded_lamports: 2_000_000_000,
            maximum_prefunded_lamports: 10_000_000_000,
            sbf_path: "/outside-repository/program.so".to_owned(),
            sbf_sha256: "c".repeat(64),
            sbf_size_bytes: size,
            external_inputs: external_inputs(),
            enumerated_effect_surface: REQUIRED_EFFECT_SURFACE
                .iter()
                .map(|item| (*item).to_owned())
                .collect(),
            disposable_keypairs_outside_repository: true,
            paid_provider_fallback: false,
            mainnet_allowed: false,
            enumerated_case_ids: REQUIRED_CASE_IDS
                .iter()
                .map(|item| (*item).to_owned())
                .collect(),
        }
    }

    fn continuation_envelope() -> DeploymentContinuationEnvelope {
        DeploymentContinuationEnvelope {
            schema_version: 1,
            candidate_binding_digest: "d".repeat(64),
            trial_cli_sha256: "b".repeat(64),
            authorization_model: AUTHORIZATION_MODEL.to_owned(),
            cluster: "solana-devnet".to_owned(),
            rpc_class: "public-no-paid-fallback".to_owned(),
            rpc_url: PUBLIC_DEVNET_RPC.to_owned(),
            expected_genesis_hash: DEVNET_GENESIS_HASH.to_owned(),
            predecessor_terminal_envelope_path: "/outside/predecessor.json".to_owned(),
            predecessor_terminal_envelope_sha256: "a".repeat(64),
            predecessor_packet_digest: "a".repeat(64),
            predecessor_attempt_journal_path: "/outside/attempts.jsonl".to_owned(),
            predecessor_attempt_journal_sha256: "e".repeat(64),
            predecessor_attempt_journal_root_sha256: "f".repeat(64),
            sbf_path: "/outside/program.so".to_owned(),
            sbf_sha256: "c".repeat(64),
            sbf_size_bytes: 98_016,
            payer_keypair_path: "/outside/payer.json".to_owned(),
            program_keypair_path: "/outside/program.json".to_owned(),
            buffer_keypair_path: "/outside/buffer.json".to_owned(),
            upgrade_authority_keypair_path: "/outside/upgrade.json".to_owned(),
            continuation_attempt_journal_path: "/outside/continuation.jsonl".to_owned(),
            continuation_evidence_output_path: "/outside/continuation-evidence.json".to_owned(),
            first_unwritten_chunk_index: 56,
            max_additional_deployment_signed_transactions: 73,
            max_protocol_signed_transactions: 0,
            deployment_max_sign_attempts: 1,
            same_trial_disposable_credential_reuse: true,
            enumerated_effect_surface: CONTINUATION_EFFECT_SURFACE
                .iter()
                .map(|item| (*item).to_owned())
                .collect(),
            paid_provider_fallback: false,
            mainnet_allowed: false,
        }
    }

    #[test]
    fn exact_deployment_bound_accepts_current_sbf_under_192_and_rejects_24() {
        let mut current = envelope(98_016);
        assert_eq!(
            130,
            exact_native_deployment_submissions(current.sbf_size_bytes)
        );
        assert!(validate_envelope(&current).is_ok());
        current.max_deployment_signed_transactions = 24;
        assert!(matches!(
            validate_envelope(&current),
            Err(TrialGateError::DeploymentBudgetImpossible)
        ));
    }

    #[test]
    fn policy_accepts_an_sbf_that_can_fit_before_real_overhead_is_applied() {
        let small = envelope(512 * 22);
        assert!(validate_envelope(&small).is_ok());
    }

    #[test]
    fn policy_rejects_case_drift_and_non_public_rpc() {
        let mut candidate = envelope(512 * 22);
        candidate.enumerated_case_ids.pop();
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
        let mut candidate = envelope(512 * 22);
        candidate.enumerated_effect_surface.pop();
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
        let mut candidate = envelope(512 * 22);
        candidate.funding_mode = "runner-airdrop".to_owned();
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
        let mut candidate = envelope(512 * 22);
        candidate.minimum_prefunded_lamports = 0;
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
        let mut candidate = envelope(512 * 22);
        candidate.rpc_url = "https://paid.example.invalid".to_owned();
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
        let mut candidate = envelope(512 * 22);
        candidate.cryptographic_governance_provenance = "enabled".to_owned();
        assert!(matches!(
            validate_envelope(&candidate),
            Err(TrialGateError::Policy)
        ));
    }

    #[test]
    fn continuation_policy_is_deployment_only_and_exactly_bounded() {
        let current = continuation_envelope();
        assert!(validate_continuation_envelope(&current).is_ok());

        let mut protocol_enabled = continuation_envelope();
        protocol_enabled.max_protocol_signed_transactions = 1;
        assert!(matches!(
            validate_continuation_envelope(&protocol_enabled),
            Err(TrialGateError::Policy)
        ));

        let mut effect_drift = continuation_envelope();
        effect_drift
            .enumerated_effect_surface
            .push("loopback-postgresql-read-write".to_owned());
        assert!(matches!(
            validate_continuation_envelope(&effect_drift),
            Err(TrialGateError::Policy)
        ));

        let mut credential_reuse_not_explicit = continuation_envelope();
        credential_reuse_not_explicit.same_trial_disposable_credential_reuse = false;
        assert!(matches!(
            validate_continuation_envelope(&credential_reuse_not_explicit),
            Err(TrialGateError::Policy)
        ));
    }

    #[test]
    fn runtime_sources_do_not_claim_to_attest_authority() {
        let sources = [include_str!("setup.rs"), include_str!("executor.rs")].join("\n");
        for forbidden in [
            "authorized-execution-start",
            "Exact authorized public Devnet",
            "authority_effect: \"local-credential",
            "authority_effect: \"status-reconciliation",
            "authority_effect: \"bounded-public-devnet",
        ] {
            assert!(
                !sources.contains(forbidden),
                "forbidden authority claim: {forbidden}"
            );
        }
        assert!(sources.contains("authority_effect: \"none\""));
        assert!(sources.contains("external-not-attested-by-runner"));
        assert!(!sources.contains("request_airdrop"));
        assert!(!sources.contains("devnet-airdrop"));
        assert!(sources.contains("prefunded-balance-verified"));
    }
}
