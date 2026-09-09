use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::{Connection, PgConnection, Row};
use std::{collections::BTreeMap, sync::Arc};
use tokio::sync::Mutex;

use crate::model::{ClientErrorEventRequest, Database};

#[derive(Clone)]
pub enum Persistence {
    Memory,
    Postgres(Arc<Mutex<WriterSession>>),
}

// Fingerprints belong to the locked writer connection and advance only after commit.
// They avoid resending unchanged documents without retaining another metadata snapshot.
pub struct WriterSession {
    connection: PgConnection,
    fingerprints: BTreeMap<(String, String), [u8; 32]>,
}

type Documents<'a> = BTreeMap<(String, String), &'a Value>;

fn documents(value: &Value) -> Result<Documents<'_>, String> {
    let mut result = BTreeMap::new();
    for (collection, records) in value.as_object().ok_or("state must be an object")? {
        if collection == "consumed_operations" {
            for id in records.as_array().ok_or("operations must be an array")? {
                result.insert(
                    (
                        collection.clone(),
                        id.as_str().ok_or("operation must be a string")?.into(),
                    ),
                    &Value::Bool(true),
                );
            }
        } else {
            for (id, record) in records.as_object().ok_or("collection must be an object")? {
                result.insert((collection.clone(), id.clone()), record);
            }
        }
    }
    Ok(result)
}

fn fingerprint(value: &Value) -> [u8; 32] {
    Sha256::digest(value.to_string().as_bytes()).into()
}

fn restore_documents(rows: Vec<sqlx::postgres::PgRow>) -> Result<Database, String> {
    let mut value = serde_json::to_value(Database::default()).map_err(|e| e.to_string())?;
    for row in rows {
        let collection: String = row.get("collection");
        let id: String = row.get("record_id");
        let document: Value = row.get("document");
        if collection == "consumed_operations" {
            if document != Value::Bool(true) {
                return Err("invalid consumed operation document".into());
            }
            value[&collection]
                .as_array_mut()
                .unwrap()
                .push(Value::String(id));
        } else {
            value
                .get_mut(&collection)
                .and_then(Value::as_object_mut)
                .ok_or("unknown state collection")?
                .insert(id, document);
        }
    }
    let state: Database = serde_json::from_value(value.clone())
        .map_err(|e| format!("PostgreSQL documents are invalid: {e}"))?;
    let canonical = serde_json::to_value(&state).map_err(|e| e.to_string())?;
    for (collection, records) in value.as_object().unwrap() {
        if collection != "consumed_operations" && canonical[collection] != *records {
            return Err("state documents would lose fields during load".into());
        }
    }
    Ok(state)
}

impl Persistence {
    pub async fn postgres(database_url: &str) -> Result<Self, String> {
        // All persistence uses this session: losing its advisory lock also loses
        // the only write connection. Never reconnect a stale application snapshot.
        let mut connection = PgConnection::connect(database_url)
            .await
            .map_err(|error| format!("PostgreSQL connection failed: {error}"))?;
        let acquired: bool = sqlx::query_scalar("SELECT pg_try_advisory_lock(1262833713, 1)")
            .fetch_one(&mut connection)
            .await
            .map_err(|error| format!("PostgreSQL writer lock failed: {error}"))?;
        if !acquired {
            return Err("KEP database already has an active writer; stop it before starting another instance.".into());
        }
        let mut migration_tx = connection.begin().await.map_err(|e| e.to_string())?;
        for migration in [
            include_str!("../migrations/001_hosted_exchange.sql"),
            include_str!("../migrations/002_error_intelligence.sql"),
            include_str!("../migrations/003_file_payloads.sql"),
            include_str!("../migrations/004_state_documents.sql"),
        ] {
            for statement in migration.split("-- statement") {
                let statement = statement.trim();
                if !statement.is_empty() {
                    sqlx::query(statement)
                        .execute(&mut *migration_tx)
                        .await
                        .map_err(|error| format!("PostgreSQL migration failed: {error}"))?;
                }
            }
        }
        let version: Option<i16> =
            sqlx::query_scalar("SELECT version FROM kep_hosted.state_layout WHERE singleton=1")
                .fetch_optional(&mut *migration_tx)
                .await
                .map_err(|e| e.to_string())?;
        if version.is_none() {
            let count: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.state_documents")
                .fetch_one(&mut *migration_tx)
                .await
                .map_err(|e| e.to_string())?;
            if count != 0 {
                return Err("unmarked state documents; migration refused".into());
            }
            let legacy: Option<Value> = sqlx::query_scalar(
                "SELECT state_json FROM kep_hosted.application_state WHERE state_id=1",
            )
            .fetch_optional(&mut *migration_tx)
            .await
            .map_err(|e| e.to_string())?;
            if let Some(original) = &legacy {
                let state: Database = serde_json::from_value(original.clone())
                    .map_err(|e| format!("legacy state is invalid: {e}"))?;
                let canonical = serde_json::to_value(state).map_err(|e| e.to_string())?;
                let mut compatible = original.clone();
                for collection in ["accounts", "files", "client_errors"] {
                    compatible
                        .as_object_mut()
                        .ok_or("legacy state must be an object")?
                        .entry(collection)
                        .or_insert_with(|| serde_json::json!({}));
                }
                // Refuse silent loss of unknown fields or incompatible historical shapes.
                if compatible != canonical {
                    return Err("legacy state would lose fields during migration".into());
                }
                for ((collection, id), document) in documents(&canonical)? {
                    sqlx::query("INSERT INTO kep_hosted.state_documents (collection,record_id,document) VALUES ($1,$2,$3)")
                        .bind(collection).bind(id).bind(document).execute(&mut *migration_tx).await.map_err(|e| e.to_string())?;
                }
            }
            sqlx::query("INSERT INTO kep_hosted.state_layout (singleton,version,legacy_state_sha256) VALUES (1,1,$1)")
                .bind(legacy.as_ref().map(|v| fingerprint(v).to_vec()))
                .execute(&mut *migration_tx).await.map_err(|e| e.to_string())?;
        } else if version != Some(1) {
            return Err("unsupported state layout".into());
        }
        let rows = sqlx::query("SELECT collection,record_id,document FROM kep_hosted.state_documents ORDER BY collection,record_id")
            .fetch_all(&mut *migration_tx).await.map_err(|e| e.to_string())?;
        let fingerprints = rows
            .iter()
            .map(|row| {
                (
                    (row.get("collection"), row.get("record_id")),
                    fingerprint(&row.get("document")),
                )
            })
            .collect();
        restore_documents(rows)?;
        migration_tx
            .commit()
            .await
            .map_err(|e| format!("state migration commit failed: {e}"))?;
        Ok(Self::Postgres(Arc::new(Mutex::new(WriterSession {
            connection,
            fingerprints,
        }))))
    }

    /// Probe the existing writer session; never reconnect a stale snapshot.
    pub async fn ready(&self) -> bool {
        match self {
            Self::Memory => false,
            Self::Postgres(connection) => {
                matches!(
                    tokio::time::timeout(std::time::Duration::from_secs(2), async {
                        let mut connection = connection.lock().await;
                        sqlx::query_scalar::<_, i32>("SELECT 1")
                            .fetch_one(&mut connection.connection)
                            .await
                    })
                    .await,
                    Ok(Ok(1))
                )
            }
        }
    }

    pub async fn load(&self) -> Result<Database, String> {
        match self {
            Self::Memory => Ok(Database::default()),
            Self::Postgres(connection) => {
                let mut connection = connection.lock().await;
                let rows = sqlx::query("SELECT collection,record_id,document FROM kep_hosted.state_documents ORDER BY collection,record_id")
                    .fetch_all(&mut connection.connection).await.map_err(|e| format!("state load failed: {e}"))?;
                let mut state = restore_documents(rows)?;
                for row in sqlx::query(
                    "SELECT artifact_version_id, ciphertext_base64 FROM kep_hosted.file_payloads",
                )
                .fetch_all(&mut connection.connection)
                .await
                .map_err(|error| format!("file payload load failed: {error}"))?
                {
                    let id: String = row.get("artifact_version_id");
                    if state
                        .files
                        .get(&id)
                        .is_some_and(|file| file.expired_at.is_none())
                    {
                        state.file_payloads.insert(id, row.get("ciphertext_base64"));
                    }
                }
                Ok(state)
            }
        }
    }

    pub async fn save(
        &self,
        state: &Database,
        event_type: &str,
        entity_id: &str,
    ) -> Result<(), String> {
        match self {
            Self::Memory => Ok(()),
            Self::Postgres(connection) => {
                let mut connection = connection.lock().await;
                let metadata = state.metadata()?;
                let documents = metadata.documents();
                let fingerprints: BTreeMap<_, _> = documents
                    .iter()
                    .map(|(key, (_, digest))| (key.clone(), *digest))
                    .collect();
                let changed: Vec<_> = fingerprints
                    .iter()
                    .filter(|(key, hash)| connection.fingerprints.get(*key) != Some(*hash))
                    .map(|(key, _)| key.clone())
                    .collect();
                let removed: Vec<_> = connection
                    .fingerprints
                    .keys()
                    .filter(|key| !fingerprints.contains_key(*key))
                    .cloned()
                    .collect();
                let added: std::collections::BTreeSet<_> = changed
                    .iter()
                    .filter(|key| !connection.fingerprints.contains_key(*key))
                    .cloned()
                    .collect();
                let event_json = serde_json::json!({
                    "event_type": event_type,
                    "entity_id": entity_id,
                    "state_sha256": hex::encode(metadata.digest())
                });
                let mut transaction = connection
                    .connection
                    .begin()
                    .await
                    .map_err(|error| format!("PostgreSQL transaction failed: {error}"))?;
                let previous: Vec<u8> = sqlx::query("SELECT event_digest FROM kep_hosted.event_journal ORDER BY event_id DESC LIMIT 1 FOR UPDATE")
                    .fetch_optional(&mut *transaction)
                    .await
                    .map_err(|error| format!("journal lock failed: {error}"))?
                    .map(|row| row.get("event_digest"))
                    .unwrap_or_else(|| vec![0_u8; 32]);
                let mut hasher = Sha256::new();
                hasher.update(b"CA2-KEP-HOSTED-EVENT-v1");
                hasher.update(&previous);
                hasher.update(event_json.to_string().as_bytes());
                let event_digest: [u8; 32] = hasher.finalize().into();
                for (collection, id) in &changed {
                    sqlx::query("INSERT INTO kep_hosted.state_documents (collection,record_id,document) VALUES ($1,$2,$3) ON CONFLICT (collection,record_id) DO UPDATE SET document=EXCLUDED.document")
                        .bind(collection).bind(id).bind(serde_json::from_slice::<Value>(documents[&(collection.clone(), id.clone())].0).map_err(|e| e.to_string())?)
                        .execute(&mut *transaction).await.map_err(|e| format!("document persistence failed: {e}"))?;
                }
                for (collection, id) in &removed {
                    sqlx::query("DELETE FROM kep_hosted.state_documents WHERE collection=$1 AND record_id=$2")
                        .bind(collection).bind(id).execute(&mut *transaction).await.map_err(|e| format!("document removal failed: {e}"))?;
                    if collection == "files" {
                        sqlx::query(
                            "DELETE FROM kep_hosted.file_payloads WHERE artifact_version_id=$1",
                        )
                        .bind(id)
                        .execute(&mut *transaction)
                        .await
                        .map_err(|e| format!("file removal failed: {e}"))?;
                    }
                }
                sqlx::query("INSERT INTO kep_hosted.event_journal (event_type, entity_id, event_json, previous_event_digest, event_digest) VALUES ($1, $2, $3, $4, $5)")
                    .bind(event_type)
                    .bind(entity_id)
                    .bind(event_json)
                    .bind(previous)
                    .bind(event_digest.as_slice())
                    .execute(&mut *transaction)
                    .await
                    .map_err(|error| format!("journal append failed: {error}"))?;
                for (collection, id) in &changed {
                    if collection != "files" {
                        continue;
                    }
                    let file = &state.files[id];
                    if file.expired_at.is_some() {
                        sqlx::query(
                            "DELETE FROM kep_hosted.file_payloads WHERE artifact_version_id = $1",
                        )
                        .bind(id)
                        .execute(&mut *transaction)
                        .await
                        .map_err(|error| format!("file expiry failed: {error}"))?;
                    } else if added.contains(&(collection.clone(), id.clone())) {
                        let payload = state
                            .file_payloads
                            .get(id)
                            .ok_or("active file payload missing")?;
                        sqlx::query("INSERT INTO kep_hosted.file_payloads (artifact_version_id, ciphertext_base64) VALUES ($1,$2) ON CONFLICT (artifact_version_id) DO NOTHING")
                            .bind(id).bind(payload).execute(&mut *transaction).await
                            .map_err(|error| format!("file payload insert failed: {error}"))?;
                    }
                }
                for (collection, id) in &added {
                    if collection != "artifacts" {
                        continue;
                    }
                    let artifact = &state.artifacts[id];
                    if state.files.contains_key(&artifact.artifact_version_id) {
                        continue;
                    }
                    let ciphertext = STANDARD
                        .decode(&artifact.ciphertext_base64)
                        .map_err(|_| "persisted ciphertext is not base64".to_string())?;
                    let digest = hex::decode(&artifact.ciphertext_sha256)
                        .map_err(|_| "persisted ciphertext digest is not hex".to_string())?;
                    sqlx::query("INSERT INTO kep_hosted.encrypted_archive (object_digest, encrypted_bytes) VALUES ($1, $2) ON CONFLICT (object_digest) DO NOTHING")
                        .bind(digest)
                        .bind(ciphertext)
                        .execute(&mut *transaction)
                        .await
                        .map_err(|error| format!("encrypted archive insert failed: {error}"))?;
                }
                transaction
                    .commit()
                    .await
                    .map_err(|error| format!("PostgreSQL commit failed: {error}"))?;
                connection.fingerprints = fingerprints;
                Ok(())
            }
        }
    }

    pub async fn record_client_error(&self, event: &ClientErrorEventRequest) -> Result<(), String> {
        match self {
            Self::Memory => Ok(()),
            Self::Postgres(connection) => {
                let mut connection = connection.lock().await;
                let diagnostic_digest = hex::decode(&event.diagnostic_digest)
                    .map_err(|_| "client error diagnostic digest is not hex".to_string())?;
                let canonical = serde_json::json!({
                    "attempt_id": event.attempt_id,
                    "operation_kind": event.operation_kind,
                    "stage": event.stage,
                    "error_code": event.error_code,
                    "effect_status": event.effect_status,
                    "network": event.network,
                    "safe_message": event.safe_message,
                    "diagnostic_digest": event.diagnostic_digest,
                    "rpc_request_id": event.rpc_request_id,
                    "transaction_signature": event.transaction_signature,
                    "reporter": event.reporter,
                    "registry_version": event.registry_version,
                    "source_layer": event.source_layer,
                    "retry_disposition": event.retry_disposition,
                    "http_status": event.http_status,
                    "rpc_code": event.rpc_code,
                    "transaction_error": event.transaction_error,
                    "instruction_index": event.instruction_index,
                    "instruction_error": event.instruction_error,
                    "program_id": event.program_id,
                    "custom_program_code": event.custom_program_code,
                    "correlation_id": event.correlation_id,
                });
                let mut hasher = Sha256::new();
                hasher.update(b"CA2-KEP-HOSTED-CLIENT-ERROR-v1");
                hasher.update(canonical.to_string().as_bytes());
                let event_digest: [u8; 32] = hasher.finalize().into();
                sqlx::query("INSERT INTO kep_hosted.client_error_journal (attempt_id, operation_kind, stage, error_code, effect_status, network, safe_message, diagnostic_digest, rpc_request_id, transaction_signature, event_digest, reporter, registry_version, source_layer, retry_disposition, http_status, rpc_code, transaction_error, instruction_index, instruction_error, program_id, custom_program_code, correlation_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) ON CONFLICT (attempt_id) DO NOTHING")
                    .bind(&event.attempt_id)
                    .bind(&event.operation_kind)
                    .bind(&event.stage)
                    .bind(&event.error_code)
                    .bind(&event.effect_status)
                    .bind(&event.network)
                    .bind(&event.safe_message)
                    .bind(diagnostic_digest)
                    .bind(&event.rpc_request_id)
                    .bind(&event.transaction_signature)
                    .bind(event_digest.as_slice())
                    .bind(&event.reporter)
                    .bind(&event.registry_version)
                    .bind(&event.source_layer)
                    .bind(&event.retry_disposition)
                    .bind(event.http_status.map(i32::from))
                    .bind(event.rpc_code)
                    .bind(&event.transaction_error)
                    .bind(event.instruction_index.map(i32::from))
                    .bind(&event.instruction_error)
                    .bind(&event.program_id)
                    .bind(event.custom_program_code.map(i64::from))
                    .bind(&event.correlation_id)
                    .execute(&mut connection.connection)
                    .await
                    .map_err(|error| format!("client error journal append failed: {error}"))?;
                Ok(())
            }
        }
    }
}
