//! Provider-neutral Durable Storage port plus a bounded local-filesystem reference realization.
//!
//! D65 predecessor: `CA2-SYSTEM-ONTOLOGY-KEP-DURABLE-STORAGE`, exact digest
//! `ad110c9c00deabd3b97141b8d28c3204d9610603a4b617fc47a93dfa46df48d5`.
//! This crate does not select a production provider, establish availability outside an
//! observation, handle plaintext or keys, publish, deploy, or perform network effects.

use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fmt;
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Component, Path, PathBuf};

pub const ADMITTED_SYSTEM_ONTOLOGY_ID: &str = "CA2-SYSTEM-ONTOLOGY-KEP-DURABLE-STORAGE";
pub const ADMITTED_SYSTEM_ONTOLOGY_SHA256: &str =
    "ad110c9c00deabd3b97141b8d28c3204d9610603a4b617fc47a93dfa46df48d5";
pub const ADMISSION_DECISION_ID: &str =
    "CA2-DECISION-KEP-DURABLE-STORAGE-SYSTEM-ONTOLOGY-ADMISSION-001";

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ObjectKind {
    ArtifactCiphertext,
    RecipientEnvelope,
    AllowedMetadata,
}

impl ObjectKind {
    fn domain(self) -> &'static str {
        match self {
            Self::ArtifactCiphertext => "kep-artifact-ciphertext",
            Self::RecipientEnvelope => "kep-recipient-envelope",
            Self::AllowedMetadata => "kep-allowed-metadata",
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MaterialClassification {
    EncryptedPayload,
    AllowedMetadata,
    Plaintext,
    UnwrappedContentKey,
    PrivateKey,
    Credential,
}

impl MaterialClassification {
    fn allowed(self) -> bool {
        matches!(self, Self::EncryptedPayload | Self::AllowedMetadata)
    }
}

#[derive(Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub struct QualifiedByteIdentity {
    pub domain: String,
    pub algorithm: &'static str,
    pub algorithm_version: u16,
    pub digest: [u8; 32],
}

impl QualifiedByteIdentity {
    pub fn for_bytes(kind: ObjectKind, bytes: &[u8]) -> Self {
        let domain = kind.domain();
        let mut hasher = Sha256::new();
        hasher.update(b"CyberAlchemy-v2:DurableStorage:v1\0");
        hasher.update(domain.as_bytes());
        hasher.update(b"\0");
        hasher.update(bytes);
        Self {
            domain: domain.to_owned(),
            algorithm: "sha256",
            algorithm_version: 1,
            digest: hasher.finalize().into(),
        }
    }

    pub fn hex_digest(&self) -> String {
        self.digest
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RealizationIdentity {
    pub adapter: String,
    pub build: String,
    pub provider_kind: String,
    pub configuration_schema: String,
    pub endpoint_class: String,
    pub locality: String,
    pub environment: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageBinding {
    pub namespace: String,
    pub policy_version: u64,
    pub realization: RealizationIdentity,
}

impl StorageBinding {
    fn validate(&self) -> Result<(), StorageFailure> {
        if self.policy_version == 0 {
            return Err(StorageFailure::PolicyMismatch);
        }
        if self.namespace.is_empty()
            || !self
                .namespace
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
        {
            return Err(StorageFailure::InvalidNamespace);
        }
        Ok(())
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StorageLocator {
    relative_path: PathBuf,
}

impl StorageLocator {
    pub fn relative_path(&self) -> &Path {
        &self.relative_path
    }

    pub fn from_relative_path(path: PathBuf) -> Result<Self, StorageFailure> {
        if path.as_os_str().is_empty()
            || path
                .components()
                .any(|part| !matches!(part, Component::Normal(_)))
        {
            return Err(StorageFailure::InvalidLocator);
        }
        Ok(Self {
            relative_path: path,
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WriteReceipt {
    pub identity: QualifiedByteIdentity,
    pub binding: StorageBinding,
    pub locator: StorageLocator,
    pub size_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerifiedRetrieval {
    pub identity: QualifiedByteIdentity,
    pub binding: StorageBinding,
    pub locator: StorageLocator,
    pub bytes: Vec<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageFailure {
    ConfidentialMaterialRejected,
    InvalidNamespace,
    InvalidLocator,
    PolicyMismatch,
    RealizationMismatch,
    Missing,
    ByteIdentityMismatch,
    Io(String),
}

impl fmt::Display for StorageFailure {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl std::error::Error for StorageFailure {}

impl From<std::io::Error> for StorageFailure {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value.kind().to_string())
    }
}

pub trait DurableStoragePort {
    fn persist(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
        binding: &StorageBinding,
    ) -> Result<WriteReceipt, StorageFailure>;

    fn retrieve_and_verify(
        &self,
        expected: &QualifiedByteIdentity,
        locator: &StorageLocator,
        binding: &StorageBinding,
    ) -> Result<VerifiedRetrieval, StorageFailure>;
}

#[derive(Debug)]
pub struct LocalFilesystemStorage {
    root: PathBuf,
    realization: RealizationIdentity,
}

impl LocalFilesystemStorage {
    pub fn new(root: PathBuf, realization: RealizationIdentity) -> Result<Self, StorageFailure> {
        fs::create_dir_all(&root)?;
        Ok(Self { root, realization })
    }

    fn require_binding(&self, binding: &StorageBinding) -> Result<(), StorageFailure> {
        binding.validate()?;
        if binding.realization != self.realization {
            return Err(StorageFailure::RealizationMismatch);
        }
        Ok(())
    }

    fn full_path(&self, locator: &StorageLocator) -> Result<PathBuf, StorageFailure> {
        if locator
            .relative_path
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
        {
            return Err(StorageFailure::InvalidLocator);
        }
        Ok(self.root.join(&locator.relative_path))
    }
}

impl DurableStoragePort for LocalFilesystemStorage {
    fn persist(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
        binding: &StorageBinding,
    ) -> Result<WriteReceipt, StorageFailure> {
        self.require_binding(binding)?;
        if !classification.allowed() {
            return Err(StorageFailure::ConfidentialMaterialRejected);
        }
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        let relative_path = PathBuf::from(&binding.namespace)
            .join(&identity.domain)
            .join(identity.algorithm_version.to_string())
            .join(identity.hex_digest());
        let locator = StorageLocator::from_relative_path(relative_path)?;
        let target = self.full_path(&locator)?;
        let parent = target.parent().ok_or(StorageFailure::InvalidLocator)?;
        fs::create_dir_all(parent)?;
        if target.exists() {
            let existing = fs::read(&target)?;
            if existing != bytes {
                return Err(StorageFailure::ByteIdentityMismatch);
            }
        } else {
            let temporary = parent.join(format!(
                ".pending-{}-{}",
                identity.hex_digest(),
                std::process::id()
            ));
            let mut file = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary)?;
            let write_result = (|| -> std::io::Result<()> {
                file.write_all(bytes)?;
                file.sync_all()?;
                drop(file);
                fs::rename(&temporary, &target)?;
                File::open(parent)?.sync_all()?;
                Ok(())
            })();
            if write_result.is_err() {
                let _ = fs::remove_file(&temporary);
            }
            write_result?;
        }
        Ok(WriteReceipt {
            identity,
            binding: binding.clone(),
            locator,
            size_bytes: bytes.len() as u64,
        })
    }

    fn retrieve_and_verify(
        &self,
        expected: &QualifiedByteIdentity,
        locator: &StorageLocator,
        binding: &StorageBinding,
    ) -> Result<VerifiedRetrieval, StorageFailure> {
        self.require_binding(binding)?;
        let path = self.full_path(locator)?;
        let mut file = match File::open(path) {
            Ok(file) => file,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(StorageFailure::Missing)
            }
            Err(error) => return Err(error.into()),
        };
        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes)?;
        let kind = match expected.domain.as_str() {
            "kep-artifact-ciphertext" => ObjectKind::ArtifactCiphertext,
            "kep-recipient-envelope" => ObjectKind::RecipientEnvelope,
            "kep-allowed-metadata" => ObjectKind::AllowedMetadata,
            _ => return Err(StorageFailure::ByteIdentityMismatch),
        };
        if &QualifiedByteIdentity::for_bytes(kind, &bytes) != expected {
            return Err(StorageFailure::ByteIdentityMismatch);
        }
        Ok(VerifiedRetrieval {
            identity: expected.clone(),
            binding: binding.clone(),
            locator: locator.clone(),
            bytes,
        })
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EnvelopeActivation {
    pub recipient_id: String,
    pub active: QualifiedByteIdentity,
    pub prior: Option<QualifiedByteIdentity>,
}

#[derive(Default)]
pub struct EnvelopeRegistry {
    active: BTreeMap<String, QualifiedByteIdentity>,
}

impl EnvelopeRegistry {
    pub fn active_for(&self, recipient_id: &str) -> Option<&QualifiedByteIdentity> {
        self.active.get(recipient_id)
    }

    pub fn reissue<S: DurableStoragePort>(
        &mut self,
        store: &S,
        recipient_id: &str,
        replacement_bytes: &[u8],
        binding: &StorageBinding,
    ) -> Result<(EnvelopeActivation, WriteReceipt, VerifiedRetrieval), StorageFailure> {
        let receipt = store.persist(
            ObjectKind::RecipientEnvelope,
            MaterialClassification::EncryptedPayload,
            replacement_bytes,
            binding,
        )?;
        let verified = store.retrieve_and_verify(&receipt.identity, &receipt.locator, binding)?;
        let prior = self
            .active
            .insert(recipient_id.to_owned(), verified.identity.clone());
        Ok((
            EnvelopeActivation {
                recipient_id: recipient_id.to_owned(),
                active: verified.identity.clone(),
                prior,
            },
            receipt,
            verified,
        ))
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InfrastructureCost {
    pub amount_minor: u64,
    pub unit: String,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct KnowledgeConsideration {
    pub amount_minor: u64,
    pub unit: String,
}
