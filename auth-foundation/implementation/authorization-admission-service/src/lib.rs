//! Admission-only SQLite epoch for the selected Auth request composition.
//!
//! This crate has no authorization-policy dependency. The caller supplies an
//! owned-result continuation, which receives a transaction-bound READY value
//! only after the command-boundary evaluator returns READY and state is usable.

mod schema;

use std::num::NonZeroU64;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

pub use auth_foundation_authorization_ready_authority::AdmissionOutcome;
use auth_foundation_authorization_ready_authority::{
    ReadyAuthorization, with_ready_in_transaction,
};
use auth_foundation_authorization_state_model::{InboundAuthorizationRequest, PortFailure};
use rusqlite::{Connection, OpenFlags, Transaction, TransactionBehavior};

pub use schema::{SCHEMA_V2, migrate_connection, migrate_database};

pub const MAX_REQUEST_ID_BYTES: usize = 256;
pub const MAX_REFERENCE_BYTES: usize = 256;

/// Clock for one evaluation epoch. Production constructors select the system
/// clock; custom clock constructors are confined to this crate's tests.
pub trait DecisionClock {
    fn decision_time(&self) -> Result<u64, PortFailure>;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct SystemDecisionClock;

impl DecisionClock for SystemDecisionClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|duration| duration.as_secs())
            .map_err(|_| PortFailure)
    }
}

/// Unique identifier source shared by the selected API's concrete pool.
#[derive(Debug)]
pub struct EpochAllocator {
    next: AtomicU64,
}

impl EpochAllocator {
    pub fn new() -> Self {
        Self {
            next: AtomicU64::new(1),
        }
    }

    pub fn allocate(&self) -> Option<NonZeroU64> {
        let mut current = self.next.load(Ordering::Acquire);
        loop {
            let identifier = NonZeroU64::new(current)?;
            let next = current.checked_add(1).unwrap_or(0);
            match self.next.compare_exchange_weak(
                current,
                next,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(_) => return Some(identifier),
                Err(observed) => current = observed,
            }
        }
    }
}

impl Default for EpochAllocator {
    fn default() -> Self {
        Self::new()
    }
}

struct EvaluationEpoch<'connection> {
    identifier: NonZeroU64,
    decision_time: u64,
    transaction: Transaction<'connection>,
}

impl EvaluationEpoch<'_> {
    fn finish(self) -> Result<(), PortFailure> {
        self.transaction.rollback().map_err(|_| PortFailure)
    }
}

pub struct SqliteAdmissionService<C: DecisionClock = SystemDecisionClock> {
    connection: Connection,
    clock: C,
    epoch_allocator: Arc<EpochAllocator>,
}

impl<C: DecisionClock> SqliteAdmissionService<C> {
    fn from_connection_with_clock_and_epoch_allocator(
        connection: Connection,
        clock: C,
        epoch_allocator: Arc<EpochAllocator>,
    ) -> Result<Self, PortFailure> {
        schema::validate_schema(&connection)?;
        schema::configure_runtime_connection(&connection)?;
        Ok(Self {
            connection,
            clock,
            epoch_allocator,
        })
    }

    /// Execute admission in one read-only transaction. There is no binary
    /// decision entrypoint in this crate and no READY value can escape the
    /// transaction borrow. An invalid request or gate DENY never invokes the
    /// continuation. An unusable post-READY state is kept distinct from DENY.
    /// The bare function pointer cannot capture values whose destructor could
    /// execute a downstream decision while a denied callback is dropped.
    ///
    /// ```compile_fail
    /// use auth_foundation_authorization_ready_authority::ReadyAuthorization;
    /// let captured = String::from("must not be dropped at the DENY boundary");
    /// let _continuation: for<'tx, 'conn> fn(ReadyAuthorization<'tx, 'conn>) =
    ///     |_ready| drop(captured);
    /// ```
    pub fn with_ready<R>(
        &mut self,
        request: InboundAuthorizationRequest,
        continuation: for<'transaction, 'connection> fn(
            ReadyAuthorization<'transaction, 'connection>,
        ) -> R,
    ) -> Result<AdmissionOutcome<R>, PortFailure> {
        if !valid_inbound_request(&request) {
            return Ok(AdmissionOutcome::Denied);
        }
        let decision_time = self.clock.decision_time()?;
        let identifier = self.epoch_allocator.allocate().ok_or(PortFailure)?;
        #[cfg(feature = "trace")]
        auth_foundation_authorization_trace::record(
            auth_foundation_authorization_trace::EventKind::EpochOpened,
            &request.request_id,
            Some(identifier.get()),
        );
        let transaction = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Deferred)
            .map_err(|_| PortFailure)?;
        let query_only = transaction
            .query_row("PRAGMA query_only", [], |row| row.get::<_, i64>(0))
            .unwrap_or(0);
        if query_only != 1 {
            transaction.rollback().map_err(|_| PortFailure)?;
            return Err(PortFailure);
        }
        let epoch = EvaluationEpoch {
            identifier,
            decision_time,
            transaction,
        };
        let outcome = with_ready_in_transaction(
            &epoch.transaction,
            &request,
            epoch.identifier,
            epoch.decision_time,
            continuation,
        );
        epoch.finish()?;
        Ok(outcome)
    }
}

impl SqliteAdmissionService<SystemDecisionClock> {
    /// Open an already migrated database without creating or migrating schema.
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PortFailure> {
        Self::open_with_epoch_allocator(path, Arc::new(EpochAllocator::new()))
    }

    pub fn open_with_epoch_allocator(
        path: impl AsRef<Path>,
        epoch_allocator: Arc<EpochAllocator>,
    ) -> Result<Self, PortFailure> {
        let connection = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .map_err(|_| PortFailure)?;
        Self::from_connection_with_clock_and_epoch_allocator(
            connection,
            SystemDecisionClock,
            epoch_allocator,
        )
    }

    pub fn from_connection(connection: Connection) -> Result<Self, PortFailure> {
        Self::from_connection_with_clock_and_epoch_allocator(
            connection,
            SystemDecisionClock,
            Arc::new(EpochAllocator::new()),
        )
    }
}

fn valid_inbound_request(request: &InboundAuthorizationRequest) -> bool {
    valid_identifier(&request.request_id, MAX_REQUEST_ID_BYTES)
        && valid_identifier(&request.authentication_evidence_ref, MAX_REFERENCE_BYTES)
        && valid_identifier(&request.route_id, MAX_REFERENCE_BYTES)
}

fn valid_identifier(value: &str, maximum: usize) -> bool {
    !value.is_empty() && value.len() <= maximum && !value.chars().any(char::is_control)
}

#[cfg(test)]
mod integration_tests;

#[cfg(test)]
mod tests {
    use super::*;

    struct FailingClock;

    struct FixedClock100;

    impl DecisionClock for FixedClock100 {
        fn decision_time(&self) -> Result<u64, PortFailure> {
            Ok(100)
        }
    }

    impl DecisionClock for FailingClock {
        fn decision_time(&self) -> Result<u64, PortFailure> {
            Err(PortFailure)
        }
    }

    fn request() -> InboundAuthorizationRequest {
        InboundAuthorizationRequest {
            request_id: "request-1".into(),
            authentication_evidence_ref: "auth-1".into(),
            route_id: "documents.read".into(),
        }
    }

    fn seeded_connection() -> Connection {
        let mut connection = Connection::open_in_memory().expect("connection");
        migrate_connection(&mut connection).expect("schema");
        let expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_secs()
            + 60;
        connection
            .execute_batch(&format!(
                "INSERT INTO auth_authentication_evidence
                (evidence_row_id,evidence_ref,session_id,trusted,revoked,expires_at,
                 evidence_revision,authenticated_subject_id)
             VALUES (1,'auth-1','session-1',1,0,{expires_at},3,'user-1');
             INSERT INTO auth_route_authorization_bindings
                (binding_row_id,route_id,resource,action,scope,scope_evidence_ref,
                 complete,enabled,binding_revision)
             VALUES (1,'documents.read','documents','read','tenant-7','scope-1',1,1,5);
             INSERT INTO auth_roles (role_id) VALUES ('reader');
             INSERT INTO auth_role_permissions
                (role_id,resource,action,scope,authorization_revision)
             VALUES ('reader','documents','read','tenant-7',7);
             INSERT INTO auth_sessions
                (session_row_id,session_id,user_id,status,authorization_revision,expires_at)
             VALUES (1,'session-1','user-1','active',7,{expires_at});
             INSERT INTO auth_session_active_roles
                (session_row_id,role_id,authorization_revision)
             VALUES (1,'reader',7);
             INSERT INTO auth_authorization_revisions (session_id,revision)
             VALUES ('session-1',7);
             INSERT INTO auth_scope_evidence
                (evidence_ref,resource,action,scope,trusted)
             VALUES ('scope-1','documents','read','tenant-7',1);"
            ))
            .expect("seed");
        connection
    }

    #[test]
    fn epoch_allocator_does_not_reuse_terminal_id() {
        let allocator = EpochAllocator {
            next: AtomicU64::new(u64::MAX),
        };
        assert_eq!(allocator.allocate().map(NonZeroU64::get), Some(u64::MAX));
        assert_eq!(allocator.allocate(), None);
    }

    #[test]
    fn shared_epoch_allocator_is_unique_under_concurrency() {
        let allocator = Arc::new(EpochAllocator::new());
        let mut workers = Vec::new();
        for _ in 0..8 {
            let allocator = Arc::clone(&allocator);
            workers.push(std::thread::spawn(move || {
                (0..1_000)
                    .map(|_| allocator.allocate().expect("epoch").get())
                    .collect::<Vec<_>>()
            }));
        }
        let mut identifiers = workers
            .into_iter()
            .flat_map(|worker| worker.join().expect("worker"))
            .collect::<Vec<_>>();
        identifiers.sort_unstable();
        identifiers.dedup();
        assert_eq!(identifiers.len(), 8_000);
    }

    #[test]
    fn admitted_connection_rejects_writes() {
        let service = SqliteAdmissionService::from_connection(seeded_connection())
            .expect("admission service");
        let error = service
            .connection
            .execute("DELETE FROM auth_sessions", [])
            .expect_err("read-only connection accepted a write");
        assert_eq!(
            error.sqlite_error_code(),
            Some(rusqlite::ErrorCode::ReadOnly)
        );
    }

    #[test]
    fn lost_transaction_reports_rollback_failure() {
        let mut connection = seeded_connection();
        schema::configure_runtime_connection(&connection).expect("read-only connection");
        let transaction = connection
            .transaction_with_behavior(TransactionBehavior::Deferred)
            .expect("transaction");
        transaction
            .execute_batch("ROLLBACK;")
            .expect("simulate lost transaction");
        let epoch = EvaluationEpoch {
            identifier: NonZeroU64::new(1).expect("epoch"),
            decision_time: 100,
            transaction,
        };
        assert!(matches!(epoch.finish(), Err(PortFailure)));
    }

    #[test]
    fn established_snapshot_survives_writer_and_retry_gets_new_view() {
        use auth_foundation_authorization_ready_authority::ReadyStateFailure;
        use auth_foundation_authorization_ready_decision::authorize as authorize_ready_decision;
        use auth_foundation_authorization_state_model::BinaryAuthorizationDecision;

        let path = super::integration_tests::fixture();
        Connection::open(&path)
            .expect("writer")
            .execute_batch("PRAGMA journal_mode = WAL;")
            .expect("WAL");
        let mut connection = Connection::open_with_flags(
            &path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .expect("reader");
        schema::configure_runtime_connection(&connection).expect("read-only connection");
        let transaction = connection
            .transaction_with_behavior(TransactionBehavior::Deferred)
            .expect("transaction");
        transaction
            .query_row(
                "SELECT evidence_row_id FROM auth_authentication_evidence",
                [],
                |row| row.get::<_, i64>(0),
            )
            .expect("establish SQLite snapshot");
        Connection::open(&path)
            .expect("writer")
            .execute("UPDATE auth_sessions SET user_id = 'user-2'", [])
            .expect("concurrent update");
        let first = with_ready_in_transaction(
            &transaction,
            &request(),
            NonZeroU64::new(1).expect("epoch"),
            100,
            authorize_ready_decision,
        );
        transaction.rollback().expect("end snapshot");
        assert_eq!(
            first,
            AdmissionOutcome::Ready(BinaryAuthorizationDecision::Allow),
            "the active epoch must retain its established snapshot"
        );
        let mut service = SqliteAdmissionService::from_connection_with_clock_and_epoch_allocator(
            connection,
            FixedClock100,
            Arc::new(EpochAllocator::new()),
        )
        .expect("service");
        assert_eq!(
            service.with_ready(request(), authorize_ready_decision),
            Ok(AdmissionOutcome::ReadyStateFailed(
                ReadyStateFailure::StateJoin
            )),
            "a retry must observe the changed subject"
        );
        drop(service);
        super::integration_tests::remove_database(&path);
    }

    #[test]
    fn historical_migration_copies_match_current_schema_source() {
        assert_eq!(
            schema::SCHEMA_V2,
            include_str!("../../authorization-service/migrations/0002_auth_service_epoch.sql")
        );
        assert_eq!(
            include_str!("../../authorization-schema/migrations/0001_auth_state.sql"),
            include_str!("../../sqlite-provider/migrations/0001_auth_state.sql")
        );
        assert_eq!(
            include_str!("../../authorization-schema/migrations/0001_trusted_inputs.sql"),
            include_str!("../../trusted-input-provider/migrations/0001_trusted_inputs.sql")
        );
    }

    #[test]
    fn invalid_request_never_invokes_continuation() {
        let mut connection = Connection::open_in_memory().expect("connection");
        migrate_connection(&mut connection).expect("schema");
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        let outcome = service.with_ready(
            InboundAuthorizationRequest {
                request_id: String::new(),
                authentication_evidence_ref: "evidence".into(),
                route_id: "route".into(),
            },
            |_ready| panic!("invalid request entered READY continuation"),
        );
        assert!(matches!(outcome, Ok(AdmissionOutcome::Denied)));
    }

    #[test]
    fn ready_value_is_bound_to_request_epoch_and_live_transaction() {
        let connection = seeded_connection();
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        let first = service.with_ready(request(), |ready| {
            (
                ready.command().request_id.clone(),
                ready.evaluation_epoch_id(),
                ready.is_transaction_bound(),
            )
        });
        match first {
            Ok(AdmissionOutcome::Ready((request_id, epoch, transaction_bound))) => {
                assert_eq!(request_id, "request-1");
                assert_eq!(epoch, 1);
                assert!(transaction_bound);
            }
            _ => panic!("expected one exact READY value"),
        }
        let second = service.with_ready(request(), |ready| ready.evaluation_epoch_id());
        assert!(matches!(second, Ok(AdmissionOutcome::Ready(2))));
    }

    #[test]
    fn duplicate_qualifier_denies_without_entering_continuation() {
        let connection = seeded_connection();
        connection
            .execute_batch(
                "INSERT INTO auth_authentication_evidence
                (evidence_row_id,evidence_ref,session_id,trusted,revoked,expires_at,
                 evidence_revision,authenticated_subject_id)
             SELECT 2,evidence_ref,session_id,trusted,revoked,expires_at,
                    evidence_revision,authenticated_subject_id
             FROM auth_authentication_evidence WHERE evidence_row_id=1;",
            )
            .expect("duplicate");
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        let outcome = service.with_ready(request(), |_ready| -> () {
            panic!("gate DENY entered the READY continuation")
        });
        assert!(matches!(outcome, Ok(AdmissionOutcome::Denied)));
    }

    #[test]
    fn duplicate_route_qualifier_denies_without_entering_continuation() {
        let connection = seeded_connection();
        connection
            .execute_batch(
                "INSERT INTO auth_route_authorization_bindings
                (binding_row_id,route_id,resource,action,scope,scope_evidence_ref,
                 complete,enabled,binding_revision)
             SELECT 2,route_id,resource,action,scope,scope_evidence_ref,
                    complete,enabled,binding_revision
             FROM auth_route_authorization_bindings WHERE binding_row_id=1;",
            )
            .expect("duplicate route");
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        let outcome = service.with_ready(request(), |_ready| -> () {
            panic!("duplicate route DENY entered the READY continuation")
        });
        assert!(matches!(outcome, Ok(AdmissionOutcome::Denied)));
    }

    #[test]
    fn clock_failure_never_enters_continuation() {
        let connection = seeded_connection();
        let mut service = SqliteAdmissionService::from_connection_with_clock_and_epoch_allocator(
            connection,
            FailingClock,
            Arc::new(EpochAllocator::new()),
        )
        .expect("service");
        let outcome = service.with_ready(request(), |_ready| -> () {
            panic!("clock failure entered the READY continuation")
        });
        assert!(matches!(outcome, Err(PortFailure)));
        assert_eq!(
            service.epoch_allocator.allocate().map(NonZeroU64::get),
            Some(1)
        );
    }

    #[test]
    fn transaction_begin_failure_never_enters_continuation() {
        let connection = seeded_connection();
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        service
            .connection
            .execute_batch("BEGIN DEFERRED;")
            .expect("preexisting transaction");
        let outcome = service.with_ready(request(), |_ready| -> () {
            panic!("transaction failure entered the READY continuation")
        });
        assert!(matches!(outcome, Err(PortFailure)));
        service
            .connection
            .execute_batch("ROLLBACK;")
            .expect("cleanup");
    }

    #[test]
    fn post_ready_state_failure_never_enters_continuation() {
        let connection = seeded_connection();
        connection
            .execute_batch("DELETE FROM auth_sessions WHERE session_id = 'session-1';")
            .expect("remove downstream state");
        let mut service = SqliteAdmissionService::from_connection(connection).expect("service");
        let outcome = service.with_ready(request(), |_ready| -> () {
            panic!("state failure entered the READY continuation")
        });
        assert!(matches!(outcome, Ok(AdmissionOutcome::ReadyStateFailed(_))));
    }
}
