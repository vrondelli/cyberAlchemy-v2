use crate::{
    object_kind, require_allowed, verify_bytes, FailureDomainId, Layer, LayerReceipt,
    MaterialClassification, ObjectKind, OperationalSqlLayer, QualifiedByteIdentity,
    RecoveryFailure, RecoveryJournalLayer,
};
use postgres::{Client, NoTls};
use std::sync::{Mutex, MutexGuard};

const MIGRATION: &str = include_str!("../../sql/postgresql/001_init.sql");

fn adapter(error: impl std::fmt::Display) -> RecoveryFailure {
    RecoveryFailure::Adapter(error.to_string())
}

fn lock(client: &Mutex<Client>) -> Result<MutexGuard<'_, Client>, RecoveryFailure> {
    client
        .lock()
        .map_err(|_| RecoveryFailure::Adapter("postgres client lock poisoned".into()))
}

fn identity_arguments(identity: &QualifiedByteIdentity) -> (i32, Vec<u8>) {
    (identity.algorithm_version.into(), identity.digest.to_vec())
}

pub struct PostgresOperationalStore {
    client: Mutex<Client>,
    failure_domain: FailureDomainId,
}

impl PostgresOperationalStore {
    pub fn connect(
        connection: &str,
        failure_domain: FailureDomainId,
    ) -> Result<Self, RecoveryFailure> {
        let mut client = Client::connect(connection, NoTls).map_err(adapter)?;
        client.batch_execute(MIGRATION).map_err(adapter)?;
        Ok(Self {
            client: Mutex::new(client),
            failure_domain,
        })
    }
}

impl OperationalSqlLayer for PostgresOperationalStore {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.failure_domain
    }

    fn put(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        require_allowed(classification)?;
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        let (version, digest) = identity_arguments(&identity);
        lock(&self.client)?
            .execute(
                "INSERT INTO durable_objects (domain, algorithm, algorithm_version, digest, object_bytes) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (domain, algorithm, algorithm_version, digest) DO NOTHING",
                &[&identity.domain, &identity.algorithm, &version, &digest, &bytes],
            )
            .map_err(adapter)?;
        let stored = self.get(&identity)?;
        verify_bytes(&identity, &stored, Layer::OperationalSql)?;
        Ok(LayerReceipt {
            layer: Layer::OperationalSql,
            failure_domain: self.failure_domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn get(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        object_kind(expected, Layer::OperationalSql)?;
        let (version, digest) = identity_arguments(expected);
        let row = lock(&self.client)?
            .query_opt(
                "SELECT object_bytes FROM durable_objects WHERE domain = $1 AND algorithm = $2 AND algorithm_version = $3 AND digest = $4",
                &[&expected.domain, &expected.algorithm, &version, &digest],
            )
            .map_err(adapter)?
            .ok_or(RecoveryFailure::Missing(Layer::OperationalSql))?;
        let bytes: Vec<u8> = row.get(0);
        verify_bytes(expected, &bytes, Layer::OperationalSql)?;
        Ok(bytes)
    }

    fn delete(&self, identity: &QualifiedByteIdentity) -> Result<(), RecoveryFailure> {
        let (version, digest) = identity_arguments(identity);
        lock(&self.client)?
            .execute(
                "DELETE FROM durable_objects WHERE domain = $1 AND algorithm = $2 AND algorithm_version = $3 AND digest = $4",
                &[&identity.domain, &identity.algorithm, &version, &digest],
            )
            .map_err(adapter)?;
        Ok(())
    }
}

pub struct PostgresRecoveryJournal {
    client: Mutex<Client>,
    failure_domain: FailureDomainId,
}

impl PostgresRecoveryJournal {
    pub fn connect(
        connection: &str,
        failure_domain: FailureDomainId,
    ) -> Result<Self, RecoveryFailure> {
        let mut client = Client::connect(connection, NoTls).map_err(adapter)?;
        client.batch_execute(MIGRATION).map_err(adapter)?;
        Ok(Self {
            client: Mutex::new(client),
            failure_domain,
        })
    }
}

impl RecoveryJournalLayer for PostgresRecoveryJournal {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.failure_domain
    }

    fn append(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        require_allowed(classification)?;
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        let (version, digest) = identity_arguments(&identity);
        lock(&self.client)?
            .execute(
                "INSERT INTO recovery_journal (domain, algorithm, algorithm_version, digest, object_bytes) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (domain, algorithm, algorithm_version, digest) DO NOTHING",
                &[&identity.domain, &identity.algorithm, &version, &digest, &bytes],
            )
            .map_err(adapter)?;
        let stored = self.find(&identity)?;
        verify_bytes(&identity, &stored, Layer::RecoveryJournal)?;
        Ok(LayerReceipt {
            layer: Layer::RecoveryJournal,
            failure_domain: self.failure_domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn find(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        object_kind(expected, Layer::RecoveryJournal)?;
        let (version, digest) = identity_arguments(expected);
        let row = lock(&self.client)?
            .query_opt(
                "SELECT object_bytes FROM recovery_journal WHERE domain = $1 AND algorithm = $2 AND algorithm_version = $3 AND digest = $4 ORDER BY journal_sequence DESC LIMIT 1",
                &[&expected.domain, &expected.algorithm, &version, &digest],
            )
            .map_err(adapter)?
            .ok_or(RecoveryFailure::Missing(Layer::RecoveryJournal))?;
        let bytes: Vec<u8> = row.get(0);
        verify_bytes(expected, &bytes, Layer::RecoveryJournal)?;
        Ok(bytes)
    }
}
