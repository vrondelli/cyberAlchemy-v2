use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{
    auth::*,
    limits::Limits,
    model::{Authorization, Database, KnowledgeIdentity},
    router, Application, FinalityGateway, MockFinalityGateway,
};
use ed25519_dalek::{Signer, SigningKey};
use serde_json::{json, Value};
use tower::ServiceExt;

async fn call(app: &Router, path: &str, body: Value) -> axum::response::Response {
    app.clone()
        .oneshot(
            Request::post(path)
                .header("content-type", "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap()
}
fn registration(op: &str, id: &str) -> Value {
    let key = SigningKey::from_bytes(&[79; 32]);
    let wallet = bs58::encode(key.verifying_key().to_bytes()).into_string();
    let public = STANDARD.encode([7; 32]);
    let message = register_message(op, id, &wallet, &public, 1);
    let signature = STANDARD.encode(key.sign(message.as_bytes()).to_bytes());
    json!({"operation_id":op,"identity_id":id,"wallet_public_key":wallet,"encryption_public_key":public,"encryption_key_version":1,"authorization":{"message":message,"signature_base64":signature}})
}
async fn application(limits: Limits) -> Application {
    Application::memory(FinalityGateway::Mock(MockFinalityGateway::default()))
        .await
        .with_limits(limits)
}
#[test]
fn signature_fields_actions_and_audience_are_bound() {
    let key = SigningKey::from_bytes(&[80; 32]);
    let wallet = bs58::encode(key.verifying_key().to_bytes()).into_string();
    let message = register_message("operation:part", "identity", &wallet, "key", 1);
    let authorization = Authorization {
        signature_base64: STANDARD.encode(key.sign(message.as_bytes()).to_bytes()),
        message: message.clone(),
    };
    assert!(verify_wallet_signature(&wallet, &authorization, &message).is_ok());
    assert!(verify_wallet_signature(
        &wallet,
        &authorization,
        &register_message("operation", "part:identity", &wallet, "key", 1)
    )
    .is_err());
    assert!(verify_wallet_signature(
        &wallet,
        &authorization,
        &message.replace(SIGNING_AUDIENCE, "https://other.example")
    )
    .is_err());
    assert_ne!(
        signed_message("access", &("a", "b", 1)),
        signed_message("register", &("a", "b", 1))
    );
    assert_ne!(
        artifact_message("op:part", "id", "a", "p", 1, "d", "e"),
        artifact_message("op", "part:id", "a", "p", 1, "d", "e")
    );
}
#[tokio::test]
async fn legacy_registration_is_rejected_and_capacity_does_not_mutate_state() {
    let state = application(Limits {
        records_per_collection: 1,
        ..Limits::default()
    })
    .await;
    let app = router(state.clone());
    let mut legacy = registration("old", "old");
    let old_message = format!(
        "ca2:kep:hosted:v1:register:old:old:{}:{}:1",
        legacy["wallet_public_key"].as_str().unwrap(),
        legacy["encryption_public_key"].as_str().unwrap()
    );
    legacy["authorization"] = json!({"message":old_message,"signature_base64":STANDARD.encode(SigningKey::from_bytes(&[79;32]).sign(old_message.as_bytes()).to_bytes())});
    assert_eq!(
        call(&app, "/v1/identities", legacy).await.status(),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        call(&app, "/v1/identities", registration("one", "one"))
            .await
            .status(),
        StatusCode::OK
    );
    assert_eq!(
        call(&app, "/v1/identities", registration("two", "two"))
            .await
            .status(),
        StatusCode::INSUFFICIENT_STORAGE
    );
    assert_eq!(state.snapshot().await.identities.len(), 1);
    assert_eq!(
        call(&app, "/v1/identities", registration("new-op", "one"))
            .await
            .status(),
        StatusCode::OK
    );
}
#[tokio::test]
async fn request_budget_is_shared_and_returns_retry_after_before_parsing() {
    let app = router(
        application(Limits {
            requests_per_minute: 1,
            ..Limits::default()
        })
        .await,
    );
    assert_eq!(
        call(&app, "/v1/identities", json!({})).await.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let rejected = call(&app.clone(), "/v1/account/read", json!({})).await;
    assert_eq!(rejected.status(), StatusCode::TOO_MANY_REQUESTS);
    assert!(rejected.headers().contains_key("retry-after"));
    let health = app
        .oneshot(Request::get("/health").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(health.status(), StatusCode::OK);
}
#[tokio::test]
async fn zero_concurrency_rejects_before_deserialization() {
    let app = router(
        application(Limits {
            concurrent_requests: 0,
            ..Limits::default()
        })
        .await,
    );
    assert_eq!(
        call(&app, "/v1/files", json!({})).await.status(),
        StatusCode::TOO_MANY_REQUESTS
    );
}
#[test]
fn wallet_and_global_capacity_preserve_existing_over_limit_data() {
    let limits = Limits {
        wallet_bytes: 8,
        stored_bytes: 1024,
        ..Limits::default()
    };
    let mut before = Database::default();
    before.identities.insert(
        "a".into(),
        KnowledgeIdentity {
            identity_id: "a".into(),
            wallet_public_key: "wallet".into(),
            encryption_public_key: "key".into(),
            encryption_key_version: 1,
        },
    );
    let mut after = before.clone();
    after.accounts.insert(
        "wallet".into(),
        cyberalchemy_kep_hosted_devnet::accounts::AccountRecord {
            revision: 1,
            ciphertext_base64: "x".repeat(9),
            ciphertext_sha256: "d".into(),
        },
    );
    assert!(limits.validate_growth(&before, &after).is_err());
    assert!(limits.validate_growth(&after, &after).is_ok());
    let mut smaller = after.clone();
    smaller
        .accounts
        .get_mut("wallet")
        .unwrap()
        .ciphertext_base64 = "x".repeat(8);
    assert!(limits.validate_growth(&after, &smaller).is_ok());
    let limits = Limits {
        stored_bytes: 1,
        ..Limits::default()
    };
    assert!(limits.validate_growth(&before, &after).is_err());
}

#[test]
fn shared_browser_signing_vectors_match_rust() {
    let v: Value = serde_json::from_str(include_str!("fixtures/authorization-v2.json")).unwrap();
    assert_eq!(
        register_message("op:part", "identity", "wallet", "key", 1),
        v["register"]
    );
    assert_eq!(
        grant_message("op", "artifact", "a", "b", 0, "digest"),
        v["grant"]
    );
    assert_eq!(
        signed_message("account-read", &("wallet", 123)),
        v["accountRead"]
    );
    assert_eq!(
        signed_message(
            "file-access",
            &(
                "artifact",
                "identity",
                "attempt",
                "digest",
                2,
                "kep-file-retention-v1",
                true
            )
        ),
        v["fileAccess"]
    );
}
fn telemetry(id: &str) -> Value {
    json!({
        "attempt_id":id,"operation_kind":"initialize_artifact","stage":"devnet_submission",
        "error_code":"blockhash_not_found","effect_status":"rejected_before_submission",
        "network":"solana-devnet","safe_message":"Blockhash expired.","diagnostic_digest":"ab".repeat(32),
        "reporter":"client","registry_version":"kep-error-registry/v1","source_layer":"transaction",
        "retry_disposition":"user_may_retry_fresh"
    })
}
#[tokio::test]
async fn telemetry_is_bounded_and_duplicates_are_immutable() {
    let state = application(Limits {
        telemetry_records: 1,
        ..Limits::default()
    })
    .await;
    let app = router(state.clone());
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("first"))
            .await
            .status(),
        StatusCode::ACCEPTED
    );
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("first"))
            .await
            .status(),
        StatusCode::ACCEPTED
    );
    let mut conflict = telemetry("first");
    conflict["safe_message"] = json!("Different message");
    assert_eq!(
        call(&app, "/v1/client-errors", conflict).await.status(),
        StatusCode::CONFLICT
    );
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("second"))
            .await
            .status(),
        StatusCode::INSUFFICIENT_STORAGE
    );
    assert_eq!(state.snapshot().await.client_errors.len(), 1);
}
#[tokio::test]
async fn telemetry_has_a_separate_request_budget() {
    let app = router(
        application(Limits {
            telemetry_per_minute: 1,
            ..Limits::default()
        })
        .await,
    );
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("first"))
            .await
            .status(),
        StatusCode::ACCEPTED
    );
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("second"))
            .await
            .status(),
        StatusCode::TOO_MANY_REQUESTS
    );
    assert_eq!(
        call(&app, "/v1/identities", registration("one", "one"))
            .await
            .status(),
        StatusCode::OK
    );
}

#[tokio::test]
#[ignore = "requires CA2_KEP_LIMIT_TEST_DATABASE_URL naming a disposable empty database"]
async fn postgres_duplicate_telemetry_does_not_append_state_journal() {
    let url = std::env::var("CA2_KEP_LIMIT_TEST_DATABASE_URL").unwrap();
    let state = Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
        .await
        .unwrap()
        .with_limits(Limits {
            telemetry_records: 1,
            ..Limits::default()
        });
    let app = router(state.clone());
    for _ in 0..2 {
        assert_eq!(
            call(&app, "/v1/client-errors", telemetry("same"))
                .await
                .status(),
            StatusCode::ACCEPTED
        );
    }
    assert_eq!(
        call(&app, "/v1/client-errors", telemetry("overflow"))
            .await
            .status(),
        StatusCode::INSUFFICIENT_STORAGE
    );
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    let events: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal")
        .fetch_one(&pool)
        .await
        .unwrap();
    let reports: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.client_error_journal")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(events, 1);
    assert_eq!(reports, 1);
    drop(app);
    drop(state);
    let loaded = Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
        .await
        .unwrap();
    assert_eq!(loaded.snapshot().await.client_errors.len(), 1);
}

#[test]
fn receipt_reserve_does_not_reopen_normal_admission() {
    let before = Database::default();
    let mut after = before.clone();
    after.consumed_operations.insert("reserved-growth".into());
    let limits = Limits {
        metadata_bytes: 1,
        stored_bytes: 1,
        ..Limits::default()
    };
    assert!(limits.validate_growth(&before, &after).is_err());
    assert!(limits.validate_receipt_growth(&before, &after).is_ok());
    after
        .consumed_operations
        .insert("x".repeat(4 * 1024 * 1024));
    assert!(limits.validate_receipt_growth(&before, &after).is_err());
}
