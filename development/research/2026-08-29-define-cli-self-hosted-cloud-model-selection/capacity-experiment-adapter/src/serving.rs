use crate::{Error, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

pub const CONTEXT_TOKENS: u64 = 32_768;
pub const PROMPT_TOKENS: u64 = 30_720;
pub const RESPONSE_TOKENS: u64 = 2_048;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GpuSampleV1 {
    pub timestamp_ms: u64,
    pub gpu_used_bytes: u64,
    pub gpu_total_bytes: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub engine_kv_cache_bytes: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingMemoryObservationV1 {
    pub weights_artifact_bytes: u64,
    pub idle_gpu_used_bytes: u64,
    pub peak_gpu_used_bytes: u64,
    pub gpu_total_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub engine_kv_cache_bytes: Option<u64>,
    pub unattributed_idle_bytes: u64,
    pub active_memory_delta_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingObservationV1 {
    pub schema: String,
    pub observation_id: String,
    pub experiment_id: String,
    pub model_profile_id: String,
    pub model_revision: String,
    pub vllm_version: String,
    pub runtime_digest: String,
    pub container_digest: String,
    pub container_identity_kind: String,
    pub image_config_digest: String,
    pub execution_snapshot_digest: String,
    pub server_args_digest: String,
    pub benchmark_args_digest: String,
    pub executed_args_digest: String,
    pub gpu_process_snapshot_digest: String,
    pub tokenizer_digest: String,
    pub adapter_digest: String,
    pub gpu_uuid: String,
    pub seed: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cache_metrics_digest: Option<String>,
    pub configuration_digest: String,
    pub weight_dtype: String,
    pub compute_dtype: String,
    pub requested_kv_dtype: String,
    pub kv_dtype: String,
    pub technique: String,
    pub context_tokens: u64,
    pub prompt_tokens: u64,
    pub response_token_budget: u64,
    pub max_concurrency: u64,
    pub observed_max_in_flight: u64,
    pub resident_prefixes: u64,
    pub completed_requests: u64,
    pub failed_requests: u64,
    pub duration_ms: u64,
    pub observed_milli_rps: u64,
    pub prompt_tokens_per_second_milli: u64,
    pub response_tokens_per_second_milli: u64,
    pub p50_ttft_ms: u64,
    pub p95_ttft_ms: u64,
    pub p50_tpot_ms: u64,
    pub p95_tpot_ms: u64,
    pub p50_e2el_ms: u64,
    pub p95_e2el_ms: u64,
    pub memory: ServingMemoryObservationV1,
    pub source_sha256: BTreeMap<String, String>,
    pub evidence_class: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingImportManifestV1 {
    pub schema: String,
    pub experiment_id: String,
    pub model_profile_id: String,
    pub model_revision: String,
    pub vllm_version: String,
    pub runtime_digest: String,
    pub container_digest: String,
    pub container_identity_kind: String,
    pub image_config_digest: String,
    pub execution_snapshot_digest: String,
    pub server_args_digest: String,
    pub benchmark_args_digest: String,
    pub executed_args_digest: String,
    pub gpu_process_snapshot_digest: String,
    pub tokenizer_digest: String,
    pub adapter_digest: String,
    pub gpu_uuid: String,
    pub seed: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub cache_metrics_digest: Option<String>,
    pub weight_dtype: String,
    pub compute_dtype: String,
    pub requested_kv_dtype: String,
    pub kv_dtype: String,
    pub technique: String,
    pub context_tokens: u64,
    pub prompt_tokens: u64,
    pub response_token_budget: u64,
    pub max_concurrency: u64,
    pub resident_prefixes: u64,
    pub observation_start_ms: u64,
    pub observation_end_ms: u64,
    pub weights_artifact_bytes: u64,
    pub idle_gpu_used_bytes: u64,
    pub unrelated_gpu_processes_observed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StableServingPointV1 {
    pub max_concurrency: u64,
    pub observed_max_in_flight: u64,
    pub repetitions: u64,
    pub minimum_observed_milli_rps: u64,
    pub maximum_observed_milli_rps: u64,
    pub repeat_variance_milli: u64,
    pub peak_gpu_used_bytes: u64,
    pub observation_ids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FleetRequirementV1 {
    pub target_milli_rps: u64,
    pub model_call_target_milli_rps: u64,
    pub throughput_replicas: u64,
    pub concurrency_replicas: u64,
    pub required_replicas: u64,
    pub prompt_tokens_per_second: u64,
    pub response_tokens_per_second: u64,
    pub fleet_peak_gpu_memory_bytes: u64,
    pub fleet_weight_artifact_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projected_hourly_microunits: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ServingProjectionV1 {
    pub schema: String,
    pub projection_id: String,
    pub model_profile_id: String,
    pub model_revision: String,
    pub vllm_version: String,
    pub runtime_digest: String,
    pub container_digest: String,
    pub container_identity_kind: String,
    pub image_config_digest: String,
    pub execution_snapshot_digest: String,
    pub tokenizer_digest: String,
    pub adapter_digest: String,
    pub gpu_uuid: String,
    pub seed: u64,
    pub configuration_digest: String,
    pub weight_dtype: String,
    pub compute_dtype: String,
    pub requested_kv_dtype: String,
    pub kv_dtype: String,
    pub technique: String,
    pub context_tokens: u64,
    pub prompt_tokens: u64,
    pub response_token_budget: u64,
    pub active_agents: u64,
    pub inference_points_per_request: u64,
    pub parallel_inference_points_per_request: u64,
    pub headroom_milli: u64,
    pub selected_max_concurrency: u64,
    pub raw_capacity_milli_rps: u64,
    pub usable_capacity_milli_rps: u64,
    pub selected_memory: ServingMemoryObservationV1,
    pub stable_points: Vec<StableServingPointV1>,
    pub requirements: Vec<FleetRequirementV1>,
    pub evidence_class: String,
    pub claim_ceiling: String,
}

#[derive(Debug, Clone)]
pub struct ProjectionOptions {
    pub target_milli_rps: Vec<u64>,
    pub active_agents: u64,
    pub inference_points_per_request: u64,
    pub parallel_inference_points_per_request: u64,
    pub headroom_milli: u64,
    pub min_repetitions: u64,
    pub max_repeat_variance_milli: u64,
    pub replica_hourly_microunits: Option<u64>,
}

pub fn import_vllm(
    result_path: &Path,
    gpu_samples_path: &Path,
    manifest_path: &Path,
) -> Result<ServingObservationV1> {
    let manifest_bytes = fs::read(manifest_path)?;
    let options: ServingImportManifestV1 = serde_json::from_slice(&manifest_bytes)?;
    validate_import_options(&options)?;
    let result_bytes = fs::read(result_path)?;
    let result: Value = serde_json::from_slice(&result_bytes)?;
    let gpu_bytes = fs::read(gpu_samples_path)?;
    let gpu_samples = read_jsonl::<GpuSampleV1>(&gpu_bytes)?;
    let memory = build_memory(&gpu_samples, &options)?;

    let input_lens = u64_array(&result, "input_lens")?;
    let output_lens = u64_array(&result, "output_lens")?;
    let start_times = f64_array(&result, "start_times")?;
    let ttfts = f64_array(&result, "ttfts")?;
    let itls = nested_f64_array(&result, "itls")?;
    let errors = result
        .get("errors")
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid("vLLM detailed result is missing errors".into()))?;
    let sample_count = input_lens.len();
    if sample_count == 0
        || output_lens.len() != sample_count
        || start_times.len() != sample_count
        || ttfts.len() != sample_count
        || itls.len() != sample_count
        || errors.len() != sample_count
    {
        return Err(Error::Invalid(
            "vLLM detailed per-request arrays must be non-empty and equal length".into(),
        ));
    }

    let mut success = Vec::new();
    let mut intervals = Vec::new();
    for index in 0..sample_count {
        if error_present(&errors[index]) {
            continue;
        }
        if input_lens[index] != PROMPT_TOKENS || output_lens[index] != RESPONSE_TOKENS {
            return Err(Error::Invalid(format!(
                "successful request {index} does not match the 30720+2048 token contract"
            )));
        }
        let ttft_ms = seconds_to_ms(ttfts[index], "ttft")?;
        let latency_seconds = ttfts[index] + itls[index].iter().sum::<f64>();
        let e2el_ms = seconds_to_ms(latency_seconds, "e2el")?;
        let tpot_ms = if output_lens[index] > 1 {
            seconds_to_ms(
                (latency_seconds - ttfts[index]) / ((output_lens[index] - 1) as f64),
                "tpot",
            )?
        } else {
            0
        };
        success.push((ttft_ms, tpot_ms, e2el_ms));
        intervals.push((start_times[index], start_times[index] + latency_seconds));
    }
    let completed = u64_field(&result, "completed")?;
    if completed != success.len() as u64 {
        return Err(Error::Invalid(format!(
            "vLLM completed={completed} does not match {} successful detailed samples",
            success.len()
        )));
    }
    if completed == 0 {
        return Err(Error::Invalid(
            "vLLM observation has no successful requests".into(),
        ));
    }
    let duration_ms = seconds_to_ms(f64_field(&result, "duration")?, "duration")?;
    if duration_ms == 0 {
        return Err(Error::Invalid(
            "vLLM duration rounds to zero milliseconds".into(),
        ));
    }
    let total_input = u64_field(&result, "total_input_tokens")?;
    let total_output = u64_field(&result, "total_output_tokens")?;
    if total_input != checked_mul(completed, PROMPT_TOKENS)?
        || total_output != checked_mul(completed, RESPONSE_TOKENS)?
    {
        return Err(Error::Invalid(
            "vLLM aggregate token totals do not match successful detailed samples".into(),
        ));
    }

    let mut ttft = success.iter().map(|x| x.0).collect::<Vec<_>>();
    let mut tpot = success.iter().map(|x| x.1).collect::<Vec<_>>();
    let mut e2el = success.iter().map(|x| x.2).collect::<Vec<_>>();
    let configuration_digest = configuration_digest(&options)?;
    let mut source_sha256 = BTreeMap::new();
    source_sha256.insert("vllm-result.json".into(), hash(&result_bytes));
    source_sha256.insert("gpu-samples.jsonl".into(), hash(&gpu_bytes));
    source_sha256.insert("serving-import-manifest.json".into(), hash(&manifest_bytes));
    let mut observation = ServingObservationV1 {
        schema: "capacity-experiment/serving-observation/v1".into(),
        observation_id: String::new(),
        experiment_id: options.experiment_id.clone(),
        model_profile_id: options.model_profile_id.to_ascii_lowercase(),
        model_revision: options.model_revision.to_ascii_lowercase(),
        vllm_version: options.vllm_version.clone(),
        runtime_digest: options.runtime_digest.to_ascii_lowercase(),
        container_digest: options.container_digest.to_ascii_lowercase(),
        container_identity_kind: options.container_identity_kind.clone(),
        image_config_digest: options.image_config_digest.to_ascii_lowercase(),
        execution_snapshot_digest: options.execution_snapshot_digest.to_ascii_lowercase(),
        server_args_digest: options.server_args_digest.to_ascii_lowercase(),
        benchmark_args_digest: options.benchmark_args_digest.to_ascii_lowercase(),
        executed_args_digest: options.executed_args_digest.to_ascii_lowercase(),
        gpu_process_snapshot_digest: options.gpu_process_snapshot_digest.to_ascii_lowercase(),
        tokenizer_digest: options.tokenizer_digest.to_ascii_lowercase(),
        adapter_digest: options.adapter_digest.to_ascii_lowercase(),
        gpu_uuid: options.gpu_uuid.clone(),
        seed: options.seed,
        cache_metrics_digest: options.cache_metrics_digest.clone(),
        configuration_digest,
        weight_dtype: options.weight_dtype.clone(),
        compute_dtype: options.compute_dtype.clone(),
        requested_kv_dtype: options.requested_kv_dtype.clone(),
        kv_dtype: options.kv_dtype.clone(),
        technique: options.technique.clone(),
        context_tokens: CONTEXT_TOKENS,
        prompt_tokens: PROMPT_TOKENS,
        response_token_budget: RESPONSE_TOKENS,
        max_concurrency: options.max_concurrency,
        observed_max_in_flight: max_in_flight(&intervals)?,
        resident_prefixes: options.resident_prefixes,
        completed_requests: completed,
        failed_requests: sample_count as u64 - completed,
        duration_ms,
        observed_milli_rps: checked_mul(completed, 1_000_000)? / duration_ms,
        prompt_tokens_per_second_milli: checked_mul(total_input, 1_000_000)? / duration_ms,
        response_tokens_per_second_milli: checked_mul(total_output, 1_000_000)? / duration_ms,
        p50_ttft_ms: percentile(&mut ttft, 50),
        p95_ttft_ms: percentile(&mut ttft, 95),
        p50_tpot_ms: percentile(&mut tpot, 50),
        p95_tpot_ms: percentile(&mut tpot, 95),
        p50_e2el_ms: percentile(&mut e2el, 50),
        p95_e2el_ms: percentile(&mut e2el, 95),
        memory,
        source_sha256,
        evidence_class: "observed_single_replica_serving".into(),
    };
    observation.observation_id = digest_without_id(&observation)?;
    Ok(observation)
}

pub fn project_serving(
    observations: &[ServingObservationV1],
    options: &ProjectionOptions,
) -> Result<ServingProjectionV1> {
    validate_projection_options(options)?;
    let first = observations
        .first()
        .ok_or_else(|| Error::Invalid("at least one serving observation is required".into()))?;
    let mut observation_ids = std::collections::BTreeSet::new();
    for observation in observations {
        validate_observation(observation)?;
        if !observation_ids.insert(observation.observation_id.as_str()) {
            return Err(Error::Invalid(
                "duplicate serving observation cannot satisfy repetition gates".into(),
            ));
        }
        if observation.model_profile_id != first.model_profile_id
            || observation.model_revision != first.model_revision
            || observation.vllm_version != first.vllm_version
            || observation.runtime_digest != first.runtime_digest
            || observation.container_digest != first.container_digest
            || observation.container_identity_kind != first.container_identity_kind
            || observation.image_config_digest != first.image_config_digest
            || observation.execution_snapshot_digest != first.execution_snapshot_digest
            || observation.tokenizer_digest != first.tokenizer_digest
            || observation.adapter_digest != first.adapter_digest
            || observation.gpu_uuid != first.gpu_uuid
            || observation.seed != first.seed
            || observation.configuration_digest != first.configuration_digest
            || observation.technique != first.technique
            || observation.weight_dtype != first.weight_dtype
            || observation.compute_dtype != first.compute_dtype
            || observation.requested_kv_dtype != first.requested_kv_dtype
            || observation.kv_dtype != first.kv_dtype
        {
            return Err(Error::Invalid(
                "serving projection cannot mix model, runtime, dtype, or technique identities"
                    .into(),
            ));
        }
    }

    let mut grouped = BTreeMap::<u64, Vec<&ServingObservationV1>>::new();
    for observation in observations {
        grouped
            .entry(observation.max_concurrency)
            .or_default()
            .push(observation);
    }
    let mut stable_points = Vec::new();
    for (concurrency, group) in grouped {
        if group.len() < options.min_repetitions as usize
            || group.iter().any(|x| x.failed_requests != 0)
        {
            continue;
        }
        if group
            .iter()
            .any(|x| x.benchmark_args_digest != group[0].benchmark_args_digest)
        {
            return Err(Error::Invalid(
                "repetitions at one concurrency have different benchmark arguments".into(),
            ));
        }
        let minimum = group
            .iter()
            .map(|x| x.observed_milli_rps)
            .min()
            .unwrap_or(0);
        let maximum = group
            .iter()
            .map(|x| x.observed_milli_rps)
            .max()
            .unwrap_or(0);
        let variance = if minimum == 0 {
            u64::MAX
        } else {
            checked_mul(maximum - minimum, 1_000)? / minimum
        };
        if variance > options.max_repeat_variance_milli {
            continue;
        }
        stable_points.push(StableServingPointV1 {
            max_concurrency: concurrency,
            observed_max_in_flight: group
                .iter()
                .map(|x| x.observed_max_in_flight)
                .min()
                .unwrap_or(0),
            repetitions: group.len() as u64,
            minimum_observed_milli_rps: minimum,
            maximum_observed_milli_rps: maximum,
            repeat_variance_milli: variance,
            peak_gpu_used_bytes: group
                .iter()
                .map(|x| x.memory.peak_gpu_used_bytes)
                .max()
                .unwrap_or(0),
            observation_ids: group.iter().map(|x| x.observation_id.clone()).collect(),
        });
    }
    stable_points.sort_by_key(|x| x.max_concurrency);
    let selected = stable_points
        .iter()
        .max_by_key(|x| (x.minimum_observed_milli_rps, x.observed_max_in_flight))
        .ok_or_else(|| {
            Error::Invalid(
                "no concurrency point satisfies repetition, error, and variance gates".into(),
            )
        })?;
    let usable = checked_mul(selected.minimum_observed_milli_rps, options.headroom_milli)? / 1_000;
    if usable == 0 {
        return Err(Error::Invalid("headroom-adjusted capacity is zero".into()));
    }
    let selected_memory = observations
        .iter()
        .filter(|x| x.max_concurrency == selected.max_concurrency)
        .max_by_key(|x| x.memory.peak_gpu_used_bytes)
        .map(|x| x.memory.clone())
        .ok_or_else(|| Error::Invalid("selected memory observation is missing".into()))?;

    let mut targets = options.target_milli_rps.clone();
    targets.sort_unstable();
    targets.dedup();
    let mut requirements = Vec::new();
    for target in targets {
        let model_call_target = checked_mul(target, options.inference_points_per_request)?;
        let throughput_replicas = div_ceil(model_call_target, usable);
        let required_in_flight = checked_mul(
            options.active_agents,
            options.parallel_inference_points_per_request,
        )?;
        let concurrency_replicas = div_ceil(required_in_flight, selected.observed_max_in_flight);
        let replicas = throughput_replicas.max(concurrency_replicas);
        requirements.push(FleetRequirementV1 {
            target_milli_rps: target,
            model_call_target_milli_rps: model_call_target,
            throughput_replicas,
            concurrency_replicas,
            required_replicas: replicas,
            prompt_tokens_per_second: checked_mul(model_call_target, PROMPT_TOKENS)? / 1_000,
            response_tokens_per_second: checked_mul(model_call_target, RESPONSE_TOKENS)? / 1_000,
            fleet_peak_gpu_memory_bytes: checked_mul(
                replicas,
                selected_memory.peak_gpu_used_bytes,
            )?,
            fleet_weight_artifact_bytes: checked_mul(
                replicas,
                selected_memory.weights_artifact_bytes,
            )?,
            projected_hourly_microunits: options
                .replica_hourly_microunits
                .map(|cost| checked_mul(cost, replicas))
                .transpose()?,
        });
    }

    let mut projection = ServingProjectionV1 {
        schema: "capacity-experiment/serving-projection/v1".into(),
        projection_id: String::new(),
        model_profile_id: first.model_profile_id.clone(),
        model_revision: first.model_revision.clone(),
        vllm_version: first.vllm_version.clone(),
        runtime_digest: first.runtime_digest.clone(),
        container_digest: first.container_digest.clone(),
        container_identity_kind: first.container_identity_kind.clone(),
        image_config_digest: first.image_config_digest.clone(),
        execution_snapshot_digest: first.execution_snapshot_digest.clone(),
        tokenizer_digest: first.tokenizer_digest.clone(),
        adapter_digest: first.adapter_digest.clone(),
        gpu_uuid: first.gpu_uuid.clone(),
        seed: first.seed,
        configuration_digest: first.configuration_digest.clone(),
        weight_dtype: first.weight_dtype.clone(),
        compute_dtype: first.compute_dtype.clone(),
        requested_kv_dtype: first.requested_kv_dtype.clone(),
        kv_dtype: first.kv_dtype.clone(),
        technique: first.technique.clone(),
        context_tokens: CONTEXT_TOKENS,
        prompt_tokens: PROMPT_TOKENS,
        response_token_budget: RESPONSE_TOKENS,
        active_agents: options.active_agents,
        inference_points_per_request: options.inference_points_per_request,
        parallel_inference_points_per_request: options.parallel_inference_points_per_request,
        headroom_milli: options.headroom_milli,
        selected_max_concurrency: selected.max_concurrency,
        raw_capacity_milli_rps: selected.minimum_observed_milli_rps,
        usable_capacity_milli_rps: usable,
        selected_memory,
        stable_points,
        requirements,
        evidence_class: "single_replica_projection".into(),
        claim_ceiling: "serving capacity estimate only; not observed multi-replica scaling, reasoning quality, cognitive pipeline validation, deployment readiness, or cost fact".into(),
    };
    projection.projection_id = digest_without_id(&projection)?;
    Ok(projection)
}

pub fn write_json_create_new<T: Serialize>(path: &Path, value: &T) -> Result<()> {
    let mut file = OpenOptions::new().write(true).create_new(true).open(path)?;
    serde_json::to_writer_pretty(&mut file, value)?;
    file.write_all(b"\n")?;
    file.sync_all()?;
    Ok(())
}

fn validate_import_options(options: &ServingImportManifestV1) -> Result<()> {
    if options.schema != "capacity-experiment/serving-import-manifest/v1"
        || options.experiment_id.is_empty()
        || !valid_semver(&options.vllm_version)
        || !matches!(
            options.container_identity_kind.as_str(),
            "execution_snapshot" | "declared_oci_manifest"
        )
        || !options.gpu_uuid.starts_with("GPU-")
        || options.max_concurrency == 0
        || options.context_tokens != CONTEXT_TOKENS
        || options.prompt_tokens != PROMPT_TOKENS
        || options.response_token_budget != RESPONSE_TOKENS
        || options.observation_end_ms <= options.observation_start_ms
        || options.weights_artifact_bytes == 0
        || options.idle_gpu_used_bytes < options.weights_artifact_bytes
        || options.unrelated_gpu_processes_observed
        || !matches!(
            options.technique.as_str(),
            "uncached" | "prefix_cache_observed"
        )
        || options.weight_dtype.is_empty()
        || options.compute_dtype.is_empty()
        || options.requested_kv_dtype.is_empty()
        || options.kv_dtype.is_empty()
    {
        return Err(Error::Invalid("invalid vLLM import options".into()));
    }
    require_sha("model_profile_id", &options.model_profile_id)?;
    require_sha("runtime_digest", &options.runtime_digest)?;
    require_sha("container_digest", &options.container_digest)?;
    require_sha("image_config_digest", &options.image_config_digest)?;
    require_sha(
        "execution_snapshot_digest",
        &options.execution_snapshot_digest,
    )?;
    require_sha("server_args_digest", &options.server_args_digest)?;
    require_sha("benchmark_args_digest", &options.benchmark_args_digest)?;
    require_sha("executed_args_digest", &options.executed_args_digest)?;
    require_sha(
        "gpu_process_snapshot_digest",
        &options.gpu_process_snapshot_digest,
    )?;
    require_sha("tokenizer_digest", &options.tokenizer_digest)?;
    require_sha("adapter_digest", &options.adapter_digest)?;
    if let Some(digest) = &options.cache_metrics_digest {
        require_sha("cache_metrics_digest", digest)?;
    }
    require_revision(&options.model_revision)?;
    if (options.technique == "uncached" && options.resident_prefixes != 0)
        || (options.technique == "prefix_cache_observed" && options.resident_prefixes == 0)
        || (options.technique == "uncached" && options.cache_metrics_digest.is_some())
        || (options.technique == "prefix_cache_observed" && options.cache_metrics_digest.is_none())
    {
        return Err(Error::Invalid(
            "resident_prefixes must be zero for uncached and non-zero for cached observations"
                .into(),
        ));
    }
    Ok(())
}

fn validate_projection_options(options: &ProjectionOptions) -> Result<()> {
    if options.target_milli_rps.is_empty()
        || options.target_milli_rps.contains(&0)
        || options.active_agents == 0
        || options.inference_points_per_request == 0
        || options.parallel_inference_points_per_request == 0
        || options.parallel_inference_points_per_request > options.inference_points_per_request
        || options.headroom_milli == 0
        || options.headroom_milli > 1_000
        || options.min_repetitions == 0
        || options.max_repeat_variance_milli > 1_000
    {
        return Err(Error::Invalid("invalid serving projection options".into()));
    }
    Ok(())
}

fn valid_semver(value: &str) -> bool {
    let core = value.split(['+', '-']).next().unwrap_or("");
    let parts = core.split('.').collect::<Vec<_>>();
    parts.len() == 3
        && parts
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_digit()))
}

fn validate_observation(observation: &ServingObservationV1) -> Result<()> {
    if observation.schema != "capacity-experiment/serving-observation/v1"
        || observation.observation_id.is_empty()
        || observation.evidence_class != "observed_single_replica_serving"
        || observation.context_tokens != CONTEXT_TOKENS
        || observation.prompt_tokens != PROMPT_TOKENS
        || observation.response_token_budget != RESPONSE_TOKENS
        || observation.max_concurrency == 0
        || observation.observed_max_in_flight == 0
        || observation.observed_milli_rps == 0
    {
        return Err(Error::Invalid("invalid serving observation".into()));
    }
    let mut copy = observation.clone();
    copy.observation_id.clear();
    if observation.observation_id != hash(&serde_json::to_vec(&copy)?) {
        return Err(Error::Invalid(
            "serving observation identity mismatch".into(),
        ));
    }
    Ok(())
}

fn build_memory(
    samples: &[GpuSampleV1],
    options: &ServingImportManifestV1,
) -> Result<ServingMemoryObservationV1> {
    let first = samples
        .first()
        .ok_or_else(|| Error::Invalid("GPU sample stream is empty".into()))?;
    let mut previous = 0;
    let mut peak = 0;
    let mut engine_kv = None;
    for sample in samples {
        if sample.timestamp_ms < previous
            || sample.gpu_total_bytes != first.gpu_total_bytes
            || sample.gpu_used_bytes > sample.gpu_total_bytes
        {
            return Err(Error::Invalid(
                "invalid or inconsistent GPU sample stream".into(),
            ));
        }
        previous = sample.timestamp_ms;
        peak = peak.max(sample.gpu_used_bytes);
        if let Some(value) = sample.engine_kv_cache_bytes {
            engine_kv = Some(engine_kv.unwrap_or(0).max(value));
        }
    }
    if first.timestamp_ms > options.observation_start_ms
        || previous < options.observation_end_ms
        || first.gpu_total_bytes == 0
        || peak < options.idle_gpu_used_bytes
    {
        return Err(Error::Invalid(
            "GPU samples do not contain a valid active-memory peak".into(),
        ));
    }
    Ok(ServingMemoryObservationV1 {
        weights_artifact_bytes: options.weights_artifact_bytes,
        idle_gpu_used_bytes: options.idle_gpu_used_bytes,
        peak_gpu_used_bytes: peak,
        gpu_total_bytes: first.gpu_total_bytes,
        engine_kv_cache_bytes: engine_kv,
        unattributed_idle_bytes: options.idle_gpu_used_bytes - options.weights_artifact_bytes,
        active_memory_delta_bytes: peak - options.idle_gpu_used_bytes,
    })
}

fn configuration_digest(options: &ServingImportManifestV1) -> Result<String> {
    let value = serde_json::json!({
        "model_profile_id": options.model_profile_id.to_ascii_lowercase(),
        "model_revision": options.model_revision.to_ascii_lowercase(),
        "vllm_version": options.vllm_version,
        "runtime_digest": options.runtime_digest.to_ascii_lowercase(),
        "container_digest": options.container_digest.to_ascii_lowercase(),
        "container_identity_kind": options.container_identity_kind,
        "image_config_digest": options.image_config_digest.to_ascii_lowercase(),
        "execution_snapshot_digest": options.execution_snapshot_digest.to_ascii_lowercase(),
        "server_args_digest": options.server_args_digest.to_ascii_lowercase(),
        "tokenizer_digest": options.tokenizer_digest.to_ascii_lowercase(),
        "adapter_digest": options.adapter_digest.to_ascii_lowercase(),
        "gpu_uuid": options.gpu_uuid,
        "seed": options.seed,
        "weight_dtype": options.weight_dtype,
        "compute_dtype": options.compute_dtype,
        "requested_kv_dtype": options.requested_kv_dtype,
        "kv_dtype": options.kv_dtype,
        "technique": options.technique,
        "resident_prefixes": options.resident_prefixes,
        "context_tokens": CONTEXT_TOKENS,
        "prompt_tokens": PROMPT_TOKENS,
        "response_tokens": RESPONSE_TOKENS,
    });
    Ok(hash(&serde_json::to_vec(&value)?))
}

fn max_in_flight(intervals: &[(f64, f64)]) -> Result<u64> {
    let mut events = Vec::with_capacity(intervals.len() * 2);
    for (start, end) in intervals {
        if !start.is_finite() || !end.is_finite() || *start < 0.0 || end < start {
            return Err(Error::Invalid("invalid per-request timing interval".into()));
        }
        events.push((*start, 1i8));
        events.push((*end, -1i8));
    }
    events.sort_by(|left, right| {
        left.0
            .total_cmp(&right.0)
            .then_with(|| left.1.cmp(&right.1))
    });
    let mut current = 0i64;
    let mut peak = 0i64;
    for (_, delta) in events {
        current += i64::from(delta);
        if current < 0 {
            return Err(Error::Invalid(
                "request timing events are inconsistent".into(),
            ));
        }
        peak = peak.max(current);
    }
    u64::try_from(peak).map_err(|_| Error::Invalid("in-flight count overflow".into()))
}

fn error_present(value: &Value) -> bool {
    match value {
        Value::Null => false,
        Value::String(text) => !text.is_empty(),
        _ => true,
    }
}

fn u64_field(value: &Value, name: &str) -> Result<u64> {
    value
        .get(name)
        .and_then(Value::as_u64)
        .ok_or_else(|| Error::Invalid(format!("vLLM result field {name} is missing or invalid")))
}

fn f64_field(value: &Value, name: &str) -> Result<f64> {
    let number = value
        .get(name)
        .and_then(Value::as_f64)
        .ok_or_else(|| Error::Invalid(format!("vLLM result field {name} is missing or invalid")))?;
    if !number.is_finite() || number < 0.0 {
        return Err(Error::Invalid(format!(
            "vLLM result field {name} is not finite and non-negative"
        )));
    }
    Ok(number)
}

fn u64_array(value: &Value, name: &str) -> Result<Vec<u64>> {
    value
        .get(name)
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid(format!("vLLM detailed result is missing {name}")))?
        .iter()
        .map(|item| {
            item.as_u64()
                .ok_or_else(|| Error::Invalid(format!("invalid {name} item")))
        })
        .collect()
}

fn f64_array(value: &Value, name: &str) -> Result<Vec<f64>> {
    value
        .get(name)
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid(format!("vLLM detailed result is missing {name}")))?
        .iter()
        .map(|item| {
            let number = item
                .as_f64()
                .ok_or_else(|| Error::Invalid(format!("invalid {name} item")))?;
            if !number.is_finite() || number < 0.0 {
                return Err(Error::Invalid(format!("invalid {name} item")));
            }
            Ok(number)
        })
        .collect()
}

fn nested_f64_array(value: &Value, name: &str) -> Result<Vec<Vec<f64>>> {
    value
        .get(name)
        .and_then(Value::as_array)
        .ok_or_else(|| Error::Invalid(format!("vLLM detailed result is missing {name}")))?
        .iter()
        .map(|outer| {
            outer
                .as_array()
                .ok_or_else(|| Error::Invalid(format!("invalid {name} request item")))?
                .iter()
                .map(|item| {
                    let number = item
                        .as_f64()
                        .ok_or_else(|| Error::Invalid(format!("invalid {name} item")))?;
                    if !number.is_finite() || number < 0.0 {
                        return Err(Error::Invalid(format!("invalid {name} item")));
                    }
                    Ok(number)
                })
                .collect()
        })
        .collect()
}

fn read_jsonl<T: for<'de> Deserialize<'de>>(bytes: &[u8]) -> Result<Vec<T>> {
    let text = std::str::from_utf8(bytes)
        .map_err(|_| Error::Invalid("JSONL stream is not UTF-8".into()))?;
    text.lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| serde_json::from_str(line).map_err(Error::from))
        .collect()
}

fn seconds_to_ms(value: f64, name: &str) -> Result<u64> {
    if !value.is_finite() || value < 0.0 || value > (u64::MAX as f64) / 1_000.0 {
        return Err(Error::Invalid(format!("invalid {name} seconds")));
    }
    Ok((value * 1_000.0).round() as u64)
}

fn percentile(values: &mut [u64], percentile: usize) -> u64 {
    values.sort_unstable();
    let rank = (percentile * values.len()).div_ceil(100).max(1);
    values[rank - 1]
}

fn digest_without_id<T: Serialize>(value: &T) -> Result<String> {
    Ok(hash(&serde_json::to_vec(value)?))
}

fn require_sha(name: &str, value: &str) -> Result<()> {
    if value.len() != 64 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(Error::Invalid(format!(
            "{name} must be a 64-character SHA-256"
        )));
    }
    Ok(())
}

fn require_revision(value: &str) -> Result<()> {
    if value.len() != 40 || !value.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err(Error::Invalid(
            "model_revision must be a 40-character commit".into(),
        ));
    }
    Ok(())
}

fn checked_mul(left: u64, right: u64) -> Result<u64> {
    left.checked_mul(right)
        .ok_or_else(|| Error::Invalid("integer multiplication overflow".into()))
}

fn div_ceil(numerator: u64, denominator: u64) -> u64 {
    numerator / denominator + u64::from(numerator % denominator != 0)
}

fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

pub fn load_observations(paths: &[PathBuf]) -> Result<Vec<ServingObservationV1>> {
    paths
        .iter()
        .map(|path| Ok(serde_json::from_slice(&fs::read(path)?)?))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_dir(name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path = std::env::temp_dir().join(format!("capacity-serving-{name}-{unique}"));
        fs::create_dir(&path).unwrap();
        path
    }

    fn options(concurrency: u64, technique: &str) -> ServingImportManifestV1 {
        ServingImportManifestV1 {
            schema: "capacity-experiment/serving-import-manifest/v1".into(),
            experiment_id: format!("repeat-{concurrency}"),
            model_profile_id: "a".repeat(64),
            model_revision: "b".repeat(40),
            vllm_version: "0.23.0".into(),
            runtime_digest: "c".repeat(64),
            container_digest: "d".repeat(64),
            container_identity_kind: "execution_snapshot".into(),
            image_config_digest: "5".repeat(64),
            execution_snapshot_digest: "d".repeat(64),
            server_args_digest: "e".repeat(64),
            benchmark_args_digest: format!("{concurrency:064x}"),
            executed_args_digest: "1".repeat(64),
            gpu_process_snapshot_digest: "2".repeat(64),
            tokenizer_digest: "3".repeat(64),
            adapter_digest: "4".repeat(64),
            gpu_uuid: "GPU-fixture".into(),
            seed: 0,
            cache_metrics_digest: (technique == "prefix_cache_observed").then(|| "f".repeat(64)),
            weight_dtype: "bfloat16".into(),
            compute_dtype: "bfloat16".into(),
            requested_kv_dtype: "auto".into(),
            kv_dtype: "bfloat16".into(),
            technique: technique.into(),
            context_tokens: CONTEXT_TOKENS,
            prompt_tokens: PROMPT_TOKENS,
            response_token_budget: RESPONSE_TOKENS,
            max_concurrency: concurrency,
            resident_prefixes: u64::from(technique == "prefix_cache_observed") * 10,
            observation_start_ms: 1,
            observation_end_ms: 2,
            weights_artifact_bytes: 60,
            idle_gpu_used_bytes: 70,
            unrelated_gpu_processes_observed: false,
        }
    }

    fn write_manifest(dir: &Path, manifest: &ServingImportManifestV1) -> PathBuf {
        let path = dir.join("manifest.json");
        fs::write(&path, serde_json::to_vec(manifest).unwrap()).unwrap();
        path
    }

    fn reidentify(observation: &mut ServingObservationV1) {
        observation.observation_id.clear();
        observation.observation_id = digest_without_id(observation).unwrap();
    }

    fn write_fixture(dir: &Path, failed: bool) -> (PathBuf, PathBuf) {
        let result = serde_json::json!({
            "duration": 4.0,
            "completed": if failed { 1 } else { 2 },
            "total_input_tokens": if failed { 30720 } else { 61440 },
            "total_output_tokens": if failed { 2048 } else { 4096 },
            "input_lens": [30720, 30720],
            "output_lens": [2048, if failed { 0 } else { 2048 }],
            "start_times": [1.0, 1.1],
            "ttfts": [0.5, 0.7],
            "itls": [[0.01, 0.01], [0.02]],
            "errors": [null, if failed { Value::String("boom".into()) } else { Value::Null }]
        });
        let result_path = dir.join("result.json");
        fs::write(&result_path, serde_json::to_vec(&result).unwrap()).unwrap();
        let gpu_path = dir.join("gpu.jsonl");
        fs::write(
            &gpu_path,
            b"{\"timestamp_ms\":1,\"gpu_used_bytes\":70,\"gpu_total_bytes\":200}\n{\"timestamp_ms\":2,\"gpu_used_bytes\":120,\"gpu_total_bytes\":200,\"engine_kv_cache_bytes\":40}\n",
        )
        .unwrap();
        (result_path, gpu_path)
    }

    #[test]
    fn imports_detailed_vllm_without_inventing_memory_components() {
        let dir = temp_dir("import");
        let (result, gpu) = write_fixture(&dir, false);
        let manifest = write_manifest(&dir, &options(2, "uncached"));
        let observation = import_vllm(&result, &gpu, &manifest).unwrap();
        assert_eq!(observation.completed_requests, 2);
        assert_eq!(observation.observed_milli_rps, 500);
        assert_eq!(observation.memory.engine_kv_cache_bytes, Some(40));
        assert_eq!(observation.memory.unattributed_idle_bytes, 10);
        assert_eq!(observation.memory.active_memory_delta_bytes, 50);
        assert_eq!(
            observation.evidence_class,
            "observed_single_replica_serving"
        );
    }

    #[test]
    fn projection_uses_minimum_repeat_and_both_replica_constraints() {
        let mut observations = Vec::new();
        for repeat in 0..2 {
            let dir = temp_dir(&format!("projection-{repeat}"));
            let (result, gpu) = write_fixture(&dir, false);
            let manifest = write_manifest(&dir, &options(8, "uncached"));
            let mut observation = import_vllm(&result, &gpu, &manifest).unwrap();
            observation.experiment_id = format!("repeat-{repeat}");
            reidentify(&mut observation);
            observations.push(observation);
        }
        let projection = project_serving(
            &observations,
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 1,
                parallel_inference_points_per_request: 1,
                headroom_milli: 800,
                min_repetitions: 2,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: Some(10),
            },
        )
        .unwrap();
        assert_eq!(projection.usable_capacity_milli_rps, 400);
        assert_eq!(projection.requirements[0].throughput_replicas, 125);
        assert_eq!(projection.requirements[0].concurrency_replicas, 50);
        assert_eq!(projection.requirements[0].required_replicas, 125);
        assert_eq!(projection.evidence_class, "single_replica_projection");
    }

    #[test]
    fn projection_rejects_mixed_techniques() {
        let mut observations = Vec::new();
        for technique in ["uncached", "prefix_cache_observed"] {
            let dir = temp_dir(technique);
            let (result, gpu) = write_fixture(&dir, false);
            let manifest = write_manifest(&dir, &options(2, technique));
            observations.push(import_vllm(&result, &gpu, &manifest).unwrap());
        }
        let error = project_serving(
            &observations,
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 1,
                parallel_inference_points_per_request: 1,
                headroom_milli: 800,
                min_repetitions: 1,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: None,
            },
        )
        .unwrap_err();
        assert!(error.to_string().contains("cannot mix"));
    }

    #[test]
    fn failed_requests_cannot_form_a_stable_point() {
        let mut observations = Vec::new();
        for repeat in 0..2 {
            let dir = temp_dir(&format!("failure-{repeat}"));
            let (result, gpu) = write_fixture(&dir, true);
            let mut import = options(2, "uncached");
            import.experiment_id = format!("failed-repeat-{repeat}");
            let manifest = write_manifest(&dir, &import);
            observations.push(import_vllm(&result, &gpu, &manifest).unwrap());
        }
        let error = project_serving(
            &observations,
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 1,
                parallel_inference_points_per_request: 1,
                headroom_milli: 800,
                min_repetitions: 2,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: None,
            },
        )
        .unwrap_err();
        assert!(error.to_string().contains("no concurrency point"));
    }

    #[test]
    fn cached_import_requires_bound_cache_metrics() {
        let dir = temp_dir("cached-metrics");
        let (result, gpu) = write_fixture(&dir, false);
        let mut manifest = options(2, "prefix_cache_observed");
        manifest.cache_metrics_digest = None;
        let manifest = write_manifest(&dir, &manifest);
        let error = import_vllm(&result, &gpu, &manifest).unwrap_err();
        assert!(error.to_string().contains("resident_prefixes"));
    }

    #[test]
    fn projection_rejects_duplicate_evidence_as_repetition() {
        let dir = temp_dir("duplicate");
        let (result, gpu) = write_fixture(&dir, false);
        let manifest = write_manifest(&dir, &options(2, "uncached"));
        let observation = import_vllm(&result, &gpu, &manifest).unwrap();
        let error = project_serving(
            &[observation.clone(), observation],
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 1,
                parallel_inference_points_per_request: 1,
                headroom_milli: 800,
                min_repetitions: 2,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: None,
            },
        )
        .unwrap_err();
        assert!(error.to_string().contains("duplicate serving observation"));
    }

    #[test]
    fn projection_selects_best_conservative_throughput_not_highest_concurrency() {
        let mut observations = Vec::new();
        for (concurrency, rps) in [(2, 500), (8, 300)] {
            for repeat in 0..2 {
                let dir = temp_dir(&format!("selection-{concurrency}-{repeat}"));
                let (result, gpu) = write_fixture(&dir, false);
                let manifest = write_manifest(&dir, &options(concurrency, "uncached"));
                let mut observation = import_vllm(&result, &gpu, &manifest).unwrap();
                observation.experiment_id = format!("c{concurrency}-r{repeat}");
                observation.observed_milli_rps = rps;
                reidentify(&mut observation);
                observations.push(observation);
            }
        }
        let projection = project_serving(
            &observations,
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 1,
                parallel_inference_points_per_request: 1,
                headroom_milli: 800,
                min_repetitions: 2,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: None,
            },
        )
        .unwrap();
        assert_eq!(projection.selected_max_concurrency, 2);
        assert_eq!(projection.raw_capacity_milli_rps, 500);
    }

    #[test]
    fn ten_percent_repeat_boundary_is_inclusive_and_deterministic() {
        let mut observations = Vec::new();
        for (repeat, rps) in [500, 550].into_iter().enumerate() {
            let dir = temp_dir(&format!("variance-{repeat}"));
            let (result, gpu) = write_fixture(&dir, false);
            let manifest = write_manifest(&dir, &options(2, "uncached"));
            let mut observation = import_vllm(&result, &gpu, &manifest).unwrap();
            observation.experiment_id = format!("variance-{repeat}");
            observation.observed_milli_rps = rps;
            reidentify(&mut observation);
            observations.push(observation);
        }
        let options = ProjectionOptions {
            target_milli_rps: vec![50_000, 70_000, 100_000],
            active_agents: 100,
            inference_points_per_request: 1,
            parallel_inference_points_per_request: 1,
            headroom_milli: 800,
            min_repetitions: 2,
            max_repeat_variance_milli: 100,
            replica_hourly_microunits: None,
        };
        let first = project_serving(&observations, &options).unwrap();
        let second = project_serving(&observations, &options).unwrap();
        assert_eq!(first, second);
        assert_eq!(first.stable_points[0].repeat_variance_milli, 100);
        assert_eq!(first.requirements.len(), 3);
    }

    #[test]
    fn inference_points_scale_tokens_and_parallel_points_scale_concurrency() {
        let mut observations = Vec::new();
        for repeat in 0..2 {
            let dir = temp_dir(&format!("points-{repeat}"));
            let (result, gpu) = write_fixture(&dir, false);
            let manifest = write_manifest(&dir, &options(2, "uncached"));
            let mut observation = import_vllm(&result, &gpu, &manifest).unwrap();
            observation.experiment_id = format!("points-{repeat}");
            reidentify(&mut observation);
            observations.push(observation);
        }
        let projection = project_serving(
            &observations,
            &ProjectionOptions {
                target_milli_rps: vec![50_000],
                active_agents: 100,
                inference_points_per_request: 3,
                parallel_inference_points_per_request: 2,
                headroom_milli: 800,
                min_repetitions: 2,
                max_repeat_variance_milli: 100,
                replica_hourly_microunits: None,
            },
        )
        .unwrap();
        let requirement = &projection.requirements[0];
        assert_eq!(requirement.model_call_target_milli_rps, 150_000);
        assert_eq!(requirement.prompt_tokens_per_second, 4_608_000);
        assert_eq!(requirement.response_tokens_per_second, 307_200);
        assert_eq!(requirement.concurrency_replicas, 100);
    }
}
