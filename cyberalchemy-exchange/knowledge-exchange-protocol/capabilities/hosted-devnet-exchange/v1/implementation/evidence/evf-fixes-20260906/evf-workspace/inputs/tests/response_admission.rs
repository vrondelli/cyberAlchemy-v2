use axum::{
    body::{Body, Bytes},
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use cyberalchemy_kep_hosted_devnet::response_admission::TransferPool;
use http_body_util::BodyExt;
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    time::Duration,
};

#[tokio::test]
async fn final_frame_outlives_body_and_retains_capacity() {
    let pool = TransferPool::new(1);
    let bytes = pool.try_reserve().unwrap().into_bytes(vec![42; 13_333_416]);
    let mut body = Body::from(bytes);
    let frame = body.frame().await.unwrap().unwrap().into_data().unwrap();
    drop(body);
    assert!(
        pool.try_reserve().is_none(),
        "body drop must not release frame-owned capacity"
    );
    let clone = frame.clone();
    let slice = frame.slice(0..1);
    drop(frame);
    drop(clone);
    assert_eq!(
        pool.available(),
        0,
        "even a retained slice keeps its allocation owner"
    );
    drop(slice);
    assert_eq!(pool.available(), 1);
}

#[test]
fn abandoned_reservation_and_empty_payload_release() {
    let pool = TransferPool::new(1);
    let reservation = pool.try_reserve().unwrap();
    assert!(pool.try_reserve().is_none());
    drop(reservation);
    assert_eq!(pool.available(), 1);
    let bytes = pool.try_reserve().unwrap().into_bytes(Vec::new());
    drop(bytes);
    assert_eq!(pool.available(), 1);
}

async fn bulk(State(pool): State<TransferPool>) -> Response {
    respond(&pool, 13_333_416)
}
async fn small(State(pool): State<TransferPool>) -> Response {
    respond(&pool, 1024)
}
fn respond(pool: &TransferPool, length: usize) -> Response {
    let Some(reservation) = pool.try_reserve() else {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [("retry-after", "1")],
            "busy",
        )
            .into_response();
    };
    reservation.into_bytes(vec![42; length]).into_response()
}
// Negative control: the same old handler-lifetime mistake must admit all six.
async fn handler_only(State(pool): State<TransferPool>) -> Response {
    let Some(_reservation) = pool.try_reserve() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    Bytes::from(vec![42; 13_333_416]).into_response()
}

struct Server(tokio::task::JoinHandle<()>);
impl Drop for Server {
    fn drop(&mut self) {
        self.0.abort();
    }
}
async fn server() -> (SocketAddr, TransferPool, Server) {
    let pool = TransferPool::new(4);
    let router = Router::new()
        .route("/bulk", get(bulk))
        .route("/small", get(small))
        .route("/old", get(handler_only))
        .route("/control", get(|| async { "ok" }))
        .with_state(pool.clone());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let handle = tokio::spawn(async move {
        axum::serve(listener, router).await.unwrap();
    });
    (addr, pool, Server(handle))
}
fn headers(addr: SocketAddr, path: &str) -> (TcpStream, u16) {
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(3)).unwrap();
    stream
        .set_read_timeout(Some(Duration::from_secs(5)))
        .unwrap();
    stream
        .set_write_timeout(Some(Duration::from_secs(5)))
        .unwrap();
    write!(
        stream,
        "GET {path} HTTP/1.1\r\nHost: {addr}\r\nConnection: close\r\n\r\n"
    )
    .unwrap();
    let mut bytes = Vec::new();
    while !bytes.ends_with(b"\r\n\r\n") {
        let mut byte = [0];
        stream.read_exact(&mut byte).unwrap();
        bytes.push(byte[0]);
        assert!(bytes.len() < 16_384);
    }
    let text = String::from_utf8(bytes).unwrap();
    let status = text.split_whitespace().nth(1).unwrap().parse().unwrap();
    if status == 429 {
        assert!(text.to_ascii_lowercase().contains("retry-after: 1"));
    }
    (stream, status)
}
async fn open(addr: SocketAddr, path: &'static str) -> (TcpStream, u16) {
    tokio::task::spawn_blocking(move || headers(addr, path))
        .await
        .unwrap()
}
async fn recovered(pool: &TransferPool) {
    tokio::time::timeout(Duration::from_secs(5), async {
        while pool.available() != 4 {
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    })
    .await
    .expect("capacity did not recover after closing readers");
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn real_http_four_held_transfers_reject_two_and_recover() {
    let (addr, pool, _server) = server().await;
    let client = reqwest::Client::builder()
        .no_proxy()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();
    for cycle in 0..3 {
        let mut readers = Vec::new();
        for _ in 0..4 {
            let (s, status) = open(addr, "/bulk").await;
            assert_eq!(status, 200);
            readers.push(s);
        }
        assert_eq!(
            pool.available(),
            0,
            "server must still own all four responses"
        );
        for _ in 0..2 {
            let (s, status) = open(addr, "/bulk").await;
            assert_eq!(status, 429);
            drop(s);
        }
        // Hold unread responses and prove the server-side owners remain live.
        for _ in 0..10 {
            tokio::time::sleep(Duration::from_millis(100)).await;
            assert_eq!(pool.available(), 0);
            let response = client
                .get(format!("http://{addr}/control"))
                .send()
                .await
                .unwrap();
            assert_eq!(response.status(), 200);
            assert_eq!(response.text().await.unwrap(), "ok");
        }
        // Release exactly one reader, then require exactly one replacement.
        drop(readers.pop());
        tokio::time::timeout(Duration::from_secs(5), async {
            while pool.available() != 1 {
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        })
        .await
        .unwrap();
        let (s, status) = open(addr, "/bulk").await;
        assert_eq!(status, 200);
        readers.push(s);
        assert_eq!(pool.available(), 0);
        drop(readers);
        recovered(&pool).await;
        for (path, length) in [("/small", 1024), ("/bulk", 13_333_416)] {
            let r = client
                .get(format!("http://{addr}{path}"))
                .send()
                .await
                .unwrap();
            assert_eq!(r.status(), 200);
            let bytes = r.bytes().await.unwrap();
            assert_eq!(bytes.len(), length);
            assert!(bytes.iter().all(|b| *b == 42));
            recovered(&pool).await;
        }
        println!("OWNERSHIP cycle={cycle} accepted=4 rejected=2 replacement=1 full_reads=2 capacity_recovered=4");
    }
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn negative_control_reproduces_handler_only_gap() {
    let (addr, pool, _server) = server().await;
    let mut readers = Vec::new();
    for _ in 0..6 {
        let (s, status) = open(addr, "/old").await;
        assert_eq!(status, 200);
        readers.push(s);
    }
    assert_eq!(
        pool.available(),
        4,
        "negative control releases slots before transport consumption"
    );
    drop(readers);
    println!("OWNERSHIP negative_control accepted=6 available=4");
}

// A wrapper which does not forward vectored-write support selects Hyper's
// flatten/copy path. This test records why byte ownership is not universal.
struct ScalarIo(tokio::net::TcpStream);
impl tokio::io::AsyncRead for ScalarIo {
    fn poll_read(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        std::pin::Pin::new(&mut self.0).poll_read(cx, buf)
    }
}
impl tokio::io::AsyncWrite for ScalarIo {
    fn poll_write(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &[u8],
    ) -> std::task::Poll<std::io::Result<usize>> {
        std::pin::Pin::new(&mut self.0).poll_write(cx, buf)
    }
    fn poll_flush(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        std::pin::Pin::new(&mut self.0).poll_flush(cx)
    }
    fn poll_shutdown(
        mut self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {
        std::pin::Pin::new(&mut self.0).poll_shutdown(cx)
    }
}
struct ScalarListener(tokio::net::TcpListener);
impl axum::serve::Listener for ScalarListener {
    type Io = ScalarIo;
    type Addr = SocketAddr;
    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        let (s, a) = axum::serve::Listener::accept(&mut self.0).await;
        (ScalarIo(s), a)
    }
    fn local_addr(&self) -> std::io::Result<Self::Addr> {
        self.0.local_addr()
    }
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn scalar_transport_demonstrates_copy_path_limitation() {
    let pool = TransferPool::new(4);
    let app = Router::new()
        .route("/bulk", get(bulk))
        .with_state(pool.clone());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let _server = Server(tokio::spawn(async move {
        axum::serve(ScalarListener(listener), app).await.unwrap();
    }));
    let mut readers = Vec::new();
    for _ in 0..6 {
        let (s, status) = open(addr, "/bulk").await;
        assert_eq!(status, 200);
        readers.push(s);
    }
    assert_eq!(
        pool.available(),
        4,
        "Hyper copied data out of the owned frame"
    );
    drop(readers);
    println!("OWNERSHIP scalar_copy_path accepted=6 available=4 limitation=confirmed");
}
