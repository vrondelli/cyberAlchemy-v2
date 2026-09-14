use serde_json::Value;
#[test]
fn contract_schemas_are_closed_and_versioned() {
    for text in [
        include_str!("../../contracts/run-bundle.schema.json"),
        include_str!("../../contracts/event-proposal.schema.json"),
        include_str!("../../contracts/command-intent.schema.json"),
        include_str!("../../contracts/command-receipt.schema.json"),
        include_str!("../../contracts/accepted-history.schema.json"),
    ] {
        let v: Value = serde_json::from_str(text).unwrap();
        assert_eq!(v["$schema"], "https://json-schema.org/draft/2020-12/schema");
        assert_eq!(v["additionalProperties"], false);
        assert!(v["required"].as_array().is_some_and(|x| !x.is_empty()));
    }
}

#[test]
fn run_bundle_contract_detects_envelope_tampering() {
    let graph = rwo_core::DagDefinition::from_value(&serde_json::json!({
        "dag_id":"bundle-contract",
        "deadline_seconds":30,
        "max_parallelism":1,
        "nodes":[{
            "node_id":"work",
            "contract":"work",
            "role_id":"worker",
            "depends_on":[],
            "release":{"mode":"root"},
            "max_attempts":1,
            "static_input":{}
        }]
    }))
    .unwrap();
    let mut bundle = cyberalchemy_orchestrator_runtime::RunBundle::new_with_context(
        "bundle-contract",
        graph,
        10,
        100,
        vec!["admission:test".into()],
        serde_json::json!({"strategy_digest":"sha256:test"}),
    )
    .unwrap();
    assert!(bundle.bundle_digest.starts_with("sha256:"));
    bundle.admission_context["strategy_digest"] = serde_json::json!("sha256:changed");
    assert_eq!(bundle.validate().unwrap_err(), "RUN_BUNDLE_DIGEST_MISMATCH");
}
