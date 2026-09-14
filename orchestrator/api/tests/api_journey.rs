use axum::body::Body;
use axum::http::{Request, StatusCode};
use cyberalchemy_orchestrator_api::{router, router_with_frontend, ApiState, GatewayConfig};
use http_body_util::BodyExt;
use orchestrator_capabilities::{AgentRequirement, Lane, Strategy, StrategyLimits};
use rwo_core::{CompositeWork, LeafWork, WorkDefinition, WorkUse};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tower::ServiceExt;

fn strategy() -> Strategy {
    Strategy {
        schema_version: "orchestrator-strategy/v1".into(),
        strategy_id: "api-journey".into(),
        version: "v1".into(),
        intended_outcome: "Produce one reviewable analysis".into(),
        root_work_ref: "root".into(),
        work_definitions: vec![
            WorkDefinition::Leaf(LeafWork {
                work_id: "analyze".into(),
                version: "v1".into(),
                contract: "analyze".into(),
                role_id: "analyst".into(),
                max_attempts: 1,
                static_input: json!({"question":"What should change?"}),
            }),
            WorkDefinition::Composite(CompositeWork {
                work_id: "root".into(),
                version: "v1".into(),
                nodes: vec![WorkUse {
                    node_id: "analysis".into(),
                    work_ref: "analyze".into(),
                    depends_on: vec![],
                    release: "root".into(),
                    quorum: None,
                    role_id: None,
                    max_attempts: None,
                    static_input: json!({}),
                    when: None,
                }],
            }),
        ],
        lanes: vec![Lane {
            lane_id: "analysis".into(),
            purpose: "Analyze the input".into(),
        }],
        agent_requirements: vec![AgentRequirement {
            requirement_id: "analysis-agent".into(),
            agent_ref: None,
            lane_id: "analysis".into(),
            node_selector: "analysis".into(),
            required_capabilities: vec!["analyze".into()],
        }],
        policies: json!({"effects":"none"}),
        limits: StrategyLimits {
            deadline_seconds: 60,
            max_parallelism: 1,
        },
        adapter_requirements: vec![],
        inputs: json!({"question":"What should change?"}),
        evidence_expectations: json!({"format":"analysis"}),
        result_reduction: json!({"method":"single-output"}),
        authority_refs: vec!["owner:test".into()],
    }
}

async fn send(app: axum::Router, request: Request<Body>) -> (StatusCode, Value) {
    let response = app.oneshot(request).await.unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes)
            .unwrap_or_else(|error| panic!("response is not JSON ({status}): {error}: {bytes:?}")),
    )
}

fn post(path: &str, intent: Option<&str>, body: Value) -> Request<Body> {
    let mut builder = Request::builder()
        .method("POST")
        .uri(path)
        .header("content-type", "application/json");
    if let Some(intent) = intent {
        builder = builder.header("x-orchestrator-intent", intent);
    }
    builder.body(Body::from(body.to_string())).unwrap()
}

#[tokio::test]
async fn proposal_admission_and_understandable_run_projection_survive_restart() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        2,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let request_body = json!({"strategy":strategy(),"selected_adapter_refs":[]});
    let (status, body) = send(
        router(state.clone()),
        post("/api/v1/proposals/direct", None, request_body.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["error"], "INTENT_HEADER_REQUIRED");

    let (status, body) = send(
        router(state.clone()),
        post(
            "/api/v1/proposals/direct",
            Some("compose-dispatch"),
            request_body,
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let proposal_id = body["proposal"]["proposal_id"].as_str().unwrap();
    let admit_path = format!("/api/v1/proposals/{proposal_id}/admit");
    let (status, body) = send(
        router(state.clone()),
        post(
            &admit_path,
            Some("admit-dispatch"),
            json!({
                "run_id":"run-api-1",
                "admitted_at_ms":10,
                "deadline_at_ms":1000,
                "admission_authority_ref":"admission:test"
            }),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert!(body["bundle_digest"]
        .as_str()
        .unwrap()
        .starts_with("sha256:"));

    let reopened = ApiState::open(
        temporary.path(),
        2,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let request = Request::builder()
        .uri("/api/v1/runs/run-api-1")
        .body(Body::empty())
        .unwrap();
    let (status, body) = send(router(reopened), request).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["phase"], "active");
    assert!(body["explanation"]["why"]
        .as_str()
        .unwrap()
        .contains("1 pending command"));
    assert!(body["explanation"]["authority"]
        .as_str()
        .unwrap()
        .contains("Result acceptance"));
}

#[tokio::test]
async fn immutable_template_versions_and_cancellation_are_explicit_controls() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        1,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let template = json!({
        "schema_version":"orchestrator-strategy-template/v1",
        "template_id":"single-analysis",
        "version":"v1",
        "parameters":[],
        "compatibility_requirements":[],
        "strategy":strategy()
    });
    let request = Request::builder()
        .method("PUT")
        .uri("/api/v1/templates/single-analysis/v1")
        .header("content-type", "application/json")
        .header("x-orchestrator-intent", "save-template")
        .body(Body::from(template.to_string()))
        .unwrap();
    let (status, body) = send(router(state.clone()), request).await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let run_template = json!({
        "schema_version":"orchestrator-run-template/v1",
        "run_template_id":"single-analysis-button",
        "version":"v1",
        "display_name":"Single analysis",
        "description":"Run one bounded analysis.",
        "strategy_template_id":"single-analysis",
        "strategy_template_version":"v1",
        "default_parameters":{},
        "adapter_defaults":[],
        "limit_overrides":{"deadline_seconds":30,"max_parallelism":1},
        "presentation":{"accent":"lime"},
        "admission_prompts":["Review the exact question before admission."]
    });
    let request = Request::builder()
        .method("PUT")
        .uri("/api/v1/run-templates/single-analysis-button/v1")
        .header("content-type", "application/json")
        .header("x-orchestrator-intent", "save-run-template")
        .body(Body::from(run_template.to_string()))
        .unwrap();
    let (status, body) = send(router(state.clone()), request).await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let (status, body) = send(
        router(state.clone()),
        post(
            "/api/v1/run-templates/single-analysis-button/v1/proposals",
            Some("compose-run-template-dispatch"),
            json!({"parameter_overrides":{},"adapter_overrides":null}),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let proposal_id = body["proposal"]["proposal_id"].as_str().unwrap();
    let (status, _) = send(
        router(state.clone()),
        post(
            &format!("/api/v1/proposals/{proposal_id}/admit"),
            Some("admit-dispatch"),
            json!({"run_id":"cancel-me","admitted_at_ms":10,"deadline_at_ms":1000,"admission_authority_ref":"admission:test"}),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    let (status, body) = send(
        router(state.clone()),
        post(
            "/api/v1/runs/cancel-me/cancel",
            Some("cancel-run"),
            json!({"expected_revision":0,"control_id":"cancel:test","reason":"operator request","now_ms":20}),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["result"], "cancelled");

    let mut changed = template;
    changed["strategy"]["intended_outcome"] = json!("Changed meaning");
    let request = Request::builder()
        .method("PUT")
        .uri("/api/v1/templates/single-analysis/v1")
        .header("content-type", "application/json")
        .header("x-orchestrator-intent", "save-template")
        .body(Body::from(changed.to_string()))
        .unwrap();
    let (status, body) = send(router(state), request).await;
    assert_eq!(status, StatusCode::CONFLICT);
    assert_eq!(body["error"], "TEMPLATE_VERSION_IMMUTABLE");
}

#[tokio::test]
async fn frontend_deep_links_return_a_successful_document_response() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        1,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let static_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../frontend");
    for path in [
        "/",
        "/runs",
        "/runs/example",
        "/runs/new",
        "/lab",
        "/ontology",
        "/operations",
        "/adapters",
    ] {
        let response = router_with_frontend(state.clone(), &static_root)
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK, "{path}");
    }
}

#[tokio::test]
async fn operations_projection_reports_capacity_gateway_and_run_population() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        3,
        GatewayConfig {
            socket_path: None,
            profile_ref: Some("gateway:test".into()),
        },
    )
    .unwrap();
    let request = Request::builder()
        .uri("/api/v1/operations")
        .body(Body::empty())
        .unwrap();
    let (status, body) = send(router(state), request).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["capacity"]["max_active_assignments"], 3);
    assert_eq!(body["capacity"]["available_assignments"], 3);
    assert_eq!(body["runs"]["total"], 0);
    assert_eq!(body["gateway"]["profile_ref"], "gateway:test");
    assert_eq!(body["authority_effect"], "none");
}

#[tokio::test]
async fn catalog_import_makes_generic_example_buttons_proposable() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        8,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let catalog = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../examples");
    let imported = state.import_catalog(catalog).unwrap();
    assert_eq!(imported.strategy_templates, 2);
    assert_eq!(imported.run_templates, 2);

    let request = Request::builder()
        .uri("/api/v1/run-templates")
        .body(Body::empty())
        .unwrap();
    let (status, body) = send(router(state.clone()), request).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["run_templates"].as_array().unwrap().len(), 2);

    let (status, body) = send(
        router(state),
        post(
            "/api/v1/run-templates/robot-talks-hypothesis-discussion/v1/proposals",
            Some("compose-run-template-dispatch"),
            json!({"parameter_overrides":{"topic":"How should a larger semantic neighborhood be indexed?"},"adapter_overrides":null}),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["proposal"]["lanes"].as_array().unwrap().len(), 4);
    assert_eq!(
        body["proposal"]["agent_requirements"]
            .as_array()
            .unwrap()
            .len(),
        8
    );
}

#[tokio::test]
async fn http_worker_boundary_records_lease_receipt_event_and_result_projection() {
    let temporary = tempfile::tempdir().unwrap();
    let state = ApiState::open(
        temporary.path(),
        2,
        GatewayConfig {
            socket_path: None,
            profile_ref: None,
        },
    )
    .unwrap();
    let (_, proposal) = send(
        router(state.clone()),
        post(
            "/api/v1/proposals/direct",
            Some("compose-dispatch"),
            json!({"strategy":strategy(),"selected_adapter_refs":[]}),
        ),
    )
    .await;
    let proposal_id = proposal["proposal"]["proposal_id"].as_str().unwrap();
    let (status, _) = send(
        router(state.clone()),
        post(
            &format!("/api/v1/proposals/{proposal_id}/admit"),
            Some("admit-dispatch"),
            json!({"run_id":"worker-http-1","admitted_at_ms":10,"deadline_at_ms":1000,"admission_authority_ref":"admission:test"}),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let worker_poll = json!({
        "operation":"poll",
        "worker_id":"worker:test",
        "capabilities":["analyze"],
        "now_ms":20,
        "ttl_ms":100
    });
    let (status, body) = send(
        router(state.clone()),
        post("/api/v1/workers", None, worker_poll.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["error"], "INTENT_HEADER_REQUIRED");
    let (status, assignment) = send(
        router(state.clone()),
        post("/api/v1/workers", Some("worker-operation"), worker_poll),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{assignment}");
    assert_eq!(assignment["kind"], "assignment");
    let command_id = assignment["value"]["command"]["command_id"]
        .as_str()
        .unwrap();
    let fence = assignment["value"]["lease"]["fencing_token"]
        .as_u64()
        .unwrap();

    let (status, begun) = send(
        router(state.clone()),
        post(
            "/api/v1/workers",
            Some("worker-operation"),
            json!({
                "operation":"begin",
                "run_id":"worker-http-1",
                "command_id":command_id,
                "worker_id":"worker:test",
                "fencing_token":fence,
                "now_ms":21
            }),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{begun}");
    assert_eq!(begun["kind"], "begun");

    let artifact_path = temporary
        .path()
        .join("runtime/runs/worker-http-1/analysis-output.json");
    let artifact = br#"{"result":{"status":"PASS","finding":"bounded worker path"}}"#;
    std::fs::write(&artifact_path, artifact).unwrap();
    let artifact_digest = format!("{:x}", Sha256::digest(artifact));

    let (status, completed) = send(
        router(state.clone()),
        post(
            "/api/v1/workers",
            Some("worker-operation"),
            json!({
                "operation":"complete",
                "run_id":"worker-http-1",
                "expected_revision":0,
                "receipt":{
                    "receipt_id":"receipt:http-worker-1",
                    "command_id":command_id,
                    "worker_id":"worker:test",
                    "fencing_token":fence,
                    "event":{
                        "event_id":"event:http-worker-1",
                        "command_id":command_id,
                        "node_id":"analysis",
                        "outcome":"succeeded",
                        "output_ref":{"uri":artifact_path,"sha256":artifact_digest},
                        "error":null
                    },
                    "effect_disposition":"not_applicable",
                    "recorded_at_ms":22
                },
                "now_ms":22
            }),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{completed}");
    assert_eq!(completed["kind"], "accepted");
    assert_eq!(completed["value"]["revision"], 1);

    let (status, run) = send(
        router(state),
        Request::builder()
            .uri("/api/v1/runs/worker-http-1")
            .body(Body::empty())
            .unwrap(),
    )
    .await;
    assert_eq!(status, StatusCode::OK, "{run}");
    assert_eq!(run["phase"], "completed");
    assert_eq!(
        run["execution"]["commands"][0]["lease"]["worker_id"],
        "worker:test"
    );
    assert_eq!(
        run["execution"]["commands"][0]["receipt"]["receipt_id"],
        "receipt:http-worker-1"
    );
    assert_eq!(
        run["execution"]["commands"][0]["effective_disposition"],
        "not_applicable"
    );
    assert_eq!(
        run["execution"]["accepted_events"][0]["event_id"],
        "event:http-worker-1"
    );
    assert_eq!(
        run["execution"]["result_previews"]["analysis"]["status"],
        "verified"
    );
    assert_eq!(
        run["execution"]["result_previews"]["analysis"]["content"]["result"]["status"],
        "PASS"
    );
}
