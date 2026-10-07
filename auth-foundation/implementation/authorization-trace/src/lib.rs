//! Opt-in, request-scoped observation of native Auth decision ingress.
//!
//! This crate is intentionally absent from normal builds. It observes wrapper
//! call sites, not the generated policy core or an external downstream system.

use std::cell::RefCell;
use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_INVOCATION: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Root {
    Fixture,
    Api,
    TenantBridge,
    PrototypeBridge,
    HttpsBridge,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EventKind {
    EpochOpened,
    GateDenied,
    GateReady,
    ReadyDecisionEntered,
    PolicyCallBefore,
    PolicyCallReturned,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Event {
    pub root: Root,
    pub invocation_id: u64,
    pub request_id: String,
    pub epoch_id: Option<u64>,
    pub kind: EventKind,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Trace {
    pub root: Root,
    pub invocation_id: u64,
    pub request_id: String,
    pub events: Vec<Event>,
}

struct Active {
    trace: Trace,
}

thread_local! {
    static CURRENT: RefCell<Option<Active>> = const { RefCell::new(None) };
}

/// A synchronous scope must be installed on the thread that runs admission.
/// Dropping it also restores any enclosing scope after a panic.
pub struct Scope {
    previous: Option<Active>,
    active: bool,
}

impl Scope {
    pub fn enter(root: Root, request_id: impl Into<String>) -> Self {
        let invocation_id = NEXT_INVOCATION.fetch_add(1, Ordering::Relaxed);
        let active = Active {
            trace: Trace {
                root,
                invocation_id,
                request_id: request_id.into(),
                events: Vec::new(),
            },
        };
        let previous = CURRENT.with(|current| current.replace(Some(active)));
        Self {
            previous,
            active: true,
        }
    }

    pub fn finish(mut self) -> Trace {
        let active = CURRENT.with(|current| current.replace(self.previous.take()));
        self.active = false;
        active.expect("active Auth trace scope").trace
    }
}

impl Drop for Scope {
    fn drop(&mut self) {
        if !self.active {
            return;
        }
        if let Some(previous) = self.previous.take() {
            CURRENT.with(|current| {
                current.replace(Some(previous));
            });
        } else {
            CURRENT.with(|current| {
                current.replace(None);
            });
        }
    }
}

pub fn record(kind: EventKind, request_id: &str, epoch_id: Option<u64>) {
    CURRENT.with(|current| {
        if let Some(active) = current.borrow_mut().as_mut() {
            active.trace.events.push(Event {
                root: active.trace.root,
                invocation_id: active.trace.invocation_id,
                request_id: request_id.to_owned(),
                epoch_id,
                kind,
            });
        }
    });
}

/// Debug output is opt-in even in trace builds; never enabled in normal builds.
pub fn emit_to_stderr_if_requested(trace: &Trace) {
    if std::env::var_os("AUTH_AUTHORIZATION_TRACE_STDERR").as_deref()
        == Some(std::ffi::OsStr::new("1"))
    {
        eprintln!("AUTH_AUTHORIZATION_TRACE {trace:?}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nested_scopes_do_not_mix_events() {
        let outer = Scope::enter(Root::Api, "outer");
        record(EventKind::EpochOpened, "outer", Some(1));
        let inner = Scope::enter(Root::TenantBridge, "inner");
        record(EventKind::GateDenied, "inner", Some(2));
        let inner = inner.finish();
        record(EventKind::GateReady, "outer", Some(1));
        let outer = outer.finish();
        assert_eq!(inner.events.len(), 1);
        assert_eq!(outer.events.len(), 2);
        assert_ne!(inner.invocation_id, outer.invocation_id);
    }
}
