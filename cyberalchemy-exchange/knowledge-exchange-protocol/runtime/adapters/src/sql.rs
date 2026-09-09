use cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::{
    durable_storage::{DurableStorageError, DurableStoragePort},
    model::{OpaqueStorageLocator, StorageLayer},
};
use sha2::{Digest, Sha256};
use sqlx::{postgres::PgPoolOptions, PgPool, Row};

/// Stable query/DDL boundary which another SQL engine must implement and pass
/// through the same storage conformance tests. SQL syntax is not assumed to be
/// interchangeable across engines.
pub trait SqlDialect: Send + Sync + 'static {
    fn id(&self) -> &'static str;
    fn bootstrap_statements(&self) -> &'static [&'static str];
    fn operational_upsert(&self) -> &'static str;
    fn operational_read(&self) -> &'static str;
    fn recovery_last_digest(&self) -> &'static str;
    fn recovery_lock(&self) -> &'static str;
    fn recovery_append(&self) -> &'static str;
    fn recovery_read(&self) -> &'static str;
    fn archive_insert(&self) -> &'static str;
    fn archive_read(&self) -> &'static str;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct PostgresDialect;

impl SqlDialect for PostgresDialect {
    fn id(&self) -> &'static str {
        "postgresql-v1"
    }

    fn bootstrap_statements(&self) -> &'static [&'static str] {
        &[
            "CREATE SCHEMA IF NOT EXISTS kep_operational",
            "CREATE SCHEMA IF NOT EXISTS kep_recovery",
            "CREATE SCHEMA IF NOT EXISTS kep_archive",
            "CREATE TABLE IF NOT EXISTS kep_operational.material_registry (object_digest BYTEA PRIMARY KEY, encrypted_bytes BYTEA NOT NULL, revision BIGINT NOT NULL CHECK (revision > 0), updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp())",
            "CREATE TABLE IF NOT EXISTS kep_recovery.operation_journal (event_id BIGSERIAL PRIMARY KEY, object_digest BYTEA NOT NULL, previous_event_digest BYTEA NOT NULL, event_digest BYTEA UNIQUE NOT NULL, encrypted_bytes BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp())",
            "CREATE TABLE IF NOT EXISTS kep_archive.immutable_objects (object_digest BYTEA PRIMARY KEY, encrypted_bytes BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp())",
            "CREATE OR REPLACE FUNCTION kep_recovery.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'kep recovery journal is append-only'; END $$",
            "DROP TRIGGER IF EXISTS kep_recovery_no_update ON kep_recovery.operation_journal",
            "CREATE TRIGGER kep_recovery_no_update BEFORE UPDATE OR DELETE ON kep_recovery.operation_journal FOR EACH ROW EXECUTE FUNCTION kep_recovery.reject_mutation()",
            "CREATE OR REPLACE FUNCTION kep_archive.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'kep archive is immutable'; END $$",
            "DROP TRIGGER IF EXISTS kep_archive_no_update ON kep_archive.immutable_objects",
            "CREATE TRIGGER kep_archive_no_update BEFORE UPDATE OR DELETE ON kep_archive.immutable_objects FOR EACH ROW EXECUTE FUNCTION kep_archive.reject_mutation()",
        ]
    }

    fn operational_upsert(&self) -> &'static str {
        "INSERT INTO kep_operational.material_registry (object_digest, encrypted_bytes, revision) VALUES ($1, $2, 1) ON CONFLICT (object_digest) DO UPDATE SET encrypted_bytes = EXCLUDED.encrypted_bytes, revision = kep_operational.material_registry.revision + 1, updated_at = clock_timestamp()"
    }

    fn operational_read(&self) -> &'static str {
        "SELECT encrypted_bytes FROM kep_operational.material_registry WHERE object_digest = $1"
    }

    fn recovery_last_digest(&self) -> &'static str {
        "SELECT event_digest FROM kep_recovery.operation_journal ORDER BY event_id DESC LIMIT 1 FOR UPDATE"
    }

    fn recovery_lock(&self) -> &'static str {
        "SELECT pg_advisory_xact_lock(4848872111554772044)"
    }

    fn recovery_append(&self) -> &'static str {
        "INSERT INTO kep_recovery.operation_journal (object_digest, previous_event_digest, event_digest, encrypted_bytes) VALUES ($1, $2, $3, $4) ON CONFLICT (event_digest) DO NOTHING"
    }

    fn recovery_read(&self) -> &'static str {
        "SELECT encrypted_bytes FROM kep_recovery.operation_journal WHERE event_digest = $1"
    }

    fn archive_insert(&self) -> &'static str {
        "INSERT INTO kep_archive.immutable_objects (object_digest, encrypted_bytes) VALUES ($1, $2) ON CONFLICT (object_digest) DO NOTHING"
    }

    fn archive_read(&self) -> &'static str {
        "SELECT encrypted_bytes FROM kep_archive.immutable_objects WHERE object_digest = $1"
    }
}

pub struct PostgresThreeLayerStorage<D = PostgresDialect> {
    pool: PgPool,
    dialect: D,
}

impl PostgresThreeLayerStorage<PostgresDialect> {
    pub async fn connect(database_url: &str, max_connections: u32) -> Result<Self, sqlx::Error> {
        let pool = PgPoolOptions::new()
            .max_connections(max_connections)
            .connect(database_url)
            .await?;
        let storage = Self {
            pool,
            dialect: PostgresDialect,
        };
        storage.bootstrap().await?;
        Ok(storage)
    }
}

impl<D: SqlDialect> PostgresThreeLayerStorage<D> {
    pub fn from_pool(pool: PgPool, dialect: D) -> Self {
        Self { pool, dialect }
    }

    pub fn dialect_id(&self) -> &'static str {
        self.dialect.id()
    }

    pub async fn bootstrap(&self) -> Result<(), sqlx::Error> {
        let mut transaction = self.pool.begin().await?;
        for statement in self.dialect.bootstrap_statements() {
            sqlx::query(*statement).execute(&mut *transaction).await?;
        }
        transaction.commit().await
    }

    fn object_digest(bytes: &[u8]) -> [u8; 32] {
        Sha256::digest(bytes).into()
    }

    fn locator(layer: StorageLayer, digest: &[u8]) -> OpaqueStorageLocator {
        OpaqueStorageLocator {
            layer,
            token: hex::encode(digest),
        }
    }

    fn locator_digest(locator: &OpaqueStorageLocator) -> Result<Vec<u8>, DurableStorageError> {
        let decoded =
            hex::decode(&locator.token).map_err(|_| DurableStorageError::InvalidLocator)?;
        if decoded.len() != 32 {
            Err(DurableStorageError::InvalidLocator)
        } else {
            Ok(decoded)
        }
    }

    async fn write_operational(
        &self,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError> {
        let digest = Self::object_digest(bytes);
        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(|_| DurableStorageError::ProviderUnavailable(StorageLayer::Operational))?;
        sqlx::query(self.dialect.operational_upsert())
            .bind(digest.as_slice())
            .bind(bytes)
            .execute(&mut *transaction)
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::Operational))?;
        transaction
            .commit()
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::Operational))?;
        Ok(Self::locator(StorageLayer::Operational, &digest))
    }

    async fn append_recovery(
        &self,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError> {
        let object_digest = Self::object_digest(bytes);
        let mut transaction =
            self.pool.begin().await.map_err(|_| {
                DurableStorageError::ProviderUnavailable(StorageLayer::RecoveryJournal)
            })?;
        sqlx::query(self.dialect.recovery_lock())
            .execute(&mut *transaction)
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::RecoveryJournal))?;
        let previous = sqlx::query(self.dialect.recovery_last_digest())
            .fetch_optional(&mut *transaction)
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::RecoveryJournal))?
            .map(|row| row.get::<Vec<u8>, _>(0))
            .unwrap_or_else(|| vec![0_u8; 32]);
        let mut hasher = Sha256::new();
        hasher.update(b"CA2-KEP-RECOVERY-EVENT-v1");
        hasher.update(&previous);
        hasher.update(object_digest);
        hasher.update(bytes);
        let event_digest: [u8; 32] = hasher.finalize().into();
        sqlx::query(self.dialect.recovery_append())
            .bind(object_digest.as_slice())
            .bind(previous)
            .bind(event_digest.as_slice())
            .bind(bytes)
            .execute(&mut *transaction)
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::RecoveryJournal))?;
        transaction
            .commit()
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::RecoveryJournal))?;
        Ok(Self::locator(StorageLayer::RecoveryJournal, &event_digest))
    }

    async fn insert_archive(
        &self,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError> {
        let digest = Self::object_digest(bytes);
        let mut transaction = self.pool.begin().await.map_err(|_| {
            DurableStorageError::ProviderUnavailable(StorageLayer::ImmutableArchive)
        })?;
        sqlx::query(self.dialect.archive_insert())
            .bind(digest.as_slice())
            .bind(bytes)
            .execute(&mut *transaction)
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::ImmutableArchive))?;
        transaction
            .commit()
            .await
            .map_err(|_| DurableStorageError::WriteFailed(StorageLayer::ImmutableArchive))?;
        Ok(Self::locator(StorageLayer::ImmutableArchive, &digest))
    }

    async fn read_query(
        &self,
        layer: StorageLayer,
        query: &'static str,
        digest: Vec<u8>,
    ) -> Result<Vec<u8>, DurableStorageError> {
        sqlx::query(query)
            .bind(digest)
            .fetch_optional(&self.pool)
            .await
            .map_err(|_| DurableStorageError::RetrievalFailed(layer))?
            .map(|row| row.get::<Vec<u8>, _>(0))
            .ok_or(DurableStorageError::RetrievalFailed(layer))
    }
}

impl<D: SqlDialect> DurableStoragePort for PostgresThreeLayerStorage<D> {
    async fn write(
        &mut self,
        layer: StorageLayer,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError> {
        match layer {
            StorageLayer::Operational => self.write_operational(bytes).await,
            StorageLayer::RecoveryJournal => self.append_recovery(bytes).await,
            StorageLayer::ImmutableArchive => self.insert_archive(bytes).await,
        }
    }

    async fn retrieve(
        &self,
        locator: &OpaqueStorageLocator,
    ) -> Result<Vec<u8>, DurableStorageError> {
        let digest = Self::locator_digest(locator)?;
        match locator.layer {
            StorageLayer::Operational => {
                self.read_query(locator.layer, self.dialect.operational_read(), digest)
                    .await
            }
            StorageLayer::RecoveryJournal => {
                self.read_query(locator.layer, self.dialect.recovery_read(), digest)
                    .await
            }
            StorageLayer::ImmutableArchive => {
                self.read_query(locator.layer, self.dialect.archive_read(), digest)
                    .await
            }
        }
    }
}
