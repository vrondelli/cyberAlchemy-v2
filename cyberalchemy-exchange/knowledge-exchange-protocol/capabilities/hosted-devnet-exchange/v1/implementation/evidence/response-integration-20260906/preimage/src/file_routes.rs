use super::*;
use crate::files::*;
use axum::extract::DefaultBodyLimit;
use std::collections::BTreeMap;

pub(super) fn routes() -> Router<Application> {
    Router::new()
        .route(
            "/v1/files",
            post(upload).layer(DefaultBodyLimit::max(MAX_FILE_REQUEST)),
        )
        .route("/v1/files/{artifact_id}", get(status))
        .route("/v1/files/{artifact_id}/access", post(file_access))
        .route("/v1/files/{artifact_id}/acknowledge", post(acknowledge))
}
fn gone() -> ApiError {
    ApiError {
        status: StatusCode::GONE,
        code: "file_expired",
        message: "file availability has expired; provenance is retained".into(),
    }
}

impl Application {
    /// Removes only new file payloads. Legacy immutable ciphertext is never selected.
    pub async fn expire_files(&self) -> Result<usize, String> {
        let now = (self.clock)();
        let mut guard = self.database.write().await;
        let ids: Vec<_> = guard
            .files
            .iter()
            .filter(|(_, f)| f.expired_at.is_none() && f.expired(now))
            .map(|(id, _)| id.clone())
            .collect();
        if ids.is_empty() {
            return Ok(0);
        }
        let mut candidate = guard.clone();
        for id in &ids {
            candidate.files.get_mut(id).unwrap().expired_at = Some(now);
            candidate.file_payloads.remove(id);
        }
        self.persistence
            .save(&candidate, "file_payloads_expired", "file-lifecycle-v1")
            .await?;
        *guard = candidate;
        Ok(ids.len())
    }
    /// Caller owns the task lifetime; run only with the explicitly selected service database.
    pub async fn run_file_expiry(self) {
        loop {
            if self.expire_files().await.is_err() {
                eprintln!("KEP file expiry sweep failed; will retry");
            }
            tokio::time::sleep(std::time::Duration::from_secs(60)).await;
        }
    }
}

async fn upload(
    State(app): State<Application>,
    Json(request): Json<FileUploadRequest>,
) -> Result<Json<FileStatus>, ApiError> {
    let a = &request.artifact;
    for (v, label) in [
        (&a.artifact_version_id, "artifact"),
        (&a.operation_id, "operation"),
        (&a.originator_id, "originator"),
        (&a.policy_id, "policy"),
    ] {
        validate_id(v, label).map_err(input)?;
    }
    if !request.policy_accepted || request.retention_policy != RETENTION_POLICY {
        return Err(ApiError::bad(
            "policy_required",
            "accept the current file retention policy",
        ));
    }
    if request.original_bytes > MAX_ORIGINAL_BYTES || a.encryption_epoch == 0 {
        return Err(ApiError::bad(
            "file_size_or_epoch",
            "file limit is 10000000 original bytes; epoch must be positive",
        ));
    }
    // Reject unauthorized uploads before decoding and hashing the full payload.
    {
        let db = app.database.read().await;
        let origin = identity(&db, &a.originator_id)?;
        verify_wallet_signature(&origin.wallet_public_key, &a.authorization, &request.message())
            .map_err(ApiError::forbidden)?;
    }
    let bytes =
        verify_digest(&a.ciphertext_base64, &a.ciphertext_sha256, "ciphertext").map_err(input)?;
    // A 24-byte nonce, 16-byte AEAD tag, 4-byte manifest length, and bounded encrypted manifest.
    let minimum = request.original_bytes as usize + 44;
    if bytes.len() < minimum
        || bytes.len() > minimum + MAX_MANIFEST_BYTES
        || bytes.len() > MAX_FILE_CIPHERTEXT
    {
        return Err(ApiError::bad(
            "invalid_ciphertext_size",
            "encrypted file package size is outside the declared bound",
        ));
    }
    let envelope = verify_digest(
        &a.originator_envelope_base64,
        &a.originator_envelope_sha256,
        "envelope",
    )
    .map_err(input)?;
    if envelope.is_empty() || envelope.len() > 16_384 {
        return Err(ApiError::bad(
            "invalid_envelope",
            "envelope must contain 1 to 16384 bytes",
        ));
    }
    let message = request.message();
    let mut guard = app.database.write().await;
    let now = (app.clock)();
    let origin = identity(&guard, &a.originator_id)?.clone();
    verify_wallet_signature(&origin.wallet_public_key, &a.authorization, &message)
        .map_err(ApiError::forbidden)?;
    if let Some(existing) = guard.files.get(&a.artifact_version_id) {
        if existing.upload_message == message {
            return Ok(Json(existing.status(&a.artifact_version_id, now)));
        }
        return Err(ApiError::conflict(
            "file id is already bound to another upload",
        ));
    }
    if guard.artifacts.contains_key(&a.artifact_version_id)
        || guard.consumed_operations.contains(&a.operation_id)
    {
        return Err(ApiError::conflict("artifact or operation already exists"));
    }
    let mut candidate = guard.clone();
    candidate.artifacts.insert(
        a.artifact_version_id.clone(),
        Artifact {
            artifact_version_id: a.artifact_version_id.clone(),
            originator_id: a.originator_id.clone(),
            policy_id: a.policy_id.clone(),
            encryption_epoch: a.encryption_epoch,
            ciphertext_base64: String::new(),
            ciphertext_sha256: a.ciphertext_sha256.clone(),
            owners: std::iter::once(a.originator_id.clone()).collect(),
            envelopes: std::iter::once((
                a.originator_id.clone(),
                RecipientEnvelope {
                    recipient_id: a.originator_id.clone(),
                    key_version: origin.encryption_key_version,
                    envelope_base64: a.originator_envelope_base64.clone(),
                    envelope_sha256: a.originator_envelope_sha256.clone(),
                },
            ))
            .collect(),
            revision: 0,
        },
    );
    let record = FileRecord {
        original_bytes: request.original_bytes,
        retention_policy: request.retention_policy,
        upload_message: message,
        accepted_by: a.originator_id.clone(),
        accepted_at: now,
        last_download_at: None,
        expires_at: None,
        expired_at: None,
        attempts: BTreeMap::new(),
    };
    let response = record.status(&a.artifact_version_id, now);
    candidate
        .files
        .insert(a.artifact_version_id.clone(), record);
    candidate
        .file_payloads
        .insert(a.artifact_version_id.clone(), a.ciphertext_base64.clone());
    candidate.consumed_operations.insert(a.operation_id.clone());
    app.limits.validate_growth(&guard, &candidate).map_err(ApiError::capacity)?;
    app.persistence
        .save(&candidate, "file_uploaded", &a.artifact_version_id)
        .await
        .map_err(ApiError::unavailable)?;
    *guard = candidate;
    Ok(Json(response))
}
async fn status(
    State(app): State<Application>,
    Path(id): Path<String>,
) -> Result<Json<FileStatus>, ApiError> {
    let guard = app.database.read().await;
    let file = guard
        .files
        .get(&id)
        .ok_or_else(|| ApiError::missing("file not registered"))?;
    Ok(Json(file.status(&id, (app.clock)())))
}
fn authorize_command(
    db: &Database,
    id: &str,
    request: &FileCommand,
    action: &str,
    revision: u64,
) -> Result<(), ApiError> {
    validate_id(&request.attempt_id, "attempt").map_err(input)?;
    if !request.policy_accepted {
        return Err(ApiError::bad(
            "policy_required",
            "accept the file retention policy",
        ));
    }
    let artifact = db
        .artifacts
        .get(id)
        .ok_or_else(|| ApiError::missing("artifact not registered"))?;
    if !artifact.owners.contains(&request.requester_id) {
        return Err(ApiError::forbidden("requester is not a current owner"));
    }
    let owner = identity(db, &request.requester_id)?;
    verify_wallet_signature(
        &owner.wallet_public_key,
        &request.authorization,
        &request.message(action, id, &artifact.ciphertext_sha256, revision),
    )
    .map_err(ApiError::forbidden)
}
async fn file_access(
    State(app): State<Application>,
    Path(id): Path<String>,
    Json(request): Json<FileCommand>,
) -> Result<Json<FileAccessResponse>, ApiError> {
    let mut guard = app.database.write().await;
    let now = (app.clock)();
    let file = guard
        .files
        .get(&id)
        .ok_or_else(|| ApiError::missing("file not registered"))?;
    let artifact = guard
        .artifacts
        .get(&id)
        .ok_or_else(|| ApiError::missing("artifact not registered"))?;
    let revision = artifact.revision;
    authorize_command(&guard, &id, &request, "access", revision)?;
    if file.expired(now) {
        return Err(gone());
    }
    let envelope = artifact
        .envelopes
        .get(&request.requester_id)
        .ok_or_else(|| ApiError::conflict("owner has no active envelope"))?;
    let ciphertext = guard
        .file_payloads
        .get(&id)
        .ok_or_else(|| ApiError::unavailable("file payload missing"))?;
    let mut attempt = DownloadAttempt {
        requester_id: request.requester_id.clone(),
        revision,
        issued_at: now,
        acknowledged_at: None,
        renewed_until: None,
    };
    if let Some(previous) = file.attempts.get(&request.attempt_id) {
        if previous.requester_id != request.requester_id || previous.revision != revision {
            return Err(ApiError::conflict("attempt already bound"));
        }
        if now >= previous.issued_at.saturating_add(ACK_WINDOW_SECONDS) {
            return Err(ApiError::conflict(
                "attempt expired; start a new access attempt",
            ));
        }
        attempt = previous.clone();
    }
    let response = FileAccessResponse {
        access: AccessResponse {
            artifact_version_id: id.clone(),
            ciphertext_base64: ciphertext.clone(),
            ciphertext_sha256: artifact.ciphertext_sha256.clone(),
            recipient_envelope_base64: envelope.envelope_base64.clone(),
            recipient_envelope_sha256: envelope.envelope_sha256.clone(),
            encryption_epoch: artifact.encryption_epoch,
            revision,
        },
        attempt_id: request.attempt_id.clone(),
        acknowledgement_deadline: attempt.issued_at + ACK_WINDOW_SECONDS,
        retention: file.status(&id, now),
    };
    if !file.attempts.contains_key(&request.attempt_id) {
        let mut candidate = guard.clone();
        candidate
            .files
            .get_mut(&id)
            .unwrap()
            .attempts
            .insert(request.attempt_id, attempt);
        app.limits.validate_growth(&guard, &candidate).map_err(ApiError::capacity)?;
        app.persistence
            .save(&candidate, "file_access_issued", &id)
            .await
            .map_err(ApiError::unavailable)?;
        *guard = candidate;
    }
    Ok(Json(response))
}
async fn acknowledge(
    State(app): State<Application>,
    Path(id): Path<String>,
    Json(request): Json<FileCommand>,
) -> Result<Json<DownloadReceipt>, ApiError> {
    let mut guard = app.database.write().await;
    let now = (app.clock)();
    let file = guard
        .files
        .get(&id)
        .ok_or_else(|| ApiError::missing("file not registered"))?;
    let attempt = file
        .attempts
        .get(&request.attempt_id)
        .ok_or_else(|| ApiError::conflict("no matching access attempt"))?;
    authorize_command(&guard, &id, &request, "acknowledge", attempt.revision)?;
    if attempt.requester_id != request.requester_id {
        return Err(ApiError::forbidden("attempt belongs to another identity"));
    }
    if let (Some(at), Some(until)) = (attempt.acknowledged_at, attempt.renewed_until) {
        return Ok(Json(DownloadReceipt {
            attempt_id: request.attempt_id,
            acknowledged_at: at,
            expires_at: until,
        }));
    }
    if file.expired(now) {
        return Err(gone());
    }
    if now < attempt.issued_at {
        return Err(ApiError::unavailable(
            "Server clock is behind this persisted download attempt; retry after the clock catches up.",
        ));
    }
    if now >= attempt.issued_at.saturating_add(ACK_WINDOW_SECONDS) {
        return Err(ApiError::conflict(
            "download acknowledgement window expired",
        ));
    }
    if guard.artifacts[&id].revision != attempt.revision {
        return Err(ApiError::conflict(
            "artifact revision changed; start a new access attempt",
        ));
    }
    let mut candidate = guard.clone();
    let file = candidate.files.get_mut(&id).unwrap();
    let at = now.max(file.last_download_at.unwrap_or(now));
    let until = calendar_year_after(at);
    file.last_download_at = Some(at);
    file.expires_at = Some(until);
    let attempt = file.attempts.get_mut(&request.attempt_id).unwrap();
    attempt.acknowledged_at = Some(at);
    attempt.renewed_until = Some(until);
    app.limits.validate_receipt_growth(&guard, &candidate).map_err(ApiError::capacity)?;
    app.persistence
        .save(&candidate, "file_download_acknowledged", &id)
        .await
        .map_err(ApiError::unavailable)?;
    *guard = candidate;
    Ok(Json(DownloadReceipt {
        attempt_id: request.attempt_id,
        acknowledged_at: at,
        expires_at: until,
    }))
}
