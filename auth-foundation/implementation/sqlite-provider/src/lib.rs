#![cfg(feature = "legacy-raw-decision")]
//! Historical SQLite raw-command decision facade. Decision exports require an
//! explicit `legacy-raw-decision` feature and are not part of the selected
//! public Auth request composition. Use admission-service for that path.

use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use auth_foundation_authorization_state_reader::{
    SqliteAuthorizationStateSnapshot as ReadOnlyStateSnapshot,
    resolve_authorization_state_in_transaction as read_state_in_transaction,
};
use auth_foundation_runtime_adapter::{
    AuthorizationAdapter, AuthorizationCommand, AuthorizationRevisionSource,
    BinaryAuthorizationDecision, DecisionClock, PortFailure, RoleResolution, RoleResolver,
    ScopeEvidenceVerifier, SessionRecord, SessionResolver, authorize_resolved,
};
use rusqlite::{Connection, Transaction, TransactionBehavior};

pub const SCHEMA_V1: &str =
    include_str!("../../authorization-schema/migrations/0001_auth_state.sql");
const SCHEMA_VERSION: i64 = 1;

#[derive(Clone, Copy, Debug, Default)]
pub struct SystemClock;

impl DecisionClock for SystemClock {
    fn decision_time(&self) -> Result<u64, PortFailure> {
        let duration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| PortFailure)?;
        Ok(duration.as_secs())
    }
}

pub struct SqliteAuthorizationService<C> {
    connection: Connection,
    clock: C,
}

impl<C> SqliteAuthorizationService<C>
where
    C: DecisionClock,
{
    pub fn open(path: impl AsRef<Path>, clock: C) -> Result<Self, PortFailure> {
        let connection = Connection::open(path).map_err(|_| PortFailure)?;
        Self::from_connection(connection, clock)
    }

    pub fn open_in_memory(clock: C) -> Result<Self, PortFailure> {
        let connection = Connection::open_in_memory().map_err(|_| PortFailure)?;
        Self::from_connection(connection, clock)
    }

    pub fn from_connection(connection: Connection, clock: C) -> Result<Self, PortFailure> {
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .map_err(|_| PortFailure)?;
        let current_version = schema_version(&connection)?;
        if current_version > SCHEMA_VERSION {
            return Err(PortFailure);
        }
        connection
            .execute_batch(SCHEMA_V1)
            .map_err(|_| PortFailure)?;
        if schema_version(&connection)? != SCHEMA_VERSION {
            return Err(PortFailure);
        }
        Ok(Self { connection, clock })
    }

    pub fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        let transaction = match self
            .connection
            .transaction_with_behavior(TransactionBehavior::Deferred)
        {
            Ok(transaction) => transaction,
            Err(_) => return authorize_with_failed_ports(&self.clock, command),
        };
        let decision = authorize_in_transaction(
            &transaction,
            command,
            match self.clock.decision_time() {
                Ok(value) => value,
                Err(_) => return BinaryAuthorizationDecision::Deny,
            },
        );

        match transaction.commit() {
            Ok(()) => decision,
            Err(_) => BinaryAuthorizationDecision::Deny,
        }
    }
}

/// Legacy direct decision entrypoint. It remains decision-capable and is not
/// part of the read-only preparation dependency boundary.
pub fn authorize_in_transaction(
    transaction: &Transaction<'_>,
    command: AuthorizationCommand,
    decision_time: u64,
) -> BinaryAuthorizationDecision {
    match resolve_authorization_state_in_transaction(transaction, &command) {
        Ok(snapshot) => snapshot.authorize(command, decision_time),
        Err(_) => BinaryAuthorizationDecision::Deny,
    }
}

/// Compatibility wrapper for callers that explicitly use the legacy
/// decision-capable provider. The reader's snapshot has no authorize method.
pub struct SqliteAuthorizationStateSnapshot<'transaction> {
    state: ReadOnlyStateSnapshot<'transaction>,
}

impl SqliteAuthorizationStateSnapshot<'_> {
    pub fn sessions(&self) -> &[SessionRecord] {
        self.state.sessions()
    }

    pub fn current_authorization_revision(&self) -> u64 {
        self.state.current_authorization_revision()
    }

    pub fn trusted_scope_evidence(&self) -> bool {
        self.state.trusted_scope_evidence()
    }

    pub fn is_complete(&self) -> bool {
        self.state.is_complete()
    }

    pub fn authorize(
        self,
        command: AuthorizationCommand,
        decision_time: u64,
    ) -> BinaryAuthorizationDecision {
        authorize_resolved(command, decision_time, self.state.into_state())
    }
}

pub fn resolve_authorization_state_in_transaction<'transaction>(
    transaction: &'transaction Transaction<'_>,
    command: &AuthorizationCommand,
) -> Result<SqliteAuthorizationStateSnapshot<'transaction>, PortFailure> {
    read_state_in_transaction(transaction, command)
        .map(|state| SqliteAuthorizationStateSnapshot { state })
}

fn schema_version(connection: &Connection) -> Result<i64, PortFailure> {
    connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|_| PortFailure)
}

struct ClockRef<'a, C>(&'a C);

impl<C> DecisionClock for ClockRef<'_, C>
where
    C: DecisionClock,
{
    fn decision_time(&self) -> Result<u64, PortFailure> {
        self.0.decision_time()
    }
}

struct FailedPorts;

impl SessionResolver for FailedPorts {
    fn resolve_sessions(&self, _session_id: &str) -> Result<Vec<SessionRecord>, PortFailure> {
        Err(PortFailure)
    }
}

impl RoleResolver for FailedPorts {
    fn resolve_active_roles(
        &self,
        _session: &SessionRecord,
    ) -> Result<RoleResolution, PortFailure> {
        Err(PortFailure)
    }
}

impl ScopeEvidenceVerifier for FailedPorts {
    fn verify_scope_evidence(&self, _command: &AuthorizationCommand) -> Result<bool, PortFailure> {
        Err(PortFailure)
    }
}

impl AuthorizationRevisionSource for FailedPorts {
    fn current_authorization_revision(&self, _session_id: &str) -> Result<u64, PortFailure> {
        Err(PortFailure)
    }
}

fn authorize_with_failed_ports<C>(
    clock: &C,
    command: AuthorizationCommand,
) -> BinaryAuthorizationDecision
where
    C: DecisionClock,
{
    AuthorizationAdapter::new(
        FailedPorts,
        FailedPorts,
        FailedPorts,
        FailedPorts,
        ClockRef(clock),
    )
    .authorize(command)
}
