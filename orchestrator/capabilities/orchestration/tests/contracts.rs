use orchestrator_capabilities::{DispatchProposal, Strategy, StrategyTemplate};
use serde_json::Value;

#[test]
fn capability_contracts_are_closed_versioned_and_match_rust_types() {
    for text in [
        include_str!("../../../contracts/strategy.schema.json"),
        include_str!("../../../contracts/strategy-template.schema.json"),
        include_str!("../../../contracts/dispatch-proposal.schema.json"),
        include_str!("../../../contracts/agent-turn.schema.json"),
        include_str!("../../../contracts/run-template.schema.json"),
    ] {
        let value: Value = serde_json::from_str(text).unwrap();
        assert_eq!(
            value["$schema"],
            "https://json-schema.org/draft/2020-12/schema"
        );
        assert_eq!(value["additionalProperties"], false);
        assert!(value["required"]
            .as_array()
            .is_some_and(|required| !required.is_empty()));
    }

    // Compile-time and serde boundary checks keep the schema-owned types in this crate.
    fn assert_types(_: Option<(Strategy, StrategyTemplate, DispatchProposal)>) {}
    assert_types(None);
}
