use crate::dag::{DagDefinition, DagNode, OutputCondition, ReleasePolicy};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case", deny_unknown_fields)]
pub enum WorkDefinition {
    Leaf(LeafWork),
    Composite(CompositeWork),
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct LeafWork {
    pub work_id: String,
    pub version: String,
    pub contract: String,
    pub role_id: String,
    #[serde(default = "one")]
    pub max_attempts: usize,
    #[serde(default)]
    pub static_input: Value,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct CompositeWork {
    pub work_id: String,
    pub version: String,
    pub nodes: Vec<WorkUse>,
}

#[derive(Clone, Debug, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct WorkUse {
    pub node_id: String,
    pub work_ref: String,
    #[serde(default)]
    pub depends_on: Vec<String>,
    #[serde(default = "release_all")]
    pub release: String,
    pub quorum: Option<usize>,
    pub role_id: Option<String>,
    pub max_attempts: Option<usize>,
    #[serde(default)]
    pub static_input: Value,
    #[serde(default)]
    pub when: Option<OutputCondition>,
}

fn one() -> usize {
    1
}
fn release_all() -> String {
    "all".to_owned()
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct WorkCatalog {
    definitions: BTreeMap<String, WorkDefinition>,
}

impl WorkCatalog {
    pub fn new(definitions: impl IntoIterator<Item = WorkDefinition>) -> Result<Self, String> {
        let mut catalog = Self::default();
        for definition in definitions {
            let id = definition.work_id().to_owned();
            if id.is_empty() || catalog.definitions.insert(id.clone(), definition).is_some() {
                return Err(format!("RWO_WORK_ID_INVALID_OR_DUPLICATE:{id}"));
            }
        }
        Ok(catalog)
    }

    pub fn get(&self, work_id: &str) -> Option<&WorkDefinition> {
        self.definitions.get(work_id)
    }
}

impl WorkDefinition {
    pub fn work_id(&self) -> &str {
        match self {
            Self::Leaf(v) => &v.work_id,
            Self::Composite(v) => &v.work_id,
        }
    }
}

#[derive(Default)]
struct Fragment {
    nodes: BTreeMap<String, DagNode>,
    entries: Vec<String>,
    terminals: Vec<String>,
}

fn policy(spec: &WorkUse) -> Result<ReleasePolicy, String> {
    match spec.release.as_str() {
        "root" | "all" => Ok(if spec.depends_on.is_empty() {
            ReleasePolicy::Root
        } else {
            ReleasePolicy::All
        }),
        "any" if !spec.depends_on.is_empty() => Ok(ReleasePolicy::Any),
        "quorum" if !spec.depends_on.is_empty() => {
            let n = spec
                .quorum
                .ok_or_else(|| format!("RWO_WORK_QUORUM_REQUIRED:{}", spec.node_id))?;
            if n == 0 || n > spec.depends_on.len() {
                return Err(format!("RWO_WORK_QUORUM_UNREACHABLE:{}", spec.node_id));
            }
            Ok(ReleasePolicy::Quorum(n))
        }
        _ => Err(format!("RWO_WORK_RELEASE_INVALID:{}", spec.node_id)),
    }
}

fn compile_ref(
    catalog: &WorkCatalog,
    work_ref: &str,
    address: &str,
    binding: Option<&WorkUse>,
    stack: &mut Vec<String>,
) -> Result<Fragment, String> {
    if stack.iter().any(|x| x == work_ref) {
        return Err(format!(
            "RWO_WORK_RECURSION:{}",
            stack
                .iter()
                .chain([&work_ref.to_owned()])
                .cloned()
                .collect::<Vec<_>>()
                .join("->")
        ));
    }
    let definition = catalog
        .get(work_ref)
        .ok_or_else(|| format!("RWO_WORK_REF_UNKNOWN:{work_ref}"))?;
    stack.push(work_ref.to_owned());
    let result = match definition {
        WorkDefinition::Leaf(leaf) => {
            let use_spec = binding;
            let node_id = address.to_owned();
            let input = json!({"definition":leaf.static_input,"binding":use_spec.map(|x|x.static_input.clone()).unwrap_or(Value::Null),"work_ref":leaf.work_id,"work_version":leaf.version});
            let node = DagNode {
                node_id: node_id.clone(),
                contract: leaf.contract.clone(),
                role_id: use_spec
                    .and_then(|x| x.role_id.clone())
                    .unwrap_or_else(|| leaf.role_id.clone()),
                depends_on: Vec::new(),
                release_policy: ReleasePolicy::Root,
                max_attempts: use_spec
                    .and_then(|x| x.max_attempts)
                    .unwrap_or(leaf.max_attempts),
                static_input: input,
                when: use_spec.and_then(|x| x.when.clone()),
            };
            Fragment {
                nodes: BTreeMap::from([(node_id.clone(), node)]),
                entries: vec![node_id.clone()],
                terminals: vec![node_id],
            }
        }
        WorkDefinition::Composite(composite) => {
            compile_composite(catalog, composite, address, stack)?
        }
    };
    stack.pop();
    Ok(result)
}

fn compile_composite(
    catalog: &WorkCatalog,
    composite: &CompositeWork,
    address: &str,
    stack: &mut Vec<String>,
) -> Result<Fragment, String> {
    if composite.nodes.is_empty() {
        return Err(format!("RWO_WORK_COMPOSITE_EMPTY:{}", composite.work_id));
    }
    let mut seen = BTreeSet::new();
    for n in &composite.nodes {
        if n.node_id.is_empty() || !seen.insert(n.node_id.clone()) {
            return Err(format!("RWO_WORK_NODE_INVALID_OR_DUPLICATE:{}", n.node_id));
        }
        if n.depends_on.iter().collect::<BTreeSet<_>>().len() != n.depends_on.len() {
            return Err(format!("RWO_WORK_DEPENDENCY_DUPLICATE:{}", n.node_id));
        }
    }
    for n in &composite.nodes {
        for d in &n.depends_on {
            if !seen.contains(d) {
                return Err(format!("RWO_WORK_DEPENDENCY_UNKNOWN:{}:{d}", n.node_id));
            }
        }
    }
    let mut fragments = BTreeMap::new();
    for n in &composite.nodes {
        let child_address = if address.is_empty() {
            n.node_id.clone()
        } else {
            format!("{address}.{}", n.node_id)
        };
        fragments.insert(
            n.node_id.clone(),
            compile_ref(catalog, &n.work_ref, &child_address, Some(n), stack)?,
        );
    }
    let mut all_nodes = BTreeMap::new();
    for n in &composite.nodes {
        let deps = n
            .depends_on
            .iter()
            .flat_map(|d| fragments[d].terminals.clone())
            .collect::<Vec<_>>();
        let release = policy(n)?;
        let fragment = fragments.get_mut(&n.node_id).expect("fragment exists");
        for entry in &fragment.entries {
            let node = fragment.nodes.get_mut(entry).expect("entry exists");
            node.depends_on.extend(deps.clone());
            node.depends_on.sort();
            node.depends_on.dedup();
            node.release_policy = if node.depends_on.is_empty() {
                ReleasePolicy::Root
            } else {
                release.clone()
            };
        }
        for (id, node) in std::mem::take(&mut fragment.nodes) {
            if all_nodes.insert(id.clone(), node).is_some() {
                return Err(format!("RWO_WORK_ADDRESS_DUPLICATE:{id}"));
            }
        }
    }
    let entries = composite
        .nodes
        .iter()
        .filter(|n| n.depends_on.is_empty())
        .flat_map(|n| fragments[&n.node_id].entries.clone())
        .collect::<Vec<_>>();
    let depended = composite
        .nodes
        .iter()
        .flat_map(|n| n.depends_on.iter())
        .cloned()
        .collect::<BTreeSet<_>>();
    let terminals = composite
        .nodes
        .iter()
        .filter(|n| !depended.contains(&n.node_id))
        .flat_map(|n| fragments[&n.node_id].terminals.clone())
        .collect::<Vec<_>>();
    Ok(Fragment {
        nodes: all_nodes,
        entries,
        terminals,
    })
}

pub fn compile_work_graph(
    catalog: &WorkCatalog,
    root_work_ref: &str,
    dag_id: &str,
    deadline_seconds: u64,
    max_parallelism: usize,
) -> Result<DagDefinition, String> {
    let fragment = compile_ref(catalog, root_work_ref, "", None, &mut Vec::new())?;
    let value = json!({"dag_id":dag_id,"deadline_seconds":deadline_seconds,"max_parallelism":max_parallelism,"nodes":fragment.nodes.values().map(|n|json!({"node_id":n.node_id,"contract":n.contract,"role_id":n.role_id,"depends_on":n.depends_on,"release":match n.release_policy{ReleasePolicy::Root=>json!({"mode":"root"}),ReleasePolicy::All=>json!({"mode":"all"}),ReleasePolicy::Any=>json!({"mode":"any"}),ReleasePolicy::Quorum(q)=>json!({"mode":"quorum","quorum":q})},"max_attempts":n.max_attempts,"static_input":n.static_input,"when":n.when})).collect::<Vec<_>>()});
    DagDefinition::from_value(&value)
}
