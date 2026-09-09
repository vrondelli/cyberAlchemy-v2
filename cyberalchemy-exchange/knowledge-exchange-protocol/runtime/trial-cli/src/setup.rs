use std::{
    collections::BTreeMap,
    fs::{self, DirBuilder, OpenOptions},
    io::Write,
    os::unix::fs::{DirBuilderExt, OpenOptionsExt, PermissionsExt},
    path::{Path, PathBuf},
};

use hpke::{kem::X25519HkdfSha256, Kem as KemTrait, Serializable};
use serde::Serialize;
use solana_keypair::{write_keypair_file, Keypair};
use solana_sdk::signature::Signer;
use zeroize::Zeroize;

use crate::TrialGateError;

type Kem = X25519HkdfSha256;

const SAMPLE_DEFINITION: &[u8] = b"Definition: a knowledge artifact is an encrypted, versioned byte sequence used only by this disposable CyberAlchemy Devnet trial.\n";

#[derive(Serialize)]
pub(crate) struct PreparationReceipt {
    schema_version: &'static str,
    result: &'static str,
    directory: String,
    solana_public_keys: BTreeMap<&'static str, String>,
    files: BTreeMap<&'static str, String>,
    secret_files_mode: &'static str,
    authority_effect: &'static str,
    local_effect: &'static str,
    authorization_attestation: &'static str,
    next_step: &'static str,
}

pub(crate) fn prepare(requested: &Path) -> Result<PreparationReceipt, TrialGateError> {
    if !requested.is_absolute() || requested.exists() {
        return Err(TrialGateError::Preparation);
    }
    let parent = requested.parent().ok_or(TrialGateError::Preparation)?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|_| TrialGateError::Preparation)?;
    let repository = trusted_repository_root()?;
    if canonical_parent.starts_with(&repository) {
        return Err(TrialGateError::RepositoryBoundary);
    }
    DirBuilder::new()
        .mode(0o700)
        .create(requested)
        .map_err(|_| TrialGateError::Preparation)?;
    let directory = requested
        .canonicalize()
        .map_err(|_| TrialGateError::Preparation)?;

    let mut files = BTreeMap::new();
    let mut solana_public_keys = BTreeMap::new();
    for (role, filename) in [
        ("payer", "payer.json"),
        ("originator", "originator.json"),
        ("recipient", "recipient.json"),
        ("outsider", "outsider.json"),
        ("program", "program.json"),
        ("buffer", "buffer.json"),
        ("upgrade_authority", "upgrade-authority.json"),
    ] {
        let path = directory.join(filename);
        let keypair = Keypair::new();
        write_keypair_file(&keypair, &path).map_err(|_| TrialGateError::Preparation)?;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o600))
            .map_err(|_| TrialGateError::Preparation)?;
        solana_public_keys.insert(role, keypair.pubkey().to_string());
        files.insert(role, path_text(&path)?);
    }

    for (role, stem) in [
        ("originator_hpke", "originator-hpke"),
        ("recipient_hpke", "recipient-hpke"),
        ("replacement_hpke", "replacement-hpke"),
    ] {
        let (private_key, public_key) = <Kem as KemTrait>::gen_keypair();
        let mut private_bytes = private_key.to_bytes();
        let public_bytes = public_key.to_bytes();
        let private_path = directory.join(format!("{stem}.key"));
        let public_path = directory.join(format!("{stem}.pub"));
        write_new(&private_path, private_bytes.as_ref(), 0o600)?;
        private_bytes.zeroize();
        write_new(&public_path, public_bytes.as_ref(), 0o600)?;
        files.insert(
            match role {
                "originator_hpke" => "originator_hpke_private",
                "recipient_hpke" => "recipient_hpke_private",
                _ => "replacement_hpke_private",
            },
            path_text(&private_path)?,
        );
        files.insert(
            match role {
                "originator_hpke" => "originator_hpke_public",
                "recipient_hpke" => "recipient_hpke_public",
                _ => "replacement_hpke_public",
            },
            path_text(&public_path)?,
        );
    }

    let fixture = directory.join("knowledge-definition.txt");
    write_new(&fixture, SAMPLE_DEFINITION, 0o600)?;
    files.insert("plaintext_fixture", path_text(&fixture)?);
    files.insert(
        "attempt_journal_future",
        path_text(&directory.join("attempt-journal.jsonl"))?,
    );
    files.insert(
        "evidence_output_future",
        path_text(&directory.join("trial-evidence.json"))?,
    );

    Ok(PreparationReceipt {
        schema_version: "cav2-kep-devnet-preparation/v1",
        result: "PREPARED_DISPOSABLE_LOCAL_MATERIAL",
        directory: path_text(&directory)?,
        solana_public_keys,
        files,
        secret_files_mode: "0600",
        authority_effect: "none",
        local_effect: "created-disposable-credentials-and-fixture-outside-repository",
        authorization_attestation: "external-not-attested-by-runner",
        next_step: "inspect the public identities, keep private files outside Git, then construct and authorize one exact Devnet envelope",
    })
}

fn write_new(path: &Path, bytes: &[u8], mode: u32) -> Result<(), TrialGateError> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .mode(mode)
        .open(path)
        .map_err(|_| TrialGateError::Preparation)?;
    file.write_all(bytes)
        .and_then(|()| file.sync_all())
        .map_err(|_| TrialGateError::Preparation)
}

fn path_text(path: &Path) -> Result<String, TrialGateError> {
    path.to_str()
        .map(str::to_owned)
        .ok_or(TrialGateError::Preparation)
}

fn trusted_repository_root() -> Result<PathBuf, TrialGateError> {
    let manifest_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .canonicalize()
        .map_err(|_| TrialGateError::RepositoryBoundary)?;
    let repository = manifest_dir
        .ancestors()
        .nth(5)
        .ok_or(TrialGateError::RepositoryBoundary)?
        .to_path_buf();
    if repository
        .join("cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli")
        .canonicalize()
        .map_err(|_| TrialGateError::RepositoryBoundary)?
        != manifest_dir
    {
        return Err(TrialGateError::RepositoryBoundary);
    }
    Ok(repository)
}
