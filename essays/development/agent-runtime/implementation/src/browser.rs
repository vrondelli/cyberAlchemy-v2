use crate::{
    AuthenticatedPrincipal, BrowserEvidence, EffectEnvelope, EffectOutcome, ErrorCode,
    RuntimeError, runtime::now_unix_ms,
};
use sha2::{Digest, Sha256};
use std::process::Stdio;
use tokio::{process::Command, time::timeout};

#[derive(Debug, Clone)]
pub struct PlaywrightSupervisor {
    pub executable: String,
    pub runner: String,
    pub max_output_bytes: usize,
    pub external_effects_enabled: bool,
}

impl PlaywrightSupervisor {
    pub async fn execute(
        &self,
        envelope: &EffectEnvelope,
        principal: &AuthenticatedPrincipal,
    ) -> Result<BrowserEvidence, RuntimeError> {
        let now = now_unix_ms();
        envelope.validate(principal, "browser:navigate", now)?;
        if !self.external_effects_enabled {
            return Err(RuntimeError::new(
                ErrorCode::ScopeDenied,
                "live browser effects are disabled",
            ));
        }
        let remaining_ms = envelope.deadline_unix_ms.saturating_sub(now).max(1) as u64;
        let mut command = Command::new(&self.executable);
        command
            .arg(&self.runner)
            .arg("--effect-id")
            .arg(&envelope.effect_id)
            .arg("--target")
            .arg(&envelope.target)
            .arg("--timeout-ms")
            .arg(remaining_ms.to_string())
            .env("ESSAYS_ALLOW_BROWSER_EFFECTS", "1")
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        let output = match timeout(
            std::time::Duration::from_millis(remaining_ms),
            command.output(),
        )
        .await
        {
            Ok(Ok(output)) => output,
            Ok(Err(error)) => {
                return Ok(evidence(
                    envelope,
                    EffectOutcome::Failed,
                    format!("runner spawn failed: {error}"),
                    vec!["no browser observation captured".into()],
                ));
            }
            Err(_) => {
                return Ok(evidence(
                    envelope,
                    EffectOutcome::Uncertain,
                    "runner deadline elapsed after dispatch".into(),
                    vec!["retry prohibited until reconciliation".into()],
                ));
            }
        };

        let mut bytes = output.stdout;
        bytes.extend_from_slice(&output.stderr);
        if bytes.len() > self.max_output_bytes {
            bytes.truncate(self.max_output_bytes);
        }
        let observation = redact(&String::from_utf8_lossy(&bytes));
        let artifact_sha256 = format!("{:x}", Sha256::digest(&bytes));
        Ok(BrowserEvidence {
            evidence_id: uuid::Uuid::new_v4().to_string(),
            effect_id: envelope.effect_id.clone(),
            workspace_id: envelope.workspace_id.clone(),
            method: "playwright-supervisor".into(),
            origin: envelope.target.clone(),
            artifact_sha256: Some(artifact_sha256),
            redacted_observation: observation,
            captured_at_unix_ms: now_unix_ms(),
            outcome: if output.status.success() {
                EffectOutcome::Certain
            } else {
                EffectOutcome::Failed
            },
            residue: Vec::new(),
        })
    }
}

fn evidence(
    envelope: &EffectEnvelope,
    outcome: EffectOutcome,
    observation: String,
    residue: Vec<String>,
) -> BrowserEvidence {
    BrowserEvidence {
        evidence_id: uuid::Uuid::new_v4().to_string(),
        effect_id: envelope.effect_id.clone(),
        workspace_id: envelope.workspace_id.clone(),
        method: "playwright-supervisor".into(),
        origin: envelope.target.clone(),
        artifact_sha256: None,
        redacted_observation: observation,
        captured_at_unix_ms: now_unix_ms(),
        outcome,
        residue,
    }
}

fn redact(value: &str) -> String {
    value
        .lines()
        .map(|line| {
            if line.to_ascii_lowercase().contains("authorization")
                || line.to_ascii_lowercase().contains("cookie")
                || line.contains("secret://")
            {
                "[REDACTED]"
            } else {
                line
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
}
