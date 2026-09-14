use rwo_core::{DagDefinition, ENGINE_VERSION};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

pub const RUN_BUNDLE_VERSION: &str = "orchestrator-run-bundle/v1";

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunBundle {
    pub schema_version: String,
    pub bundle_digest: String,
    pub run_id: String,
    pub graph: DagDefinition,
    pub graph_digest: String,
    pub engine_version: String,
    pub admitted_at_ms: u128,
    pub deadline_at_ms: u128,
    pub authority_refs: Vec<String>,
    pub admission_context: serde_json::Value,
}

impl RunBundle {
    pub fn new(
        run_id: impl Into<String>,
        graph: DagDefinition,
        admitted_at_ms: u128,
        deadline_at_ms: u128,
        authority_refs: Vec<String>,
    ) -> Result<Self, String> {
        Self::new_with_context(
            run_id,
            graph,
            admitted_at_ms,
            deadline_at_ms,
            authority_refs,
            serde_json::json!({"kind":"direct_graph"}),
        )
    }

    pub fn new_with_context(
        run_id: impl Into<String>,
        graph: DagDefinition,
        admitted_at_ms: u128,
        deadline_at_ms: u128,
        authority_refs: Vec<String>,
        admission_context: serde_json::Value,
    ) -> Result<Self, String> {
        let graph_digest = digest(&graph)?;
        let mut value = Self {
            schema_version: RUN_BUNDLE_VERSION.to_owned(),
            bundle_digest: String::new(),
            run_id: run_id.into(),
            graph,
            graph_digest,
            engine_version: ENGINE_VERSION.to_owned(),
            admitted_at_ms,
            deadline_at_ms,
            authority_refs,
            admission_context,
        };
        value.bundle_digest = value.content_digest()?;
        value.validate()?;
        Ok(value)
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.schema_version != RUN_BUNDLE_VERSION {
            return Err("RUN_BUNDLE_VERSION_UNSUPPORTED".to_owned());
        }
        if self.engine_version != ENGINE_VERSION {
            return Err("RUN_ENGINE_VERSION_UNSUPPORTED".to_owned());
        }
        if self.run_id.is_empty() || self.run_id.len() > 160 {
            return Err("RUN_ID_INVALID".to_owned());
        }
        if self.deadline_at_ms <= self.admitted_at_ms {
            return Err("RUN_DEADLINE_INVALID".to_owned());
        }
        if self.authority_refs.is_empty() || self.authority_refs.iter().any(String::is_empty) {
            return Err("RUN_AUTHORITY_REF_REQUIRED".to_owned());
        }
        if !self.admission_context.is_object() {
            return Err("RUN_ADMISSION_CONTEXT_INVALID".to_owned());
        }
        if self.bundle_digest != self.content_digest()? {
            return Err("RUN_BUNDLE_DIGEST_MISMATCH".to_owned());
        }
        if self.graph_digest != digest(&self.graph)? {
            return Err("RUN_GRAPH_DIGEST_MISMATCH".to_owned());
        }
        Ok(())
    }

    fn content_digest(&self) -> Result<String, String> {
        digest(&serde_json::json!({
            "schema_version": self.schema_version,
            "run_id": self.run_id,
            "graph": self.graph,
            "graph_digest": self.graph_digest,
            "engine_version": self.engine_version,
            "admitted_at_ms": self.admitted_at_ms,
            "deadline_at_ms": self.deadline_at_ms,
            "authority_refs": self.authority_refs,
            "admission_context": self.admission_context,
        }))
    }
}

pub fn digest<T: Serialize>(value: &T) -> Result<String, String> {
    let bytes = serde_json::to_vec(value).map_err(|e| format!("JSON_ENCODE:{e}"))?;
    Ok(format!("sha256:{:x}", Sha256::digest(bytes)))
}
