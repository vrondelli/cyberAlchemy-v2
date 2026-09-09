use cyberalchemy_durable_storage_three_layer::*;
use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

type Records = Arc<Mutex<BTreeMap<QualifiedByteIdentity, Vec<u8>>>>;

#[derive(Clone)]
struct MemoryOperational {
    domain: FailureDomainId,
    records: Records,
}

impl MemoryOperational {
    fn new(domain: &str) -> Self {
        Self {
            domain: FailureDomainId::new(domain).unwrap(),
            records: Arc::new(Mutex::new(BTreeMap::new())),
        }
    }

    fn clear(&self) {
        self.records.lock().unwrap().clear();
    }
}

impl OperationalSqlLayer for MemoryOperational {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.domain
    }

    fn put(
        &self,
        kind: ObjectKind,
        _classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        self.records
            .lock()
            .unwrap()
            .insert(identity.clone(), bytes.to_vec());
        Ok(LayerReceipt {
            layer: Layer::OperationalSql,
            failure_domain: self.domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn get(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        self.records
            .lock()
            .unwrap()
            .get(expected)
            .cloned()
            .ok_or(RecoveryFailure::Missing(Layer::OperationalSql))
    }

    fn delete(&self, identity: &QualifiedByteIdentity) -> Result<(), RecoveryFailure> {
        self.records.lock().unwrap().remove(identity);
        Ok(())
    }
}

#[derive(Clone)]
struct MemoryJournal {
    domain: FailureDomainId,
    records: Records,
    unavailable: Arc<AtomicBool>,
}

impl MemoryJournal {
    fn new(domain: &str) -> Self {
        Self {
            domain: FailureDomainId::new(domain).unwrap(),
            records: Arc::new(Mutex::new(BTreeMap::new())),
            unavailable: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl RecoveryJournalLayer for MemoryJournal {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.domain
    }

    fn append(
        &self,
        kind: ObjectKind,
        _classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        self.records
            .lock()
            .unwrap()
            .entry(identity.clone())
            .or_insert_with(|| bytes.to_vec());
        Ok(LayerReceipt {
            layer: Layer::RecoveryJournal,
            failure_domain: self.domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn find(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        if self.unavailable.load(Ordering::Relaxed) {
            return Err(RecoveryFailure::Adapter("injected journal outage".into()));
        }
        self.records
            .lock()
            .unwrap()
            .get(expected)
            .cloned()
            .ok_or(RecoveryFailure::Missing(Layer::RecoveryJournal))
    }
}

#[derive(Clone)]
struct MemoryArchive {
    domain: FailureDomainId,
    records: Records,
}

impl MemoryArchive {
    fn new(domain: &str) -> Self {
        Self {
            domain: FailureDomainId::new(domain).unwrap(),
            records: Arc::new(Mutex::new(BTreeMap::new())),
        }
    }
}

impl ImmutableArchiveLayer for MemoryArchive {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.domain
    }

    fn archive(
        &self,
        kind: ObjectKind,
        _classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        self.records
            .lock()
            .unwrap()
            .entry(identity.clone())
            .or_insert_with(|| bytes.to_vec());
        Ok(LayerReceipt {
            layer: Layer::ImmutableArchive,
            failure_domain: self.domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn load(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        self.records
            .lock()
            .unwrap()
            .get(expected)
            .cloned()
            .ok_or(RecoveryFailure::Missing(Layer::ImmutableArchive))
    }
}

fn fixture() -> (
    ThreeLayerCoordinator<MemoryOperational, MemoryJournal, MemoryArchive>,
    MemoryOperational,
    MemoryJournal,
) {
    let operational = MemoryOperational::new("primary-sql-host");
    let journal = MemoryJournal::new("journal-sql-host");
    let coordinator = ThreeLayerCoordinator::new(
        operational.clone(),
        journal.clone(),
        MemoryArchive::new("offline-archive"),
    )
    .unwrap();
    (coordinator, operational, journal)
}

#[test]
fn protection_requires_exactly_three_verified_layers() {
    let (coordinator, _, _) = fixture();
    let receipt = coordinator
        .protect(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"encrypted knowledge bytes",
        )
        .unwrap();
    assert_eq!(3, receipt.layers.len());
    assert_eq!(Layer::OperationalSql, receipt.layers[0].layer);
    assert_eq!(Layer::RecoveryJournal, receipt.layers[1].layer);
    assert_eq!(Layer::ImmutableArchive, receipt.layers[2].layer);
    assert!(receipt
        .layers
        .iter()
        .all(|layer| layer.identity == receipt.identity));
}

#[test]
fn shared_failure_domain_is_rejected_before_work() {
    let result = ThreeLayerCoordinator::new(
        MemoryOperational::new("same"),
        MemoryJournal::new("same"),
        MemoryArchive::new("archive"),
    );
    assert!(matches!(result, Err(RecoveryFailure::SharedFailureDomain)));
}

#[test]
fn journal_restores_and_verifies_missing_operational_object() {
    let (coordinator, operational, _) = fixture();
    let receipt = coordinator
        .protect(
            ObjectKind::RecipientEnvelope,
            MaterialClassification::EncryptedPayload,
            b"encrypted recipient envelope",
        )
        .unwrap();
    operational.clear();
    let evidence = coordinator.recover(&receipt.identity).unwrap();
    assert_eq!(RecoverySource::RecoveryJournal, evidence.source);
    assert!(evidence.destination_verified);
    assert_eq!(
        vec![
            RecoverySource::OperationalSql,
            RecoverySource::RecoveryJournal
        ],
        evidence.attempted_sources
    );
    assert_eq!(
        b"encrypted recipient envelope",
        operational.get(&receipt.identity).unwrap().as_slice()
    );
}

#[test]
fn archive_restores_when_journal_cannot_supply_candidate() {
    let (coordinator, operational, journal) = fixture();
    let receipt = coordinator
        .protect(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"encrypted archive fallback",
        )
        .unwrap();
    operational.clear();
    journal.unavailable.store(true, Ordering::Relaxed);
    let evidence = coordinator.recover(&receipt.identity).unwrap();
    assert_eq!(RecoverySource::ImmutableArchive, evidence.source);
    assert_eq!(3, evidence.attempted_sources.len());
    assert!(evidence.destination_verified);
}

#[test]
fn secret_material_is_rejected_before_any_layer_write() {
    let (coordinator, operational, _) = fixture();
    assert_eq!(
        Err(RecoveryFailure::ConfidentialMaterialRejected),
        coordinator.protect(
            ObjectKind::RecipientEnvelope,
            MaterialClassification::UnwrappedContentKey,
            b"forbidden key",
        )
    );
    assert!(operational.records.lock().unwrap().is_empty());
}

static TEMP_SEQUENCE: AtomicU64 = AtomicU64::new(1);

struct TempRoot(PathBuf);

impl TempRoot {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "cav2-dst3-{}-{}",
            std::process::id(),
            TEMP_SEQUENCE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::create_dir(&path).unwrap();
        Self(path)
    }
}

impl Drop for TempRoot {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

#[test]
fn file_archive_refuses_mutated_existing_identity_path() {
    let root = TempRoot::new();
    let archive = adapters::ImmutableFileArchive::new(
        root.0.clone(),
        FailureDomainId::new("archive-domain").unwrap(),
    )
    .unwrap();
    let first = archive
        .archive(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"immutable bytes",
        )
        .unwrap();
    let path = root
        .0
        .join(&first.identity.domain)
        .join(first.identity.algorithm_version.to_string())
        .join(first.identity.hex_digest());
    fs::write(path, b"mutated").unwrap();
    assert_eq!(
        Err(RecoveryFailure::ImmutableConflict),
        archive.archive(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"immutable bytes",
        )
    );
}

#[test]
fn runtime_binds_the_exact_admitted_system_ontology() {
    let ontology = include_str!("../../domainspec/generated/system-ontology.json");
    let admission = include_str!("../../decisions/system-ontology-admission-001.json");
    assert!(ontology.contains(ADMITTED_SYSTEM_ONTOLOGY_ID));
    assert!(admission.contains(ADMITTED_SYSTEM_ONTOLOGY_SHA256));
    assert!(admission.contains(ADMISSION_DECISION_ID));
}

#[test]
fn portable_core_contains_no_postgresql_dependency() {
    let core = include_str!("../src/core.rs").to_ascii_lowercase();
    assert!(!core.contains("postgres"));
    assert!(!core.contains("sqlstate"));
    assert!(!core.contains("$1"));
}
