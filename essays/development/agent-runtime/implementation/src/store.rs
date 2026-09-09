use crate::{
    AuthenticatedPrincipal, BrowserEvidence, CapabilityLease, Command, ContextSelection,
    EffectOutcome, ErrorCode, PairingCode, Proposal, ProposalStatus, Receipt, ReceiptOutcome,
    RuntimeError, RuntimeEvent, Workspace, WorkspaceSnapshot,
};
use rusqlite::{Connection, OptionalExtension, Transaction, params};
use std::path::Path;

pub struct SqliteStore {
    conn: Connection,
}

impl SqliteStore {
    pub fn open(path: impl AsRef<Path>) -> Result<Self, RuntimeError> {
        let conn = Connection::open(path)?;
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "FULL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        conn.busy_timeout(std::time::Duration::from_secs(5))?;
        conn.execute_batch(include_str!("../migrations/001_initial.sql"))?;
        Ok(Self { conn })
    }

    pub fn execute(
        &mut self,
        command: &Command,
        principal: &AuthenticatedPrincipal,
        now_unix_ms: i64,
    ) -> Result<Receipt, RuntimeError> {
        self.validate_intake(command, principal, now_unix_ms)?;
        let command_digest = command.canonical_digest()?;
        if let Some(receipt) = self.prior(command.request_id(), &command_digest)? {
            return Ok(Receipt {
                replayed: true,
                ..receipt
            });
        }

        let tx = self.conn.transaction()?;
        let receipt = match command {
            Command::CreateWorkspace {
                request_id,
                workspace_id,
                work_owner,
                initial_text,
                ..
            } => {
                if principal.subject() != work_owner {
                    return Err(RuntimeError::new(
                        ErrorCode::WorkOwnerRequired,
                        "workspace creator must be its verified Work Owner",
                    ));
                }
                tx.execute(
                    "INSERT INTO workspaces(workspace_id,work_owner,accepted_revision,accepted_text) VALUES(?1,?2,0,?3)",
                    params![workspace_id, work_owner, initial_text],
                )?;
                let cursor = append_event(
                    &tx,
                    request_id,
                    workspace_id,
                    "workspace-created",
                    &serde_json::json!({"revision": 0}),
                )?;
                receipt(
                    command,
                    principal,
                    &command_digest,
                    ReceiptOutcome::Accepted,
                    "WORKSPACE_CREATED",
                    None,
                    Some(0),
                    Some(cursor),
                    None,
                    None,
                )
            }
            Command::RecordProposal {
                request_id,
                workspace_id,
                proposal_id,
                source_revision,
                context,
                operation_id,
                target_artifact,
                target_region,
                text,
                rationale,
                uncertainty,
                validation_diagnostics,
                ..
            } => {
                context.validate_for(operation_id)?;
                let revision = current_revision(&tx, workspace_id)?;
                if revision != *source_revision {
                    return Err(RuntimeError::conflict(revision));
                }
                let context_digest = context_digest(context)?;
                tx.execute(
                    "INSERT INTO runtime_proposals(proposal_id,workspace_id,producer,client_id,source_revision,context_digest,operation_id,target_artifact,target_region,text,rationale,uncertainty,validation_diagnostics_json,status) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'pending')",
                    params![proposal_id, workspace_id, principal.subject(), principal.client_id(), source_revision, context_digest, operation_id, target_artifact, target_region, text, rationale, uncertainty, serde_json::to_string(validation_diagnostics).map_err(invalid_json)?],
                )?;
                let cursor = append_event(
                    &tx,
                    request_id,
                    workspace_id,
                    "proposal-recorded",
                    &serde_json::json!({"proposal_id": proposal_id, "source_revision": revision}),
                )?;
                receipt(
                    command,
                    principal,
                    &command_digest,
                    ReceiptOutcome::Accepted,
                    "PROPOSAL_RECORDED",
                    Some(revision),
                    Some(revision),
                    Some(cursor),
                    Some(proposal_id.clone()),
                    None,
                )
            }
            Command::AcceptProposal {
                request_id,
                workspace_id,
                proposal_id,
                expected_revision,
                ..
            } => dispose_proposal(
                &tx,
                command,
                principal,
                &command_digest,
                request_id,
                workspace_id,
                proposal_id,
                *expected_revision,
                ProposalStatus::Accepted,
                None,
            )?,
            Command::RejectProposal {
                request_id,
                workspace_id,
                proposal_id,
                expected_revision,
                reason,
                ..
            } => dispose_proposal(
                &tx,
                command,
                principal,
                &command_digest,
                request_id,
                workspace_id,
                proposal_id,
                *expected_revision,
                ProposalStatus::Rejected,
                Some(reason),
            )?,
            Command::RecordEffectOutcome {
                request_id,
                envelope,
                evidence,
            } => {
                require_owner(&tx, &envelope.workspace_id, principal)?;
                envelope.validate(principal, "browser:navigate", now_unix_ms)?;
                validate_evidence(envelope, evidence)?;
                tx.execute(
                    "INSERT INTO runtime_effects(effect_id,workspace_id,owner,actor,target,scope_json,outcome,retry_allowed,evidence_expectation) VALUES(?1,?2,?3,?4,?5,?6,?7,0,?8)",
                    params![envelope.effect_id, envelope.workspace_id, envelope.owner, envelope.actor, envelope.target, serde_json::to_string(&envelope.scope).map_err(invalid_json)?, effect_outcome(&evidence.outcome), envelope.evidence_expectation],
                )?;
                insert_evidence(&tx, evidence)?;
                let cursor = append_event(
                    &tx,
                    request_id,
                    &envelope.workspace_id,
                    "browser-effect-recorded",
                    &serde_json::json!({"effect_id": envelope.effect_id, "outcome": effect_outcome(&evidence.outcome)}),
                )?;
                receipt(
                    command,
                    principal,
                    &command_digest,
                    match &evidence.outcome {
                        EffectOutcome::Uncertain => ReceiptOutcome::Uncertain,
                        EffectOutcome::Failed => ReceiptOutcome::Failed,
                        EffectOutcome::Cancelled => ReceiptOutcome::Cancelled,
                        _ => ReceiptOutcome::Accepted,
                    },
                    "BROWSER_EFFECT_RECORDED",
                    None,
                    None,
                    Some(cursor),
                    None,
                    Some(envelope.effect_id.clone()),
                )
            }
            Command::ReconcileEffect {
                request_id,
                workspace_id,
                effect_id,
                resolution,
                evidence_ref,
                ..
            } => {
                require_owner(&tx, workspace_id, principal)?;
                if matches!(
                    resolution,
                    EffectOutcome::Planned | EffectOutcome::Uncertain
                ) {
                    return Err(RuntimeError::new(
                        ErrorCode::InvalidInput,
                        "reconciliation must select a terminal outcome",
                    ));
                }
                let current: String = tx
                    .query_row(
                        "SELECT outcome FROM runtime_effects WHERE effect_id=?1 AND workspace_id=?2",
                        params![effect_id, workspace_id],
                        |row| row.get(0),
                    )
                    .optional()?
                    .ok_or_else(|| RuntimeError::new(ErrorCode::NotFound, "effect not found"))?;
                if current != "uncertain" {
                    return Err(RuntimeError::new(
                        ErrorCode::EffectNotUncertain,
                        "only an uncertain effect can be reconciled",
                    ));
                }
                let evidence_exists: bool = tx.query_row(
                    "SELECT EXISTS(SELECT 1 FROM runtime_browser_evidence WHERE evidence_id=?1 AND effect_id=?2)",
                    params![evidence_ref, effect_id],
                    |row| row.get(0),
                )?;
                if !evidence_exists {
                    return Err(RuntimeError::new(
                        ErrorCode::NotFound,
                        "reconciliation evidence not found",
                    ));
                }
                tx.execute(
                    "UPDATE runtime_effects SET outcome=?2,reconciled_at=CURRENT_TIMESTAMP WHERE effect_id=?1",
                    params![effect_id, effect_outcome(resolution)],
                )?;
                let cursor = append_event(
                    &tx,
                    request_id,
                    workspace_id,
                    "effect-reconciled",
                    &serde_json::json!({"effect_id": effect_id, "outcome": effect_outcome(resolution), "evidence_ref": evidence_ref}),
                )?;
                receipt(
                    command,
                    principal,
                    &command_digest,
                    ReceiptOutcome::Accepted,
                    "EFFECT_RECONCILED",
                    None,
                    None,
                    Some(cursor),
                    None,
                    Some(effect_id.clone()),
                )
            }
        };

        tx.execute(
            "INSERT INTO runtime_requests(request_id,command_digest,actor,client_id,receipt_json) VALUES(?1,?2,?3,?4,?5)",
            params![command.request_id(), command_digest, principal.subject(), principal.client_id(), serde_json::to_string(&receipt).map_err(invalid_json)?],
        )?;
        tx.commit()?;
        Ok(receipt)
    }

    fn validate_intake(
        &self,
        command: &Command,
        principal: &AuthenticatedPrincipal,
        now_unix_ms: i64,
    ) -> Result<(), RuntimeError> {
        if !principal.is_verified() || principal.subject().trim().is_empty() {
            return Err(RuntimeError::new(
                ErrorCode::Unauthenticated,
                "a verified principal is required",
            ));
        }
        if command.request_id().trim().is_empty() || command.workspace_id().trim().is_empty() {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "request and workspace identities are required",
            ));
        }
        if command.deadline_unix_ms() <= now_unix_ms {
            return Err(RuntimeError::new(
                ErrorCode::DeadlineExceeded,
                "command deadline has elapsed",
            ));
        }
        Ok(())
    }

    fn prior(
        &self,
        request_id: &str,
        command_digest: &str,
    ) -> Result<Option<Receipt>, RuntimeError> {
        let row: Option<(String, String)> = self
            .conn
            .query_row(
                "SELECT command_digest,receipt_json FROM runtime_requests WHERE request_id=?1",
                [request_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .optional()?;
        match row {
            Some((stored_digest, _)) if stored_digest != command_digest => Err(RuntimeError::new(
                ErrorCode::IdempotencyKeyReused,
                "request identity is already bound to a different command",
            )),
            Some((_, json)) => serde_json::from_str(&json).map(Some).map_err(invalid_json),
            None => Ok(None),
        }
    }

    pub fn snapshot(
        &self,
        workspace_id: &str,
        known_cursor: Option<i64>,
        now_unix_ms: i64,
    ) -> Result<Option<WorkspaceSnapshot>, RuntimeError> {
        let Some(workspace) = self.workspace(workspace_id)? else {
            return Ok(None);
        };
        let cursor: i64 = self.conn.query_row(
            "SELECT COALESCE(MAX(event_id),0) FROM runtime_events WHERE workspace_id=?1",
            [workspace_id],
            |row| row.get(0),
        )?;
        let freshness = if known_cursor.is_none_or(|known| known == cursor) {
            "current"
        } else {
            "stale"
        };
        Ok(Some(WorkspaceSnapshot {
            snapshot_id: uuid::Uuid::new_v4().to_string(),
            projection_revision: workspace.accepted_revision,
            predecessor_revision: workspace.accepted_revision.checked_sub(1),
            event_cursor: cursor,
            freshness: freshness.into(),
            proposals: self.proposals(workspace_id)?,
            evidence: self.evidence(workspace_id)?,
            conflicts: Vec::new(),
            open_questions: Vec::new(),
            residue: Vec::new(),
            created_at_unix_ms: now_unix_ms,
            workspace,
        }))
    }

    pub fn workspace(&self, id: &str) -> Result<Option<Workspace>, RuntimeError> {
        self.conn
            .query_row(
                "SELECT workspace_id,work_owner,accepted_revision,accepted_text FROM workspaces WHERE workspace_id=?1",
                [id],
                |row| {
                    Ok(Workspace {
                        workspace_id: row.get(0)?,
                        work_owner: row.get(1)?,
                        accepted_revision: row.get(2)?,
                        accepted_text: row.get(3)?,
                    })
                },
            )
            .optional()
            .map_err(Into::into)
    }

    pub fn proposals(&self, workspace_id: &str) -> Result<Vec<Proposal>, RuntimeError> {
        let mut query = self.conn.prepare(
            "SELECT proposal_id,workspace_id,producer,client_id,source_revision,context_digest,operation_id,target_artifact,target_region,text,rationale,uncertainty,validation_diagnostics_json,status,created_at FROM runtime_proposals WHERE workspace_id=?1 ORDER BY created_at,proposal_id",
        )?;
        query
            .query_map([workspace_id], |row| {
                let diagnostics: String = row.get(12)?;
                Ok(Proposal {
                    proposal_id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    producer: row.get(2)?,
                    client_id: row.get(3)?,
                    source_revision: row.get(4)?,
                    context_digest: row.get(5)?,
                    operation_id: row.get(6)?,
                    target_artifact: row.get(7)?,
                    target_region: row.get(8)?,
                    text: row.get(9)?,
                    rationale: row.get(10)?,
                    uncertainty: row.get(11)?,
                    validation_diagnostics: serde_json::from_str(&diagnostics).unwrap_or_default(),
                    status: proposal_status(&row.get::<_, String>(13)?),
                    created_at: row.get(14)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
            .map_err(Into::into)
    }

    pub fn events_after(
        &self,
        workspace_id: &str,
        cursor: i64,
        limit: usize,
    ) -> Result<Vec<RuntimeEvent>, RuntimeError> {
        let limit = limit.clamp(1, 1_000) as i64;
        let mut query = self.conn.prepare(
            "SELECT event_id,workspace_id,event_type,payload_json,created_at FROM runtime_events WHERE workspace_id=?1 AND event_id>?2 ORDER BY event_id LIMIT ?3",
        )?;
        query
            .query_map(params![workspace_id, cursor, limit], |row| {
                let payload: String = row.get(3)?;
                Ok(RuntimeEvent {
                    cursor: row.get(0)?,
                    workspace_id: row.get(1)?,
                    event_type: row.get(2)?,
                    payload: serde_json::from_str(&payload).unwrap_or(serde_json::Value::Null),
                    created_at: row.get(4)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()
            .map_err(Into::into)
    }

    fn evidence(&self, workspace_id: &str) -> Result<Vec<BrowserEvidence>, RuntimeError> {
        let mut query = self.conn.prepare(
            "SELECT evidence_id,effect_id,workspace_id,method,origin,artifact_sha256,redacted_observation,captured_at_unix_ms,outcome,residue_json FROM runtime_browser_evidence WHERE workspace_id=?1 ORDER BY captured_at_unix_ms,evidence_id",
        )?;
        query
            .query_map([workspace_id], |row| {
                let residue: String = row.get(9)?;
                Ok(BrowserEvidence {
                    evidence_id: row.get(0)?,
                    effect_id: row.get(1)?,
                    workspace_id: row.get(2)?,
                    method: row.get(3)?,
                    origin: row.get(4)?,
                    artifact_sha256: row.get(5)?,
                    redacted_observation: row.get(6)?,
                    captured_at_unix_ms: row.get(7)?,
                    outcome: parse_effect_outcome(&row.get::<_, String>(8)?),
                    residue: serde_json::from_str(&residue).unwrap_or_default(),
                })
            })?
            .collect::<Result<Vec<_>, _>>()
            .map_err(Into::into)
    }

    pub fn create_pairing_code(&mut self, pairing: &PairingCode) -> Result<(), RuntimeError> {
        if pairing.code.len() < 16 || pairing.scopes.is_empty() {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "pairing code and scopes are incomplete",
            ));
        }
        self.conn.execute(
            "INSERT INTO pairing_codes(code_digest,subject,scopes_json,expires_at_unix_ms) VALUES(?1,?2,?3,?4)",
            params![sha256_text(&pairing.code), pairing.subject, serde_json::to_string(&pairing.scopes).map_err(invalid_json)?, pairing.expires_at_unix_ms],
        )?;
        Ok(())
    }

    pub fn redeem_pairing_code(
        &mut self,
        code: &str,
        client_id: &str,
        jwk_thumbprint: &str,
        now_unix_ms: i64,
        lease_duration_ms: i64,
    ) -> Result<CapabilityLease, RuntimeError> {
        if client_id.trim().is_empty() || jwk_thumbprint.trim().is_empty() {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "pairing client and key identity are required",
            ));
        }
        let tx = self.conn.transaction()?;
        let (subject, scopes_json, expires_at, consumed): (String, String, i64, Option<i64>) = tx
            .query_row(
                "SELECT subject,scopes_json,expires_at_unix_ms,consumed_at_unix_ms FROM pairing_codes WHERE code_digest=?1",
                [sha256_text(code)],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
            )
            .optional()?
            .ok_or_else(|| RuntimeError::new(ErrorCode::Unauthenticated, "pairing code not found"))?;
        if consumed.is_some() || expires_at <= now_unix_ms || lease_duration_ms <= 0 {
            return Err(RuntimeError::new(
                ErrorCode::GrantNotCurrent,
                "pairing code is consumed or expired",
            ));
        }
        let scopes: Vec<String> = serde_json::from_str(&scopes_json).map_err(invalid_json)?;
        let lease = CapabilityLease {
            lease_id: uuid::Uuid::new_v4().to_string(),
            subject,
            client_id: client_id.to_string(),
            jwk_thumbprint: jwk_thumbprint.to_string(),
            scopes,
            expires_at_unix_ms: expires_at.min(now_unix_ms.saturating_add(lease_duration_ms)),
        };
        tx.execute(
            "UPDATE pairing_codes SET consumed_at_unix_ms=?2 WHERE code_digest=?1",
            params![sha256_text(code), now_unix_ms],
        )?;
        tx.execute(
            "INSERT INTO capability_leases(lease_id,subject,client_id,jwk_thumbprint,scopes_json,expires_at_unix_ms,created_at_unix_ms) VALUES(?1,?2,?3,?4,?5,?6,?7)",
            params![lease.lease_id, lease.subject, lease.client_id, lease.jwk_thumbprint, serde_json::to_string(&lease.scopes).map_err(invalid_json)?, lease.expires_at_unix_ms, now_unix_ms],
        )?;
        tx.commit()?;
        Ok(lease)
    }

    pub fn authorize_dpop(
        &mut self,
        client_id: &str,
        jwk_thumbprint: &str,
        jti: &str,
        required_scope: &str,
        now_unix_ms: i64,
    ) -> Result<AuthenticatedPrincipal, RuntimeError> {
        let tx = self.conn.transaction()?;
        let (subject, scopes_json, expires_at_unix_ms): (String, String, i64) = tx
            .query_row(
                "SELECT subject,scopes_json,expires_at_unix_ms FROM capability_leases WHERE client_id=?1 AND jwk_thumbprint=?2 AND revoked=0 AND expires_at_unix_ms>?3 ORDER BY created_at_unix_ms DESC LIMIT 1",
                params![client_id, jwk_thumbprint, now_unix_ms],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .optional()?
            .ok_or_else(|| RuntimeError::new(ErrorCode::GrantNotCurrent, "no current scoped lease"))?;
        let scopes: Vec<String> = serde_json::from_str(&scopes_json).map_err(invalid_json)?;
        if !scopes.iter().any(|scope| scope == required_scope) {
            return Err(RuntimeError::new(
                ErrorCode::ScopeDenied,
                "lease does not contain the required scope",
            ));
        }
        tx.execute(
            "INSERT INTO dpop_replay_guard(jwk_thumbprint,jti,observed_at_unix_ms) VALUES(?1,?2,?3)",
            params![jwk_thumbprint, jti, now_unix_ms],
        )
        .map_err(|error| {
            if matches!(
                &error,
                rusqlite::Error::SqliteFailure(sqlite, _)
                    if sqlite.code == rusqlite::ErrorCode::ConstraintViolation
            ) {
                RuntimeError::new(ErrorCode::IdempotencyKeyReused, "DPoP proof was replayed")
            } else {
                error.into()
            }
        })?;
        tx.commit()?;
        Ok(AuthenticatedPrincipal::verified_dpop(
            subject,
            client_id.to_string(),
            expires_at_unix_ms,
        ))
    }
}

#[allow(clippy::too_many_arguments)]
fn dispose_proposal(
    tx: &Transaction<'_>,
    command: &Command,
    principal: &AuthenticatedPrincipal,
    command_digest: &str,
    request_id: &str,
    workspace_id: &str,
    proposal_id: &str,
    expected_revision: i64,
    disposition: ProposalStatus,
    reason: Option<&String>,
) -> Result<Receipt, RuntimeError> {
    require_owner(tx, workspace_id, principal)?;
    let revision = current_revision(tx, workspace_id)?;
    if revision != expected_revision {
        return Err(RuntimeError::conflict(revision));
    }
    let (status, source_revision, text): (String, i64, String) = tx
        .query_row(
            "SELECT status,source_revision,text FROM runtime_proposals WHERE proposal_id=?1 AND workspace_id=?2",
            params![proposal_id, workspace_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()?
        .ok_or_else(|| RuntimeError::new(ErrorCode::NotFound, "proposal not found"))?;
    if status != "pending" || source_revision != revision {
        return Err(RuntimeError::new(
            ErrorCode::ProposalNotCurrent,
            "proposal is not pending against the current revision",
        ));
    }

    let (next_revision, event_type, code, outcome) = match disposition {
        ProposalStatus::Accepted => {
            let next = revision + 1;
            tx.execute(
                "UPDATE workspaces SET accepted_revision=?2,accepted_text=?3 WHERE workspace_id=?1",
                params![workspace_id, next, text],
            )?;
            (
                next,
                "proposal-accepted",
                "PROPOSAL_ACCEPTED",
                ReceiptOutcome::Accepted,
            )
        }
        ProposalStatus::Rejected => (
            revision,
            "proposal-rejected",
            "PROPOSAL_REJECTED",
            ReceiptOutcome::Rejected,
        ),
        _ => {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "unsupported proposal disposition",
            ));
        }
    };
    tx.execute(
        "UPDATE runtime_proposals SET status=?2,disposition_reason=?3 WHERE proposal_id=?1",
        params![proposal_id, proposal_status_text(&disposition), reason],
    )?;
    let cursor = append_event(
        tx,
        request_id,
        workspace_id,
        event_type,
        &serde_json::json!({"proposal_id": proposal_id, "revision": next_revision, "reason": reason}),
    )?;
    Ok(receipt(
        command,
        principal,
        command_digest,
        outcome,
        code,
        Some(revision),
        Some(next_revision),
        Some(cursor),
        Some(proposal_id.to_string()),
        None,
    ))
}

fn require_owner(
    tx: &Transaction<'_>,
    workspace_id: &str,
    principal: &AuthenticatedPrincipal,
) -> Result<(), RuntimeError> {
    let owner: String = tx
        .query_row(
            "SELECT work_owner FROM workspaces WHERE workspace_id=?1",
            [workspace_id],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| RuntimeError::new(ErrorCode::NotFound, "workspace not found"))?;
    if !principal.is_verified() || owner != principal.subject() {
        return Err(RuntimeError::new(
            ErrorCode::WorkOwnerRequired,
            "verified Work Owner principal required",
        ));
    }
    Ok(())
}

fn current_revision(tx: &Transaction<'_>, workspace_id: &str) -> Result<i64, RuntimeError> {
    tx.query_row(
        "SELECT accepted_revision FROM workspaces WHERE workspace_id=?1",
        [workspace_id],
        |row| row.get(0),
    )
    .optional()?
    .ok_or_else(|| RuntimeError::new(ErrorCode::NotFound, "workspace not found"))
}

fn append_event(
    tx: &Transaction<'_>,
    request_id: &str,
    workspace_id: &str,
    event_type: &str,
    payload: &serde_json::Value,
) -> Result<i64, RuntimeError> {
    tx.execute(
        "INSERT INTO runtime_events(request_id,workspace_id,event_type,payload_json) VALUES(?1,?2,?3,?4)",
        params![request_id, workspace_id, event_type, payload.to_string()],
    )?;
    Ok(tx.last_insert_rowid())
}

#[allow(clippy::too_many_arguments)]
fn receipt(
    command: &Command,
    principal: &AuthenticatedPrincipal,
    command_digest: &str,
    outcome: ReceiptOutcome,
    code: &str,
    prior_revision: Option<i64>,
    resulting_revision: Option<i64>,
    event_cursor: Option<i64>,
    linked_proposal_id: Option<String>,
    linked_effect_id: Option<String>,
) -> Receipt {
    Receipt {
        request_id: command.request_id().to_string(),
        command_digest: command_digest.to_string(),
        actor: principal.subject().to_string(),
        client_id: principal.client_id().to_string(),
        workspace_id: command.workspace_id().to_string(),
        outcome,
        code: code.into(),
        prior_revision,
        resulting_revision,
        event_cursor,
        persistence: "sqlite-committed-before-ack".into(),
        replayed: false,
        linked_proposal_id,
        linked_effect_id,
    }
}

fn context_digest(context: &ContextSelection) -> Result<String, RuntimeError> {
    use sha2::{Digest, Sha256};
    let bytes = serde_json::to_vec(context).map_err(invalid_json)?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}

fn validate_evidence(
    envelope: &crate::EffectEnvelope,
    evidence: &BrowserEvidence,
) -> Result<(), RuntimeError> {
    if evidence.effect_id != envelope.effect_id
        || evidence.workspace_id != envelope.workspace_id
        || evidence.redacted_observation.len() > 64 * 1024
        || evidence.origin != envelope.target
    {
        return Err(RuntimeError::new(
            ErrorCode::InvalidInput,
            "browser evidence identity, origin, or size is invalid",
        ));
    }
    Ok(())
}

fn insert_evidence(tx: &Transaction<'_>, evidence: &BrowserEvidence) -> Result<(), RuntimeError> {
    tx.execute(
        "INSERT INTO runtime_browser_evidence(evidence_id,effect_id,workspace_id,method,origin,artifact_sha256,redacted_observation,captured_at_unix_ms,outcome,residue_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![evidence.evidence_id, evidence.effect_id, evidence.workspace_id, evidence.method, evidence.origin, evidence.artifact_sha256, evidence.redacted_observation, evidence.captured_at_unix_ms, effect_outcome(&evidence.outcome), serde_json::to_string(&evidence.residue).map_err(invalid_json)?],
    )?;
    Ok(())
}

fn proposal_status(value: &str) -> ProposalStatus {
    match value {
        "accepted" => ProposalStatus::Accepted,
        "rejected" => ProposalStatus::Rejected,
        "superseded" => ProposalStatus::Superseded,
        "withdrawn" => ProposalStatus::Withdrawn,
        _ => ProposalStatus::Pending,
    }
}

fn proposal_status_text(value: &ProposalStatus) -> &'static str {
    match value {
        ProposalStatus::Pending => "pending",
        ProposalStatus::Accepted => "accepted",
        ProposalStatus::Rejected => "rejected",
        ProposalStatus::Superseded => "superseded",
        ProposalStatus::Withdrawn => "withdrawn",
    }
}

fn effect_outcome(value: &EffectOutcome) -> &'static str {
    match value {
        EffectOutcome::Planned => "planned",
        EffectOutcome::Certain => "certain",
        EffectOutcome::Failed => "failed",
        EffectOutcome::Cancelled => "cancelled",
        EffectOutcome::Uncertain => "uncertain",
    }
}

fn parse_effect_outcome(value: &str) -> EffectOutcome {
    match value {
        "certain" => EffectOutcome::Certain,
        "failed" => EffectOutcome::Failed,
        "cancelled" => EffectOutcome::Cancelled,
        "uncertain" => EffectOutcome::Uncertain,
        _ => EffectOutcome::Planned,
    }
}

fn invalid_json(error: serde_json::Error) -> RuntimeError {
    RuntimeError::new(ErrorCode::InvalidInput, error.to_string())
}

fn sha256_text(value: &str) -> String {
    use sha2::{Digest, Sha256};
    format!("{:x}", Sha256::digest(value.as_bytes()))
}
