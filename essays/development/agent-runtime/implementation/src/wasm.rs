use crate::{ErrorCode, RuntimeError};
use p256::ecdsa::{Signature, VerifyingKey, signature::Verifier};
use sha2::{Digest, Sha256};
use std::process::Stdio;
use tokio::{process::Command, time::timeout};

#[derive(Debug, Clone)]
pub struct VerifiedComponentManifest {
    component_path: String,
    component_sha256: String,
    owner: String,
    proposal_only: bool,
}

impl VerifiedComponentManifest {
    pub fn verify_bytes(
        component_path: impl Into<String>,
        bytes: &[u8],
        expected_sha256: &str,
        owner: impl Into<String>,
        proposal_only: bool,
        signature: &[u8],
        owner_key: &VerifyingKey,
    ) -> Result<Self, RuntimeError> {
        let actual = format!("{:x}", Sha256::digest(bytes));
        if actual != expected_sha256 || !proposal_only {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                "component digest mismatch or non-proposal capability requested",
            ));
        }
        let owner = owner.into();
        let signing_payload = manifest_signing_payload(&actual, &owner, proposal_only);
        let signature = Signature::from_slice(signature).map_err(|_| {
            RuntimeError::new(
                ErrorCode::Unauthenticated,
                "invalid owner manifest signature",
            )
        })?;
        owner_key
            .verify(&signing_payload, &signature)
            .map_err(|_| {
                RuntimeError::new(
                    ErrorCode::Unauthenticated,
                    "owner manifest signature rejected",
                )
            })?;
        Ok(Self {
            component_path: component_path.into(),
            component_sha256: actual,
            owner,
            proposal_only,
        })
    }

    pub fn component_path(&self) -> &str {
        &self.component_path
    }

    pub fn owner(&self) -> &str {
        &self.owner
    }

    pub fn component_sha256(&self) -> &str {
        &self.component_sha256
    }
}

pub fn manifest_signing_payload(
    component_sha256: &str,
    owner: &str,
    proposal_only: bool,
) -> Vec<u8> {
    format!(
        "essays-component-manifest-v1\nsha256={component_sha256}\nowner={owner}\nproposal_only={proposal_only}\n"
    )
    .into_bytes()
}

#[derive(Debug, Clone)]
pub struct WasmtimeSupervisor {
    pub executable: String,
    pub max_fuel: u64,
    pub max_memory_bytes: u64,
    pub max_seconds: u64,
    pub execution_enabled: bool,
}

impl WasmtimeSupervisor {
    pub async fn execute(
        &self,
        manifest: &VerifiedComponentManifest,
    ) -> Result<Vec<u8>, RuntimeError> {
        if !self.execution_enabled || !manifest.proposal_only {
            return Err(RuntimeError::new(
                ErrorCode::ScopeDenied,
                "WebAssembly execution is disabled or not proposal-only",
            ));
        }
        let mut command = Command::new(&self.executable);
        command
            .arg("run")
            .arg("--wasm")
            .arg("component-model")
            .arg("--fuel")
            .arg(self.max_fuel.to_string())
            .arg("--max-memory-size")
            .arg(self.max_memory_bytes.to_string())
            .arg(manifest.component_path())
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);
        let output = timeout(
            std::time::Duration::from_secs(self.max_seconds.max(1)),
            command.output(),
        )
        .await
        .map_err(|_| RuntimeError::new(ErrorCode::DeadlineExceeded, "Wasmtime deadline elapsed"))?
        .map_err(|error| RuntimeError::new(ErrorCode::InvalidInput, error.to_string()))?;
        if !output.status.success() {
            return Err(RuntimeError::new(
                ErrorCode::InvalidInput,
                String::from_utf8_lossy(&output.stderr),
            ));
        }
        if output.stdout.len() > 1024 * 1024 {
            return Err(RuntimeError::new(
                ErrorCode::ResourceLimitExceeded,
                "component output exceeded one MiB",
            ));
        }
        Ok(output.stdout)
    }
}
