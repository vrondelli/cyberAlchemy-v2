//! In-process Auth service composition with one transaction-scoped SQLite evaluation epoch.

use std::marker::PhantomData;
use std::num::NonZeroU64;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};

use auth_foundation_runtime_adapter::{
    AuthorizationCommand, BinaryAuthorizationDecision, DecisionClock, Permission, PortFailure,
};
use auth_foundation_sqlite_provider::{
    SCHEMA_V1 as AUTHORIZATION_SCHEMA_V1, SqliteAuthorizationStateSnapshot,
    resolve_authorization_state_in_transaction,
};
use auth_foundation_trusted_boundary::{
    AuthenticatedSessionEvidence, AuthenticationEvidenceResolver, AuthorizationDecisionService,
    InboundAuthorizationRequest, RouteAuthorizationBinding, RouteAuthorizationBindingResolver,
    TrustedAuthorizationBoundary,
};
use auth_foundation_trusted_input_provider::{
    SCHEMA_V1 as TRUSTED_INPUT_SCHEMA_V1, TrustedInputResolution, resolve_in_transaction,
};
use rusqlite::{Connection, OpenFlags, OptionalExtension, Transaction, TransactionBehavior};

pub const SCHEMA_V2: &str = include_str!("../migrations/0002_auth_service_epoch.sql");
pub const MAX_REQUEST_ID_BYTES: usize = 256;
pub const MAX_REFERENCE_BYTES: usize = 256;
pub const MAX_PERMISSION_COMPONENT_BYTES: usize = 256;
const SCHEMA_VERSION: i64 = 2;

/// Correlation and transaction capability for one call to `authorize`.
pub struct AuthorizationEvaluationEpoch<'connection> {
    evaluation_epoch_id: NonZeroU64,
    decision_time: u64,
    transaction: Transaction<'connection>,
}

impl AuthorizationEvaluationEpoch<'_> {
    pub fn evaluation_epoch_id(&self) -> u64 {
        self.evaluation_epoch_id.get()
    }

    pub fn decision_time(&self) -> u64 {
        self.decision_time
    }

    fn transaction(&self) -> &Transaction<'_> {
        &self.transaction
    }

    fn finish(self) -> Result<(), PortFailure> {
        self.transaction.rollback().map_err(|_| PortFailure)
    }
}

/// Exact trusted-input result tied to the epoch borrow that created it.
pub struct ExactTrustedInputSnapshot<'epoch> {
    evaluation_epoch_id: NonZeroU64,
    decision_time: u64,
    authentication_evidence_ref: String,
    authentication_evidence_revision: u64,
    authenticated_subject_id: String,
    session_id: String,
    authentication_expires_at: u64,
    route_id: String,
    route_binding_revision: u64,
    required_permission: Permission,
    scope_evidence_ref: String,
    _epoch: PhantomData<&'epoch ()>,
}

impl ExactTrustedInputSnapshot<'_> {
    pub fn evaluation_epoch_id(&self) -> u64 {
        self.evaluation_epoch_id.get()
    }

    pub fn decision_time(&self) -> u64 {
        self.decision_time
    }

    pub fn authentication_evidence_revision(&self) -> u64 {
        self.authentication_evidence_revision
    }

    pub fn route_binding_revision(&self) -> u64 {
        self.route_binding_revision
    }
}

/// Server-constructed command tied to the epoch borrow that created it.
pub struct ExactTrustedAuthorizationCommand<'epoch> {
    evaluation_epoch_id: NonZeroU64,
    decision_time: u64,
    session_id: String,
    authenticated_subject_id: String,
    required_permission: Permission,
    scope_evidence_ref: String,
    authentication_evidence_revision: u64,
    route_binding_revision: u64,
    _epoch: PhantomData<&'epoch ()>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum AuthorizationDiagnostic {
    Allowed,
    InvalidInboundRequest,
    ClockFailure,
    EpochExhausted,
    TransactionBeginFailure,
    TransactionNotReadOnly,
    TrustedInputProviderFailure,
    TrustedInputDenied,
    TrustedInputAmbiguous,
    TrustedInputInvalid,
    MetadataFailure,
    AuthorizationStateFailure,
    AuthorizationStateJoinFailure,
    PolicyDenied,
    TransactionEndFailure,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
struct AuthorizationOutcome {
    decision: BinaryAuthorizationDecision,
    diagnostic: AuthorizationDiagnostic,
}

impl AuthorizationOutcome {
    fn allow() -> Self {
        Self {
            decision: BinaryAuthorizationDecision::Allow,
            diagnostic: AuthorizationDiagnostic::Allowed,
        }
    }

    fn deny(diagnostic: AuthorizationDiagnostic) -> Self {
        Self {
            decision: BinaryAuthorizationDecision::Deny,
            diagnostic,
        }
    }
}

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

    #[cfg(test)]
    fn with_next(next: u64) -> Self {
        Self {
            next: AtomicU64::new(next),
        }
    }
}

impl Default for EpochAllocator {
    fn default() -> Self {
        Self::new()
    }
}

pub struct SqliteAuthService<C: DecisionClock> {
    connection: Connection,
    clock: C,
    epoch_allocator: Arc<EpochAllocator>,
}

impl<C: DecisionClock> SqliteAuthService<C> {
    /// Open an existing migrated database. This never creates or migrates schema.
    pub fn open(path: impl AsRef<Path>, clock: C) -> Result<Self, PortFailure> {
        Self::open_with_epoch_allocator(path, clock, Arc::new(EpochAllocator::new()))
    }

    /// Open one independent read-only connection sharing a process-wide epoch allocator.
    pub fn open_with_epoch_allocator(
        path: impl AsRef<Path>,
        clock: C,
        epoch_allocator: Arc<EpochAllocator>,
    ) -> Result<Self, PortFailure> {
        let connection = Connection::open_with_flags(
            path,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX,
        )
        .map_err(|_| PortFailure)?;
        Self::from_connection_with_epoch_allocator(connection, clock, epoch_allocator)
    }

    /// Construct an explicitly ephemeral database for tests or local probes.
    pub fn open_in_memory(clock: C) -> Result<Self, PortFailure> {
        let mut connection = Connection::open_in_memory().map_err(|_| PortFailure)?;
        migrate_connection(&mut connection)?;
        Self::from_connection(connection, clock)
    }

    /// Adopt an existing connection only when its schema is already current.
    pub fn from_connection(connection: Connection, clock: C) -> Result<Self, PortFailure> {
        Self::from_connection_with_epoch_allocator(
            connection,
            clock,
            Arc::new(EpochAllocator::new()),
        )
    }

    pub fn from_connection_with_epoch_allocator(
        connection: Connection,
        clock: C,
        epoch_allocator: Arc<EpochAllocator>,
    ) -> Result<Self, PortFailure> {
        validate_schema(&connection)?;
        configure_runtime_connection(&connection)?;
        Ok(Self {
            connection,
            clock,
            epoch_allocator,
        })
    }

    pub fn authorize(
        &mut self,
        request: InboundAuthorizationRequest,
    ) -> BinaryAuthorizationDecision {
        self.authorize_detailed_with_hook(request, |_| {}).decision
    }

    fn authorize_detailed_with_hook<F>(
        &mut self,
        request: InboundAuthorizationRequest,
        after_trusted_input: F,
    ) -> AuthorizationOutcome
    where
        F: FnOnce(&Transaction<'_>),
    {
        if !valid_inbound_request(&request) {
            return AuthorizationOutcome::deny(AuthorizationDiagnostic::InvalidInboundRequest);
        }
        let decision_time = match self.clock.decision_time() {
            Ok(value) => value,
            Err(_) => return AuthorizationOutcome::deny(AuthorizationDiagnostic::ClockFailure),
        };
        let evaluation_epoch_id = match self.epoch_allocator.allocate() {
            Some(value) => value,
            None => return AuthorizationOutcome::deny(AuthorizationDiagnostic::EpochExhausted),
        };
        let transaction = match self
            .connection
            .transaction_with_behavior(TransactionBehavior::Deferred)
        {
            Ok(value) => value,
            Err(_) => {
                return AuthorizationOutcome::deny(
                    AuthorizationDiagnostic::TransactionBeginFailure,
                );
            }
        };
        let query_only = transaction
            .query_row("PRAGMA query_only", [], |row| row.get::<_, i64>(0))
            .unwrap_or(0);
        if query_only != 1 {
            let _ = transaction.rollback();
            return AuthorizationOutcome::deny(AuthorizationDiagnostic::TransactionNotReadOnly);
        }
        let epoch = AuthorizationEvaluationEpoch {
            evaluation_epoch_id,
            decision_time,
            transaction,
        };
        let mut outcome = authorize_in_epoch(&epoch, request, after_trusted_input);
        if epoch.finish().is_err() {
            outcome = AuthorizationOutcome::deny(AuthorizationDiagnostic::TransactionEndFailure);
        }
        outcome
    }
}

/// Explicit schema operation. Normal authorization startup never invokes it.
pub fn migrate_database(path: impl AsRef<Path>) -> Result<(), PortFailure> {
    let mut connection = Connection::open(path).map_err(|_| PortFailure)?;
    migrate_connection(&mut connection)
}

pub fn migrate_connection(connection: &mut Connection) -> Result<(), PortFailure> {
    connection
        .execute_batch("PRAGMA query_only = OFF; PRAGMA foreign_keys = ON;")
        .map_err(|_| PortFailure)?;
    let version = schema_version(connection)?;
    if version > SCHEMA_VERSION {
        return Err(PortFailure);
    }
    if version == SCHEMA_VERSION {
        return validate_schema(connection);
    }

    let transaction = connection
        .transaction_with_behavior(TransactionBehavior::Immediate)
        .map_err(|_| PortFailure)?;
    if version == 0 {
        transaction
            .execute_batch(SCHEMA_V2)
            .map_err(|_| PortFailure)?;
    } else {
        transaction
            .execute_batch(AUTHORIZATION_SCHEMA_V1)
            .map_err(|_| PortFailure)?;
        transaction
            .execute_batch(TRUSTED_INPUT_SCHEMA_V1)
            .map_err(|_| PortFailure)?;
        apply_v1_to_v2(&transaction)?;
    }
    transaction.commit().map_err(|_| PortFailure)?;
    validate_schema(connection)
}

fn authorize_in_epoch<F>(
    epoch: &AuthorizationEvaluationEpoch<'_>,
    request: InboundAuthorizationRequest,
    after_trusted_input: F,
) -> AuthorizationOutcome
where
    F: FnOnce(&Transaction<'_>),
{
    let (query, resolution) = match resolve_in_transaction(
        epoch.transaction(),
        &request.authentication_evidence_ref,
        &request.route_id,
        epoch.decision_time,
    ) {
        Ok(value) => value,
        Err(_) => {
            return AuthorizationOutcome::deny(
                AuthorizationDiagnostic::TrustedInputProviderFailure,
            );
        }
    };
    let snapshot = match resolution {
        TrustedInputResolution::Resolved(value) => value,
        TrustedInputResolution::Deny => {
            return AuthorizationOutcome::deny(AuthorizationDiagnostic::TrustedInputDenied);
        }
    };
    if query.decision_time != epoch.decision_time
        || snapshot.authentication_evidence.len() != 1
        || snapshot.route_bindings.len() != 1
    {
        return AuthorizationOutcome::deny(AuthorizationDiagnostic::TrustedInputAmbiguous);
    }

    let evidence = &snapshot.authentication_evidence[0];
    let binding = &snapshot.route_bindings[0];
    if evidence.evidence_ref != request.authentication_evidence_ref
        || !valid_reference(&evidence.evidence_ref)
        || !valid_reference(&evidence.session_id)
        || !evidence.trusted
        || evidence.revoked
        || epoch.decision_time >= evidence.expires_at
        || binding.route_id != request.route_id
        || !valid_reference(&binding.route_id)
        || !valid_permission_component(&binding.resource)
        || !valid_permission_component(&binding.action)
        || !valid_permission_component(&binding.scope)
        || !valid_reference(&binding.scope_evidence_ref)
        || !binding.complete
        || !binding.enabled
    {
        return AuthorizationOutcome::deny(AuthorizationDiagnostic::TrustedInputInvalid);
    }

    let (evidence_revision, subject_id) =
        match authentication_metadata(epoch.transaction(), evidence.evidence_identity) {
            Some(value) => value,
            None => return AuthorizationOutcome::deny(AuthorizationDiagnostic::MetadataFailure),
        };
    let route_binding_revision = match route_revision(epoch.transaction(), binding.binding_identity)
    {
        Some(value) => value,
        None => return AuthorizationOutcome::deny(AuthorizationDiagnostic::MetadataFailure),
    };
    if !valid_reference(&subject_id) {
        return AuthorizationOutcome::deny(AuthorizationDiagnostic::MetadataFailure);
    }

    let exact_snapshot = ExactTrustedInputSnapshot {
        evaluation_epoch_id: epoch.evaluation_epoch_id,
        decision_time: epoch.decision_time,
        authentication_evidence_ref: evidence.evidence_ref.clone(),
        authentication_evidence_revision: evidence_revision,
        authenticated_subject_id: subject_id,
        session_id: evidence.session_id.clone(),
        authentication_expires_at: evidence.expires_at,
        route_id: binding.route_id.clone(),
        route_binding_revision,
        required_permission: Permission {
            resource: binding.resource.clone(),
            action: binding.action.clone(),
            scope: binding.scope.clone(),
        },
        scope_evidence_ref: binding.scope_evidence_ref.clone(),
        _epoch: PhantomData,
    };
    let command = command_from_snapshot(&exact_snapshot);
    if !command_matches_snapshot(epoch, &exact_snapshot, &command) {
        return AuthorizationOutcome::deny(AuthorizationDiagnostic::TrustedInputInvalid);
    }

    after_trusted_input(epoch.transaction());

    let kernel_command = AuthorizationCommand {
        request_id: request.request_id.clone(),
        session_id: command.session_id.clone(),
        required_permission: command.required_permission.clone(),
        scope_evidence_ref: command.scope_evidence_ref.clone(),
    };
    let authorization_state =
        match resolve_authorization_state_in_transaction(epoch.transaction(), &kernel_command) {
            Ok(value) => value,
            Err(_) => {
                return AuthorizationOutcome::deny(
                    AuthorizationDiagnostic::AuthorizationStateFailure,
                );
            }
        };
    if !authorization_state_joins_hold(epoch, &command, &authorization_state) {
        return AuthorizationOutcome::deny(AuthorizationDiagnostic::AuthorizationStateJoinFailure);
    }

    let authentication = ResolvedAuthenticationEvidence(vec![AuthenticatedSessionEvidence {
        evidence_ref: exact_snapshot.authentication_evidence_ref,
        session_id: exact_snapshot.session_id,
        trusted: true,
    }]);
    let routes = ResolvedRouteBindings(vec![RouteAuthorizationBinding {
        route_id: exact_snapshot.route_id,
        required_permission: command.required_permission.clone(),
        scope_evidence_ref: command.scope_evidence_ref.clone(),
        complete: true,
    }]);
    let expected_request_id = request.request_id.clone();
    let decision = TrustedAuthorizationBoundary::new(
        authentication,
        routes,
        ResolvedDecisionService {
            expected_request_id,
            expected: &command,
            state: Some(authorization_state),
        },
    )
    .authorize(request);

    match decision {
        BinaryAuthorizationDecision::Allow => AuthorizationOutcome::allow(),
        BinaryAuthorizationDecision::Deny => {
            AuthorizationOutcome::deny(AuthorizationDiagnostic::PolicyDenied)
        }
    }
}

fn command_from_snapshot<'epoch>(
    snapshot: &ExactTrustedInputSnapshot<'epoch>,
) -> ExactTrustedAuthorizationCommand<'epoch> {
    ExactTrustedAuthorizationCommand {
        evaluation_epoch_id: snapshot.evaluation_epoch_id,
        decision_time: snapshot.decision_time,
        session_id: snapshot.session_id.clone(),
        authenticated_subject_id: snapshot.authenticated_subject_id.clone(),
        required_permission: snapshot.required_permission.clone(),
        scope_evidence_ref: snapshot.scope_evidence_ref.clone(),
        authentication_evidence_revision: snapshot.authentication_evidence_revision,
        route_binding_revision: snapshot.route_binding_revision,
        _epoch: PhantomData,
    }
}

fn command_matches_snapshot(
    epoch: &AuthorizationEvaluationEpoch<'_>,
    snapshot: &ExactTrustedInputSnapshot<'_>,
    command: &ExactTrustedAuthorizationCommand<'_>,
) -> bool {
    command.evaluation_epoch_id == epoch.evaluation_epoch_id
        && command.evaluation_epoch_id == snapshot.evaluation_epoch_id
        && command.decision_time == epoch.decision_time
        && command.decision_time == snapshot.decision_time
        && command.session_id == snapshot.session_id
        && command.authenticated_subject_id == snapshot.authenticated_subject_id
        && command.required_permission == snapshot.required_permission
        && command.scope_evidence_ref == snapshot.scope_evidence_ref
        && command.authentication_evidence_revision == snapshot.authentication_evidence_revision
        && command.route_binding_revision == snapshot.route_binding_revision
        && command.decision_time < snapshot.authentication_expires_at
}

fn authorization_state_joins_hold(
    epoch: &AuthorizationEvaluationEpoch<'_>,
    command: &ExactTrustedAuthorizationCommand<'_>,
    state: &SqliteAuthorizationStateSnapshot<'_>,
) -> bool {
    if command.evaluation_epoch_id != epoch.evaluation_epoch_id
        || command.decision_time != epoch.decision_time
        || !state.is_complete()
        || !state.trusted_scope_evidence()
    {
        return false;
    }
    let [session] = state.sessions() else {
        return false;
    };
    session.session_id == command.session_id
        && session.user_id == command.authenticated_subject_id
        && session.authorization_revision == state.current_authorization_revision()
}

fn authentication_metadata(transaction: &Transaction<'_>, row_id: u64) -> Option<(u64, String)> {
    let row_id = i64::try_from(row_id).ok()?;
    let rows = transaction
        .prepare(
            "SELECT evidence_revision, authenticated_subject_id
             FROM auth_authentication_evidence
             WHERE evidence_row_id = ?1
             LIMIT 2",
        )
        .ok()?
        .query_map([row_id], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })
        .ok()?
        .collect::<Result<Vec<_>, _>>()
        .ok()?;
    match rows.as_slice() {
        [(revision, subject)] if *revision >= 0 && !subject.is_empty() => {
            Some((*revision as u64, subject.clone()))
        }
        _ => None,
    }
}

fn route_revision(transaction: &Transaction<'_>, row_id: u64) -> Option<u64> {
    let value = transaction
        .query_row(
            "SELECT binding_revision
             FROM auth_route_authorization_bindings
             WHERE binding_row_id = ?1",
            [i64::try_from(row_id).ok()?],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .ok()??;
    value.try_into().ok()
}

fn valid_inbound_request(request: &InboundAuthorizationRequest) -> bool {
    valid_identifier(&request.request_id, MAX_REQUEST_ID_BYTES)
        && valid_reference(&request.authentication_evidence_ref)
        && valid_reference(&request.route_id)
}

fn valid_reference(value: &str) -> bool {
    valid_identifier(value, MAX_REFERENCE_BYTES)
}

fn valid_permission_component(value: &str) -> bool {
    valid_identifier(value, MAX_PERMISSION_COMPONENT_BYTES)
}

fn valid_identifier(value: &str, maximum: usize) -> bool {
    !value.is_empty() && value.len() <= maximum && !value.chars().any(char::is_control)
}

fn configure_runtime_connection(connection: &Connection) -> Result<(), PortFailure> {
    connection
        .execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA trusted_schema = OFF;
             PRAGMA query_only = ON;",
        )
        .map_err(|_| PortFailure)?;
    let query_only = connection
        .query_row("PRAGMA query_only", [], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?;
    let foreign_keys = connection
        .query_row("PRAGMA foreign_keys", [], |row| row.get::<_, i64>(0))
        .map_err(|_| PortFailure)?;
    if query_only == 1 && foreign_keys == 1 {
        Ok(())
    } else {
        Err(PortFailure)
    }
}

fn schema_version(connection: &Connection) -> Result<i64, PortFailure> {
    connection
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .map_err(|_| PortFailure)
}

fn validate_schema(connection: &Connection) -> Result<(), PortFailure> {
    if schema_version(connection)? != SCHEMA_VERSION {
        return Err(PortFailure);
    }
    for (table_info_sql, columns) in required_schema() {
        for column in columns {
            if !has_column(connection, table_info_sql, column)? {
                return Err(PortFailure);
            }
        }
    }
    Ok(())
}

fn apply_v1_to_v2(transaction: &Transaction<'_>) -> Result<(), PortFailure> {
    for (table_info_sql, column, add_column_sql) in [
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            "evidence_revision",
            "ALTER TABLE auth_authentication_evidence ADD COLUMN evidence_revision INTEGER NOT NULL DEFAULT 0 CHECK (evidence_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            "authenticated_subject_id",
            "ALTER TABLE auth_authentication_evidence ADD COLUMN authenticated_subject_id TEXT NOT NULL DEFAULT '';",
        ),
        (
            "PRAGMA table_info(auth_route_authorization_bindings)",
            "binding_revision",
            "ALTER TABLE auth_route_authorization_bindings ADD COLUMN binding_revision INTEGER NOT NULL DEFAULT 0 CHECK (binding_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_session_active_roles)",
            "authorization_revision",
            "ALTER TABLE auth_session_active_roles ADD COLUMN authorization_revision INTEGER NOT NULL DEFAULT 0 CHECK (authorization_revision >= 0);",
        ),
        (
            "PRAGMA table_info(auth_role_permissions)",
            "authorization_revision",
            "ALTER TABLE auth_role_permissions ADD COLUMN authorization_revision INTEGER NOT NULL DEFAULT 0 CHECK (authorization_revision >= 0);",
        ),
    ] {
        if !has_column(transaction, table_info_sql, column)? {
            transaction
                .execute_batch(add_column_sql)
                .map_err(|_| PortFailure)?;
        }
    }
    transaction
        .execute_batch("PRAGMA user_version = 2;")
        .map_err(|_| PortFailure)
}

fn required_schema() -> [(&'static str, &'static [&'static str]); 8] {
    [
        (
            "PRAGMA table_info(auth_authentication_evidence)",
            &[
                "evidence_row_id",
                "evidence_ref",
                "session_id",
                "trusted",
                "revoked",
                "expires_at",
                "evidence_revision",
                "authenticated_subject_id",
            ],
        ),
        (
            "PRAGMA table_info(auth_route_authorization_bindings)",
            &[
                "binding_row_id",
                "route_id",
                "resource",
                "action",
                "scope",
                "scope_evidence_ref",
                "complete",
                "enabled",
                "binding_revision",
            ],
        ),
        (
            "PRAGMA table_info(auth_sessions)",
            &[
                "session_row_id",
                "session_id",
                "user_id",
                "status",
                "authorization_revision",
                "expires_at",
            ],
        ),
        ("PRAGMA table_info(auth_roles)", &["role_id"]),
        (
            "PRAGMA table_info(auth_session_active_roles)",
            &["session_row_id", "role_id", "authorization_revision"],
        ),
        (
            "PRAGMA table_info(auth_role_permissions)",
            &[
                "role_id",
                "resource",
                "action",
                "scope",
                "authorization_revision",
            ],
        ),
        (
            "PRAGMA table_info(auth_authorization_revisions)",
            &["session_id", "revision"],
        ),
        (
            "PRAGMA table_info(auth_scope_evidence)",
            &["evidence_ref", "resource", "action", "scope", "trusted"],
        ),
    ]
}

fn has_column(
    connection: &Connection,
    table_info_sql: &str,
    column: &str,
) -> Result<bool, PortFailure> {
    let mut statement = connection
        .prepare(table_info_sql)
        .map_err(|_| PortFailure)?;
    let names = statement
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|_| PortFailure)?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| PortFailure)?;
    Ok(names.iter().any(|name| name == column))
}

struct ResolvedAuthenticationEvidence(Vec<AuthenticatedSessionEvidence>);

impl AuthenticationEvidenceResolver for ResolvedAuthenticationEvidence {
    fn resolve_authentication_evidence(
        &self,
        _: &str,
    ) -> Result<Vec<AuthenticatedSessionEvidence>, PortFailure> {
        Ok(self.0.clone())
    }
}

struct ResolvedRouteBindings(Vec<RouteAuthorizationBinding>);

impl RouteAuthorizationBindingResolver for ResolvedRouteBindings {
    fn resolve_route_authorization_bindings(
        &self,
        _: &str,
    ) -> Result<Vec<RouteAuthorizationBinding>, PortFailure> {
        Ok(self.0.clone())
    }
}

struct ResolvedDecisionService<'command, 'transaction> {
    expected_request_id: String,
    expected: &'command ExactTrustedAuthorizationCommand<'transaction>,
    state: Option<SqliteAuthorizationStateSnapshot<'transaction>>,
}

impl AuthorizationDecisionService for ResolvedDecisionService<'_, '_> {
    fn authorize(&mut self, command: AuthorizationCommand) -> BinaryAuthorizationDecision {
        if command.request_id != self.expected_request_id
            || command.session_id != self.expected.session_id
            || command.required_permission != self.expected.required_permission
            || command.scope_evidence_ref != self.expected.scope_evidence_ref
        {
            return BinaryAuthorizationDecision::Deny;
        }
        match self.state.take() {
            Some(state) => state.authorize(command, self.expected.decision_time),
            None => BinaryAuthorizationDecision::Deny,
        }
    }
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::*;

    #[derive(Clone, Copy)]
    struct FixedClock(u64);

    impl DecisionClock for FixedClock {
        fn decision_time(&self) -> Result<u64, PortFailure> {
            Ok(self.0)
        }
    }

    fn request() -> InboundAuthorizationRequest {
        InboundAuthorizationRequest {
            request_id: "request-1".into(),
            authentication_evidence_ref: "auth-1".into(),
            route_id: "documents.read".into(),
        }
    }

    fn unique_database_path() -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time")
            .as_nanos();
        std::env::temp_dir().join(format!(
            "auth-service-unit-{}-{nonce}.sqlite",
            std::process::id()
        ))
    }

    fn seed(path: &Path) {
        migrate_database(path).expect("migrate");
        let connection = Connection::open(path).expect("open seed connection");
        connection
            .execute_batch(
                "PRAGMA journal_mode = WAL;
                 INSERT INTO auth_authentication_evidence
                     (evidence_row_id, evidence_ref, session_id, trusted, revoked, expires_at,
                      evidence_revision, authenticated_subject_id)
                 VALUES (1, 'auth-1', 'session-1', 1, 0, 101, 3, 'user-1');
                 INSERT INTO auth_route_authorization_bindings
                     (binding_row_id, route_id, resource, action, scope, scope_evidence_ref,
                      complete, enabled, binding_revision)
                 VALUES (1, 'documents.read', 'documents', 'read', 'tenant-7', 'scope-1', 1, 1, 5);
                 INSERT INTO auth_roles (role_id) VALUES ('reader');
                 INSERT INTO auth_role_permissions
                     (role_id, resource, action, scope, authorization_revision)
                 VALUES ('reader', 'documents', 'read', 'tenant-7', 7);
                 INSERT INTO auth_sessions
                     (session_row_id, session_id, user_id, status, authorization_revision, expires_at)
                 VALUES (1, 'session-1', 'user-1', 'active', 7, 101);
                 INSERT INTO auth_session_active_roles
                     (session_row_id, role_id, authorization_revision)
                 VALUES (1, 'reader', 7);
                 INSERT INTO auth_authorization_revisions (session_id, revision)
                 VALUES ('session-1', 7);
                 INSERT INTO auth_scope_evidence (evidence_ref, resource, action, scope, trusted)
                 VALUES ('scope-1', 'documents', 'read', 'tenant-7', 1);",
            )
            .expect("seed");
    }

    #[test]
    fn epoch_allocator_never_reuses_the_terminal_identifier() {
        let allocator = EpochAllocator::with_next(u64::MAX);
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
                    .map(|_| allocator.allocate().expect("identifier").get())
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
    fn invalid_input_has_an_internal_category_but_public_deny() {
        let mut service = SqliteAuthService::open_in_memory(FixedClock(100)).expect("service");
        let mut invalid = request();
        invalid.route_id.clear();
        let outcome = service.authorize_detailed_with_hook(invalid, |_| {});
        assert_eq!(outcome.decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(
            outcome.diagnostic,
            AuthorizationDiagnostic::InvalidInboundRequest
        );
    }

    #[test]
    fn one_sqlite_snapshot_survives_a_concurrent_writer_and_retry_gets_a_new_view() {
        let path = unique_database_path();
        seed(&path);
        let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
        let writer_path = path.clone();
        let first = service.authorize_detailed_with_hook(request(), move |_| {
            Connection::open(writer_path)
                .expect("writer")
                .execute("UPDATE auth_sessions SET user_id = 'user-2'", [])
                .expect("concurrent update");
        });
        assert_eq!(
            first.decision,
            BinaryAuthorizationDecision::Allow,
            "AUTH_EPOCH_SNAPSHOT_SPLIT"
        );
        assert_eq!(
            service.authorize(request()),
            BinaryAuthorizationDecision::Deny,
            "a retry must create a new transaction and observe the changed subject"
        );
        std::fs::remove_file(&path).expect("remove database");
        let _ = std::fs::remove_file(path.with_extension("sqlite-wal"));
        let _ = std::fs::remove_file(path.with_extension("sqlite-shm"));
    }

    #[test]
    fn transaction_begin_and_end_failures_deny() {
        let path = unique_database_path();
        seed(&path);
        let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
        service
            .connection
            .execute_batch("BEGIN DEFERRED;")
            .expect("existing transaction");
        let begin = service.authorize_detailed_with_hook(request(), |_| {});
        assert_eq!(begin.decision, BinaryAuthorizationDecision::Deny);
        assert_eq!(
            begin.diagnostic,
            AuthorizationDiagnostic::TransactionBeginFailure
        );
        service
            .connection
            .execute_batch("ROLLBACK;")
            .expect("end existing transaction");
        let end = service.authorize_detailed_with_hook(request(), |transaction| {
            transaction
                .execute_batch("ROLLBACK;")
                .expect("simulate lost transaction");
        });
        assert_eq!(
            end.decision,
            BinaryAuthorizationDecision::Deny,
            "AUTH_ROLLBACK_FAILURE_ALLOWED"
        );
        assert_eq!(
            end.diagnostic,
            AuthorizationDiagnostic::TransactionEndFailure
        );
        drop(service);
        std::fs::remove_file(path).expect("remove database");
    }

    #[test]
    fn database_rejects_writes_inside_the_authorization_epoch() {
        let path = unique_database_path();
        seed(&path);
        let mut service = SqliteAuthService::open(&path, FixedClock(100)).expect("service");
        let outcome = service.authorize_detailed_with_hook(request(), |transaction| {
            let error = transaction
                .execute("DELETE FROM auth_sessions", [])
                .expect_err("AUTH_EPOCH_WRITE_ALLOWED");
            assert_eq!(
                error.sqlite_error_code(),
                Some(rusqlite::ErrorCode::ReadOnly)
            );
            assert!(!transaction.is_autocommit());
        });
        assert_eq!(outcome.decision, BinaryAuthorizationDecision::Allow);
        drop(service);
        std::fs::remove_file(path).expect("remove database");
    }
}
