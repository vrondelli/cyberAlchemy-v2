use crate::{ErrorCode, RuntimeError};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum AuthenticationMethod {
    LocalPeer,
    Dpop,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AuthenticatedPrincipal {
    subject: String,
    client_id: String,
    method: AuthenticationMethod,
    verified: bool,
    expires_at_unix_ms: Option<i64>,
}

impl AuthenticatedPrincipal {
    pub fn verified_local(subject: impl Into<String>, client_id: impl Into<String>) -> Self {
        Self {
            subject: subject.into(),
            client_id: client_id.into(),
            method: AuthenticationMethod::LocalPeer,
            verified: true,
            expires_at_unix_ms: None,
        }
    }

    pub(crate) fn verified_dpop(
        subject: String,
        client_id: String,
        expires_at_unix_ms: i64,
    ) -> Self {
        Self {
            subject,
            client_id,
            method: AuthenticationMethod::Dpop,
            verified: true,
            expires_at_unix_ms: Some(expires_at_unix_ms),
        }
    }

    pub fn subject(&self) -> &str {
        &self.subject
    }

    pub fn client_id(&self) -> &str {
        &self.client_id
    }

    pub fn is_verified(&self) -> bool {
        self.verified
    }

    pub fn expires_at_unix_ms(&self) -> Option<i64> {
        self.expires_at_unix_ms
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ContextSufficiency {
    Sufficient,
    Insufficient,
    Indeterminate,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ContextSelection {
    pub context_id: String,
    pub purpose: String,
    pub provenance: Vec<String>,
    pub sufficiency: ContextSufficiency,
    pub authority_ceiling: String,
    pub inferred: bool,
    pub confidence_basis_points: Option<u16>,
    pub conflicts: Vec<String>,
    pub correction_ref: Option<String>,
    pub rejected: bool,
}

impl ContextSelection {
    pub fn validate_for(&self, purpose: &str) -> Result<(), RuntimeError> {
        if self.purpose != purpose
            || self.provenance.is_empty()
            || self.authority_ceiling.trim().is_empty()
            || self.sufficiency != ContextSufficiency::Sufficient
            || self.rejected
        {
            return Err(RuntimeError::new(
                ErrorCode::ContextInsufficient,
                "context is not sufficient for the exact operation",
            ));
        }
        if self.inferred
            && (self.confidence_basis_points.is_none() || self.correction_ref.is_none())
        {
            return Err(RuntimeError::new(
                ErrorCode::ContextInsufficient,
                "inferred context lacks confidence or correction control",
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Workspace {
    pub workspace_id: String,
    pub work_owner: String,
    pub accepted_revision: i64,
    pub accepted_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ProposalStatus {
    Pending,
    Accepted,
    Rejected,
    Superseded,
    Withdrawn,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Proposal {
    pub proposal_id: String,
    pub workspace_id: String,
    pub producer: String,
    pub client_id: String,
    pub source_revision: i64,
    pub context_digest: String,
    pub operation_id: String,
    pub target_artifact: String,
    pub target_region: String,
    pub text: String,
    pub rationale: String,
    pub uncertainty: String,
    pub validation_diagnostics: Vec<String>,
    pub status: ProposalStatus,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum EffectOutcome {
    Planned,
    Certain,
    Failed,
    Cancelled,
    Uncertain,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EffectEnvelope {
    pub effect_id: String,
    pub workspace_id: String,
    pub owner: String,
    pub actor: String,
    pub target: String,
    pub scope: Vec<String>,
    pub expires_at_unix_ms: i64,
    pub revoked: bool,
    pub deadline_unix_ms: i64,
    pub replay_allowed: bool,
    pub evidence_expectation: String,
    pub credential_handle: Option<String>,
}

impl EffectEnvelope {
    pub fn validate(
        &self,
        principal: &AuthenticatedPrincipal,
        required_scope: &str,
        now_unix_ms: i64,
    ) -> Result<(), RuntimeError> {
        if !principal.is_verified()
            || principal.subject() != self.actor
            || principal.subject() != self.owner
        {
            return Err(RuntimeError::new(
                ErrorCode::Unauthenticated,
                "effect owner and actor must be the verified principal",
            ));
        }
        if self.revoked
            || self.expires_at_unix_ms <= now_unix_ms
            || self.deadline_unix_ms <= now_unix_ms
            || self.replay_allowed
        {
            return Err(RuntimeError::new(
                ErrorCode::GrantNotCurrent,
                "effect grant is expired, revoked, replayable, or past deadline",
            ));
        }
        if !self.scope.iter().any(|scope| scope == required_scope) {
            return Err(RuntimeError::new(
                ErrorCode::ScopeDenied,
                "required effect scope is absent",
            ));
        }
        if self.evidence_expectation.trim().is_empty()
            || self
                .credential_handle
                .as_deref()
                .is_some_and(|handle| !handle.starts_with("secret://"))
        {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "effect evidence expectation or secret handle is invalid",
            ));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct BrowserEvidence {
    pub evidence_id: String,
    pub effect_id: String,
    pub workspace_id: String,
    pub method: String,
    pub origin: String,
    pub artifact_sha256: Option<String>,
    pub redacted_observation: String,
    pub captured_at_unix_ms: i64,
    pub outcome: EffectOutcome,
    pub residue: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RuntimeEvent {
    pub cursor: i64,
    pub workspace_id: String,
    pub event_type: String,
    pub payload: serde_json::Value,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorkspaceSnapshot {
    pub snapshot_id: String,
    pub workspace: Workspace,
    pub projection_revision: i64,
    pub predecessor_revision: Option<i64>,
    pub event_cursor: i64,
    pub freshness: String,
    pub proposals: Vec<Proposal>,
    pub evidence: Vec<BrowserEvidence>,
    pub conflicts: Vec<String>,
    pub open_questions: Vec<String>,
    pub residue: Vec<String>,
    pub created_at_unix_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "command", rename_all = "kebab-case")]
pub enum Command {
    CreateWorkspace {
        request_id: String,
        workspace_id: String,
        work_owner: String,
        initial_text: String,
        deadline_unix_ms: i64,
    },
    RecordProposal {
        request_id: String,
        workspace_id: String,
        proposal_id: String,
        source_revision: i64,
        context: ContextSelection,
        operation_id: String,
        target_artifact: String,
        target_region: String,
        text: String,
        rationale: String,
        uncertainty: String,
        validation_diagnostics: Vec<String>,
        deadline_unix_ms: i64,
    },
    AcceptProposal {
        request_id: String,
        workspace_id: String,
        proposal_id: String,
        expected_revision: i64,
        deadline_unix_ms: i64,
    },
    RejectProposal {
        request_id: String,
        workspace_id: String,
        proposal_id: String,
        expected_revision: i64,
        reason: String,
        deadline_unix_ms: i64,
    },
    RecordEffectOutcome {
        request_id: String,
        envelope: EffectEnvelope,
        evidence: BrowserEvidence,
    },
    ReconcileEffect {
        request_id: String,
        workspace_id: String,
        effect_id: String,
        resolution: EffectOutcome,
        evidence_ref: String,
        deadline_unix_ms: i64,
    },
}

impl Command {
    pub fn request_id(&self) -> &str {
        match self {
            Self::CreateWorkspace { request_id, .. }
            | Self::RecordProposal { request_id, .. }
            | Self::AcceptProposal { request_id, .. }
            | Self::RejectProposal { request_id, .. }
            | Self::RecordEffectOutcome { request_id, .. }
            | Self::ReconcileEffect { request_id, .. } => request_id,
        }
    }

    pub fn workspace_id(&self) -> &str {
        match self {
            Self::CreateWorkspace { workspace_id, .. }
            | Self::RecordProposal { workspace_id, .. }
            | Self::AcceptProposal { workspace_id, .. }
            | Self::RejectProposal { workspace_id, .. }
            | Self::ReconcileEffect { workspace_id, .. } => workspace_id,
            Self::RecordEffectOutcome { envelope, .. } => &envelope.workspace_id,
        }
    }

    pub fn deadline_unix_ms(&self) -> i64 {
        match self {
            Self::CreateWorkspace {
                deadline_unix_ms, ..
            }
            | Self::RecordProposal {
                deadline_unix_ms, ..
            }
            | Self::AcceptProposal {
                deadline_unix_ms, ..
            }
            | Self::RejectProposal {
                deadline_unix_ms, ..
            }
            | Self::ReconcileEffect {
                deadline_unix_ms, ..
            } => *deadline_unix_ms,
            Self::RecordEffectOutcome { envelope, .. } => envelope.deadline_unix_ms,
        }
    }

    pub fn canonical_digest(&self) -> Result<String, RuntimeError> {
        let bytes = serde_json::to_vec(self).map_err(|error| {
            RuntimeError::new(
                ErrorCode::InvalidInput,
                format!("serialize command: {error}"),
            )
        })?;
        Ok(format!("{:x}", Sha256::digest(bytes)))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ReceiptOutcome {
    Accepted,
    Rejected,
    Conflicted,
    Failed,
    Cancelled,
    Uncertain,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Receipt {
    pub request_id: String,
    pub command_digest: String,
    pub actor: String,
    pub client_id: String,
    pub workspace_id: String,
    pub outcome: ReceiptOutcome,
    pub code: String,
    pub prior_revision: Option<i64>,
    pub resulting_revision: Option<i64>,
    pub event_cursor: Option<i64>,
    pub persistence: String,
    pub replayed: bool,
    pub linked_proposal_id: Option<String>,
    pub linked_effect_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ErrorResponse {
    pub code: ErrorCode,
    pub message: String,
    pub current_revision: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PairingCode {
    pub code: String,
    pub subject: String,
    pub scopes: Vec<String>,
    pub expires_at_unix_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CapabilityLease {
    pub lease_id: String,
    pub subject: String,
    pub client_id: String,
    pub jwk_thumbprint: String,
    pub scopes: Vec<String>,
    pub expires_at_unix_ms: i64,
}

impl From<&RuntimeError> for ErrorResponse {
    fn from(error: &RuntimeError) -> Self {
        Self {
            code: error.code,
            message: error.message.clone(),
            current_revision: error.current_revision,
        }
    }
}
