use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{
    auth::*, files::*, model::*, router, Application, FinalityGateway,
    FinalizedArtifactObservation, MockFinalityGateway,
};
use ed25519_dalek::{Signer, SigningKey};
use http_body_util::BodyExt;
use serde::Serialize;
use serde_json::Value;
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc,
};
use tower::ServiceExt;
fn auth(key: &SigningKey, message: String) -> Authorization {
    Authorization {
        signature_base64: STANDARD.encode(key.sign(message.as_bytes()).to_bytes()),
        message,
    }
}
async fn call<T: Serialize>(app: &Router, path: &str, body: &T) -> (StatusCode, Value) {
    let response = app
        .clone()
        .oneshot(
            Request::post(path)
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}
async fn register(app: &Router, id: &str, key: &SigningKey) {
    let wallet = bs58::encode(key.verifying_key().to_bytes()).into_string();
    let public = STANDARD.encode([4; 32]);
    let op = format!("register-{id}");
    let r = RegisterIdentityRequest {
        operation_id: op.clone(),
        identity_id: id.into(),
        wallet_public_key: wallet.clone(),
        encryption_public_key: public.clone(),
        encryption_key_version: 1,
        authorization: auth(key, register_message(&op, id, &wallet, &public, 1)),
    };
    assert_eq!(call(app, "/v1/identities", &r).await.0, StatusCode::OK);
}
fn upload(key: &SigningKey, id: &str, length: u64) -> FileUploadRequest {
    let payload = vec![42; length as usize + 60];
    let envelope = vec![8; 64];
    let a = CreateArtifactRequest {
        operation_id: format!("upload-{id}"),
        artifact_version_id: id.into(),
        originator_id: "a".into(),
        policy_id: "policy".into(),
        encryption_epoch: 1,
        ciphertext_base64: STANDARD.encode(&payload),
        ciphertext_sha256: sha256_hex(&payload),
        originator_envelope_base64: STANDARD.encode(&envelope),
        originator_envelope_sha256: sha256_hex(&envelope),
        authorization: auth(key, String::new()),
    };
    let mut request = FileUploadRequest {
        artifact: a,
        original_bytes: length,
        retention_policy: RETENTION_POLICY.into(),
        policy_accepted: true,
    };
    request.artifact.authorization = auth(key, request.message());
    request
}
fn command(
    key: &SigningKey,
    owner: &str,
    attempt: &str,
    action: &str,
    upload: &FileUploadRequest,
    revision: u64,
) -> FileCommand {
    let mut c = FileCommand {
        requester_id: owner.into(),
        attempt_id: attempt.into(),
        policy_accepted: true,
        authorization: auth(key, String::new()),
    };
    c.authorization = auth(
        key,
        c.message(
            action,
            &upload.artifact.artifact_version_id,
            &upload.artifact.ciphertext_sha256,
            revision,
        ),
    );
    c
}
#[tokio::test]
async fn lifecycle_is_signed_idempotent_and_expiry_cannot_resurrect_payloads() {
    let now = Arc::new(AtomicU64::new(1_709_208_000));
    let clock = now.clone();
    let gateway = MockFinalityGateway::default();
    let application = Application::memory(FinalityGateway::Mock(gateway.clone()))
        .await
        .with_clock(move || clock.load(Ordering::SeqCst));
    let app = router(application.clone());
    let a = SigningKey::from_bytes(&[1; 32]);
    let b = SigningKey::from_bytes(&[2; 32]);
    register(&app, "a", &a).await;
    register(&app, "b", &b).await;
    let u = upload(&a, "file", 10);
    assert_eq!(call(&app, "/v1/files", &u).await.0, StatusCode::OK);
    assert_eq!(call(&app, "/v1/files", &u).await.0, StatusCode::OK);
    assert!(application.snapshot().await.files["file"]
        .expires_at
        .is_none());
    assert!(!serde_json::to_string(&application.snapshot().await)
        .unwrap()
        .contains(&u.artifact.ciphertext_base64));
    assert!(application.snapshot().await.artifacts["file"]
        .ciphertext_base64
        .is_empty());
    let access = command(&a, "a", "first", "access", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/file/access", &access).await.0,
        StatusCode::OK
    );
    assert!(application.snapshot().await.files["file"]
        .expires_at
        .is_none());
    let bad = command(&b, "b", "outside", "access", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/file/access", &bad).await.0,
        StatusCode::FORBIDDEN
    );
    let no_attempt = command(&a, "a", "missing", "acknowledge", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/file/acknowledge", &no_attempt)
            .await
            .0,
        StatusCode::CONFLICT
    );
    let ack = command(&a, "a", "first", "acknowledge", &u, 0);
    let first = call(&app, "/v1/files/file/acknowledge", &ack).await;
    assert_eq!(first.0, StatusCode::OK);
    now.fetch_add(100, Ordering::SeqCst);
    assert_eq!(
        call(&app, "/v1/files/file/acknowledge", &ack).await.1,
        first.1
    );
    assert_eq!(
        application.snapshot().await.files["file"].last_download_at,
        first.1["acknowledged_at"].as_u64()
    );
    // Existing finalized grants determine recipient access to new files.
    let env = vec![7; 64];
    let digest = sha256_hex(&env);
    let grant = PrepareGrantRequest {
        operation_id: "grant".into(),
        artifact_version_id: "file".into(),
        originator_id: "a".into(),
        recipient_id: "b".into(),
        expected_revision: 0,
        recipient_envelope_base64: STANDARD.encode(env),
        recipient_envelope_sha256: digest.clone(),
        knowledge_consideration_lamports: 0,
        authorization: auth(&a, grant_message("grant", "file", "a", "b", 0, &digest)),
    };
    assert_eq!(call(&app, "/v1/grants", &grant).await.0, StatusCode::OK);
    gateway
        .record(FinalizedArtifactObservation {
            transaction_signature: "tx".into(),
            artifact_version_id: "file".into(),
            recipient_wallet_public_key: bs58::encode(b.verifying_key().to_bytes()).into_string(),
            recipient_envelope_sha256: digest,
            revision: 1,
            finality: "finalized".into(),
        })
        .await;
    assert_eq!(
        call(
            &app,
            "/v1/grants/grant/finalize",
            &FinalizeGrantRequest {
                transaction_signature: "tx".into(),
                artifact_account: "mock".into()
            }
        )
        .await
        .0,
        StatusCode::OK
    );
    let access = command(&b, "b", "second", "access", &u, 1);
    assert_eq!(
        call(&app, "/v1/files/file/access", &access).await.0,
        StatusCode::OK
    );
    let ack2 = command(&b, "b", "second", "acknowledge", &u, 1);
    let second = call(&app, "/v1/files/file/acknowledge", &ack2).await;
    assert_eq!(second.0, StatusCode::OK);
    assert!(second.1["expires_at"].as_u64() > first.1["expires_at"].as_u64());
    let until = second.1["expires_at"].as_u64().unwrap();
    now.store(until - 10, Ordering::SeqCst);
    let late = command(&b, "b", "late", "access", &u, 1);
    assert_eq!(
        call(&app, "/v1/files/file/access", &late).await.0,
        StatusCode::OK
    );
    now.store(until, Ordering::SeqCst);
    assert_eq!(application.expire_files().await.unwrap(), 1);
    let state = application.snapshot().await;
    assert!(!state.file_payloads.contains_key("file"));
    assert!(state.artifacts.contains_key("file"));
    assert_eq!(state.files["file"].attempts.len(), 3);
    let late_ack = command(&b, "b", "late", "acknowledge", &u, 1);
    assert_eq!(
        call(&app, "/v1/files/file/acknowledge", &late_ack).await.0,
        StatusCode::GONE
    );
    assert_eq!(
        call(&app, "/v1/files/file/access", &late).await.0,
        StatusCode::GONE
    );
    // Upload retry returns the tombstone, never restores ciphertext.
    assert_eq!(call(&app, "/v1/files", &u).await.1["expired"], true);
    assert!(!application
        .snapshot()
        .await
        .file_payloads
        .contains_key("file"));
}
#[tokio::test]
async fn size_policy_signature_and_expired_attempt_boundaries() {
    let now = Arc::new(AtomicU64::new(1_700_000_000));
    let clock = now.clone();
    let application = Application::memory(FinalityGateway::Mock(MockFinalityGateway::default()))
        .await
        .with_clock(move || clock.load(Ordering::SeqCst));
    let app = router(application.clone());
    let a = SigningKey::from_bytes(&[1; 32]);
    register(&app, "a", &a).await;
    let u = upload(&a, "maximum", MAX_ORIGINAL_BYTES);
    assert_eq!(call(&app, "/v1/files", &u).await.0, StatusCode::OK);
    let large = upload(&a, "too-large", MAX_ORIGINAL_BYTES + 1);
    assert_eq!(
        call(&app, "/v1/files", &large).await.0,
        StatusCode::BAD_REQUEST
    );
    let mut wrong = upload(&a, "policy", 2);
    wrong.policy_accepted = false;
    wrong.artifact.authorization = auth(&a, wrong.message());
    assert_eq!(
        call(&app, "/v1/files", &wrong).await.0,
        StatusCode::BAD_REQUEST
    );
    let mut tampered = upload(&a, "tamper", 2);
    tampered.original_bytes = 1;
    assert_eq!(
        call(&app, "/v1/files", &tampered).await.0,
        StatusCode::FORBIDDEN
    );
    let access = command(&a, "a", "timeout", "access", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/maximum/access", &access).await.0,
        StatusCode::OK
    );
    now.fetch_add(ACK_WINDOW_SECONDS, Ordering::SeqCst);
    let ack = command(&a, "a", "timeout", "acknowledge", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/maximum/acknowledge", &ack).await.0,
        StatusCode::CONFLICT
    );
    assert!(application.snapshot().await.files["maximum"]
        .expires_at
        .is_none());
    let legacy = AccessRequest {
        requester_id: "a".into(),
        authorization: auth(&a, access_message("maximum", "a", 0)),
    };
    assert_eq!(
        call(&app, "/v1/artifacts/maximum/access", &legacy).await.0,
        StatusCode::BAD_REQUEST
    );
    let huge = Request::post("/v1/files")
        .header("content-type", "application/json")
        .body(Body::from(vec![b' '; MAX_FILE_REQUEST + 1]))
        .unwrap();
    assert_eq!(
        app.oneshot(huge).await.unwrap().status(),
        StatusCode::PAYLOAD_TOO_LARGE
    );
}
#[test]
fn calendar_anniversaries_preserve_time_and_clamp_leap_day() {
    // 2024-02-29 12:00 UTC -> 2025-02-28 12:00 UTC.
    assert_eq!(calendar_year_after(1_709_208_000), 1_740_744_000);
    assert_eq!(calendar_year_after(1_704_067_200), 1_735_689_600); // Jan 1 leap year
    assert_eq!(calendar_year_after(1_677_628_800), 1_709_251_200); // Mar 1 2023 -> Mar 1 2024
}

#[tokio::test]
#[ignore = "requires CA2_KEP_FILE_TEST_DATABASE_URL naming a disposable empty database"]
async fn postgres_file_expiry_is_atomic_and_legacy_archive_survives() {
    let url = std::env::var("CA2_KEP_FILE_TEST_DATABASE_URL").expect("disposable DB URL required");
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    let now = Arc::new(AtomicU64::new(1_709_208_000));
    let clock = now.clone();
    let application =
        Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
            .await
            .unwrap()
            .with_clock(move || clock.load(Ordering::SeqCst));
    assert!(application.snapshot().await.identities.is_empty());
    let app = router(application.clone());
    let a = SigningKey::from_bytes(&[1; 32]);
    register(&app, "a", &a).await;
    let mut legacy = upload(&a, "legacy", 3).artifact;
    legacy.authorization = auth(
        &a,
        artifact_message(
            &legacy.operation_id,
            "a",
            "legacy",
            "policy",
            1,
            &legacy.ciphertext_sha256,
            &legacy.originator_envelope_sha256,
        ),
    );
    assert_eq!(call(&app, "/v1/artifacts", &legacy).await.0, StatusCode::OK);
    let u = upload(&a, "file", 2);
    assert_eq!(call(&app, "/v1/files", &u).await.0, StatusCode::OK);
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.encrypted_archive")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count, 1);
    let json: Value = sqlx::query_scalar("SELECT coalesce(jsonb_agg(document), '[]'::jsonb) FROM kep_hosted.state_documents")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert!(!json.to_string().contains(&u.artifact.ciphertext_base64));
    // Access/acknowledgement change metadata only: even attempted payload/archive
    // inserts (including ON CONFLICT DO NOTHING) must be absent.
    sqlx::query("CREATE TRIGGER test_idle_archive BEFORE INSERT ON kep_hosted.encrypted_archive FOR EACH STATEMENT EXECUTE FUNCTION kep_hosted.reject_immutable_mutation()")
        .execute(&pool).await.unwrap();
    sqlx::query("CREATE TRIGGER test_idle_payload BEFORE INSERT OR UPDATE ON kep_hosted.file_payloads FOR EACH STATEMENT EXECUTE FUNCTION kep_hosted.reject_immutable_mutation()")
        .execute(&pool).await.unwrap();
    let access = command(&a, "a", "attempt", "access", &u, 0);
    assert_eq!(
        call(&app, "/v1/files/file/access", &access).await.0,
        StatusCode::OK
    );
    let ack = command(&a, "a", "attempt", "acknowledge", &u, 0);
    let receipt = call(&app, "/v1/files/file/acknowledge", &ack).await;
    assert_eq!(receipt.0, StatusCode::OK);
    let clock = now.clone();
    drop(app);
    drop(application);
    let recovered =
        Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
            .await
            .unwrap()
            .with_clock(move || clock.load(Ordering::SeqCst));
    assert_eq!(
        recovered.snapshot().await.file_payloads["file"],
        u.artifact.ciphertext_base64
    );
    now.store(receipt.1["expires_at"].as_u64().unwrap(), Ordering::SeqCst);
    sqlx::query("CREATE FUNCTION kep_hosted.test_block_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$").execute(&pool).await.unwrap();
    sqlx::query("CREATE TRIGGER test_block BEFORE DELETE ON kep_hosted.file_payloads FOR EACH ROW EXECUTE FUNCTION kep_hosted.test_block_delete()").execute(&pool).await.unwrap();
    assert!(recovered.expire_files().await.is_err());
    assert!(recovered
        .snapshot()
        .await
        .file_payloads
        .contains_key("file"));
    assert!(recovered.snapshot().await.files["file"]
        .expired_at
        .is_none());
    sqlx::query("DROP TRIGGER test_block ON kep_hosted.file_payloads")
        .execute(&pool)
        .await
        .unwrap();
    assert_eq!(recovered.expire_files().await.unwrap(), 1);
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.file_payloads")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count, 0);
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.encrypted_archive")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count, 1);
    drop(recovered);
    let restart =
        Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
            .await
            .unwrap();
    let state = restart.snapshot().await;
    assert!(state.file_payloads.is_empty());
    assert!(state.files["file"].expired_at.is_some());
    assert_eq!(
        state.artifacts["legacy"].ciphertext_base64,
        legacy.ciphertext_base64
    );
    let events:i64=sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type = 'file_download_acknowledged'").fetch_one(&pool).await.unwrap();
    assert_eq!(events, 1);
}

#[tokio::test]
async fn wall_clock_jumps_do_not_change_active_download_windows() {
    let epoch=1_700_000_000;
    let wall=Arc::new(AtomicU64::new(epoch));
    let elapsed=Arc::new(AtomicU64::new(0));
    let ticks=elapsed.clone();let sampled_wall=wall.clone();
    let clock=cyberalchemy_kep_hosted_devnet::clock::anchored(move || sampled_wall.load(Ordering::SeqCst),move || std::time::Duration::from_secs(ticks.load(Ordering::SeqCst)));
    let application=Application::memory(FinalityGateway::Mock(MockFinalityGateway::default())).await.with_clock(clock);
    let app=router(application.clone());let key=SigningKey::from_bytes(&[1;32]);register(&app,"a",&key).await;
    let u=upload(&key,"clock",10);assert_eq!(call(&app,"/v1/files",&u).await.0,StatusCode::OK);
    for attempt in ["backward","boundary","just-before"] {
        assert_eq!(call(&app,"/v1/files/clock/access",&command(&key,"a",attempt,"access",&u,0)).await.0,StatusCode::OK);
    }
    wall.store(epoch-2,Ordering::SeqCst);elapsed.store(1,Ordering::SeqCst);
    let ack=command(&key,"a","backward","acknowledge",&u,0);
    let (status,receipt)=call(&app,"/v1/files/clock/acknowledge",&ack).await;
    assert_eq!(status,StatusCode::OK);assert_eq!(receipt["acknowledged_at"],epoch+1);
    assert_eq!(receipt["expires_at"],calendar_year_after(epoch+1));
    // Forward wall corrections also cannot shorten the active elapsed window.
    wall.store(epoch+10_000_000,Ordering::SeqCst);elapsed.store(899,Ordering::SeqCst);
    assert_eq!(call(&app,"/v1/files/clock/acknowledge",&command(&key,"a","just-before","acknowledge",&u,0)).await.0,StatusCode::OK);
    elapsed.store(900,Ordering::SeqCst);
    assert_eq!(call(&app,"/v1/files/clock/acknowledge",&command(&key,"a","boundary","acknowledge",&u,0)).await.0,StatusCode::CONFLICT);
    assert_eq!(call(&app,"/v1/files/clock/acknowledge",&ack).await.1,receipt,"completed receipt stays idempotent");
    assert!(application.snapshot().await.files["clock"].attempts["boundary"].acknowledged_at.is_none());
}

#[tokio::test]
#[ignore="requires fresh CA2_KEP_CLOCK_TEST_DATABASE_URL"]
async fn restart_behind_persisted_attempt_is_retryable_without_extending_deadline() {
    let url=std::env::var("CA2_KEP_CLOCK_TEST_DATABASE_URL").unwrap();let epoch=1_700_000_000;
    let application=Application::postgres(&url,FinalityGateway::Mock(MockFinalityGateway::default())).await.unwrap().with_clock(move || epoch);
    let app=router(application.clone());let key=SigningKey::from_bytes(&[1;32]);register(&app,"a",&key).await;
    let u=upload(&key,"restart-clock",10);assert_eq!(call(&app,"/v1/files",&u).await.0,StatusCode::OK);
    for attempt in ["restart","deadline"] {
        assert_eq!(call(&app,"/v1/files/restart-clock/access",&command(&key,"a",attempt,"access",&u,0)).await.0,StatusCode::OK);
    }
    drop(app);drop(application);
    let now=Arc::new(AtomicU64::new(epoch-2));let clock=now.clone();
    let recovered=Application::postgres(&url,FinalityGateway::Mock(MockFinalityGateway::default())).await.unwrap().with_clock(move || clock.load(Ordering::SeqCst));
    let app=router(recovered.clone());let ack=command(&key,"a","restart","acknowledge",&u,0);
    let (status,body)=call(&app,"/v1/files/restart-clock/acknowledge",&ack).await;
    assert_eq!(status,StatusCode::SERVICE_UNAVAILABLE);assert!(body["message"].as_str().unwrap().contains("clock is behind"));
    assert!(recovered.snapshot().await.files["restart-clock"].last_download_at.is_none());
    now.store(epoch+1,Ordering::SeqCst);
    assert_eq!(call(&app,"/v1/files/restart-clock/acknowledge",&ack).await.0,StatusCode::OK);
    now.store(epoch+900,Ordering::SeqCst);
    assert_eq!(call(&app,"/v1/files/restart-clock/acknowledge",&command(&key,"a","deadline","acknowledge",&u,0)).await.0,StatusCode::CONFLICT);
    let pool=sqlx::PgPool::connect(&url).await.unwrap();
    let n:i64=sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type='file_download_acknowledged'").fetch_one(&pool).await.unwrap();assert_eq!(n,1);
}
