use axum::{
    body::Bytes,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use cyberalchemy_kep_hosted_devnet::{
    response_admission::TransferPool,
    transport::{DeadlineIo, WriteDeadlines},
};
use std::{
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    time::Duration,
};
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
async fn server(limits: WriteDeadlines) -> (SocketAddr, TransferPool, Server) {
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
        axum::serve(TimedListener(listener, limits), router)
            .await
            .unwrap();
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

struct TimedListener(tokio::net::TcpListener, WriteDeadlines);
impl axum::serve::Listener for TimedListener {
    type Io = DeadlineIo<tokio::net::TcpStream>;
    type Addr = SocketAddr;
    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        let (io, addr) = axum::serve::Listener::accept(&mut self.0).await;
        (DeadlineIo::new(io, self.1).unwrap(), addr)
    }
    fn local_addr(&self) -> std::io::Result<Self::Addr> {
        self.0.local_addr()
    }
}
#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn stalled_http_transfers_release_without_client_disconnect() {
    let (addr, pool, _server) = server(WriteDeadlines {
        idle: Duration::from_secs(2),
        total: Duration::from_secs(8),
    })
    .await;
    let mut readers = Vec::new();
    for _ in 0..4 {
        let (s, status) = open(addr, "/bulk").await;
        assert_eq!(status, 200);
        readers.push(s);
    }
    assert_eq!(pool.available(), 0, "wrapper must preserve byte owners");
    for _ in 0..2 {
        let (s, status) = open(addr, "/bulk").await;
        assert_eq!(status, 429);
        drop(s);
    }
    let client = reqwest::Client::builder()
        .no_proxy()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap();
    assert_eq!(
        client
            .get(format!("http://{addr}/control"))
            .send()
            .await
            .unwrap()
            .status(),
        200
    );
    // Clients still hold their sockets open and read no body bytes.
    recovered(&pool).await;
    let lengths = tokio::task::spawn_blocking(move || {
        readers
            .into_iter()
            .map(|mut s| {
                let mut v = Vec::new();
                let result = s.read_to_end(&mut v);
                assert!(
                    result.is_ok()
                        || result.unwrap_err().kind() == std::io::ErrorKind::ConnectionReset
                );
                assert!(v.len() < 13_333_416, "timeout must truncate transfer");
                v.len()
            })
            .collect::<Vec<_>>()
    })
    .await
    .unwrap();
    let r = client
        .get(format!("http://{addr}/bulk"))
        .send()
        .await
        .unwrap();
    assert_eq!(r.status(), 200);
    let bytes = r.bytes().await.unwrap();
    assert_eq!(bytes.len(), 13_333_416);
    assert!(bytes.iter().all(|b| *b == 42));
    recovered(&pool).await;
    println!("TRANSPORT timeout_released=4 partial_lengths={lengths:?} full_recovery=1");
}

use std::{
    future::poll_fn,
    io::{self, IoSlice},
    pin::Pin,
    task::{Context, Poll},
};
use tokio::io::{AsyncWrite, AsyncWriteExt};
struct Writer {
    pending: bool,
    scalar: bool,
    flush_pending: bool,
    count: usize,
}
impl AsyncWrite for Writer {
    fn is_write_vectored(&self) -> bool {
        !self.scalar
    }
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        _b: &[u8],
    ) -> Poll<io::Result<usize>> {
        panic!("vectored forwarding was lost")
    }
    fn poll_write_vectored(
        mut self: Pin<&mut Self>,
        _cx: &mut Context<'_>,
        b: &[IoSlice<'_>],
    ) -> Poll<io::Result<usize>> {
        if self.pending {
            Poll::Pending
        } else {
            self.count += 1;
            Poll::Ready(Ok(b.iter().map(|x| x.len()).sum()))
        }
    }
    fn poll_flush(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        if self.flush_pending {
            Poll::Pending
        } else {
            Poll::Ready(Ok(()))
        }
    }
    fn poll_shutdown(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }
}
fn writer(pending: bool, flush_pending: bool) -> Writer {
    Writer {
        pending,
        flush_pending,
        scalar: false,
        count: 0,
    }
}
async fn send(io: &mut DeadlineIo<Writer>) -> io::Result<usize> {
    poll_fn(|cx| {
        Pin::new(&mut *io).poll_write_vectored(cx, &[IoSlice::new(b"a"), IoSlice::new(b"b")])
    })
    .await
}
#[tokio::test]
async fn pending_write_is_woken_by_idle_timer_and_timeout_is_sticky() {
    let mut io = DeadlineIo::new(
        writer(true, false),
        WriteDeadlines {
            idle: Duration::from_millis(40),
            total: Duration::from_secs(2),
        },
    )
    .unwrap();
    let e = tokio::time::timeout(Duration::from_secs(1), send(&mut io))
        .await
        .unwrap()
        .unwrap_err();
    assert_eq!(e.kind(), io::ErrorKind::TimedOut);
    assert_eq!(
        send(&mut io).await.unwrap_err().kind(),
        io::ErrorKind::TimedOut
    );
    io.shutdown().await.unwrap();
}
#[tokio::test]
async fn pending_flush_is_timed_even_after_body_was_consumed() {
    let mut io = DeadlineIo::new(
        writer(false, true),
        WriteDeadlines {
            idle: Duration::from_millis(40),
            total: Duration::from_secs(2),
        },
    )
    .unwrap();
    assert!(io.is_write_vectored());
    assert_eq!(send(&mut io).await.unwrap(), 2);
    let e = tokio::time::timeout(Duration::from_secs(1), io.flush())
        .await
        .unwrap()
        .unwrap_err();
    assert_eq!(e.kind(), io::ErrorKind::TimedOut);
}
#[tokio::test]
async fn progress_and_flush_cannot_extend_absolute_budget() {
    let mut io = DeadlineIo::new(
        writer(false, false),
        WriteDeadlines {
            idle: Duration::from_secs(2),
            total: Duration::from_millis(150),
        },
    )
    .unwrap();
    let began = std::time::Instant::now();
    let mut successes = 0;
    loop {
        match send(&mut io).await {
            Ok(2) => successes += 1,
            Err(e) => {
                assert_eq!(e.kind(), io::ErrorKind::TimedOut);
                break;
            }
            v => panic!("{v:?}"),
        }
        io.flush().await.unwrap();
        tokio::time::sleep(Duration::from_millis(20)).await;
    }
    assert!(successes >= 2);
    assert!(began.elapsed() < Duration::from_secs(1));
}
#[tokio::test]
async fn handler_delay_does_not_start_write_budget() {
    let mut io = DeadlineIo::new(
        writer(false, false),
        WriteDeadlines {
            idle: Duration::from_millis(40),
            total: Duration::from_millis(80),
        },
    )
    .unwrap();
    tokio::time::sleep(Duration::from_millis(120)).await;
    io.flush().await.unwrap();
    assert_eq!(send(&mut io).await.unwrap(), 2);
}
#[test]
fn scalar_transport_is_rejected() {
    let mut w = writer(false, false);
    w.scalar = true;
    assert!(DeadlineIo::new(w, WriteDeadlines::default()).is_err());
}
