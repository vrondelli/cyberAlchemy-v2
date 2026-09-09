use crate::dag::{DagDefinition, DagNode, ReleasePolicy};
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::path::{Component, Path};

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

#[derive(Clone, Debug, Default)]
pub struct ScopeBindings(pub BTreeMap<String, Vec<String>>);

#[derive(Clone, Debug)]
pub struct CompiledComposite {
    pub definition: DagDefinition,
    pub value: Value,
    pub source_sha256: String,
    pub graph_sha256: String,
}

fn sha(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn object<'a>(value: &'a Value, code: &str) -> Result<&'a Map<String, Value>, String> {
    value.as_object().ok_or_else(|| code.to_owned())
}

fn text<'a>(value: &'a Map<String, Value>, field: &str, code: &str) -> Result<&'a str, String> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{code}:{field}"))
}

fn exact_relative(value: &str) -> bool {
    !value.is_empty()
        && !value.chars().any(char::is_whitespace)
        && !Path::new(value).is_absolute()
        && Path::new(value)
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}

fn resolve_scope(
    node_id: &str,
    raw: &Value,
    bindings: &ScopeBindings,
) -> Result<Vec<String>, String> {
    let entries = raw
        .as_array()
        .ok_or_else(|| format!("COMPILE_SCOPE_INVALID:{node_id}"))?;
    let mut resolved = BTreeSet::new();
    for entry in entries {
        let value = entry
            .as_str()
            .ok_or_else(|| format!("COMPILE_SCOPE_INVALID:{node_id}"))?;
        let values = if exact_relative(value) {
            vec![value.to_owned()]
        } else {
            bindings
                .0
                .get(value)
                .cloned()
                .ok_or_else(|| format!("COMPILE_SCOPE_UNRESOLVED:{node_id}:{value}"))?
        };
        if values.is_empty() || values.iter().any(|value| !exact_relative(value)) {
            return Err(format!("COMPILE_SCOPE_BINDING_INVALID:{node_id}:{value}"));
        }
        resolved.extend(values);
    }
    Ok(resolved.into_iter().collect())
}

fn validate_source(nodes: &[Value]) -> Result<BTreeMap<String, Map<String, Value>>, String> {
    let mut by_id = BTreeMap::new();
    for node in nodes {
        let node = object(node, "COMPILE_NODE_INVALID")?;
        let id = text(node, "id", "COMPILE_NODE_FIELD_INVALID")?.to_owned();
        if node
            .get("kind")
            .and_then(Value::as_str)
            .is_some_and(|kind| kind.contains("scheduler"))
        {
            return Err(format!("COMPILE_NESTED_SCHEDULER_FORBIDDEN:{id}"));
        }
        if by_id.insert(id.clone(), node.clone()).is_some() {
            return Err(format!("DAG_DUPLICATE_NODE:{id}"));
        }
    }
    let mut indegree = BTreeMap::new();
    for (id, node) in &by_id {
        let deps = node
            .get("depends_on")
            .and_then(Value::as_array)
            .ok_or_else(|| format!("COMPILE_DEPENDENCIES_INVALID:{id}"))?;
        indegree.insert(id.clone(), deps.len());
        for dep in deps {
            let dep = dep
                .as_str()
                .ok_or_else(|| format!("COMPILE_DEPENDENCY_INVALID:{id}"))?;
            if !by_id.contains_key(dep) || dep == id {
                return Err(format!("DAG_DEPENDENCY_MISSING:{id}:{dep}"));
            }
        }
    }
    let mut queue = indegree
        .iter()
        .filter_map(|(id, count)| (*count == 0).then_some(id.clone()))
        .collect::<VecDeque<_>>();
    let mut visited = 0;
    while let Some(done) = queue.pop_front() {
        visited += 1;
        for (id, node) in &by_id {
            if node["depends_on"]
                .as_array()
                .is_some_and(|deps| deps.iter().any(|dep| dep.as_str() == Some(&done)))
            {
                let count = indegree.get_mut(id).expect("known node");
                *count -= 1;
                if *count == 0 {
                    queue.push_back(id.clone());
                }
            }
        }
    }
    if visited != by_id.len() {
        return Err("DAG_CYCLE_DETECTED".to_owned());
    }
    Ok(by_id)
}

fn work_node(
    id: &str,
    source_id: &str,
    stage: &str,
    predecessor: &str,
    source: &Map<String, Value>,
    read_scope: &[String],
    write_scope: &[String],
    source_sha256: &str,
    suffix: &str,
) -> Value {
    json!({
        "node_id": id,
        "contract": source.get("kind").cloned().unwrap_or(Value::String("repository-work".into())),
        "role_id": if source.get("kind").and_then(Value::as_str) == Some("delegated-implementation") && suffix == "pause" { "native-helper-pause" } else { "repository-work" },
        "depends_on": [predecessor],
        "release": {"mode": "all"},
        "max_attempts": 1,
        "static_input": {
            "governance_stage": stage,
            "source_node_id": source_id,
            "split": suffix,
            "work_contract": {
                "read_scope": read_scope,
                "write_scope": write_scope,
                "checks": source.get("checks").cloned().unwrap_or(json!([])),
                "outputs": source.get("outputs").cloned().unwrap_or(json!([])),
                "stop_conditions": source.get("stop_conditions").cloned().unwrap_or(json!([])),
            },
            "identity_manifest": {"l0_source_sha256": source_sha256},
            "authority_effect": "none",
            "external_effect_authorized": false,
            "claim_ceiling": "candidate-evidence-only"
        }
    })
}

fn stage_plan() -> BTreeMap<&'static str, Vec<(&'static str, &'static str, &'static str)>> {
    BTreeMap::from([
        (
            "canonical-definitions",
            vec![("work.canonical-definitions.L0-B02-01", "L0-B02-01", "whole")],
        ),
        ("product-ontology", vec![]),
        ("business-ontology", vec![]),
        (
            "domainspec-source",
            vec![
                (
                    "work.domainspec-source.L0-B03-01-source",
                    "L0-B03-01",
                    "source",
                ),
                (
                    "work.domainspec-source.L0-B04-01-source",
                    "L0-B04-01",
                    "source",
                ),
            ],
        ),
        (
            "compiled-graph",
            vec![("work.compiled-graph.L0-B04-01-graph", "L0-B04-01", "graph")],
        ),
        (
            "system-ontology",
            vec![(
                "work.system-ontology.L0-B04-01-ontology",
                "L0-B04-01",
                "ontology",
            )],
        ),
        (
            "exact-implementation-binding",
            vec![
                (
                    "work.exact-implementation-binding.L0-B01-02",
                    "L0-B01-02",
                    "whole",
                ),
                (
                    "work.exact-implementation-binding.L0-B02-02",
                    "L0-B02-02",
                    "whole",
                ),
                (
                    "work.exact-implementation-binding.L0-B03-02",
                    "L0-B03-02",
                    "whole",
                ),
                (
                    "work.exact-implementation-binding.L0-B04-01-binding",
                    "L0-B04-01",
                    "binding",
                ),
                (
                    "work.exact-implementation-binding.L0-B04-02-prepare",
                    "L0-B04-02",
                    "prepare",
                ),
                (
                    "work.exact-implementation-binding.L0-B04-02-pause",
                    "L0-B04-02",
                    "pause",
                ),
                (
                    "work.exact-implementation-binding.L0-B04-02-ingest",
                    "L0-B04-02",
                    "ingest",
                ),
            ],
        ),
        (
            "static-conformance",
            vec![
                ("work.static-conformance.L0-B01-03", "L0-B01-03", "whole"),
                (
                    "work.static-conformance.L0-B03-01-test",
                    "L0-B03-01",
                    "test",
                ),
                ("work.static-conformance.L0-B04-03", "L0-B04-03", "whole"),
            ],
        ),
        (
            "runtime-evidence",
            vec![
                ("work.runtime-evidence.L0-B04-04", "L0-B04-04", "whole"),
                ("work.runtime-evidence.L0-B04-05", "L0-B04-05", "whole"),
            ],
        ),
    ])
}

pub fn compile_l0(
    source_bytes: &[u8],
    bindings: &ScopeBindings,
) -> Result<CompiledComposite, String> {
    let source: Value = serde_json::from_slice(source_bytes)
        .map_err(|error| format!("COMPILE_SOURCE_JSON_INVALID:{error}"))?;
    let source_object = object(&source, "COMPILE_SOURCE_INVALID")?;
    let source_nodes = source_object
        .get("nodes")
        .and_then(Value::as_array)
        .ok_or_else(|| "COMPILE_SOURCE_NODES_INVALID".to_owned())?;
    let source_by_id = validate_source(source_nodes)?;
    let source_sha256 = sha(source_bytes);
    let mut nodes = Vec::new();
    let mut prior = String::new();
    for id in ["L0-B00-01", "L0-B01-01"] {
        let source = source_by_id
            .get(id)
            .ok_or_else(|| format!("COMPILE_REQUIRED_NODE_MISSING:{id}"))?;
        let reads = resolve_scope(id, &source["read_scope"], bindings)?;
        let writes = resolve_scope(id, &source["write_scope"], bindings)?;
        let node_id = format!("preflight.{id}");
        let release = if prior.is_empty() {
            json!({"mode":"root"})
        } else {
            json!({"mode":"all"})
        };
        let mut value = work_node(
            &node_id,
            id,
            "preflight",
            &prior,
            source,
            &reads,
            &writes,
            &source_sha256,
            "whole",
        );
        value["depends_on"] = if prior.is_empty() {
            json!([])
        } else {
            json!([prior])
        };
        value["release"] = release;
        nodes.push(value);
        prior = node_id;
    }
    let plan = stage_plan();
    for stage in STAGES {
        let gate = format!("gate.{stage}");
        nodes.push(json!({
            "node_id": gate,
            "contract": "c19-gate",
            "role_id": "c19-no-effect-evaluator",
            "depends_on": [prior],
            "release": {"mode":"all"},
            "max_attempts": 1,
            "static_input": {"stage":stage,"l0_source_sha256":source_sha256,"authority_effect":"none","external_effect_authorized":false}
        }));
        prior = gate;
        for (id, source_id, suffix) in &plan[stage] {
            let source = source_by_id
                .get(*source_id)
                .ok_or_else(|| format!("COMPILE_REQUIRED_NODE_MISSING:{source_id}"))?;
            let reads = resolve_scope(source_id, &source["read_scope"], bindings)?;
            let writes = resolve_scope(source_id, &source["write_scope"], bindings)?;
            nodes.push(work_node(
                id,
                source_id,
                stage,
                &prior,
                source,
                &reads,
                &writes,
                &source_sha256,
                suffix,
            ));
            prior = (*id).to_owned();
        }
        let checkpoint = format!("checkpoint.{stage}");
        nodes.push(json!({
            "node_id": checkpoint,
            "contract": "stage-checkpoint",
            "role_id": "structural-checkpoint",
            "depends_on": [prior],
            "release": {"mode":"all"},
            "max_attempts": 1,
            "static_input": {"stage":stage,"authority_effect":"none","external_effect_authorized":false}
        }));
        prior = checkpoint;
    }
    for (id, source_id, contract) in [
        ("review.L0-B04-06", "L0-B04-06", "independent-review"),
        ("terminal.L0-EXIT-01", "L0-EXIT-01", "evidence-join"),
    ] {
        let source = source_by_id
            .get(source_id)
            .ok_or_else(|| format!("COMPILE_REQUIRED_NODE_MISSING:{source_id}"))?;
        let reads = resolve_scope(source_id, &source["read_scope"], bindings)?;
        let writes = resolve_scope(source_id, &source["write_scope"], bindings)?;
        let mut node = work_node(
            id,
            source_id,
            "post-runtime",
            &prior,
            source,
            &reads,
            &writes,
            &source_sha256,
            "whole",
        );
        node["contract"] = Value::String(contract.to_owned());
        nodes.push(node);
        prior = id.to_owned();
    }
    let value = json!({
        "schema_version":"cav2-domainspec-l0-rwo/v1-candidate",
        "dag_id":"domainspec-l0-controlled-construction",
        "deadline_seconds":7200,
        "max_parallelism":1,
        "source_sha256":source_sha256,
        "authority_effect":"none",
        "external_effect_authorized":false,
        "claim_ceiling":"candidate-evidence-only",
        "nodes":nodes
    });
    let definition = validate_compiled_composite(&value)?;
    let graph_sha256 = sha(&serde_json::to_vec(&value).expect("value serializes"));
    Ok(CompiledComposite {
        definition,
        value,
        source_sha256,
        graph_sha256,
    })
}

pub fn validate_compiled_composite(value: &Value) -> Result<DagDefinition, String> {
    if value.get("schema_version").and_then(Value::as_str)
        != Some("cav2-domainspec-l0-rwo/v1-candidate")
        || value.get("dag_id").and_then(Value::as_str)
            != Some("domainspec-l0-controlled-construction")
    {
        return Err("COMPOSITE_ENVELOPE_IDENTITY_INVALID".to_owned());
    }
    if value.get("authority_effect").and_then(Value::as_str) != Some("none")
        || value
            .get("external_effect_authorized")
            .and_then(Value::as_bool)
            != Some(false)
        || value.get("claim_ceiling").and_then(Value::as_str) != Some("candidate-evidence-only")
    {
        return Err("COMPOSITE_AUTHORITY_CEILING_VIOLATION".to_owned());
    }
    let deadline = value
        .get("deadline_seconds")
        .and_then(Value::as_u64)
        .ok_or_else(|| "COMPOSITE_BOUND_INVALID".to_owned())?;
    let parallelism = value
        .get("max_parallelism")
        .and_then(Value::as_u64)
        .ok_or_else(|| "COMPOSITE_BOUND_INVALID".to_owned())?;
    if deadline == 0 || deadline > 86_400 || parallelism != 1 {
        return Err("COMPOSITE_BOUND_INVALID".to_owned());
    }
    let definition = DagDefinition::from_value(value)?;
    if definition.nodes.len() != 39 {
        return Err(format!(
            "COMPILE_NODE_COUNT_MISMATCH:{}",
            definition.nodes.len()
        ));
    }
    let mut expected_nodes = BTreeSet::from([
        "preflight.L0-B00-01".to_owned(),
        "preflight.L0-B01-01".to_owned(),
        "review.L0-B04-06".to_owned(),
        "terminal.L0-EXIT-01".to_owned(),
    ]);
    let plan = stage_plan();
    for stage in STAGES {
        expected_nodes.insert(format!("gate.{stage}"));
        expected_nodes.insert(format!("checkpoint.{stage}"));
        expected_nodes.extend(plan[stage].iter().map(|(id, _, _)| (*id).to_owned()));
    }
    if definition.nodes.keys().cloned().collect::<BTreeSet<_>>() != expected_nodes {
        return Err("COMPOSITE_STAGE_TOPOLOGY_INVALID:node-set".to_owned());
    }
    let preflight0 = exact_compiled_node(
        &definition,
        "preflight.L0-B00-01",
        None,
        "preflight",
        "repository-work",
    )?;
    validate_work_identity(preflight0, "preflight", "L0-B00-01", "whole")?;
    let preflight1 = exact_compiled_node(
        &definition,
        "preflight.L0-B01-01",
        Some("preflight.L0-B00-01"),
        "diagnostic",
        "repository-work",
    )?;
    validate_work_identity(preflight1, "preflight", "L0-B01-01", "whole")?;

    let mut prior = "preflight.L0-B01-01".to_owned();
    for stage in STAGES {
        let gate_id = format!("gate.{stage}");
        let checkpoint_id = format!("checkpoint.{stage}");
        let gate = exact_compiled_node(
            &definition,
            &gate_id,
            Some(&prior),
            "c19-gate",
            "c19-no-effect-evaluator",
        )?;
        validate_stage_identity(gate, stage)?;
        prior = gate_id;
        for (work_id, source_id, split) in &plan[stage] {
            let role = if *source_id == "L0-B04-02" && *split == "pause" {
                "native-helper-pause"
            } else {
                "repository-work"
            };
            let work = exact_compiled_node(
                &definition,
                work_id,
                Some(&prior),
                work_contract(source_id),
                role,
            )?;
            validate_work_identity(work, stage, source_id, split)?;
            prior = (*work_id).to_owned();
        }
        let checkpoint = exact_compiled_node(
            &definition,
            &checkpoint_id,
            Some(&prior),
            "stage-checkpoint",
            "structural-checkpoint",
        )?;
        validate_stage_identity(checkpoint, stage)?;
        prior = checkpoint_id;
    }
    let review = exact_compiled_node(
        &definition,
        "review.L0-B04-06",
        Some(&prior),
        "independent-review",
        "repository-work",
    )?;
    validate_work_identity(review, "post-runtime", "L0-B04-06", "whole")?;
    let terminal = exact_compiled_node(
        &definition,
        "terminal.L0-EXIT-01",
        Some("review.L0-B04-06"),
        "evidence-join",
        "repository-work",
    )?;
    validate_work_identity(terminal, "post-runtime", "L0-EXIT-01", "whole")?;
    if definition
        .nodes
        .keys()
        .filter(|id| id.starts_with("gate."))
        .count()
        != STAGES.len()
        || definition
            .nodes
            .keys()
            .filter(|id| id.starts_with("checkpoint."))
            .count()
            != STAGES.len()
    {
        return Err("COMPOSITE_STAGE_TOPOLOGY_INVALID:cardinality".to_owned());
    }
    for node in definition.nodes.values() {
        if node
            .static_input
            .get("authority_effect")
            .and_then(Value::as_str)
            != Some("none")
            || node
                .static_input
                .get("external_effect_authorized")
                .and_then(Value::as_bool)
                != Some(false)
        {
            return Err(format!(
                "COMPOSITE_NODE_EFFECT_ENVELOPE_INVALID:{}",
                node.node_id
            ));
        }
    }
    validate_gate_domination(&definition)?;
    Ok(definition)
}

fn work_contract(source_id: &str) -> &'static str {
    match source_id {
        "L0-B01-02" | "L0-B02-02" | "L0-B03-02" | "L0-B04-01" => "implementation",
        "L0-B01-03" | "L0-B04-03" | "L0-B04-04" => "validation",
        "L0-B02-01" => "semantic-contract",
        "L0-B03-01" => "design-contract",
        "L0-B04-02" => "delegated-implementation",
        "L0-B04-05" => "integration-validation",
        _ => "unknown",
    }
}

fn exact_compiled_node<'a>(
    definition: &'a DagDefinition,
    node_id: &str,
    predecessor: Option<&str>,
    contract: &str,
    role_id: &str,
) -> Result<&'a DagNode, String> {
    let node = definition
        .nodes
        .get(node_id)
        .ok_or_else(|| format!("COMPOSITE_STAGE_TOPOLOGY_INVALID:{node_id}"))?;
    let dependencies = predecessor
        .map(|value| vec![value.to_owned()])
        .unwrap_or_default();
    let release = if predecessor.is_some() {
        ReleasePolicy::All
    } else {
        ReleasePolicy::Root
    };
    if node.depends_on != dependencies || node.release_policy != release || node.max_attempts != 1 {
        return Err(format!("COMPOSITE_STAGE_TOPOLOGY_INVALID:{node_id}"));
    }
    if node.contract != contract || node.role_id != role_id {
        return Err(format!("COMPOSITE_NODE_SEMANTICS_INVALID:{node_id}"));
    }
    Ok(node)
}

fn validate_stage_identity(node: &DagNode, stage: &str) -> Result<(), String> {
    if node.static_input.get("stage").and_then(Value::as_str) != Some(stage) {
        return Err(format!("COMPOSITE_NODE_SEMANTICS_INVALID:{}", node.node_id));
    }
    Ok(())
}

fn validate_work_identity(
    node: &DagNode,
    stage: &str,
    source_id: &str,
    split: &str,
) -> Result<(), String> {
    if node
        .static_input
        .get("governance_stage")
        .and_then(Value::as_str)
        != Some(stage)
        || node
            .static_input
            .get("source_node_id")
            .and_then(Value::as_str)
            != Some(source_id)
        || node.static_input.get("split").and_then(Value::as_str) != Some(split)
    {
        return Err(format!("COMPOSITE_NODE_SEMANTICS_INVALID:{}", node.node_id));
    }
    Ok(())
}

pub fn validate_gate_domination(definition: &DagDefinition) -> Result<(), String> {
    for node in definition
        .nodes
        .values()
        .filter(|node| node.role_id == "repository-work" || node.role_id == "native-helper-pause")
    {
        let stage = node.static_input["governance_stage"]
            .as_str()
            .ok_or_else(|| format!("COMPILE_STAGE_MISSING:{}", node.node_id))?;
        if stage == "preflight" || stage == "post-runtime" {
            continue;
        }
        let expected = format!("gate.{stage}");
        let mut frontier = node.depends_on.clone();
        let mut found = false;
        let mut seen = BTreeSet::new();
        while let Some(id) = frontier.pop() {
            if id == expected {
                found = true;
                break;
            }
            if seen.insert(id.clone()) {
                frontier.extend(definition.nodes[&id].depends_on.clone());
            }
        }
        if !found {
            return Err(format!(
                "COMPILE_GATE_DOMINATION_VIOLATION:{}",
                node.node_id
            ));
        }
    }
    Ok(())
}

pub fn validate_helper_receipt(receipts: &[Value], expected_run: &str) -> Result<(), String> {
    if receipts.len() != 1 {
        return Err("HELPER_CARDINALITY_VIOLATION".to_owned());
    }
    let receipt = receipts[0]
        .as_object()
        .ok_or_else(|| "HELPER_RECEIPT_INVALID".to_owned())?;
    for (field, expected) in [
        ("status", "closed"),
        ("run_id", expected_run),
        ("authority_effect", "none"),
        ("external_effect", "none"),
    ] {
        if receipt.get(field).and_then(Value::as_str) != Some(expected) {
            return Err(format!(
                "HELPER_RECEIPT_{}_MISMATCH",
                field.to_ascii_uppercase()
            ));
        }
    }
    if receipt.get("joined").and_then(Value::as_bool) != Some(true) {
        return Err("HELPER_RECEIPT_NOT_JOINED".to_owned());
    }
    if receipt
        .get("accepted_own_candidate")
        .and_then(Value::as_bool)
        != Some(false)
    {
        return Err("HELPER_AUTHORITY_INFLATION".to_owned());
    }
    Ok(())
}
