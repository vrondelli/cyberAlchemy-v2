//! Authorization-policy decision over an exact, transaction-bound READY value.
//!
//! This crate exposes no raw-command entrypoint. The generated policy is called
//! only after the lower admission authority has issued `ReadyAuthorization`.

use auth_foundation_authorization_ready_authority::ReadyAuthorization;
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, RoleRecord, SessionRecord, SessionStatus,
};
use auth_kernel as kernel;

/// Evaluate the command, time, and state carried by this exact READY value.
///
/// A freely constructible command cannot be passed to this decision entrypoint.
///
/// ```compile_fail
/// use auth_foundation_authorization_ready_decision::authorize;
/// use auth_foundation_authorization_state_model::{AuthorizationCommand, Permission};
/// let raw = AuthorizationCommand {
///     request_id: "r".into(),
///     session_id: "s".into(),
///     required_permission: Permission {
///         resource: "documents".into(), action: "read".into(), scope: "tenant".into(),
///     },
///     scope_evidence_ref: "scope".into(),
/// };
/// let _ = authorize(&raw);
/// ```
///
/// One READY value cannot authorize twice in safe Rust.
///
/// ```compile_fail
/// use auth_foundation_authorization_ready_authority::ReadyAuthorization;
/// use auth_foundation_authorization_ready_decision::authorize;
/// fn duplicate_decision(ready: ReadyAuthorization<'_, '_>) {
///     let _ = authorize(ready);
///     let _ = authorize(ready);
/// }
/// ```
pub fn authorize(ready: ReadyAuthorization<'_, '_>) -> BinaryAuthorizationDecision {
    let command = ready.command();
    #[cfg(feature = "trace")]
    auth_foundation_authorization_trace::record(
        auth_foundation_authorization_trace::EventKind::ReadyDecisionEntered,
        &command.request_id,
        Some(ready.evaluation_epoch_id()),
    );
    let state = ready.state();
    let context = kernel::EvaluationContext {
        request: kernel::AuthorizationRequest {
            request_id: command.request_id.clone(),
            session_id: command.session_id.clone(),
            required_permission: kernel::Permission {
                resource: command.required_permission.resource.clone(),
                action: command.required_permission.action.clone(),
                scope: command.required_permission.scope.clone(),
            },
            scope_evidence_ref: command.scope_evidence_ref.clone(),
            decision_time: ready.decision_time(),
            current_authorization_revision: state.current_authorization_revision(),
        },
        resolved_sessions: state.sessions().iter().map(to_kernel_session).collect(),
        resolved_roles: state.roles().roles.iter().map(to_kernel_role).collect(),
        trusted_scope_evidence: state.is_complete() && state.trusted_scope_evidence(),
        role_relation_complete: state.is_complete() && state.roles().complete,
    };
    #[cfg(feature = "trace")]
    auth_foundation_authorization_trace::record(
        auth_foundation_authorization_trace::EventKind::PolicyCallBefore,
        &command.request_id,
        Some(ready.evaluation_epoch_id()),
    );
    let decision = kernel::authorize(&context);
    #[cfg(feature = "trace")]
    auth_foundation_authorization_trace::record(
        auth_foundation_authorization_trace::EventKind::PolicyCallReturned,
        &command.request_id,
        Some(ready.evaluation_epoch_id()),
    );
    match decision {
        kernel::AuthorizationDecision::Allow => BinaryAuthorizationDecision::Allow,
        kernel::AuthorizationDecision::Deny(_) => BinaryAuthorizationDecision::Deny,
    }
}

fn to_kernel_session(session: &SessionRecord) -> kernel::Session {
    kernel::Session {
        session_id: session.session_id.clone(),
        user_id: session.user_id.clone(),
        status: match session.status {
            SessionStatus::Active => kernel::SessionStatus::Active,
            SessionStatus::Inactive => kernel::SessionStatus::Inactive,
            SessionStatus::Revoked => kernel::SessionStatus::Revoked,
        },
        active_role_ids: session.active_role_ids.clone(),
        authorization_revision: session.authorization_revision,
        expires_at: session.expires_at,
    }
}

fn to_kernel_role(role: &RoleRecord) -> kernel::Role {
    kernel::Role {
        role_id: role.role_id.clone(),
        permissions: role
            .permissions
            .iter()
            .map(|permission| kernel::Permission {
                resource: permission.resource.clone(),
                action: permission.action.clone(),
                scope: permission.scope.clone(),
            })
            .collect(),
    }
}
