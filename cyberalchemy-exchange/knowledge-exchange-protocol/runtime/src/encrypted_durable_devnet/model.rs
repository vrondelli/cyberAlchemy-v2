use std::collections::{BTreeMap, BTreeSet};

use crate::Digest32;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QualifiedByteIdentity {
    pub schema_version: u16,
    pub digest: Digest32,
    pub length: u64,
}

impl QualifiedByteIdentity {
    pub fn matches(&self, digest: Digest32, bytes: &[u8]) -> bool {
        self.schema_version > 0 && self.digest == digest && self.length == bytes.len() as u64
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CryptographicProfile {
    pub profile_id: Digest32,
    pub content_suite: String,
    pub envelope_suite: String,
    pub serialization: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CryptographicContext {
    pub artifact_version_id: Digest32,
    pub policy_id: Digest32,
    pub encryption_epoch: u64,
    pub plaintext_commitment: Digest32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientBinding {
    pub recipient_id: Digest32,
    pub key_binding_id: Digest32,
    pub key_binding_version: u64,
    pub key_fingerprint: Digest32,
}

/// Opaque reference to private key material held outside protocol state.
///
/// Handles may be logged only as opaque identifiers. They never contain a
/// private key, content key, wallet secret, or credential.
#[derive(Clone, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct SecretHandle(pub String);

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientKeyReference {
    pub recipient: RecipientBinding,
    pub public_key: [u8; 32],
    pub private_key_handle: SecretHandle,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OpaqueRecipientEnvelope {
    pub recipient: RecipientBinding,
    pub envelope_bytes: Vec<u8>,
    pub envelope_identity: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreparedMaterial {
    pub context: CryptographicContext,
    pub profile_id: Digest32,
    pub ciphertext: Vec<u8>,
    pub ciphertext_identity: QualifiedByteIdentity,
    pub envelopes: Vec<OpaqueRecipientEnvelope>,
}

#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum StorageLayer {
    Operational,
    RecoveryJournal,
    ImmutableArchive,
}

impl StorageLayer {
    pub const REQUIRED: [Self; 3] = [
        Self::Operational,
        Self::RecoveryJournal,
        Self::ImmutableArchive,
    ];
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OpaqueStorageLocator {
    pub layer: StorageLayer,
    pub token: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageWriteReceipt {
    pub layer: StorageLayer,
    pub locator: OpaqueStorageLocator,
    pub byte_identity: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerifiedRetrieval {
    pub layer: StorageLayer,
    pub locator: OpaqueStorageLocator,
    pub expected_identity: QualifiedByteIdentity,
    pub observed_identity: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageReadiness {
    pub byte_identity: QualifiedByteIdentity,
    pub receipts: BTreeMap<StorageLayer, StorageWriteReceipt>,
    pub verified_layers: BTreeSet<StorageLayer>,
}

impl StorageReadiness {
    pub fn is_ready(&self) -> bool {
        StorageLayer::REQUIRED.iter().all(|layer| {
            self.receipts
                .get(layer)
                .is_some_and(|receipt| receipt.byte_identity == self.byte_identity)
                && self.verified_layers.contains(layer)
        })
    }

    pub fn locator(&self, layer: StorageLayer) -> Option<&OpaqueStorageLocator> {
        self.receipts.get(&layer).map(|receipt| &receipt.locator)
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PreparedDelivery {
    pub material: PreparedMaterial,
    pub storage_readiness: StorageReadiness,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SubmissionIntent {
    pub trial_id: Digest32,
    pub program_id: Digest32,
    pub artifact_version_id: Digest32,
    pub expected_state_revision: u64,
    pub ciphertext_identity: QualifiedByteIdentity,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActivatedDelivery {
    pub artifact_version_id: Digest32,
    pub state_revision: u64,
    pub active_identity: QualifiedByteIdentity,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DeliveryState {
    Absent,
    Prepared,
    Active,
    ReconciliationRequired,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DeliveryTransition {
    PrepareMaterial,
    ActivateMaterial,
    RequireReconciliation,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ModelRuleError {
    InvalidDeliveryTransition,
    RecipientIsNotCurrentOwner,
    RequestDoesNotMatchCurrentState,
    RequestActivatesMaterial,
    ByteIdentityMismatch,
    ProviderEnteredImmutableIdentity,
    KnowledgeConsiderationPresent,
}

impl DeliveryState {
    pub fn transition(self, transition: DeliveryTransition) -> Result<Self, ModelRuleError> {
        match (self, transition) {
            (Self::Absent, DeliveryTransition::PrepareMaterial) => Ok(Self::Prepared),
            (Self::Prepared, DeliveryTransition::ActivateMaterial) => Ok(Self::Active),
            (Self::Prepared | Self::Active, DeliveryTransition::RequireReconciliation) => {
                Ok(Self::ReconciliationRequired)
            }
            _ => Err(ModelRuleError::InvalidDeliveryTransition),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipientEnvelopeSuite {
    pub suite_id: String,
    pub kem_id: String,
    pub kdf_id: String,
    pub aead_id: String,
    pub info_domain: String,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct NoPricePolicy;

impl NoPricePolicy {
    pub fn validate_knowledge_consideration(
        &self,
        knowledge_consideration_minor_units: u64,
    ) -> Result<(), ModelRuleError> {
        if knowledge_consideration_minor_units == 0 {
            Ok(())
        } else {
            Err(ModelRuleError::KnowledgeConsiderationPresent)
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReconciliationRequired {
    pub observation_id: Digest32,
    pub artifact_version_id: Digest32,
    pub reason_code: String,
}

pub fn enforce_b_request_only(
    recipient_is_current_owner: bool,
    request_matches_current_state: bool,
    request_activates_material: bool,
) -> Result<(), ModelRuleError> {
    if !recipient_is_current_owner {
        return Err(ModelRuleError::RecipientIsNotCurrentOwner);
    }
    if !request_matches_current_state {
        return Err(ModelRuleError::RequestDoesNotMatchCurrentState);
    }
    if request_activates_material {
        return Err(ModelRuleError::RequestActivatesMaterial);
    }
    Ok(())
}

pub fn enforce_exact_byte_identity(
    expected: &QualifiedByteIdentity,
    observed: impl IntoIterator<Item = QualifiedByteIdentity>,
) -> Result<(), ModelRuleError> {
    if observed.into_iter().all(|identity| identity == *expected) {
        Ok(())
    } else {
        Err(ModelRuleError::ByteIdentityMismatch)
    }
}

pub fn enforce_provider_unbound(
    provider_fields_enter_immutable_identity: bool,
) -> Result<(), ModelRuleError> {
    if provider_fields_enter_immutable_identity {
        Err(ModelRuleError::ProviderEnteredImmutableIdentity)
    } else {
        Ok(())
    }
}
