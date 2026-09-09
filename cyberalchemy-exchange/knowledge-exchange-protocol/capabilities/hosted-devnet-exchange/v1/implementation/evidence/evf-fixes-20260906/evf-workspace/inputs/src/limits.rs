//! Bounded single-process admission. These ceilings do not replace edge limits
//! or incremental persistence; they bound the current snapshot implementation.
use crate::model::Database;
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tokio::sync::Semaphore;

#[derive(Clone, Debug)]
pub struct Limits {
    pub concurrent_requests: usize,
    pub requests_per_minute: usize,
    pub telemetry_per_minute: usize,
    pub records_per_collection: usize,
    pub telemetry_records: usize,
    pub attempts_per_file: usize,
    pub metadata_bytes: usize,
    pub stored_bytes: usize,
    pub wallet_bytes: usize,
}
impl Default for Limits {
    fn default() -> Self {
        Self {
            concurrent_requests: 4,
            requests_per_minute: 240,
            telemetry_per_minute: 10,
            records_per_collection: 2048,
            telemetry_records: 128,
            attempts_per_file: 1024,
            metadata_bytes: 16 * 1024 * 1024,
            stored_bytes: 128 * 1024 * 1024,
            wallet_bytes: 32 * 1024 * 1024,
        }
    }
}
pub(crate) struct Admission {
    pub permits: Arc<Semaphore>,
    window: Mutex<(Instant, usize, usize)>,
}
impl Admission {
    pub fn new(limits: &Limits) -> Self {
        Self {
            permits: Arc::new(Semaphore::new(limits.concurrent_requests)),
            window: Mutex::new((Instant::now(), 0, 0)),
        }
    }
    pub fn admit(&self, limits: &Limits, telemetry: bool) -> Result<(), u64> {
        let mut window = self.window.lock().unwrap_or_else(|e| e.into_inner());
        let elapsed = window.0.elapsed();
        if elapsed >= Duration::from_secs(60) {
            *window = (Instant::now(), 0, 0);
        }
        if window.1 >= limits.requests_per_minute
            || (telemetry && window.2 >= limits.telemetry_per_minute)
        {
            return Err(60_u64.saturating_sub(window.0.elapsed().as_secs()).max(1));
        }
        window.1 += 1;
        if telemetry {
            window.2 += 1;
        }
        Ok(())
    }
}
fn growth(before: usize, after: usize, maximum: usize) -> Result<(), &'static str> {
    if after > maximum && after > before {
        Err("Storage capacity reached; existing records are preserved.")
    } else {
        Ok(())
    }
}
fn metadata_size(db: &Database) -> Result<usize, &'static str> {
    db.metadata()
        .map(|metadata| metadata.byte_len())
        .map_err(|_| "Cannot measure storage safely.")
}
fn wallet_storage(db: &Database) -> BTreeMap<&str, usize> {
    let mut result = BTreeMap::new();
    for (wallet, account) in &db.accounts {
        result.insert(wallet.as_str(), account.ciphertext_base64.len());
    }
    for (id, artifact) in &db.artifacts {
        if let Some(owner) = db.identities.get(&artifact.originator_id) {
            let bytes = db
                .file_payloads
                .get(id)
                .map_or(artifact.ciphertext_base64.len(), String::len);
            let value = result
                .entry(owner.wallet_public_key.as_str())
                .or_insert(0usize);
            *value = value.saturating_add(bytes);
        }
    }
    result
}
impl Limits {
    /// Leave bounded headroom for completing already-issued downloads when new
    /// admission is full. Only the acknowledgement handler may use this reserve.
    pub fn validate_receipt_growth(
        &self,
        before: &Database,
        after: &Database,
    ) -> Result<(), &'static str> {
        let mut reserved = self.clone();
        reserved.metadata_bytes = reserved.metadata_bytes.saturating_add(4 * 1024 * 1024);
        reserved.stored_bytes = reserved.stored_bytes.saturating_add(4 * 1024 * 1024);
        reserved.validate_growth(before, after)
    }

    /// Called under the database write lock before persistence. Over-limit
    /// historical records are not deleted; non-growing operations remain possible.
    pub fn validate_growth(&self, before: &Database, after: &Database) -> Result<(), &'static str> {
        for (a, b) in [
            (before.identities.len(), after.identities.len()),
            (before.accounts.len(), after.accounts.len()),
            (before.artifacts.len(), after.artifacts.len()),
            (before.grants.len(), after.grants.len()),
            (before.reissues.len(), after.reissues.len()),
            (
                before.consumed_operations.len(),
                after.consumed_operations.len(),
            ),
        ] {
            growth(a, b, self.records_per_collection)?;
        }
        growth(
            before.client_errors.len(),
            after.client_errors.len(),
            self.telemetry_records,
        )?;
        if !before.files.shares_index(&after.files) {
            for (id, file) in &after.files {
                growth(
                    before.files.get(id).map_or(0, |f| f.attempts.len()),
                    file.attempts.len(),
                    self.attempts_per_file,
                )?;
            }
        }
        let old_meta = metadata_size(before)?;
        let new_meta = metadata_size(after)?;
        growth(old_meta, new_meta, self.metadata_bytes)?;
        let payload = |db: &Database| {
            db.file_payloads
                .values()
                .fold(0usize, |n, v| n.saturating_add(v.len()))
        };
        let old_payload = payload(before);
        let new_payload = if before.file_payloads.shares_index(&after.file_payloads) {
            old_payload
        } else {
            payload(after)
        };
        growth(
            old_meta.saturating_add(old_payload),
            new_meta.saturating_add(new_payload),
            self.stored_bytes,
        )?;
        if !(before.accounts.shares_index(&after.accounts)
            && before.identities.shares_index(&after.identities)
            && before.artifacts.shares_index(&after.artifacts)
            && before.file_payloads.shares_index(&after.file_payloads))
        {
            let old = wallet_storage(before);
            for (wallet, bytes) in wallet_storage(after) {
                growth(*old.get(wallet).unwrap_or(&0), bytes, self.wallet_bytes)?;
            }
        }
        Ok(())
    }
}
