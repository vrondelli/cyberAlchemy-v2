use cyberalchemy_kep_adapters::{PostgresDialect, PostgresThreeLayerStorage, Sha256Identity};
use cyberalchemy_knowledge_exchange_protocol::encrypted_durable_devnet::{
    cryptography::ByteIdentityProvider,
    durable_storage::{persist_and_verify_material, retrieve_verified, DurableStoragePort},
    model::{OpaqueStorageLocator, StorageLayer},
};
use sqlx::{postgres::PgPoolOptions, Row};

#[tokio::test]
#[ignore = "requires disposable local PostgreSQL selected by KEP_POSTGRES_TEST_URL"]
async fn postgres_three_layer_conformance() {
    let database_url = std::env::var("KEP_POSTGRES_TEST_URL")
        .expect("KEP_POSTGRES_TEST_URL must select a disposable local database");
    let pool = PgPoolOptions::new()
        .max_connections(4)
        .connect(&database_url)
        .await
        .unwrap();
    let mut storage = PostgresThreeLayerStorage::from_pool(pool.clone(), PostgresDialect);
    storage.bootstrap().await.unwrap();
    assert_eq!("postgresql-v1", storage.dialect_id());

    let identity = Sha256Identity;
    let encrypted = b"ciphertext-only-fixture\x00\x01\x02";
    let (readiness, retrievals) =
        persist_and_verify_material(&mut storage, &identity, 1, encrypted)
            .await
            .unwrap();
    assert!(readiness.is_ready());
    assert_eq!(3, retrievals.len());
    for retrieval in &retrievals {
        assert_eq!(
            encrypted,
            storage
                .retrieve(&retrieval.locator)
                .await
                .unwrap()
                .as_slice()
        );
    }

    // Restart/reconnect preserves every opaque locator.
    drop(storage);
    let restarted_pool = PgPoolOptions::new()
        .max_connections(4)
        .connect(&database_url)
        .await
        .unwrap();
    let mut storage = PostgresThreeLayerStorage::from_pool(restarted_pool.clone(), PostgresDialect);
    for retrieval in &retrievals {
        assert_eq!(
            encrypted,
            storage
                .retrieve(&retrieval.locator)
                .await
                .unwrap()
                .as_slice()
        );
    }

    // Archive insertion is content-addressed and idempotent.
    let first_archive = storage
        .write(StorageLayer::ImmutableArchive, encrypted)
        .await
        .unwrap();
    let second_archive = storage
        .write(StorageLayer::ImmutableArchive, encrypted)
        .await
        .unwrap();
    assert_eq!(first_archive, second_archive);
    let archive_count: i64 = sqlx::query(
        "SELECT COUNT(*) FROM kep_archive.immutable_objects WHERE object_digest = decode($1, 'hex')",
    )
    .bind(&first_archive.token)
    .fetch_one(&restarted_pool)
    .await
    .unwrap()
    .get(0);
    assert_eq!(1, archive_count);

    // Database triggers reject update/delete in recovery and archive layers.
    assert!(
        sqlx::query("UPDATE kep_recovery.operation_journal SET encrypted_bytes = 'x'::bytea")
            .execute(&restarted_pool)
            .await
            .is_err()
    );
    assert!(sqlx::query("DELETE FROM kep_archive.immutable_objects")
        .execute(&restarted_pool)
        .await
        .is_err());

    // A missing locator and a malformed locator fail closed.
    let missing = OpaqueStorageLocator {
        layer: StorageLayer::Operational,
        token: "00".repeat(32),
    };
    assert!(storage.retrieve(&missing).await.is_err());
    let malformed = OpaqueStorageLocator {
        layer: StorageLayer::Operational,
        token: "not-hex".to_owned(),
    };
    assert!(storage.retrieve(&malformed).await.is_err());

    // Operational corruption is detectable against the immutable identity.
    let operational = readiness.locator(StorageLayer::Operational).unwrap();
    sqlx::query(
        "UPDATE kep_operational.material_registry SET encrypted_bytes = 'corrupt'::bytea WHERE object_digest = decode($1, 'hex')",
    )
    .bind(&operational.token)
    .execute(&restarted_pool)
    .await
    .unwrap();
    assert!(retrieve_verified(
        &storage,
        &identity,
        1,
        operational,
        &identity.identify(1, encrypted),
    )
    .await
    .is_err());

    // A provider failure after the operational write cannot produce readiness.
    sqlx::query("ALTER TABLE kep_recovery.operation_journal RENAME TO operation_journal_blocked")
        .execute(&restarted_pool)
        .await
        .unwrap();
    let partial = persist_and_verify_material(&mut storage, &identity, 1, b"partial-write").await;
    assert!(partial.is_err());
    sqlx::query("ALTER TABLE kep_recovery.operation_journal_blocked RENAME TO operation_journal")
        .execute(&restarted_pool)
        .await
        .unwrap();
}
