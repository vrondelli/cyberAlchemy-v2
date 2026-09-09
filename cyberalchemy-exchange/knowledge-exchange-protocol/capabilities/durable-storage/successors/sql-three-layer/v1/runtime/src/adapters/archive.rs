use crate::{
    object_kind, require_allowed, verify_bytes, FailureDomainId, ImmutableArchiveLayer, Layer,
    LayerReceipt, MaterialClassification, ObjectKind, QualifiedByteIdentity, RecoveryFailure,
};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

pub struct ImmutableFileArchive {
    root: PathBuf,
    failure_domain: FailureDomainId,
}

impl ImmutableFileArchive {
    pub fn new(
        root: impl Into<PathBuf>,
        failure_domain: FailureDomainId,
    ) -> Result<Self, RecoveryFailure> {
        let root = root.into();
        fs::create_dir_all(&root)?;
        Ok(Self {
            root,
            failure_domain,
        })
    }

    fn path(&self, identity: &QualifiedByteIdentity) -> PathBuf {
        self.root
            .join(&identity.domain)
            .join(identity.algorithm_version.to_string())
            .join(identity.hex_digest())
    }

    pub fn root(&self) -> &Path {
        &self.root
    }
}

impl ImmutableArchiveLayer for ImmutableFileArchive {
    fn failure_domain(&self) -> &FailureDomainId {
        &self.failure_domain
    }

    fn archive(
        &self,
        kind: ObjectKind,
        classification: MaterialClassification,
        bytes: &[u8],
    ) -> Result<LayerReceipt, RecoveryFailure> {
        require_allowed(classification)?;
        let identity = QualifiedByteIdentity::for_bytes(kind, bytes);
        let path = self.path(&identity);
        let parent = path.parent().ok_or(RecoveryFailure::ImmutableConflict)?;
        fs::create_dir_all(parent)?;
        match OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(mut file) => {
                file.write_all(bytes)?;
                file.sync_all()?;
            }
            Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {
                let existing = fs::read(&path)?;
                if existing != bytes {
                    return Err(RecoveryFailure::ImmutableConflict);
                }
            }
            Err(error) => return Err(error.into()),
        }
        verify_bytes(&identity, &fs::read(&path)?, Layer::ImmutableArchive)?;
        Ok(LayerReceipt {
            layer: Layer::ImmutableArchive,
            failure_domain: self.failure_domain.clone(),
            identity,
            size_bytes: bytes.len() as u64,
        })
    }

    fn load(&self, expected: &QualifiedByteIdentity) -> Result<Vec<u8>, RecoveryFailure> {
        object_kind(expected, Layer::ImmutableArchive)?;
        let bytes = match fs::read(self.path(expected)) {
            Ok(bytes) => bytes,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Err(RecoveryFailure::Missing(Layer::ImmutableArchive));
            }
            Err(error) => return Err(error.into()),
        };
        verify_bytes(expected, &bytes, Layer::ImmutableArchive)?;
        Ok(bytes)
    }
}
