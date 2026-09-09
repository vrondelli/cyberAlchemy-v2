use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{auth::*, files::*, model::*};
use ed25519_dalek::{Signer, SigningKey};
use reqwest::{Client, StatusCode};
use serde::Serialize;
use serde_json::Value;
use std::time::Duration;
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
use cyberalchemy_kep_hosted_devnet::{
    router,
    transport::{ResponseListener, TransferClock, WriteDeadlines},
    Application, FinalityGateway, MockFinalityGateway,
};
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
};
fn send_headers(stream: &mut TcpStream, addr: SocketAddr, path: &str, body: &[u8]) -> (u16, usize) {
    write!(stream,"POST {path} HTTP/1.1\r\nHost: {addr}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n",body.len()).unwrap();
    stream.write_all(body).unwrap();
    let mut bytes = Vec::new();
    while !bytes.ends_with(b"\r\n\r\n") {
        let mut b = [0];
        stream.read_exact(&mut b).unwrap();
        bytes.push(b[0]);
        assert!(bytes.len() < 16384);
    }
    let text = String::from_utf8(bytes).unwrap();
    let status = text.split_whitespace().nth(1).unwrap().parse().unwrap();
    let n = text
        .lines()
        .find_map(|l| {
            l.to_ascii_lowercase()
                .strip_prefix("content-length: ")
                .map(|s| s.parse::<usize>().unwrap())
        })
        .unwrap();
    if status == 429 {
        assert!(text.to_ascii_lowercase().contains("retry-after: 1"));
    }
    (status, n)
}
fn connect(addr: SocketAddr) -> TcpStream {
    let s = TcpStream::connect_timeout(&addr, Duration::from_secs(3)).unwrap();
    s.set_read_timeout(Some(Duration::from_secs(10))).unwrap();
    s.set_write_timeout(Some(Duration::from_secs(5))).unwrap();
    s
}
async fn opened(addr: SocketAddr, c: FileCommand) -> (TcpStream, u16, usize) {
    tokio::task::spawn_blocking(move || {
        let mut s = connect(addr);
        let (status, n) = send_headers(
            &mut s,
            addr,
            "/v1/files/integrated/access",
            &serde_json::to_vec(&c).unwrap(),
        );
        (s, status, n)
    })
    .await
    .unwrap()
}
struct Server(tokio::task::JoinHandle<()>);
impl Drop for Server {
    fn drop(&mut self) {
        self.0.abort();
    }
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
#[ignore = "fresh CA2_KEP_RESPONSE_TEST_DATABASE_URL and isolated loopback required"]
async fn real_kep_transfer_admission_deadlines_and_keepalive() {
    let url = std::env::var("CA2_KEP_RESPONSE_TEST_DATABASE_URL").unwrap();
    assert!(url.starts_with("postgres://postgres@127.0.0.1:32773/kep_response_"));
    let application =
        Application::postgres(&url, FinalityGateway::Mock(MockFinalityGateway::default()))
            .await
            .unwrap();
    assert!(application.snapshot().await.files.is_empty());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let service =
        router(application.clone()).into_make_service_with_connect_info::<TransferClock>();
    let _server = Server(tokio::spawn(async move {
        axum::serve(
            ResponseListener(
                listener,
                WriteDeadlines {
                    idle: Duration::from_secs(2),
                    total: Duration::from_secs(5),
                },
            ),
            service,
        )
        .await
        .unwrap();
    }));
    let app = Target {
        base: format!("http://{addr}"),
        client: Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap(),
    };
    let key = SigningKey::from_bytes(&[72; 32]);
    register(&app, "a", &key).await;
    let u = upload(&key, "integrated", 10_000_000);
    assert_eq!(call(&app, "/v1/files", &u).await.0, 200);
    // Same TCP connection survives idle time longer than the old absolute budget.
    let c = command(&key, "a", "keep-1", "access", &u, 0);
    let expected = u.artifact.ciphertext_base64.clone();
    let mut socket = tokio::task::spawn_blocking(move || {
        let mut s = connect(addr);
        let (status, n) = send_headers(
            &mut s,
            addr,
            "/v1/files/integrated/access",
            &serde_json::to_vec(&c).unwrap(),
        );
        assert_eq!(status, 200);
        let mut b = vec![0; n];
        s.read_exact(&mut b).unwrap();
        assert_eq!(
            serde_json::from_slice::<Value>(&b).unwrap()["ciphertext_base64"],
            expected
        );
        s
    })
    .await
    .unwrap();
    tokio::time::sleep(Duration::from_secs(6)).await;
    let c = command(&key, "a", "keep-2", "access", &u, 0);
    let expected = u.artifact.ciphertext_base64.clone();
    tokio::task::spawn_blocking(move || {
        let (status, n) = send_headers(
            &mut socket,
            addr,
            "/v1/files/integrated/access",
            &serde_json::to_vec(&c).unwrap(),
        );
        assert_eq!(status, 200);
        let mut b = vec![0; n];
        socket.read_exact(&mut b).unwrap();
        assert_eq!(
            serde_json::from_slice::<Value>(&b).unwrap()["ciphertext_base64"],
            expected
        );
    })
    .await
    .unwrap();
    let setup = std::time::Instant::now();
    let mut readers = Vec::new();
    for i in 0..4 {
        let (s, status, n) = opened(
            addr,
            command(&key, "a", &format!("held-{i}"), "access", &u, 0),
        )
        .await;
        assert_eq!(status, 200);
        assert!(n > 13_000_000);
        readers.push(s);
    }
    assert!(
        setup.elapsed() < Duration::from_secs(1),
        "short-deadline fixture setup too slow; use optimized build"
    );
    for i in 0..2 {
        let (s, status, _) = opened(
            addr,
            command(&key, "a", &format!("denied-{i}"), "access", &u, 0),
        )
        .await;
        assert_eq!(status, 429);
        drop(s);
    }
    let snap = application.snapshot().await;
    assert!(!snap.files["integrated"]
        .attempts
        .keys()
        .any(|s| s.starts_with("denied-")));
    assert!(snap.files["integrated"].expires_at.is_none());
    drop(snap);
    assert_eq!(
        call(
            &app,
            "/v1/files/integrated/acknowledge",
            &command(&key, "a", "keep-2", "acknowledge", &u, 0)
        )
        .await
        .0,
        200
    );
    let prior = application.snapshot().await.files["integrated"].clone();
    let mut account = cyberalchemy_kep_hosted_devnet::accounts::AccountRead {
        wallet_public_key: bs58::encode(key.verifying_key().to_bytes()).into_string(),
        expires_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
            + 60,
        authorization: auth(&key, String::new()),
    };
    account.authorization = auth(&key, account.message());
    assert_eq!(call(&app, "/v1/account/read", &account).await.0, 200);
    // Pipeline a mutation behind a blocked response on the same connection.
    let mut queued = RegisterIdentityRequest {
        operation_id: "queued-registration".into(),
        identity_id: "queued".into(),
        wallet_public_key: bs58::encode(key.verifying_key().to_bytes()).into_string(),
        encryption_public_key: STANDARD.encode([4; 32]),
        encryption_key_version: 1,
        authorization: auth(&key, String::new()),
    };
    queued.authorization = auth(
        &key,
        register_message(
            &queued.operation_id,
            &queued.identity_id,
            &queued.wallet_public_key,
            &queued.encryption_public_key,
            1,
        ),
    );
    let bytes = serde_json::to_vec(&queued).unwrap();
    write!(readers[0],"POST /v1/identities HTTP/1.1\r\nHost: {addr}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n",bytes.len()).unwrap();
    readers[0].write_all(&bytes).unwrap();
    // Keep client sockets open: server must terminate writes and release buffers.
    tokio::time::sleep(Duration::from_secs(3)).await;
    tokio::task::spawn_blocking(move || {
        for mut s in readers {
            let mut v = Vec::new();
            let r = s.read_to_end(&mut v);
            assert!(r.is_ok() || r.unwrap_err().kind() == std::io::ErrorKind::ConnectionReset);
            assert!(v.len() < 13_000_000);
        }
    })
    .await
    .unwrap();
    let after = application.snapshot().await;
    assert!(
        !after.identities.contains_key("queued"),
        "pipelined mutation must not execute after timeout"
    );
    assert_eq!(after.files["integrated"].expires_at, prior.expires_at);
    assert_eq!(
        after.files["integrated"].last_download_at,
        prior.last_download_at
    );
    assert!(after.files["integrated"]
        .attempts
        .iter()
        .filter(|(id, _)| id.starts_with("held-"))
        .all(|(_, a)| a.acknowledged_at.is_none()));
    drop(after);
    let (status, v) = call(
        &app,
        "/v1/files/integrated/access",
        &command(&key, "a", "recovery", "access", &u, 0),
    )
    .await;
    assert_eq!(status, 200);
    assert_eq!(v["ciphertext_base64"], u.artifact.ciphertext_base64);
    assert_eq!(
        call(
            &app,
            "/v1/files/integrated/acknowledge",
            &command(&key, "a", "recovery", "acknowledge", &u, 0)
        )
        .await
        .0,
        200
    );
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    let count:i64=sqlx::query_scalar("SELECT count(*) FROM kep_hosted.event_journal WHERE event_type='file_download_acknowledged'").fetch_one(&pool).await.unwrap();
    assert_eq!(count, 2);
    println!("KEP_INTEGRATION accepted=4 denied=2 denied_attempts=0 journal_ack=2 keepalive_reused=true account_during_saturation=true retention_preserved=true timeout_recovery=true");
}
struct PendingWriter;
impl tokio::io::AsyncWrite for PendingWriter {
    fn is_write_vectored(&self) -> bool {
        true
    }
    fn poll_write(
        self: std::pin::Pin<&mut Self>,
        _: &mut std::task::Context<'_>,
        _: &[u8],
    ) -> std::task::Poll<std::io::Result<usize>> {
        std::task::Poll::Pending
    }
    fn poll_flush(
        self: std::pin::Pin<&mut Self>,
        _: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        std::task::Poll::Pending
    }
    fn poll_shutdown(
        self: std::pin::Pin<&mut Self>,
        _: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        std::task::Poll::Ready(Ok(()))
    }
}
#[tokio::test]
async fn timeout_closes_generation_before_releasing_queued_handler() {
    use tokio::io::AsyncWriteExt;
    let mut io = cyberalchemy_kep_hosted_devnet::transport::DeadlineIo::for_responses(
        PendingWriter,
        WriteDeadlines {
            idle: Duration::from_millis(30),
            total: Duration::from_secs(1),
        },
    )
    .unwrap();
    let clock = io.response_clock();
    let lease = clock.begin().unwrap();
    let waiting = clock.clone();
    let task = tokio::spawn(async move { waiting.wait_idle().await });
    let err = tokio::time::timeout(Duration::from_secs(1), io.write_all(b"pending"))
        .await
        .unwrap()
        .unwrap_err();
    assert_eq!(err.kind(), std::io::ErrorKind::TimedOut);
    drop(lease);
    assert!(tokio::time::timeout(Duration::from_secs(1), task)
        .await
        .unwrap()
        .unwrap()
        .is_err());
    assert!(clock.begin().is_err());
}
