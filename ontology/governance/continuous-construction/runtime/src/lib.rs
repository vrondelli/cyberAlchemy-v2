//! Deterministic candidate evaluator for the ordered CAV2-D65 chain.

use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const PROGRAM_SCHEMA: &str = "cav2-continuous-construction-program/v2";
pub const ATTEMPT_SCHEMA: &str = "cav2-continuous-construction-attempt/v2";
pub const AUTHORIZATION_SCHEMA: &str = "cav2-continuous-construction-authorization/v1";
pub const OWNER_GATE_SCHEMA: &str = "cav2-continuous-construction-owner-gate/v1";
pub const PACKET_SCHEMA: &str = "cav2-continuous-construction-human-test-packet/v1";
pub const OBSERVATION_SCHEMA: &str = "cav2-continuous-construction-human-test-observation/v1";

pub const STAGES: [&str; 9] = [
    "canonical-definitions",
    "product-ontology",
    "business-ontology",
    "domainspec-source",
    "compiled-graph",
    "system-ontology",
    "exact-implementation-binding",
    "static-conformance",
    "runtime-evidence",
];
pub const DECISIONS: [&str; 4] = [
    "CONTINUE",
    "STOP",
    "READY_FOR_HUMAN_TEST",
    "REQUEST_TERMINAL_CONFIRMATION",
];
const REQUIRED_SOURCE_BINDINGS: [(&str, &str, &str); 2] = [
    (
        "GCC-SEL-CAV2-D65",
        "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md",
        "## CAV2-D65: DomainSpec-Governed Construction Invariant",
    ),
    (
        "GCC-SEL-CAV2-D67",
        "cyberAlchemy-v2/authority/definitions/DEFINITIONS.md",
        "## CAV2-D67: Product Capability",
    ),
];

#[derive(Clone, Debug, Eq, PartialEq)]
struct Problem {
    code: String,
    stage: Option<String>,
    detail: String,
}
impl Problem {
    fn new(code: &str, stage: Option<&str>, detail: impl Into<String>) -> Self {
        Self {
            code: code.to_owned(),
            stage: stage.map(str::to_owned),
            detail: detail.into(),
        }
    }
    fn value(&self) -> Value {
        json!({"code":self.code,"stage":self.stage,"detail":self.detail})
    }
}
#[derive(Clone, Debug)]
struct SourceBinding {
    id: String,
    path: String,
    selector: String,
    digest: String,
}
#[derive(Clone, Debug)]
struct Program {
    id: String,
    version: u64,
    sources: Vec<SourceBinding>,
}
#[derive(Clone, Debug)]
struct Authorization {
    envelope_id: String,
    reference: String,
    digest: String,
    subject_ref: String,
    project_ref: String,
    permitted: Vec<String>,
}
#[derive(Clone, Debug)]
struct Stage {
    id: String,
    applicable: bool,
    state: String,
    artifact_ref: Option<String>,
    artifact_digest: Option<String>,
    owner_gate_required: bool,
    owner_gate_bound: bool,
    owner_gate_ref: Option<String>,
    owner_gate_digest: Option<String>,
}
#[derive(Clone, Debug)]
struct OperationalTask {
    id: String,
    state: String,
    applies_to_stage: Option<String>,
    blocking_basis: String,
    detail: String,
    owner_route: String,
}

pub fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn is_sha256(value: &str) -> bool {
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase())
}
fn canonical_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut keys: Vec<_> = map.keys().collect();
            keys.sort();
            let mut result = Map::new();
            for key in keys {
                result.insert(key.clone(), canonical_value(&map[key]));
            }
            Value::Object(result)
        }
        Value::Array(items) => Value::Array(items.iter().map(canonical_value).collect()),
        _ => value.clone(),
    }
}
fn canonical_json_bytes(value: &Value) -> Vec<u8> {
    let mut bytes = serde_json::to_vec(&canonical_value(value)).expect("JSON serializes");
    bytes.push(b'\n');
    bytes
}
fn closed(map: &Map<String, Value>, expected: &[&str], code: &str, problems: &mut Vec<Problem>) {
    let actual: BTreeSet<_> = map.keys().map(String::as_str).collect();
    let expected: BTreeSet<_> = expected.iter().copied().collect();
    if actual != expected {
        problems.push(Problem::new(
            code,
            None,
            format!("expected {expected:?}, observed {actual:?}"),
        ));
    }
}
fn required_string(map: &Map<String, Value>, key: &str, problems: &mut Vec<Problem>) -> String {
    match map
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
    {
        Some(value) => value.to_owned(),
        None => {
            problems.push(Problem::new("MISSING_OR_INVALID_FIELD", None, key));
            String::new()
        }
    }
}
fn required_u64(map: &Map<String, Value>, key: &str, problems: &mut Vec<Problem>) -> u64 {
    match map
        .get(key)
        .and_then(Value::as_u64)
        .filter(|value| *value > 0)
    {
        Some(value) => value,
        None => {
            problems.push(Problem::new("MISSING_OR_INVALID_FIELD", None, key));
            0
        }
    }
}
fn required_bool(map: &Map<String, Value>, key: &str, problems: &mut Vec<Problem>) -> bool {
    match map.get(key).and_then(Value::as_bool) {
        Some(value) => value,
        None => {
            problems.push(Problem::new("MISSING_OR_INVALID_FIELD", None, key));
            false
        }
    }
}
fn string_array(map: &Map<String, Value>, key: &str, problems: &mut Vec<Problem>) -> Vec<String> {
    let Some(items) = map.get(key).and_then(Value::as_array) else {
        problems.push(Problem::new("MISSING_OR_INVALID_FIELD", None, key));
        return Vec::new();
    };
    let mut result = Vec::new();
    for item in items {
        match item.as_str().filter(|item| !item.is_empty()) {
            Some(item) => result.push(item.to_owned()),
            None => problems.push(Problem::new("INVALID_ARRAY_ITEM", None, key)),
        }
    }
    result
}
fn validate_stage_set(
    values: &[String],
    allow_subset: bool,
    problems: &mut Vec<Problem>,
    code: &str,
) {
    let unique: BTreeSet<_> = values.iter().collect();
    let known: BTreeSet<_> = STAGES.iter().map(|value| value.to_string()).collect();
    if unique.len() != values.len()
        || values.iter().any(|value| !known.contains(value))
        || (!allow_subset && values != STAGES)
    {
        problems.push(Problem::new(code, None, "unique known D65 stages required"));
        return;
    }
    let ordered: Vec<_> = STAGES
        .iter()
        .filter(|stage| unique.contains(&stage.to_string()))
        .map(|stage| stage.to_string())
        .collect();
    if ordered != values {
        problems.push(Problem::new(code, None, "stages must preserve D65 order"));
    }
}

fn resolve_path(repository_root: &Path, relative: &str) -> Result<PathBuf, Problem> {
    let relative_path = Path::new(relative);
    if relative_path.is_absolute()
        || relative_path.components().any(|part| {
            matches!(
                part,
                Component::ParentDir | Component::RootDir | Component::Prefix(_)
            )
        })
    {
        return Err(Problem::new("PATH_ESCAPE", None, relative));
    }
    let root = repository_root
        .canonicalize()
        .map_err(|error| Problem::new("REPOSITORY_ROOT_UNAVAILABLE", None, error.to_string()))?;
    let joined = root.join(relative_path);
    let mut cursor = root.clone();
    for component in relative_path.components() {
        if let Component::Normal(part) = component {
            cursor.push(part);
            if let Ok(metadata) = fs::symlink_metadata(&cursor) {
                if metadata.file_type().is_symlink() {
                    return Err(Problem::new("SYMLINK_FORBIDDEN", None, relative));
                }
            }
        }
    }
    let canonical = joined
        .canonicalize()
        .map_err(|error| Problem::new("ARTIFACT_UNAVAILABLE", None, error.to_string()))?;
    if !canonical.starts_with(&root) {
        return Err(Problem::new("PATH_ESCAPE", None, relative));
    }
    Ok(canonical)
}
fn read_exact(
    repository_root: &Path,
    reference: &str,
    expected: &str,
    changed_code: &str,
) -> Result<Vec<u8>, Problem> {
    if !is_sha256(expected) {
        return Err(Problem::new("INVALID_DIGEST", None, reference));
    }
    let path = resolve_path(repository_root, reference)?;
    let bytes = fs::read(path)
        .map_err(|error| Problem::new("ARTIFACT_UNAVAILABLE", None, error.to_string()))?;
    if sha256(&bytes) != expected {
        return Err(Problem::new(changed_code, None, reference));
    }
    Ok(bytes)
}
fn read_exact_json(
    repository_root: &Path,
    reference: &str,
    expected: &str,
    changed_code: &str,
    invalid_code: &str,
) -> Result<(Vec<u8>, Value), Problem> {
    let bytes = read_exact(repository_root, reference, expected, changed_code)?;
    let value = serde_json::from_slice(&bytes)
        .map_err(|error| Problem::new(invalid_code, None, error.to_string()))?;
    Ok((bytes, value))
}
fn heading_section(bytes: &[u8], selector: &str) -> Result<Vec<u8>, Problem> {
    let text = std::str::from_utf8(bytes)
        .map_err(|error| Problem::new("INVALID_UTF8", None, error.to_string()))?;
    let lines: Vec<&str> = text.split_inclusive('\n').collect();
    let matches: Vec<usize> = lines
        .iter()
        .enumerate()
        .filter_map(|(index, line)| {
            (line.trim_end_matches(['\r', '\n']) == selector).then_some(index)
        })
        .collect();
    if matches.len() != 1 {
        return Err(Problem::new(
            "AMBIGUOUS_SOURCE_SELECTOR",
            None,
            format!("{selector}:{}", matches.len()),
        ));
    }
    let start = matches[0];
    let end = (start + 1..lines.len())
        .find(|index| lines[*index].starts_with("## "))
        .unwrap_or(lines.len());
    Ok(lines[start..end].concat().into_bytes())
}

fn parse_program(value: &Value) -> Result<Program, Vec<Problem>> {
    let mut problems = Vec::new();
    let Some(map) = value.as_object() else {
        return Err(vec![Problem::new(
            "INVALID_PROGRAM",
            None,
            "expected object",
        )]);
    };
    closed(
        map,
        &[
            "schema_version",
            "program_id",
            "version",
            "source_bindings",
            "stage_order",
            "decisions",
            "routine_confirmation_policy",
            "predecessor_failure_policy",
            "work_lane_policy",
            "operational_blocking_policy",
            "operational_residue_policy",
            "retroactive_approval",
            "effect_ceiling",
            "authority_effect",
        ],
        "PROGRAM_CONTRACT_OPEN",
        &mut problems,
    );
    if map.get("schema_version").and_then(Value::as_str) != Some(PROGRAM_SCHEMA) {
        problems.push(Problem::new("INVALID_PROGRAM_SCHEMA", None, PROGRAM_SCHEMA));
    }
    if map.get("effect_ceiling").and_then(Value::as_str) != Some("none") {
        problems.push(Problem::new(
            "EFFECT_CEILING_MUST_BE_NONE",
            None,
            "effect_ceiling",
        ));
    }
    if map.get("authority_effect").and_then(Value::as_str) != Some("none") {
        problems.push(Problem::new(
            "AUTHORITY_EFFECT_MUST_BE_NONE",
            None,
            "authority_effect",
        ));
    }
    if map
        .get("routine_confirmation_policy")
        .and_then(Value::as_str)
        != Some("false-except-terminal-request")
    {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "routine_confirmation_policy",
        ));
    }
    if map
        .get("predecessor_failure_policy")
        .and_then(Value::as_str)
        != Some("fail-closed-and-mark-downstream-not_evaluable")
    {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "predecessor_failure_policy",
        ));
    }
    if map.get("work_lane_policy").and_then(Value::as_str)
        != Some("separate-product-construction-from-operational-support")
    {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "work_lane_policy",
        ));
    }
    if map
        .get("operational_blocking_policy")
        .and_then(Value::as_str)
        != Some("only-exact-frontier-prerequisite-or-applicable-boundary")
    {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "operational_blocking_policy",
        ));
    }
    if map
        .get("operational_residue_policy")
        .and_then(Value::as_str)
        != Some("defer-visible-and-continue-product-construction")
    {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "operational_residue_policy",
        ));
    }
    if map.get("retroactive_approval").and_then(Value::as_str) != Some("forbidden") {
        problems.push(Problem::new(
            "PROGRAM_POLICY_INVALID",
            None,
            "retroactive_approval",
        ));
    }
    let id = required_string(map, "program_id", &mut problems);
    let version = required_u64(map, "version", &mut problems);
    let stage_order = string_array(map, "stage_order", &mut problems);
    validate_stage_set(
        &stage_order,
        false,
        &mut problems,
        "D65_STAGE_ORDER_INVALID",
    );
    let decisions = string_array(map, "decisions", &mut problems);
    if decisions != DECISIONS {
        problems.push(Problem::new(
            "DECISION_VOCABULARY_INVALID",
            None,
            "exact four decisions required",
        ));
    }
    let mut sources = Vec::new();
    let Some(items) = map.get("source_bindings").and_then(Value::as_array) else {
        problems.push(Problem::new(
            "SOURCE_BINDINGS_REQUIRED",
            None,
            "source_bindings",
        ));
        return Err(problems);
    };
    for item in items {
        let Some(source) = item.as_object() else {
            problems.push(Problem::new(
                "INVALID_SOURCE_BINDING",
                None,
                "expected object",
            ));
            continue;
        };
        closed(
            source,
            &["id", "path", "selector", "sha256"],
            "SOURCE_BINDING_CONTRACT_OPEN",
            &mut problems,
        );
        let id = required_string(source, "id", &mut problems);
        let path = required_string(source, "path", &mut problems);
        let selector = required_string(source, "selector", &mut problems);
        let digest = required_string(source, "sha256", &mut problems);
        if !digest.is_empty() && !is_sha256(&digest) {
            problems.push(Problem::new("INVALID_SOURCE_DIGEST", None, &id));
        }
        sources.push(SourceBinding {
            id,
            path,
            selector,
            digest,
        });
    }
    if sources.len() != REQUIRED_SOURCE_BINDINGS.len() {
        problems.push(Problem::new(
            "SOURCE_BINDING_SET_INVALID",
            None,
            "exactly two source bindings required",
        ));
    }
    let unique: BTreeSet<_> = sources.iter().map(|source| source.id.as_str()).collect();
    if unique.len() != sources.len() {
        problems.push(Problem::new("DUPLICATE_SOURCE_BINDING", None, "source ids"));
    }
    for (index, (id, path, selector)) in REQUIRED_SOURCE_BINDINGS.iter().enumerate() {
        match sources.get(index) {
            Some(source)
                if source.id == *id && source.path == *path && source.selector == *selector => {}
            _ => problems.push(Problem::new("REQUIRED_SOURCE_BINDING_MISSING", None, *id)),
        }
    }
    if problems.is_empty() {
        Ok(Program {
            id,
            version,
            sources,
        })
    } else {
        Err(problems)
    }
}
fn validate_sources(program: &Program, repository_root: &Path) -> Vec<Problem> {
    let mut problems = Vec::new();
    for source in &program.sources {
        let observed = resolve_path(repository_root, &source.path)
            .and_then(|path| {
                fs::read(path)
                    .map_err(|error| Problem::new("SOURCE_UNAVAILABLE", None, error.to_string()))
            })
            .and_then(|bytes| heading_section(&bytes, &source.selector));
        match observed {
            Ok(bytes) if sha256(&bytes) == source.digest => {}
            Ok(_) => problems.push(Problem::new("SOURCE_DIGEST_STALE", None, &source.id)),
            Err(problem) => problems.push(problem),
        }
    }
    problems
}
pub fn validate_program(program_value: &Value, repository_root: &Path) -> Value {
    match parse_program(program_value) {
        Ok(program) => {
            let problems = validate_sources(&program, repository_root);
            json!({"schema_version":"cav2-continuous-construction-program-validation/v1","status":if problems.is_empty(){"CANDIDATE"}else{"NOT_EVALUABLE"},"program_id":program.id,"program_version":program.version,"source_bindings_current":problems.is_empty(),"problems":problems.iter().map(Problem::value).collect::<Vec<_>>(),"effect_authorized":false,"authority_effect":"none","enforcement_effect":"none"})
        }
        Err(problems) => {
            json!({"schema_version":"cav2-continuous-construction-program-validation/v1","status":"NOT_EVALUABLE","source_bindings_current":false,"problems":problems.iter().map(Problem::value).collect::<Vec<_>>(),"effect_authorized":false,"authority_effect":"none","enforcement_effect":"none"})
        }
    }
}

fn parse_stages(attempt: &Map<String, Value>, problems: &mut Vec<Problem>) -> Vec<Stage> {
    let Some(items) = attempt.get("stages").and_then(Value::as_array) else {
        problems.push(Problem::new("STAGES_REQUIRED", None, "stages"));
        return Vec::new();
    };
    let mut stages = Vec::new();
    for item in items {
        let Some(stage) = item.as_object() else {
            problems.push(Problem::new("INVALID_STAGE", None, "expected object"));
            continue;
        };
        closed(
            stage,
            &[
                "stage",
                "lane",
                "applicable",
                "state",
                "artifact_ref",
                "artifact_sha256",
                "owner_gate_required",
                "owner_gate_bound",
                "owner_gate_ref",
                "owner_gate_sha256",
            ],
            "STAGE_CONTRACT_OPEN",
            problems,
        );
        if stage.get("lane").and_then(Value::as_str) != Some("product-construction") {
            problems.push(Problem::new(
                "STAGE_LANE_INVALID",
                stage.get("stage").and_then(Value::as_str),
                "D65 stages belong to product-construction",
            ));
        }
        stages.push(Stage {
            id: required_string(stage, "stage", problems),
            applicable: required_bool(stage, "applicable", problems),
            state: required_string(stage, "state", problems),
            artifact_ref: stage
                .get("artifact_ref")
                .and_then(Value::as_str)
                .map(str::to_owned),
            artifact_digest: stage
                .get("artifact_sha256")
                .and_then(Value::as_str)
                .map(str::to_owned),
            owner_gate_required: required_bool(stage, "owner_gate_required", problems),
            owner_gate_bound: required_bool(stage, "owner_gate_bound", problems),
            owner_gate_ref: stage
                .get("owner_gate_ref")
                .and_then(Value::as_str)
                .map(str::to_owned),
            owner_gate_digest: stage
                .get("owner_gate_sha256")
                .and_then(Value::as_str)
                .map(str::to_owned),
        });
    }
    let ids: Vec<String> = stages.iter().map(|stage| stage.id.clone()).collect();
    validate_stage_set(&ids, false, problems, "ATTEMPT_STAGE_ORDER_INVALID");
    stages
}

fn parse_operational_tasks(
    attempt: &Map<String, Value>,
    problems: &mut Vec<Problem>,
) -> Vec<OperationalTask> {
    let Some(items) = attempt.get("operational_tasks").and_then(Value::as_array) else {
        problems.push(Problem::new(
            "OPERATIONAL_TASKS_REQUIRED",
            None,
            "operational_tasks",
        ));
        return Vec::new();
    };
    let mut tasks = Vec::new();
    let mut ids = BTreeSet::new();
    for item in items {
        let Some(task) = item.as_object() else {
            problems.push(Problem::new(
                "INVALID_OPERATIONAL_TASK",
                None,
                "expected object",
            ));
            continue;
        };
        closed(
            task,
            &[
                "task_id",
                "lane",
                "state",
                "applies_to_stage",
                "blocking_basis",
                "detail",
                "owner_route",
            ],
            "OPERATIONAL_TASK_CONTRACT_OPEN",
            problems,
        );
        let id = required_string(task, "task_id", problems);
        if !id.is_empty() && !ids.insert(id.clone()) {
            problems.push(Problem::new("DUPLICATE_OPERATIONAL_TASK", None, &id));
        }
        if task.get("lane").and_then(Value::as_str) != Some("operational-support") {
            problems.push(Problem::new("OPERATIONAL_TASK_LANE_INVALID", None, &id));
        }
        let state = required_string(task, "state", problems);
        if !matches!(
            state.as_str(),
            "pending" | "blocked" | "complete" | "not_applicable"
        ) {
            problems.push(Problem::new("OPERATIONAL_TASK_STATE_INVALID", None, &id));
        }
        let applies_to_stage = match task.get("applies_to_stage") {
            Some(Value::Null) => None,
            Some(Value::String(stage)) if STAGES.contains(&stage.as_str()) => Some(stage.clone()),
            _ => {
                problems.push(Problem::new("OPERATIONAL_TASK_STAGE_INVALID", None, &id));
                None
            }
        };
        let blocking_basis = required_string(task, "blocking_basis", problems);
        if !matches!(
            blocking_basis.as_str(),
            "none"
                | "exact-prerequisite"
                | "safety-boundary"
                | "privacy-boundary"
                | "authority-boundary"
                | "destructive-action-boundary"
                | "credential-boundary"
                | "external-effect-boundary"
        ) {
            problems.push(Problem::new(
                "OPERATIONAL_BLOCKING_BASIS_INVALID",
                None,
                &id,
            ));
        }
        if blocking_basis == "none" && applies_to_stage.is_some() {
            problems.push(Problem::new(
                "OPERATIONAL_NONBLOCKING_SCOPE_INVALID",
                None,
                &id,
            ));
        }
        if blocking_basis != "none" && applies_to_stage.is_none() {
            problems.push(Problem::new(
                "OPERATIONAL_BLOCKING_SCOPE_REQUIRED",
                None,
                &id,
            ));
        }
        tasks.push(OperationalTask {
            id,
            state,
            applies_to_stage,
            blocking_basis,
            detail: required_string(task, "detail", problems),
            owner_route: required_string(task, "owner_route", problems),
        });
    }
    tasks
}
fn authorization_scope(
    construction_id: &str,
    attempt_id: &str,
    program: &Program,
    auth: &Authorization,
) -> Value {
    json!({"construction_id":construction_id,"attempt_id":attempt_id,"program_id":program.id,"program_version":program.version,"envelope_id":auth.envelope_id,"owner_authorization_ref":auth.reference,"owner_authorization_sha256":auth.digest,"subject_ref":auth.subject_ref,"project_ref":auth.project_ref,"permitted_stages":auth.permitted})
}
fn gate_scope_digest(
    construction_id: &str,
    attempt_id: &str,
    program: &Program,
    auth: &Authorization,
    stage: &str,
) -> String {
    let mut scope = authorization_scope(construction_id, attempt_id, program, auth);
    scope["stage"] = Value::String(stage.to_owned());
    sha256(&canonical_json_bytes(&scope))
}
fn parse_authorization(
    attempt: &Map<String, Value>,
    construction_id: &str,
    attempt_id: &str,
    program: &Program,
    repository_root: &Path,
    problems: &mut Vec<Problem>,
) -> Option<Authorization> {
    let Some(map) = attempt.get("authorization").and_then(Value::as_object) else {
        problems.push(Problem::new(
            "AUTHORIZATION_ENVELOPE_REQUIRED",
            None,
            "authorization",
        ));
        return None;
    };
    closed(
        map,
        &[
            "envelope_id",
            "owner_authorization_ref",
            "owner_authorization_sha256",
            "subject_ref",
            "project_ref",
            "permitted_stages",
            "repository_local",
            "reversible",
            "effect_ceiling",
        ],
        "AUTHORIZATION_ENVELOPE_CONTRACT_OPEN",
        problems,
    );
    let auth = Authorization {
        envelope_id: required_string(map, "envelope_id", problems),
        reference: required_string(map, "owner_authorization_ref", problems),
        digest: required_string(map, "owner_authorization_sha256", problems),
        subject_ref: required_string(map, "subject_ref", problems),
        project_ref: required_string(map, "project_ref", problems),
        permitted: string_array(map, "permitted_stages", problems),
    };
    validate_stage_set(&auth.permitted, true, problems, "PERMITTED_STAGES_INVALID");
    if map.get("repository_local").and_then(Value::as_bool) != Some(true)
        || map.get("reversible").and_then(Value::as_bool) != Some(true)
        || map.get("effect_ceiling").and_then(Value::as_str) != Some("none")
    {
        problems.push(Problem::new(
            "AUTHORIZATION_ENVELOPE_OUT_OF_SCOPE",
            None,
            "requires repository-local reversible zero-effect work",
        ));
    }
    let record = match read_exact_json(
        repository_root,
        &auth.reference,
        &auth.digest,
        "OWNER_AUTHORIZATION_CHANGED",
        "INVALID_OWNER_AUTHORIZATION_RECORD",
    ) {
        Ok((_, value)) => value,
        Err(problem) => {
            problems.push(problem);
            return Some(auth);
        }
    };
    let Some(record) = record.as_object() else {
        problems.push(Problem::new(
            "INVALID_OWNER_AUTHORIZATION_RECORD",
            None,
            "expected object",
        ));
        return Some(auth);
    };
    closed(
        record,
        &[
            "schema_version",
            "envelope_id",
            "construction_id",
            "attempt_id",
            "program_id",
            "program_version",
            "subject_ref",
            "project_ref",
            "permitted_stages",
            "repository_local",
            "reversible",
            "effect_ceiling",
            "owner_route",
            "authority_effect",
        ],
        "AUTHORIZATION_RECORD_CONTRACT_OPEN",
        problems,
    );
    let record_stages = string_array(record, "permitted_stages", problems);
    validate_stage_set(
        &record_stages,
        true,
        problems,
        "AUTHORIZATION_RECORD_STAGES_INVALID",
    );
    if record.get("schema_version").and_then(Value::as_str) != Some(AUTHORIZATION_SCHEMA)
        || record.get("envelope_id").and_then(Value::as_str) != Some(auth.envelope_id.as_str())
        || record.get("construction_id").and_then(Value::as_str) != Some(construction_id)
        || record.get("attempt_id").and_then(Value::as_str) != Some(attempt_id)
        || record.get("program_id").and_then(Value::as_str) != Some(program.id.as_str())
        || record.get("program_version").and_then(Value::as_u64) != Some(program.version)
        || record.get("subject_ref").and_then(Value::as_str) != Some(auth.subject_ref.as_str())
        || record.get("project_ref").and_then(Value::as_str) != Some(auth.project_ref.as_str())
        || record_stages != auth.permitted
        || record.get("repository_local").and_then(Value::as_bool) != Some(true)
        || record.get("reversible").and_then(Value::as_bool) != Some(true)
        || record.get("effect_ceiling").and_then(Value::as_str) != Some("none")
        || record.get("authority_effect").and_then(Value::as_str) != Some("none")
        || record
            .get("owner_route")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
    {
        problems.push(Problem::new(
            "OWNER_AUTHORIZATION_MISMATCH",
            None,
            "closed record does not match envelope",
        ));
    }
    Some(auth)
}
fn validate_gate(
    repository_root: &Path,
    reference: &str,
    digest: &str,
    construction_id: &str,
    attempt_id: &str,
    program: &Program,
    auth: &Authorization,
    stage: &str,
) -> Result<(), Problem> {
    let (_, value) = read_exact_json(
        repository_root,
        reference,
        digest,
        "OWNER_GATE_CHANGED",
        "INVALID_OWNER_GATE_RECORD",
    )?;
    let map = value
        .as_object()
        .ok_or_else(|| Problem::new("INVALID_OWNER_GATE_RECORD", Some(stage), "expected object"))?;
    let mut problems = Vec::new();
    closed(
        map,
        &[
            "schema_version",
            "gate_id",
            "construction_id",
            "attempt_id",
            "program_id",
            "program_version",
            "stage",
            "subject_ref",
            "project_ref",
            "owner_authorization_ref",
            "owner_authorization_sha256",
            "scope_sha256",
            "decision",
            "owner_route",
            "authority_effect",
            "effect_authorized",
        ],
        "OWNER_GATE_CONTRACT_OPEN",
        &mut problems,
    );
    if map.get("schema_version").and_then(Value::as_str) != Some(OWNER_GATE_SCHEMA)
        || map.get("construction_id").and_then(Value::as_str) != Some(construction_id)
        || map.get("attempt_id").and_then(Value::as_str) != Some(attempt_id)
        || map.get("program_id").and_then(Value::as_str) != Some(program.id.as_str())
        || map.get("program_version").and_then(Value::as_u64) != Some(program.version)
        || map.get("stage").and_then(Value::as_str) != Some(stage)
        || map.get("subject_ref").and_then(Value::as_str) != Some(auth.subject_ref.as_str())
        || map.get("project_ref").and_then(Value::as_str) != Some(auth.project_ref.as_str())
        || map.get("owner_authorization_ref").and_then(Value::as_str)
            != Some(auth.reference.as_str())
        || map
            .get("owner_authorization_sha256")
            .and_then(Value::as_str)
            != Some(auth.digest.as_str())
        || map.get("scope_sha256").and_then(Value::as_str)
            != Some(gate_scope_digest(construction_id, attempt_id, program, auth, stage).as_str())
        || map.get("decision").and_then(Value::as_str) != Some("accept-stage-for-bounded-attempt")
        || map.get("authority_effect").and_then(Value::as_str) != Some("none")
        || map.get("effect_authorized").and_then(Value::as_bool) != Some(false)
        || map
            .get("gate_id")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        || map
            .get("owner_route")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
    {
        problems.push(Problem::new(
            "OWNER_GATE_MISMATCH",
            Some(stage),
            "gate does not bind exact scope",
        ));
    }
    problems.into_iter().next().map_or(Ok(()), Err)
}
fn attempt_basis(attempt: &Map<String, Value>) -> Value {
    json!({"schema_version":"cav2-continuous-construction-attempt-basis/v2","construction_id":attempt.get("construction_id"),"attempt_id":attempt.get("attempt_id"),"program_id":attempt.get("program_id"),"program_version":attempt.get("program_version"),"authorization":attempt.get("authorization"),"stages":attempt.get("stages"),"operational_tasks":attempt.get("operational_tasks"),"blockers":attempt.get("blockers"),"routine_confirmation_requested":attempt.get("routine_confirmation_requested")})
}
fn output(
    program_id: Option<&str>,
    attempt_id: Option<&str>,
    decision: &str,
    stage_results: Vec<Value>,
    operational_task_results: Vec<Value>,
    blockers: Vec<Problem>,
    authorities: Vec<Problem>,
    next_action: Option<Value>,
    packet_digest: Option<String>,
    observation_digest: Option<String>,
) -> Value {
    let payload = json!({"program_id":program_id,"attempt_id":attempt_id,"decision":decision,"stage_results":stage_results,"operational_task_results":operational_task_results,"blocker_requests":blockers.iter().map(Problem::value).collect::<Vec<_>>(),"authority_requests":authorities.iter().map(Problem::value).collect::<Vec<_>>(),"next_action":next_action,"human_test_packet_sha256":packet_digest,"human_test_observation_sha256":observation_digest,"routine_confirmation_required":decision=="REQUEST_TERMINAL_CONFIRMATION","effect_authorized":false,"authority_effect":"none","enforcement_effect":"none"});
    let evaluation_id = sha256(&canonical_json_bytes(&payload));
    let mut result = payload.as_object().unwrap().clone();
    result.insert(
        "schema_version".into(),
        Value::String("cav2-continuous-construction-evaluation/v2".into()),
    );
    result.insert("status".into(), Value::String("CANDIDATE".into()));
    result.insert("evaluation_id".into(), Value::String(evaluation_id));
    result.insert(
        "claim_limit".into(),
        Value::String("Candidate advisory evaluation only; no authority or effect.".into()),
    );
    Value::Object(result)
}

pub fn evaluate(program_value: &Value, attempt_value: &Value, repository_root: &Path) -> Value {
    let program = match parse_program(program_value) {
        Ok(value) => value,
        Err(problems) => {
            return output(
                None,
                None,
                "STOP",
                vec![],
                vec![],
                problems,
                vec![],
                None,
                None,
                None,
            )
        }
    };
    let source_problems = validate_sources(&program, repository_root);
    if !source_problems.is_empty() {
        return output(
            Some(&program.id),
            None,
            "STOP",
            vec![],
            vec![],
            source_problems,
            vec![],
            None,
            None,
            None,
        );
    }
    let mut blockers = Vec::new();
    let mut authorities = Vec::new();
    let Some(attempt) = attempt_value.as_object() else {
        return output(
            Some(&program.id),
            None,
            "STOP",
            vec![],
            vec![],
            vec![Problem::new("INVALID_ATTEMPT", None, "expected object")],
            vec![],
            None,
            None,
            None,
        );
    };
    closed(
        attempt,
        &[
            "schema_version",
            "construction_id",
            "attempt_id",
            "program_id",
            "program_version",
            "authorization",
            "stages",
            "operational_tasks",
            "blockers",
            "human_test_packet",
            "human_test_observation",
            "routine_confirmation_requested",
        ],
        "ATTEMPT_CONTRACT_OPEN",
        &mut blockers,
    );
    if attempt.get("schema_version").and_then(Value::as_str) != Some(ATTEMPT_SCHEMA) {
        blockers.push(Problem::new("INVALID_ATTEMPT_SCHEMA", None, ATTEMPT_SCHEMA));
    }
    let construction_id = required_string(attempt, "construction_id", &mut blockers);
    let attempt_id = required_string(attempt, "attempt_id", &mut blockers);
    if attempt.get("program_id").and_then(Value::as_str) != Some(program.id.as_str())
        || attempt.get("program_version").and_then(Value::as_u64) != Some(program.version)
    {
        blockers.push(Problem::new(
            "PROGRAM_IDENTITY_MISMATCH",
            None,
            "attempt does not bind program",
        ));
    }
    if required_bool(attempt, "routine_confirmation_requested", &mut blockers) {
        blockers.push(Problem::new(
            "ROUTINE_CONFIRMATION_FORBIDDEN",
            None,
            "only terminal request may confirm",
        ));
    }
    let auth = parse_authorization(
        attempt,
        &construction_id,
        &attempt_id,
        &program,
        repository_root,
        &mut authorities,
    );
    if let Some(items) = attempt.get("blockers").and_then(Value::as_array) {
        for item in items {
            let Some(item) = item.as_object() else {
                blockers.push(Problem::new(
                    "INVALID_DECLARED_BLOCKER",
                    None,
                    "object required",
                ));
                continue;
            };
            closed(
                item,
                &["code", "detail"],
                "BLOCKER_CONTRACT_OPEN",
                &mut blockers,
            );
            blockers.push(Problem::new(
                item.get("code")
                    .and_then(Value::as_str)
                    .unwrap_or("DECLARED_BLOCKER"),
                None,
                item.get("detail")
                    .and_then(Value::as_str)
                    .unwrap_or("declared blocker"),
            ));
        }
    } else {
        blockers.push(Problem::new("BLOCKER_LIST_REQUIRED", None, "blockers"));
    }
    let stages = parse_stages(attempt, &mut blockers);
    let operational_tasks = parse_operational_tasks(attempt, &mut blockers);
    let mut results = Vec::new();
    let mut predecessor_valid = true;
    let mut next_stage = None;
    let mut prior_decisions = Vec::new();
    for stage in &stages {
        let mut evidence_valid = true;
        if stage.state == "validated" {
            match (
                stage.artifact_ref.as_deref(),
                stage.artifact_digest.as_deref(),
            ) {
                (Some(reference), Some(digest)) => {
                    if let Err(mut problem) = read_exact(
                        repository_root,
                        reference,
                        digest,
                        "VALIDATED_STAGE_ARTIFACT_CHANGED",
                    ) {
                        problem.stage = Some(stage.id.clone());
                        blockers.push(problem);
                        evidence_valid = false
                    }
                }
                _ => {
                    blockers.push(Problem::new(
                        "INVALID_STAGE_ARTIFACT",
                        Some(&stage.id),
                        "exact artifact required",
                    ));
                    evidence_valid = false
                }
            }
        } else if stage.artifact_ref.is_some() || stage.artifact_digest.is_some() {
            blockers.push(Problem::new(
                "STAGE_ARTIFACT_FORBIDDEN",
                Some(&stage.id),
                "only validated stages bind artifacts",
            ));
            evidence_valid = false;
        }
        if stage.owner_gate_required {
            if !stage.owner_gate_bound {
                authorities.push(Problem::new(
                    "MISSING_OWNER_GATE",
                    Some(&stage.id),
                    "required gate unbound",
                ));
                evidence_valid = false
            } else {
                match (
                    stage.owner_gate_ref.as_deref(),
                    stage.owner_gate_digest.as_deref(),
                    auth.as_ref(),
                ) {
                    (Some(reference), Some(digest), Some(auth)) if is_sha256(digest) => {
                        match validate_gate(
                            repository_root,
                            reference,
                            digest,
                            &construction_id,
                            &attempt_id,
                            &program,
                            auth,
                            &stage.id,
                        ) {
                            Ok(()) => {
                                prior_decisions.push((reference.to_owned(), digest.to_owned()))
                            }
                            Err(problem) => {
                                authorities.push(problem);
                                evidence_valid = false
                            }
                        }
                    }
                    _ => {
                        authorities.push(Problem::new(
                            "OWNER_GATE_EVIDENCE_REQUIRED",
                            Some(&stage.id),
                            "exact gate evidence required",
                        ));
                        evidence_valid = false
                    }
                }
            }
        } else if stage.owner_gate_bound
            || stage.owner_gate_ref.is_some()
            || stage.owner_gate_digest.is_some()
        {
            blockers.push(Problem::new(
                "OWNER_GATE_POSTURE_INVALID",
                Some(&stage.id),
                "unrequired gate must be empty",
            ));
            evidence_valid = false;
        }
        let mut effective = stage.state.clone();
        let mut reason: Option<&str> = None;
        if !stage.applicable {
            if stage.state != "not_applicable" {
                blockers.push(Problem::new(
                    "NON_APPLICABLE_STAGE_STATE_INVALID",
                    Some(&stage.id),
                    &stage.state,
                ));
            }
            effective = "not_applicable".into();
        } else if !predecessor_valid {
            effective = "not_evaluable".into();
            reason = Some("earlier predecessor invalid");
            if stage.state == "validated" {
                blockers.push(Problem::new(
                    "SKIPPED_PREDECESSOR",
                    Some(&stage.id),
                    "later stage validated",
                ));
            }
        } else if !evidence_valid {
            effective = "blocked".into();
            predecessor_valid = false;
        } else {
            match stage.state.as_str() {
                "validated" => {}
                "pending" => {
                    if next_stage.is_none() {
                        next_stage = Some(stage.id.clone())
                    }
                    predecessor_valid = false
                }
                "missing" | "stale" | "invalid" | "blocked" | "not_evaluable" => {
                    blockers.push(Problem::new(
                        "PREDECESSOR_NOT_VALID",
                        Some(&stage.id),
                        &stage.state,
                    ));
                    predecessor_valid = false
                }
                other => {
                    blockers.push(Problem::new("INVALID_STAGE_STATE", Some(&stage.id), other));
                    effective = "invalid".into();
                    predecessor_valid = false
                }
            }
        }
        results.push(json!({"stage":stage.id,"lane":"product-construction","applicable":stage.applicable,"observed_state":stage.state,"effective_state":effective,"reason":reason}));
    }
    let mut operational_results = Vec::new();
    for task in &operational_tasks {
        let unresolved = matches!(task.state.as_str(), "pending" | "blocked");
        let target_is_current = task.applies_to_stage.as_deref() == next_stage.as_deref();
        let target_was_advanced = task.applies_to_stage.as_deref().is_some_and(|target| {
            stages
                .iter()
                .any(|stage| stage.id == target && stage.state == "validated")
        });
        let blocks_construction = unresolved
            && task.blocking_basis != "none"
            && (target_is_current || target_was_advanced);
        let blocking_scope_invalid =
            task.blocking_basis != "none" && task.applies_to_stage.is_none();
        let effective_state = if blocking_scope_invalid {
            "invalid"
        } else if blocks_construction {
            "blocking"
        } else if unresolved {
            "deferred"
        } else {
            task.state.as_str()
        };
        if blocks_construction {
            let code = if task.blocking_basis == "exact-prerequisite" {
                "OPERATIONAL_PREREQUISITE_PENDING"
            } else {
                "OPERATIONAL_BOUNDARY_UNRESOLVED"
            };
            blockers.push(Problem::new(
                code,
                task.applies_to_stage.as_deref(),
                format!("{}: {}", task.id, task.detail),
            ));
        }
        operational_results.push(json!({
            "task_id": task.id,
            "lane": "operational-support",
            "observed_state": task.state,
            "effective_state": effective_state,
            "applies_to_stage": task.applies_to_stage,
            "blocking_basis": task.blocking_basis,
            "detail": task.detail,
            "owner_route": task.owner_route,
        }));
    }
    if let (Some(stage), Some(auth)) = (next_stage.as_deref(), auth.as_ref()) {
        if !auth.permitted.iter().any(|value| value == stage) {
            authorities.push(Problem::new(
                "STAGE_OUTSIDE_AUTHORIZATION",
                Some(stage),
                "stage not permitted",
            ));
        }
    }
    if !blockers.is_empty() || !authorities.is_empty() {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            blockers,
            authorities,
            None,
            None,
            None,
        );
    }
    if let Some(stage) = next_stage {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "CONTINUE",
            results,
            operational_results.clone(),
            vec![],
            vec![],
            Some(json!({"kind":"advance-authorized-stage","stage":stage})),
            None,
            None,
        );
    }
    let Some(auth) = auth else {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            vec![],
            vec![Problem::new(
                "AUTHORIZATION_REQUIRED",
                None,
                "not validated",
            )],
            None,
            None,
            None,
        );
    };
    let Some(packet_ref) = attempt.get("human_test_packet").and_then(Value::as_object) else {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "CONTINUE",
            results,
            operational_results.clone(),
            vec![],
            vec![],
            Some(json!({"kind":"freeze-human-test-packet"})),
            None,
            None,
        );
    };
    let packet_path = packet_ref.get("path").and_then(Value::as_str).unwrap_or("");
    let packet_expected = packet_ref
        .get("sha256")
        .and_then(Value::as_str)
        .unwrap_or("");
    let (packet_bytes, packet_value) = match read_exact_json(
        repository_root,
        packet_path,
        packet_expected,
        "HUMAN_TEST_PACKET_CHANGED",
        "INVALID_HUMAN_TEST_PACKET",
    ) {
        Ok(value) => value,
        Err(problem) => {
            return output(
                Some(&program.id),
                Some(&attempt_id),
                "STOP",
                results,
                operational_results.clone(),
                vec![problem],
                vec![],
                None,
                None,
                None,
            )
        }
    };
    let packet_digest = sha256(&packet_bytes);
    let Some(packet) = packet_value.as_object() else {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            vec![Problem::new(
                "INVALID_HUMAN_TEST_PACKET",
                None,
                "object required",
            )],
            vec![],
            None,
            Some(packet_digest),
            None,
        );
    };
    let mut packet_problems = Vec::new();
    closed(
        packet,
        &[
            "schema_version",
            "packet_id",
            "construction_id",
            "attempt_id",
            "project_ref",
            "subject_ref",
            "program_id",
            "program_version",
            "owner_authorization_ref",
            "owner_authorization_sha256",
            "stage_set_sha256",
            "attempt_basis_sha256",
            "frozen",
            "human_test_procedure",
            "requested_decision",
            "final_decision_owner",
            "open_residue",
            "rollback_path",
            "challenge_route",
            "prior_decisions",
            "authority_effect",
        ],
        "PACKET_CONTRACT_OPEN",
        &mut packet_problems,
    );
    let stage_digest = sha256(&canonical_json_bytes(attempt.get("stages").unwrap()));
    let basis_digest = sha256(&canonical_json_bytes(&attempt_basis(attempt)));
    if packet.get("schema_version").and_then(Value::as_str) != Some(PACKET_SCHEMA)
        || packet.get("construction_id").and_then(Value::as_str) != Some(construction_id.as_str())
        || packet.get("attempt_id").and_then(Value::as_str) != Some(attempt_id.as_str())
        || packet.get("project_ref").and_then(Value::as_str) != Some(auth.project_ref.as_str())
        || packet.get("subject_ref").and_then(Value::as_str) != Some(auth.subject_ref.as_str())
        || packet.get("program_id").and_then(Value::as_str) != Some(program.id.as_str())
        || packet.get("program_version").and_then(Value::as_u64) != Some(program.version)
        || packet
            .get("owner_authorization_ref")
            .and_then(Value::as_str)
            != Some(auth.reference.as_str())
        || packet
            .get("owner_authorization_sha256")
            .and_then(Value::as_str)
            != Some(auth.digest.as_str())
        || packet.get("stage_set_sha256").and_then(Value::as_str) != Some(stage_digest.as_str())
        || packet.get("attempt_basis_sha256").and_then(Value::as_str) != Some(basis_digest.as_str())
        || packet.get("frozen").and_then(Value::as_bool) != Some(true)
        || packet.get("authority_effect").and_then(Value::as_str) != Some("none")
    {
        packet_problems.push(Problem::new(
            "PACKET_BINDING_MISMATCH",
            None,
            "packet does not bind attempt basis",
        ));
    }
    for key in [
        "packet_id",
        "human_test_procedure",
        "requested_decision",
        "final_decision_owner",
        "rollback_path",
        "challenge_route",
    ] {
        if packet
            .get(key)
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        {
            packet_problems.push(Problem::new("PACKET_FIELD_REQUIRED", None, key));
        }
    }
    if !packet.get("open_residue").is_some_and(Value::is_array) {
        packet_problems.push(Problem::new("PACKET_FIELD_REQUIRED", None, "open_residue"));
    } else {
        let expected_open_residue: Vec<Value> = operational_tasks
            .iter()
            .filter(|task| matches!(task.state.as_str(), "pending" | "blocked"))
            .map(|task| Value::String(task.id.clone()))
            .collect();
        if packet.get("open_residue") != Some(&Value::Array(expected_open_residue)) {
            packet_problems.push(Problem::new(
                "PACKET_OPERATIONAL_RESIDUE_MISMATCH",
                None,
                "packet must preserve every unresolved operational task",
            ));
        }
    }
    let packet_decisions: Vec<(String, String)> =
        match packet.get("prior_decisions").and_then(Value::as_array) {
            Some(items) => items
                .iter()
                .filter_map(|item| {
                    let map = item.as_object()?;
                    if map.keys().map(String::as_str).collect::<BTreeSet<_>>()
                        != ["ref", "sha256"].into_iter().collect()
                    {
                        return None;
                    }
                    Some((
                        map.get("ref")?.as_str()?.to_owned(),
                        map.get("sha256")?.as_str()?.to_owned(),
                    ))
                })
                .collect(),
            None => {
                packet_problems.push(Problem::new(
                    "PACKET_FIELD_REQUIRED",
                    None,
                    "prior_decisions",
                ));
                vec![]
            }
        };
    if packet_decisions != prior_decisions
        || packet
            .get("prior_decisions")
            .and_then(Value::as_array)
            .is_some_and(|items| items.len() != packet_decisions.len())
    {
        packet_problems.push(Problem::new(
            "PACKET_PRIOR_DECISIONS_MISMATCH",
            None,
            "exact owner gates required",
        ));
    }
    if !packet_problems.is_empty() {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            packet_problems,
            vec![],
            None,
            Some(packet_digest),
            None,
        );
    }
    let Some(observation_ref) = attempt
        .get("human_test_observation")
        .and_then(Value::as_object)
    else {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "READY_FOR_HUMAN_TEST",
            results,
            operational_results.clone(),
            vec![],
            vec![],
            Some(json!({"kind":"run-human-test","packet_id":packet["packet_id"]})),
            Some(packet_digest),
            None,
        );
    };
    let observation_path = observation_ref
        .get("path")
        .and_then(Value::as_str)
        .unwrap_or("");
    let observation_expected = observation_ref
        .get("sha256")
        .and_then(Value::as_str)
        .unwrap_or("");
    let (observation_bytes, observation_value) = match read_exact_json(
        repository_root,
        observation_path,
        observation_expected,
        "HUMAN_TEST_OBSERVATION_CHANGED",
        "INVALID_HUMAN_TEST_OBSERVATION",
    ) {
        Ok(value) => value,
        Err(problem) => {
            return output(
                Some(&program.id),
                Some(&attempt_id),
                "STOP",
                results,
                operational_results.clone(),
                vec![problem],
                vec![],
                None,
                Some(packet_digest),
                None,
            )
        }
    };
    let observation_digest = sha256(&observation_bytes);
    let Some(observation) = observation_value.as_object() else {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            vec![Problem::new(
                "INVALID_HUMAN_TEST_OBSERVATION",
                None,
                "object required",
            )],
            vec![],
            None,
            Some(packet_digest),
            Some(observation_digest),
        );
    };
    let mut observation_problems = Vec::new();
    closed(
        observation,
        &[
            "schema_version",
            "observation_id",
            "packet_ref",
            "packet_sha256",
            "result",
            "observed_by",
            "observation_ref",
            "authority_effect",
        ],
        "OBSERVATION_CONTRACT_OPEN",
        &mut observation_problems,
    );
    if observation.get("schema_version").and_then(Value::as_str) != Some(OBSERVATION_SCHEMA)
        || observation.get("packet_ref").and_then(Value::as_str) != Some(packet_path)
        || observation.get("packet_sha256").and_then(Value::as_str) != Some(packet_digest.as_str())
        || observation.get("authority_effect").and_then(Value::as_str) != Some("none")
        || observation
            .get("observation_id")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        || observation
            .get("observed_by")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
        || observation
            .get("observation_ref")
            .and_then(Value::as_str)
            .is_none_or(str::is_empty)
    {
        observation_problems.push(Problem::new(
            "OBSERVATION_PACKET_MISMATCH",
            None,
            "observation does not bind packet",
        ));
    }
    if !observation_problems.is_empty() {
        return output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            observation_problems,
            vec![],
            None,
            Some(packet_digest),
            Some(observation_digest),
        );
    }
    match observation.get("result").and_then(Value::as_str) {
        Some("passed") => output(
            Some(&program.id),
            Some(&attempt_id),
            "REQUEST_TERMINAL_CONFIRMATION",
            results,
            operational_results.clone(),
            vec![],
            vec![],
            Some(
                json!({"kind":"request-terminal-confirmation","packet_id":packet["packet_id"],"observation_id":observation["observation_id"],"decision_owner":packet["final_decision_owner"],"requested_decision":packet["requested_decision"]}),
            ),
            Some(packet_digest),
            Some(observation_digest),
        ),
        Some("failed") => output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results.clone(),
            vec![Problem::new(
                "HUMAN_TEST_FAILED",
                None,
                "observation failed",
            )],
            vec![],
            None,
            Some(packet_digest),
            Some(observation_digest),
        ),
        _ => output(
            Some(&program.id),
            Some(&attempt_id),
            "STOP",
            results,
            operational_results,
            vec![Problem::new(
                "INVALID_HUMAN_TEST_RESULT",
                None,
                "passed or failed required",
            )],
            vec![],
            None,
            Some(packet_digest),
            Some(observation_digest),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};
    struct Fixture {
        root: PathBuf,
    }
    impl Fixture {
        fn new() -> Self {
            let nonce = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos();
            let root = std::env::temp_dir().join(format!("gcc-{}-{nonce}", std::process::id()));
            fs::create_dir_all(&root).unwrap();
            Self { root }
        }
        fn write(&self, path: &str, bytes: &[u8]) {
            let target = self.root.join(path);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::write(target, bytes).unwrap()
        }
        fn write_json(&self, path: &str, value: &Value) -> String {
            let bytes = format!("{}\n", serde_json::to_string_pretty(value).unwrap()).into_bytes();
            self.write(path, &bytes);
            sha256(&bytes)
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }
    fn program(f: &Fixture) -> Value {
        f.write(
            REQUIRED_SOURCE_BINDINGS[0].1,
            format!(
                "{}\n\nD65.\n\n{}\n\nD67.\n\n## Next\n",
                REQUIRED_SOURCE_BINDINGS[0].2, REQUIRED_SOURCE_BINDINGS[1].2
            )
            .as_bytes(),
        );
        let sources:Vec<Value>=REQUIRED_SOURCE_BINDINGS.iter().map(|(id,path,selector)|{let bytes=fs::read(f.root.join(path)).unwrap();json!({"id":id,"path":path,"selector":selector,"sha256":sha256(&heading_section(&bytes,selector).unwrap())})}).collect();
        json!({"schema_version":PROGRAM_SCHEMA,"program_id":"program-1","version":2,"source_bindings":sources,"stage_order":STAGES,"decisions":DECISIONS,"routine_confirmation_policy":"false-except-terminal-request","predecessor_failure_policy":"fail-closed-and-mark-downstream-not_evaluable","work_lane_policy":"separate-product-construction-from-operational-support","operational_blocking_policy":"only-exact-frontier-prerequisite-or-applicable-boundary","operational_residue_policy":"defer-visible-and-continue-product-construction","retroactive_approval":"forbidden","effect_ceiling":"none","authority_effect":"none"})
    }
    fn stage(f: &Fixture, id: &str, state: &str) -> Value {
        let (reference, digest) = if state == "validated" {
            let path = format!("artifacts/{id}.json");
            let digest = f.write_json(&path, &json!({"stage":id,"candidate":true}));
            (Some(path), Some(digest))
        } else {
            (None, None)
        };
        json!({"stage":id,"lane":"product-construction","applicable":true,"state":state,"artifact_ref":reference,"artifact_sha256":digest,"owner_gate_required":false,"owner_gate_bound":false,"owner_gate_ref":null,"owner_gate_sha256":null})
    }
    fn attempt(f: &Fixture, states: &[&str]) -> Value {
        let stages: Vec<Value> = STAGES
            .iter()
            .zip(states)
            .map(|(id, state)| stage(f, id, state))
            .collect();
        let path = "authorizations/attempt-1.json";
        let record = json!({"schema_version":AUTHORIZATION_SCHEMA,"envelope_id":"auth-1","construction_id":"construction-1","attempt_id":"attempt-1","program_id":"program-1","program_version":2,"subject_ref":"subject-1","project_ref":"project-1","permitted_stages":STAGES,"repository_local":true,"reversible":true,"effect_ceiling":"none","owner_route":"human owner","authority_effect":"none"});
        let digest = f.write_json(path, &record);
        json!({"schema_version":ATTEMPT_SCHEMA,"construction_id":"construction-1","attempt_id":"attempt-1","program_id":"program-1","program_version":2,"authorization":{"envelope_id":"auth-1","owner_authorization_ref":path,"owner_authorization_sha256":digest,"subject_ref":"subject-1","project_ref":"project-1","permitted_stages":STAGES,"repository_local":true,"reversible":true,"effect_ceiling":"none"},"stages":stages,"operational_tasks":[],"blockers":[],"human_test_packet":null,"human_test_observation":null,"routine_confirmation_requested":false})
    }
    fn operational_task(
        id: &str,
        state: &str,
        applies_to_stage: Option<&str>,
        blocking_basis: &str,
    ) -> Value {
        json!({"task_id":id,"lane":"operational-support","state":state,"applies_to_stage":applies_to_stage,"blocking_basis":blocking_basis,"detail":"bounded operational support","owner_route":"operations owner"})
    }
    fn attach_gate(f: &Fixture, a: &mut Value, stage_index: usize) {
        let program = Program {
            id: "program-1".into(),
            version: 2,
            sources: Vec::new(),
        };
        let auth = Authorization {
            envelope_id: a["authorization"]["envelope_id"].as_str().unwrap().into(),
            reference: a["authorization"]["owner_authorization_ref"]
                .as_str()
                .unwrap()
                .into(),
            digest: a["authorization"]["owner_authorization_sha256"]
                .as_str()
                .unwrap()
                .into(),
            subject_ref: a["authorization"]["subject_ref"].as_str().unwrap().into(),
            project_ref: a["authorization"]["project_ref"].as_str().unwrap().into(),
            permitted: STAGES.iter().map(|value| value.to_string()).collect(),
        };
        let stage = STAGES[stage_index];
        let path = format!("gates/{stage}.json");
        let record = json!({"schema_version":OWNER_GATE_SCHEMA,"gate_id":format!("gate-{stage}"),"construction_id":"construction-1","attempt_id":"attempt-1","program_id":"program-1","program_version":2,"stage":stage,"subject_ref":"subject-1","project_ref":"project-1","owner_authorization_ref":auth.reference.clone(),"owner_authorization_sha256":auth.digest.clone(),"scope_sha256":gate_scope_digest("construction-1","attempt-1",&program,&auth,stage),"decision":"accept-stage-for-bounded-attempt","owner_route":"human owner","authority_effect":"none","effect_authorized":false});
        let digest = f.write_json(&path, &record);
        a["stages"][stage_index]["owner_gate_required"] = Value::Bool(true);
        a["stages"][stage_index]["owner_gate_bound"] = Value::Bool(true);
        a["stages"][stage_index]["owner_gate_ref"] = Value::String(path);
        a["stages"][stage_index]["owner_gate_sha256"] = Value::String(digest);
    }
    fn attach_packet(f: &Fixture, a: &mut Value, observation: bool) {
        let basis = attempt_basis(a.as_object().unwrap());
        let path = "packets/test.json";
        let open_residue: Vec<Value> = a["operational_tasks"]
            .as_array()
            .unwrap()
            .iter()
            .filter(|task| matches!(task["state"].as_str(), Some("pending" | "blocked")))
            .map(|task| task["task_id"].clone())
            .collect();
        let packet = json!({"schema_version":PACKET_SCHEMA,"packet_id":"packet-1","construction_id":a["construction_id"],"attempt_id":a["attempt_id"],"project_ref":a["authorization"]["project_ref"],"subject_ref":a["authorization"]["subject_ref"],"program_id":a["program_id"],"program_version":a["program_version"],"owner_authorization_ref":a["authorization"]["owner_authorization_ref"],"owner_authorization_sha256":a["authorization"]["owner_authorization_sha256"],"stage_set_sha256":sha256(&canonical_json_bytes(&a["stages"])),"attempt_basis_sha256":sha256(&canonical_json_bytes(&basis)),"frozen":true,"human_test_procedure":"Run exact candidate.","requested_decision":"accept exact candidate","final_decision_owner":"human owner","open_residue":open_residue,"rollback_path":"restore pre-attempt bytes","challenge_route":"governance owner","prior_decisions":[],"authority_effect":"none"});
        let digest = f.write_json(path, &packet);
        a["human_test_packet"] = json!({"path":path,"sha256":digest});
        if observation {
            let op = "observations/pass.json";
            let record = json!({"schema_version":OBSERVATION_SCHEMA,"observation_id":"observation-1","packet_ref":path,"packet_sha256":digest,"result":"passed","observed_by":"human tester","observation_ref":"local human test","authority_effect":"none"});
            let od = f.write_json(op, &record);
            a["human_test_observation"] = json!({"path":op,"sha256":od});
        }
    }
    fn decision(v: &Value) -> &str {
        v["decision"].as_str().unwrap()
    }
    #[test]
    fn continue_case() {
        let f = Fixture::new();
        let p = program(&f);
        assert_eq!(
            decision(&evaluate(
                &p,
                &attempt(
                    &f,
                    &[
                        "validated",
                        "validated",
                        "pending",
                        "pending",
                        "pending",
                        "pending",
                        "pending",
                        "pending",
                        "pending"
                    ]
                ),
                &f.root
            )),
            "CONTINUE"
        );
    }
    #[test]
    fn unrelated_operation_is_deferred_without_stopping_construction() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["operational_tasks"] =
            json!([operational_task("ops-maintenance", "pending", None, "none",)]);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "CONTINUE");
        assert_eq!(
            result["operational_task_results"][0]["effective_state"],
            "deferred"
        );
        assert!(result["blocker_requests"].as_array().unwrap().is_empty());
    }
    #[test]
    fn future_operational_prerequisite_is_deferred_until_its_stage() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["operational_tasks"] = json!([operational_task(
            "ops-runtime-fixture",
            "pending",
            Some("runtime-evidence"),
            "exact-prerequisite",
        )]);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "CONTINUE");
        assert_eq!(
            result["operational_task_results"][0]["effective_state"],
            "deferred"
        );
    }
    #[test]
    fn exact_operational_prerequisite_blocks_only_its_frontier() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["operational_tasks"] = json!([operational_task(
            "ops-business-input",
            "pending",
            Some("business-ontology"),
            "exact-prerequisite",
        )]);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert!(result["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["code"] == "OPERATIONAL_PREREQUISITE_PENDING"));
    }
    #[test]
    fn applicable_operational_boundary_fails_closed() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["operational_tasks"] = json!([operational_task(
            "ops-credential-boundary",
            "blocked",
            Some("business-ontology"),
            "credential-boundary",
        )]);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert!(result["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["code"] == "OPERATIONAL_BOUNDARY_UNRESOLVED"));
    }
    #[test]
    fn operational_boundary_without_exact_stage_is_rejected() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["operational_tasks"] = json!([operational_task(
            "ops-ambiguous-boundary",
            "blocked",
            None,
            "authority-boundary",
        )]);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert!(result["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["code"] == "OPERATIONAL_BLOCKING_SCOPE_REQUIRED"));
    }
    #[test]
    fn terminal_packet_preserves_deferred_operational_residue() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        a["operational_tasks"] = json!([operational_task(
            "ops-deferred-at-test",
            "pending",
            None,
            "none",
        )]);
        attach_packet(&f, &mut a, false);
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "READY_FOR_HUMAN_TEST");

        let path = a["human_test_packet"]["path"].as_str().unwrap();
        let mut packet: Value =
            serde_json::from_slice(&fs::read(f.root.join(path)).unwrap()).unwrap();
        packet["open_residue"] = json!([]);
        let digest = f.write_json(path, &packet);
        a["human_test_packet"]["sha256"] = Value::String(digest);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert!(result["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["code"] == "PACKET_OPERATIONAL_RESIDUE_MISMATCH"));
    }
    #[test]
    fn stop_case() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["blockers"] = json!([{"code":"ACTIVE_WRITER","detail":"conflict"}]);
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP");
    }
    #[test]
    fn ready_case() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, false);
        let r = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&r), "READY_FOR_HUMAN_TEST");
        assert_eq!(r["routine_confirmation_required"], false);
    }
    #[test]
    fn terminal_case() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, true);
        let r = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&r), "REQUEST_TERMINAL_CONFIRMATION");
        assert_eq!(r["routine_confirmation_required"], true);
    }
    #[test]
    fn skipped_predecessor() {
        let f = Fixture::new();
        let p = program(&f);
        let r = evaluate(
            &p,
            &attempt(
                &f,
                &[
                    "validated",
                    "missing",
                    "validated",
                    "pending",
                    "pending",
                    "pending",
                    "pending",
                    "pending",
                    "pending",
                ],
            ),
            &f.root,
        );
        assert_eq!(decision(&r), "STOP");
        assert_eq!(r["stage_results"][2]["effective_state"], "not_evaluable");
    }
    #[test]
    fn missing_gate() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["stages"][2]["owner_gate_required"] = Value::Bool(true);
        assert_eq!(
            evaluate(&p, &a, &f.root)["authority_requests"][0]["code"],
            "MISSING_OWNER_GATE"
        );
    }
    #[test]
    fn changed_packet() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, false);
        f.write("packets/test.json", b"changed\n");
        assert_eq!(
            evaluate(&p, &a, &f.root)["blocker_requests"][0]["code"],
            "HUMAN_TEST_PACKET_CHANGED"
        );
    }
    #[test]
    fn implicit_confirmation() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["routine_confirmation_requested"] = Value::Bool(true);
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP");
    }
    #[test]
    fn changed_authorization() {
        let f = Fixture::new();
        let p = program(&f);
        let a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        f.write("authorizations/attempt-1.json", b"changed\n");
        assert!(evaluate(&p, &a, &f.root)["authority_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|v| v["code"] == "OWNER_AUTHORIZATION_CHANGED"));
    }
    #[test]
    fn fabricated_authorization() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        let d = f.write_json("authorizations/fake.json", &json!({"fabricated":true}));
        a["authorization"]["owner_authorization_ref"] =
            Value::String("authorizations/fake.json".into());
        a["authorization"]["owner_authorization_sha256"] = Value::String(d);
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP");
    }
    #[test]
    fn fabricated_stage_digest() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["stages"][0]["artifact_sha256"] = Value::String(sha256(b"fake"));
        assert!(evaluate(&p, &a, &f.root)["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|v| v["code"] == "VALIDATED_STAGE_ARTIFACT_CHANGED"));
    }
    #[test]
    fn gate_boolean_without_evidence() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["stages"][2]["owner_gate_required"] = Value::Bool(true);
        a["stages"][2]["owner_gate_bound"] = Value::Bool(true);
        assert!(evaluate(&p, &a, &f.root)["authority_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|v| v["code"] == "OWNER_GATE_EVIDENCE_REQUIRED"));
    }
    #[test]
    fn exact_owner_gate_allows_the_authorized_next_stage() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        attach_gate(&f, &mut a, 2);
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "CONTINUE");
    }
    #[test]
    fn packet_must_list_every_exact_prior_gate() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_gate(&f, &mut a, 2);
        attach_packet(&f, &mut a, false);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert!(result["blocker_requests"]
            .as_array()
            .unwrap()
            .iter()
            .any(|value| value["code"] == "PACKET_PRIOR_DECISIONS_MISMATCH"));
    }
    #[test]
    fn basis_change_after_freeze() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, false);
        let changed_path = "artifacts/changed-runtime-evidence.json";
        let changed_digest = f.write_json(
            changed_path,
            &json!({"stage":"runtime-evidence","candidate":"changed-after-freeze"}),
        );
        a["stages"][8]["artifact_ref"] = Value::String(changed_path.into());
        a["stages"][8]["artifact_sha256"] = Value::String(changed_digest);
        let result = evaluate(&p, &a, &f.root);
        assert_eq!(decision(&result), "STOP");
        assert_eq!(
            result["blocker_requests"][0]["code"],
            "PACKET_BINDING_MISMATCH"
        );
    }
    #[test]
    fn complete_packet_fields() {
        for key in [
            "open_residue",
            "rollback_path",
            "challenge_route",
            "prior_decisions",
        ] {
            let f = Fixture::new();
            let p = program(&f);
            let mut a = attempt(&f, &["validated"; 9]);
            attach_packet(&f, &mut a, false);
            let path = a["human_test_packet"]["path"].as_str().unwrap();
            let mut packet: Value =
                serde_json::from_slice(&fs::read(f.root.join(path)).unwrap()).unwrap();
            packet.as_object_mut().unwrap().remove(key);
            let d = f.write_json(path, &packet);
            a["human_test_packet"]["sha256"] = Value::String(d);
            assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP", "{key}");
        }
    }
    #[test]
    fn program_contract_mutations() {
        for key in [
            "routine_confirmation_policy",
            "predecessor_failure_policy",
            "work_lane_policy",
            "operational_blocking_policy",
            "operational_residue_policy",
            "retroactive_approval",
            "decisions",
        ] {
            let f = Fixture::new();
            let mut p = program(&f);
            p[key] = json!("mutated");
            assert_eq!(
                validate_program(&p, &f.root)["status"],
                "NOT_EVALUABLE",
                "{key}"
            );
        }
    }
    #[test]
    fn duplicate_source() {
        let f = Fixture::new();
        let mut p = program(&f);
        let first = p["source_bindings"][0].clone();
        p["source_bindings"].as_array_mut().unwrap().push(first);
        assert_eq!(validate_program(&p, &f.root)["status"], "NOT_EVALUABLE");
    }
    #[test]
    fn duplicate_permitted_stage() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        a["authorization"]["permitted_stages"]
            .as_array_mut()
            .unwrap()
            .push(Value::String("canonical-definitions".into()));
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP");
    }
    #[test]
    fn observation_binds_same_packet() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, true);
        let path = a["human_test_observation"]["path"].as_str().unwrap();
        let mut o: Value = serde_json::from_slice(&fs::read(f.root.join(path)).unwrap()).unwrap();
        o["packet_sha256"] = Value::String(sha256(b"other"));
        let d = f.write_json(path, &o);
        a["human_test_observation"]["sha256"] = Value::String(d);
        assert_eq!(
            evaluate(&p, &a, &f.root)["blocker_requests"][0]["code"],
            "OBSERVATION_PACKET_MISMATCH"
        );
    }
    #[test]
    fn stale_source() {
        let f = Fixture::new();
        let p = program(&f);
        let a = attempt(
            &f,
            &[
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        f.write(REQUIRED_SOURCE_BINDINGS[0].1, b"changed\n");
        assert_eq!(decision(&evaluate(&p, &a, &f.root)), "STOP");
    }
    #[test]
    fn deterministic() {
        let f = Fixture::new();
        let p = program(&f);
        let a = attempt(
            &f,
            &[
                "validated",
                "validated",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
                "pending",
            ],
        );
        assert_eq!(evaluate(&p, &a, &f.root), evaluate(&p, &a, &f.root));
    }
    #[test]
    fn no_effect() {
        let f = Fixture::new();
        let p = program(&f);
        let mut a = attempt(&f, &["validated"; 9]);
        attach_packet(&f, &mut a, true);
        let r = evaluate(&p, &a, &f.root);
        assert_eq!(r["effect_authorized"], false);
        assert_eq!(r["authority_effect"], "none");
    }
}
