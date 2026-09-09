use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

use cyberalchemy_durable_storage::*;

static NEXT: AtomicU64 = AtomicU64::new(1);

struct TempRoot(PathBuf);

impl TempRoot {
    fn new() -> Self {
        let path = std::env::temp_dir().join(format!(
            "cav2-durable-storage-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
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

fn realization(environment: &str) -> RealizationIdentity {
    RealizationIdentity {
        adapter: "local-filesystem".into(),
        build: env!("CARGO_PKG_VERSION").into(),
        provider_kind: "local-filesystem-reference".into(),
        configuration_schema: "cav2-local-filesystem/v1".into(),
        endpoint_class: "local-path".into(),
        locality: "test-process".into(),
        environment: environment.into(),
    }
}

fn fixture() -> (TempRoot, LocalFilesystemStorage, StorageBinding) {
    let root = TempRoot::new();
    let identity = realization("unit-test");
    let store = LocalFilesystemStorage::new(root.0.clone(), identity.clone()).unwrap();
    let binding = StorageBinding {
        namespace: "knowledge-exchange".into(),
        policy_version: 1,
        realization: identity,
    };
    (root, store, binding)
}

#[test]
fn exact_byte_roundtrip_requires_verified_retrieval() {
    let (_root, store, binding) = fixture();
    let bytes = b"encrypted artifact bytes";
    let write = store
        .persist(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            bytes,
            &binding,
        )
        .unwrap();
    let verified = store
        .retrieve_and_verify(&write.identity, &write.locator, &binding)
        .unwrap();
    assert_eq!(bytes, verified.bytes.as_slice());
    assert_eq!(write.identity, verified.identity);
}

#[test]
fn write_receipt_is_not_verified_retrieval() {
    let (_root, store, binding) = fixture();
    let write = store
        .persist(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"ciphertext",
            &binding,
        )
        .unwrap();
    assert_eq!(10, write.size_bytes);
    let verified = store
        .retrieve_and_verify(&write.identity, &write.locator, &binding)
        .unwrap();
    assert_eq!(b"ciphertext", verified.bytes.as_slice());
}

#[test]
fn changed_bytes_are_rejected_with_no_verified_success() {
    let (root, store, binding) = fixture();
    let write = store
        .persist(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"ciphertext",
            &binding,
        )
        .unwrap();
    fs::write(root.0.join(write.locator.relative_path()), b"substitution").unwrap();
    assert_eq!(
        Err(StorageFailure::ByteIdentityMismatch),
        store.retrieve_and_verify(&write.identity, &write.locator, &binding)
    );
}

#[test]
fn missing_object_is_typed_failure() {
    let (_root, store, binding) = fixture();
    let expected = QualifiedByteIdentity::for_bytes(ObjectKind::ArtifactCiphertext, b"absent");
    let locator =
        StorageLocator::from_relative_path(PathBuf::from("knowledge-exchange/missing")).unwrap();
    assert_eq!(
        Err(StorageFailure::Missing),
        store.retrieve_and_verify(&expected, &locator, &binding)
    );
}

#[test]
fn secret_material_classes_are_rejected_before_write() {
    for class in [
        MaterialClassification::Plaintext,
        MaterialClassification::UnwrappedContentKey,
        MaterialClassification::PrivateKey,
        MaterialClassification::Credential,
    ] {
        let (root, store, binding) = fixture();
        assert_eq!(
            Err(StorageFailure::ConfidentialMaterialRejected),
            store.persist(ObjectKind::RecipientEnvelope, class, b"forbidden", &binding)
        );
        assert_eq!(0, fs::read_dir(&root.0).unwrap().count());
    }
}

#[test]
fn reissue_verifies_replacement_before_activation_and_retains_prior() {
    let (root, store, binding) = fixture();
    let mut registry = EnvelopeRegistry::default();
    let (first, first_write, _) = registry
        .reissue(&store, "B", b"encrypted-envelope-1", &binding)
        .unwrap();
    let (second, _, _) = registry
        .reissue(&store, "B", b"encrypted-envelope-2", &binding)
        .unwrap();
    assert_eq!(Some(first.active), second.prior);
    assert_eq!(Some(&second.active), registry.active_for("B"));
    assert!(root.0.join(first_write.locator.relative_path()).is_file());
}

#[test]
fn failed_reissue_preserves_active_identity() {
    let (_root, store, binding) = fixture();
    let mut registry = EnvelopeRegistry::default();
    let (first, _, _) = registry
        .reissue(&store, "B", b"encrypted-envelope-1", &binding)
        .unwrap();
    let mut wrong = binding.clone();
    wrong.realization.environment = "different".into();
    assert_eq!(
        Err(StorageFailure::RealizationMismatch),
        registry.reissue(&store, "B", b"encrypted-envelope-2", &wrong)
    );
    assert_eq!(Some(&first.active), registry.active_for("B"));
}

#[test]
fn realization_and_policy_are_exact() {
    let (_root, store, binding) = fixture();
    let mut wrong_realization = binding.clone();
    wrong_realization.realization.build = "other-build".into();
    assert_eq!(
        Err(StorageFailure::RealizationMismatch),
        store.persist(
            ObjectKind::AllowedMetadata,
            MaterialClassification::AllowedMetadata,
            b"metadata",
            &wrong_realization
        )
    );
    let mut wrong_policy = binding.clone();
    wrong_policy.policy_version = 0;
    assert_eq!(
        Err(StorageFailure::PolicyMismatch),
        store.persist(
            ObjectKind::AllowedMetadata,
            MaterialClassification::AllowedMetadata,
            b"metadata",
            &wrong_policy
        )
    );
}

#[test]
fn locator_is_not_object_identity() {
    let (root, store, binding) = fixture();
    let write = store
        .persist(
            ObjectKind::ArtifactCiphertext,
            MaterialClassification::EncryptedPayload,
            b"ciphertext",
            &binding,
        )
        .unwrap();
    let alternative =
        StorageLocator::from_relative_path(PathBuf::from("knowledge-exchange/alternate-copy"))
            .unwrap();
    fs::copy(
        root.0.join(write.locator.relative_path()),
        root.0.join(alternative.relative_path()),
    )
    .unwrap();
    let retrieved = store
        .retrieve_and_verify(&write.identity, &alternative, &binding)
        .unwrap();
    assert_eq!(write.identity, retrieved.identity);
    assert_ne!(write.locator, alternative);
}

#[test]
fn provider_realization_is_not_part_of_byte_identity() {
    let bytes = b"same exact encrypted bytes";
    let first = QualifiedByteIdentity::for_bytes(ObjectKind::ArtifactCiphertext, bytes);
    let second = QualifiedByteIdentity::for_bytes(ObjectKind::ArtifactCiphertext, bytes);
    assert_eq!(first, second);
    assert_ne!(realization("one"), realization("two"));
}

#[test]
fn infrastructure_cost_and_knowledge_consideration_are_distinct_types() {
    let cost = InfrastructureCost {
        amount_minor: 10,
        unit: "lamports".into(),
    };
    let consideration = KnowledgeConsideration {
        amount_minor: 10,
        unit: "lamports".into(),
    };
    assert_eq!(cost.amount_minor, consideration.amount_minor);
}

#[test]
fn runtime_binds_exact_admitted_system_ontology() {
    let ontology = include_str!("../../domainspec/generated/system-ontology.json");
    let admission = include_str!("../../decisions/system-ontology-admission-001.json");
    assert!(ontology.contains(ADMITTED_SYSTEM_ONTOLOGY_ID));
    assert!(admission.contains(ADMITTED_SYSTEM_ONTOLOGY_SHA256));
    assert!(admission.contains(ADMISSION_DECISION_ID));
}
