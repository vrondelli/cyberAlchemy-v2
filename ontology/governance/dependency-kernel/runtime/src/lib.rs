//! Selector-level, no-effect governance dependency evaluation.

use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const PROGRAM_SCHEMA: &str = "cav2-governance-program/v1";
pub const REQUEST_SCHEMA: &str = "cav2-governance-dependency-request/v1";
pub const ACTIVATION_SCHEMA: &str = "cav2-governance-activation-binding/v1";

#[derive(Clone, Debug, Eq, PartialEq)]
struct DependencyRecord {
    id: String,
    path: String,
    scope_kind: String,
    selector: Option<String>,
    admitted_digest: String,
    depends_on: Vec<String>,
}

#[derive(Clone, Debug)]
struct ParsedProgram {
    id: String,
    version: u64,
    selection_path: String,
    selection_digest: String,
    dependencies: BTreeMap<String, DependencyRecord>,
}

#[derive(Clone, Debug)]
struct ParsedRequest {
    id: String,
    program_id: String,
    program_version: u64,
    mode: String,
    roots: Vec<String>,
    candidate_inputs: BTreeMap<String, String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
struct Problem {
    code: String,
    subject: Option<String>,
    detail: String,
}

impl Problem {
    fn new(code: &str, subject: Option<&str>, detail: impl Into<String>) -> Self {
        Self {
            code: code.to_owned(),
            subject: subject.map(str::to_owned),
            detail: detail.into(),
        }
    }

    fn value(&self) -> Value {
        json!({"code": self.code, "subject": self.subject, "detail": self.detail})
    }
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

fn object<'a>(
    value: &'a Value,
    label: &str,
    problems: &mut Vec<Problem>,
) -> Option<&'a Map<String, Value>> {
    match value.as_object() {
        Some(value) => Some(value),
        None => {
            problems.push(Problem::new(
                "INVALID_OBJECT",
                Some(label),
                "expected a JSON object",
            ));
            None
        }
    }
}

fn required_string(
    map: &Map<String, Value>,
    key: &str,
    problems: &mut Vec<Problem>,
) -> Option<String> {
    match map
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
    {
        Some(value) => Some(value.to_owned()),
        None => {
            problems.push(Problem::new(
                "MISSING_OR_INVALID_FIELD",
                Some(key),
                "expected a non-empty string",
            ));
            None
        }
    }
}

fn required_u64(map: &Map<String, Value>, key: &str, problems: &mut Vec<Problem>) -> Option<u64> {
    match map
        .get(key)
        .and_then(Value::as_u64)
        .filter(|value| *value > 0)
    {
        Some(value) => Some(value),
        None => {
            problems.push(Problem::new(
                "MISSING_OR_INVALID_FIELD",
                Some(key),
                "expected a positive integer",
            ));
            None
        }
    }
}

fn required_string_array(
    map: &Map<String, Value>,
    key: &str,
    problems: &mut Vec<Problem>,
) -> Vec<String> {
    let Some(items) = map.get(key).and_then(Value::as_array) else {
        problems.push(Problem::new(
            "MISSING_OR_INVALID_FIELD",
            Some(key),
            "expected an array",
        ));
        return Vec::new();
    };
    let mut values = Vec::new();
    for (index, item) in items.iter().enumerate() {
        match item.as_str().filter(|value| !value.is_empty()) {
            Some(value) => values.push(value.to_owned()),
            None => problems.push(Problem::new(
                "INVALID_ARRAY_ITEM",
                Some(key),
                format!("item {index} must be a non-empty string"),
            )),
        }
    }
    values
}

fn duplicate_values(values: &[String]) -> BTreeSet<String> {
    let mut seen = BTreeSet::new();
    values
        .iter()
        .filter_map(|value| {
            if seen.insert(value.clone()) {
                None
            } else {
                Some(value.clone())
            }
        })
        .collect()
}

fn parse_program(value: &Value) -> Result<ParsedProgram, Vec<Problem>> {
    let mut problems = Vec::new();
    let Some(map) = object(value, "program", &mut problems) else {
        return Err(problems);
    };
    if map.get("schema_version").and_then(Value::as_str) != Some(PROGRAM_SCHEMA) {
        problems.push(Problem::new(
            "INVALID_SCHEMA_VERSION",
            Some("schema_version"),
            PROGRAM_SCHEMA,
        ));
    }
    if map.get("effect_ceiling").and_then(Value::as_str) != Some("none") {
        problems.push(Problem::new(
            "EFFECT_CEILING_MUST_BE_NONE",
            Some("effect_ceiling"),
            "kernel programs cannot grant effects",
        ));
    }
    if map.get("authority_effect").and_then(Value::as_str) != Some("none") {
        problems.push(Problem::new(
            "AUTHORITY_EFFECT_MUST_BE_NONE",
            Some("authority_effect"),
            "kernel programs cannot grant authority",
        ));
    }
    let id = required_string(map, "program_id", &mut problems).unwrap_or_default();
    let version = required_u64(map, "version", &mut problems).unwrap_or_default();
    let (selection_path, selection_digest) =
        match map.get("owner_selection").and_then(Value::as_object) {
            Some(selection) => (
                required_string(selection, "path", &mut problems).unwrap_or_default(),
                required_string(selection, "sha256", &mut problems).unwrap_or_default(),
            ),
            None => {
                problems.push(Problem::new(
                    "MISSING_OWNER_SELECTION",
                    Some("owner_selection"),
                    "exact owner selection is required",
                ));
                (String::new(), String::new())
            }
        };
    if !selection_digest.is_empty() && !is_sha256(&selection_digest) {
        problems.push(Problem::new(
            "INVALID_DIGEST",
            Some("owner_selection.sha256"),
            "expected lowercase SHA-256",
        ));
    }

    let mut dependencies = BTreeMap::new();
    let Some(items) = map.get("dependencies").and_then(Value::as_array) else {
        problems.push(Problem::new(
            "MISSING_DEPENDENCIES",
            Some("dependencies"),
            "at least one dependency is required",
        ));
        return Err(problems);
    };
    if items.is_empty() {
        problems.push(Problem::new(
            "MISSING_DEPENDENCIES",
            Some("dependencies"),
            "at least one dependency is required",
        ));
    }
    for (index, item) in items.iter().enumerate() {
        let label = format!("dependencies[{index}]");
        let Some(dependency) = object(item, &label, &mut problems) else {
            continue;
        };
        let dependency_id =
            required_string(dependency, "dependency_id", &mut problems).unwrap_or_default();
        let path = required_string(dependency, "path", &mut problems).unwrap_or_default();
        let scope_kind =
            required_string(dependency, "scope_kind", &mut problems).unwrap_or_default();
        if !matches!(
            scope_kind.as_str(),
            "whole-file" | "heading-section" | "json-record" | "json-record-set"
        ) {
            problems.push(Problem::new(
                "UNSUPPORTED_SCOPE_KIND",
                Some(&dependency_id),
                scope_kind.clone(),
            ));
        }
        let selector = dependency
            .get("selector")
            .and_then(Value::as_str)
            .map(str::to_owned);
        if scope_kind != "whole-file" && selector.as_deref().unwrap_or("").is_empty() {
            problems.push(Problem::new(
                "SELECTOR_REQUIRED",
                Some(&dependency_id),
                "selected scopes require a selector",
            ));
        }
        if scope_kind == "whole-file"
            && dependency
                .get("selector")
                .is_some_and(|value| !value.is_null())
        {
            problems.push(Problem::new(
                "SELECTOR_FORBIDDEN",
                Some(&dependency_id),
                "whole-file selector must be null",
            ));
        }
        let admitted_digest =
            required_string(dependency, "admitted_digest", &mut problems).unwrap_or_default();
        if !admitted_digest.is_empty() && !is_sha256(&admitted_digest) {
            problems.push(Problem::new(
                "INVALID_DIGEST",
                Some(&dependency_id),
                "admitted_digest must be lowercase SHA-256",
            ));
        }
        let depends_on = required_string_array(dependency, "depends_on", &mut problems);
        for duplicate in duplicate_values(&depends_on) {
            problems.push(Problem::new(
                "DUPLICATE_DEPENDENCY_EDGE",
                Some(&dependency_id),
                duplicate,
            ));
        }
        let record = DependencyRecord {
            id: dependency_id.clone(),
            path,
            scope_kind,
            selector,
            admitted_digest,
            depends_on,
        };
        if dependencies.insert(dependency_id.clone(), record).is_some() {
            problems.push(Problem::new(
                "DUPLICATE_DEPENDENCY_ID",
                Some(&dependency_id),
                "dependency IDs must be unique",
            ));
        }
    }
    for dependency in dependencies.values() {
        for target in &dependency.depends_on {
            if !dependencies.contains_key(target) {
                problems.push(Problem::new(
                    "UNRESOLVED_DEPENDENCY_EDGE",
                    Some(&dependency.id),
                    target.clone(),
                ));
            }
        }
    }
    if problems.is_empty() {
        Ok(ParsedProgram {
            id,
            version,
            selection_path,
            selection_digest,
            dependencies,
        })
    } else {
        Err(problems)
    }
}

fn parse_request(value: &Value) -> Result<ParsedRequest, Vec<Problem>> {
    let mut problems = Vec::new();
    let Some(map) = object(value, "request", &mut problems) else {
        return Err(problems);
    };
    if map.get("schema_version").and_then(Value::as_str) != Some(REQUEST_SCHEMA) {
        problems.push(Problem::new(
            "INVALID_SCHEMA_VERSION",
            Some("schema_version"),
            REQUEST_SCHEMA,
        ));
    }
    let id = required_string(map, "request_id", &mut problems).unwrap_or_default();
    let program_id = required_string(map, "program_id", &mut problems).unwrap_or_default();
    let program_version = required_u64(map, "program_version", &mut problems).unwrap_or_default();
    let mode = required_string(map, "mode", &mut problems).unwrap_or_default();
    if !matches!(mode.as_str(), "admitted_use" | "candidate_construction") {
        problems.push(Problem::new(
            "INVALID_EVALUATION_MODE",
            Some("mode"),
            mode.clone(),
        ));
    }
    let roots = required_string_array(map, "root_dependency_ids", &mut problems);
    if roots.is_empty() {
        problems.push(Problem::new(
            "MISSING_ROOT_DEPENDENCY",
            Some("root_dependency_ids"),
            "at least one root is required",
        ));
    }
    for duplicate in duplicate_values(&roots) {
        problems.push(Problem::new(
            "DUPLICATE_ROOT_DEPENDENCY",
            Some("root_dependency_ids"),
            duplicate,
        ));
    }
    let mut candidate_inputs = BTreeMap::new();
    match map.get("candidate_inputs").and_then(Value::as_object) {
        Some(inputs) => {
            for (dependency_id, value) in inputs {
                match value.as_str().filter(|digest| is_sha256(digest)) {
                    Some(digest) => {
                        candidate_inputs.insert(dependency_id.clone(), digest.to_owned());
                    }
                    None => problems.push(Problem::new(
                        "INVALID_CANDIDATE_DIGEST",
                        Some(dependency_id),
                        "expected lowercase SHA-256",
                    )),
                }
            }
        }
        None => problems.push(Problem::new(
            "MISSING_OR_INVALID_FIELD",
            Some("candidate_inputs"),
            "expected an object",
        )),
    }
    if mode == "admitted_use" && !candidate_inputs.is_empty() {
        problems.push(Problem::new(
            "CANDIDATE_INPUT_FORBIDDEN",
            Some("candidate_inputs"),
            "admitted_use cannot select candidate inputs",
        ));
    }
    if problems.is_empty() {
        Ok(ParsedRequest {
            id,
            program_id,
            program_version,
            mode,
            roots,
            candidate_inputs,
        })
    } else {
        Err(problems)
    }
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
    let mut bytes =
        serde_json::to_vec(&canonical_value(value)).expect("JSON values are serializable");
    bytes.push(b'\n');
    bytes
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
        return Err(Problem::new(
            "PATH_ESCAPE",
            Some(relative),
            "path must be repository-relative without parent traversal",
        ));
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
                    return Err(Problem::new(
                        "SYMLINK_FORBIDDEN",
                        Some(relative),
                        "dependency paths cannot traverse symlinks",
                    ));
                }
            }
        }
    }
    let canonical = joined.canonicalize().map_err(|error| {
        Problem::new("DEPENDENCY_UNAVAILABLE", Some(relative), error.to_string())
    })?;
    if !canonical.starts_with(&root) {
        return Err(Problem::new(
            "PATH_ESCAPE",
            Some(relative),
            "canonical path escapes repository root",
        ));
    }
    Ok(canonical)
}

fn heading_section(bytes: &[u8], selector: &str) -> Result<Vec<u8>, Problem> {
    let text = std::str::from_utf8(bytes)
        .map_err(|error| Problem::new("INVALID_UTF8", Some(selector), error.to_string()))?;
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
            "AMBIGUOUS_SELECTOR",
            Some(selector),
            format!("expected one heading, found {}", matches.len()),
        ));
    }
    let start = matches[0];
    let end = (start + 1..lines.len())
        .find(|index| lines[*index].starts_with("## "))
        .unwrap_or(lines.len());
    Ok(lines[start..end].concat().into_bytes())
}

fn parse_json_selector(selector: &str) -> Result<(&str, &str, Vec<&str>), Problem> {
    let (left, values) = selector.split_once('=').ok_or_else(|| {
        Problem::new(
            "INVALID_JSON_SELECTOR",
            Some(selector),
            "expected collection:field=value",
        )
    })?;
    let (collection, field) = left.split_once(':').ok_or_else(|| {
        Problem::new(
            "INVALID_JSON_SELECTOR",
            Some(selector),
            "expected collection:field=value",
        )
    })?;
    let values: Vec<&str> = values
        .split(',')
        .filter(|value| !value.is_empty())
        .collect();
    if collection.is_empty() || field.is_empty() || values.is_empty() {
        return Err(Problem::new(
            "INVALID_JSON_SELECTOR",
            Some(selector),
            "collection, field, and values must be non-empty",
        ));
    }
    Ok((collection, field, values))
}

fn json_records(bytes: &[u8], selector: &str, record_set: bool) -> Result<Vec<u8>, Problem> {
    let document: Value = serde_json::from_slice(bytes)
        .map_err(|error| Problem::new("INVALID_JSON_SOURCE", Some(selector), error.to_string()))?;
    let (collection, field, values) = parse_json_selector(selector)?;
    if !record_set && values.len() != 1 {
        return Err(Problem::new(
            "INVALID_JSON_SELECTOR",
            Some(selector),
            "json-record requires exactly one value",
        ));
    }
    let items = document
        .get(collection)
        .and_then(Value::as_array)
        .ok_or_else(|| {
            Problem::new(
                "COLLECTION_NOT_FOUND",
                Some(selector),
                collection.to_owned(),
            )
        })?;
    let mut selected = Vec::new();
    for value in values {
        let matches: Vec<&Value> = items
            .iter()
            .filter(|item| item.get(field).and_then(Value::as_str) == Some(value))
            .collect();
        if matches.len() != 1 {
            return Err(Problem::new(
                "AMBIGUOUS_SELECTOR",
                Some(selector),
                format!("{field}={value} matched {} records", matches.len()),
            ));
        }
        selected.push(matches[0].clone());
    }
    selected.sort_by(|left, right| {
        let left = left.get(field).and_then(Value::as_str).unwrap_or("");
        let right = right.get(field).and_then(Value::as_str).unwrap_or("");
        left.cmp(right)
    });
    Ok(if record_set {
        canonical_json_bytes(&Value::Array(selected))
    } else {
        canonical_json_bytes(&selected[0])
    })
}

fn selected_bytes(
    repository_root: &Path,
    dependency: &DependencyRecord,
) -> Result<Vec<u8>, Problem> {
    let path = resolve_path(repository_root, &dependency.path)?;
    let bytes = fs::read(path).map_err(|error| {
        Problem::new(
            "DEPENDENCY_UNAVAILABLE",
            Some(&dependency.id),
            error.to_string(),
        )
    })?;
    match dependency.scope_kind.as_str() {
        "whole-file" => Ok(bytes),
        "heading-section" => heading_section(&bytes, dependency.selector.as_deref().unwrap_or("")),
        "json-record" => json_records(&bytes, dependency.selector.as_deref().unwrap_or(""), false),
        "json-record-set" => {
            json_records(&bytes, dependency.selector.as_deref().unwrap_or(""), true)
        }
        other => Err(Problem::new(
            "UNSUPPORTED_SCOPE_KIND",
            Some(&dependency.id),
            other.to_owned(),
        )),
    }
}

fn close_dependencies(
    program: &ParsedProgram,
    roots: &[String],
) -> Result<BTreeSet<String>, Vec<Problem>> {
    let mut problems = Vec::new();
    let mut closed = BTreeSet::new();
    let mut visiting = BTreeSet::new();
    fn visit(
        id: &str,
        program: &ParsedProgram,
        closed: &mut BTreeSet<String>,
        visiting: &mut BTreeSet<String>,
        problems: &mut Vec<Problem>,
    ) {
        if closed.contains(id) {
            return;
        }
        let Some(dependency) = program.dependencies.get(id) else {
            problems.push(Problem::new(
                "UNKNOWN_ROOT_DEPENDENCY",
                Some(id),
                "dependency does not exist in program",
            ));
            return;
        };
        if !visiting.insert(id.to_owned()) {
            problems.push(Problem::new(
                "DEPENDENCY_CYCLE",
                Some(id),
                "cycle exists in selected closure",
            ));
            return;
        }
        for child in &dependency.depends_on {
            visit(child, program, closed, visiting, problems);
        }
        visiting.remove(id);
        closed.insert(id.to_owned());
    }
    for root in roots {
        visit(root, program, &mut closed, &mut visiting, &mut problems);
    }
    if problems.is_empty() {
        Ok(closed)
    } else {
        Err(problems)
    }
}

fn base_result(
    status: &str,
    program_id: Option<&str>,
    request_id: Option<&str>,
    problems: Vec<Problem>,
) -> Value {
    let mut value = json!({
        "schema_version": "cav2-governance-dependency-evaluation/v1",
        "status": status,
        "program_id": program_id,
        "request_id": request_id,
        "dependency_set_digest": Value::Null,
        "observations": [],
        "problems": problems.iter().map(Problem::value).collect::<Vec<_>>(),
        "effect_authorized": false,
        "authority_effect": "none",
        "enforcement_effect": "none"
    });
    let id = sha256(&canonical_json_bytes(&value));
    value
        .as_object_mut()
        .expect("object")
        .insert("evaluation_id".to_owned(), Value::String(id));
    value
}

fn validate_selection_binding(bytes: &[u8], program: &ParsedProgram) -> Result<String, Problem> {
    let selection: Value = serde_json::from_slice(bytes).map_err(|error| {
        Problem::new(
            "INVALID_OWNER_SELECTION",
            Some(&program.selection_path),
            error.to_string(),
        )
    })?;
    if selection.get("schema_version").and_then(Value::as_str) != Some("cav2-owner-selection/v1") {
        return Err(Problem::new(
            "INVALID_OWNER_SELECTION_SCHEMA",
            Some(&program.selection_path),
            "expected cav2-owner-selection/v1",
        ));
    }
    let binding = selection
        .get("program_binding")
        .and_then(Value::as_object)
        .ok_or_else(|| {
            Problem::new(
                "PROGRAM_BINDING_REQUIRED",
                Some(&program.selection_path),
                "owner selection must bind one program identity and version",
            )
        })?;
    if binding.get("program_id").and_then(Value::as_str) != Some(program.id.as_str())
        || binding.get("program_version").and_then(Value::as_u64) != Some(program.version)
    {
        return Err(Problem::new(
            "OWNER_SELECTION_PROGRAM_MISMATCH",
            Some(&program.selection_path),
            "program identity or version is not the selected binding",
        ));
    }
    match binding.get("status").and_then(Value::as_str) {
        Some("candidate")
            if binding.get("activation").and_then(Value::as_str) == Some("not-activated") =>
        {
            Ok("candidate".to_owned())
        }
        Some("active") => Ok("active".to_owned()),
        _ => Err(Problem::new(
            "INVALID_PROGRAM_BINDING_STATUS",
            Some(&program.selection_path),
            "expected a non-activated candidate or an active program selection",
        )),
    }
}

pub fn validate_program(program: &Value, repository_root: &Path) -> Value {
    let parsed = match parse_program(program) {
        Ok(program) => program,
        Err(problems) => return base_result("NOT_EVALUABLE", None, None, problems),
    };
    match resolve_path(repository_root, &parsed.selection_path).and_then(|path| {
        fs::read(path).map_err(|error| {
            Problem::new(
                "OWNER_SELECTION_UNAVAILABLE",
                Some(&parsed.selection_path),
                error.to_string(),
            )
        })
    }) {
        Ok(bytes) if sha256(&bytes) == parsed.selection_digest => {
            match validate_selection_binding(&bytes, &parsed) {
                Ok(_) => base_result("PASS", Some(&parsed.id), None, Vec::new()),
                Err(problem) => base_result("NOT_EVALUABLE", Some(&parsed.id), None, vec![problem]),
            }
        }
        Ok(_) => base_result(
            "NOT_EVALUABLE",
            Some(&parsed.id),
            None,
            vec![Problem::new(
                "OWNER_SELECTION_DRIFT",
                Some(&parsed.selection_path),
                "selection digest does not match",
            )],
        ),
        Err(problem) => base_result("NOT_EVALUABLE", Some(&parsed.id), None, vec![problem]),
    }
}

pub fn evaluate(program_value: &Value, request_value: &Value, repository_root: &Path) -> Value {
    let program = match parse_program(program_value) {
        Ok(program) => program,
        Err(problems) => return base_result("NOT_EVALUABLE", None, None, problems),
    };
    let request = match parse_request(request_value) {
        Ok(request) => request,
        Err(problems) => return base_result("NOT_EVALUABLE", Some(&program.id), None, problems),
    };
    if program.id != request.program_id || program.version != request.program_version {
        return base_result(
            "NOT_EVALUABLE",
            Some(&program.id),
            Some(&request.id),
            vec![Problem::new(
                "PROGRAM_REQUEST_MISMATCH",
                Some(&request.id),
                "program identity or version differs",
            )],
        );
    }
    let selection_check = validate_program(program_value, repository_root);
    if selection_check.get("status").and_then(Value::as_str) != Some("PASS") {
        return base_result(
            "NOT_EVALUABLE",
            Some(&program.id),
            Some(&request.id),
            vec![Problem::new(
                "OWNER_SELECTION_NOT_CURRENT",
                Some(&program.selection_path),
                "program owner selection is unavailable or non-current",
            )],
        );
    }
    let closure = match close_dependencies(&program, &request.roots) {
        Ok(closure) => closure,
        Err(problems) => {
            return base_result(
                "NOT_EVALUABLE",
                Some(&program.id),
                Some(&request.id),
                problems,
            )
        }
    };
    for selected in request.candidate_inputs.keys() {
        if !closure.contains(selected) {
            return base_result(
                "NOT_EVALUABLE",
                Some(&program.id),
                Some(&request.id),
                vec![Problem::new(
                    "CANDIDATE_INPUT_OUTSIDE_CLOSURE",
                    Some(selected),
                    "candidate input must belong to selected closure",
                )],
            );
        }
    }

    let mut observations = Vec::new();
    let mut problems = Vec::new();
    let mut relevant_drift = false;
    let mut indeterminate = false;
    for dependency in program.dependencies.values() {
        let relevant = closure.contains(&dependency.id);
        match selected_bytes(repository_root, dependency) {
            Ok(bytes) => {
                let observed = sha256(&bytes);
                let impact = if !relevant && observed != dependency.admitted_digest {
                    "ambient_drift"
                } else if !relevant {
                    "ambient_current"
                } else if observed == dependency.admitted_digest {
                    "current"
                } else if request.mode == "candidate_construction"
                    && request.candidate_inputs.get(&dependency.id) == Some(&observed)
                {
                    "selected_candidate_input"
                } else {
                    relevant_drift = true;
                    problems.push(Problem::new(
                        "RELEVANT_DEPENDENCY_DRIFT",
                        Some(&dependency.id),
                        format!(
                            "expected {}, observed {observed}",
                            dependency.admitted_digest
                        ),
                    ));
                    "relevant_drift"
                };
                observations.push(json!({
                    "dependency_id": dependency.id,
                    "relevant": relevant,
                    "expected_digest": dependency.admitted_digest,
                    "observed_digest": observed,
                    "impact": impact
                }));
            }
            Err(problem) => {
                let impact = if relevant {
                    indeterminate = true;
                    "indeterminate"
                } else {
                    "ambient_unavailable"
                };
                if relevant {
                    problems.push(problem.clone());
                }
                observations.push(json!({
                    "dependency_id": dependency.id,
                    "relevant": relevant,
                    "expected_digest": dependency.admitted_digest,
                    "observed_digest": Value::Null,
                    "impact": impact,
                    "diagnostic": problem.value()
                }));
            }
        }
    }
    observations.sort_by(|left, right| {
        left["dependency_id"]
            .as_str()
            .cmp(&right["dependency_id"].as_str())
    });
    let closure_value = Value::Array(closure.iter().map(|id| Value::String(id.clone())).collect());
    let dependency_set_digest = sha256(&canonical_json_bytes(
        &json!({"closure": closure_value, "observations": observations}),
    ));
    let status = if indeterminate {
        "NOT_EVALUABLE"
    } else if relevant_drift {
        "BLOCK"
    } else if request.mode == "candidate_construction" {
        "CANDIDATE"
    } else {
        "PASS"
    };
    let mut result = json!({
        "schema_version": "cav2-governance-dependency-evaluation/v1",
        "status": status,
        "program_id": program.id,
        "program_version": program.version,
        "request_id": request.id,
        "mode": request.mode,
        "closed_dependency_ids": closure,
        "dependency_set_digest": dependency_set_digest,
        "observations": observations,
        "problems": problems.iter().map(Problem::value).collect::<Vec<_>>(),
        "effect_authorized": false,
        "authority_effect": "none",
        "enforcement_effect": "none"
    });
    let evaluation_id = sha256(&canonical_json_bytes(&result));
    result
        .as_object_mut()
        .expect("object")
        .insert("evaluation_id".to_owned(), Value::String(evaluation_id));
    result
}

pub fn enforce(
    program_bytes: &[u8],
    kernel_bytes: &[u8],
    request_bytes: &[u8],
    program: &Value,
    request: &Value,
    activation: Option<&Value>,
    repository_root: &Path,
) -> Value {
    let evaluation = evaluate(program, request, repository_root);
    let Some(activation) = activation else {
        return base_result(
            "NOT_EVALUABLE",
            evaluation.get("program_id").and_then(Value::as_str),
            evaluation.get("request_id").and_then(Value::as_str),
            vec![Problem::new(
                "ACTIVATION_BINDING_REQUIRED",
                None,
                "enforcement requires a separate exact activation binding",
            )],
        );
    };
    let mut problems = Vec::new();
    let Some(map) = object(activation, "activation", &mut problems) else {
        return base_result("NOT_EVALUABLE", None, None, problems);
    };
    if map.get("schema_version").and_then(Value::as_str) != Some(ACTIVATION_SCHEMA) {
        problems.push(Problem::new(
            "INVALID_SCHEMA_VERSION",
            Some("activation.schema_version"),
            ACTIVATION_SCHEMA,
        ));
    }
    if map.get("status").and_then(Value::as_str) != Some("active") {
        problems.push(Problem::new(
            "ACTIVATION_NOT_ACTIVE",
            Some("activation.status"),
            "activation must be active",
        ));
    }
    if map
        .get("activation_id")
        .and_then(Value::as_str)
        .is_none_or(str::is_empty)
    {
        problems.push(Problem::new(
            "ACTIVATION_ID_REQUIRED",
            Some("activation_id"),
            "activation must have an immutable identity",
        ));
    }
    let program_digest = sha256(program_bytes);
    if map.get("program_sha256").and_then(Value::as_str) != Some(program_digest.as_str()) {
        problems.push(Problem::new(
            "ACTIVATION_PROGRAM_MISMATCH",
            Some("program_sha256"),
            "activation does not bind exact program bytes",
        ));
    }
    let kernel_digest = sha256(kernel_bytes);
    if map.get("kernel_sha256").and_then(Value::as_str) != Some(kernel_digest.as_str()) {
        problems.push(Problem::new(
            "ACTIVATION_KERNEL_MISMATCH",
            Some("kernel_sha256"),
            "activation does not bind the current Rust executable bytes",
        ));
    }
    let scope_digest = sha256(request_bytes);
    if map.get("scope_sha256").and_then(Value::as_str) != Some(scope_digest.as_str()) {
        problems.push(Problem::new(
            "ACTIVATION_SCOPE_MISMATCH",
            Some("scope_sha256"),
            "activation does not bind the exact request bytes",
        ));
    }
    if map
        .get("route_id")
        .and_then(Value::as_str)
        .is_none_or(str::is_empty)
    {
        problems.push(Problem::new(
            "ACTIVATION_ROUTE_REQUIRED",
            Some("route_id"),
            "activation must bind one route",
        ));
    }
    if map
        .get("owner_decision_sha256")
        .and_then(Value::as_str)
        .is_none_or(|value| !is_sha256(value))
    {
        problems.push(Problem::new(
            "ACTIVATION_OWNER_DECISION_REQUIRED",
            Some("owner_decision_sha256"),
            "exact owner decision digest is required",
        ));
    }
    if map
        .get("effect_mapping_sha256")
        .and_then(Value::as_str)
        .is_none_or(|value| !is_sha256(value))
    {
        problems.push(Problem::new(
            "ACTIVATION_EFFECT_MAPPING_REQUIRED",
            Some("effect_mapping_sha256"),
            "exact external effect mapping digest is required",
        ));
    }
    let selection_status = parse_program(program)
        .map_err(|items| {
            items
                .into_iter()
                .next()
                .expect("parse failure has a problem")
        })
        .and_then(|parsed| {
            resolve_path(repository_root, &parsed.selection_path).and_then(|path| {
                fs::read(path)
                    .map_err(|error| {
                        Problem::new(
                            "OWNER_SELECTION_UNAVAILABLE",
                            Some(&parsed.selection_path),
                            error.to_string(),
                        )
                    })
                    .and_then(|bytes| validate_selection_binding(&bytes, &parsed))
            })
        });
    match selection_status {
        Ok(status) if status == "active" => {}
        Ok(_) => problems.push(Problem::new(
            "PROGRAM_NOT_ACTIVE",
            Some("program_binding.status"),
            "owner selection still binds a candidate program",
        )),
        Err(problem) => problems.push(problem),
    }
    if !problems.is_empty() {
        return base_result(
            "NOT_EVALUABLE",
            evaluation.get("program_id").and_then(Value::as_str),
            evaluation.get("request_id").and_then(Value::as_str),
            problems,
        );
    }
    let decision = match evaluation.get("status").and_then(Value::as_str) {
        Some("PASS") => "continue",
        Some("CANDIDATE") => "candidate-only",
        Some("BLOCK") | Some("NOT_EVALUABLE") | _ => "stop",
    };
    json!({
        "schema_version": "cav2-governance-enforcement-evaluation/v1",
        "status": evaluation["status"],
        "decision": decision,
        "evaluation": evaluation,
        "effect_authorized": false,
        "authority_effect": "none",
        "enforcement_effect": "none",
        "claim_limit": "Returns a decision for an external separately authorized adapter; the kernel performs no effect."
    })
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
            let root = std::env::temp_dir().join(format!("gdk-{}-{nonce}", std::process::id()));
            fs::create_dir_all(&root).unwrap();
            Self { root }
        }
        fn write(&self, path: &str, bytes: &[u8]) {
            let target = self.root.join(path);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::write(target, bytes).unwrap();
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    fn documents(fixture: &Fixture) -> (Value, Value) {
        let selection = b"{\"schema_version\":\"cav2-owner-selection/v1\",\"program_binding\":{\"program_id\":\"demo\",\"program_version\":1,\"status\":\"candidate\",\"activation\":\"not-activated\"}}\n";
        fixture.write("selection.json", selection);
        fixture.write("a.txt", b"alpha\n");
        fixture.write("b.txt", b"changed ambient\n");
        let program = json!({
            "schema_version": PROGRAM_SCHEMA,
            "program_id": "demo",
            "version": 1,
            "owner_selection": {"path": "selection.json", "sha256": sha256(selection)},
            "effect_ceiling": "none",
            "authority_effect": "none",
            "dependencies": [
                {"dependency_id":"a","path":"a.txt","scope_kind":"whole-file","selector":null,"admitted_digest":sha256(b"alpha\n"),"depends_on":[]},
                {"dependency_id":"b","path":"b.txt","scope_kind":"whole-file","selector":null,"admitted_digest":sha256(b"old ambient\n"),"depends_on":[]}
            ]
        });
        let request = json!({
            "schema_version": REQUEST_SCHEMA,
            "request_id": "request-1",
            "program_id": "demo",
            "program_version": 1,
            "mode": "admitted_use",
            "root_dependency_ids": ["a"],
            "candidate_inputs": {}
        });
        (program, request)
    }

    #[test]
    fn unrelated_drift_is_diagnostic() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "PASS");
        assert!(result["observations"]
            .as_array()
            .unwrap()
            .iter()
            .any(|item| item["dependency_id"] == "b" && item["impact"] == "ambient_drift"));
    }

    #[test]
    fn relevant_drift_blocks_admitted_use() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        fixture.write("a.txt", b"changed\n");
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "BLOCK");
    }

    #[test]
    fn exact_candidate_input_constructs_candidate() {
        let fixture = Fixture::new();
        let (program, mut request) = documents(&fixture);
        fixture.write("a.txt", b"changed\n");
        request["mode"] = Value::String("candidate_construction".into());
        request["candidate_inputs"] = json!({"a": sha256(b"changed\n")});
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "CANDIDATE");
        assert_eq!(result["effect_authorized"], false);
    }

    #[test]
    fn unselected_candidate_digest_is_rejected() {
        let fixture = Fixture::new();
        let (program, mut request) = documents(&fixture);
        fixture.write("a.txt", b"changed\n");
        request["mode"] = Value::String("candidate_construction".into());
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "BLOCK");
    }

    #[test]
    fn cycle_is_not_evaluable() {
        let fixture = Fixture::new();
        let (mut program, request) = documents(&fixture);
        program["dependencies"][0]["depends_on"] = json!(["a"]);
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "NOT_EVALUABLE");
    }

    #[test]
    fn path_escape_is_not_evaluable() {
        let fixture = Fixture::new();
        let (mut program, request) = documents(&fixture);
        program["dependencies"][0]["path"] = Value::String("../outside.txt".into());
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "NOT_EVALUABLE");
        assert_eq!(result["problems"][0]["code"], "PATH_ESCAPE");
    }

    #[test]
    fn ambiguous_json_selector_is_not_evaluable() {
        let fixture = Fixture::new();
        let (mut program, request) = documents(&fixture);
        fixture.write("records.json", br#"{"nodes":[{"id":"x"},{"id":"x"}]}"#);
        program["dependencies"][0]["path"] = Value::String("records.json".into());
        program["dependencies"][0]["scope_kind"] = Value::String("json-record".into());
        program["dependencies"][0]["selector"] = Value::String("nodes:id=x".into());
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "NOT_EVALUABLE");
        assert_eq!(result["problems"][0]["code"], "AMBIGUOUS_SELECTOR");
    }

    #[test]
    fn selection_drift_is_not_evaluable() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        fixture.write("selection.json", b"different\n");
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "NOT_EVALUABLE");
    }

    #[test]
    fn owner_selection_must_bind_program_identity() {
        let fixture = Fixture::new();
        let (mut program, request) = documents(&fixture);
        program["program_id"] = Value::String("unselected-program".into());
        let result = evaluate(&program, &request, &fixture.root);
        assert_eq!(result["status"], "NOT_EVALUABLE");
    }

    #[test]
    fn evaluation_is_deterministic() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        assert_eq!(
            evaluate(&program, &request, &fixture.root),
            evaluate(&program, &request, &fixture.root)
        );
    }

    #[test]
    fn enforcement_requires_activation() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        let program_bytes = canonical_json_bytes(&program);
        let request_bytes = canonical_json_bytes(&request);
        let result = enforce(
            &program_bytes,
            b"kernel",
            &request_bytes,
            &program,
            &request,
            None,
            &fixture.root,
        );
        assert_eq!(result["status"], "NOT_EVALUABLE");
    }

    #[test]
    fn activation_cannot_promote_candidate_owner_selection() {
        let fixture = Fixture::new();
        let (program, request) = documents(&fixture);
        let program_bytes = canonical_json_bytes(&program);
        let request_bytes = canonical_json_bytes(&request);
        let kernel_bytes = b"kernel";
        let activation = json!({
            "schema_version": ACTIVATION_SCHEMA,
            "activation_id": "activation-1",
            "status": "active",
            "program_sha256": sha256(&program_bytes),
            "kernel_sha256": sha256(kernel_bytes),
            "scope_sha256": sha256(&request_bytes),
            "effect_mapping_sha256": sha256(b"mapping"),
            "route_id": "CA2-ROUTE-IMPLEMENT",
            "owner_decision_sha256": sha256(b"decision")
        });
        let result = enforce(
            &program_bytes,
            kernel_bytes,
            &request_bytes,
            &program,
            &request,
            Some(&activation),
            &fixture.root,
        );
        assert_eq!(result["status"], "NOT_EVALUABLE");
        assert!(result["problems"]
            .as_array()
            .unwrap()
            .iter()
            .any(|problem| problem["code"] == "PROGRAM_NOT_ACTIVE"));
    }

    #[test]
    fn exact_active_binding_returns_no_effect_decision() {
        let fixture = Fixture::new();
        let (mut program, request) = documents(&fixture);
        let selection = b"{\"schema_version\":\"cav2-owner-selection/v1\",\"program_binding\":{\"program_id\":\"demo\",\"program_version\":1,\"status\":\"active\"}}\n";
        fixture.write("selection.json", selection);
        program["owner_selection"]["sha256"] = Value::String(sha256(selection));
        let program_bytes = canonical_json_bytes(&program);
        let request_bytes = canonical_json_bytes(&request);
        let kernel_bytes = b"kernel";
        let activation = json!({
            "schema_version": ACTIVATION_SCHEMA,
            "activation_id": "activation-1",
            "status": "active",
            "program_sha256": sha256(&program_bytes),
            "kernel_sha256": sha256(kernel_bytes),
            "scope_sha256": sha256(&request_bytes),
            "effect_mapping_sha256": sha256(b"mapping"),
            "route_id": "CA2-ROUTE-IMPLEMENT",
            "owner_decision_sha256": sha256(b"decision")
        });
        let result = enforce(
            &program_bytes,
            kernel_bytes,
            &request_bytes,
            &program,
            &request,
            Some(&activation),
            &fixture.root,
        );
        assert_eq!(result["status"], "PASS");
        assert_eq!(result["decision"], "continue");
        assert_eq!(result["effect_authorized"], false);
        assert_eq!(result["enforcement_effect"], "none");
    }
}
