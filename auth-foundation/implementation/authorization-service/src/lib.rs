//! Fixed binary Auth decision facade over the selected admission epoch.
//!
//! Selected API and bridge roots call this facade so they cannot choose a
//! different READY decision callback at their construction boundary.

use std::path::Path;
use std::sync::Arc;

use auth_foundation_authorization_admission_service::{AdmissionOutcome, SqliteAdmissionService};
pub use auth_foundation_authorization_admission_service::{
    DecisionClock, EpochAllocator, MAX_REFERENCE_BYTES, MAX_REQUEST_ID_BYTES, SCHEMA_V2,
    SystemDecisionClock, migrate_connection, migrate_database,
};
use auth_foundation_authorization_ready_decision::authorize as authorize_ready_decision;
use auth_foundation_authorization_state_model::{
    BinaryAuthorizationDecision, InboundAuthorizationRequest, PortFailure,
};
use rusqlite::Connection;

/// Retained for existing callers; admission itself validates only inbound IDs.
pub const MAX_PERMISSION_COMPONENT_BYTES: usize = 256;

/// Fixed decision adapter. Admission owns clock, epoch, schema validation,
/// transaction, gate, and READY construction. This facade owns only the binary
/// policy-decision mapping.
pub struct SqliteAuthService<C: DecisionClock = SystemDecisionClock> {
    admission: SqliteAdmissionService<C>,
}

impl<C: DecisionClock> SqliteAuthService<C> {
    pub fn authorize(
        &mut self,
        request: InboundAuthorizationRequest,
    ) -> BinaryAuthorizationDecision {
        match self.admission.with_ready(request, authorize_ready_decision) {
            Ok(AdmissionOutcome::Ready(decision)) => decision,
            Ok(
                AdmissionOutcome::Denied
                | AdmissionOutcome::PreparationFailed(_)
                | AdmissionOutcome::ReadyStateFailed(_),
            )
            | Err(_) => BinaryAuthorizationDecision::Deny,
        }
    }
}

impl SqliteAuthService<SystemDecisionClock> {
    /// Open an existing migrated database without creating or migrating schema.
    /// A caller-supplied pre-admission clock is not a production capability.
    ///
    /// ~~~compile_fail
    /// use auth_foundation_authorization_service::SqliteAuthService;
    /// let _ = SqliteAuthService::open("auth.sqlite", CustomClock);
    /// # struct CustomClock;
    /// ~~~
    pub fn open(path: impl AsRef<Path>) -> Result<Self, PortFailure> {
        Ok(Self {
            admission: SqliteAdmissionService::open(path)?,
        })
    }

    pub fn open_with_epoch_allocator(
        path: impl AsRef<Path>,
        epoch_allocator: Arc<EpochAllocator>,
    ) -> Result<Self, PortFailure> {
        Ok(Self {
            admission: SqliteAdmissionService::open_with_epoch_allocator(path, epoch_allocator)?,
        })
    }

    pub fn from_connection(connection: Connection) -> Result<Self, PortFailure> {
        Ok(Self {
            admission: SqliteAdmissionService::from_connection(connection)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn request(route_id: &str) -> InboundAuthorizationRequest {
        InboundAuthorizationRequest {
            request_id: "request-1".into(),
            authentication_evidence_ref: "auth-1".into(),
            route_id: route_id.into(),
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
    fn facade_preserves_ready_allow_and_gate_deny() {
        let mut service = SqliteAuthService::from_connection(seeded_connection()).expect("service");
        assert_eq!(
            service.authorize(request("documents.read")),
            BinaryAuthorizationDecision::Allow
        );
        assert_eq!(
            service
                .admission
                .with_ready(request("documents.write"), authorize_ready_decision),
            Ok(AdmissionOutcome::Denied)
        );
        assert_eq!(
            service.authorize(request("documents.write")),
            BinaryAuthorizationDecision::Deny
        );
    }

    #[test]
    fn facade_preserves_ready_policy_deny() {
        let connection = seeded_connection();
        connection
            .execute("UPDATE auth_sessions SET status = 'inactive'", [])
            .expect("policy state");
        let mut service = SqliteAuthService::from_connection(connection).expect("service");
        assert_eq!(
            service
                .admission
                .with_ready(request("documents.read"), authorize_ready_decision),
            Ok(AdmissionOutcome::Ready(BinaryAuthorizationDecision::Deny))
        );
        assert_eq!(
            service.authorize(request("documents.read")),
            BinaryAuthorizationDecision::Deny
        );
    }

    #[test]
    fn facade_maps_preparation_failure_to_deny() {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let path = std::env::temp_dir().join(format!(
            "auth-facade-failure-{}-{nonce}.sqlite",
            std::process::id()
        ));
        migrate_database(&path).expect("schema");
        let mut service = SqliteAuthService::open(&path).expect("service");
        Connection::open(&path)
            .expect("writer")
            .execute("DROP TABLE auth_authentication_evidence", [])
            .expect("break provider after open");
        assert!(matches!(
            service
                .admission
                .with_ready(request("documents.read"), authorize_ready_decision),
            Ok(AdmissionOutcome::PreparationFailed(_))
        ));
        assert_eq!(
            service.authorize(request("documents.read")),
            BinaryAuthorizationDecision::Deny
        );
        drop(service);
        std::fs::remove_file(&path).expect("cleanup database");
    }

    #[test]
    fn facade_uses_shared_schema_migration() {
        let mut connection = Connection::open_in_memory().expect("connection");
        migrate_connection(&mut connection).expect("schema");
        assert!(SqliteAuthService::from_connection(connection).is_ok());
        assert!(SCHEMA_V2.contains("PRAGMA user_version = 2"));
    }
}
