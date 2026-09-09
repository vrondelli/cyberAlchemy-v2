//! Original-file lifecycle v1. Payload bytes are deliberately outside durable metadata.
use crate::{
    auth::{artifact_message, signed_message},
    model::{AccessResponse, Authorization, CreateArtifactRequest},
};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

pub const MAX_ORIGINAL_BYTES: u64 = 10_000_000;
pub const MAX_MANIFEST_BYTES: usize = 16_384;
pub const MAX_FILE_CIPHERTEXT: usize = MAX_ORIGINAL_BYTES as usize + MAX_MANIFEST_BYTES + 44;
pub const MAX_FILE_REQUEST: usize = 14_000_000;
pub const RETENTION_POLICY: &str = "kep-file-retention-v1";
pub const ACK_WINDOW_SECONDS: u64 = 900;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileUploadRequest {
    pub artifact: CreateArtifactRequest,
    pub original_bytes: u64,
    pub retention_policy: String,
    pub policy_accepted: bool,
}
impl FileUploadRequest {
    pub fn message(&self) -> String {
        let a = &self.artifact;
        let inner = artifact_message(
            &a.operation_id,
            &a.originator_id,
            &a.artifact_version_id,
            &a.policy_id,
            a.encryption_epoch,
            &a.ciphertext_sha256,
            &a.originator_envelope_sha256,
        );
        signed_message("file-upload", &(
                inner,
                self.original_bytes,
                &self.retention_policy,
                self.policy_accepted
            ))
    }
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileCommand {
    pub requester_id: String,
    pub attempt_id: String,
    pub policy_accepted: bool,
    pub authorization: Authorization,
}
impl FileCommand {
    pub fn message(&self, action: &str, artifact: &str, digest: &str, revision: u64) -> String {
        signed_message(&format!("file-{action}"), &(
                artifact,
                &self.requester_id,
                &self.attempt_id,
                digest,
                revision,
                RETENTION_POLICY,
                self.policy_accepted
            ))
    }
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DownloadAttempt {
    pub requester_id: String,
    pub revision: u64,
    pub issued_at: u64,
    pub acknowledged_at: Option<u64>,
    pub renewed_until: Option<u64>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileRecord {
    pub original_bytes: u64,
    pub retention_policy: String,
    pub upload_message: String,
    pub accepted_by: String,
    pub accepted_at: u64,
    pub last_download_at: Option<u64>,
    pub expires_at: Option<u64>,
    pub expired_at: Option<u64>,
    pub attempts: BTreeMap<String, DownloadAttempt>,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileStatus {
    pub artifact_version_id: String,
    pub original_bytes: u64,
    pub retention_policy: String,
    pub last_download_at: Option<u64>,
    pub expires_at: Option<u64>,
    pub expired: bool,
}
impl FileRecord {
    pub fn expired(&self, now: u64) -> bool {
        self.expired_at.is_some() || self.expires_at.is_some_and(|at| now >= at)
    }
    pub fn status(&self, id: &str, now: u64) -> FileStatus {
        FileStatus {
            artifact_version_id: id.into(),
            original_bytes: self.original_bytes,
            retention_policy: self.retention_policy.clone(),
            last_download_at: self.last_download_at,
            expires_at: self.expires_at,
            expired: self.expired(now),
        }
    }
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct FileAccessResponse {
    #[serde(flatten)]
    pub access: AccessResponse,
    pub attempt_id: String,
    pub acknowledgement_deadline: u64,
    pub retention: FileStatus,
}
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct DownloadReceipt {
    pub attempt_id: String,
    pub acknowledged_at: u64,
    pub expires_at: u64,
}
fn leap(year: u64) -> bool {
    year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
}
/// UTC calendar anniversary, preserving time of day and clamping February 29.
pub fn calendar_year_after(timestamp: u64) -> u64 {
    let mut day = timestamp / 86400;
    let mut year = 1970;
    while day >= if leap(year) { 366 } else { 365 } {
        day -= if leap(year) { 366 } else { 365 };
        year += 1;
    }
    let days = if leap(year) && day <= 59 {
        366
    } else if leap(year + 1) && day >= 59 {
        366
    } else {
        365
    };
    // Feb 29 -> Feb 28 is 365 days, rather than March 1.
    timestamp + (if leap(year) && day == 59 { 365 } else { days }) * 86400
}
