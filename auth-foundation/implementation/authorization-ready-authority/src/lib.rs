//! Transaction-bound issuer of the exact command admitted by the v2 Auth gate.
//!
//! The only public issuer reads the caller's actual SQLite transaction. It does
//! not accept resolver lists, an admission context, or a candidate from callers.
//! No authorization-policy decision entrypoint is a dependency of this crate.

use std::num::NonZeroU64;

use auth_foundation_authorization_metadata_reader::{authentication_metadata, route_revision};
use auth_foundation_authorization_state_model::{
    AuthorizationCommand, InboundAuthorizationRequest, Permission, ResolvedAuthorizationState,
};
use auth_foundation_authorization_state_reader::resolve_authorization_state_in_transaction;
use auth_foundation_command_boundary_v2_auth_command_boundary_admit_authorization_command as gate;
use auth_foundation_trusted_input_reader::{TrustedInputResolution, resolve_in_transaction};
use rusqlite::Transaction;

/// A gate DENY is not a read/metadata error or a post-READY state failure.
#[derive(Debug, PartialEq, Eq)]
pub enum AdmissionOutcome<T> {
    Denied,
    PreparationFailed(PreparationFailure),
    ReadyStateFailed(ReadyStateFailure),
    Ready(T),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PreparationFailure {
    TrustedInputRead,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ReadyStateFailure {
    MetadataRead,
    StateRead,
    StateJoin,
}

/// Private-constructor, non-copy authority over one admitted command and its
/// state, tied to the same transaction borrow as the selected request.
///
/// ```compile_fail
/// use auth_foundation_authorization_ready_authority::ReadyAuthorization;
/// fn duplicate(ready: ReadyAuthorization<'_, '_>) {
///     let _ = ready.clone();
/// }
/// ```
///
/// ```compile_fail
/// use auth_foundation_authorization_ready_authority::ReadyAuthorization;
/// fn read_private_field(ready: &ReadyAuthorization<'_, '_>) {
///     let _ = &ready.command;
/// }
/// ```
pub struct ReadyAuthorization<'transaction, 'connection> {
    transaction: &'transaction Transaction<'connection>,
    evaluation_epoch_id: NonZeroU64,
    decision_time: u64,
    command: AuthorizationCommand,
    authenticated_subject_id: String,
    authentication_evidence_revision: u64,
    route_binding_revision: u64,
    state: ResolvedAuthorizationState,
}

impl ReadyAuthorization<'_, '_> {
    pub fn evaluation_epoch_id(&self) -> u64 {
        self.evaluation_epoch_id.get()
    }

    pub fn decision_time(&self) -> u64 {
        self.decision_time
    }

    pub fn command(&self) -> &AuthorizationCommand {
        &self.command
    }

    pub fn authenticated_subject_id(&self) -> &str {
        &self.authenticated_subject_id
    }

    pub fn authentication_evidence_revision(&self) -> u64 {
        self.authentication_evidence_revision
    }

    pub fn route_binding_revision(&self) -> u64 {
        self.route_binding_revision
    }

    pub fn state(&self) -> &ResolvedAuthorizationState {
        &self.state
    }

    /// Proves this value remains borrowed from a live caller-owned transaction.
    /// The transaction itself is deliberately not exposed to policy adapters.
    pub fn is_transaction_bound(&self) -> bool {
        !self.transaction.is_autocommit()
    }
}

/// Read the complete ordered resolver rows from this invocation's transaction,
/// construct the candidate from the same unique qualifying rows, and call the
/// v2 admission kernel. The continuation cannot run for gate DENY, preparation
/// failure, or unusable post-READY state. It consumes the opaque bound value,
/// never a separately supplied raw command or state. A
/// bare function pointer also has no captured value whose destructor could
/// execute a decision when a denied continuation is dropped.
///
/// ```compile_fail
/// use std::num::NonZeroU64;
/// use auth_foundation_authorization_ready_authority::with_ready_in_transaction;
/// use auth_foundation_authorization_state_model::InboundAuthorizationRequest;
/// use rusqlite::Transaction;
/// fn attempt(tx: &Transaction<'_>, request: &InboundAuthorizationRequest) {
///     let captured = String::from("drop effect");
///     let _ = with_ready_in_transaction(tx, request, NonZeroU64::new(1).unwrap(), 0,
///         move |_ready| drop(captured));
/// }
/// ```
pub fn with_ready_in_transaction<'transaction, 'connection, R>(
    transaction: &'transaction Transaction<'connection>,
    request: &InboundAuthorizationRequest,
    evaluation_epoch_id: NonZeroU64,
    decision_time: u64,
    continuation: fn(ReadyAuthorization<'transaction, 'connection>) -> R,
) -> AdmissionOutcome<R> {
    // The selected service's inbound bounds are checked before any reader.
    if request.request_id.is_empty()
        || request.authentication_evidence_ref.is_empty()
        || request.route_id.is_empty()
    {
        return AdmissionOutcome::Denied;
    }

    let (query, resolution) = match resolve_in_transaction(
        transaction,
        &request.authentication_evidence_ref,
        &request.route_id,
        decision_time,
    ) {
        Ok(value) => value,
        Err(_) => return AdmissionOutcome::PreparationFailed(PreparationFailure::TrustedInputRead),
    };
    let TrustedInputResolution::Resolved(snapshot) = resolution else {
        return AdmissionOutcome::Denied;
    };
    if query.decision_time != decision_time {
        return AdmissionOutcome::Denied;
    }

    // Preserve position identity: equal qualifying rows are two occurrences.
    let qualifying_authentication: Vec<_> = snapshot
        .authentication_evidence
        .iter()
        .filter(|row| {
            row.evidence_ref == request.authentication_evidence_ref
                && !row.evidence_ref.is_empty()
                && !row.session_id.is_empty()
                && row.trusted
                && !row.revoked
                && decision_time < row.expires_at
        })
        .collect();
    let qualifying_routes: Vec<_> = snapshot
        .route_bindings
        .iter()
        .filter(|row| {
            row.route_id == request.route_id
                && !row.route_id.is_empty()
                && !row.resource.is_empty()
                && !row.action.is_empty()
                && !row.scope.is_empty()
                && !row.scope_evidence_ref.is_empty()
                && row.complete
                && row.enabled
        })
        .collect();
    let ([evidence], [binding]) = (
        qualifying_authentication.as_slice(),
        qualifying_routes.as_slice(),
    ) else {
        return AdmissionOutcome::Denied;
    };

    let command = AuthorizationCommand {
        request_id: request.request_id.clone(),
        session_id: evidence.session_id.clone(),
        required_permission: Permission {
            resource: binding.resource.clone(),
            action: binding.action.clone(),
            scope: binding.scope.clone(),
        },
        scope_evidence_ref: binding.scope_evidence_ref.clone(),
    };
    let context = gate::CommandBoundaryContext {
        request: gate::BoundaryRequest {
            request_id: request.request_id.clone(),
            authentication_evidence_ref: request.authentication_evidence_ref.clone(),
            route_id: request.route_id.clone(),
        },
        resolved_authentication_evidence: snapshot
            .authentication_evidence
            .iter()
            .map(|row| gate::AuthenticatedSessionEvidence {
                evidence_ref: row.evidence_ref.clone(),
                session_id: row.session_id.clone(),
                trusted: row.trusted
                    && !row.revoked
                    && decision_time < row.expires_at
                    && !row.evidence_ref.is_empty()
                    && !row.session_id.is_empty(),
            })
            .collect(),
        resolved_route_bindings: snapshot
            .route_bindings
            .iter()
            .map(|row| gate::RouteAuthorizationBinding {
                route_id: row.route_id.clone(),
                required_permission: gate::Permission {
                    resource: row.resource.clone(),
                    action: row.action.clone(),
                    scope: row.scope.clone(),
                },
                scope_evidence_ref: row.scope_evidence_ref.clone(),
                complete: row.complete
                    && row.enabled
                    && !row.route_id.is_empty()
                    && !row.resource.is_empty()
                    && !row.action.is_empty()
                    && !row.scope.is_empty()
                    && !row.scope_evidence_ref.is_empty(),
            })
            .collect(),
        candidate_command: gate::AuthorizationCommand {
            request_id: command.request_id.clone(),
            session_id: command.session_id.clone(),
            required_permission: gate::Permission {
                resource: command.required_permission.resource.clone(),
                action: command.required_permission.action.clone(),
                scope: command.required_permission.scope.clone(),
            },
            scope_evidence_ref: command.scope_evidence_ref.clone(),
        },
    };
    let gate_decision = gate::admit_authorization_command(&context);
    #[cfg(feature = "trace")]
    auth_foundation_authorization_trace::record(
        if gate_decision == gate::CommandBoundaryDecision::Ready {
            auth_foundation_authorization_trace::EventKind::GateReady
        } else {
            auth_foundation_authorization_trace::EventKind::GateDenied
        },
        &request.request_id,
        Some(evaluation_epoch_id.get()),
    );
    if gate_decision != gate::CommandBoundaryDecision::Ready {
        return AdmissionOutcome::Denied;
    }

    let (authentication_evidence_revision, authenticated_subject_id) =
        match authentication_metadata(transaction, evidence.evidence_identity) {
            Some(value) if !value.1.is_empty() => value,
            _ => return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::MetadataRead),
        };
    let route_binding_revision = match route_revision(transaction, binding.binding_identity) {
        Some(value) => value,
        None => return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::MetadataRead),
    };

    // Authorization-state resolution is deliberately *after* admission. A
    // state failure is not retrospectively called a command-boundary DENY.
    let state = match resolve_authorization_state_in_transaction(transaction, &command) {
        Ok(snapshot) => snapshot,
        Err(_) => return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateRead),
    };
    if !state.is_complete() || !state.trusted_scope_evidence() {
        return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateJoin);
    }
    let [session] = state.sessions() else {
        return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateJoin);
    };
    if session.session_id != command.session_id
        || session.user_id != authenticated_subject_id
        || session.authorization_revision != state.current_authorization_revision()
    {
        return AdmissionOutcome::ReadyStateFailed(ReadyStateFailure::StateJoin);
    }

    let ready = ReadyAuthorization {
        transaction,
        evaluation_epoch_id,
        decision_time,
        command,
        authenticated_subject_id,
        authentication_evidence_revision,
        route_binding_revision,
        state: state.into_state(),
    };
    AdmissionOutcome::Ready(continuation(ready))
}
