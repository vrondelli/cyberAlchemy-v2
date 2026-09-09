use crate::c19::{evaluate_exact, C19GateInput};
use crate::composite::{compile_l0, validate_compiled_composite, CompiledComposite, ScopeBindings};
use crate::dag::{DagCommand, DagDefinition, DagEngine, NodeEvent};
use crate::host::verify_accepted_history;
use crate::ports::{
    stream_identity, AcceptedHistoryPort, AppendOutcome, FileAcceptedHistory, ResumeDisposition,
    StructuralTransition,
};
use crate::repository::{prepare, RepositoryWorkInput, ToolchainBinding};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io::Write;
use std::os::unix::fs::MetadataExt;
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tempfile::NamedTempFile;

const BINDING_SCHEMA: &str = "cav2-domainspec-l0-execution-binding/v1-candidate";
const REQUEST_SCHEMA: &str = "cav2-domainspec-l0-run-request/v1-candidate";
const PREFLIGHT_NODE: &str = "preflight.L0-B00-01";
const EXPECTED_ONTOLOGY: &str = "cav2.work-orchestration.business";
const EXPECTED_INTENT: &str =
    "implement the exact RWO CLI binding for the adopted Execute Bounded Composite Work capability";

const B00_JS: &str = r#"
const fs = require('fs');
const crypto = require('crypto');
const [productPath, ontologyPath, metaPath, relationshipsPath, baselinePath, profilePath, outputPath] = process.argv.slice(1);
const read = (path) => fs.readFileSync(path);
const parse = (path) => JSON.parse(read(path).toString('utf8'));
const sha = (path) => 'sha256:' + crypto.createHash('sha256').update(read(path)).digest('hex');
const product = parse(productPath);
const ontology = parse(ontologyPath);
const relationships = parse(relationshipsPath);
const baseline = parse(baselinePath);
const profile = parse(profilePath);
const ui = new Set(['Page','Layout','Component','View Model','Hook','Form','Action','Adapter','Guard','Binding','State Indicator']);
const backend = relationships.signatures.filter((item) => !ui.has(item.source_type));
const obligations = [...new Set(relationships.signatures.flatMap((item) => item.validation.obligations))].sort();
const files = [productPath, ontologyPath, profilePath, metaPath, relationshipsPath, baselinePath]
  .map((path) => ({path, sha256: sha(path)})).sort((a,b) => a.path.localeCompare(b.path));
const result = {
  schema_version: 'domainspec.l0-b00-requirement-manifest/v1-candidate',
  status: 'PASS',
  node_id: 'L0-B00-01',
  capability_id: product.capability_id,
  business_ontology_id: ontology.ontology_id,
  business_ontology_status: ontology.status,
  baseline_id: baseline.baseline_id,
  baseline_digest: baseline.baseline_digest,
  denominators: {
    backend_meta_types: baseline.backend_meta_types.length,
    backend_relationships: backend.length,
    active_relationship_signatures: relationships.signature_count,
    ds_d8_obligation_ids: obligations.length
  },
  ds_d8_obligation_ids: obligations,
  node_version: process.version,
  selected_files: files,
  selected_dependency_validation: 'PASS',
  authority_effect: 'none',
  external_effect: 'none',
  claim_ceiling: 'Contained read-only L0-B00-01 candidate evidence only.'
};
fs.writeFileSync(outputPath, JSON.stringify(result) + '\n');
"#;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ArtifactBinding {
    pub path: PathBuf,
    pub sha256: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ExpectedDenominators {
    pub capability_id: String,
    pub business_ontology_id: String,
    pub baseline_id: String,
    pub baseline_digest: String,
    pub backend_meta_types: usize,
    pub backend_relationships: usize,
    pub active_relationship_signatures: usize,
    pub ds_d8_obligation_ids: usize,
    pub node_version: String,
    pub node_sha256: String,
    pub bubblewrap_sha256: String,
    pub toolchain_closure_sha256: BTreeMap<PathBuf, String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct L0ExecutionBinding {
    pub schema_version: String,
    pub binding_id: String,
    pub ontology_id: String,
    pub mapped_preflight_intent: String,
    pub source: ArtifactBinding,
    pub compiled_graph_sha256: String,
    pub preflight_node_id: String,
    pub read_scopes: Vec<PathBuf>,
    pub declared_live_output: PathBuf,
    pub evidence_root: PathBuf,
    pub selected_dependencies: Vec<ArtifactBinding>,
    pub expected: ExpectedDenominators,
    pub scope_bindings: BTreeMap<String, Vec<String>>,
    pub authority_effect: String,
    pub external_effect_authorized: bool,
    pub claim_ceiling: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MutationAuthorization {
    pub authorization_id: String,
    pub graph_sha256: String,
    pub node_id: String,
    pub write_scope: Vec<PathBuf>,
    pub expires_unix_ms: u128,
    pub authority_effect: String,
    pub external_effect_authorized: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct C19ExecutionBinding {
    pub evaluator: ArtifactBinding,
    pub program: ArtifactBinding,
    pub attempt: ArtifactBinding,
    pub program_id: String,
    pub attempt_id: String,
    pub timeout_ms: u64,
    pub max_output_bytes: usize,
    pub are_result: Value,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct L0RunRequest {
    pub schema_version: String,
    pub repository_root: PathBuf,
    pub repository_root_identity: String,
    pub binding_path: PathBuf,
    pub binding_sha256: String,
    pub run_id: String,
    pub run_directory: PathBuf,
    pub absolute_deadline_unix_ms: u128,
    pub toolchain: ToolchainBinding,
    pub c19: Option<C19ExecutionBinding>,
    pub mutation_authorization: Option<MutationAuthorization>,
    pub authority_effect: String,
    pub external_effect: String,
}

struct ValidatedContext {
    request: L0RunRequest,
    binding: L0ExecutionBinding,
    compiled: CompiledComposite,
    repository_root: PathBuf,
    run_directory: PathBuf,
    binding_digest: String,
    stream_identity_value: Value,
    stream_id: String,
    request_bytes: Vec<u8>,
    request_digest: String,
}

fn now_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn sha_bytes(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn sha_file(path: &Path) -> Result<String, String> {
    fs::read(path)
        .map(|bytes| sha_bytes(&bytes))
        .map_err(|error| format!("L0_HASH_FAILED:{}:{error}", path.display()))
}

fn exact_relative(path: &Path) -> bool {
    !path.as_os_str().is_empty()
        && !path.is_absolute()
        && path
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
}

fn valid_run_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 80
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_'))
}

fn ensure_no_links(root: &Path, relative: &Path, may_be_absent: bool) -> Result<(), String> {
    if !exact_relative(relative) {
        return Err(format!("L0_PATH_ESCAPE:{}", relative.display()));
    }
    let mut current = root.to_path_buf();
    for component in relative.components() {
        let Component::Normal(component) = component else {
            return Err(format!("L0_PATH_ESCAPE:{}", relative.display()));
        };
        current.push(component);
        match fs::symlink_metadata(&current) {
            Ok(metadata) if metadata.file_type().is_symlink() => {
                return Err(format!("L0_PATH_LINK_FORBIDDEN:{}", relative.display()))
            }
            Ok(_) => {}
            Err(error) if may_be_absent && error.kind() == std::io::ErrorKind::NotFound => break,
            Err(error) => return Err(format!("L0_PATH_INVALID:{}:{error}", relative.display())),
        }
    }
    Ok(())
}

fn atomic_write_json(path: &Path, value: &Value) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "L0_EVIDENCE_PATH_INVALID".to_owned())?;
    fs::create_dir_all(parent).map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    let mut temporary = NamedTempFile::new_in(parent)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    let bytes = serde_json::to_vec_pretty(value)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    temporary
        .write_all(&bytes)
        .and_then(|_| temporary.write_all(b"\n"))
        .and_then(|_| temporary.as_file().sync_all())
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    temporary
        .persist(path)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    Ok(())
}

fn atomic_write_bytes(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or_else(|| "L0_EVIDENCE_PATH_INVALID".to_owned())?;
    fs::create_dir_all(parent).map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    let mut temporary = NamedTempFile::new_in(parent)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    temporary
        .write_all(bytes)
        .and_then(|_| temporary.as_file().sync_all())
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    temporary
        .persist(path)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    Ok(())
}

fn load_json<T: for<'de> Deserialize<'de>>(path: &Path, code: &str) -> Result<T, String> {
    let bytes = fs::read(path).map_err(|error| format!("{code}:{}:{error}", path.display()))?;
    serde_json::from_slice(&bytes).map_err(|error| format!("{code}:{}:{error}", path.display()))
}

fn unresolved_scope_keys(source: &Value) -> Result<BTreeSet<String>, String> {
    let nodes = source
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or_else(|| "L0_SOURCE_NODES_INVALID".to_owned())?;
    let mut result = BTreeSet::new();
    for node in nodes {
        for field in ["read_scope", "write_scope"] {
            for value in node
                .get(field)
                .and_then(Value::as_array)
                .ok_or_else(|| "L0_SOURCE_SCOPE_INVALID".to_owned())?
            {
                let value = value
                    .as_str()
                    .ok_or_else(|| "L0_SOURCE_SCOPE_INVALID".to_owned())?;
                if !exact_relative(Path::new(value)) || value.chars().any(char::is_whitespace) {
                    result.insert(value.to_owned());
                }
            }
        }
    }
    Ok(result)
}

fn dependency<'a>(
    binding: &'a L0ExecutionBinding,
    suffix: &str,
) -> Result<&'a ArtifactBinding, String> {
    let found = binding
        .selected_dependencies
        .iter()
        .filter(|item| item.path.ends_with(suffix))
        .collect::<Vec<_>>();
    if found.len() != 1 {
        return Err(format!("L0_SELECTED_DEPENDENCY_AMBIGUOUS:{suffix}"));
    }
    Ok(found[0])
}

fn validate_selected_meaning(root: &Path, binding: &L0ExecutionBinding) -> Result<(), String> {
    let product: Value = load_json(
        &root.join(
            dependency(binding, "capability/product-capability.json")?
                .path
                .clone(),
        ),
        "L0_DEPENDENCY_JSON_INVALID",
    )?;
    let ontology: Value = load_json(
        &root.join(
            dependency(binding, "capability/business-ontology.json")?
                .path
                .clone(),
        ),
        "L0_DEPENDENCY_JSON_INVALID",
    )?;
    let baseline: Value = load_json(
        &root.join(
            dependency(binding, "CANONICAL-IMPLEMENTED-BASELINE.v10.json")?
                .path
                .clone(),
        ),
        "L0_DEPENDENCY_JSON_INVALID",
    )?;
    let relationships: Value = load_json(
        &root.join(
            dependency(binding, "relationships/relationships.yml")?
                .path
                .clone(),
        ),
        "L0_DEPENDENCY_JSON_INVALID",
    )?;
    if product.get("capability_id").and_then(Value::as_str) != Some(&binding.expected.capability_id)
        || ontology.get("ontology_id").and_then(Value::as_str)
            != Some(&binding.expected.business_ontology_id)
        || ontology.get("status").and_then(Value::as_str) != Some("owner-adopted")
        || baseline.get("baseline_id").and_then(Value::as_str)
            != Some(&binding.expected.baseline_id)
        || baseline.get("baseline_digest").and_then(Value::as_str)
            != Some(&binding.expected.baseline_digest)
    {
        return Err("L0_SELECTED_DEPENDENCY_IDENTITY_MISMATCH".to_owned());
    }
    let backend_types = baseline
        .get("backend_meta_types")
        .and_then(Value::as_array)
        .map(Vec::len);
    let signatures = relationships
        .get("signatures")
        .and_then(Value::as_array)
        .ok_or_else(|| "L0_RELATIONSHIP_DENOMINATOR_INVALID".to_owned())?;
    let ui = BTreeSet::from([
        "Page",
        "Layout",
        "Component",
        "View Model",
        "Hook",
        "Form",
        "Action",
        "Adapter",
        "Guard",
        "Binding",
        "State Indicator",
    ]);
    let backend_relationships = signatures
        .iter()
        .filter(|item| {
            item.get("source_type")
                .and_then(Value::as_str)
                .is_none_or(|source| !ui.contains(source))
        })
        .count();
    let obligations = signatures
        .iter()
        .flat_map(|item| {
            item.pointer("/validation/obligations")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
        })
        .filter_map(Value::as_str)
        .collect::<BTreeSet<_>>()
        .len();
    if backend_types != Some(binding.expected.backend_meta_types)
        || backend_relationships != binding.expected.backend_relationships
        || signatures.len() != binding.expected.active_relationship_signatures
        || relationships.get("signature_count").and_then(Value::as_u64)
            != Some(binding.expected.active_relationship_signatures as u64)
        || obligations != binding.expected.ds_d8_obligation_ids
    {
        return Err(format!(
            "L0_STALE_DENOMINATOR:types={backend_types:?}:backend_relationships={backend_relationships}:signatures={}:declared={:?}:obligations={obligations}",
            signatures.len(),
            relationships.get("signature_count").and_then(Value::as_u64)
        ));
    }
    Ok(())
}

fn validate_toolchain(binding: &L0ExecutionBinding, request: &L0RunRequest) -> Result<(), String> {
    if !request.toolchain.executable.is_absolute()
        || !request.toolchain.bubblewrap.is_absolute()
        || sha_file(&request.toolchain.executable)? != request.toolchain.executable_sha256
        || sha_file(&request.toolchain.bubblewrap)? != request.toolchain.bubblewrap_sha256
        || request.toolchain.executable_sha256 != binding.expected.node_sha256
        || request.toolchain.bubblewrap_sha256 != binding.expected.bubblewrap_sha256
        || request.toolchain.closure_sha256 != binding.expected.toolchain_closure_sha256
    {
        return Err("L0_TOOLCHAIN_DRIFT".to_owned());
    }
    for (path, digest) in &request.toolchain.closure_sha256 {
        if !path.is_absolute() || sha_file(path)? != *digest {
            return Err(format!("L0_TOOLCHAIN_CLOSURE_DRIFT:{}", path.display()));
        }
    }
    if binding.expected.node_version != "v26.8.1" {
        return Err("L0_TOOLCHAIN_VERSION_BINDING_INVALID".to_owned());
    }
    let version = std::process::Command::new(&request.toolchain.executable)
        .arg("--version")
        .env_clear()
        .output()
        .map_err(|error| format!("L0_TOOLCHAIN_VERSION_FAILED:{error}"))?;
    if !version.status.success()
        || String::from_utf8_lossy(&version.stdout).trim() != binding.expected.node_version
        || !version.stderr.is_empty()
    {
        return Err("L0_TOOLCHAIN_VERSION_MISMATCH".to_owned());
    }
    Ok(())
}

fn validate_request(request_path: &Path) -> Result<ValidatedContext, String> {
    let request_bytes = fs::read(request_path)
        .map_err(|error| format!("L0_REQUEST_INVALID:{}:{error}", request_path.display()))?;
    let request_digest = sha_bytes(&request_bytes);
    let request: L0RunRequest = serde_json::from_slice(&request_bytes)
        .map_err(|error| format!("L0_REQUEST_INVALID:{}:{error}", request_path.display()))?;
    if request.schema_version != REQUEST_SCHEMA
        || request.authority_effect != "none"
        || request.external_effect != "none"
        || !valid_run_id(&request.run_id)
    {
        return Err("L0_REQUEST_ENVELOPE_INVALID".to_owned());
    }
    let root = request
        .repository_root
        .canonicalize()
        .map_err(|error| format!("L0_REPOSITORY_ROOT_INVALID:{error}"))?;
    if crate::repository::repository_root_identity(&root)? != request.repository_root_identity {
        return Err("L0_REPOSITORY_ROOT_DRIFT".to_owned());
    }
    if !exact_relative(&request.binding_path) {
        return Err("L0_BINDING_PATH_INVALID".to_owned());
    }
    ensure_no_links(&root, &request.binding_path, false)?;
    let binding_path = root.join(&request.binding_path);
    let binding_digest = sha_file(&binding_path)?;
    if binding_digest != request.binding_sha256 {
        return Err("L0_BINDING_DIGEST_DRIFT".to_owned());
    }
    let binding: L0ExecutionBinding = load_json(&binding_path, "L0_BINDING_INVALID")?;
    if binding.schema_version != BINDING_SCHEMA
        || binding.ontology_id != EXPECTED_ONTOLOGY
        || binding.mapped_preflight_intent != EXPECTED_INTENT
        || binding.preflight_node_id != PREFLIGHT_NODE
        || binding.authority_effect != "none"
        || binding.external_effect_authorized
    {
        return Err("L0_BINDING_ENVELOPE_INVALID".to_owned());
    }
    if !exact_relative(&binding.source.path)
        || !exact_relative(&binding.evidence_root)
        || !exact_relative(&binding.declared_live_output)
        || binding.read_scopes.is_empty()
        || binding.read_scopes.iter().any(|path| !exact_relative(path))
    {
        return Err("L0_BINDING_SCOPE_INVALID".to_owned());
    }
    let expected_run_directory = binding.evidence_root.join(&request.run_id);
    if request.run_directory != expected_run_directory || !exact_relative(&request.run_directory) {
        return Err("L0_EVIDENCE_SCOPE_EXPANSION".to_owned());
    }
    ensure_no_links(&root, &request.run_directory, true)?;
    for selected in &binding.selected_dependencies {
        if !exact_relative(&selected.path)
            || !binding
                .read_scopes
                .iter()
                .any(|scope| selected.path == *scope || selected.path.starts_with(scope))
        {
            return Err(format!(
                "L0_SELECTED_SCOPE_EXPANSION:{}",
                selected.path.display()
            ));
        }
        ensure_no_links(&root, &selected.path, false)?;
        if sha_file(&root.join(&selected.path))? != selected.sha256 {
            return Err(format!(
                "L0_SELECTED_DEPENDENCY_DRIFT:{}",
                selected.path.display()
            ));
        }
    }
    ensure_no_links(&root, &binding.source.path, false)?;
    let source_bytes = fs::read(root.join(&binding.source.path))
        .map_err(|error| format!("L0_SOURCE_READ_FAILED:{error}"))?;
    if sha_bytes(&source_bytes) != binding.source.sha256 {
        return Err("L0_SOURCE_DIGEST_DRIFT".to_owned());
    }
    let source: Value = serde_json::from_slice(&source_bytes)
        .map_err(|error| format!("L0_SOURCE_JSON_INVALID:{error}"))?;
    if unresolved_scope_keys(&source)?
        != binding
            .scope_bindings
            .keys()
            .cloned()
            .collect::<BTreeSet<_>>()
        || binding.scope_bindings.values().any(|values| {
            values.is_empty() || values.iter().any(|value| !exact_relative(Path::new(value)))
        })
    {
        return Err("L0_SCOPE_BINDING_KEY_SET_MISMATCH".to_owned());
    }
    let compiled = compile_l0(
        &source_bytes,
        &ScopeBindings(binding.scope_bindings.clone()),
    )?;
    validate_compiled_composite(&compiled.value)?;
    if compiled.graph_sha256 != binding.compiled_graph_sha256 {
        return Err("L0_COMPILED_GRAPH_DIGEST_DRIFT".to_owned());
    }
    let node = compiled
        .definition
        .nodes
        .get(PREFLIGHT_NODE)
        .ok_or_else(|| "L0_PREFLIGHT_NODE_MISSING".to_owned())?;
    let reads = node
        .static_input
        .pointer("/work_contract/read_scope")
        .and_then(Value::as_array)
        .ok_or_else(|| "L0_PREFLIGHT_SCOPE_INVALID".to_owned())?
        .iter()
        .filter_map(Value::as_str)
        .map(PathBuf::from)
        .collect::<Vec<_>>();
    let writes = node
        .static_input
        .pointer("/work_contract/write_scope")
        .and_then(Value::as_array)
        .ok_or_else(|| "L0_PREFLIGHT_SCOPE_INVALID".to_owned())?;
    if reads.iter().collect::<BTreeSet<_>>() != binding.read_scopes.iter().collect::<BTreeSet<_>>()
        || writes.len() != 1
        || writes[0].as_str() != binding.declared_live_output.to_str()
    {
        return Err("L0_PREFLIGHT_SCOPE_INVALID".to_owned());
    }
    validate_selected_meaning(&root, &binding)?;
    validate_toolchain(&binding, &request)?;
    if now_ms() >= request.absolute_deadline_unix_ms {
        return Err("GLOBAL_DEADLINE_EXCEEDED".to_owned());
    }
    let stream_identity_value = json!({
        "binding_sha256":binding_digest,
        "graph_sha256":compiled.graph_sha256,
        "run_id":request.run_id,
        "authority_effect":"none",
        "external_effect":"none"
    });
    let stream_id = stream_identity(&stream_identity_value);
    let run_directory = root.join(&request.run_directory);
    Ok(ValidatedContext {
        request,
        binding,
        compiled,
        repository_root: root,
        run_directory,
        binding_digest,
        stream_identity_value,
        stream_id,
        request_bytes,
        request_digest,
    })
}

fn visit_material(
    root: &Path,
    path: &Path,
    out: &mut BTreeMap<String, String>,
) -> Result<(), String> {
    let metadata = fs::symlink_metadata(path)
        .map_err(|error| format!("L0_MATERIAL_INVENTORY_FAILED:{}:{error}", path.display()))?;
    if metadata.file_type().is_symlink() || metadata.is_file() && metadata.nlink() > 1 {
        return Err(format!("L0_MATERIAL_LINK_FORBIDDEN:{}", path.display()));
    }
    if metadata.is_file() {
        let relative = path
            .strip_prefix(root)
            .map_err(|_| "L0_MATERIAL_PATH_ESCAPE".to_owned())?;
        out.insert(relative.to_string_lossy().into_owned(), sha_file(path)?);
    } else if metadata.is_dir() {
        let mut entries = fs::read_dir(path)
            .map_err(|error| format!("L0_MATERIAL_INVENTORY_FAILED:{error}"))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("L0_MATERIAL_INVENTORY_FAILED:{error}"))?;
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            visit_material(root, &entry.path(), out)?;
        }
    } else {
        return Err(format!("L0_MATERIAL_TYPE_FORBIDDEN:{}", path.display()));
    }
    Ok(())
}

fn selected_material(
    root: &Path,
    scopes: &[PathBuf],
) -> Result<(String, BTreeMap<String, String>), String> {
    let mut files = BTreeMap::new();
    for scope in scopes {
        visit_material(root, &root.join(scope), &mut files)?;
    }
    let identity = sha_bytes(
        &serde_json::to_vec(&files).map_err(|error| format!("L0_MATERIAL_HASH_FAILED:{error}"))?,
    );
    Ok((identity, files))
}

fn preflight_receipt(context: &ValidatedContext) -> Result<Value, String> {
    let (material_identity, files) =
        selected_material(&context.repository_root, &context.binding.read_scopes)?;
    Ok(json!({
        "schema_version":"cav2-domainspec-l0-preflight-receipt/v1-candidate",
        "status":"PASS",
        "run_id":context.request.run_id,
        "stream_id":context.stream_id,
        "binding_id":context.binding.binding_id,
        "binding_sha256":context.binding_digest,
        "run_request_sha256":context.request_digest,
        "run_request_path":context.request.run_directory.join("run-request.json"),
        "source_sha256":context.compiled.source_sha256,
        "compiled_graph_sha256":context.compiled.graph_sha256,
        "preflight_node_id":PREFLIGHT_NODE,
        "selected_dependency_validation":"PASS",
        "selected_material_identity":material_identity,
        "selected_material_file_count":files.len(),
        "node_version_required":context.binding.expected.node_version,
        "successor_execution_authorized":false,
        "mutation_authorized":false,
        "authority_effect":"none",
        "external_effect":"none",
        "claim_ceiling":"Preflight validation candidate only; no work command executed and no mutation authorized."
    }))
}

pub fn preflight(request_path: &Path) -> Result<Value, String> {
    let context = validate_request(request_path)?;
    let receipt = preflight_receipt(&context)?;
    if context.run_directory.exists() {
        return validate_existing_preflight(&context, &receipt);
    }
    let parent = context
        .run_directory
        .parent()
        .ok_or_else(|| "L0_EVIDENCE_PATH_INVALID".to_owned())?;
    fs::create_dir_all(parent).map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    let staging = tempfile::Builder::new()
        .prefix(".l0-preflight-")
        .tempdir_in(parent)
        .map_err(|error| format!("L0_EVIDENCE_WRITE_FAILED:{error}"))?;
    atomic_write_bytes(
        &staging.path().join("run-request.json"),
        &context.request_bytes,
    )?;
    atomic_write_json(&staging.path().join("preflight-receipt.json"), &receipt)?;
    match fs::rename(staging.path(), &context.run_directory) {
        Ok(()) => {
            let _ = staging.keep();
        }
        Err(_error) if context.run_directory.exists() => {
            drop(staging);
            return validate_existing_preflight(&context, &receipt);
        }
        Err(error) => return Err(format!("L0_EVIDENCE_WRITE_FAILED:{error}")),
    }
    Ok(receipt)
}

fn validate_existing_preflight(
    context: &ValidatedContext,
    expected_receipt: &Value,
) -> Result<Value, String> {
    let request_path = context.run_directory.join("run-request.json");
    let receipt_path = context.run_directory.join("preflight-receipt.json");
    if request_path.is_file() != receipt_path.is_file() || !request_path.is_file() {
        return Err("L0_PREFLIGHT_PAIR_CORRUPT".to_owned());
    }
    let persisted_request =
        fs::read(&request_path).map_err(|error| format!("L0_PREFLIGHT_PAIR_CORRUPT:{error}"))?;
    if persisted_request != context.request_bytes
        || sha_bytes(&persisted_request) != context.request_digest
    {
        return Err("L0_RUN_REQUEST_DIVERGENT_REUSE".to_owned());
    }
    let persisted_receipt: Value = load_json(&receipt_path, "L0_PREFLIGHT_RECEIPT_CORRUPT")?;
    if persisted_receipt != *expected_receipt {
        return Err("L0_RUN_REQUEST_DIVERGENT_REUSE".to_owned());
    }
    Ok(persisted_receipt)
}

fn command_from_value(value: &Value) -> Result<DagCommand, String> {
    Ok(DagCommand {
        command_id: value
            .get("command_id")
            .and_then(Value::as_str)
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?
            .to_owned(),
        node_id: value
            .get("node_id")
            .and_then(Value::as_str)
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?
            .to_owned(),
        contract: value
            .get("contract")
            .and_then(Value::as_str)
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?
            .to_owned(),
        role_id: value
            .get("role_id")
            .and_then(Value::as_str)
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?
            .to_owned(),
        attempt: value
            .get("attempt")
            .and_then(Value::as_u64)
            .and_then(|value| usize::try_from(value).ok())
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?,
        input: value
            .get("input")
            .cloned()
            .ok_or_else(|| "L0_COMMAND_INVALID".to_owned())?,
    })
}

fn persist_transition(
    history: &mut FileAcceptedHistory,
    stream_id: &str,
    expected_cursor_identity: Option<String>,
    event: Value,
    cursor: Value,
    commands: &[DagCommand],
) -> Result<(), String> {
    let event_id = event
        .get("event_id")
        .and_then(Value::as_str)
        .ok_or_else(|| "L0_EVENT_ID_MISSING".to_owned())?
        .to_owned();
    let transition = StructuralTransition {
        stream_id: stream_id.to_owned(),
        expected_cursor_identity,
        event_id,
        accepted_event: event,
        next_cursor_identity: sha_bytes(
            &serde_json::to_vec(&cursor).map_err(|error| format!("L0_CURSOR_INVALID:{error}"))?,
        ),
        next_cursor: cursor,
        command_intents: commands.iter().map(DagCommand::to_value).collect(),
    };
    match history.compare_and_append(transition) {
        AppendOutcome::Accepted | AppendOutcome::Duplicate => Ok(()),
        AppendOutcome::DivergentDuplicate => Err("L0_HISTORY_DIVERGENT_DUPLICATE".to_owned()),
        AppendOutcome::Conflict => Err("L0_HISTORY_CONFLICT".to_owned()),
    }
}

pub fn require_mutation_authorization(
    graph_sha256: &str,
    node_id: &str,
    write_scope: &[PathBuf],
    authorization: Option<&MutationAuthorization>,
    current_unix_ms: u128,
) -> Result<(), String> {
    let authorization =
        authorization.ok_or_else(|| "L0_MUTATION_AUTHORIZATION_REQUIRED".to_owned())?;
    if authorization.authorization_id.trim().is_empty()
        || authorization.graph_sha256 != graph_sha256
        || authorization.node_id != node_id
        || authorization.write_scope != write_scope
        || authorization.expires_unix_ms <= current_unix_ms
        || authorization.authority_effect != "repository-mutation"
        || authorization.external_effect_authorized
    {
        return Err("L0_MUTATION_AUTHORIZATION_MISMATCH".to_owned());
    }
    Ok(())
}

fn dispatch_gate(
    context: &ValidatedContext,
    command: &DagCommand,
    stage: &str,
) -> Result<NodeEvent, String> {
    let binding = context
        .request
        .c19
        .as_ref()
        .ok_or_else(|| "L0_C19_BINDING_REQUIRED".to_owned())?;
    let resolve = |artifact: &ArtifactBinding| -> Result<PathBuf, String> {
        if !exact_relative(&artifact.path) {
            return Err("L0_C19_PATH_INVALID".to_owned());
        }
        let path = context.repository_root.join(&artifact.path);
        if sha_file(&path)? != artifact.sha256 {
            return Err("L0_C19_DIGEST_DRIFT".to_owned());
        }
        Ok(path)
    };
    let evaluator = resolve(&binding.evaluator)?;
    let program = resolve(&binding.program)?;
    let attempt = resolve(&binding.attempt)?;
    let result = evaluate_exact(C19GateInput {
        node_id: &command.node_id,
        command_id: &command.command_id,
        expected_stage: stage,
        expected_program_id: &binding.program_id,
        expected_attempt_id: &binding.attempt_id,
        repository_root: &context.repository_root,
        evaluator_path: &evaluator,
        evaluator_sha256: binding.evaluator.sha256.trim_start_matches("sha256:"),
        program_path: &program,
        program_sha256: binding.program.sha256.trim_start_matches("sha256:"),
        attempt_path: &attempt,
        attempt_sha256: binding.attempt.sha256.trim_start_matches("sha256:"),
        timeout: Duration::from_millis(binding.timeout_ms),
        max_output_bytes: binding.max_output_bytes,
        are_result: &binding.are_result,
    });
    Ok(result.event)
}

fn validate_requirement_manifest(context: &ValidatedContext, path: &Path) -> Result<Value, String> {
    let value: Value = load_json(path, "L0_REQUIREMENT_MANIFEST_INVALID")?;
    let expected = &context.binding.expected;
    if value.get("status").and_then(Value::as_str) != Some("PASS")
        || value.get("node_id").and_then(Value::as_str) != Some("L0-B00-01")
        || value.get("capability_id").and_then(Value::as_str) != Some(&expected.capability_id)
        || value.get("business_ontology_id").and_then(Value::as_str)
            != Some(&expected.business_ontology_id)
        || value
            .get("business_ontology_status")
            .and_then(Value::as_str)
            != Some("owner-adopted")
        || value.get("baseline_id").and_then(Value::as_str) != Some(&expected.baseline_id)
        || value.get("baseline_digest").and_then(Value::as_str) != Some(&expected.baseline_digest)
        || value
            .pointer("/denominators/backend_meta_types")
            .and_then(Value::as_u64)
            != Some(expected.backend_meta_types as u64)
        || value
            .pointer("/denominators/backend_relationships")
            .and_then(Value::as_u64)
            != Some(expected.backend_relationships as u64)
        || value
            .pointer("/denominators/active_relationship_signatures")
            .and_then(Value::as_u64)
            != Some(expected.active_relationship_signatures as u64)
        || value
            .pointer("/denominators/ds_d8_obligation_ids")
            .and_then(Value::as_u64)
            != Some(expected.ds_d8_obligation_ids as u64)
        || value.get("node_version").and_then(Value::as_str) != Some(&expected.node_version)
        || value.get("authority_effect").and_then(Value::as_str) != Some("none")
        || value.get("external_effect").and_then(Value::as_str) != Some("none")
    {
        return Err("L0_REQUIREMENT_MANIFEST_MISMATCH".to_owned());
    }
    Ok(value)
}

fn execute_b00(
    context: &ValidatedContext,
    command: &DagCommand,
    material_files: &BTreeMap<String, String>,
) -> Result<(Value, Value), String> {
    if command.node_id != PREFLIGHT_NODE
        || command.contract != "preflight"
        || command.role_id != "repository-work"
    {
        return Err("L0_EXECUTION_TARGET_NOT_AUTHORIZED".to_owned());
    }
    let output_relative = context
        .request
        .run_directory
        .join("requirement-manifest.json");
    let product = dependency(&context.binding, "capability/product-capability.json")?;
    let ontology = dependency(&context.binding, "capability/business-ontology.json")?;
    let profile = dependency(&context.binding, "capability/profile.json")?;
    let meta = dependency(&context.binding, "meta-types/meta-types.yml")?;
    let relationships = dependency(&context.binding, "relationships/relationships.yml")?;
    let baseline = dependency(&context.binding, "CANONICAL-IMPLEMENTED-BASELINE.v10.json")?;
    let argv = vec![
        "-e".to_owned(),
        B00_JS.to_owned(),
        product.path.to_string_lossy().into_owned(),
        ontology.path.to_string_lossy().into_owned(),
        meta.path.to_string_lossy().into_owned(),
        relationships.path.to_string_lossy().into_owned(),
        baseline.path.to_string_lossy().into_owned(),
        profile.path.to_string_lossy().into_owned(),
        output_relative.to_string_lossy().into_owned(),
    ];
    let protected_sha256 = material_files
        .iter()
        .map(|(path, digest)| (PathBuf::from(path), digest.clone()))
        .collect();
    let work = RepositoryWorkInput {
        command_id: command.command_id.clone(),
        repository_root: context.repository_root.clone(),
        repository_root_identity: context.request.repository_root_identity.clone(),
        argv,
        read_scope: context.binding.read_scopes.clone(),
        write_scope: vec![output_relative.clone()],
        required_outputs: BTreeMap::from([(output_relative.clone(), None)]),
        protected_sha256,
        deadline_unix_ms: context.request.absolute_deadline_unix_ms,
        max_output_bytes: 65_536,
        authority_effect: "none".to_owned(),
        external_effect: "none".to_owned(),
        toolchain: context.request.toolchain.clone(),
    };
    let receipt = prepare(work, now_ms())?.execute(now_ms());
    let receipt_value = serde_json::to_value(&receipt)
        .map_err(|error| format!("L0_COMMAND_RECEIPT_INVALID:{error}"))?;
    if receipt.status != "succeeded"
        || !receipt.promoted
        || receipt.changed_paths != vec![output_relative.clone()]
    {
        return Err(format!(
            "L0_REPOSITORY_PREFLIGHT_FAILED:{}",
            receipt.cause.unwrap_or_else(|| "UNKNOWN".to_owned())
        ));
    }
    let manifest_path = context.repository_root.join(&output_relative);
    validate_requirement_manifest(context, &manifest_path)?;
    let output = json!({
        "path":output_relative,
        "sha256":sha_file(&manifest_path)?,
        "selected_dependency_validation":"PASS",
        "authority_effect":"none",
        "external_effect":"none"
    });
    Ok((output, receipt_value))
}

fn initialize_history(
    context: &ValidatedContext,
    history: &mut FileAcceptedHistory,
) -> Result<(DagEngine, DagCommand), String> {
    let mut engine = DagEngine::new(context.compiled.definition.clone());
    let started = engine.start();
    if started.commands.len() != 1 || started.commands[0].node_id != PREFLIGHT_NODE {
        return Err("L0_GATE_BYPASS_OR_ROOT_MISMATCH".to_owned());
    }
    persist_transition(
        history,
        &context.stream_id,
        None,
        json!({"event_id":format!("{}:started",context.stream_id),"event_type":"DagStarted","dag_id":context.compiled.definition.dag_id}),
        started.cursor.to_value(),
        &started.commands,
    )?;
    Ok((engine, started.commands[0].clone()))
}

fn resume_engine(
    context: &ValidatedContext,
    history: &FileAcceptedHistory,
) -> Result<DagEngine, String> {
    let view = history.read(&context.stream_id);
    let cursor = verify_accepted_history(context.compiled.definition.clone(), &view)?;
    DagEngine::from_cursor(context.compiled.definition.clone(), cursor)
}

fn pending_b00_command(
    context: &ValidatedContext,
    history: &FileAcceptedHistory,
) -> Result<DagCommand, String> {
    history
        .read(&context.stream_id)
        .command_intents
        .iter()
        .rev()
        .find(|value| value.get("node_id").and_then(Value::as_str) == Some(PREFLIGHT_NODE))
        .map(command_from_value)
        .transpose()?
        .ok_or_else(|| "L0_PREFLIGHT_COMMAND_MISSING".to_owned())
}

fn finalize_receipt(
    context: &ValidatedContext,
    history: &FileAcceptedHistory,
    before: &str,
    after: &str,
) -> Result<Value, String> {
    if before != after {
        return Err("L0_SELECTED_MATERIAL_DRIFT".to_owned());
    }
    let view = history.read(&context.stream_id);
    let cursor = verify_accepted_history(context.compiled.definition.clone(), &view)?;
    if cursor.node_status.get(PREFLIGHT_NODE).map(String::as_str) != Some("succeeded") {
        return Err("L0_PREFLIGHT_NOT_COMPLETE".to_owned());
    }
    let successor = cursor
        .node_status
        .iter()
        .find_map(|(id, status)| (status == "issued").then_some(id.clone()));
    if successor.as_deref() != Some("preflight.L0-B01-01") {
        return Err("L0_SUCCESSOR_BOUNDARY_INVALID".to_owned());
    }
    Ok(json!({
        "schema_version":"cav2-domainspec-l0-read-only-run-receipt/v1-candidate",
        "status":"read-only-preflight-complete",
        "run_id":context.request.run_id,
        "stream_id":context.stream_id,
        "binding_sha256":context.binding_digest,
        "run_request_sha256":context.request_digest,
        "run_request_path":context.request.run_directory.join("run-request.json"),
        "compiled_graph_sha256":context.compiled.graph_sha256,
        "executed_nodes":[PREFLIGHT_NODE],
        "successor_command_held":successor,
        "mutation_authorized":false,
        "mutable_work_executed":false,
        "selected_material_before":before,
        "selected_material_after":after,
        "selected_material_unchanged":true,
        "accepted_events":view.events.len(),
        "cursor_identity":view.cursor_identity,
        "history_path":context.request.run_directory.join("accepted-history.json"),
        "requirement_manifest_path":context.request.run_directory.join("requirement-manifest.json"),
        "command_receipt_path":context.request.run_directory.join("command-receipt.json"),
        "authority_effect":"none",
        "external_effect":"none",
        "accepted_own_candidate":false,
        "claim_ceiling":"Contained L0-B00-01 read-only execution evidence only; successor and mutation remain unauthorized."
    }))
}

fn execute(request_path: &Path, resume: bool) -> Result<Value, String> {
    let context = validate_request(request_path)?;
    let preflight_path = context.run_directory.join("preflight-receipt.json");
    if !preflight_path.is_file() {
        return Err("L0_PREFLIGHT_RECEIPT_REQUIRED".to_owned());
    }
    let preflight_value: Value = load_json(&preflight_path, "L0_PREFLIGHT_RECEIPT_INVALID")?;
    if preflight_value
        .get("binding_sha256")
        .and_then(Value::as_str)
        != Some(&context.binding_digest)
        || preflight_value
            .get("compiled_graph_sha256")
            .and_then(Value::as_str)
            != Some(&context.compiled.graph_sha256)
    {
        return Err("L0_PREFLIGHT_RECEIPT_DRIFT".to_owned());
    }
    validate_run_request_identity(&context, &preflight_value)?;
    let (before, material_files) =
        selected_material(&context.repository_root, &context.binding.read_scopes)?;
    validate_preflight_material_identity(&preflight_value, &before)?;
    let history_path = context.run_directory.join("accepted-history.json");
    let mut history = FileAcceptedHistory::open(&history_path)?;
    history.open_stream(
        &context.stream_id,
        &context.stream_identity_value,
        context.request.absolute_deadline_unix_ms,
        now_ms(),
    )?;
    let view = history.read(&context.stream_id);
    let (mut engine, command) = if view.transitions.is_empty() {
        initialize_history(&context, &mut history)?
    } else {
        if !resume {
            return Err("L0_RUN_ALREADY_STARTED_USE_RESUME".to_owned());
        }
        let engine = resume_engine(&context, &history)?;
        if engine
            .cursor
            .node_status
            .get(PREFLIGHT_NODE)
            .map(String::as_str)
            == Some("succeeded")
        {
            let (after, _) =
                selected_material(&context.repository_root, &context.binding.read_scopes)?;
            let receipt = finalize_receipt(&context, &history, &before, &after)?;
            atomic_write_json(&context.run_directory.join("run-receipt.json"), &receipt)?;
            return Ok(receipt);
        }
        (engine, pending_b00_command(&context, &history)?)
    };
    let event = match history.begin_command(&command.command_id, &command.to_value())? {
        ResumeDisposition::Execute => {
            let (output, repository_receipt) = execute_b00(&context, &command, &material_files)?;
            let event = NodeEvent::succeeded(
                format!("{}:L0-B00-01:1", context.stream_id),
                PREFLIGHT_NODE,
                output,
            )
            .bind_command(&command.command_id);
            let receipt = json!({
                "schema_version":"cav2-domainspec-l0-command-receipt/v1-candidate",
                "command_id":command.command_id,
                "node_id":PREFLIGHT_NODE,
                "status":"succeeded",
                "repository_receipt":repository_receipt,
                "node_event":event.to_value(),
                "authority_effect":"none",
                "external_effect":"none"
            });
            history.record_command_receipt(&command.command_id, receipt.clone())?;
            atomic_write_json(
                &context.run_directory.join("command-receipt.json"),
                &receipt,
            )?;
            event
        }
        ResumeDisposition::Completed(receipt) => {
            let value = receipt
                .get("node_event")
                .ok_or_else(|| "L0_COMMAND_RECEIPT_EVENT_MISSING".to_owned())?;
            NodeEvent {
                event_id: value["event_id"]
                    .as_str()
                    .ok_or_else(|| "L0_COMMAND_RECEIPT_EVENT_INVALID".to_owned())?
                    .to_owned(),
                command_id: value["command_id"].as_str().map(str::to_owned),
                node_id: value["node_id"]
                    .as_str()
                    .ok_or_else(|| "L0_COMMAND_RECEIPT_EVENT_INVALID".to_owned())?
                    .to_owned(),
                outcome: value["outcome"]
                    .as_str()
                    .ok_or_else(|| "L0_COMMAND_RECEIPT_EVENT_INVALID".to_owned())?
                    .to_owned(),
                output_ref: value
                    .get("output_ref")
                    .filter(|value| !value.is_null())
                    .cloned(),
                error: value
                    .get("error")
                    .and_then(Value::as_str)
                    .map(str::to_owned),
            }
        }
    };
    let expected_cursor_identity = history.read(&context.stream_id).cursor_identity;
    let transition = engine.apply_event(event.clone())?;
    persist_transition(
        &mut history,
        &context.stream_id,
        expected_cursor_identity,
        event.to_value(),
        transition.cursor.to_value(),
        &transition.commands,
    )?;
    let (after, _) = selected_material(&context.repository_root, &context.binding.read_scopes)?;
    let receipt = finalize_receipt(&context, &history, &before, &after)?;
    atomic_write_json(&context.run_directory.join("run-receipt.json"), &receipt)?;
    Ok(receipt)
}

fn validate_run_request_identity(
    context: &ValidatedContext,
    preflight_receipt: &Value,
) -> Result<(), String> {
    let expected = preflight_receipt
        .get("run_request_sha256")
        .and_then(Value::as_str)
        .ok_or_else(|| "L0_RUN_REQUEST_BINDING_MISSING".to_owned())?;
    let persisted_path = context.run_directory.join("run-request.json");
    let persisted = fs::read(&persisted_path)
        .map_err(|error| format!("L0_RUN_REQUEST_EVIDENCE_MISSING:{error}"))?;
    if expected != context.request_digest
        || sha_bytes(&persisted) != expected
        || persisted != context.request_bytes
    {
        return Err("L0_RUN_REQUEST_DRIFT".to_owned());
    }
    Ok(())
}

pub fn run(request_path: &Path) -> Result<Value, String> {
    execute(request_path, false)
}

pub fn resume(request_path: &Path) -> Result<Value, String> {
    execute(request_path, true)
}

fn validate_preflight_material_identity(
    preflight_receipt: &Value,
    current_identity: &str,
) -> Result<(), String> {
    if preflight_receipt
        .get("selected_material_identity")
        .and_then(Value::as_str)
        != Some(current_identity)
    {
        return Err("L0_SELECTED_MATERIAL_DRIFT_SINCE_PREFLIGHT".to_owned());
    }
    Ok(())
}

#[allow(dead_code)]
fn dispatch_non_b00(context: &ValidatedContext, command: &DagCommand) -> Result<NodeEvent, String> {
    if command.role_id == "structural-checkpoint" {
        return Ok(NodeEvent::succeeded(
            format!(
                "{}:{}:{}",
                context.stream_id, command.node_id, command.attempt
            ),
            &command.node_id,
            json!({"checkpoint":"closed","authority_effect":"none","external_effect":"none"}),
        )
        .bind_command(&command.command_id));
    }
    if command.role_id == "c19-no-effect-evaluator" {
        let stage = command
            .input
            .pointer("/static/stage")
            .and_then(Value::as_str)
            .ok_or_else(|| "L0_C19_STAGE_MISSING".to_owned())?;
        return dispatch_gate(context, command, stage);
    }
    let writes = command
        .input
        .pointer("/static/work_contract/write_scope")
        .and_then(Value::as_array)
        .ok_or_else(|| "L0_WORK_SCOPE_INVALID".to_owned())?
        .iter()
        .filter_map(Value::as_str)
        .map(PathBuf::from)
        .collect::<Vec<_>>();
    if !writes.is_empty() {
        require_mutation_authorization(
            &context.compiled.graph_sha256,
            &command.node_id,
            &writes,
            context.request.mutation_authorization.as_ref(),
            now_ms(),
        )?;
    }
    Err("L0_MUTABLE_COMMAND_DEFINITION_UNAVAILABLE".to_owned())
}

pub fn validate_binding_value_for_tests(
    source: &Value,
    binding: &L0ExecutionBinding,
) -> Result<(), String> {
    if unresolved_scope_keys(source)?
        != binding
            .scope_bindings
            .keys()
            .cloned()
            .collect::<BTreeSet<_>>()
    {
        return Err("L0_SCOPE_BINDING_KEY_SET_MISMATCH".to_owned());
    }
    if binding.preflight_node_id != PREFLIGHT_NODE {
        return Err("L0_GATE_BYPASS_OR_ROOT_MISMATCH".to_owned());
    }
    Ok(())
}

pub fn parse_binding_for_tests(value: Value) -> Result<L0ExecutionBinding, String> {
    serde_json::from_value(value).map_err(|error| format!("L0_BINDING_INVALID:{error}"))
}

pub fn definition_for_tests(value: &Value) -> Result<DagDefinition, String> {
    validate_compiled_composite(value)
}

pub fn validate_preflight_material_for_tests(
    preflight_receipt: &Value,
    current_identity: &str,
) -> Result<(), String> {
    validate_preflight_material_identity(preflight_receipt, current_identity)
}
