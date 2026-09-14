use orchestrator_capabilities::{
    AgentRequirement, DispatchProposal, Lane, ParameterConstraints, ParameterSpec, RunTemplate,
    Strategy, StrategyLimits, StrategyTemplate,
};
use rwo_core::{CompositeWork, LeafWork, WorkDefinition, WorkUse};
use serde_json::json;
use std::collections::BTreeMap;

fn strategy(topic: &str) -> Strategy {
    let concerns = ["evidence", "risk", "feasibility", "value"];
    let lanes = concerns
        .iter()
        .map(|concern| Lane {
            lane_id: (*concern).into(),
            purpose: format!("Investigate {concern}"),
        })
        .collect::<Vec<_>>();
    let mut nodes = Vec::new();
    let mut requirements = Vec::new();
    for (lane_index, concern) in concerns.iter().enumerate() {
        for stance in ["constructive", "adversarial"] {
            let node_id = format!("{concern}-{stance}");
            nodes.push(WorkUse {
                node_id: node_id.clone(),
                work_ref: "investigate".into(),
                depends_on: vec![],
                release: "root".into(),
                quorum: None,
                role_id: Some(stance.into()),
                max_attempts: None,
                static_input: json!({"concern":concern,"stance":stance}),
                when: None,
            });
            requirements.push(AgentRequirement {
                requirement_id: format!("requirement-{node_id}"),
                agent_ref: Some(format!(
                    "agent-{}",
                    lane_index * 2 + usize::from(stance == "adversarial") + 1
                )),
                lane_id: (*concern).into(),
                node_selector: node_id,
                required_capabilities: vec!["investigate".into()],
            });
        }
    }
    Strategy {
        schema_version: "orchestrator-strategy/v1".into(),
        strategy_id: "four-concern-dialectic".into(),
        version: "v1".into(),
        intended_outcome: format!("Generate testable hypotheses about {topic}"),
        root_work_ref: "discussion".into(),
        work_definitions: vec![
            WorkDefinition::Leaf(LeafWork {
                work_id: "investigate".into(),
                version: "v1".into(),
                contract: "investigate".into(),
                role_id: "participant".into(),
                max_attempts: 1,
                static_input: json!({"topic":topic}),
            }),
            WorkDefinition::Composite(CompositeWork {
                work_id: "discussion".into(),
                version: "v1".into(),
                nodes,
            }),
        ],
        lanes,
        agent_requirements: requirements,
        policies: json!({"interaction":"paired-tension"}),
        limits: StrategyLimits {
            deadline_seconds: 600,
            max_parallelism: 8,
        },
        adapter_requirements: vec!["gateway-agent/v1".into()],
        inputs: json!({"topic":topic}),
        evidence_expectations: json!({"per_lane":"claims-and-challenges"}),
        result_reduction: json!({"method":"cross-lane-hypothesis-ranking"}),
        authority_refs: vec!["owner:local-operator".into()],
    }
}

#[test]
fn direct_and_saved_template_paths_compile_the_same_generic_graph() {
    let direct = strategy("coordination under partial failure");
    let mut template_value = serde_json::to_value(&direct).unwrap();
    template_value["intended_outcome"] = json!("Generate testable hypotheses about ${topic}");
    template_value["inputs"]["topic"] = json!("${topic}");
    template_value["work_definitions"][0]["static_input"]["topic"] = json!("${topic}");
    let template = StrategyTemplate {
        schema_version: "orchestrator-strategy-template/v1".into(),
        template_id: "four-concern-dialectic".into(),
        version: "v1".into(),
        parameters: vec![ParameterSpec {
            name: "topic".into(),
            value_type: "string".into(),
            required: true,
            default: None,
            constraints: ParameterConstraints {
                min_length: Some(4),
                ..Default::default()
            },
        }],
        compatibility_requirements: vec!["gateway-agent/v1".into()],
        strategy: template_value,
    };
    let parameters =
        BTreeMap::from([("topic".into(), json!("coordination under partial failure"))]);
    let instance = template
        .instantiate(parameters, vec!["gateway-agent/v1".into()])
        .unwrap();
    let from_button = DispatchProposal::from_instantiation(&instance).unwrap();
    let authored =
        DispatchProposal::from_strategy(&direct, vec!["gateway-agent/v1".into()]).unwrap();

    assert_eq!(authored.graph, from_button.graph);
    assert_eq!(authored.strategy_digest, from_button.strategy_digest);
    assert_eq!(authored.agent_requirements.len(), 8);
    assert_eq!(
        authored
            .agent_requirements
            .iter()
            .filter_map(|requirement| requirement.agent_ref.as_ref())
            .collect::<std::collections::BTreeSet<_>>()
            .len(),
        8
    );
    let bundle = from_button
        .admit("run-dialectic", 10, 610_000, "admission:operator-1")
        .unwrap();
    assert_eq!(
        bundle.admission_context["strategy_digest"],
        from_button.strategy_digest
    );
    assert_eq!(
        bundle.admission_context["template_ref"],
        "four-concern-dialectic@v1"
    );
    assert_eq!(
        bundle.admission_context["agent_requirements"]
            .as_array()
            .unwrap()
            .len(),
        8
    );
}

#[test]
fn template_and_strategy_validation_reject_ambiguous_dispatches() {
    let base = strategy("failure modes");
    let template = StrategyTemplate {
        schema_version: "orchestrator-strategy-template/v1".into(),
        template_id: "bounded".into(),
        version: "v1".into(),
        parameters: vec![ParameterSpec {
            name: "topic".into(),
            value_type: "string".into(),
            required: true,
            default: None,
            constraints: ParameterConstraints {
                min_length: Some(4),
                ..Default::default()
            },
        }],
        compatibility_requirements: vec!["gateway-agent/v1".into()],
        strategy: serde_json::to_value(base).unwrap(),
    };
    assert_eq!(
        template
            .instantiate(BTreeMap::new(), vec!["gateway-agent/v1".into()])
            .unwrap_err(),
        "TEMPLATE_PARAMETER_REQUIRED:topic"
    );
    assert_eq!(
        template
            .instantiate(
                BTreeMap::from([("topic".into(), json!("ok"))]),
                vec!["gateway-agent/v1".into()]
            )
            .unwrap_err(),
        "TEMPLATE_PARAMETER_CONSTRAINT:topic:BELOW_MIN_LENGTH"
    );
    assert_eq!(
        template
            .instantiate(
                BTreeMap::from([("topic".into(), json!("valid topic"))]),
                vec![]
            )
            .unwrap_err(),
        "TEMPLATE_ADAPTER_INCOMPATIBLE"
    );

    let mut invalid = strategy("failure modes");
    invalid.agent_requirements[0].node_selector = "missing-node".into();
    assert!(invalid
        .compile()
        .unwrap_err()
        .starts_with("STRATEGY_AGENT_REQUIREMENT_NODE_UNKNOWN"));
}

#[test]
fn run_template_is_a_button_ready_preset_over_the_same_proposal_path() {
    let strategy = strategy("default topic");
    let template = StrategyTemplate {
        schema_version: "orchestrator-strategy-template/v1".into(),
        template_id: "four-concern-dialectic".into(),
        version: "v1".into(),
        parameters: vec![],
        compatibility_requirements: vec!["gateway-agent/v1".into()],
        strategy: serde_json::to_value(strategy).unwrap(),
    };
    let preset = RunTemplate {
        schema_version: "orchestrator-run-template/v1".into(),
        run_template_id: "dialectic-default".into(),
        version: "v1".into(),
        display_name: "Four-concern dialectic".into(),
        description: "Two agents examine each concern.".into(),
        strategy_template_id: template.template_id.clone(),
        strategy_template_version: template.version.clone(),
        default_parameters: BTreeMap::new(),
        adapter_defaults: vec!["gateway-agent/v1".into()],
        limit_overrides: Some(StrategyLimits {
            deadline_seconds: 300,
            max_parallelism: 4,
        }),
        presentation: json!({"accent":"lime"}),
        admission_prompts: vec!["Review the eight agent requirements.".into()],
    };
    let proposal = preset.propose(&template, BTreeMap::new(), None).unwrap();
    assert_eq!(proposal.limits.deadline_seconds, 300);
    assert_eq!(proposal.limits.max_parallelism, 4);
    assert_eq!(proposal.agent_requirements.len(), 8);
}
