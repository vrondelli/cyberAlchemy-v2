use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{auth::*, files::*, model::*};
use ed25519_dalek::{Signer, SigningKey};
use reqwest::{Client, StatusCode};
use serde::Serialize;
use serde_json::{json, Value};
use std::time::{Duration, Instant};
#[derive(Clone)]
struct Target {
    client: Client,
    base: String,
}
fn auth(key: &SigningKey, message: String) -> Authorization {
    Authorization {
        signature_base64: STANDARD.encode(key.sign(message.as_bytes()).to_bytes()),
        message,
    }
}
async fn call<T: Serialize>(app: &Target, path: &str, body: &T) -> (StatusCode, Value) {
    let response = app
        .client
        .post(format!("{}{}", app.base, path))
        .json(body)
        .send()
        .await
        .unwrap();
    let status = response.status();
    let value = response.json().await.unwrap();
    (status, value)
}
async fn register(app: &Target, id: &str, key: &SigningKey) {
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
fn stats(mut times: Vec<f64>) -> Value {
    if times.is_empty() {
        return json!({"n":0});
    }
    times.sort_by(f64::total_cmp);
    let q = |p: f64| times[((times.len() as f64 * p).ceil() as usize).saturating_sub(1)];
    json!({"n":times.len(),"p50_ms":q(0.5),"p95_ms":q(0.95),"max_ms":q(1.0)})
}
async fn timed(app: Target, path: String, body: Vec<u8>) -> (u16, f64, Vec<u8>) {
    let start = Instant::now();
    let response = app
        .client
        .post(format!("{}{}", app.base, path))
        .header("content-type", "application/json")
        .body(body)
        .send()
        .await
        .unwrap();
    let status = response.status().as_u16();
    if status == 429 {
        assert!(response.headers().contains_key("retry-after"));
    }
    let bytes = response.bytes().await.unwrap().to_vec();
    (status, start.elapsed().as_secs_f64() * 1000.0, bytes)
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "bounded real HTTP load; dedicated loopback server and fresh database required"]
async fn real_http_load() {
    let base = std::env::var("KEP_HTTP_LOAD_URL").unwrap();
    let parsed = reqwest::Url::parse(&base).unwrap();
    assert_eq!(parsed.scheme(), "http");
    assert_eq!(parsed.host_str(), Some("127.0.0.1"));
    let url = std::env::var("CA2_KEP_LOAD_TEST_DATABASE_URL").unwrap();
    assert!(url.starts_with("postgres://postgres@127.0.0.1:32773/kep_http_"));
    let app = Target {
        base,
        client: Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(20))
            .build()
            .unwrap(),
    };
    let key = SigningKey::from_bytes(&[72; 32]);
    register(&app, "a", &key).await;
    let mut uploads = Vec::new();
    let mut results = Vec::new();
    let mut total_ack = 0;
    for length in [1024, 1_000_000, 10_000_000] {
        let u = upload(&key, &format!("http-{length}"), length);
        let (status, ms, _) = timed(
            app.clone(),
            "/v1/files".into(),
            serde_json::to_vec(&u).unwrap(),
        )
        .await;
        assert_eq!(status, 200);
        results.push(json!({"operation":"upload","original_bytes":length,"ms":ms}));
        uploads.push(u);
    }
    println!("HTTP_PHASE uploaded");
    for concurrency in [1, 4, 8] {
        let mut access_times = Vec::new();
        let mut ack_times = Vec::new();
        let mut rejected = 0;
        let mut health_times = Vec::new();
        let mut metadata_times = Vec::new();
        let phase = Instant::now();
        for round in 0..8 {
            let u = &uploads[round % 3];
            let barrier = std::sync::Arc::new(tokio::sync::Barrier::new(concurrency));
            let mut tasks = Vec::new();
            for index in 0..concurrency {
                let attempt = format!("http-{concurrency}-{round}-{index}");
                let command = command(&key, "a", &attempt, "access", u, 0);
                let body = serde_json::to_vec(&command).unwrap();
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
            // Probe liveness while the burst is in flight.
            let start = Instant::now();
            let response = app
                .client
                .get(format!("{}/health", app.base))
                .send()
                .await
                .unwrap();
            assert_eq!(response.status(), 200);
            response.bytes().await.unwrap();
            health_times.push(start.elapsed().as_secs_f64() * 1000.0);
            for (attempt, task) in tasks {
                let (status, ms, bytes) = task.await.unwrap();
                if status == 429 {
                    rejected += 1;
                    continue;
                }
                assert_eq!(status, 200);
                access_times.push(ms);
                let value: Value = serde_json::from_slice(&bytes).unwrap();
                assert_eq!(
                    value["ciphertext_base64"].as_str().unwrap(),
                    u.artifact.ciphertext_base64
                );
                let c = command(&key, "a", &attempt, "acknowledge", u, 0);
                let (status, ms, error_body) = timed(
                    app.clone(),
                    format!("/v1/files/{}/acknowledge", u.artifact.artifact_version_id),
                    serde_json::to_vec(&c).unwrap(),
                )
                .await;
                assert_eq!(
                    status,
                    200,
                    "attempt={attempt} deadline={} client_epoch={:?} response={}",
                    value["acknowledgement_deadline"],
                    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH),
                    String::from_utf8_lossy(&error_body)
                );
                ack_times.push(ms);
                total_ack += 1;
            }
            let start = Instant::now();
            register(&app, &format!("id-{concurrency}-{round}"), &key).await;
            metadata_times.push(start.elapsed().as_secs_f64() * 1000.0);
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
        results.push(json!({"operation":"mixed","concurrency":concurrency,"elapsed_seconds":phase.elapsed().as_secs_f64(),"offered_access":8*concurrency,"access":stats(access_times),"ack_sequential":stats(ack_times),"identity_with_signing":stats(metadata_times),"health":stats(health_times),"rejected_429":rejected}));
        println!("HTTP_PHASE concurrency_{concurrency}");
    }
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    let persisted:i64=sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type='file_download_acknowledged'").fetch_one(&pool).await.unwrap();
    assert_eq!(persisted, total_ack);
    let files: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.file_payloads")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(files, 3);
    println!("HTTP_PHASE idle");
    tokio::time::sleep(Duration::from_secs(5)).await;
    println!(
        "HTTP_RESULT {}",
        json!({"results":results,"acknowledgements":total_ack,"payload_rows":files})
    );
}
