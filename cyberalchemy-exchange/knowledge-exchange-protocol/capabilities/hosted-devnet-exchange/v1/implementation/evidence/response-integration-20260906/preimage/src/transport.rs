//! One-response connection prototype. Not wired into the hosted listener.
//! Timers begin on the first nonempty write, not while the handler is working.
//! Absolute time does not reset on flush. Persistent connections need explicit
//! response-boundary integration before this wrapper can be used there.
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
        })
    }
    fn check(&mut self, cx: &mut Context<'_>, start: bool) -> io::Result<()> {
        if self.failed {
            return Err(io::Error::new(
                io::ErrorKind::TimedOut,
                "response write deadline exceeded",
            ));
        }
        if start && self.total.is_none() {
            self.idle = Some(Box::pin(tokio::time::sleep(self.limits.idle)));
            self.total = Some(Box::pin(tokio::time::sleep(self.limits.total)));
        }
        for timer in [&mut self.total, &mut self.idle].into_iter().flatten() {
            if timer.as_mut().poll(cx).is_ready() {
                self.failed = true;
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
