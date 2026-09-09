use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use essays_agent_runtime::{
    AuthenticatedPrincipal, BrowserEvidence, Command, ContextSelection, ContextSufficiency,
    EffectEnvelope, EffectOutcome, ErrorCode, PairingCode, ProposalStatus, Runtime, SqliteStore,
    browser::PlaywrightSupervisor,
    ipc,
    runtime::now_unix_ms,
    security::{PublicJwk, create_pairing_code, verify_dpop},
    wasm::{VerifiedComponentManifest, manifest_signing_payload},
};
use p256::ecdsa::{Signature, SigningKey, signature::Signer};
use sha2::{Digest, Sha256};

fn runtime() -> (tempfile::TempDir, Runtime) {
    let directory = tempfile::tempdir().unwrap();
    let runtime = Runtime::new(SqliteStore::open(directory.path().join("db.sqlite")).unwrap());
    (directory, runtime)
}

fn owner() -> AuthenticatedPrincipal {
    AuthenticatedPrincipal::verified_local("owner", "test-client")
}

fn context(operation: &str) -> ContextSelection {
    ContextSelection {
        context_id: "context-1".into(),
        purpose: operation.into(),
        provenance: vec!["fixture:test".into()],
        sufficiency: ContextSufficiency::Sufficient,
        authority_ceiling: "proposal-only".into(),
        inferred: false,
        confidence_basis_points: None,
        conflicts: Vec::new(),
        correction_ref: None,
        rejected: false,
    }
}

fn deadline() -> i64 {
    now_unix_ms() + 60_000
}

fn create(request_id: &str, text: &str) -> Command {
    Command::CreateWorkspace {
        request_id: request_id.into(),
        workspace_id: "workspace-1".into(),
        work_owner: "owner".into(),
        initial_text: text.into(),
        deadline_unix_ms: deadline(),
    }
}

fn proposal(request_id: &str, proposal_id: &str, revision: i64, text: &str) -> Command {
    Command::RecordProposal {
        request_id: request_id.into(),
        workspace_id: "workspace-1".into(),
        proposal_id: proposal_id.into(),
        source_revision: revision,
        context: context("revise-essay"),
        operation_id: "revise-essay".into(),
        target_artifact: "essay.md".into(),
        target_region: "body".into(),
        text: text.into(),
        rationale: "fixture".into(),
        uncertainty: "none".into(),
        validation_diagnostics: vec!["fixture-pass".into()],
        deadline_unix_ms: deadline(),
    }
}

#[test]
fn request_identity_is_bound_to_command_digest() {
    let (_directory, runtime) = runtime();
    let first = create("request-1", "first");
    assert!(!runtime.execute(&first, &owner()).unwrap().replayed);
    assert!(runtime.execute(&first, &owner()).unwrap().replayed);
    let error = runtime
        .execute(&create("request-1", "different"), &owner())
        .unwrap_err();
    assert_eq!(error.code, ErrorCode::IdempotencyKeyReused);
}

#[test]
fn principal_is_external_to_command_and_owner_controls_disposition() {
    let (_directory, runtime) = runtime();
    runtime
        .execute(&create("request-1", "old"), &owner())
        .unwrap();
    runtime
        .execute(&proposal("request-2", "proposal-1", 0, "new"), &owner())
        .unwrap();
    let attacker = AuthenticatedPrincipal::verified_local("attacker", "test-client");
    let accept = Command::AcceptProposal {
        request_id: "request-3".into(),
        workspace_id: "workspace-1".into(),
        proposal_id: "proposal-1".into(),
        expected_revision: 0,
        deadline_unix_ms: deadline(),
    };
    assert_eq!(
        runtime.execute(&accept, &attacker).unwrap_err().code,
        ErrorCode::WorkOwnerRequired
    );
    let receipt = runtime.execute(&accept, &owner()).unwrap();
    assert_eq!(receipt.resulting_revision, Some(1));
    assert_eq!(
        runtime
            .snapshot("workspace-1", None)
            .unwrap()
            .unwrap()
            .workspace
            .accepted_text,
        "new"
    );
}

#[test]
fn rejection_is_durable_and_does_not_advance_revision() {
    let (_directory, runtime) = runtime();
    runtime
        .execute(&create("request-1", "old"), &owner())
        .unwrap();
    runtime
        .execute(&proposal("request-2", "proposal-1", 0, "new"), &owner())
        .unwrap();
    let receipt = runtime
        .execute(
            &Command::RejectProposal {
                request_id: "request-3".into(),
                workspace_id: "workspace-1".into(),
                proposal_id: "proposal-1".into(),
                expected_revision: 0,
                reason: "not ready".into(),
                deadline_unix_ms: deadline(),
            },
            &owner(),
        )
        .unwrap();
    assert_eq!(receipt.resulting_revision, Some(0));
    let snapshot = runtime.snapshot("workspace-1", None).unwrap().unwrap();
    assert_eq!(snapshot.workspace.accepted_text, "old");
    assert_eq!(snapshot.proposals[0].status, ProposalStatus::Rejected);
}

#[test]
fn context_must_be_sufficient_for_exact_operation() {
    let (_directory, runtime) = runtime();
    runtime
        .execute(&create("request-1", "old"), &owner())
        .unwrap();
    let mut command = proposal("request-2", "proposal-1", 0, "new");
    if let Command::RecordProposal { context, .. } = &mut command {
        context.sufficiency = ContextSufficiency::Indeterminate;
    }
    assert_eq!(
        runtime.execute(&command, &owner()).unwrap_err().code,
        ErrorCode::ContextInsufficient
    );
}

#[test]
fn snapshot_has_freshness_cursor_and_separated_proposals() {
    let (_directory, runtime) = runtime();
    runtime
        .execute(&create("request-1", "old"), &owner())
        .unwrap();
    let first = runtime.snapshot("workspace-1", None).unwrap().unwrap();
    runtime
        .execute(&proposal("request-2", "proposal-1", 0, "new"), &owner())
        .unwrap();
    let stale = runtime
        .snapshot("workspace-1", Some(first.event_cursor))
        .unwrap()
        .unwrap();
    assert_eq!(stale.freshness, "stale");
    assert_eq!(stale.workspace.accepted_text, "old");
    assert_eq!(stale.proposals.len(), 1);
    assert!(stale.event_cursor > first.event_cursor);
}

#[test]
fn committed_state_survives_reopen() {
    let directory = tempfile::tempdir().unwrap();
    let database = directory.path().join("db.sqlite");
    {
        let runtime = Runtime::new(SqliteStore::open(&database).unwrap());
        runtime
            .execute(&create("request-1", "durable"), &owner())
            .unwrap();
    }
    let reopened = Runtime::new(SqliteStore::open(&database).unwrap());
    assert_eq!(
        reopened
            .snapshot("workspace-1", None)
            .unwrap()
            .unwrap()
            .workspace
            .accepted_text,
        "durable"
    );
}

#[test]
fn framed_json_rejects_oversized_payload() {
    let command = create("request-1", "text");
    let mut bytes = Vec::new();
    ipc::write_frame(&mut bytes, &command).unwrap();
    assert_eq!(
        ipc::read_frame::<Command>(&bytes[..], 4096).unwrap(),
        command
    );
    assert!(ipc::read_frame::<Command>(&bytes[..], 1).is_err());
}

#[tokio::test]
async fn supervisors_deny_execution_by_default() {
    let envelope = EffectEnvelope {
        effect_id: "effect-1".into(),
        workspace_id: "workspace-1".into(),
        owner: "owner".into(),
        actor: "owner".into(),
        target: "https://example.invalid".into(),
        scope: vec!["browser:navigate".into()],
        expires_at_unix_ms: deadline(),
        revoked: false,
        deadline_unix_ms: deadline(),
        replay_allowed: false,
        evidence_expectation: "title".into(),
        credential_handle: None,
    };
    let supervisor = PlaywrightSupervisor {
        executable: "node".into(),
        runner: "browser/playwright-runner.mjs".into(),
        max_output_bytes: 4096,
        external_effects_enabled: false,
    };
    assert_eq!(
        supervisor
            .execute(&envelope, &owner())
            .await
            .unwrap_err()
            .code,
        ErrorCode::ScopeDenied
    );
    let mut mismatched_owner = envelope.clone();
    mismatched_owner.owner = "attacker".into();
    assert_eq!(
        supervisor
            .execute(&mismatched_owner, &owner())
            .await
            .unwrap_err()
            .code,
        ErrorCode::Unauthenticated
    );
}

#[test]
fn wasm_signature_binds_digest_owner_and_proposal_scope() {
    let bytes = b"component fixture";
    let digest = format!("{:x}", Sha256::digest(bytes));
    let signing_key = SigningKey::random(&mut p256::elliptic_curve::rand_core::OsRng);
    let signature: Signature = signing_key.sign(&manifest_signing_payload(&digest, "owner", true));
    VerifiedComponentManifest::verify_bytes(
        "fixture.wasm",
        bytes,
        &digest,
        "owner",
        true,
        &signature.to_bytes(),
        signing_key.verifying_key(),
    )
    .unwrap();
    assert_eq!(
        VerifiedComponentManifest::verify_bytes(
            "fixture.wasm",
            bytes,
            &digest,
            "attacker",
            true,
            &signature.to_bytes(),
            signing_key.verifying_key(),
        )
        .unwrap_err()
        .code,
        ErrorCode::Unauthenticated
    );
}

#[test]
fn uncertain_effect_requires_explicit_reconciliation() {
    let (_directory, runtime) = runtime();
    runtime
        .execute(&create("request-1", "old"), &owner())
        .unwrap();
    let envelope = EffectEnvelope {
        effect_id: "effect-1".into(),
        workspace_id: "workspace-1".into(),
        owner: "owner".into(),
        actor: "owner".into(),
        target: "https://example.invalid".into(),
        scope: vec!["browser:navigate".into()],
        expires_at_unix_ms: deadline(),
        revoked: false,
        deadline_unix_ms: deadline(),
        replay_allowed: false,
        evidence_expectation: "title".into(),
        credential_handle: None,
    };
    let evidence = BrowserEvidence {
        evidence_id: "evidence-1".into(),
        effect_id: "effect-1".into(),
        workspace_id: "workspace-1".into(),
        method: "fixture".into(),
        origin: "https://example.invalid".into(),
        artifact_sha256: None,
        redacted_observation: "deadline after dispatch".into(),
        captured_at_unix_ms: now_unix_ms(),
        outcome: EffectOutcome::Uncertain,
        residue: vec!["retry prohibited".into()],
    };
    runtime
        .execute(
            &Command::RecordEffectOutcome {
                request_id: "request-2".into(),
                envelope,
                evidence,
            },
            &owner(),
        )
        .unwrap();
    runtime
        .execute(
            &Command::ReconcileEffect {
                request_id: "request-3".into(),
                workspace_id: "workspace-1".into(),
                effect_id: "effect-1".into(),
                resolution: EffectOutcome::Failed,
                evidence_ref: "evidence-1".into(),
                deadline_unix_ms: deadline(),
            },
            &owner(),
        )
        .unwrap();
}

#[test]
fn dpop_pairing_verifies_signature_scope_and_replay() {
    let (_directory, runtime) = runtime();
    let signing_key = SigningKey::random(&mut p256::elliptic_curve::rand_core::OsRng);
    let point = signing_key.verifying_key().to_encoded_point(false);
    let jwk = PublicJwk {
        kty: "EC".into(),
        crv: "P-256".into(),
        x: URL_SAFE_NO_PAD.encode(point.x().unwrap()),
        y: URL_SAFE_NO_PAD.encode(point.y().unwrap()),
    };
    let pairing = PairingCode {
        code: "0123456789abcdef0123456789abcdef".into(),
        subject: "owner".into(),
        scopes: vec!["runtime:read".into()],
        expires_at_unix_ms: deadline(),
    };
    create_pairing_code(&runtime, &pairing).unwrap();
    essays_agent_runtime::security::redeem_pairing_code(
        &runtime,
        &essays_agent_runtime::security::PairRequest {
            code: pairing.code,
            client_id: "remote-client".into(),
            jwk: jwk.clone(),
        },
        60_000,
    )
    .unwrap();
    let header = URL_SAFE_NO_PAD.encode(
        serde_json::to_vec(&serde_json::json!({"typ":"dpop+jwt","alg":"ES256","jwk":jwk})).unwrap(),
    );
    let claims = URL_SAFE_NO_PAD.encode(
        serde_json::to_vec(&serde_json::json!({"htm":"GET","htu":"https://localhost/v1/workspaces/workspace-1","iat":now_unix_ms()/1000,"jti":"proof-1"})).unwrap(),
    );
    let input = format!("{header}.{claims}");
    let signature: Signature = signing_key.sign(input.as_bytes());
    let proof = format!("{input}.{}", URL_SAFE_NO_PAD.encode(signature.to_bytes()));
    verify_dpop(
        &runtime,
        &proof,
        "remote-client",
        "GET",
        "https://localhost/v1/workspaces/workspace-1",
        "runtime:read",
    )
    .unwrap();
    assert_eq!(
        verify_dpop(
            &runtime,
            &proof,
            "remote-client",
            "GET",
            "https://localhost/v1/workspaces/workspace-1",
            "runtime:read",
        )
        .unwrap_err()
        .code,
        ErrorCode::IdempotencyKeyReused
    );
}
