// Synthetic signing and upload helpers copied from http_load_profile.rs; historical harness preserved.
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

async fn target() -> (Target, sqlx::PgPool) {
    let base = std::env::var("KEP_HTTP_LOAD_URL").unwrap();
    let parsed = reqwest::Url::parse(&base).unwrap();
    assert_eq!(parsed.scheme(), "http");
    assert_eq!(parsed.host_str(), Some("127.0.0.1"));
    let db = std::env::var("CA2_KEP_LOAD_TEST_DATABASE_URL").unwrap();
    assert!(db.starts_with("postgres://postgres@127.0.0.1:32773/kep_resilience_"));
    let pool = sqlx::PgPool::connect(&db).await.unwrap();
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM kep_hosted.state_documents")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(count, 0, "fresh database required");
    (
        Target {
            base,
            client: Client::builder()
                .no_proxy()
                .timeout(Duration::from_secs(20))
                .build()
                .unwrap(),
        },
        pool,
    )
}
async fn health(app: &Target) -> f64 {
    let start = Instant::now();
    let r = app
        .client
        .get(format!("{}/health", app.base))
        .timeout(Duration::from_secs(2))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 200);
    r.bytes().await.unwrap();
    start.elapsed().as_secs_f64() * 1000.0
}
async fn file(pool: &sqlx::PgPool, id: &str) -> Value {
    sqlx::query_scalar(
        "SELECT document FROM kep_hosted.state_documents WHERE collection='files' AND record_id=$1",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .unwrap()
}
async fn journal(pool: &sqlx::PgPool) -> i64 {
    sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type='file_download_acknowledged'").fetch_one(pool).await.unwrap()
}
async fn download(
    app: &Target,
    key: &SigningKey,
    u: &FileUploadRequest,
    attempt: &str,
) -> (f64, f64) {
    let id = &u.artifact.artifact_version_id;
    let c = command(key, "a", attempt, "access", u, 0);
    let (status, access, bytes) = timed(
        app.clone(),
        format!("/v1/files/{id}/access"),
        serde_json::to_vec(&c).unwrap(),
    )
    .await;
    assert_eq!(status, 200, "{}", String::from_utf8_lossy(&bytes));
    let value: Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(value["ciphertext_base64"], u.artifact.ciphertext_base64);
    let c = command(key, "a", attempt, "acknowledge", u, 0);
    let (status, ack, body) = timed(
        app.clone(),
        format!("/v1/files/{id}/acknowledge"),
        serde_json::to_vec(&c).unwrap(),
    )
    .await;
    assert_eq!(status, 200, "{}", String::from_utf8_lossy(&body));
    let receipt: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(
        receipt["expires_at"],
        calendar_year_after(receipt["acknowledged_at"].as_u64().unwrap())
    );
    (access, ack)
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "three-minute loopback soak; isolated server and fresh database required"]
async fn bounded_soak() {
    let (app, pool) = target().await;
    let key = SigningKey::from_bytes(&[72; 32]);
    register(&app, "a", &key).await;
    let u = upload(&key, "soak", 1_000_000);
    assert_eq!(call(&app, "/v1/files", &u).await.0, 200);
    let start = Instant::now();
    let mut access = Vec::new();
    let mut ack = Vec::new();
    let mut checks = Vec::new();
    for round in 0..60 {
        if round % 10 == 0 {
            println!("HTTP_PHASE soak_{}", round / 10);
        }
        let (a, b) = download(&app, &key, &u, &format!("soak-{round}")).await;
        access.push(a);
        ack.push(b);
        checks.push(health(&app).await);
        tokio::time::sleep(Duration::from_secs(3)).await;
    }
    assert_eq!(journal(&pool).await, 60);
    let record = file(&pool, "soak").await;
    assert_eq!(record["attempts"].as_object().unwrap().len(), 60);
    assert!(record["attempts"]
        .as_object()
        .unwrap()
        .values()
        .all(|v| v["acknowledged_at"].is_number()));
    println!("HTTP_PHASE idle");
    tokio::time::sleep(Duration::from_secs(15)).await;
    println!(
        "HTTP_RESULT {}",
        json!({"scenario":"bounded_soak","acknowledgements":60,"elapsed_seconds":start.elapsed().as_secs_f64(),"access":stats(access),"ack":stats(ack),"health":stats(checks)})
    );
}

// Read exactly the headers, then consume only tiny portions of a large response.
// Blocking socket operations live on Tokio's blocking pool and have timeouts.
fn open_reader(base: String, body: Vec<u8>) -> (std::net::TcpStream, u16, usize) {
    use std::io::{Read, Write};
    let url = reqwest::Url::parse(&base).unwrap();
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], url.port().unwrap()));
    let mut stream = std::net::TcpStream::connect_timeout(&addr, Duration::from_secs(3)).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(10)))
        .unwrap();
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .unwrap();
    write!(stream,"POST /v1/files/slow/access HTTP/1.1\r\nHost: {addr}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).unwrap();
    stream.write_all(&body).unwrap();
    let mut headers = Vec::new();
    while !headers.ends_with(b"\r\n\r\n") {
        let mut b = [0];
        stream.read_exact(&mut b).unwrap();
        headers.push(b[0]);
        assert!(headers.len() < 16384);
    }
    let headers = String::from_utf8(headers).unwrap();
    let status = headers.split_whitespace().nth(1).unwrap().parse().unwrap();
    let length = headers
        .lines()
        .find_map(|l| {
            l.to_ascii_lowercase()
                .strip_prefix("content-length: ")
                .map(|s| s.parse::<usize>().unwrap())
        })
        .unwrap();
    (stream, status, length)
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "bounded slow readers and disconnects; isolated loopback server required"]
async fn slow_readers_disconnect_recovery() {
    use std::io::Read;
    let (app, pool) = target().await;
    let key = SigningKey::from_bytes(&[72; 32]);
    register(&app, "a", &key).await;
    let u = upload(&key, "slow", 10_000_000);
    assert_eq!(call(&app, "/v1/files", &u).await.0, 200);
    let mut results = Vec::new();
    let mut health_times = Vec::new();
    let mut maximum = 0;
    for cycle in 0..3 {
        println!("HTTP_PHASE readers_{cycle}");
        let mut readers = Vec::new();
        let mut statuses = Vec::new();
        for i in 0..6 {
            let c = command(&key, "a", &format!("slow-{cycle}-{i}"), "access", &u, 0);
            let body = serde_json::to_vec(&c).unwrap();
            let base = app.base.clone();
            let (stream, status, length) =
                tokio::task::spawn_blocking(move || open_reader(base, body))
                    .await
                    .unwrap();
            statuses.push(status);
            match status {
                200 => {
                    assert!(length > 13_000_000);
                    readers.push(stream);
                }
                429 => {}
                _ => panic!("unexpected status {status}"),
            }
        }
        maximum = maximum.max(readers.len());
        // Six sockets at most, consume 10 KiB each over five seconds, then close.
        let holding = tokio::task::spawn_blocking(move || {
            let mut consumed = 0;
            for _ in 0..10 {
                for stream in &mut readers {
                    let mut b = [0; 1024];
                    stream.read_exact(&mut b).unwrap();
                    consumed += b.len();
                }
                std::thread::sleep(Duration::from_millis(500));
            }
            drop(readers);
            consumed
        });
        for _ in 0..10 {
            health_times.push(health(&app).await);
            tokio::time::sleep(Duration::from_millis(500)).await;
        }
        let consumed = holding.await.unwrap();
        assert_eq!(
            journal(&pool).await,
            cycle,
            "partial response must not acknowledge"
        );
        let record = file(&pool, "slow").await;
        assert!(record["attempts"]
            .as_object()
            .unwrap()
            .iter()
            .filter(|(k, _)| k.starts_with("slow-"))
            .all(|(_, v)| v["acknowledged_at"].is_null()));
        if cycle == 0 {
            assert!(record["last_download_at"].is_null());
            assert!(record["expires_at"].is_null());
        }
        println!("HTTP_PHASE recovery_{cycle}");
        let (access, ack) = download(&app, &key, &u, &format!("recovery-{cycle}")).await;
        assert_eq!(journal(&pool).await, cycle + 1);
        results.push(json!({"cycle":cycle,"statuses":statuses,"partial_body_bytes_consumed":consumed,"recovery_access_ms":access,"recovery_ack_ms":ack}));
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
    println!("HTTP_PHASE idle");
    tokio::time::sleep(Duration::from_secs(15)).await;
    println!(
        "HTTP_RESULT {}",
        json!({"scenario":"slow_readers_disconnect_recovery","cycles":results,"max_open_successful_responses":maximum,"expected_response_ceiling":4,"response_concurrency_bounded":maximum<=4,"partial_downloads_unacknowledged":true,"recovery_acknowledgements":3,"health":stats(health_times)})
    );
    assert!(maximum<=4,"response bodies outlive admission permits: observed {maximum} simultaneously open successful responses with configured request concurrency 4");
}
