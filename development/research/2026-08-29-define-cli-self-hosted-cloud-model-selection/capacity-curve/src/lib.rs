use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Read;
use std::path::Path;

pub const GIB: u64 = 1024 * 1024 * 1024;

#[derive(Debug)]
pub enum Error {
    Invalid(String),
    NoFeasible(String),
    SearchLimit(String),
    Io(std::io::Error),
    Json(serde_json::Error),
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Invalid(s) | Self::NoFeasible(s) | Self::SearchLimit(s) => f.write_str(s),
            Self::Io(e) => e.fmt(f),
            Self::Json(e) => e.fmt(f),
        }
    }
}
impl std::error::Error for Error {}
impl From<std::io::Error> for Error {
    fn from(v: std::io::Error) -> Self {
        Self::Io(v)
    }
}
impl From<serde_json::Error> for Error {
    fn from(v: serde_json::Error) -> Self {
        Self::Json(v)
    }
}
pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CapabilityStatus {
    Supported,
    Unsupported,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum AttentionKind {
    FullAttention,
    SlidingAttention { window_tokens: u64 },
    Recurrent { state_bytes_per_sequence: u64 },
    RecurrentObserved,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LayerGroupV1 {
    pub layers: u64,
    pub kv_heads: u64,
    pub head_dim: u64,
    #[serde(flatten)]
    pub attention: AttentionKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MoeV1 {
    pub total_experts: u64,
    pub active_experts_per_token: u64,
    pub expert_intermediate_size: u64,
    #[serde(default)]
    pub shared_experts: u64,
    #[serde(default)]
    pub shared_expert_intermediate_size: u64,
    #[serde(default)]
    pub sparse_layer_frequency: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ArchitectureV1 {
    pub kind: String,
    pub hidden_size: u64,
    pub layers: u64,
    pub attention_heads: u64,
    pub vocab_size: u64,
    pub dense_intermediate_size: u64,
    pub layer_groups: Vec<LayerGroupV1>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub moe: Option<MoeV1>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_parameters: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_parameters: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ArtifactFileV1 {
    pub path: String,
    pub bytes: u64,
    pub sha256: String,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ArtifactManifestV1 {
    pub repo: String,
    pub source_url: String,
    pub license_id: String,
    #[serde(default)]
    pub checkpoint_quantization: Option<String>,
    pub total_weight_bytes: u64,
    pub files: Vec<ArtifactFileV1>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokenizer_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chat_template_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ModelIdentityV1 {
    pub repo: String,
    pub revision: String,
    pub config_sha256: String,
    pub artifact_manifest_sha256: String,
    pub artifact_files_sha256: BTreeMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokenizer_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chat_template_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ModelProfileV1 {
    pub schema: String,
    pub profile_id: String,
    pub identity: ModelIdentityV1,
    pub architecture: ArchitectureV1,
    pub weight_dtype: String,
    #[serde(default)]
    pub checkpoint_quantization: Option<String>,
    pub source_url: String,
    pub license_id: String,
    #[serde(default)]
    pub rope_scaling_json: Option<String>,
    pub native_context_tokens: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extended_context_tokens: Option<u64>,
    pub artifact_weight_bytes: u64,
    pub capabilities: BTreeMap<String, CapabilityStatus>,
}

#[derive(Debug, Deserialize)]
struct HfConfig {
    model_type: String,
    hidden_size: u64,
    num_hidden_layers: u64,
    num_attention_heads: u64,
    num_key_value_heads: u64,
    head_dim: u64,
    vocab_size: u64,
    #[serde(default)]
    intermediate_size: u64,
    max_position_embeddings: u64,
    #[serde(default)]
    torch_dtype: Option<String>,
    #[serde(default)]
    num_experts: Option<u64>,
    #[serde(default)]
    num_experts_per_tok: Option<u64>,
    #[serde(default)]
    moe_intermediate_size: Option<u64>,
    #[serde(default)]
    shared_expert_intermediate_size: Option<u64>,
    #[serde(default)]
    use_sliding_window: Option<bool>,
    #[serde(default)]
    rope_scaling: Option<serde_json::Value>,
    #[serde(default)]
    decoder_sparse_step: Option<u64>,
    #[serde(default)]
    layer_types: Vec<String>,
    #[serde(default)]
    linear_num_key_heads: Option<u64>,
    #[serde(default)]
    linear_key_head_dim: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct QuantizationConfig {
    quant_method: String,
}

fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn hash_file(path: &Path) -> Result<(u64, String)> {
    let mut file = fs::File::open(path)?;
    let mut digest = Sha256::new();
    let mut bytes = 0u64;
    let mut buffer = [0u8; 1024 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        bytes = bytes
            .checked_add(read as u64)
            .ok_or_else(|| Error::Invalid("artifact byte count overflow".into()))?;
        digest.update(&buffer[..read]);
    }
    Ok((bytes, format!("{:x}", digest.finalize())))
}
fn require_sha(name: &str, value: &str) -> Result<()> {
    if value.len() != 64 || !value.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(Error::Invalid(format!(
            "{name} must be a 64-character SHA-256"
        )));
    }
    Ok(())
}

pub fn import_model(
    config_path: &Path,
    artifacts_path: &Path,
    revision: &str,
) -> Result<ModelProfileV1> {
    if revision.len() != 40 || !revision.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(Error::Invalid(
            "revision must be an exact 40-character commit SHA".into(),
        ));
    }
    let config_bytes = fs::read(config_path)?;
    let artifact_bytes = fs::read(artifacts_path)?;
    let config_value: serde_json::Value = serde_json::from_slice(&config_bytes)?;
    let raw_value = config_value
        .get("text_config")
        .unwrap_or(&config_value)
        .clone();
    let raw: HfConfig = serde_json::from_value(raw_value)?;
    let quantization: Option<QuantizationConfig> = config_value
        .get("quantization_config")
        .cloned()
        .map(serde_json::from_value)
        .transpose()?;
    let manifest: ArtifactManifestV1 = serde_json::from_slice(&artifact_bytes)?;
    if manifest.files.is_empty() {
        return Err(Error::Invalid("artifact manifest has no files".into()));
    }
    let sum = manifest
        .files
        .iter()
        .try_fold(0u64, |a, f| a.checked_add(f.bytes))
        .ok_or_else(|| Error::Invalid("artifact byte total overflow".into()))?;
    if sum != manifest.total_weight_bytes {
        return Err(Error::Invalid(format!(
            "artifact byte mismatch: files={sum}, declared={}",
            manifest.total_weight_bytes
        )));
    }
    let mut file_hashes = BTreeMap::new();
    let artifact_root = artifacts_path.parent().unwrap_or_else(|| Path::new("."));
    for file in &manifest.files {
        require_sha("artifact file sha256", &file.sha256)?;
        let path = artifact_root.join(&file.path);
        if !path.is_file() {
            return Err(Error::Invalid(format!(
                "artifact is not a local regular file: {}",
                path.display()
            )));
        }
        let (actual_bytes, actual_hash) = hash_file(&path)?;
        if actual_bytes != file.bytes || actual_hash != file.sha256.to_lowercase() {
            return Err(Error::Invalid(format!(
                "artifact mismatch for {}: expected {} bytes/{}, observed {actual_bytes}/{actual_hash}",
                file.path, file.bytes, file.sha256
            )));
        }
        file_hashes.insert(file.path.clone(), file.sha256.to_lowercase());
    }
    let moe = match raw.model_type.as_str() {
        "qwen3" => None,
        "qwen3_moe" | "qwen3_5_moe_text" => Some(MoeV1 {
            total_experts: raw
                .num_experts
                .ok_or_else(|| Error::Invalid("MoE config missing num_experts".into()))?,
            active_experts_per_token: raw
                .num_experts_per_tok
                .ok_or_else(|| Error::Invalid("MoE config missing num_experts_per_tok".into()))?,
            expert_intermediate_size: raw
                .moe_intermediate_size
                .ok_or_else(|| Error::Invalid("MoE config missing moe_intermediate_size".into()))?,
            shared_experts: u64::from(raw.shared_expert_intermediate_size.unwrap_or(0) > 0),
            shared_expert_intermediate_size: raw.shared_expert_intermediate_size.unwrap_or(0),
            sparse_layer_frequency: raw.decoder_sparse_step.unwrap_or(1),
        }),
        other => return Err(Error::Invalid(format!("unsupported model_type: {other}"))),
    };
    if raw.use_sliding_window.unwrap_or(false) {
        return Err(Error::Invalid(
            "sliding-window import requires an explicit normalized profile".into(),
        ));
    }
    let layer_groups = if raw.layer_types.is_empty() {
        vec![LayerGroupV1 {
            layers: raw.num_hidden_layers,
            kv_heads: raw.num_key_value_heads,
            head_dim: raw.head_dim,
            attention: AttentionKind::FullAttention,
        }]
    } else {
        if raw.layer_types.len() as u64 != raw.num_hidden_layers {
            return Err(Error::Invalid(
                "layer_types length does not match num_hidden_layers".into(),
            ));
        }
        let full = raw
            .layer_types
            .iter()
            .filter(|x| *x == "full_attention")
            .count() as u64;
        let recurrent = raw
            .layer_types
            .iter()
            .filter(|x| *x == "linear_attention")
            .count() as u64;
        if full + recurrent != raw.num_hidden_layers || full == 0 || recurrent == 0 {
            return Err(Error::Invalid(
                "unsupported hybrid layer_types schedule".into(),
            ));
        }
        vec![
            LayerGroupV1 {
                layers: full,
                kv_heads: raw.num_key_value_heads,
                head_dim: raw.head_dim,
                attention: AttentionKind::FullAttention,
            },
            LayerGroupV1 {
                layers: recurrent,
                kv_heads: raw.linear_num_key_heads.ok_or_else(|| {
                    Error::Invalid("linear attention missing key-head count".into())
                })?,
                head_dim: raw.linear_key_head_dim.ok_or_else(|| {
                    Error::Invalid("linear attention missing key-head dimension".into())
                })?,
                attention: AttentionKind::RecurrentObserved,
            },
        ]
    };
    let is_hybrid = !raw.layer_types.is_empty();
    let architecture = ArchitectureV1 {
        kind: match (moe.is_some(), is_hybrid) {
            (true, true) => "hybrid_moe",
            (true, false) => "moe",
            (false, _) => "dense",
        }
        .into(),
        hidden_size: raw.hidden_size,
        layers: raw.num_hidden_layers,
        attention_heads: raw.num_attention_heads,
        vocab_size: raw.vocab_size,
        dense_intermediate_size: raw.intermediate_size,
        layer_groups,
        moe,
        total_parameters: None,
        active_parameters: None,
    };
    let identity = ModelIdentityV1 {
        repo: manifest.repo.clone(),
        revision: revision.to_lowercase(),
        config_sha256: hash(&config_bytes),
        artifact_manifest_sha256: hash(&artifact_bytes),
        artifact_files_sha256: file_hashes,
        tokenizer_sha256: manifest.tokenizer_sha256,
        chat_template_sha256: manifest.chat_template_sha256,
    };
    let weight_dtype = match quantization.as_ref().map(|x| x.quant_method.as_str()) {
        Some("fp8") => "float8".into(),
        Some(other) => {
            return Err(Error::Invalid(format!(
                "unsupported checkpoint quantization: {other}"
            )))
        }
        None => raw
            .torch_dtype
            .clone()
            .ok_or_else(|| Error::Invalid("model config is missing torch_dtype".into()))?,
    };
    if quantization.as_ref().map(|x| x.quant_method.as_str())
        != manifest.checkpoint_quantization.as_deref()
    {
        return Err(Error::Invalid(
            "config and artifact checkpoint quantization differ".into(),
        ));
    }
    let mut profile = ModelProfileV1 {
        schema: "capacity-curve/model-profile/v1".into(),
        profile_id: String::new(),
        identity,
        architecture,
        weight_dtype,
        checkpoint_quantization: manifest.checkpoint_quantization,
        source_url: manifest.source_url,
        license_id: manifest.license_id,
        rope_scaling_json: raw
            .rope_scaling
            .map(|v| serde_json::to_string(&v))
            .transpose()?,
        native_context_tokens: raw.max_position_embeddings,
        extended_context_tokens: None,
        artifact_weight_bytes: manifest.total_weight_bytes,
        capabilities: BTreeMap::new(),
    };
    validate_model(&profile)?;
    profile.profile_id = model_profile_digest(&profile)?;
    Ok(profile)
}

pub fn validate_model(p: &ModelProfileV1) -> Result<()> {
    if p.schema != "capacity-curve/model-profile/v1" {
        return Err(Error::Invalid("unsupported model profile schema".into()));
    }
    if p.source_url.is_empty() || p.license_id.is_empty() {
        return Err(Error::Invalid(
            "model source URL and license metadata are required".into(),
        ));
    }
    let a = &p.architecture;
    if [
        a.hidden_size,
        a.layers,
        a.attention_heads,
        a.vocab_size,
        p.native_context_tokens,
        p.artifact_weight_bytes,
    ]
    .contains(&0)
    {
        return Err(Error::Invalid(
            "model dimensions, context, and artifact bytes must be non-zero".into(),
        ));
    }
    if a.moe.is_none() && a.dense_intermediate_size == 0 {
        return Err(Error::Invalid(
            "dense model intermediate size must be non-zero".into(),
        ));
    }
    let group_layers: u64 = a.layer_groups.iter().map(|g| g.layers).sum();
    if group_layers != a.layers {
        return Err(Error::Invalid(format!(
            "layer groups sum to {group_layers}, expected {}",
            a.layers
        )));
    }
    for g in &a.layer_groups {
        if g.layers == 0 || g.kv_heads == 0 || g.head_dim == 0 {
            return Err(Error::Invalid(
                "layer-group dimensions must be non-zero".into(),
            ));
        }
        match g.attention {
            AttentionKind::SlidingAttention { window_tokens: 0 }
            | AttentionKind::Recurrent {
                state_bytes_per_sequence: 0,
            } => return Err(Error::Invalid("window/state must be non-zero".into())),
            _ => {}
        }
    }
    if let Some(m) = &a.moe {
        if m.total_experts == 0
            || m.active_experts_per_token == 0
            || m.active_experts_per_token > m.total_experts
            || m.expert_intermediate_size == 0
        {
            return Err(Error::Invalid("invalid MoE expert dimensions".into()));
        }
    }
    if !p.profile_id.is_empty() && p.profile_id != model_profile_digest(p)? {
        return Err(Error::Invalid(
            "model profile_id does not authenticate the profile payload".into(),
        ));
    }
    Ok(())
}

pub fn model_profile_digest(p: &ModelProfileV1) -> Result<String> {
    let mut payload = p.clone();
    payload.profile_id.clear();
    Ok(hash(&serde_json::to_vec(&payload)?))
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub struct MemoryV1 {
    pub accelerator_resident_weights: u64,
    pub host_weight_pool: u64,
    pub expert_cache: u64,
    pub kv_cache: u64,
    pub recurrent_state: u64,
    pub runtime_reserve: u64,
}
impl MemoryV1 {
    pub fn total(&self) -> Result<u64> {
        [
            self.accelerator_resident_weights,
            self.host_weight_pool,
            self.expert_cache,
            self.kv_cache,
            self.recurrent_state,
            self.runtime_reserve,
        ]
        .into_iter()
        .try_fold(0u64, u64::checked_add)
        .ok_or_else(|| Error::Invalid("memory total overflow".into()))
    }
    fn scaled(&self, n: u64) -> Result<Self> {
        let m = |v: u64| {
            v.checked_mul(n)
                .ok_or_else(|| Error::Invalid("memory scale overflow".into()))
        };
        Ok(Self {
            accelerator_resident_weights: m(self.accelerator_resident_weights)?,
            host_weight_pool: m(self.host_weight_pool)?,
            expert_cache: m(self.expert_cache)?,
            kv_cache: m(self.kv_cache)?,
            recurrent_state: m(self.recurrent_state)?,
            runtime_reserve: m(self.runtime_reserve)?,
        })
    }
}

pub fn theoretical_sequence_memory(
    p: &ModelProfileV1,
    tokens: u64,
    kv_element_bytes: u64,
) -> Result<MemoryV1> {
    validate_model(p)?;
    if tokens > p.extended_context_tokens.unwrap_or(p.native_context_tokens) {
        return Err(Error::Invalid("context exceeds model maximum".into()));
    }
    let mut kv = 0u64;
    let mut recurrent = 0u64;
    for g in &p.architecture.layer_groups {
        match g.attention {
            AttentionKind::FullAttention => kv = checked_kv(kv, g, tokens, kv_element_bytes)?,
            AttentionKind::SlidingAttention { window_tokens } => {
                kv = checked_kv(kv, g, tokens.min(window_tokens), kv_element_bytes)?
            }
            AttentionKind::Recurrent {
                state_bytes_per_sequence,
            } => {
                recurrent = recurrent
                    .checked_add(
                        g.layers
                            .checked_mul(state_bytes_per_sequence)
                            .ok_or_else(|| Error::Invalid("state overflow".into()))?,
                    )
                    .ok_or_else(|| Error::Invalid("state overflow".into()))?
            }
            AttentionKind::RecurrentObserved => {
                return Err(Error::Invalid(
                    "recurrent state requires observed runtime evidence".into(),
                ))
            }
        }
    }
    Ok(MemoryV1 {
        kv_cache: kv,
        recurrent_state: recurrent,
        ..Default::default()
    })
}

pub fn theoretical_prefix_batch_memory(
    p: &ModelProfileV1,
    total_tokens: u64,
    shared_prefix_tokens: u64,
    in_flight: u64,
    replicas: u64,
    kv_element_bytes: u64,
) -> Result<MemoryV1> {
    validate_model(p)?;
    if shared_prefix_tokens > total_tokens || in_flight == 0 || replicas == 0 {
        return Err(Error::Invalid("invalid prefix batch dimensions".into()));
    }
    let mut kv = 0u64;
    let mut recurrent = 0u64;
    for g in &p.architecture.layer_groups {
        match g.attention {
            AttentionKind::FullAttention | AttentionKind::SlidingAttention { .. } => {
                let resident = match g.attention {
                    AttentionKind::SlidingAttention { window_tokens } => {
                        total_tokens.min(window_tokens)
                    }
                    _ => total_tokens,
                };
                let shared = shared_prefix_tokens.min(resident);
                let unique = resident - shared;
                let shared_bytes = checked_kv(0, g, shared, kv_element_bytes)?;
                let unique_bytes = checked_kv(0, g, unique, kv_element_bytes)?;
                kv = checked_add(
                    kv,
                    checked_add(
                        checked_mul(shared_bytes, replicas)?,
                        checked_mul(unique_bytes, in_flight)?,
                    )?,
                )?;
            }
            AttentionKind::Recurrent {
                state_bytes_per_sequence,
            } => {
                recurrent = checked_add(
                    recurrent,
                    checked_mul(checked_mul(g.layers, state_bytes_per_sequence)?, in_flight)?,
                )?;
            }
            AttentionKind::RecurrentObserved => {
                return Err(Error::Invalid(
                    "recurrent state requires observed runtime evidence".into(),
                ))
            }
        }
    }
    Ok(MemoryV1 {
        kv_cache: kv,
        recurrent_state: recurrent,
        ..Default::default()
    })
}
fn checked_kv(base: u64, g: &LayerGroupV1, tokens: u64, bytes: u64) -> Result<u64> {
    [g.layers, tokens, g.kv_heads, g.head_dim, 2, bytes]
        .into_iter()
        .try_fold(1u64, u64::checked_mul)
        .and_then(|v| base.checked_add(v))
        .ok_or_else(|| Error::Invalid("KV calculation overflow".into()))
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ObservationRefV1 {
    pub run_id: String,
    pub manifest_sha256: String,
    pub raw_evidence_sha256: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MetricPolicyV1 {
    pub ttft_percentile_milli: u64,
    pub latency_percentile_milli: u64,
    pub memory_statistic: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingProfileV1 {
    pub profile_id: String,
    pub model_profile_id: String,
    pub runtime_digest: String,
    pub container_digest: String,
    pub tokenizer_digest: String,
    pub template_digest: String,
    pub parser_digest: String,
    pub adapter_digest: String,
    pub weight_dtype: String,
    pub kv_dtype: String,
    pub placement: String,
    pub tensor_parallel: u64,
    pub pipeline_parallel: u64,
    pub expert_parallel: u64,
    pub context_tokens: u64,
    pub response_tokens: u64,
    pub max_in_flight: u64,
    pub techniques: BTreeSet<String>,
    pub observed_milli_rps: u64,
    pub ttft_ms: u64,
    pub latency_ms: u64,
    pub prefill_tokens_per_second: u64,
    pub decode_tokens_per_second: u64,
    pub memory_per_replica: MemoryV1,
    pub sample_count: u64,
    pub observation_window_ms: u64,
    pub metric_policy: MetricPolicyV1,
    pub observation_refs: Vec<ObservationRefV1>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GateObservationsV1 {
    pub language_quality_milli: u64,
    pub drift_ppm: u64,
    pub collision_ppm: u64,
    pub collapse_ppm: u64,
    pub premature_abstraction_ppm: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProposalTrackV1 {
    pub track_id: String,
    pub workers: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PipelineShapeV1 {
    pub distill_workers: u64,
    pub proposal_tracks: Vec<ProposalTrackV1>,
    pub tournament_workers: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CognitiveProfileV1 {
    pub bundle_id: String,
    pub serving_profile_id: String,
    pub workload_digest: String,
    pub pipeline_digest: String,
    pub gates_digest: String,
    pub pipeline_shape: PipelineShapeV1,
    pub observed_milli_rps: u64,
    pub workers: u64,
    pub inference_points: u64,
    pub serving_replicas: u64,
    pub available_shards: Vec<String>,
    pub facets: BTreeMap<String, u64>,
    pub accepted_unique_evidence: u64,
    #[serde(default)]
    pub accepted_evidence_ids: Vec<String>,
    pub observation_window_ms: u64,
    #[serde(default)]
    pub sample_count: u64,
    pub max_scale_copies: u64,
    pub gates: GateObservationsV1,
    pub observation_refs: Vec<ObservationRefV1>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidateV1 {
    pub model: ModelProfileV1,
    pub serving: Vec<ServingProfileV1>,
    pub cognitive: Vec<CognitiveProfileV1>,
    #[serde(default)]
    pub costs: Vec<CostProfileV1>,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CostProfileV1 {
    pub profile_id: String,
    pub serving_profile_id: String,
    pub observed_microunits_per_replica_hour: u64,
    pub sample_count: u64,
    pub observation_window_ms: u64,
    pub observation_refs: Vec<ObservationRefV1>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequiredGatesV1 {
    pub min_language_quality_milli: u64,
    pub max_drift_ppm: u64,
    pub max_collision_ppm: u64,
    pub max_collapse_ppm: u64,
    pub max_premature_abstraction_ppm: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetsV1 {
    pub memory_bytes: u64,
    pub serving_replicas: u64,
    pub inference_points: u64,
    pub workers: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingRequirementsV1 {
    pub runtime_digest: String,
    pub container_digest: String,
    pub tokenizer_digest: String,
    pub template_digest: String,
    pub parser_digest: String,
    pub adapter_digest: String,
    pub weight_dtype: String,
    pub kv_dtype: String,
    pub placement: String,
    pub tensor_parallel: u64,
    pub pipeline_parallel: u64,
    pub expert_parallel: u64,
    pub techniques: BTreeSet<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioV1 {
    pub schema: String,
    pub workload_digest: String,
    pub pipeline_digest: String,
    pub gates_digest: String,
    pub context_tokens: u64,
    pub response_tokens: u64,
    pub target_milli_rps: Vec<u64>,
    pub required_capabilities: Vec<String>,
    pub required_facets: BTreeMap<String, u64>,
    #[serde(default)]
    pub serving_requirements: Option<ServingRequirementsV1>,
    pub gates: RequiredGatesV1,
    pub budgets: BudgetsV1,
    #[serde(default)]
    pub max_cost_microunits_per_hour: Option<u64>,
    #[serde(default = "default_min_samples")]
    pub min_observation_samples: u64,
    #[serde(default = "default_search_limit")]
    pub search_limit: u64,
    pub candidates: Vec<CandidateV1>,
}
fn default_search_limit() -> u64 {
    1_000_000
}
fn default_min_samples() -> u64 {
    1
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub struct AllocationV1 {
    pub bundle_id: String,
    pub copies: u64,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CurvePointV1 {
    pub model_profile_id: String,
    pub target_milli_rps: u64,
    pub status: String,
    pub allocations: Vec<AllocationV1>,
    pub observed_capacity_milli_rps: u64,
    pub projected_accepted_unique_evidence_per_minute_milli: u64,
    pub memory: MemoryV1,
    pub serving_replicas: u64,
    pub inference_points: u64,
    pub workers: u64,
    pub request_tokens_per_second_milli: u64,
    pub response_tokens_per_second_milli: u64,
    pub evidence_class: String,
    pub accepted_evidence_ids: Vec<String>,
    pub observed_cost_microunits_per_hour: Option<u64>,
    pub search_strategy: String,
    pub combinations_examined: u64,
    pub rejection_reasons: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PlanResultV1 {
    pub schema: String,
    pub plan_id: String,
    pub points: Vec<CurvePointV1>,
    pub saturation_target_milli_rps: Option<u64>,
    pub saturation_by_model: BTreeMap<String, u64>,
    pub selected_model_by_target: BTreeMap<u64, String>,
}

#[derive(Debug, Deserialize)]
struct FileRefV1 {
    path: String,
    sha256: String,
}

pub fn load_scenario(path: &Path) -> Result<ScenarioV1> {
    let bytes = fs::read(path)?;
    let mut root: serde_json::Value = serde_json::from_slice(&bytes)?;
    let base = path.parent().unwrap_or_else(|| Path::new("."));
    let candidates = root
        .get_mut("candidates")
        .and_then(|v| v.as_array_mut())
        .ok_or_else(|| Error::Invalid("scenario candidates must be an array".into()))?;
    for candidate in candidates {
        let Some(object) = candidate.as_object_mut() else {
            return Err(Error::Invalid("candidate must be an object".into()));
        };
        if let Some(value) = object.remove("model_ref") {
            object.insert(
                "model".into(),
                load_ref(base, serde_json::from_value(value)?)?,
            );
        }
        for (refs_key, target_key) in [
            ("serving_refs", "serving"),
            ("cognitive_refs", "cognitive"),
            ("cost_refs", "costs"),
        ] {
            if let Some(value) = object.remove(refs_key) {
                let refs: Vec<FileRefV1> = serde_json::from_value(value)?;
                let mut loaded = Vec::new();
                for reference in refs {
                    loaded.push(load_ref(base, reference)?);
                }
                object.insert(target_key.into(), serde_json::Value::Array(loaded));
            }
        }
    }
    Ok(serde_json::from_value(root)?)
}

fn load_ref(base: &Path, reference: FileRefV1) -> Result<serde_json::Value> {
    require_sha("referenced profile sha256", &reference.sha256)?;
    let relative = Path::new(&reference.path);
    if relative.is_absolute()
        || relative
            .components()
            .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(Error::Invalid(format!(
            "profile reference escapes scenario root: {}",
            reference.path
        )));
    }
    let path = base.join(relative);
    if !path.is_file() {
        return Err(Error::Invalid(format!(
            "profile reference is not a regular file: {}",
            path.display()
        )));
    }
    let bytes = fs::read(path)?;
    if hash(&bytes) != reference.sha256.to_lowercase() {
        return Err(Error::Invalid(format!(
            "profile reference digest mismatch: {}",
            reference.path
        )));
    }
    Ok(serde_json::from_slice(&bytes)?)
}

pub fn plan(s: &ScenarioV1) -> Result<PlanResultV1> {
    if s.schema != "capacity-curve/scenario/v1"
        || s.context_tokens == 0
        || s.response_tokens >= s.context_tokens
        || s.search_limit == 0
    {
        return Err(Error::Invalid(
            "invalid scenario header/context/search limit".into(),
        ));
    }
    let mut points = Vec::new();
    let mut candidates = s.candidates.clone();
    candidates.sort_by(|a, b| a.model.profile_id.cmp(&b.model.profile_id));
    for candidate in &candidates {
        validate_model(&candidate.model)?;
        let mut serving_ids = BTreeSet::new();
        for serving in &candidate.serving {
            validate_serving(&candidate.model, serving)?;
            if !serving_ids.insert(serving.profile_id.as_str()) {
                return Err(Error::Invalid(format!(
                    "duplicate serving profile id: {}",
                    serving.profile_id
                )));
            }
        }
        let mut bundle_ids = BTreeSet::new();
        for cognitive in &candidate.cognitive {
            if !bundle_ids.insert(cognitive.bundle_id.as_str()) {
                return Err(Error::Invalid(format!(
                    "duplicate cognitive bundle id: {}",
                    cognitive.bundle_id
                )));
            }
            validate_cognitive(cognitive, s.min_observation_samples)?;
        }
        let mut cost_by_serving = BTreeMap::new();
        for cost in &candidate.costs {
            if cost.profile_id.is_empty()
                || cost.serving_profile_id.is_empty()
                || cost.observed_microunits_per_replica_hour == 0
                || cost.sample_count < s.min_observation_samples
                || cost.observation_window_ms == 0
                || cost.observation_refs.is_empty()
            {
                return Err(Error::Invalid(
                    "invalid or undersampled cost profile".into(),
                ));
            }
            if cost_by_serving
                .insert(cost.serving_profile_id.as_str(), cost)
                .is_some()
            {
                return Err(Error::Invalid(
                    "multiple cost profiles for one serving identity".into(),
                ));
            }
        }
        let unsupported: Vec<_> = s
            .required_capabilities
            .iter()
            .filter(|cap| {
                candidate.model.capabilities.get(*cap) != Some(&CapabilityStatus::Supported)
            })
            .cloned()
            .collect();
        if !unsupported.is_empty() {
            for target in &s.target_milli_rps {
                points.push(infeasible(
                    &candidate.model.profile_id,
                    *target,
                    format!(
                        "required capabilities are unsupported or unknown: {}",
                        unsupported.join(", ")
                    ),
                ));
            }
            continue;
        }
        if s.context_tokens
            > candidate
                .model
                .extended_context_tokens
                .unwrap_or(candidate.model.native_context_tokens)
        {
            for target in &s.target_milli_rps {
                points.push(infeasible(
                    &candidate.model.profile_id,
                    *target,
                    "context exceeds model maximum".into(),
                ));
            }
            continue;
        }
        let serving: BTreeMap<_, _> = candidate
            .serving
            .iter()
            .filter(|p| {
                p.model_profile_id == candidate.model.profile_id
                    && p.context_tokens == s.context_tokens
                    && p.response_tokens == s.response_tokens
                    && s.serving_requirements
                        .as_ref()
                        .map(|r| serving_matches(p, r))
                        .unwrap_or(true)
            })
            .map(|p| (p.profile_id.as_str(), p))
            .collect();
        let mut bundles: Vec<_> = candidate
            .cognitive
            .iter()
            .filter_map(|c| {
                serving.get(c.serving_profile_id.as_str()).map(|v| {
                    (
                        c,
                        *v,
                        cost_by_serving.get(c.serving_profile_id.as_str()).copied(),
                    )
                })
            })
            .filter(|(c, _, _)| {
                c.workload_digest == s.workload_digest
                    && c.pipeline_digest == s.pipeline_digest
                    && c.gates_digest == s.gates_digest
            })
            .collect();
        bundles.sort_by(|a, b| a.0.bundle_id.cmp(&b.0.bundle_id));
        for target in &s.target_milli_rps {
            let mut best: Option<CurvePointV1> = None;
            let mut searched = 0u64;
            if bundles.len() as u64 > s.search_limit {
                return Err(Error::SearchLimit(format!(
                    "{} observed points exceed per-curve search limit {}",
                    bundles.len(),
                    s.search_limit
                )));
            }
            for index in 0..bundles.len() {
                let mut allocation = vec![0; bundles.len()];
                allocation[index] = 1;
                enumerate(
                    s,
                    &candidate.model.profile_id,
                    *target,
                    &bundles,
                    bundles.len(),
                    &mut allocation,
                    &mut searched,
                    &mut best,
                )?;
            }
            if let Some(point) = best.as_mut() {
                point.combinations_examined = searched;
                point.search_strategy = if bundles.len() > 32 {
                    "pareto_frontier"
                } else {
                    "observed_point_scan"
                }
                .into();
            }
            points.push(best.unwrap_or_else(|| {
                infeasible(
                    &candidate.model.profile_id,
                    *target,
                    "no observed bundle allocation satisfies all budgets and gates".into(),
                )
            }));
        }
    }
    if points.is_empty() {
        return Err(Error::NoFeasible("scenario has no candidates".into()));
    }
    points.sort_by(|a, b| {
        (&a.model_profile_id, a.target_milli_rps).cmp(&(&b.model_profile_id, b.target_milli_rps))
    });
    let max_yield = points
        .iter()
        .filter(|p| p.status == "feasible")
        .map(|p| p.projected_accepted_unique_evidence_per_minute_milli)
        .max();
    let saturation = max_yield.and_then(|yield_value| {
        points
            .iter()
            .filter(|p| {
                p.status == "feasible"
                    && p.projected_accepted_unique_evidence_per_minute_milli == yield_value
            })
            .map(|p| p.target_milli_rps)
            .min()
    });
    let mut saturation_by_model = BTreeMap::new();
    for model in points
        .iter()
        .map(|p| p.model_profile_id.clone())
        .collect::<BTreeSet<_>>()
    {
        if let Some(maximum) = points
            .iter()
            .filter(|p| p.model_profile_id == model && p.status == "feasible")
            .map(|p| p.projected_accepted_unique_evidence_per_minute_milli)
            .max()
        {
            if let Some(target) = points
                .iter()
                .filter(|p| {
                    p.model_profile_id == model
                        && p.status == "feasible"
                        && p.projected_accepted_unique_evidence_per_minute_milli == maximum
                })
                .map(|p| p.target_milli_rps)
                .min()
            {
                saturation_by_model.insert(model, target);
            }
        }
    }
    let mut selected_model_by_target = BTreeMap::new();
    for target in s.target_milli_rps.iter().copied().collect::<BTreeSet<_>>() {
        let mut selected: Option<&CurvePointV1> = None;
        for point in points
            .iter()
            .filter(|p| p.target_milli_rps == target && p.status == "feasible")
        {
            if selected
                .map(|current| better(point, current))
                .unwrap_or(true)
            {
                selected = Some(point);
            }
        }
        if let Some(point) = selected {
            selected_model_by_target.insert(target, point.model_profile_id.clone());
        }
    }
    let mut result = PlanResultV1 {
        schema: "capacity-curve/plan-result/v1".into(),
        plan_id: String::new(),
        points,
        saturation_target_milli_rps: saturation,
        saturation_by_model,
        selected_model_by_target,
    };
    result.plan_id = hash(&serde_json::to_vec(&result)?);
    Ok(result)
}

fn serving_matches(p: &ServingProfileV1, r: &ServingRequirementsV1) -> bool {
    p.runtime_digest == r.runtime_digest
        && p.container_digest == r.container_digest
        && p.tokenizer_digest == r.tokenizer_digest
        && p.template_digest == r.template_digest
        && p.parser_digest == r.parser_digest
        && p.adapter_digest == r.adapter_digest
        && p.weight_dtype == r.weight_dtype
        && p.kv_dtype == r.kv_dtype
        && p.placement == r.placement
        && p.tensor_parallel == r.tensor_parallel
        && p.pipeline_parallel == r.pipeline_parallel
        && p.expert_parallel == r.expert_parallel
        && p.techniques == r.techniques
}

pub fn validate_serving(model: &ModelProfileV1, p: &ServingProfileV1) -> Result<()> {
    if p.profile_id.is_empty()
        || p.model_profile_id != model.profile_id
        || p.weight_dtype != model.weight_dtype
    {
        return Err(Error::Invalid(
            "serving/model identity or weight dtype mismatch".into(),
        ));
    }
    if [
        p.tensor_parallel,
        p.pipeline_parallel,
        p.expert_parallel,
        p.context_tokens,
        p.max_in_flight,
        p.observed_milli_rps,
        p.latency_ms,
        p.prefill_tokens_per_second,
        p.decode_tokens_per_second,
        p.sample_count,
        p.observation_window_ms,
    ]
    .contains(&0)
        || p.response_tokens >= p.context_tokens
        || p.memory_per_replica.total()? == 0
        || p.observation_refs.is_empty()
        || p.metric_policy.ttft_percentile_milli == 0
        || p.metric_policy.ttft_percentile_milli > 1000
        || p.metric_policy.latency_percentile_milli == 0
        || p.metric_policy.latency_percentile_milli > 1000
        || p.metric_policy.memory_statistic != "peak"
    {
        return Err(Error::Invalid(
            "invalid zero/occupancy field in serving profile".into(),
        ));
    }
    if p.context_tokens
        > model
            .extended_context_tokens
            .unwrap_or(model.native_context_tokens)
    {
        return Err(Error::Invalid(
            "serving context exceeds model maximum".into(),
        ));
    }
    let weight_accounted = checked_add(
        p.memory_per_replica.accelerator_resident_weights,
        p.memory_per_replica.host_weight_pool,
    )?;
    if weight_accounted < model.artifact_weight_bytes {
        return Err(Error::Invalid(
            "serving weight accounting is below artifact bytes".into(),
        ));
    }
    let optimized_memory = p.techniques.iter().any(|t| {
        matches!(
            t.as_str(),
            "prefix_cache_observed"
                | "radix_cache_observed"
                | "expert_offload_observed"
                | "freetoken_observed"
                | "elastic_memory_observed"
        )
    });
    if !optimized_memory {
        let kv_bytes = dtype_bytes(&p.kv_dtype)?;
        let lower = theoretical_sequence_memory(model, p.context_tokens, kv_bytes)?;
        let required_kv = checked_mul(lower.kv_cache, p.max_in_flight)?;
        let required_state = checked_mul(lower.recurrent_state, p.max_in_flight)?;
        if p.memory_per_replica.kv_cache < required_kv
            || p.memory_per_replica.recurrent_state < required_state
        {
            return Err(Error::Invalid(
                "serving KV/recurrent memory is below the theoretical in-flight lower bound".into(),
            ));
        }
    }
    let required_in_flight = checked_mul(p.observed_milli_rps, p.latency_ms)?.div_ceil(1_000_000);
    if required_in_flight > p.max_in_flight {
        return Err(Error::Invalid(
            "observed RPS/latency violates max_in_flight by Little's law".into(),
        ));
    }
    Ok(())
}

fn dtype_bytes(dtype: &str) -> Result<u64> {
    match dtype {
        "float32" => Ok(4),
        "bfloat16" | "float16" => Ok(2),
        "float8" | "int8" => Ok(1),
        other => Err(Error::Invalid(format!("unsupported KV dtype: {other}"))),
    }
}

pub fn validate_cognitive(p: &CognitiveProfileV1, min_samples: u64) -> Result<()> {
    if p.bundle_id.is_empty()
        || p.serving_profile_id.is_empty()
        || [
            p.observed_milli_rps,
            p.workers,
            p.inference_points,
            p.serving_replicas,
            p.observation_window_ms,
            p.max_scale_copies,
        ]
        .contains(&0)
        || p.max_scale_copies != 1
        || p.available_shards.is_empty()
        || p.sample_count < min_samples
        || p.observation_refs.is_empty()
    {
        return Err(Error::Invalid(
            "V1 requires one exact observed cognitive scale point; use a separate profile for every RPS/scale observation".into(),
        ));
    }
    let unique: BTreeSet<_> = p.available_shards.iter().collect();
    if unique.len() != p.available_shards.len() {
        return Err(Error::Invalid(
            "duplicate shards inside cognitive profile".into(),
        ));
    }
    let evidence: BTreeSet<_> = p.accepted_evidence_ids.iter().collect();
    if evidence.len() != p.accepted_evidence_ids.len()
        || evidence.len() as u64 != p.accepted_unique_evidence
    {
        return Err(Error::Invalid(
            "accepted evidence IDs must be unique and match accepted_unique_evidence".into(),
        ));
    }
    let track_ids: BTreeSet<_> = p
        .pipeline_shape
        .proposal_tracks
        .iter()
        .map(|t| t.track_id.as_str())
        .collect();
    let pipeline_workers = p.pipeline_shape.proposal_tracks.iter().try_fold(
        checked_add(
            p.pipeline_shape.distill_workers,
            p.pipeline_shape.tournament_workers,
        )?,
        |total, track| {
            if track.track_id.is_empty() || track.workers == 0 {
                return Err(Error::Invalid(
                    "proposal tracks require identity and workers".into(),
                ));
            }
            checked_add(total, track.workers)
        },
    )?;
    if p.pipeline_shape.distill_workers == 0
        || p.pipeline_shape.tournament_workers == 0
        || p.pipeline_shape.proposal_tracks.len() != 3
        || track_ids.len() != 3
        || pipeline_workers != p.workers
    {
        return Err(Error::Invalid("cognitive pipeline must be Distill -> exactly three distinct proposal tracks -> Tournament, and worker totals must match".into()));
    }
    Ok(())
}

fn enumerate(
    s: &ScenarioV1,
    model: &str,
    target: u64,
    b: &[(
        &CognitiveProfileV1,
        &ServingProfileV1,
        Option<&CostProfileV1>,
    )],
    i: usize,
    counts: &mut [u64],
    searched: &mut u64,
    best: &mut Option<CurvePointV1>,
) -> Result<()> {
    if i < b.len() {
        for n in 0..=b[i]
            .0
            .max_scale_copies
            .min(b[i].0.available_shards.len() as u64)
        {
            counts[i] = n;
            enumerate(s, model, target, b, i + 1, counts, searched, best)?;
        }
        return Ok(());
    }
    *searched += 1;
    if *searched > s.search_limit {
        return Err(Error::SearchLimit(format!(
            "search limit {} reached",
            s.search_limit
        )));
    }
    let mut memory = MemoryV1::default();
    let (mut rps, mut reps, mut points, mut workers) = (0u64, 0u64, 0u64, 0u64);
    let mut facets = BTreeMap::<String, u64>::new();
    let mut allocations = Vec::new();
    let mut used_shards = BTreeSet::new();
    let mut evidence_ids = BTreeSet::new();
    let mut observation_window = None;
    let mut cost_total = if s.max_cost_microunits_per_hour.is_some() {
        Some(0u64)
    } else {
        None
    };
    let mut selected_serving = None;
    for ((c, v, cost), n) in b.iter().zip(counts.iter().copied()) {
        if n == 0 {
            continue;
        }
        if !gates_ok(&c.gates, &s.gates) {
            return Ok(());
        }
        if c.observed_milli_rps > checked_mul(v.observed_milli_rps, c.serving_replicas)? {
            return Ok(());
        }
        if selected_serving
            .replace(c.serving_profile_id.as_str())
            .is_some_and(|id| id != c.serving_profile_id)
        {
            return Ok(());
        }
        if observation_window
            .replace(c.observation_window_ms)
            .is_some_and(|w| w != c.observation_window_ms)
        {
            return Ok(());
        }
        for shard in c.available_shards.iter().take(n as usize) {
            if !used_shards.insert(shard) {
                return Ok(());
            }
        }
        rps = checked_add(rps, checked_mul(c.observed_milli_rps, n)?)?;
        reps = checked_add(reps, checked_mul(c.serving_replicas, n)?)?;
        points = checked_add(points, checked_mul(c.inference_points, n)?)?;
        workers = checked_add(workers, checked_mul(c.workers, n)?)?;
        let scaled = v
            .memory_per_replica
            .scaled(c.serving_replicas.saturating_mul(n))?;
        add_memory(&mut memory, &scaled)?;
        if c.observation_window_ms == 0 {
            return Err(Error::Invalid(
                "observation_window_ms must be non-zero".into(),
            ));
        }
        evidence_ids.extend(c.accepted_evidence_ids.iter().cloned());
        if let Some(total) = cost_total.as_mut() {
            let Some(profile) = cost else {
                return Ok(());
            };
            *total = checked_add(
                *total,
                checked_mul(
                    profile.observed_microunits_per_replica_hour,
                    checked_mul(c.serving_replicas, n)?,
                )?,
            )?;
        }
        for (f, x) in &c.facets {
            *facets.entry(f.clone()).or_default() = facets
                .get(f)
                .copied()
                .unwrap_or(0)
                .checked_add(checked_mul(*x, n)?)
                .ok_or_else(|| Error::Invalid("facet overflow".into()))?;
        }
        allocations.push(AllocationV1 {
            bundle_id: c.bundle_id.clone(),
            copies: n,
        });
    }
    let window = observation_window.unwrap_or(1);
    let yield_milli = checked_mul(evidence_ids.len() as u64, 60_000_000)? / window;
    if rps != target
        || memory.total()? > s.budgets.memory_bytes
        || reps > s.budgets.serving_replicas
        || points > s.budgets.inference_points
        || workers > s.budgets.workers
        || s.max_cost_microunits_per_hour
            .zip(cost_total)
            .is_some_and(|(limit, actual)| actual > limit)
        || s.required_facets
            .iter()
            .any(|(f, n)| facets.get(f).copied().unwrap_or(0) < *n)
    {
        return Ok(());
    }
    let p = CurvePointV1 {
        model_profile_id: model.into(),
        target_milli_rps: target,
        status: "feasible".into(),
        allocations,
        observed_capacity_milli_rps: rps,
        projected_accepted_unique_evidence_per_minute_milli: yield_milli,
        memory,
        serving_replicas: reps,
        inference_points: points,
        workers,
        request_tokens_per_second_milli: checked_mul(rps, s.context_tokens - s.response_tokens)?,
        response_tokens_per_second_milli: checked_mul(rps, s.response_tokens)?,
        evidence_class: "observed_bundle".into(),
        accepted_evidence_ids: evidence_ids.into_iter().collect(),
        observed_cost_microunits_per_hour: cost_total,
        search_strategy: if b.len() > 32 {
            "pareto_frontier"
        } else {
            "observed_point_scan"
        }
        .into(),
        combinations_examined: *searched,
        rejection_reasons: vec![],
    };
    if best.as_ref().map(|x| better(&p, x)).unwrap_or(true) {
        *best = Some(p)
    }
    Ok(())
}
fn gates_ok(o: &GateObservationsV1, g: &RequiredGatesV1) -> bool {
    o.language_quality_milli >= g.min_language_quality_milli
        && o.drift_ppm <= g.max_drift_ppm
        && o.collision_ppm <= g.max_collision_ppm
        && o.collapse_ppm <= g.max_collapse_ppm
        && o.premature_abstraction_ppm <= g.max_premature_abstraction_ppm
}
fn add_memory(a: &mut MemoryV1, b: &MemoryV1) -> Result<()> {
    macro_rules! add {
        ($f:ident) => {
            $crate::checked_add_assign(&mut a.$f, b.$f)?
        };
    }
    add!(accelerator_resident_weights);
    add!(host_weight_pool);
    add!(expert_cache);
    add!(kv_cache);
    add!(recurrent_state);
    add!(runtime_reserve);
    Ok(())
}
pub fn checked_add_assign(a: &mut u64, b: u64) -> Result<()> {
    *a = a
        .checked_add(b)
        .ok_or_else(|| Error::Invalid("resource overflow".into()))?;
    Ok(())
}
fn checked_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b)
        .ok_or_else(|| Error::Invalid("optimizer addition overflow".into()))
}
fn checked_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b)
        .ok_or_else(|| Error::Invalid("optimizer multiplication overflow".into()))
}
fn better(a: &CurvePointV1, b: &CurvePointV1) -> bool {
    if a.projected_accepted_unique_evidence_per_minute_milli
        != b.projected_accepted_unique_evidence_per_minute_milli
    {
        return a.projected_accepted_unique_evidence_per_minute_milli
            > b.projected_accepted_unique_evidence_per_minute_milli;
    }
    let a_memory = a.memory.total().unwrap_or(u64::MAX);
    let b_memory = b.memory.total().unwrap_or(u64::MAX);
    if a_memory != b_memory {
        return a_memory < b_memory;
    }
    if let (Some(a_cost), Some(b_cost)) = (
        a.observed_cost_microunits_per_hour,
        b.observed_cost_microunits_per_hour,
    ) {
        if a_cost != b_cost {
            return a_cost < b_cost;
        }
    }
    (
        std::cmp::Reverse(a.serving_replicas),
        std::cmp::Reverse(a.inference_points),
        std::cmp::Reverse(a.workers),
        std::cmp::Reverse(&a.allocations),
    ) > (
        std::cmp::Reverse(b.serving_replicas),
        std::cmp::Reverse(b.inference_points),
        std::cmp::Reverse(b.workers),
        std::cmp::Reverse(&b.allocations),
    )
}
fn infeasible(model: &str, target: u64, reason: String) -> CurvePointV1 {
    CurvePointV1 {
        model_profile_id: model.into(),
        target_milli_rps: target,
        status: "infeasible".into(),
        allocations: vec![],
        observed_capacity_milli_rps: 0,
        projected_accepted_unique_evidence_per_minute_milli: 0,
        memory: MemoryV1::default(),
        serving_replicas: 0,
        inference_points: 0,
        workers: 0,
        request_tokens_per_second_milli: 0,
        response_tokens_per_second_milli: 0,
        evidence_class: "not_evaluable".into(),
        accepted_evidence_ids: vec![],
        observed_cost_microunits_per_hour: None,
        search_strategy: "none".into(),
        combinations_examined: 0,
        rejection_reasons: vec![reason],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};
    fn model(layers: u64, kv: u64) -> ModelProfileV1 {
        let mut profile = ModelProfileV1 {
            schema: "capacity-curve/model-profile/v1".into(),
            profile_id: String::new(),
            identity: ModelIdentityV1 {
                repo: "r".into(),
                revision: "0".repeat(40),
                config_sha256: "0".repeat(64),
                artifact_manifest_sha256: "0".repeat(64),
                artifact_files_sha256: BTreeMap::new(),
                tokenizer_sha256: None,
                chat_template_sha256: None,
            },
            architecture: ArchitectureV1 {
                kind: "dense".into(),
                hidden_size: 1,
                layers,
                attention_heads: 1,
                vocab_size: 1,
                dense_intermediate_size: 1,
                layer_groups: vec![LayerGroupV1 {
                    layers,
                    kv_heads: kv,
                    head_dim: 128,
                    attention: AttentionKind::FullAttention,
                }],
                moe: None,
                total_parameters: None,
                active_parameters: None,
            },
            weight_dtype: "bfloat16".into(),
            checkpoint_quantization: None,
            source_url: "https://example.invalid/model".into(),
            license_id: "test-only".into(),
            rope_scaling_json: None,
            native_context_tokens: 40960,
            extended_context_tokens: None,
            artifact_weight_bytes: 1,
            capabilities: BTreeMap::new(),
        };
        profile.profile_id = model_profile_digest(&profile).unwrap();
        profile
    }
    fn seal(profile: &mut ModelProfileV1) {
        profile.profile_id.clear();
        profile.profile_id = model_profile_digest(profile).unwrap();
    }
    #[test]
    fn qwen_32b_kv_is_8_gib() {
        assert_eq!(
            theoretical_sequence_memory(&model(64, 8), 32768, 2)
                .unwrap()
                .kv_cache,
            8 * GIB
        )
    }
    #[test]
    fn qwen_30b_a3b_kv_is_3_gib() {
        assert_eq!(
            theoretical_sequence_memory(&model(48, 4), 32768, 2)
                .unwrap()
                .kv_cache,
            3 * GIB
        )
    }
    #[test]
    fn shared_prefix_is_charged_per_replica_not_per_in_flight_request() {
        let p = model(1, 1);
        let memory = theoretical_prefix_batch_memory(&p, 10, 8, 4, 1, 2).unwrap();
        assert_eq!(memory.kv_cache, 1 * (8 + 2 * 4) * 1 * 128 * 2 * 2);
    }
    #[test]
    fn hybrid_formula() {
        let mut p = model(3, 1);
        p.architecture.layer_groups = vec![
            LayerGroupV1 {
                layers: 1,
                kv_heads: 1,
                head_dim: 1,
                attention: AttentionKind::FullAttention,
            },
            LayerGroupV1 {
                layers: 1,
                kv_heads: 1,
                head_dim: 1,
                attention: AttentionKind::SlidingAttention { window_tokens: 4 },
            },
            LayerGroupV1 {
                layers: 1,
                kv_heads: 1,
                head_dim: 1,
                attention: AttentionKind::Recurrent {
                    state_bytes_per_sequence: 7,
                },
            },
        ];
        seal(&mut p);
        let m = theoretical_sequence_memory(&p, 10, 2).unwrap();
        assert_eq!(m.kv_cache, 56);
        assert_eq!(m.recurrent_state, 7)
    }
    #[test]
    fn invalid_layer_sum_blocks() {
        let mut p = model(2, 1);
        p.architecture.layer_groups[0].layers = 1;
        assert!(validate_model(&p).is_err())
    }

    #[test]
    fn importer_verifies_real_artifact_bytes() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "capacity-curve-import-{}-{unique}",
            std::process::id()
        ));
        fs::create_dir(&root).unwrap();
        fs::write(root.join("weights.bin"), b"weight").unwrap();
        let config = serde_json::json!({
            "model_type":"qwen3", "hidden_size":5120, "num_hidden_layers":64,
            "num_attention_heads":64, "num_key_value_heads":8, "head_dim":128,
            "vocab_size":151936, "intermediate_size":25600,
            "max_position_embeddings":40960, "torch_dtype":"bfloat16"
        });
        fs::write(
            root.join("config.json"),
            serde_json::to_vec(&config).unwrap(),
        )
        .unwrap();
        let artifact_hash = hash(b"weight");
        let manifest = serde_json::json!({
            "repo":"Qwen/Qwen3-32B", "source_url":"https://huggingface.co/Qwen/Qwen3-32B",
            "license_id":"Apache-2.0", "total_weight_bytes":6,
            "files":[{"path":"weights.bin","bytes":6,"sha256":artifact_hash}]
        });
        fs::write(
            root.join("artifacts.json"),
            serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        let imported = import_model(
            &root.join("config.json"),
            &root.join("artifacts.json"),
            &"a".repeat(40),
        )
        .unwrap();
        assert_eq!(imported.architecture.layers, 64);
        assert_eq!(imported.artifact_weight_bytes, 6);
        fs::write(root.join("weights.bin"), b"changed").unwrap();
        assert!(import_model(
            &root.join("config.json"),
            &root.join("artifacts.json"),
            &"a".repeat(40)
        )
        .is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn imports_qwen35_fp8_without_inventing_recurrent_state() {
        let root = std::env::temp_dir().join(format!(
            "capacity-curve-qwen35-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir(&root).unwrap();
        fs::write(root.join("model.safetensors"), b"fp8").unwrap();
        let config = serde_json::json!({
            "model_type":"qwen3_5_moe",
            "quantization_config":{"quant_method":"fp8"},
            "text_config":{
                "model_type":"qwen3_5_moe_text", "hidden_size":2048,
                "num_hidden_layers":4, "num_attention_heads":16,
                "num_key_value_heads":2, "head_dim":256, "vocab_size":248320,
                "max_position_embeddings":262144, "num_experts":256,
                "num_experts_per_tok":8, "moe_intermediate_size":512,
                "shared_expert_intermediate_size":512,
                "layer_types":["linear_attention","linear_attention","linear_attention","full_attention"],
                "linear_num_key_heads":16, "linear_key_head_dim":128
            }
        });
        fs::write(
            root.join("config.json"),
            serde_json::to_vec(&config).unwrap(),
        )
        .unwrap();
        let manifest = serde_json::json!({
            "repo":"Qwen/Qwen3.5-35B-A3B-FP8",
            "source_url":"https://huggingface.co/Qwen/Qwen3.5-35B-A3B-FP8",
            "license_id":"Apache-2.0", "checkpoint_quantization":"fp8",
            "total_weight_bytes":3,
            "files":[{"path":"model.safetensors","bytes":3,"sha256":hash(b"fp8")}]
        });
        fs::write(
            root.join("artifacts.json"),
            serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        let imported = import_model(
            &root.join("config.json"),
            &root.join("artifacts.json"),
            &"9".repeat(40),
        )
        .unwrap();
        assert_eq!(imported.weight_dtype, "float8");
        assert_eq!(imported.architecture.kind, "hybrid_moe");
        assert_eq!(imported.architecture.layer_groups[0].layers, 1);
        assert_eq!(imported.architecture.layer_groups[1].layers, 3);
        assert!(theoretical_sequence_memory(&imported, 32768, 2).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    fn curve_scenario() -> ScenarioV1 {
        let mut model = model(64, 8);
        model
            .capabilities
            .insert("structured_output".into(), CapabilityStatus::Supported);
        seal(&mut model);
        let serving = ServingProfileV1 {
            profile_id: "serving".into(),
            model_profile_id: model.profile_id.clone(),
            runtime_digest: "runtime".into(),
            container_digest: "container".into(),
            tokenizer_digest: "tokenizer".into(),
            template_digest: "template".into(),
            parser_digest: "parser".into(),
            adapter_digest: "adapter".into(),
            weight_dtype: "bfloat16".into(),
            kv_dtype: "bfloat16".into(),
            placement: "accelerator".into(),
            tensor_parallel: 1,
            pipeline_parallel: 1,
            expert_parallel: 1,
            context_tokens: 32768,
            response_tokens: 2048,
            max_in_flight: 8,
            techniques: BTreeSet::new(),
            observed_milli_rps: 50_000,
            ttft_ms: 1,
            latency_ms: 20,
            prefill_tokens_per_second: 1,
            decode_tokens_per_second: 1,
            memory_per_replica: MemoryV1 {
                accelerator_resident_weights: 60 * GIB,
                kv_cache: 64 * GIB,
                runtime_reserve: 4 * GIB,
                ..Default::default()
            },
            sample_count: 10,
            observation_window_ms: 60_000,
            metric_policy: MetricPolicyV1 {
                ttft_percentile_milli: 950,
                latency_percentile_milli: 950,
                memory_statistic: "peak".into(),
            },
            observation_refs: vec![ObservationRefV1 {
                run_id: "run".into(),
                manifest_sha256: "0".repeat(64),
                raw_evidence_sha256: BTreeMap::new(),
            }],
        };
        let cognitive = CognitiveProfileV1 {
            bundle_id: "bundle".into(),
            serving_profile_id: "serving".into(),
            workload_digest: "work".into(),
            pipeline_digest: "pipeline".into(),
            gates_digest: "gates".into(),
            pipeline_shape: PipelineShapeV1 {
                distill_workers: 10,
                proposal_tracks: vec![
                    ProposalTrackV1 {
                        track_id: "grounded".into(),
                        workers: 10,
                    },
                    ProposalTrackV1 {
                        track_id: "adversarial".into(),
                        workers: 10,
                    },
                    ProposalTrackV1 {
                        track_id: "synthetic".into(),
                        workers: 10,
                    },
                ],
                tournament_workers: 10,
            },
            observed_milli_rps: 50_000,
            workers: 50,
            inference_points: 25,
            serving_replicas: 1,
            available_shards: vec!["s1".into(), "s2".into()],
            facets: BTreeMap::from([("coverage".into(), 1)]),
            accepted_unique_evidence: 10,
            accepted_evidence_ids: (0..10).map(|i| format!("e{i}")).collect(),
            observation_window_ms: 60_000,
            sample_count: 10,
            max_scale_copies: 1,
            gates: GateObservationsV1 {
                language_quality_milli: 900,
                drift_ppm: 10,
                collision_ppm: 10,
                collapse_ppm: 10,
                premature_abstraction_ppm: 10,
            },
            observation_refs: vec![ObservationRefV1 {
                run_id: "run".into(),
                manifest_sha256: "0".repeat(64),
                raw_evidence_sha256: BTreeMap::new(),
            }],
        };
        ScenarioV1 {
            schema: "capacity-curve/scenario/v1".into(),
            workload_digest: "work".into(),
            pipeline_digest: "pipeline".into(),
            gates_digest: "gates".into(),
            context_tokens: 32768,
            response_tokens: 2048,
            target_milli_rps: vec![50_000, 70_000, 100_000],
            required_capabilities: vec!["structured_output".into()],
            required_facets: BTreeMap::from([("coverage".into(), 1)]),
            serving_requirements: None,
            gates: RequiredGatesV1 {
                min_language_quality_milli: 800,
                max_drift_ppm: 100,
                max_collision_ppm: 100,
                max_collapse_ppm: 100,
                max_premature_abstraction_ppm: 100,
            },
            budgets: BudgetsV1 {
                memory_bytes: 144 * GIB,
                serving_replicas: 2,
                inference_points: 50,
                workers: 100,
            },
            max_cost_microunits_per_hour: None,
            min_observation_samples: 1,
            search_limit: 100,
            candidates: vec![CandidateV1 {
                model,
                serving: vec![serving],
                cognitive: vec![cognitive],
                costs: vec![],
            }],
        }
    }

    #[test]
    fn optimizer_never_projects_50_rps_observation_to_70_or_100() {
        let result = plan(&curve_scenario()).unwrap();
        assert_eq!(result.points.len(), 3);
        assert_eq!(result.points[0].status, "feasible");
        assert_eq!(result.points[0].allocations[0].copies, 1);
        assert_eq!(result.points[1].status, "infeasible");
        assert_eq!(result.points[2].status, "infeasible");
        assert_eq!(result.saturation_target_milli_rps, Some(50_000));
    }

    #[test]
    fn unknown_required_capability_blocks_every_curve_point() {
        let mut scenario = curve_scenario();
        scenario.candidates[0]
            .model
            .capabilities
            .insert("structured_output".into(), CapabilityStatus::Unknown);
        seal(&mut scenario.candidates[0].model);
        scenario.candidates[0].serving[0].model_profile_id =
            scenario.candidates[0].model.profile_id.clone();
        let result = plan(&scenario).unwrap();
        assert!(result.points.iter().all(|p| p.status == "infeasible"));
    }

    #[test]
    fn cost_budget_requires_observed_cost_and_enforces_limit() {
        let mut scenario = curve_scenario();
        scenario.target_milli_rps = vec![50_000];
        scenario.max_cost_microunits_per_hour = Some(100);
        assert_eq!(plan(&scenario).unwrap().points[0].status, "infeasible");
        scenario.candidates[0].costs.push(CostProfileV1 {
            profile_id: "cost".into(),
            serving_profile_id: "serving".into(),
            observed_microunits_per_replica_hour: 200,
            sample_count: 10,
            observation_window_ms: 60_000,
            observation_refs: vec![ObservationRefV1 {
                run_id: "run".into(),
                manifest_sha256: "0".repeat(64),
                raw_evidence_sha256: BTreeMap::new(),
            }],
        });
        assert_eq!(plan(&scenario).unwrap().points[0].status, "infeasible");
        scenario.max_cost_microunits_per_hour = Some(200);
        let result = plan(&scenario).unwrap();
        assert_eq!(result.points[0].status, "feasible");
        assert_eq!(
            result.points[0].observed_cost_microunits_per_hour,
            Some(200)
        );
    }

    #[test]
    fn observed_profiles_are_compared_without_combining_duplicate_evidence() {
        let mut scenario = curve_scenario();
        scenario.target_milli_rps = vec![50_000];
        scenario.budgets.memory_bytes = 300 * GIB;
        let mut a = scenario.candidates[0].cognitive[0].clone();
        a.bundle_id = "a".into();
        a.observed_milli_rps = 50_000;
        a.accepted_unique_evidence = 1;
        a.accepted_evidence_ids = vec!["same".into()];
        a.available_shards = vec!["a-shard".into()];
        let mut b = a.clone();
        b.bundle_id = "b".into();
        b.available_shards = vec!["b-shard".into()];
        scenario.candidates[0].cognitive = vec![a, b];
        let result = plan(&scenario).unwrap();
        let point = &result.points[0];
        assert_eq!(point.status, "feasible");
        assert_eq!(point.allocations.len(), 1);
        assert_eq!(point.accepted_evidence_ids, vec!["same"]);
        assert_eq!(
            point.projected_accepted_unique_evidence_per_minute_milli,
            1000
        );
    }

    #[test]
    fn scenario_profile_references_are_digest_bound_and_confined() {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::env::temp_dir().join(format!(
            "capacity-curve-refs-{}-{unique}",
            std::process::id()
        ));
        fs::create_dir(&root).unwrap();
        let scenario = curve_scenario();
        let candidate = &scenario.candidates[0];
        let model_bytes = serde_json::to_vec(&candidate.model).unwrap();
        fs::write(root.join("model.json"), &model_bytes).unwrap();
        let serving_bytes = serde_json::to_vec(&candidate.serving[0]).unwrap();
        fs::write(root.join("serving.json"), &serving_bytes).unwrap();
        let cognitive_bytes = serde_json::to_vec(&candidate.cognitive[0]).unwrap();
        fs::write(root.join("cognitive.json"), &cognitive_bytes).unwrap();
        let mut value = serde_json::to_value(&scenario).unwrap();
        value["candidates"] = serde_json::json!([{"model_ref":{"path":"model.json","sha256":hash(&model_bytes)},"serving_refs":[{"path":"serving.json","sha256":hash(&serving_bytes)}],"cognitive_refs":[{"path":"cognitive.json","sha256":hash(&cognitive_bytes)}]}]);
        fs::write(
            root.join("scenario.json"),
            serde_json::to_vec(&value).unwrap(),
        )
        .unwrap();
        assert_eq!(
            load_scenario(&root.join("scenario.json"))
                .unwrap()
                .candidates
                .len(),
            1
        );
        value["candidates"][0]["model_ref"]["path"] = serde_json::json!("../model.json");
        fs::write(
            root.join("escape.json"),
            serde_json::to_vec(&value).unwrap(),
        )
        .unwrap();
        assert!(load_scenario(&root.join("escape.json")).is_err());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn large_observed_curve_routes_to_pareto_frontier_without_combinations() {
        let mut scenario = curve_scenario();
        scenario.target_milli_rps = vec![50_000];
        let template = scenario.candidates[0].cognitive[0].clone();
        scenario.candidates[0].cognitive = (0..33)
            .map(|i| {
                let mut p = template.clone();
                p.bundle_id = format!("bundle-{i:02}");
                p.available_shards = vec![format!("shard-{i:02}")];
                p.accepted_evidence_ids = vec![format!("e-{i:02}")];
                p.accepted_unique_evidence = 1;
                p
            })
            .collect();
        let result = plan(&scenario).unwrap();
        assert_eq!(result.points[0].search_strategy, "pareto_frontier");
        assert_eq!(result.points[0].combinations_examined, 33);
        assert_eq!(result.points[0].allocations.len(), 1);
    }

    #[test]
    fn malformed_pipeline_shape_fails_closed() {
        let mut scenario = curve_scenario();
        scenario.candidates[0].cognitive[0]
            .pipeline_shape
            .proposal_tracks
            .pop();
        assert!(plan(&scenario).is_err());
    }

    #[test]
    fn model_profile_digest_detects_mutation_and_plan_is_deterministic() {
        let mut changed = model(1, 1);
        changed.architecture.hidden_size = 2;
        assert!(validate_model(&changed).is_err());
        let scenario = curve_scenario();
        let a = plan(&scenario).unwrap();
        let b = plan(&scenario).unwrap();
        assert_eq!(
            serde_json::to_vec(&a).unwrap(),
            serde_json::to_vec(&b).unwrap()
        );
        assert_eq!(a.plan_id, b.plan_id);
    }
}
