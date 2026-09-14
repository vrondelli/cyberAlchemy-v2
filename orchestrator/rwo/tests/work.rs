use rwo_core::{compile_work_graph, CompositeWork, LeafWork, WorkCatalog, WorkDefinition, WorkUse};
use serde_json::json;

fn leaf(id: &str, contract: &str) -> WorkDefinition {
    WorkDefinition::Leaf(LeafWork {
        work_id: id.to_owned(),
        version: "1".to_owned(),
        contract: contract.to_owned(),
        role_id: id.to_owned(),
        max_attempts: 1,
        static_input: json!({"definition": id}),
    })
}
fn use_work(id: &str, work_ref: &str, deps: &[&str]) -> WorkUse {
    WorkUse {
        node_id: id.to_owned(),
        work_ref: work_ref.to_owned(),
        depends_on: deps.iter().map(|x| x.to_string()).collect(),
        release: "all".to_owned(),
        quorum: None,
        role_id: None,
        max_attempts: None,
        static_input: json!({"binding":id}),
        when: None,
    }
}

#[test]
fn recursively_compiles_uniform_leaf_and_composite_work() {
    let pair = WorkDefinition::Composite(CompositeWork {
        work_id: "pair".into(),
        version: "1".into(),
        nodes: vec![
            use_work(
                "inspect",
                "inspect",
                "".split_whitespace().collect::<Vec<_>>().as_slice(),
            ),
            use_work("challenge", "challenge", &["inspect"]),
        ],
    });
    let root = WorkDefinition::Composite(CompositeWork {
        work_id: "root".into(),
        version: "1".into(),
        nodes: vec![
            use_work("lane-a", "pair", &[]),
            use_work("lane-b", "pair", &[]),
            use_work("join", "synthesize", &["lane-a", "lane-b"]),
        ],
    });
    let catalog = WorkCatalog::new([
        leaf("inspect", "inspect"),
        leaf("challenge", "challenge"),
        leaf("synthesize", "synthesize"),
        pair,
        root,
    ])
    .unwrap();
    let graph = compile_work_graph(&catalog, "root", "discussion", 60, 8).unwrap();
    assert_eq!(
        graph.nodes.keys().map(String::as_str).collect::<Vec<_>>(),
        [
            "join",
            "lane-a.challenge",
            "lane-a.inspect",
            "lane-b.challenge",
            "lane-b.inspect"
        ]
    );
    assert!(graph.nodes["lane-a.inspect"].depends_on.is_empty());
    assert_eq!(
        graph.nodes["lane-a.challenge"].depends_on,
        ["lane-a.inspect"]
    );
    assert_eq!(
        graph.nodes["join"].depends_on,
        ["lane-a.challenge", "lane-b.challenge"]
    );
}

#[test]
fn recursive_references_and_unknown_dependencies_fail_closed() {
    let recursive = WorkDefinition::Composite(CompositeWork {
        work_id: "loop".into(),
        version: "1".into(),
        nodes: vec![use_work("again", "loop", &[])],
    });
    let catalog = WorkCatalog::new([recursive]).unwrap();
    assert!(compile_work_graph(&catalog, "loop", "loop", 10, 1)
        .unwrap_err()
        .starts_with("RWO_WORK_RECURSION"));

    let broken = WorkDefinition::Composite(CompositeWork {
        work_id: "broken".into(),
        version: "1".into(),
        nodes: vec![use_work("a", "leaf", &["missing"])],
    });
    let catalog = WorkCatalog::new([leaf("leaf", "leaf"), broken]).unwrap();
    assert_eq!(
        compile_work_graph(&catalog, "broken", "broken", 10, 1).unwrap_err(),
        "RWO_WORK_DEPENDENCY_UNKNOWN:a:missing"
    );
}
