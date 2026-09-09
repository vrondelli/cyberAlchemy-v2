use cyberalchemy_durable_storage::{MaterialClassification, ObjectKind, QualifiedByteIdentity};
use std::fmt;

#[derive(Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
pub struct FailureDomainId(String);

impl FailureDomainId {
    pub fn new(value: impl Into<String>) -> Result<Self, RecoveryFailure> {
        let value = value.into();
        if value.trim().is_empty() {
            return Err(RecoveryFailure::InvalidFailureDomain);
        }
        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Layer {
    OperationalSql,
    RecoveryJournal,
    ImmutableArchive,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LayerReceipt {
    pub layer: Layer,
    pub failure_domain: FailureDomainId,
    pub identity: QualifiedByteIdentity,
    pub size_bytes: u64,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtectionReceipt {
    pub identity: QualifiedByteIdentity,
    pub layers: Vec<LayerReceipt>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RecoverySource {
    OperationalSql,
    RecoveryJournal,
    ImmutableArchive,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecoveryEvidence {
    pub identity: QualifiedByteIdentity,
    pub source: RecoverySource,
    pub destination_failure_domain: FailureDomainId,
    pub destination_verified: bool,
    pub attempted_sources: Vec<RecoverySource>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RecoveryFailure {
    ConfidentialMaterialRejected,
    InvalidFailureDomain,
    SharedFailureDomain,
    Missing(Layer),
    IdentityMismatch(Layer),
    ImmutableConflict,
    Adapter(String),
    Io(String),
}

impl fmt::Display for RecoveryFailure {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{self:?}")
    }
}

impl std::error::Error for RecoveryFailure {}

impl From<std::io::Error> for RecoveryFailure {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value.kind().to_string())
    }
}

pub trait OperationalSqlLayer {
    fn failure_domain(&self) -> &FailureDomainId;
    fn put(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure>;
    fn get(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure>;
    fn delete(&self, identity: &QualifiedByteIdentity) -> Result<(), RecoveryFailure>;
}

pub trait RecoveryJournalLayer {
    fn failure_domain(&self) -> &FailureDomainId;
    fn append(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure>;
    fn find(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure>;
}

pub trait ImmutableArchiveLayer {
    fn failure_domain(&self) -> &FailureDomainId;
    fn archive(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure>;
    fn load(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure>;
}

pub struct ThreeLayerCoordinator<O, J, A> {
    operational: O,
    journal: J,
    archive: A,
}

impl<O, J, A> ThreeLayerCoordinator<O, J, A>
where
    O: OperationalSqlLayer,
    J: RecoveryJournalLayer,
    A: ImmutableArchiveLayer,
{
    pub fn new(operational: O, journal: J, archive: A) -> Result<Self, RecoveryFailure> {
        let domains = [
            operational.failure_domain(),
            journal.failure_domain(),
            archive.failure_domain(),
        ];
        if domains[0] == domains[1] || domains[0] == domains[2] || domains[1] == domains[2] {
            return Err(RecoveryFailure::SharedFailureDomain);
        }
        Ok(Self {
            operational,
            journal,
            archive,
        })
    }

    pub fn protect(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<ProtectionReceipt, RecoveryFailure> {
        require_allowed(classification)?;
        let expected = QualifiedByteIdentity::for_bytes(kind, bytes);
        let operational = self.operational.put(kind, classification, bytes)?;
        verify_layer_receipt(&expected, Layer::OperationalSql, &operational)?;
        verify_bytes(
            &expected,
            &self.operational.get(&expected)?,
            Layer::OperationalSql,
        )?;

        let journal = self.journal.append(kind, classification, bytes)?;
        verify_layer_receipt(&expected, Layer::RecoveryJournal, &journal)?;
        verify_bytes(
            &expected,
            &self.journal.find(&expected)?,
            Layer::RecoveryJournal,
        )?;

        let archive = self.archive.archive(kind, classification, bytes)?;
        verify_layer_receipt(&expected, Layer::ImmutableArchive, &archive)?;
        verify_bytes(
            &expected,
            &self.archive.load(&expected)?,
            Layer::ImmutableArchive,
        )?;

        Ok(ProtectionReceipt {
            identity: expected,
            layers: vec![operational, journal, archive],
        })
    }

    pub fn recover(
        &self,
        expected: &QualifiedByteIdentity,
    ) -> Result<RecoveryEvidence, RecoveryFailure> {
        let mut attempted = vec![RecoverySource::OperationalSql];
        if let Ok(bytes) = self.operational.get(expected) {
            if verify_bytes(expected, &bytes, Layer::OperationalSql).is_ok() {
                return Ok(self.evidence(expected, RecoverySource::OperationalSql, attempted));
            }
        }

        attempted.push(RecoverySource::RecoveryJournal);
        if let Ok(bytes) = self.journal.find(expected) {
            if verify_bytes(expected, &bytes, Layer::RecoveryJournal).is_ok()
                && self.restore_destination(expected, &bytes).is_ok()
            {
                return Ok(self.evidence(expected, RecoverySource::RecoveryJournal, attempted));
            }
        }

        attempted.push(RecoverySource::ImmutableArchive);
        let bytes = self.archive.load(expected)?;
        verify_bytes(expected, &bytes, Layer::ImmutableArchive)?;
        self.restore_destination(expected, &bytes)?;
        Ok(self.evidence(expected, RecoverySource::ImmutableArchive, attempted))
    }

    pub fn into_layers(self) -> (O, J, A) {
        (self.operational, self.journal, self.archive)
    }

    fn restore_destination(
        &self,
        expected: &QualifiedByteIdentity,
        bytes: &[u8],
    ) -> Result<(), RecoveryFailure> {
        let kind = object_kind(expected, Layer::OperationalSql)?;
        self.operational.delete(expected)?;
        let receipt =
            self.operational
                .put(kind, MaterialClassification::EncryptedPayload, bytes)?;
        verify_layer_receipt(expected, Layer::OperationalSql, &receipt)?;
        let destination = self.operational.get(expected)?;
        verify_bytes(expected, &destination, Layer::OperationalSql)
    }

    fn evidence(
        &self,
        expected: &QualifiedByteIdentity,
        source: RecoverySource,
        attempted_sources: Vec<RecoverySource>,
    ) -> RecoveryEvidence {
        RecoveryEvidence {
            identity: expected.clone(),
            source,
            destination_failure_domain: self.operational.failure_domain().clone(),
            destination_verified: true,
            attempted_sources,
        }
    }
}

pub(crate) fn require_allowed(
    classification: MaterialClassification,
) -> Result<(), RecoveryFailure> {
    if matches!(
        classification,
        MaterialClassification::EncryptedPayload | MaterialClassification::AllowedMetadata
    ) {
        Ok(())
    } else {
        Err(RecoveryFailure::ConfidentialMaterialRejected)
    }
}

pub(crate) fn object_kind(
    identity: &QualifiedByteIdentity,
    layer: Layer,
) -> Result<ObjectKind, RecoveryFailure> {
    match identity.domain.as_str() {
        "kep-artifact-ciphertext" => Ok(ObjectKind::ArtifactCiphertext),
        "kep-recipient-envelope" => Ok(ObjectKind::RecipientEnvelope),
        "kep-allowed-metadata" => Ok(ObjectKind::AllowedMetadata),
        _ => Err(RecoveryFailure::IdentityMismatch(layer)),
    }
}

pub(crate) fn verify_bytes(
    expected: &QualifiedByteIdentity,
    bytes: &[u8],
    layer: Layer,
) -> Result<(), RecoveryFailure> {
    let actual = QualifiedByteIdentity::for_bytes(object_kind(expected, layer)?, bytes);
    if &actual == expected {
        Ok(())
    } else {
        Err(RecoveryFailure::IdentityMismatch(layer))
    }
}

fn verify_layer_receipt(
    expected: &QualifiedByteIdentity,
    layer: Layer,
    receipt: &LayerReceipt,
) -> Result<(), RecoveryFailure> {
    if receipt.layer == layer && &receipt.identity == expected {
        Ok(())
    } else {
        Err(RecoveryFailure::IdentityMismatch(layer))
    }
}
