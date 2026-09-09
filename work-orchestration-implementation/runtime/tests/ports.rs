use cav2_work_orchestration_etl_demo::ports::{
    accept_grpc_event, accept_http_event, AcceptedHistoryPort, AdapterRequest, AppendOutcome,
    InMemoryAcceptedHistory, StructuralTransition,
};
use serde_json::json;
use sha2::{Digest, Sha256};

fn transition(expected: Option<&str>, event_id: &str, next: &str) -> StructuralTransition {
    let next_cursor = json!({"accepted_events": [event_id], "name": next});
    StructuralTransition {
        stream_id: "stream-1".to_owned(),
        expected_cursor_identity: expected.map(str::to_owned),
        event_id: event_id.to_owned(),
        accepted_event: json!({"event_id": event_id}),
        next_cursor_identity: format!(
            "sha256:{:x}",
            Sha256::digest(serde_json::to_vec(&next_cursor).unwrap())
        ),
        next_cursor,
        command_intents: vec![json!({"command_type": "RunStep"})],
    }
}

fn request(transition: StructuralTransition) -> AdapterRequest {
    AdapterRequest {
        authority_ref: "authority-fixture".to_owned(),
        idempotency_key: transition.event_id.clone(),
        transition,
    }
}

#[test]
fn accepted_history_is_atomic_idempotent_and_compare_bound() {
    let mut port = InMemoryAcceptedHistory::default();
    assert_eq!(
        port.compare_and_append(transition(None, "event-1", "cursor-1")),
        AppendOutcome::Accepted
    );
    assert_eq!(
        port.compare_and_append(transition(None, "event-1", "cursor-1")),
        AppendOutcome::Duplicate
    );
    assert_eq!(
        port.compare_and_append(transition(None, "event-2", "cursor-2")),
        AppendOutcome::Conflict
    );
    let view = port.read("stream-1");
    assert_eq!(view.events.len(), 1);
    assert_eq!(view.command_intents.len(), 1);
    assert!(view
        .cursor_identity
        .as_deref()
        .unwrap()
        .starts_with("sha256:"));
}

#[test]
fn http_and_grpc_are_semantically_equivalent_translators() {
    let mut http = InMemoryAcceptedHistory::default();
    let mut grpc = InMemoryAcceptedHistory::default();
    let transition = transition(None, "event-1", "cursor-1");
    assert_eq!(
        accept_http_event(&mut http, request(transition.clone())).unwrap(),
        AppendOutcome::Accepted
    );
    assert_eq!(
        accept_grpc_event(&mut grpc, request(transition)).unwrap(),
        AppendOutcome::Accepted
    );
    assert_eq!(http.read("stream-1"), grpc.read("stream-1"));
}

#[test]
fn adapters_fail_closed_without_authority_or_matching_idempotency() {
    let mut port = InMemoryAcceptedHistory::default();
    let mut missing_authority = request(transition(None, "event-1", "cursor-1"));
    missing_authority.authority_ref.clear();
    assert_eq!(
        accept_http_event(&mut port, missing_authority).unwrap_err(),
        "AUTHORITY_REF_REQUIRED"
    );
    let mut mismatch = request(transition(None, "event-1", "cursor-1"));
    mismatch.idempotency_key = "different".to_owned();
    assert_eq!(
        accept_grpc_event(&mut port, mismatch).unwrap_err(),
        "IDEMPOTENCY_KEY_EVENT_MISMATCH"
    );
    assert!(port.read("stream-1").events.is_empty());
}
