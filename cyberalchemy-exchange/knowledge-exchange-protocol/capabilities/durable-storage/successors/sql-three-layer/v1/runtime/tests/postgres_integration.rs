use cyberalchemy_durable_storage_three_layer::adapters::{
    ImmutableFileArchive, PostgresOperationalStore, PostgresRecoveryJournal,
};
use cyberalchemy_durable_storage_three_layer::*;
use std::fs;

struct UnavailableJournal(FailureDomainId);

impl RecoveryJournalLayer for UnavailableJournal {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.0
    }

    fn append(
        &self,
        _kind: ObjectKind,
        _classification: MaterialClassification,
        _bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        Err(RecoveryFailure::Adapter(
            "injected PostgreSQL journal outage".into(),
        ))
    }

    fn find(&self, _expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        Err(RecoveryFailure::Adapter(
            "injected PostgreSQL journal outage".into(),
        ))
    }
}

#[test]
#[ignore = "requires the bounded docker-compose PostgreSQL environment"]
fn postgres_primary_and_journal_prove_verified_restore() {
    let primary_url = std::env::var("DST3_PRIMARY_URL").expect("DST3_PRIMARY_URL required");
    let journal_url = std::env::var("DST3_JOURNAL_URL").expect("DST3_JOURNAL_URL required");
    let archive_root =
        std::env::temp_dir().join(format!("cav2-dst3-postgres-proof-{}", std::process::id()));
    let _ = fs::remove_dir_all(&archive_root);

    let operational = PostgresOperationalStore::connect(
        &primary_url,
        FailureDomainId::new("docker-operational-postgres-volume").unwrap(),
    )
    .unwrap();
    let journal = PostgresRecoveryJournal::connect(
        &journal_url,
        FailureDomainId::new("docker-journal-postgres-volume").unwrap(),
    )
    .unwrap();
    let archive = ImmutableFileArchive::new(
        &archive_root,
        FailureDomainId::new("host-immutable-archive-path").unwrap(),
    )
    .unwrap();
    let coordinator = ThreeLayerCoordinator::new(operational, journal, archive).unwrap();

    let bytes = format!(
        "encrypted postgres integration object {}",
        std::process::id()
    );
    let protection = coordinator
        .protect(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            bytes.as_bytes(),
        )
        .unwrap();
    assert_eq!(3, protection.layers.len());

    let (operational, journal, archive) = coordinator.into_layers();
    operational.delete(&protection.identity).unwrap();
    let coordinator = ThreeLayerCoordinator::new(operational, journal, archive).unwrap();
    let recovery = coordinator.recover(&protection.identity).unwrap();
    assert_eq!(RecoverySource::RecoveryJournal, recovery.source);
    assert!(recovery.destination_verified);

    let (operational, _journal, archive) = coordinator.into_layers();
    operational.delete(&protection.identity).unwrap();
    let coordinator = ThreeLayerCoordinator::new(
        operational,
        UnavailableJournal(FailureDomainId::new("docker-journal-postgres-volume").unwrap()),
        archive,
    )
    .unwrap();
    let archive_recovery = coordinator.recover(&protection.identity).unwrap();
    assert_eq!(RecoverySource::ImmutableArchive, archive_recovery.source);
    assert!(archive_recovery.destination_verified);

    let _ = fs::remove_dir_all(&archive_root);
}
