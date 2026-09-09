//! Vectored write deadlines with optional per-response ownership generations.
//! Timers begin on the first nonempty write, not while the handler is working.
//! Absolute time does not reset on flush. The hosted listener uses response
//! generations; the standalone constructor retains one-connection test behavior.
use std::{
    future::Future,
    io::{self, IoSlice},
    pin::Pin,
    task::{Context, Poll},
    time::Duration,
};
use tokio::{
    io::{AsyncRead, AsyncWrite, ReadBuf},
    time::{Instant, Sleep},
};

#[derive(Clone, Copy)]
pub struct WriteDeadlines {
    pub idle: Duration,
    pub total: Duration,
}
impl Default for WriteDeadlines {
    fn default() -> Self {
        Self {
            idle: Duration::from_secs(30),
            total: Duration::from_secs(300),
        }
    }
}
pub struct DeadlineIo<T> {
    inner: T,
    limits: WriteDeadlines,
    idle: Option<Pin<Box<Sleep>>>,
    total: Option<Pin<Box<Sleep>>>,
    failed: bool,
    clock: Option<TransferClock>,
    generation: Option<u64>,
}
impl<T: AsyncWrite + Unpin> DeadlineIo<T> {
    /// Reject scalar transports: Hyper may copy frames and drop their byte owner.
    pub fn new(inner: T, limits: WriteDeadlines) -> io::Result<Self> {
        if !inner.is_write_vectored() || limits.idle.is_zero() || limits.total.is_zero() {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "vectored transport and nonzero deadlines required",
            ));
        }
        Ok(Self {
            inner,
            limits,
            idle: None,
            total: None,
            failed: false,
            clock: None,
            generation: None,
        })
    }
    pub fn for_responses(inner: T, limits: WriteDeadlines) -> io::Result<Self> {
        let mut io = Self::new(inner, limits)?;
        io.clock = Some(TransferClock::default());
        Ok(io)
    }
    pub fn response_clock(&self) -> TransferClock {
        self.clock
            .as_ref()
            .expect("response listener required")
            .clone()
    }
    fn check(&mut self, cx: &mut Context<'_>, start: bool) -> io::Result<()> {
        if self.failed {
            return Err(io::Error::new(
                io::ErrorKind::TimedOut,
                "response write deadline exceeded",
            ));
        }
        if let Some(clock) = &self.clock {
            let active = clock.active();
            if active != self.generation {
                self.idle = None;
                self.total = None;
                self.generation = active;
            }
            if active.is_none() {
                return Ok(());
            }
        }
        if start && self.total.is_none() {
            self.idle = Some(Box::pin(tokio::time::sleep(self.limits.idle)));
            self.total = Some(Box::pin(tokio::time::sleep(self.limits.total)));
        }
        for timer in [&mut self.total, &mut self.idle].into_iter().flatten() {
            if timer.as_mut().poll(cx).is_ready() {
                self.failed = true;
                if let Some(clock) = &self.clock {
                    clock.close();
                }
                return Err(io::Error::new(
                    io::ErrorKind::TimedOut,
                    "response write deadline exceeded",
                ));
            }
        }
        Ok(())
    }
    fn progress(&mut self, result: &Poll<io::Result<usize>>) {
        if matches!(result,Poll::Ready(Ok(n)) if *n>0) {
            if let Some(timer) = &mut self.idle {
                timer.as_mut().reset(Instant::now() + self.limits.idle);
            }
        }
    }
}
impl<T: AsyncRead + Unpin> AsyncRead for DeadlineIo<T> {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        Pin::new(&mut self.inner).poll_read(cx, buf)
    }
}
impl<T: AsyncWrite + Unpin> AsyncWrite for DeadlineIo<T> {
    fn is_write_vectored(&self) -> bool {
        self.inner.is_write_vectored()
    }
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        self.check(cx, !buf.is_empty())?;
        let result = Pin::new(&mut self.inner).poll_write(cx, buf);
        self.progress(&result);
        result
    }
    fn poll_write_vectored(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        bufs: &[IoSlice<'_>],
    ) -> Poll<io::Result<usize>> {
        self.check(cx, bufs.iter().any(|b| !b.is_empty()))?;
        let result = Pin::new(&mut self.inner).poll_write_vectored(cx, bufs);
        self.progress(&result);
        result
    }
    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        self.check(cx, false)?;
        Pin::new(&mut self.inner).poll_flush(cx)
    }
    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        // Always allow teardown, including after timeout.
        Pin::new(&mut self.inner).poll_shutdown(cx)
    }
}

#[derive(Clone, Default)]
pub struct TransferClock(std::sync::Arc<std::sync::Mutex<TransferState>>);
#[derive(Default)]
struct TransferState {
    next: u64,
    active: Option<u64>,
    closed: bool,
}
impl TransferClock {
    fn active(&self) -> Option<u64> {
        self.0.lock().unwrap_or_else(|e| e.into_inner()).active
    }
    pub fn begin(&self) -> io::Result<TransferLease> {
        let mut state = self.0.lock().unwrap_or_else(|e| e.into_inner());
        if state.closed {
            return Err(io::Error::other("connection closed"));
        }
        if state.active.is_some() {
            return Err(io::Error::other("previous response still owns bytes"));
        }
        state.next = state
            .next
            .checked_add(1)
            .ok_or_else(|| io::Error::other("response generation exhausted"))?;
        state.active = Some(state.next);
        Ok(TransferLease {
            clock: self.clone(),
            generation: state.next,
        })
    }
    /// No subsequent handler effect while a previous response can time out.
    /// A cancelled waiter has not entered persistence or acquired a database lock.
    fn close(&self) {
        self.0.lock().unwrap_or_else(|e| e.into_inner()).closed = true;
    }
    pub async fn wait_idle(&self) -> io::Result<()> {
        loop {
            {
                let state = self.0.lock().unwrap_or_else(|e| e.into_inner());
                if state.closed {
                    return Err(io::Error::other("connection closed"));
                }
                if state.active.is_none() {
                    return Ok(());
                }
            }
            tokio::time::sleep(Duration::from_millis(10)).await;
        }
    }
}
pub struct TransferLease {
    clock: TransferClock,
    generation: u64,
}
impl Drop for TransferLease {
    fn drop(&mut self) {
        let mut state = self.clock.0.lock().unwrap_or_else(|e| e.into_inner());
        if state.active == Some(self.generation) {
            state.active = None;
        }
    }
}
pub struct ResponseListener(pub tokio::net::TcpListener, pub WriteDeadlines);
impl axum::serve::Listener for ResponseListener {
    type Io = DeadlineIo<tokio::net::TcpStream>;
    type Addr = std::net::SocketAddr;
    async fn accept(&mut self) -> (Self::Io, Self::Addr) {
        let (io, addr) = axum::serve::Listener::accept(&mut self.0).await;
        (
            DeadlineIo::for_responses(io, self.1).expect("vectored TCP required"),
            addr,
        )
    }
    fn local_addr(&self) -> io::Result<Self::Addr> {
        self.0.local_addr()
    }
}
impl axum::extract::connect_info::Connected<axum::serve::IncomingStream<'_, ResponseListener>>
    for TransferClock
{
    fn connect_info(stream: axum::serve::IncomingStream<'_, ResponseListener>) -> Self {
        stream.io().response_clock()
    }
}

impl<T> Drop for DeadlineIo<T> {
    fn drop(&mut self) {
        if let Some(clock) = &self.clock {
            clock.close();
        }
    }
}
