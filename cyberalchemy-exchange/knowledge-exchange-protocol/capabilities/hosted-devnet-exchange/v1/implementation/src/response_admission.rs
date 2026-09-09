//! Bulk-response capacity tied to payload ownership, not body polling.
//! Hosted file access pairs reservations with response-specific transport leases.
//! Validated on vectored TCP HTTP/1.1 only. Hyper scalar/flatten writes copy out
//! of the owner and defeat this bound; transport integration must preserve the
//! validated path or provide independent connection/stream accounting.
use axum::body::Bytes;
use std::sync::Arc;
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

#[derive(Clone)]
pub struct TransferPool {
    slots: Arc<Semaphore>,
}
impl TransferPool {
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "transfer capacity must be positive");
        Self {
            slots: Arc::new(Semaphore::new(capacity)),
        }
    }

    /// Reserve before copying or serializing a payload. Dropping an unused
    /// reservation releases capacity, including on serialization failure.
    pub fn try_reserve(&self) -> Option<Reservation> {
        self.slots.clone().try_acquire_owned().ok().map(Reservation)
    }

    /// Local instrumentation; this does not measure kernel buffers or client receipt.
    pub fn available(&self) -> usize {
        self.slots.available_permits()
    }
}

pub struct Reservation(OwnedSemaphorePermit);
impl Reservation {
    /// All clones and slices of these bytes retain the same owner. The body can
    /// disappear while Hyper still holds the final frame, without freeing a slot.
    /// Do not copy into an unowned buffer and claim the reservation follows it.
    pub fn into_bytes(self, payload: Vec<u8>) -> Bytes {
        self.into_bytes_with_lease(payload, None)
    }

    pub fn into_bytes_with_lease(
        self,
        payload: Vec<u8>,
        lease: Option<crate::transport::TransferLease>,
    ) -> Bytes {
        Bytes::from_owner(Payload {
            data: payload,
            _lease: lease,
            _permit: self.0,
        })
    }
}

struct Payload {
    // Fields drop in declaration order: free data before returning capacity.
    data: Vec<u8>,
    _lease: Option<crate::transport::TransferLease>,
    _permit: OwnedSemaphorePermit,
}
impl AsRef<[u8]> for Payload {
    fn as_ref(&self) -> &[u8] {
        &self.data
    }
}
