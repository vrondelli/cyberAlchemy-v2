use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{
    auth::*, files::*, model::*, router, Application, FinalityGateway, MockFinalityGateway,
};
use ed25519_dalek::{Signer, SigningKey};
use http_body_util::BodyExt;
use serde::Serialize;
use serde_json::Value;
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
use serde_json::json;
use sha2::{Digest, Sha256};
use std::{hint::black_box, time::Instant};
fn memory() -> Value {
    let text = std::fs::read_to_string("/proc/self/status").unwrap();
    let kb = |name: &str| {
        text.lines()
            .find(|line| line.starts_with(name))
            .unwrap()
            .split_whitespace()
            .nth(1)
            .unwrap()
            .parse::<u64>()
            .unwrap()
    };
    json!({"rss_kib":kb("VmRSS:"),"peak_kib":kb("VmHWM:")})
}
fn stats(mut times: Vec<f64>) -> Value {
    times.sort_by(f64::total_cmp);
    let q = |p: f64| times[((times.len() as f64 * p).ceil() as usize).saturating_sub(1)];
    json!({"n":times.len(),"p50_ms":q(0.5),"p95_ms":q(0.95),"max_ms":q(1.0)})
}
#[test]
#[ignore = "bounded local measurement; MODE=cached|uncached"]
fn metadata_load_profile() {
    let mode = std::env::var("MODE").unwrap();
    assert!(mode == "cached" || mode == "uncached");
    let mut db = Database::default();
    db.identities.insert(
        "a".into(),
        KnowledgeIdentity {
            identity_id: "a".into(),
            wallet_public_key: "wallet".into(),
            encryption_public_key: STANDARD.encode([4; 32]),
            encryption_key_version: 1,
        },
    );
    // Synthetic retained legacy ciphertext: valid shape, no chain or decryption claim.
    for i in 0..512 {
        let id = format!("artifact-{i}");
        db.artifacts.insert(
            id.clone(),
            Artifact {
                artifact_version_id: id,
                originator_id: "a".into(),
                policy_id: "policy".into(),
                encryption_epoch: 1,
                ciphertext_base64: STANDARD.encode(vec![42; 12_288]),
                ciphertext_sha256: "0".repeat(64),
                owners: std::iter::once("a".into()).collect(),
                envelopes: Default::default(),
                revision: 0,
            },
        );
    }
    let seeded = memory();
    let mut phases = Vec::new();
    for phase in ["warm", "edit_identity", "edit_artifact"] {
        if phase != std::env::var("PHASE").expect("PHASE must select an isolated measurement") {
            continue;
        }
        if mode == "cached" && phase != "warm" {
            black_box(db.metadata().unwrap().digest());
        }

        let mut times = Vec::new();
        let mut digest = [0u8; 32];
        for _ in 0..20 {
            if phase == "edit_identity" {
                db.identities.get_mut("a").unwrap().encryption_key_version += 1;
            }
            if phase == "edit_artifact" {
                db.artifacts.get_mut("artifact-0").unwrap().revision += 1;
            }
            let start = Instant::now();
            if mode == "cached" {
                let metadata = db.metadata().unwrap();
                black_box(metadata.byte_len());
                black_box(metadata.documents());
                digest = metadata.digest();
            } else {
                let value = serde_json::to_value(&db).unwrap();
                let bytes = serde_json::to_vec(&value).unwrap();
                black_box(bytes.len());
                digest = Sha256::digest(&bytes).into();
                for collection in value.as_object().unwrap().values() {
                    if let Some(records) = collection.as_object() {
                        for record in records.values() {
                            black_box(Sha256::digest(serde_json::to_vec(record).unwrap()));
                        }
                    }
                }
            }
            black_box(digest);
            times.push(start.elapsed().as_secs_f64() * 1000.0);
        }
        let measured = memory();
        let oracle: [u8; 32] =
            Sha256::digest(serde_json::to_vec(&serde_json::to_value(&db).unwrap()).unwrap()).into();
        assert_eq!(digest, oracle);
        phases.push(json!({"phase":phase,"latency":stats(times),"memory":measured}));
    }
    println!(
        "LOAD_RESULT {}",
        json!({"kind":"metadata","mode":mode,"seed_memory":seeded,"phases":phases})
    );
}

async fn timed(app: Router, path: String, body: Vec<u8>) -> (u16, f64) {
    let start = Instant::now();
    let response = app
        .oneshot(
            Request::post(path)
                .header("content-type", "application/json")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status().as_u16();
    if status == 429 {
        assert!(response.headers().contains_key("retry-after"));
    }
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    black_box(bytes);
    (status, start.elapsed().as_secs_f64() * 1000.0)
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "requires fresh CA2_KEP_LOAD_TEST_DATABASE_URL on loopback"]
async fn api_load_profile() {
    let url = std::env::var("CA2_KEP_LOAD_TEST_DATABASE_URL").unwrap();
    assert!(url.starts_with("postgres://postgres@127.0.0.1:32773/kep_load_"));
    let application =
        Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
            .await
            .unwrap();
    assert!(application.snapshot().await.identities.is_empty());
    let app = router(application.clone());
    let key = SigningKey::from_bytes(&[71; 32]);
    register(&app, "a", &key).await;
    let mut uploads = Vec::new();
    let mut results = Vec::new();
    for length in [1024, 1_000_000, 10_000_000] {
        let u = upload(&key, &format!("load-{length}"), length);
        let (status, ms) = timed(
            app.clone(),
            "/v1/files".into(),
            serde_json::to_vec(&u).unwrap(),
        )
        .await;
        assert_eq!(status, 200);
        results.push(
            json!({"operation":"upload","original_bytes":length,"latency_ms":ms,"memory":memory()}),
        );
        uploads.push(u);
    }
    for concurrency in [1, 4, 8] {
        for u in &uploads {
            let mut access_times = Vec::new();
            let mut ack_times = Vec::new();
            let mut rejected = 0;
            for batch in 0..(8 / concurrency) {
                let barrier = std::sync::Arc::new(tokio::sync::Barrier::new(concurrency));
                let mut tasks = Vec::new();
                for index in 0..concurrency {
                    let attempt = format!("attempt-{concurrency}-{batch}-{index}");
                    let c = command(&key, "a", &attempt, "access", u, 0);
                    let body = serde_json::to_vec(&c).unwrap();
                    let path = format!("/v1/files/{}/access", u.artifact.artifact_version_id);
                    let app = app.clone();
                    let barrier = barrier.clone();
                    tasks.push((
                        attempt,
                        tokio::spawn(async move {
                            barrier.wait().await;
                            timed(app, path, body).await
                        }),
                    ));
                }
                for (attempt, task) in tasks {
                    let (status, ms) = task.await.unwrap();
                    if status == 429 {
                        rejected += 1;
                        continue;
                    }
                    assert_eq!(status, 200);
                    access_times.push(ms);
                    let c = command(&key, "a", &attempt, "acknowledge", u, 0);
                    let (status, ms) = timed(
                        app.clone(),
                        format!("/v1/files/{}/acknowledge", u.artifact.artifact_version_id),
                        serde_json::to_vec(&c).unwrap(),
                    )
                    .await;
                    assert_eq!(status, 200);
                    ack_times.push(ms);
                }
            }
            assert!(!access_times.is_empty());
            results.push(json!({"operation":"access_ack","concurrency":concurrency,"original_bytes":u.original_bytes,"access":stats(access_times),"ack_sequential":stats(ack_times),"rejected_429":rejected,"memory":memory()}));
        }
    }
    let snapshot = application.snapshot().await;
    assert_eq!(snapshot.files.len(), 3);
    assert_eq!(snapshot.file_payloads.len(), 3);
    let expected: usize = snapshot
        .files
        .values()
        .map(|f| {
            f.attempts
                .values()
                .filter(|a| a.acknowledged_at.is_some())
                .count()
        })
        .sum();
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    let persisted:i64=sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type='file_download_acknowledged'").fetch_one(&pool).await.unwrap();
    assert_eq!(persisted as usize, expected);
    let mut metadata_times = Vec::new();
    for i in 0..16 {
        let start = Instant::now();
        register(&app, &format!("metadata-{i}"), &key).await;
        metadata_times.push(start.elapsed().as_secs_f64() * 1000.0);
    }
    results.push(json!({"operation":"identity_registration","latency_including_signing":stats(metadata_times),"memory":memory()}));
    println!(
        "LOAD_RESULT {}",
        json!({"kind":"api_postgres","acknowledgements":expected,"results":results})
    );
}
