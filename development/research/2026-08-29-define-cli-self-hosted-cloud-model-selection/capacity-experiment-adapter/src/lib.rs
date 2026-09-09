use capacity_curve::{
    plan, validate_cognitive, validate_serving, BudgetsV1, CognitiveProfileV1, CostProfileV1,
    GateObservationsV1, MemoryV1, MetricPolicyV1, ModelProfileV1, ObservationRefV1,
    PipelineShapeV1, ProposalTrackV1, RequiredGatesV1, ServingProfileV1, ServingRequirementsV1,
};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs::{self, File, OpenOptions};
use std::io::{BufWriter, Write};
use std::path::{Path, PathBuf};

pub mod serving;

#[derive(Debug)]
pub enum Error {
    Invalid(String),
    Io(std::io::Error),
    Json(serde_json::Error),
    Core(capacity_curve::Error),
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Invalid(v) => f.write_str(v),
            Self::Io(v) => v.fmt(f),
            Self::Json(v) => v.fmt(f),
            Self::Core(v) => v.fmt(f),
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
impl From<capacity_curve::Error> for Error {
    fn from(v: capacity_curve::Error) -> Self {
        Self::Core(v)
    }
}
pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RunManifestV1 {
    pub schema: String,
    pub run_id: String,
    pub observation_start_ms: u64,
    pub observation_end_ms: u64,
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
    pub techniques: BTreeSet<String>,
    pub context_tokens: u64,
    pub response_tokens: u64,
    pub workload_digest: String,
    pub pipeline_digest: String,
    pub gates_digest: String,
    pub pipeline_shape: PipelineShapeV1,
    pub serving_replicas: u64,
    pub target_milli_rps: u64,
    pub declared_shards: Vec<String>,
    pub declared_facets: Vec<String>,
    pub ttft_percentile_milli: u64,
    pub latency_percentile_milli: u64,
    pub min_samples: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RequestSampleV1 {
    pub request_id: String,
    pub attempt_id: String,
    pub replica_id: String,
    pub started_ms: u64,
    pub first_token_ms: u64,
    pub completed_ms: u64,
    pub prompt_tokens: u64,
    pub response_tokens: u64,
    pub outcome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RuntimeSampleV1 {
    pub timestamp_ms: u64,
    pub replica_id: String,
    pub accelerator_resident_weights: u64,
    pub host_weight_pool: u64,
    pub expert_cache: u64,
    pub kv_cache: u64,
    pub recurrent_state: u64,
    pub runtime_reserve: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CognitiveEventV1 {
    pub attempt_id: String,
    pub request_id: String,
    pub worker_id: String,
    pub role: String,
    #[serde(default)]
    pub track_id: Option<String>,
    pub point_id: String,
    pub shard_id: String,
    #[serde(default)]
    pub facets: Vec<String>,
    #[serde(default)]
    pub evidence_id: Option<String>,
    #[serde(default)]
    pub evidence_content_sha256: Option<String>,
    pub evaluator_verdict: String,
    pub language_quality_milli: u64,
    pub drift: bool,
    pub collision: bool,
    pub collapse: bool,
    pub premature_abstraction: bool,
    pub timestamp_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CostSampleV1 {
    pub replica_id: String,
    pub component: String,
    pub observed_microunits: u64,
    pub duration_ms: u64,
    pub timestamp_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AdapterReceiptV1 {
    pub schema: String,
    pub run_id: String,
    pub manifest_sha256: String,
    pub raw_evidence_sha256: BTreeMap<String, String>,
    pub accepted_request_samples: u64,
    pub rejected_request_samples: u64,
    pub evaluated_cognitive_samples: u64,
    pub formulas: Vec<String>,
    pub output_sha256: BTreeMap<String, String>,
    pub validation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AdaptedProfilesV1 {
    pub serving: ServingProfileV1,
    pub cognitive: CognitiveProfileV1,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost: Option<CostProfileV1>,
    pub receipt: AdapterReceiptV1,
}

/// Bounded append-only sink for integrations with serving and swarm runtimes.
/// `finish` is the authority boundary: it flushes the raw evidence and validates
/// the complete run before any profile can be emitted.
pub struct JsonlRunSink {
    run_dir: PathBuf,
    request: BufWriter<File>,
    runtime: BufWriter<File>,
    cognitive: BufWriter<File>,
    cost: Option<BufWriter<File>>,
}

impl JsonlRunSink {
    pub fn create(run_dir: &Path) -> Result<Self> {
        let manifest: RunManifestV1 =
            serde_json::from_slice(&fs::read(run_dir.join("run-manifest.json"))?)?;
        validate_manifest(&manifest)?;
        let model: ModelProfileV1 =
            serde_json::from_slice(&fs::read(run_dir.join("model-profile.json"))?)?;
        capacity_curve::validate_model(&model)?;
        if model.profile_id != manifest.model_profile_id {
            return Err(Error::Invalid(
                "manifest/model profile identity mismatch".into(),
            ));
        }
        let raw = run_dir.join("raw");
        fs::create_dir(&raw)?;
        Ok(Self {
            run_dir: run_dir.to_path_buf(),
            request: new_jsonl(&raw.join("request-samples.jsonl"))?,
            runtime: new_jsonl(&raw.join("runtime-samples.jsonl"))?,
            cognitive: new_jsonl(&raw.join("cognitive-events.jsonl"))?,
            cost: None,
        })
    }

    pub fn record_request(&mut self, sample: &RequestSampleV1) -> Result<()> {
        append_jsonl(&mut self.request, sample)
    }

    pub fn record_runtime(&mut self, sample: &RuntimeSampleV1) -> Result<()> {
        append_jsonl(&mut self.runtime, sample)
    }

    pub fn record_cognitive(&mut self, event: &CognitiveEventV1) -> Result<()> {
        append_jsonl(&mut self.cognitive, event)
    }

    pub fn record_cost(&mut self, sample: &CostSampleV1) -> Result<()> {
        if self.cost.is_none() {
            self.cost = Some(new_jsonl(&self.run_dir.join("raw/cost-samples.jsonl"))?);
        }
        append_jsonl(self.cost.as_mut().expect("cost writer initialized"), sample)
    }

    pub fn finish(mut self) -> Result<AdaptedProfilesV1> {
        flush(&mut self.request)?;
        flush(&mut self.runtime)?;
        flush(&mut self.cognitive)?;
        if let Some(cost) = &mut self.cost {
            flush(cost)?;
        }
        build_profiles(&self.run_dir)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScenarioPolicyV1 {
    pub schema: String,
    pub workload_digest: String,
    pub pipeline_digest: String,
    pub gates_digest: String,
    pub context_tokens: u64,
    pub response_tokens: u64,
    pub target_milli_rps: Vec<u64>,
    pub required_capabilities: Vec<String>,
    pub required_facets: BTreeMap<String, u64>,
    pub serving_requirements: ServingRequirementsV1,
    pub gates: RequiredGatesV1,
    pub budgets: BudgetsV1,
    #[serde(default)]
    pub max_cost_microunits_per_hour: Option<u64>,
    pub min_observation_samples: u64,
    pub search_limit: u64,
}

#[derive(Debug, Clone, Serialize)]
struct FileRefV1 {
    path: String,
    sha256: String,
}

pub fn validate_run(run_dir: &Path) -> Result<()> {
    build_profiles(run_dir).map(|_| ())
}

pub fn adapt_run(run_dir: &Path, out_dir: &Path) -> Result<AdaptedProfilesV1> {
    if out_dir.exists() {
        return Err(Error::Invalid(format!(
            "output directory already exists: {}",
            out_dir.display()
        )));
    }
    let mut built = build_profiles(run_dir)?;
    fs::create_dir_all(out_dir)?;
    let serving = write_json(out_dir.join("serving-profile.json"), &built.serving)?;
    let cognitive = write_json(out_dir.join("cognitive-profile.json"), &built.cognitive)?;
    built
        .receipt
        .output_sha256
        .insert("serving-profile.json".into(), serving);
    built
        .receipt
        .output_sha256
        .insert("cognitive-profile.json".into(), cognitive);
    if let Some(cost) = &built.cost {
        let digest = write_json(out_dir.join("cost-profile.json"), cost)?;
        built
            .receipt
            .output_sha256
            .insert("cost-profile.json".into(), digest);
    }
    write_json(out_dir.join("adapter-receipt.json"), &built.receipt)?;
    Ok(built)
}

pub fn materialize_scenario(policy_path: &Path, run_dir: &Path, out_dir: &Path) -> Result<PathBuf> {
    materialize_scenario_runs(policy_path, &[run_dir.to_path_buf()], out_dir)
}

pub fn materialize_scenario_runs(
    policy_path: &Path,
    run_dirs: &[PathBuf],
    out_dir: &Path,
) -> Result<PathBuf> {
    if out_dir.exists() {
        return Err(Error::Invalid(format!(
            "output directory already exists: {}",
            out_dir.display()
        )));
    }
    let policy: ScenarioPolicyV1 = serde_json::from_slice(&fs::read(policy_path)?)?;
    validate_policy(&policy)?;
    if run_dirs.is_empty() {
        return Err(Error::Invalid(
            "at least one run directory is required".into(),
        ));
    }
    let mut inputs = Vec::new();
    let mut run_ids = BTreeSet::new();
    for run_dir in run_dirs {
        let manifest: RunManifestV1 =
            serde_json::from_slice(&fs::read(run_dir.join("run-manifest.json"))?)?;
        validate_policy_manifest_match(&policy, &manifest)?;
        if !run_ids.insert(manifest.run_id.clone()) {
            return Err(Error::Invalid(format!(
                "duplicate experiment run_id: {}",
                manifest.run_id
            )));
        }
        build_profiles(run_dir)?;
        inputs.push((manifest.model_profile_id, manifest.run_id, run_dir.clone()));
    }
    inputs.sort();

    fs::create_dir(out_dir)?;
    let profiles_dir = out_dir.join("profiles");
    fs::create_dir(&profiles_dir)?;
    type CandidateRefs = (FileRefV1, Vec<FileRefV1>, Vec<FileRefV1>, Vec<FileRefV1>);
    let mut grouped = BTreeMap::<String, CandidateRefs>::new();
    for (index, (model_id, _, run_dir)) in inputs.iter().enumerate() {
        let run_output = profiles_dir.join(format!("run-{index:03}"));
        let adapted = adapt_run(run_dir, &run_output)?;
        let model_bytes = fs::read(run_dir.join("model-profile.json"))?;
        let model_path = run_output.join("model-profile.json");
        fs::write(&model_path, &model_bytes)?;
        let model_ref = file_ref(out_dir, &model_path)?;
        let entry = grouped
            .entry(model_id.clone())
            .or_insert_with(|| (model_ref.clone(), Vec::new(), Vec::new(), Vec::new()));
        if entry.0.sha256 != model_ref.sha256 {
            return Err(Error::Invalid(
                "one model profile ID resolves to different profile bytes".into(),
            ));
        }
        entry
            .1
            .push(file_ref(out_dir, &run_output.join("serving-profile.json"))?);
        entry.2.push(file_ref(
            out_dir,
            &run_output.join("cognitive-profile.json"),
        )?);
        if adapted.cost.is_some() {
            entry
                .3
                .push(file_ref(out_dir, &run_output.join("cost-profile.json"))?);
        }
    }
    let candidates = grouped
        .into_values()
        .map(|(model_ref, serving_refs, cognitive_refs, cost_refs)| {
            serde_json::json!({
                "model_ref": model_ref,
                "serving_refs": serving_refs,
                "cognitive_refs": cognitive_refs,
                "cost_refs": cost_refs
            })
        })
        .collect::<Vec<_>>();
    let scenario = serde_json::json!({
        "schema": "capacity-curve/scenario/v1",
        "workload_digest": policy.workload_digest,
        "pipeline_digest": policy.pipeline_digest,
        "gates_digest": policy.gates_digest,
        "context_tokens": policy.context_tokens,
        "response_tokens": policy.response_tokens,
        "target_milli_rps": policy.target_milli_rps,
        "required_capabilities": policy.required_capabilities,
        "required_facets": policy.required_facets,
        "serving_requirements": policy.serving_requirements,
        "gates": policy.gates,
        "budgets": policy.budgets,
        "max_cost_microunits_per_hour": policy.max_cost_microunits_per_hour,
        "min_observation_samples": policy.min_observation_samples,
        "search_limit": policy.search_limit,
        "candidates": candidates
    });
    let scenario_path = out_dir.join("scenario.json");
    write_json(scenario_path.clone(), &scenario)?;
    let loaded = capacity_curve::load_scenario(&scenario_path)?;
    let result = plan(&loaded)?;
    if result.points.is_empty() {
        return Err(Error::Invalid(
            "materialized scenario has no curve points".into(),
        ));
    }
    Ok(scenario_path)
}

fn validate_policy(policy: &ScenarioPolicyV1) -> Result<()> {
    if policy.schema != "capacity-experiment/scenario-policy/v1"
        || policy.context_tokens == 0
        || policy.response_tokens >= policy.context_tokens
        || policy.target_milli_rps.is_empty()
        || policy.target_milli_rps.contains(&0)
        || policy.min_observation_samples == 0
        || policy.search_limit == 0
    {
        return Err(Error::Invalid("invalid scenario policy".into()));
    }
    for (name, digest) in [
        ("workload_digest", policy.workload_digest.as_str()),
        ("pipeline_digest", policy.pipeline_digest.as_str()),
        ("gates_digest", policy.gates_digest.as_str()),
        (
            "runtime_digest",
            policy.serving_requirements.runtime_digest.as_str(),
        ),
        (
            "container_digest",
            policy.serving_requirements.container_digest.as_str(),
        ),
        (
            "tokenizer_digest",
            policy.serving_requirements.tokenizer_digest.as_str(),
        ),
        (
            "template_digest",
            policy.serving_requirements.template_digest.as_str(),
        ),
        (
            "parser_digest",
            policy.serving_requirements.parser_digest.as_str(),
        ),
        (
            "adapter_digest",
            policy.serving_requirements.adapter_digest.as_str(),
        ),
    ] {
        require_sha(name, digest)?;
    }
    Ok(())
}

fn validate_policy_manifest_match(policy: &ScenarioPolicyV1, m: &RunManifestV1) -> Result<()> {
    let r = &policy.serving_requirements;
    if policy.workload_digest != m.workload_digest
        || policy.pipeline_digest != m.pipeline_digest
        || policy.gates_digest != m.gates_digest
        || policy.context_tokens != m.context_tokens
        || policy.response_tokens != m.response_tokens
        || r.runtime_digest != m.runtime_digest
        || r.container_digest != m.container_digest
        || r.tokenizer_digest != m.tokenizer_digest
        || r.template_digest != m.template_digest
        || r.parser_digest != m.parser_digest
        || r.adapter_digest != m.adapter_digest
        || r.weight_dtype != m.weight_dtype
        || r.kv_dtype != m.kv_dtype
        || r.placement != m.placement
        || r.tensor_parallel != m.tensor_parallel
        || r.pipeline_parallel != m.pipeline_parallel
        || r.expert_parallel != m.expert_parallel
        || r.techniques != m.techniques
    {
        return Err(Error::Invalid(
            "scenario policy does not exactly match the observed run identity".into(),
        ));
    }
    Ok(())
}

fn file_ref(base: &Path, path: &Path) -> Result<FileRefV1> {
    let relative = path.strip_prefix(base).map_err(|_| {
        Error::Invalid(format!(
            "profile path escapes scenario root: {}",
            path.display()
        ))
    })?;
    let path_string = relative
        .to_str()
        .ok_or_else(|| Error::Invalid("profile path is not UTF-8".into()))?
        .replace('\\', "/");
    Ok(FileRefV1 {
        path: path_string,
        sha256: hash(&fs::read(path)?),
    })
}

pub fn build_profiles(run_dir: &Path) -> Result<AdaptedProfilesV1> {
    let manifest_path = run_dir.join("run-manifest.json");
    let model_path = run_dir.join("model-profile.json");
    let request_path = run_dir.join("raw/request-samples.jsonl");
    let runtime_path = run_dir.join("raw/runtime-samples.jsonl");
    let cognitive_path = run_dir.join("raw/cognitive-events.jsonl");
    let cost_path = run_dir.join("raw/cost-samples.jsonl");
    let manifest_bytes = fs::read(&manifest_path)?;
    let manifest: RunManifestV1 = serde_json::from_slice(&manifest_bytes)?;
    validate_manifest(&manifest)?;
    let model: ModelProfileV1 = serde_json::from_slice(&fs::read(&model_path)?)?;
    if model.profile_id != manifest.model_profile_id {
        return Err(Error::Invalid(
            "manifest/model profile identity mismatch".into(),
        ));
    }
    capacity_curve::validate_model(&model)?;
    let requests: Vec<RequestSampleV1> = read_jsonl(&request_path)?;
    let runtime: Vec<RuntimeSampleV1> = read_jsonl(&runtime_path)?;
    let cognitive_events: Vec<CognitiveEventV1> = read_jsonl(&cognitive_path)?;
    let costs: Vec<CostSampleV1> = if cost_path.exists() {
        read_jsonl(&cost_path)?
    } else {
        Vec::new()
    };
    let mut raw_hashes = BTreeMap::new();
    for (name, path) in [
        ("model-profile.json", model_path.as_path()),
        ("request-samples.jsonl", request_path.as_path()),
        ("runtime-samples.jsonl", runtime_path.as_path()),
        ("cognitive-events.jsonl", cognitive_path.as_path()),
    ] {
        raw_hashes.insert(name.into(), hash(&fs::read(path)?));
    }
    if cost_path.exists() {
        raw_hashes.insert("cost-samples.jsonl".into(), hash(&fs::read(&cost_path)?));
    }
    let observation = ObservationRefV1 {
        run_id: manifest.run_id.clone(),
        manifest_sha256: hash(&manifest_bytes),
        raw_evidence_sha256: raw_hashes.clone(),
    };
    let serving = build_serving(&manifest, &model, &requests, &runtime, observation.clone())?;
    let request_ids = requests
        .iter()
        .map(|request| request.request_id.clone())
        .collect::<BTreeSet<_>>();
    let cognitive = build_cognitive(
        &manifest,
        &serving,
        &cognitive_events,
        &request_ids,
        observation.clone(),
    )?;
    let cost = if costs.is_empty() {
        None
    } else {
        let serving_replica_ids = requests
            .iter()
            .map(|request| request.replica_id.clone())
            .collect::<BTreeSet<_>>();
        Some(build_cost(
            &manifest,
            &serving,
            &costs,
            &serving_replica_ids,
            observation.clone(),
        )?)
    };
    validate_serving(&model, &serving)?;
    validate_cognitive(&cognitive, manifest.min_samples)?;
    let receipt = AdapterReceiptV1 {
        schema: "capacity-experiment/adapter-receipt/v1".into(),
        run_id: manifest.run_id.clone(),
        manifest_sha256: observation.manifest_sha256.clone(),
        raw_evidence_sha256: raw_hashes,
        accepted_request_samples: requests.iter().filter(|r| r.outcome == "success").count() as u64,
        rejected_request_samples: requests.iter().filter(|r| r.outcome != "success").count() as u64,
        evaluated_cognitive_samples: cognitive.sample_count,
        formulas: vec![
            "milli_rps=successful_requests*1000000/observation_window_ms".into(),
            "token_rate=floor(tokens*1000/observation_window_ms)".into(),
            "percentile=nearest_rank_ceil".into(),
            "defect_ppm=defects*1000000/evaluated_events".into(),
            "cost_per_replica_hour=sum(component_hourly_rates)/serving_replicas".into(),
        ],
        output_sha256: BTreeMap::new(),
        validation: "pass".into(),
    };
    Ok(AdaptedProfilesV1 {
        serving,
        cognitive,
        cost,
        receipt,
    })
}

fn validate_manifest(m: &RunManifestV1) -> Result<()> {
    if m.schema != "capacity-experiment/run-manifest/v1"
        || m.run_id.is_empty()
        || m.observation_end_ms <= m.observation_start_ms
        || m.response_tokens >= m.context_tokens
        || m.min_samples == 0
        || m.serving_replicas == 0
        || m.target_milli_rps == 0
    {
        return Err(Error::Invalid(
            "invalid run manifest header/window/budgets".into(),
        ));
    }
    for (name, value) in [
        ("model_profile_id", m.model_profile_id.as_str()),
        ("runtime_digest", m.runtime_digest.as_str()),
        ("container_digest", m.container_digest.as_str()),
        ("tokenizer_digest", m.tokenizer_digest.as_str()),
        ("template_digest", m.template_digest.as_str()),
        ("parser_digest", m.parser_digest.as_str()),
        ("adapter_digest", m.adapter_digest.as_str()),
        ("workload_digest", m.workload_digest.as_str()),
        ("pipeline_digest", m.pipeline_digest.as_str()),
        ("gates_digest", m.gates_digest.as_str()),
    ] {
        require_sha(name, value)?;
    }
    if m.tensor_parallel == 0
        || m.pipeline_parallel == 0
        || m.expert_parallel == 0
        || m.ttft_percentile_milli == 0
        || m.ttft_percentile_milli > 1000
        || m.latency_percentile_milli == 0
        || m.latency_percentile_milli > 1000
    {
        return Err(Error::Invalid(
            "invalid topology or percentile policy".into(),
        ));
    }
    let shards: BTreeSet<_> = m.declared_shards.iter().collect();
    let facets: BTreeSet<_> = m.declared_facets.iter().collect();
    if shards.len() != m.declared_shards.len()
        || shards.is_empty()
        || facets.len() != m.declared_facets.len()
        || facets.is_empty()
    {
        return Err(Error::Invalid(
            "declared shards/facets must be nonempty and unique".into(),
        ));
    }
    Ok(())
}

fn build_serving(
    m: &RunManifestV1,
    model: &ModelProfileV1,
    requests: &[RequestSampleV1],
    runtime: &[RuntimeSampleV1],
    observation: ObservationRefV1,
) -> Result<ServingProfileV1> {
    if requests.is_empty() || runtime.is_empty() {
        return Err(Error::Invalid("serving evidence is empty".into()));
    }
    let mut attempts = BTreeSet::new();
    let mut replicas = BTreeSet::new();
    let mut successes = Vec::new();
    for r in requests {
        if r.request_id.is_empty() || r.attempt_id.is_empty() || !attempts.insert(&r.attempt_id) {
            return Err(Error::Invalid(
                "empty request ID or duplicate attempt ID".into(),
            ));
        }
        replicas.insert(r.replica_id.clone());
        if !matches!(r.outcome.as_str(), "success" | "error" | "timeout" | "oom") {
            return Err(Error::Invalid(format!(
                "unknown request outcome: {}",
                r.outcome
            )));
        }
        if r.prompt_tokens > m.context_tokens - m.response_tokens
            || r.response_tokens > m.response_tokens
            || add(r.prompt_tokens, r.response_tokens)? > m.context_tokens
        {
            return Err(Error::Invalid(format!(
                "request token counts exceed manifest budgets: {}",
                r.request_id
            )));
        }
        if r.started_ms < m.observation_start_ms
            || r.completed_ms > m.observation_end_ms
            || r.started_ms > r.first_token_ms
            || r.first_token_ms > r.completed_ms
        {
            return Err(Error::Invalid(format!(
                "request outside window or timestamps reversed: {}",
                r.request_id
            )));
        }
        if r.outcome == "success" {
            successes.push(r);
        }
    }
    if successes.len() < (m.min_samples as usize) {
        return Err(Error::Invalid(
            "successful request sample is undersized".into(),
        ));
    }
    if replicas.len() as u64 != m.serving_replicas {
        return Err(Error::Invalid(
            "observed replica set does not match manifest".into(),
        ));
    }
    let window = m.observation_end_ms - m.observation_start_ms;
    let observed_milli_rps = mul(successes.len() as u64, 1_000_000)? / window;
    let prompt_tokens = successes
        .iter()
        .try_fold(0u64, |a, r| add(a, r.prompt_tokens))?;
    let response_tokens = successes
        .iter()
        .try_fold(0u64, |a, r| add(a, r.response_tokens))?;
    let ttft: Vec<u64> = successes
        .iter()
        .map(|r| r.first_token_ms - r.started_ms)
        .collect();
    let latency: Vec<u64> = successes
        .iter()
        .map(|r| r.completed_ms - r.started_ms)
        .collect();
    let max_in_flight = max_in_flight_per_replica(&successes)?;
    let memory = peak_memory(m, runtime, &replicas)?;
    let mut profile = ServingProfileV1 {
        profile_id: String::new(),
        model_profile_id: model.profile_id.clone(),
        runtime_digest: m.runtime_digest.clone(),
        container_digest: m.container_digest.clone(),
        tokenizer_digest: m.tokenizer_digest.clone(),
        template_digest: m.template_digest.clone(),
        parser_digest: m.parser_digest.clone(),
        adapter_digest: m.adapter_digest.clone(),
        weight_dtype: m.weight_dtype.clone(),
        kv_dtype: m.kv_dtype.clone(),
        placement: m.placement.clone(),
        tensor_parallel: m.tensor_parallel,
        pipeline_parallel: m.pipeline_parallel,
        expert_parallel: m.expert_parallel,
        context_tokens: m.context_tokens,
        response_tokens: m.response_tokens,
        max_in_flight,
        techniques: m.techniques.clone(),
        observed_milli_rps,
        ttft_ms: percentile(&ttft, m.ttft_percentile_milli)?,
        latency_ms: percentile(&latency, m.latency_percentile_milli)?,
        prefill_tokens_per_second: mul(prompt_tokens, 1000)? / window,
        decode_tokens_per_second: mul(response_tokens, 1000)? / window,
        memory_per_replica: memory,
        sample_count: successes.len() as u64,
        observation_window_ms: window,
        metric_policy: MetricPolicyV1 {
            ttft_percentile_milli: m.ttft_percentile_milli,
            latency_percentile_milli: m.latency_percentile_milli,
            memory_statistic: "peak".into(),
        },
        observation_refs: vec![observation],
    };
    profile.profile_id = profile_digest(&profile)?;
    Ok(profile)
}

fn peak_memory(
    m: &RunManifestV1,
    samples: &[RuntimeSampleV1],
    replicas: &BTreeSet<String>,
) -> Result<MemoryV1> {
    let mut seen = BTreeSet::new();
    let mut peak = MemoryV1::default();
    for s in samples {
        if s.timestamp_ms < m.observation_start_ms || s.timestamp_ms > m.observation_end_ms {
            return Err(Error::Invalid(
                "runtime sample outside observation window".into(),
            ));
        }
        if !replicas.contains(&s.replica_id) {
            return Err(Error::Invalid(
                "runtime sample has undeclared replica".into(),
            ));
        }
        seen.insert(s.replica_id.clone());
        peak.accelerator_resident_weights = peak
            .accelerator_resident_weights
            .max(s.accelerator_resident_weights);
        peak.host_weight_pool = peak.host_weight_pool.max(s.host_weight_pool);
        peak.expert_cache = peak.expert_cache.max(s.expert_cache);
        peak.kv_cache = peak.kv_cache.max(s.kv_cache);
        peak.recurrent_state = peak.recurrent_state.max(s.recurrent_state);
        peak.runtime_reserve = peak.runtime_reserve.max(s.runtime_reserve);
    }
    if &seen != replicas {
        return Err(Error::Invalid("runtime memory is missing a replica".into()));
    }
    Ok(peak)
}

fn max_in_flight_per_replica(samples: &[&RequestSampleV1]) -> Result<u64> {
    let mut per = BTreeMap::<&str, Vec<(u64, i8)>>::new();
    for r in samples {
        per.entry(&r.replica_id)
            .or_default()
            .push((r.started_ms, 1));
        per.entry(&r.replica_id)
            .or_default()
            .push((r.completed_ms, -1));
    }
    let mut global = 0u64;
    for events in per.values_mut() {
        events.sort_by_key(|(t, d)| (*t, -*d));
        let mut current = 0i64;
        let mut peak = 0i64;
        for (_, delta) in events {
            current += *delta as i64;
            if current < 0 {
                return Err(Error::Invalid("invalid in-flight event sequence".into()));
            }
            peak = peak.max(current);
        }
        global = global.max(peak as u64);
    }
    if global == 0 {
        return Err(Error::Invalid("zero observed in-flight".into()));
    }
    Ok(global)
}

fn build_cognitive(
    m: &RunManifestV1,
    serving: &ServingProfileV1,
    events: &[CognitiveEventV1],
    request_ids: &BTreeSet<String>,
    observation: ObservationRefV1,
) -> Result<CognitiveProfileV1> {
    if events.is_empty() {
        return Err(Error::Invalid("cognitive evidence is empty".into()));
    }
    let declared_shards: BTreeSet<_> = m.declared_shards.iter().cloned().collect();
    let declared_facets: BTreeSet<_> = m.declared_facets.iter().cloned().collect();
    let mut attempts = BTreeSet::new();
    let mut worker_roles = BTreeMap::<String, (String, Option<String>)>::new();
    let mut points = BTreeSet::new();
    let mut shards = BTreeSet::new();
    let mut evidence = BTreeMap::<String, (String, BTreeSet<String>)>::new();
    let (mut evaluated, mut language, mut drift, mut collision, mut collapse, mut premature) =
        (0u64, 0u64, 0u64, 0u64, 0u64, 0u64);
    for e in events {
        if e.timestamp_ms < m.observation_start_ms || e.timestamp_ms > m.observation_end_ms {
            return Err(Error::Invalid("cognitive event outside window".into()));
        }
        if !attempts.insert(e.attempt_id.clone()) {
            return Err(Error::Invalid("duplicate cognitive attempt ID".into()));
        }
        if !request_ids.contains(&e.request_id) {
            return Err(Error::Invalid(
                "cognitive event references an unknown request".into(),
            ));
        }
        if !matches!(
            e.evaluator_verdict.as_str(),
            "accepted" | "rejected" | "missing"
        ) || e.language_quality_milli > 1000
        {
            return Err(Error::Invalid(
                "invalid evaluator verdict or language quality".into(),
            ));
        }
        if !declared_shards.contains(&e.shard_id) {
            return Err(Error::Invalid(
                "cognitive event uses undeclared shard".into(),
            ));
        }
        for f in &e.facets {
            if !declared_facets.contains(f) {
                return Err(Error::Invalid(
                    "cognitive event uses undeclared facet".into(),
                ));
            }
        }
        let role = (e.role.clone(), e.track_id.clone());
        if worker_roles
            .insert(e.worker_id.clone(), role.clone())
            .is_some_and(|old| old != role)
        {
            return Err(Error::Invalid(
                "worker appears in incompatible roles".into(),
            ));
        }
        points.insert(e.point_id.clone());
        shards.insert(e.shard_id.clone());
        if e.evaluator_verdict != "missing" {
            evaluated = add(evaluated, 1)?;
            language = add(language, e.language_quality_milli)?;
            drift = add(drift, u64::from(e.drift))?;
            collision = add(collision, u64::from(e.collision))?;
            collapse = add(collapse, u64::from(e.collapse))?;
            premature = add(premature, u64::from(e.premature_abstraction))?;
        }
        if e.evaluator_verdict == "accepted" {
            let id = e
                .evidence_id
                .as_ref()
                .ok_or_else(|| Error::Invalid("accepted event missing evidence ID".into()))?;
            let digest = e.evidence_content_sha256.as_ref().ok_or_else(|| {
                Error::Invalid("accepted event missing evidence content digest".into())
            })?;
            require_sha("evidence_content_sha256", digest)?;
            let entry = evidence
                .entry(id.clone())
                .or_insert_with(|| (digest.clone(), BTreeSet::new()));
            if entry.0 != *digest {
                return Err(Error::Invalid(
                    "one evidence ID has conflicting content digests".into(),
                ));
            }
            entry.1.extend(e.facets.iter().cloned());
        }
    }
    if evaluated < m.min_samples {
        return Err(Error::Invalid(
            "cognitive evaluator sample is undersized".into(),
        ));
    }
    let pipeline = derive_pipeline(&worker_roles)?;
    if pipeline != m.pipeline_shape {
        return Err(Error::Invalid(
            "observed pipeline shape differs from manifest".into(),
        ));
    }
    let mut facet_counts = BTreeMap::new();
    for (_, facets) in evidence.values() {
        for f in facets {
            let count = facet_counts.entry(f.clone()).or_insert(0u64);
            *count = add(*count, 1)?;
        }
    }
    let ppm = |n: u64| -> Result<u64> { Ok(mul(n, 1_000_000)? / evaluated) };
    let accepted_ids = evidence.keys().cloned().collect::<Vec<_>>();
    let mut profile = CognitiveProfileV1 {
        bundle_id: String::new(),
        serving_profile_id: serving.profile_id.clone(),
        workload_digest: m.workload_digest.clone(),
        pipeline_digest: m.pipeline_digest.clone(),
        gates_digest: m.gates_digest.clone(),
        pipeline_shape: pipeline,
        observed_milli_rps: serving.observed_milli_rps,
        workers: worker_roles.len() as u64,
        inference_points: points.len() as u64,
        serving_replicas: m.serving_replicas,
        available_shards: shards.into_iter().collect(),
        facets: facet_counts,
        accepted_unique_evidence: accepted_ids.len() as u64,
        accepted_evidence_ids: accepted_ids,
        observation_window_ms: m.observation_end_ms - m.observation_start_ms,
        sample_count: evaluated,
        max_scale_copies: 1,
        gates: GateObservationsV1 {
            language_quality_milli: language / evaluated,
            drift_ppm: ppm(drift)?,
            collision_ppm: ppm(collision)?,
            collapse_ppm: ppm(collapse)?,
            premature_abstraction_ppm: ppm(premature)?,
        },
        observation_refs: vec![observation],
    };
    profile.bundle_id = profile_digest(&profile)?;
    Ok(profile)
}

fn derive_pipeline(
    workers: &BTreeMap<String, (String, Option<String>)>,
) -> Result<PipelineShapeV1> {
    let mut distill = 0;
    let mut tournament = 0;
    let mut tracks = BTreeMap::<String, u64>::new();
    for (role, track) in workers.values() {
        match role.as_str() {
            "distill" => {
                if track.is_some() {
                    return Err(Error::Invalid(
                        "distill worker cannot have proposal track".into(),
                    ));
                }
                distill += 1
            }
            "proposal" => {
                let id = track
                    .as_ref()
                    .ok_or_else(|| Error::Invalid("proposal worker missing track".into()))?;
                *tracks.entry(id.clone()).or_default() += 1
            }
            "tournament" => {
                if track.is_some() {
                    return Err(Error::Invalid(
                        "tournament worker cannot have proposal track".into(),
                    ));
                }
                tournament += 1
            }
            other => return Err(Error::Invalid(format!("unknown worker role: {other}"))),
        }
    }
    Ok(PipelineShapeV1 {
        distill_workers: distill,
        proposal_tracks: tracks
            .into_iter()
            .map(|(track_id, workers)| ProposalTrackV1 { track_id, workers })
            .collect(),
        tournament_workers: tournament,
    })
}

fn build_cost(
    m: &RunManifestV1,
    serving: &ServingProfileV1,
    samples: &[CostSampleV1],
    serving_replica_ids: &BTreeSet<String>,
    observation: ObservationRefV1,
) -> Result<CostProfileV1> {
    let mut components = BTreeMap::<(String, String), (u64, u64)>::new();
    let mut replicas = BTreeSet::new();
    for s in samples {
        if s.timestamp_ms < m.observation_start_ms
            || s.timestamp_ms > m.observation_end_ms
            || s.duration_ms == 0
            || s.component.is_empty()
            || !serving_replica_ids.contains(&s.replica_id)
        {
            return Err(Error::Invalid(
                "invalid cost sample window/duration/component/replica".into(),
            ));
        }
        replicas.insert(s.replica_id.clone());
        let entry = components
            .entry((s.replica_id.clone(), s.component.clone()))
            .or_default();
        entry.0 = add(entry.0, s.observed_microunits)?;
        entry.1 = add(entry.1, s.duration_ms)?;
    }
    if &replicas != serving_replica_ids || replicas.len() as u64 != m.serving_replicas {
        return Err(Error::Invalid(
            "cost replica set differs from manifest".into(),
        ));
    }
    let total_hourly = components
        .values()
        .try_fold(0u64, |total, (cost, duration)| {
            add(total, mul(*cost, 3_600_000)? / *duration)
        })?;
    let mut profile = CostProfileV1 {
        profile_id: String::new(),
        serving_profile_id: serving.profile_id.clone(),
        observed_microunits_per_replica_hour: total_hourly / m.serving_replicas,
        sample_count: samples.len() as u64,
        observation_window_ms: m.observation_end_ms - m.observation_start_ms,
        observation_refs: vec![observation],
    };
    profile.profile_id = profile_digest(&profile)?;
    Ok(profile)
}

fn percentile(values: &[u64], milli: u64) -> Result<u64> {
    if values.is_empty() || milli == 0 || milli > 1000 {
        return Err(Error::Invalid("invalid percentile input".into()));
    }
    let mut sorted = values.to_vec();
    sorted.sort_unstable();
    let rank = mul(sorted.len() as u64, milli)?.div_ceil(1000).max(1);
    Ok(sorted[(rank - 1) as usize])
}
fn read_jsonl<T: DeserializeOwned>(path: &Path) -> Result<Vec<T>> {
    let text = fs::read_to_string(path)?;
    let mut out = Vec::new();
    for (line_no, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        out.push(
            serde_json::from_str(line)
                .map_err(|e| Error::Invalid(format!("{}:{}: {e}", path.display(), line_no + 1)))?,
        );
    }
    Ok(out)
}
fn new_jsonl(path: &Path) -> Result<BufWriter<File>> {
    Ok(BufWriter::new(
        OpenOptions::new().write(true).create_new(true).open(path)?,
    ))
}
fn append_jsonl<T: Serialize>(writer: &mut BufWriter<File>, value: &T) -> Result<()> {
    serde_json::to_writer(&mut *writer, value)?;
    writer.write_all(b"\n")?;
    Ok(())
}
fn flush(writer: &mut BufWriter<File>) -> Result<()> {
    writer.flush()?;
    writer.get_ref().sync_all()?;
    Ok(())
}
fn write_json<T: Serialize>(path: PathBuf, value: &T) -> Result<String> {
    let mut bytes = serde_json::to_vec_pretty(value)?;
    bytes.push(b'\n');
    fs::write(path, &bytes)?;
    Ok(hash(&bytes))
}
fn profile_digest<T: Serialize>(value: &T) -> Result<String> {
    let mut json = serde_json::to_value(value)?;
    if let Some(object) = json.as_object_mut() {
        for key in ["profile_id", "bundle_id"] {
            if object.contains_key(key) {
                object.insert(key.into(), serde_json::Value::String(String::new()));
            }
        }
    }
    Ok(hash(&serde_json::to_vec(&json)?))
}
fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn require_sha(name: &str, value: &str) -> Result<()> {
    if value.len() != 64 || !value.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Err(Error::Invalid(format!(
            "{name} must be a 64-character SHA-256"
        )));
    }
    Ok(())
}
fn add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b)
        .ok_or_else(|| Error::Invalid("integer addition overflow".into()))
}
fn mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b)
        .ok_or_else(|| Error::Invalid("integer multiplication overflow".into()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT: AtomicU64 = AtomicU64::new(0);

    fn fixture() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("fixtures/single-run")
    }

    fn temporary(label: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "capacity-experiment-{label}-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ))
    }

    fn copy_tree(source: &Path, target: &Path) {
        fs::create_dir(target).unwrap();
        for entry in fs::read_dir(source).unwrap() {
            let entry = entry.unwrap();
            let destination = target.join(entry.file_name());
            if entry.file_type().unwrap().is_dir() {
                copy_tree(&entry.path(), &destination);
            } else {
                fs::copy(entry.path(), destination).unwrap();
            }
        }
    }

    fn mutate(path: &Path, from: &str, to: &str) {
        let original = fs::read_to_string(path).unwrap();
        assert!(original.contains(from), "fixture mutation target is absent");
        fs::write(path, original.replacen(from, to, 1)).unwrap();
    }

    #[test]
    fn frozen_fixture_adapts_with_component_memory_and_provenance() {
        let result = build_profiles(&fixture()).unwrap();
        assert_eq!(result.serving.observed_milli_rps, 1000);
        assert_eq!(result.serving.sample_count, 1);
        assert_eq!(
            result
                .serving
                .memory_per_replica
                .accelerator_resident_weights,
            7
        );
        assert_eq!(result.serving.memory_per_replica.kv_cache, 64);
        assert_eq!(result.cognitive.inference_points, 5);
        assert_eq!(result.cognitive.workers, 5);
        assert_eq!(result.cognitive.accepted_unique_evidence, 1);
        assert_eq!(
            result.cost.unwrap().observed_microunits_per_replica_hour,
            3_600_000
        );
        assert_eq!(result.serving.observation_refs.len(), 1);
        assert_eq!(result.receipt.validation, "pass");
    }

    #[test]
    fn adaptation_is_byte_deterministic() {
        let first = temporary("determinism-a");
        let second = temporary("determinism-b");
        adapt_run(&fixture(), &first).unwrap();
        adapt_run(&fixture(), &second).unwrap();
        for name in [
            "serving-profile.json",
            "cognitive-profile.json",
            "cost-profile.json",
            "adapter-receipt.json",
        ] {
            assert_eq!(
                fs::read(first.join(name)).unwrap(),
                fs::read(second.join(name)).unwrap()
            );
        }
        fs::remove_dir_all(first).unwrap();
        fs::remove_dir_all(second).unwrap();
    }

    #[test]
    fn scenario_references_exact_profiles_and_plans_end_to_end() {
        let output = temporary("scenario");
        let scenario =
            materialize_scenario(&fixture().join("scenario-policy.json"), &fixture(), &output)
                .unwrap();
        let loaded = capacity_curve::load_scenario(&scenario).unwrap();
        let result = capacity_curve::plan(&loaded).unwrap();
        assert_eq!(result.points.len(), 1);
        assert_eq!(result.points[0].status, "feasible");
        assert_eq!(result.points[0].target_milli_rps, 1000);
        fs::remove_dir_all(output).unwrap();
    }

    #[test]
    fn multiple_runs_are_ordered_and_aggregated_deterministically() {
        let run_a = temporary("multi-a");
        let run_b = temporary("multi-b");
        copy_tree(&fixture(), &run_a);
        copy_tree(&fixture(), &run_b);
        mutate(
            &run_b.join("run-manifest.json"),
            "fixture-single-run-v1",
            "fixture-single-run-v2",
        );
        mutate(
            &run_b.join("raw/request-samples.jsonl"),
            "\"first_token_ms\":10",
            "\"first_token_ms\":11",
        );
        let first = temporary("multi-output-a");
        let second = temporary("multi-output-b");
        materialize_scenario_runs(
            &run_a.join("scenario-policy.json"),
            &[run_b.clone(), run_a.clone()],
            &first,
        )
        .unwrap();
        materialize_scenario_runs(
            &run_a.join("scenario-policy.json"),
            &[run_a.clone(), run_b.clone()],
            &second,
        )
        .unwrap();
        assert_eq!(
            fs::read(first.join("scenario.json")).unwrap(),
            fs::read(second.join("scenario.json")).unwrap()
        );
        let loaded = capacity_curve::load_scenario(&first.join("scenario.json")).unwrap();
        assert_eq!(loaded.candidates.len(), 1);
        assert_eq!(loaded.candidates[0].serving.len(), 2);
        fs::remove_dir_all(run_a).unwrap();
        fs::remove_dir_all(run_b).unwrap();
        fs::remove_dir_all(first).unwrap();
        fs::remove_dir_all(second).unwrap();
    }

    #[test]
    fn append_only_sink_collects_and_validates_a_complete_run() {
        let run = temporary("sink");
        copy_tree(&fixture(), &run);
        fs::remove_dir_all(run.join("raw")).unwrap();
        let mut sink = JsonlRunSink::create(&run).unwrap();
        for sample in
            read_jsonl::<RequestSampleV1>(&fixture().join("raw/request-samples.jsonl")).unwrap()
        {
            sink.record_request(&sample).unwrap();
        }
        for sample in
            read_jsonl::<RuntimeSampleV1>(&fixture().join("raw/runtime-samples.jsonl")).unwrap()
        {
            sink.record_runtime(&sample).unwrap();
        }
        for event in
            read_jsonl::<CognitiveEventV1>(&fixture().join("raw/cognitive-events.jsonl")).unwrap()
        {
            sink.record_cognitive(&event).unwrap();
        }
        for sample in read_jsonl::<CostSampleV1>(&fixture().join("raw/cost-samples.jsonl")).unwrap()
        {
            sink.record_cost(&sample).unwrap();
        }
        let result = sink.finish().unwrap();
        assert_eq!(result.serving.observed_milli_rps, 1000);
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn raw_change_changes_profile_identity_and_evidence_digest() {
        let run = temporary("identity-change");
        copy_tree(&fixture(), &run);
        let before = build_profiles(&run).unwrap();
        mutate(
            &run.join("raw/request-samples.jsonl"),
            "\"first_token_ms\":10",
            "\"first_token_ms\":11",
        );
        let after = build_profiles(&run).unwrap();
        assert_ne!(before.serving.profile_id, after.serving.profile_id);
        assert_ne!(
            before.serving.observation_refs[0].raw_evidence_sha256,
            after.serving.observation_refs[0].raw_evidence_sha256
        );
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn missing_cost_is_unknown_not_zero() {
        let run = temporary("no-cost");
        copy_tree(&fixture(), &run);
        fs::remove_file(run.join("raw/cost-samples.jsonl")).unwrap();
        let result = build_profiles(&run).unwrap();
        assert!(result.cost.is_none());
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn cost_components_are_normalized_before_they_are_summed() {
        let run = temporary("cost-components");
        copy_tree(&fixture(), &run);
        let cost_path = run.join("raw/cost-samples.jsonl");
        let mut samples = fs::read_to_string(&cost_path).unwrap();
        samples.push_str("{\"replica_id\":\"replica-1\",\"component\":\"host\",\"observed_microunits\":500,\"duration_ms\":1000,\"timestamp_ms\":1000}\n");
        fs::write(cost_path, samples).unwrap();
        assert_eq!(
            build_profiles(&run)
                .unwrap()
                .cost
                .unwrap()
                .observed_microunits_per_replica_hour,
            5_400_000
        );
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn rejects_unknown_cognitive_request() {
        let run = temporary("unknown-request");
        copy_tree(&fixture(), &run);
        mutate(
            &run.join("raw/cognitive-events.jsonl"),
            "\"request_id\":\"request-1\"",
            "\"request_id\":\"unknown\"",
        );
        assert!(build_profiles(&run).is_err());
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn rejects_duplicate_attempt_and_token_budget_overflow() {
        let duplicate = temporary("duplicate-attempt");
        copy_tree(&fixture(), &duplicate);
        let requests = duplicate.join("raw/request-samples.jsonl");
        let one = fs::read_to_string(&requests).unwrap();
        fs::write(&requests, format!("{one}{one}")).unwrap();
        assert!(build_profiles(&duplicate).is_err());
        fs::remove_dir_all(duplicate).unwrap();

        let overflow = temporary("token-overflow");
        copy_tree(&fixture(), &overflow);
        mutate(
            &overflow.join("raw/request-samples.jsonl"),
            "\"prompt_tokens\":14",
            "\"prompt_tokens\":15",
        );
        assert!(build_profiles(&overflow).is_err());
        fs::remove_dir_all(overflow).unwrap();
    }

    #[test]
    fn rejects_policy_identity_mismatch_before_output() {
        let run = temporary("policy-mismatch-run");
        copy_tree(&fixture(), &run);
        mutate(
            &run.join("scenario-policy.json"),
            &"1".repeat(64),
            &"f".repeat(64),
        );
        let output = temporary("policy-mismatch-output");
        assert!(materialize_scenario(&run.join("scenario-policy.json"), &run, &output).is_err());
        assert!(!output.exists());
        fs::remove_dir_all(run).unwrap();
    }

    #[test]
    fn shipped_schemas_are_valid_json() {
        let schema_root = Path::new(env!("CARGO_MANIFEST_DIR")).join("schemas");
        for name in [
            "run-manifest-v1.schema.json",
            "request-sample-v1.schema.json",
            "runtime-sample-v1.schema.json",
            "cognitive-event-v1.schema.json",
            "cost-sample-v1.schema.json",
            "scenario-policy-v1.schema.json",
            "gpu-sample-v1.schema.json",
            "serving-import-manifest-v1.schema.json",
            "serving-observation-v1.schema.json",
            "serving-projection-v1.schema.json",
        ] {
            let value: serde_json::Value =
                serde_json::from_slice(&fs::read(schema_root.join(name)).unwrap()).unwrap();
            assert_eq!(
                value["$schema"],
                "https://json-schema.org/draft/2020-12/schema"
            );
            if name.starts_with("serving-") {
                assert!(value["$id"]
                    .as_str()
                    .unwrap_or("")
                    .starts_with("https://cyberalchemy.local/schemas/"));
            }
        }
    }
}
