use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};
use crate::shared_state::{SharedMap, SharedSet};

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct Database {
    #[serde(default)]
    pub accounts: SharedMap<crate::accounts::AccountRecord>,
    #[serde(default)]
    pub files: SharedMap<crate::files::FileRecord>,
    #[serde(skip)]
    pub file_payloads: SharedMap<String>,
    pub identities: SharedMap<KnowledgeIdentity>,
    pub artifacts: SharedMap<Artifact>,
    pub grants: SharedMap<PreparedGrant>,
    pub reissues: SharedMap<ReissueRequest>,
    pub consumed_operations: SharedSet,
    #[serde(default)]
    pub client_errors: SharedMap<ClientErrorEventRequest>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct KnowledgeIdentity {
    pub identity_id: String,
    pub wallet_public_key: String,
    pub encryption_public_key: String,
    pub encryption_key_version: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RecipientEnvelope {
    pub recipient_id: String,
    pub key_version: u64,
    pub envelope_base64: String,
    pub envelope_sha256: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Artifact {
    pub artifact_version_id: String,
    pub originator_id: String,
    pub policy_id: String,
    pub encryption_epoch: u64,
    pub ciphertext_base64: String,
    pub ciphertext_sha256: String,
    pub owners: BTreeSet<String>,
    pub envelopes: BTreeMap<String, RecipientEnvelope>,
    pub revision: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GrantStatus {
    Prepared,
    Finalized,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PreparedGrant {
    pub operation_id: String,
    pub artifact_version_id: String,
    pub originator_id: String,
    pub recipient_id: String,
    pub expected_revision: u64,
    pub envelope: RecipientEnvelope,
    pub status: GrantStatus,
    pub transaction_signature: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ReissueStatus {
    Requested,
    Finalized,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ReissueRequest {
    pub operation_id: String,
    pub artifact_version_id: String,
    pub recipient_id: String,
    pub previous_key_version: u64,
    pub replacement_public_key: String,
    pub replacement_key_version: u64,
    pub expected_revision: u64,
    pub status: ReissueStatus,
    pub transaction_signature: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Authorization {
    pub message: String,
    pub signature_base64: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RegisterIdentityRequest {
    pub operation_id: String,
    pub identity_id: String,
    pub wallet_public_key: String,
    pub encryption_public_key: String,
    pub encryption_key_version: u64,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreateArtifactRequest {
    pub operation_id: String,
    pub artifact_version_id: String,
    pub originator_id: String,
    pub policy_id: String,
    pub encryption_epoch: u64,
    pub ciphertext_base64: String,
    pub ciphertext_sha256: String,
    pub originator_envelope_base64: String,
    pub originator_envelope_sha256: String,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct PrepareGrantRequest {
    pub operation_id: String,
    pub artifact_version_id: String,
    pub originator_id: String,
    pub recipient_id: String,
    pub expected_revision: u64,
    pub recipient_envelope_base64: String,
    pub recipient_envelope_sha256: String,
    pub knowledge_consideration_lamports: u64,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FinalizeGrantRequest {
    pub transaction_signature: String,
    pub artifact_account: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AccessRequest {
    pub requester_id: String,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AccessResponse {
    pub artifact_version_id: String,
    pub ciphertext_base64: String,
    pub ciphertext_sha256: String,
    pub recipient_envelope_base64: String,
    pub recipient_envelope_sha256: String,
    pub encryption_epoch: u64,
    pub revision: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CreateReissueRequest {
    pub operation_id: String,
    pub artifact_version_id: String,
    pub recipient_id: String,
    pub previous_key_version: u64,
    pub replacement_public_key: String,
    pub replacement_key_version: u64,
    pub expected_revision: u64,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FulfillReissueRequest {
    pub originator_id: String,
    pub replacement_envelope_base64: String,
    pub replacement_envelope_sha256: String,
    pub transaction_signature: String,
    pub artifact_account: String,
    pub authorization: Authorization,
}

#[derive(Clone, Debug, Serialize)]
pub struct StateResponse {
    pub artifact_version_id: String,
    pub owners: BTreeSet<String>,
    pub revision: u64,
    pub encryption_epoch: u64,
}

#[derive(Clone, Debug, Serialize)]
pub struct OperationResponse {
    pub operation_id: String,
    pub status: String,
    pub revision: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClientErrorEventRequest {
    pub attempt_id: String,
    pub operation_kind: String,
    pub stage: String,
    pub error_code: String,
    pub effect_status: String,
    pub network: String,
    pub safe_message: String,
    pub diagnostic_digest: String,
    pub rpc_request_id: Option<String>,
    pub transaction_signature: Option<String>,
    pub reporter: String,
    pub registry_version: String,
    pub source_layer: String,
    pub retry_disposition: String,
    pub http_status: Option<u16>,
    pub rpc_code: Option<i64>,
    pub transaction_error: Option<String>,
    pub instruction_index: Option<u16>,
    pub instruction_error: Option<String>,
    pub program_id: Option<String>,
    pub custom_program_code: Option<u32>,
    pub correlation_id: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
pub struct ClientErrorEventReceipt {
    pub attempt_id: String,
    pub status: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct SafeAttemptProjection {
    pub attempt_id: String,
    pub operation_kind: String,
    pub stage: String,
    pub error_code: String,
    pub effect_status: String,
    pub network: String,
    pub safe_message: String,
    pub transaction_signature: Option<String>,
    pub retry_disposition: String,
    pub evidence_status: &'static str,
}

impl From<&ClientErrorEventRequest> for SafeAttemptProjection {
    fn from(value: &ClientErrorEventRequest) -> Self {
        Self {
            attempt_id: value.attempt_id.clone(),
            operation_kind: value.operation_kind.clone(),
            stage: value.stage.clone(),
            error_code: value.error_code.clone(),
            effect_status: value.effect_status.clone(),
            network: value.network.clone(),
            safe_message: value.safe_message.clone(),
            transaction_signature: value.transaction_signature.clone(),
            retry_disposition: value.retry_disposition.clone(),
            evidence_status: "recorded",
        }
    }
}
