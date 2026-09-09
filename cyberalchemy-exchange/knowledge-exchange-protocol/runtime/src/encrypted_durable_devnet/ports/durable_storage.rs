use std::collections::{BTreeMap, BTreeSet};

use super::cryptography::ByteIdentityProvider;
use super::model::{
    OpaqueStorageLocator, QualifiedByteIdentity, StorageLayer, StorageReadiness,
    StorageWriteReceipt, VerifiedRetrieval,
};

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DurableStorageError {
    WriteFailed(StorageLayer),
    RetrievalFailed(StorageLayer),
    ByteIdentityMismatch(StorageLayer),
    IncompleteReadiness,
    LocatorLayerMismatch,
    ProviderUnavailable(StorageLayer),
    AppendOnlyViolation,
    ImmutableArchiveViolation,
    InvalidLocator,
}

#[allow(async_fn_in_trait)]
pub trait DurableStoragePort {
    async fn write(
        &mut self,
        layer: StorageLayer,
        bytes: &[u8],
    ) -> Result<OpaqueStorageLocator, DurableStorageError>;

    async fn retrieve(
        &self,
        locator: &OpaqueStorageLocator,
    ) -> Result<Vec<u8>, DurableStorageError>;
}

pub async fn persist_and_verify_material(
    storage: &mut impl DurableStoragePort,
    identity: &impl ByteIdentityProvider,
    schema_version: u16,
    bytes: &[u8],
) -> Result<(StorageReadiness, Vec<VerifiedRetrieval>), DurableStorageError> {
    let expected = identity.identify(schema_version, bytes);
    let mut receipts = BTreeMap::new();
    let mut verified_layers = BTreeSet::new();
    let mut retrievals = Vec::new();

    for layer in StorageLayer::REQUIRED {
        let locator = storage.write(layer, bytes).await?;
        if locator.layer != layer {
            return Err(DurableStorageError::LocatorLayerMismatch);
        }
        let receipt = StorageWriteReceipt {
            layer,
            locator: locator.clone(),
            byte_identity: expected.clone(),
        };
        let retrieved = storage.retrieve(&locator).await?;
        let observed = identity.identify(schema_version, &retrieved);
        if observed != expected {
            return Err(DurableStorageError::ByteIdentityMismatch(layer));
        }
        receipts.insert(layer, receipt);
        verified_layers.insert(layer);
        retrievals.push(VerifiedRetrieval {
            layer,
            locator,
            expected_identity: expected.clone(),
            observed_identity: observed,
        });
    }

    let readiness = StorageReadiness {
        byte_identity: expected,
        receipts,
        verified_layers,
    };
    if !readiness.is_ready() {
        return Err(DurableStorageError::IncompleteReadiness);
    }
    Ok((readiness, retrievals))
}

pub async fn retrieve_verified(
    storage: &impl DurableStoragePort,
    identity: &impl ByteIdentityProvider,
    schema_version: u16,
    locator: &OpaqueStorageLocator,
    expected: &QualifiedByteIdentity,
) -> Result<Vec<u8>, DurableStorageError> {
    let bytes = storage.retrieve(locator).await?;
    let observed = identity.identify(schema_version, &bytes);
    if &observed != expected {
        return Err(DurableStorageError::ByteIdentityMismatch(locator.layer));
    }
    Ok(bytes)
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveMaterialRetrieved {
    pub retrieval_observation_id: crate::Digest32,
    pub artifact_version_id: crate::Digest32,
    pub recipient_identity_id: crate::Digest32,
    pub byte_identity: QualifiedByteIdentity,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct DurableStoragePolicy {
    pub require_exact_byte_identity: bool,
    pub require_verified_retrieval: bool,
    pub require_three_layers: bool,
    pub provider_unbound: bool,
}

impl DurableStoragePolicy {
    pub const CLOSED_LOCAL: Self = Self {
        require_exact_byte_identity: true,
        require_verified_retrieval: true,
        require_three_layers: true,
        provider_unbound: true,
    };
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OperationalStorageRegistry {
    pub registry_entry_id: crate::Digest32,
    pub qualified_byte_identity: QualifiedByteIdentity,
    pub object_kind: String,
    pub opaque_locator: OpaqueStorageLocator,
    pub current_revision: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecoveryJournal {
    pub journal_event_id: crate::Digest32,
    pub operation_id: crate::Digest32,
    pub qualified_byte_identity: QualifiedByteIdentity,
    pub event_kind: String,
    pub previous_event_digest: crate::Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ImmutableArchive {
    pub archive_object_id: crate::Digest32,
    pub qualified_byte_identity: QualifiedByteIdentity,
    pub object_kind: String,
    pub retention_policy_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageRealization {
    pub storage_realization_id: crate::Digest32,
    pub adapter_id: String,
    pub binding_version: String,
    pub topology_id: String,
    pub environment_id: String,
    pub policy_id: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageCost {
    pub observation_id: crate::Digest32,
    pub currency_unit: String,
    pub amount_minor_units: u64,
    pub cost_class: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageReadinessEstablished {
    pub readiness_observation_id: crate::Digest32,
    pub readiness_digest: crate::Digest32,
    pub storage_realization_id: crate::Digest32,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum StoredMaterialKind {
    EncryptedArtifact,
    EnvelopeCiphertext,
    PublicCommitment,
    OpaqueLocatorMetadata,
    Plaintext,
    ContentKey,
    PrivateMaterial,
    Credential,
}

pub async fn retrieve_active_material(
    storage: &impl DurableStoragePort,
    identity: &impl ByteIdentityProvider,
    schema_version: u16,
    locator: &OpaqueStorageLocator,
    expected: &QualifiedByteIdentity,
) -> Result<Vec<u8>, DurableStorageError> {
    retrieve_verified(storage, identity, schema_version, locator, expected).await
}

pub fn enforce_locator_outside_object_identity(
    identity_before_locator_change: &QualifiedByteIdentity,
    identity_after_locator_change: &QualifiedByteIdentity,
) -> Result<(), DurableStorageError> {
    if identity_before_locator_change == identity_after_locator_change {
        Ok(())
    } else {
        Err(DurableStorageError::ByteIdentityMismatch(
            StorageLayer::Operational,
        ))
    }
}

pub fn enforce_storage_before_submission(
    readiness: &StorageReadiness,
) -> Result<(), DurableStorageError> {
    enforce_three_layer_readiness(readiness)
}

pub fn enforce_storage_confidentiality(
    kinds: impl IntoIterator<Item = StoredMaterialKind>,
) -> Result<(), DurableStorageError> {
    if kinds.into_iter().all(|kind| {
        matches!(
            kind,
            StoredMaterialKind::EncryptedArtifact
                | StoredMaterialKind::EnvelopeCiphertext
                | StoredMaterialKind::PublicCommitment
                | StoredMaterialKind::OpaqueLocatorMetadata
        )
    }) {
        Ok(())
    } else {
        Err(DurableStorageError::WriteFailed(StorageLayer::Operational))
    }
}

pub fn enforce_three_layer_readiness(
    readiness: &StorageReadiness,
) -> Result<(), DurableStorageError> {
    if readiness.is_ready() {
        Ok(())
    } else {
        Err(DurableStorageError::IncompleteReadiness)
    }
}

pub fn enforce_write_is_not_verified_retrieval(
    receipt: &StorageWriteReceipt,
    verified: Option<&VerifiedRetrieval>,
) -> Result<(), DurableStorageError> {
    match verified {
        Some(retrieval)
            if retrieval.layer == receipt.layer
                && retrieval.locator == receipt.locator
                && retrieval.expected_identity == receipt.byte_identity
                && retrieval.observed_identity == receipt.byte_identity =>
        {
            Ok(())
        }
        _ => Err(DurableStorageError::IncompleteReadiness),
    }
}
