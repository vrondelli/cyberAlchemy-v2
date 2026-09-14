use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, VecDeque};

pub const ENGINE_VERSION: &str = "rwo-core-dag/v2";

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ReleasePolicy {
    Root,
    All,
    Any,
    Quorum(usize),
}

/// A deterministic condition over one declared dependency output.
///
/// JSON Pointer follows RFC 6901. An empty pointer addresses the complete
/// output value. A missing pointer does not match.
#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct OutputCondition {
    pub dependency: String,
    pub pointer: String,
    pub equals: Value,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
pub struct DagNode {
    pub node_id: String,
    pub contract: String,
    pub role_id: String,
    pub depends_on: Vec<String>,
    pub release_policy: ReleasePolicy,
    pub max_attempts: usize,
    pub static_input: Value,
    pub when: Option<OutputCondition>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
pub struct DagDefinition {
    pub dag_id: String,
    pub deadline_seconds: u64,
    pub max_parallelism: usize,
    pub nodes: BTreeMap<String, DagNode>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
pub struct DagCommand {
    pub command_id: String,
    pub node_id: String,
    pub contract: String,
    pub role_id: String,
    pub attempt: usize,
    pub input: Value,
}

impl DagCommand {
    pub fn to_value(&self) -> Value {
        json!({
            "command_id": self.command_id,
            "node_id": self.node_id,
            "contract": self.contract,
            "role_id": self.role_id,
            "attempt": self.attempt,
            "input": self.input,
        })
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NodeEvent {
    pub event_id: String,
    pub command_id: Option<String>,
    pub node_id: String,
    pub outcome: String,
    pub output_ref: Option<Value>,
    pub error: Option<String>,
}

impl NodeEvent {
    pub fn succeeded(
        event_id: impl Into<String>,
        node_id: impl Into<String>,
        output_ref: Value,
    ) -> Self {
        Self {
            event_id: event_id.into(),
            command_id: None,
            node_id: node_id.into(),
            outcome: "succeeded".to_owned(),
            output_ref: Some(output_ref),
            error: None,
        }
    }

    pub fn retryable_failure(
        event_id: impl Into<String>,
        node_id: impl Into<String>,
        error: impl Into<String>,
    ) -> Self {
        Self {
            event_id: event_id.into(),
            command_id: None,
            node_id: node_id.into(),
            outcome: "retryable_failure".to_owned(),
            output_ref: None,
            error: Some(error.into()),
        }
    }

    pub fn failed(
        event_id: impl Into<String>,
        node_id: impl Into<String>,
        error: impl Into<String>,
    ) -> Self {
        Self {
            event_id: event_id.into(),
            command_id: None,
            node_id: node_id.into(),
            outcome: "failed".to_owned(),
            output_ref: None,
            error: Some(error.into()),
        }
    }

    pub fn to_value(&self) -> Value {
        json!({
            "event_id": self.event_id,
            "command_id": self.command_id,
            "node_id": self.node_id,
            "outcome": self.outcome,
            "output_ref": self.output_ref,
            "error": self.error,
        })
    }

    pub fn bind_command(mut self, command_id: impl Into<String>) -> Self {
        self.command_id = Some(command_id.into());
        self
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
pub struct DagCursor {
    pub node_status: BTreeMap<String, String>,
    pub attempts: BTreeMap<String, usize>,
    pub outputs: BTreeMap<String, Value>,
    pub accepted_events: BTreeMap<String, String>,
    pub errors: BTreeMap<String, String>,
    pub cancelled: bool,
}

impl DagCursor {
    pub fn to_value(&self) -> Value {
        json!({
            "node_status": self.node_status,
            "attempts": self.attempts,
            "outputs": self.outputs,
            "accepted_events": self.accepted_events,
            "errors": self.errors,
            "cancelled": self.cancelled,
        })
    }
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
pub struct DagTransition {
    pub kind: String,
    pub cursor: DagCursor,
    pub commands: Vec<DagCommand>,
}

pub(crate) enum Readiness {
    Ready,
    Waiting,
    Skipped,
    Blocked,
}

fn text(object: &serde_json::Map<String, Value>, field: &str) -> Result<String, String> {
    object
        .get(field)
        .and_then(Value::as_str)
        .map(str::to_owned)
        .ok_or_else(|| format!("DAG_FIELD_INVALID:{field}"))
}

fn positive_usize(
    value: Option<&Value>,
    field: &str,
    default: Option<usize>,
) -> Result<usize, String> {
    match value.and_then(Value::as_u64) {
        Some(value) if value > 0 => {
            usize::try_from(value).map_err(|_| format!("DAG_FIELD_INVALID:{field}"))
        }
        Some(_) => Err(format!("DAG_FIELD_INVALID:{field}")),
        None => default.ok_or_else(|| format!("DAG_FIELD_INVALID:{field}")),
    }
}

fn valid_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 160
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
}

impl DagDefinition {
    pub fn from_value(value: &Value) -> Result<Self, String> {
        let object = value
            .as_object()
            .ok_or_else(|| "DAG_NOT_OBJECT".to_owned())?;
        let dag_id = text(object, "dag_id")?;
        if !valid_id(&dag_id) {
            return Err("DAG_ID_INVALID".to_owned());
        }
        let deadline_seconds = object
            .get("deadline_seconds")
            .and_then(Value::as_u64)
            .filter(|value| *value > 0)
            .ok_or_else(|| "DAG_DEADLINE_INVALID".to_owned())?;
        let max_parallelism =
            positive_usize(object.get("max_parallelism"), "max_parallelism", None)?;
        let node_values = object
            .get("nodes")
            .and_then(Value::as_array)
            .filter(|nodes| !nodes.is_empty())
            .ok_or_else(|| "DAG_NODES_INVALID".to_owned())?;
        let mut nodes = BTreeMap::new();
        for value in node_values {
            let node = value
                .as_object()
                .ok_or_else(|| "DAG_NODE_NOT_OBJECT".to_owned())?;
            let node_id = text(node, "node_id")?;
            if !valid_id(&node_id) {
                return Err(format!("DAG_NODE_ID_INVALID:{node_id}"));
            }
            let contract = text(node, "contract")?;
            let role_id = text(node, "role_id")?;
            let depends_on = node
                .get("depends_on")
                .and_then(Value::as_array)
                .ok_or_else(|| format!("DAG_DEPENDENCIES_INVALID:{node_id}"))?
                .iter()
                .map(|item| {
                    item.as_str()
                        .map(str::to_owned)
                        .ok_or_else(|| format!("DAG_DEPENDENCY_INVALID:{node_id}"))
                })
                .collect::<Result<Vec<_>, _>>()?;
            if depends_on.iter().collect::<BTreeSet<_>>().len() != depends_on.len() {
                return Err(format!("DAG_DUPLICATE_DEPENDENCY:{node_id}"));
            }
            let release = node
                .get("release")
                .and_then(Value::as_object)
                .ok_or_else(|| format!("DAG_RELEASE_INVALID:{node_id}"))?;
            let mode = text(release, "mode")?;
            let release_policy = match mode.as_str() {
                "root" if depends_on.is_empty() => ReleasePolicy::Root,
                "all" if !depends_on.is_empty() => ReleasePolicy::All,
                "any" if !depends_on.is_empty() => ReleasePolicy::Any,
                "quorum" if !depends_on.is_empty() => {
                    let quorum = positive_usize(release.get("quorum"), "quorum", None)?;
                    if quorum > depends_on.len() {
                        return Err(format!("DAG_QUORUM_UNREACHABLE:{node_id}"));
                    }
                    ReleasePolicy::Quorum(quorum)
                }
                _ => return Err(format!("DAG_RELEASE_INVALID:{node_id}")),
            };
            let max_attempts = positive_usize(node.get("max_attempts"), "max_attempts", Some(1))?;
            let static_input = node.get("static_input").cloned().unwrap_or(Value::Null);
            let when = node
                .get("when")
                .filter(|value| !value.is_null())
                .map(|value| {
                    serde_json::from_value::<OutputCondition>(value.clone())
                        .map_err(|_| format!("DAG_CONDITION_INVALID:{node_id}"))
                })
                .transpose()?;
            let definition = DagNode {
                node_id: node_id.clone(),
                contract,
                role_id,
                depends_on,
                release_policy,
                max_attempts,
                static_input,
                when,
            };
            if nodes.insert(node_id.clone(), definition).is_some() {
                return Err(format!("DAG_DUPLICATE_NODE:{node_id}"));
            }
        }
        for node in nodes.values() {
            for dependency in &node.depends_on {
                if dependency == &node.node_id || !nodes.contains_key(dependency) {
                    return Err(format!(
                        "DAG_DEPENDENCY_MISSING:{}:{dependency}",
                        node.node_id
                    ));
                }
            }
            if let Some(condition) = &node.when {
                if !node.depends_on.contains(&condition.dependency)
                    || (!condition.pointer.is_empty() && !condition.pointer.starts_with('/'))
                {
                    return Err(format!("DAG_CONDITION_INVALID:{}", node.node_id));
                }
            }
        }
        let mut indegree = nodes
            .iter()
            .map(|(id, node)| (id.clone(), node.depends_on.len()))
            .collect::<BTreeMap<_, _>>();
        let mut queue = indegree
            .iter()
            .filter_map(|(id, degree)| (*degree == 0).then_some(id.clone()))
            .collect::<VecDeque<_>>();
        let mut visited = 0usize;
        while let Some(id) = queue.pop_front() {
            visited += 1;
            for node in nodes.values().filter(|node| node.depends_on.contains(&id)) {
                let degree = indegree.get_mut(&node.node_id).expect("node has indegree");
                *degree -= 1;
                if *degree == 0 {
                    queue.push_back(node.node_id.clone());
                }
            }
        }
        if visited != nodes.len() {
            return Err("DAG_CYCLE_DETECTED".to_owned());
        }
        Ok(Self {
            dag_id,
            deadline_seconds,
            max_parallelism,
            nodes,
        })
    }
}

fn digest(value: &Value) -> String {
    let bytes = serde_json::to_vec(value).expect("JSON value serializes");
    format!("sha256:{:x}", Sha256::digest(bytes))
}

pub struct DagEngine {
    pub definition: DagDefinition,
    pub cursor: DagCursor,
}

impl DagEngine {
    pub fn new(definition: DagDefinition) -> Self {
        let node_status = definition
            .nodes
            .keys()
            .map(|id| (id.clone(), "pending".to_owned()))
            .collect();
        let attempts = definition.nodes.keys().map(|id| (id.clone(), 0)).collect();
        Self {
            definition,
            cursor: DagCursor {
                node_status,
                attempts,
                outputs: BTreeMap::new(),
                accepted_events: BTreeMap::new(),
                errors: BTreeMap::new(),
                cancelled: false,
            },
        }
    }

    pub fn from_cursor(definition: DagDefinition, cursor: DagCursor) -> Result<Self, String> {
        if cursor.node_status.keys().collect::<Vec<_>>()
            != definition.nodes.keys().collect::<Vec<_>>()
        {
            return Err("DAG_CURSOR_NODE_SET_MISMATCH".to_owned());
        }
        Ok(Self { definition, cursor })
    }

    pub fn start(&mut self) -> DagTransition {
        let commands = self.schedule();
        DagTransition {
            kind: "Started".to_owned(),
            cursor: self.cursor.clone(),
            commands,
        }
    }

    fn readiness(&self, node: &DagNode) -> Readiness {
        if node.depends_on.is_empty() {
            return Readiness::Ready;
        }
        let statuses = node
            .depends_on
            .iter()
            .map(|id| self.cursor.node_status[id].as_str())
            .collect::<Vec<_>>();
        let succeeded = statuses
            .iter()
            .filter(|status| **status == "succeeded")
            .count();
        let possible = statuses
            .iter()
            .filter(|status| matches!(**status, "pending" | "issued" | "succeeded"))
            .count();
        let required = match node.release_policy {
            ReleasePolicy::Root => 0,
            ReleasePolicy::All => node.depends_on.len(),
            ReleasePolicy::Any => 1,
            ReleasePolicy::Quorum(value) => value,
        };
        if succeeded < required {
            if possible >= required {
                return Readiness::Waiting;
            }
            return if statuses
                .iter()
                .any(|status| matches!(*status, "failed" | "blocked" | "cancelled"))
            {
                Readiness::Blocked
            } else {
                Readiness::Skipped
            };
        }
        if let Some(condition) = &node.when {
            let dependency_status = self.cursor.node_status[&condition.dependency].as_str();
            if dependency_status != "succeeded" {
                return if matches!(dependency_status, "failed" | "blocked" | "cancelled") {
                    Readiness::Blocked
                } else if dependency_status == "skipped" {
                    Readiness::Skipped
                } else {
                    Readiness::Waiting
                };
            }
            let output = &self.cursor.outputs[&condition.dependency];
            let selected = if condition.pointer.is_empty() {
                Some(output)
            } else {
                output.pointer(&condition.pointer)
            };
            if selected != Some(&condition.equals) {
                return Readiness::Skipped;
            }
        }
        Readiness::Ready
    }

    fn make_command(&mut self, node: &DagNode) -> DagCommand {
        let attempt = self.cursor.attempts[&node.node_id] + 1;
        self.cursor.attempts.insert(node.node_id.clone(), attempt);
        self.cursor
            .node_status
            .insert(node.node_id.clone(), "issued".to_owned());
        let dependencies = node
            .depends_on
            .iter()
            .filter_map(|id| {
                self.cursor
                    .outputs
                    .get(id)
                    .map(|output| json!({"node_id": id, "output_ref": output}))
            })
            .collect::<Vec<_>>();
        let input = json!({"static": node.static_input, "dependencies": dependencies});
        let identity = json!({
            "dag_id": self.definition.dag_id,
            "node_id": node.node_id,
            "attempt": attempt,
            "input": input,
        });
        DagCommand {
            command_id: digest(&identity),
            node_id: node.node_id.clone(),
            contract: node.contract.clone(),
            role_id: node.role_id.clone(),
            attempt,
            input,
        }
    }

    /// Reconstruct the exact command identity for an already-issued node.
    /// This is useful at protocol adapters that receive a domain event without
    /// echoing the structural command identifier.
    pub fn command_for_attempt(&self, node_id: &str) -> Result<DagCommand, String> {
        let node = self
            .definition
            .nodes
            .get(node_id)
            .ok_or_else(|| format!("DAG_COMMAND_NODE_UNKNOWN:{node_id}"))?;
        let dependencies = node
            .depends_on
            .iter()
            .filter_map(|id| {
                self.cursor
                    .outputs
                    .get(id)
                    .map(|output| json!({"node_id": id, "output_ref": output}))
            })
            .collect::<Vec<_>>();
        let input = json!({"static": node.static_input, "dependencies": dependencies});
        let attempt = self.cursor.attempts[node_id];
        if attempt == 0 {
            return Err(format!("DAG_COMMAND_ATTEMPT_MISSING:{node_id}"));
        }
        let identity = json!({
            "dag_id": self.definition.dag_id,
            "node_id": node.node_id,
            "attempt": attempt,
            "input": input,
        });
        Ok(DagCommand {
            command_id: digest(&identity),
            node_id: node.node_id.clone(),
            contract: node.contract.clone(),
            role_id: node.role_id.clone(),
            attempt,
            input,
        })
    }

    pub fn issued_command(&self, node_id: &str) -> Result<DagCommand, String> {
        if self.cursor.node_status.get(node_id).map(String::as_str) != Some("issued") {
            return Err(format!("DAG_COMMAND_NODE_NOT_ISSUED:{node_id}"));
        }
        self.command_for_attempt(node_id)
    }

    fn schedule(&mut self) -> Vec<DagCommand> {
        if self.cursor.cancelled {
            return Vec::new();
        }
        loop {
            let terminalized = self
                .definition
                .nodes
                .values()
                .filter(|node| self.cursor.node_status[&node.node_id] == "pending")
                .filter_map(|node| match self.readiness(node) {
                    Readiness::Skipped => Some((node.node_id.clone(), "skipped")),
                    Readiness::Blocked => Some((node.node_id.clone(), "blocked")),
                    Readiness::Ready | Readiness::Waiting => None,
                })
                .collect::<Vec<_>>();
            if terminalized.is_empty() {
                break;
            }
            for (node_id, status) in terminalized {
                self.cursor
                    .node_status
                    .insert(node_id.clone(), status.to_owned());
                if status == "blocked" {
                    self.cursor
                        .errors
                        .insert(node_id, "RELEASE_POLICY_IMPOSSIBLE".to_owned());
                }
            }
        }
        let issued = self
            .cursor
            .node_status
            .values()
            .filter(|status| status.as_str() == "issued")
            .count();
        let available = self.definition.max_parallelism.saturating_sub(issued);
        let ready_ids = self
            .definition
            .nodes
            .values()
            .filter(|node| self.cursor.node_status[&node.node_id] == "pending")
            .filter(|node| matches!(self.readiness(node), Readiness::Ready))
            .map(|node| node.node_id.clone())
            .take(available)
            .collect::<Vec<_>>();
        ready_ids
            .into_iter()
            .map(|id| {
                let node = self.definition.nodes[&id].clone();
                self.make_command(&node)
            })
            .collect()
    }

    pub fn apply_event(&mut self, event: NodeEvent) -> Result<DagTransition, String> {
        let event_value = event.to_value();
        let event_digest = digest(&event_value);
        if let Some(existing) = self.cursor.accepted_events.get(&event.event_id) {
            if existing != &event_digest {
                return Err(format!("DAG_DIVERGENT_DUPLICATE:{}", event.event_id));
            }
            return Ok(DagTransition {
                kind: "Duplicate".to_owned(),
                cursor: self.cursor.clone(),
                commands: Vec::new(),
            });
        }
        if !self.definition.nodes.contains_key(&event.node_id) {
            return Err(format!("DAG_EVENT_NODE_UNKNOWN:{}", event.node_id));
        }
        let command_id = event
            .command_id
            .as_ref()
            .ok_or_else(|| format!("DAG_EVENT_COMMAND_REQUIRED:{}", event.node_id))?;
        let attempt = self.cursor.attempts[&event.node_id];
        let node = &self.definition.nodes[&event.node_id];
        let dependencies = node
            .depends_on
            .iter()
            .filter_map(|id| {
                self.cursor
                    .outputs
                    .get(id)
                    .map(|output| json!({"node_id": id, "output_ref": output}))
            })
            .collect::<Vec<_>>();
        let input = json!({"static": node.static_input, "dependencies": dependencies});
        let expected = digest(&json!({
            "dag_id": self.definition.dag_id,
            "node_id": event.node_id,
            "attempt": attempt,
            "input": input,
        }));
        if command_id != &expected {
            return Err(format!("DAG_EVENT_COMMAND_MISMATCH:{}", event.node_id));
        }
        match event.outcome.as_str() {
            "succeeded" if event.output_ref.is_none() => {
                return Err("DAG_SUCCESS_OUTPUT_REQUIRED".to_owned())
            }
            "succeeded" if event.error.is_some() => {
                return Err("DAG_SUCCESS_ERROR_FORBIDDEN".to_owned())
            }
            "retryable_failure" | "failed" if event.output_ref.is_some() => {
                return Err("DAG_FAILURE_OUTPUT_FORBIDDEN".to_owned())
            }
            "retryable_failure" | "failed" if event.error.is_none() => {
                return Err("DAG_FAILURE_ERROR_REQUIRED".to_owned())
            }
            "succeeded" | "retryable_failure" | "failed" => {}
            other => return Err(format!("DAG_EVENT_OUTCOME_UNKNOWN:{other}")),
        }
        if self.cursor.node_status[&event.node_id] != "issued" {
            return Err(format!("DAG_EVENT_NODE_NOT_ISSUED:{}", event.node_id));
        }
        self.cursor
            .accepted_events
            .insert(event.event_id.clone(), event_digest);
        match event.outcome.as_str() {
            "succeeded" => {
                let output = event
                    .output_ref
                    .ok_or_else(|| "DAG_SUCCESS_OUTPUT_REQUIRED".to_owned())?;
                self.cursor.outputs.insert(event.node_id.clone(), output);
                self.cursor
                    .node_status
                    .insert(event.node_id.clone(), "succeeded".to_owned());
                self.cursor.errors.remove(&event.node_id);
            }
            "retryable_failure" => {
                let attempts = self.cursor.attempts[&event.node_id];
                let maximum = self.definition.nodes[&event.node_id].max_attempts;
                if attempts < maximum {
                    self.cursor
                        .node_status
                        .insert(event.node_id.clone(), "pending".to_owned());
                } else {
                    self.cursor
                        .node_status
                        .insert(event.node_id.clone(), "failed".to_owned());
                }
                self.cursor.errors.insert(
                    event.node_id.clone(),
                    event
                        .error
                        .unwrap_or_else(|| "RETRYABLE_FAILURE".to_owned()),
                );
            }
            "failed" => {
                self.cursor
                    .node_status
                    .insert(event.node_id.clone(), "failed".to_owned());
                self.cursor.errors.insert(
                    event.node_id.clone(),
                    event.error.unwrap_or_else(|| "FAILED".to_owned()),
                );
            }
            _ => unreachable!("outcome prevalidated"),
        }
        let commands = self.schedule();
        let kind = if self.is_terminal() {
            self.terminal_status().to_owned()
        } else {
            "Applied".to_owned()
        };
        Ok(DagTransition {
            kind,
            cursor: self.cursor.clone(),
            commands,
        })
    }

    pub fn cancel(&mut self, reason: &str) -> DagTransition {
        self.cursor.cancelled = true;
        for (node_id, status) in &mut self.cursor.node_status {
            if matches!(status.as_str(), "pending" | "issued") {
                *status = "cancelled".to_owned();
                self.cursor
                    .errors
                    .insert(node_id.clone(), reason.to_owned());
            }
        }
        DagTransition {
            kind: "Cancelled".to_owned(),
            cursor: self.cursor.clone(),
            commands: Vec::new(),
        }
    }

    pub fn is_terminal(&self) -> bool {
        self.cursor.node_status.values().all(|status| {
            matches!(
                status.as_str(),
                "succeeded" | "skipped" | "failed" | "blocked" | "cancelled"
            )
        })
    }

    pub fn terminal_status(&self) -> &str {
        if self.cursor.cancelled {
            "Cancelled"
        } else if self
            .cursor
            .node_status
            .values()
            .all(|status| matches!(status.as_str(), "succeeded" | "skipped"))
        {
            "Succeeded"
        } else {
            "Failed"
        }
    }
}
