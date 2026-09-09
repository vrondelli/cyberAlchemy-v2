use axum::{
    body::Body,
    http::{Request, StatusCode},
    Router,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use cyberalchemy_kep_hosted_devnet::{
    auth::{
        artifact_message, grant_message, register_message, reissue_fulfill_message,
        reissue_request_message, sha256_hex,
    },
    model::{
        Authorization, ClientErrorEventRequest, CreateArtifactRequest, CreateReissueRequest,
        FinalizeGrantRequest, FulfillReissueRequest, PrepareGrantRequest, RegisterIdentityRequest,
    },
    router, Application, FinalityGateway, FinalizedArtifactObservation, MockFinalityGateway,
};
use ed25519_dalek::{Signer, SigningKey};
use http_body_util::BodyExt;
use serde::Serialize;
use sqlx::Row;
use tower::ServiceExt;

fn authorization(key: &SigningKey, message: String) -> Authorization {
    Authorization {
        signature_base64: STANDARD.encode(key.sign(message.as_bytes()).to_bytes()),
        message,
    }
}

async fn post<T: Serialize>(app: &Router, uri: &str, payload: &T) -> StatusCode {
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(uri)
                .header("content-type", "application/json")
                .body(Body::from(serde_json::to_vec(payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    let status = response.status();
    let _ = response.into_body().collect().await.unwrap();
    status
}

#[tokio::test]
#[ignore = "requires CA2_KEP_TEST_DATABASE_URL pointing at a disposable PostgreSQL database"]
async fn postgres_migrates_archives_journals_and_recovers_state() {
    let database_url = std::env::var("CA2_KEP_TEST_DATABASE_URL")
        .expect("CA2_KEP_TEST_DATABASE_URL must name a disposable database");
    let mock_gateway = MockFinalityGateway::default();
    let gateway = FinalityGateway::Mock(mock_gateway.clone());
    let application = Application::postgres(&database_url, gateway.clone())
        .await
        .unwrap();
    assert!(application.snapshot().await.identities.is_empty());
    let app = router(application.clone());

    let signer = SigningKey::from_bytes(&[9_u8; 32]);
    let wallet = bs58::encode(signer.verifying_key().to_bytes()).into_string();
    let encryption_public_key = STANDARD.encode([8_u8; 32]);
    let message = register_message(
        "pg-register-a",
        "pg-identity-a",
        &wallet,
        &encryption_public_key,
        1,
    );
    let registration = RegisterIdentityRequest {
        operation_id: "pg-register-a".into(),
        identity_id: "pg-identity-a".into(),
        wallet_public_key: wallet,
        encryption_public_key,
        encryption_key_version: 1,
        authorization: authorization(&signer, message),
    };
    assert_eq!(
        post(&app, "/v1/identities", &registration).await,
        StatusCode::OK
    );

    let artifact_id = "91".repeat(32);
    let policy_id = "92".repeat(32);
    let encrypted_bytes = vec![0xA5_u8; 96];
    let envelope = vec![0xB6_u8; 64];
    let encrypted_digest = sha256_hex(&encrypted_bytes);
    let envelope_digest = sha256_hex(&envelope);
    let message = artifact_message(
        "pg-create-artifact",
        "pg-identity-a",
        &artifact_id,
        &policy_id,
        1,
        &encrypted_digest,
        &envelope_digest,
    );
    let artifact = CreateArtifactRequest {
        operation_id: "pg-create-artifact".into(),
        artifact_version_id: artifact_id.clone(),
        originator_id: "pg-identity-a".into(),
        policy_id,
        encryption_epoch: 1,
        ciphertext_base64: STANDARD.encode(encrypted_bytes),
        ciphertext_sha256: encrypted_digest,
        originator_envelope_base64: STANDARD.encode(envelope),
        originator_envelope_sha256: envelope_digest,
        authorization: authorization(&signer, message),
    };
    assert_eq!(post(&app, "/v1/artifacts", &artifact).await, StatusCode::OK);

    let recipient_signer = SigningKey::from_bytes(&[10_u8; 32]);
    let recipient_wallet = bs58::encode(recipient_signer.verifying_key().to_bytes()).into_string();
    let recipient_encryption_public_key = STANDARD.encode([11_u8; 32]);
    let recipient_registration = RegisterIdentityRequest {
        operation_id: "pg-register-b".into(),
        identity_id: "pg-identity-b".into(),
        wallet_public_key: recipient_wallet.clone(),
        encryption_public_key: recipient_encryption_public_key.clone(),
        encryption_key_version: 1,
        authorization: authorization(
            &recipient_signer,
            register_message(
                "pg-register-b",
                "pg-identity-b",
                &recipient_wallet,
                &recipient_encryption_public_key,
                1,
            ),
        ),
    };
    assert_eq!(
        post(&app, "/v1/identities", &recipient_registration).await,
        StatusCode::OK
    );

    let recipient_envelope = vec![0xC7_u8; 64];
    let recipient_envelope_digest = sha256_hex(&recipient_envelope);
    let grant = PrepareGrantRequest {
        operation_id: "pg-grant-a-b".into(),
        artifact_version_id: artifact_id.clone(),
        originator_id: "pg-identity-a".into(),
        recipient_id: "pg-identity-b".into(),
        expected_revision: 0,
        recipient_envelope_base64: STANDARD.encode(recipient_envelope),
        recipient_envelope_sha256: recipient_envelope_digest.clone(),
        knowledge_consideration_lamports: 0,
        authorization: authorization(
            &signer,
            grant_message(
                "pg-grant-a-b",
                &artifact_id,
                "pg-identity-a",
                "pg-identity-b",
                0,
                &recipient_envelope_digest,
            ),
        ),
    };
    assert_eq!(post(&app, "/v1/grants", &grant).await, StatusCode::OK);
    mock_gateway
        .record(FinalizedArtifactObservation {
            transaction_signature: "pg-grant-finalized".into(),
            artifact_version_id: artifact_id.clone(),
            recipient_wallet_public_key: recipient_wallet.clone(),
            recipient_envelope_sha256: recipient_envelope_digest,
            revision: 1,
            finality: "finalized".into(),
        })
        .await;
    assert_eq!(
        post(
            &app,
            "/v1/grants/pg-grant-a-b/finalize",
            &FinalizeGrantRequest {
                transaction_signature: "pg-grant-finalized".into(),
                artifact_account: "pg-mock-artifact-account".into(),
            },
        )
        .await,
        StatusCode::OK
    );

    let replacement_public_key = STANDARD.encode([12_u8; 32]);
    let reissue = CreateReissueRequest {
        operation_id: "pg-reissue-b".into(),
        artifact_version_id: artifact_id.clone(),
        recipient_id: "pg-identity-b".into(),
        previous_key_version: 1,
        replacement_public_key: replacement_public_key.clone(),
        replacement_key_version: 2,
        expected_revision: 1,
        authorization: authorization(
            &recipient_signer,
            reissue_request_message(
                "pg-reissue-b",
                &artifact_id,
                "pg-identity-b",
                1,
                &replacement_public_key,
                2,
                1,
            ),
        ),
    };
    assert_eq!(post(&app, "/v1/reissues", &reissue).await, StatusCode::OK);
    let replacement_envelope = vec![0xD8_u8; 64];
    let replacement_envelope_base64 = STANDARD.encode(&replacement_envelope);
    let replacement_envelope_digest = sha256_hex(&replacement_envelope);
    mock_gateway
        .record(FinalizedArtifactObservation {
            transaction_signature: "pg-reissue-finalized".into(),
            artifact_version_id: artifact_id.clone(),
            recipient_wallet_public_key: recipient_wallet,
            recipient_envelope_sha256: replacement_envelope_digest.clone(),
            revision: 2,
            finality: "finalized".into(),
        })
        .await;
    let fulfillment = FulfillReissueRequest {
        originator_id: "pg-identity-a".into(),
        replacement_envelope_base64,
        replacement_envelope_sha256: replacement_envelope_digest.clone(),
        transaction_signature: "pg-reissue-finalized".into(),
        artifact_account: "pg-mock-artifact-account".into(),
        authorization: authorization(
            &signer,
            reissue_fulfill_message(
                "pg-reissue-b",
                &artifact_id,
                "pg-identity-a",
                "pg-identity-b",
                1,
                &replacement_envelope_digest,
            ),
        ),
    };
    assert_eq!(
        post(&app, "/v1/reissues/pg-reissue-b/fulfill", &fulfillment).await,
        StatusCode::OK
    );
    assert_eq!(
        post(&app, "/v1/reissues/pg-reissue-b/fulfill", &fulfillment).await,
        StatusCode::OK
    );
    let client_error = ClientErrorEventRequest {
        attempt_id: "pg-blockhash-attempt".into(),
        operation_kind: "initialize_artifact".into(),
        stage: "devnet_submission".into(),
        error_code: "blockhash_not_found".into(),
        effect_status: "rejected_before_submission".into(),
        network: "solana-devnet".into(),
        safe_message:
            "Solana rejected this transaction before submission because its blockhash expired."
                .into(),
        diagnostic_digest: "cd".repeat(32),
        rpc_request_id: Some("pg-rpc-request".into()),
        transaction_signature: None,
        reporter: "client".into(),
        registry_version: "kep-error-registry/v1".into(),
        source_layer: "transaction".into(),
        retry_disposition: "user_may_retry_fresh".into(),
        http_status: None,
        rpc_code: Some(-32002),
        transaction_error: Some("BlockhashNotFound".into()),
        instruction_index: None,
        instruction_error: None,
        program_id: None,
        custom_program_code: None,
        correlation_id: Some("pg-browser-request".into()),
    };
    assert_eq!(
        post(&app, "/v1/client-errors", &client_error).await,
        StatusCode::ACCEPTED
    );
    drop(app);
    drop(application);

    let recovered = Application::postgres(&database_url, gateway).await.unwrap();
    let snapshot = recovered.snapshot().await;
    assert!(snapshot.identities.contains_key("pg-identity-a"));
    assert!(snapshot.artifacts.contains_key(&artifact_id));
    assert_eq!(
        snapshot
            .identities
            .get("pg-identity-b")
            .unwrap()
            .encryption_key_version,
        2
    );
    assert_eq!(snapshot.artifacts.get(&artifact_id).unwrap().revision, 2);
    let recovered_attempt = snapshot.client_errors.get("pg-blockhash-attempt").unwrap();
    assert_eq!(recovered_attempt.operation_kind, "initialize_artifact");
    assert_eq!(
        recovered_attempt.effect_status,
        "rejected_before_submission"
    );
    assert_eq!(
        snapshot
            .artifacts
            .get(&artifact_id)
            .unwrap()
            .envelopes
            .get("pg-identity-b")
            .unwrap()
            .envelope_sha256,
        replacement_envelope_digest
    );

    let pool = sqlx::PgPool::connect(&database_url).await.unwrap();
    let journal_count: i64 = sqlx::query("SELECT count(*) AS count FROM kep_hosted.event_journal")
        .fetch_one(&pool)
        .await
        .unwrap()
        .get("count");
    let archive_count: i64 =
        sqlx::query("SELECT count(*) AS count FROM kep_hosted.encrypted_archive")
            .fetch_one(&pool)
            .await
            .unwrap()
            .get("count");
    let client_error_count: i64 =
        sqlx::query("SELECT count(*) AS count FROM kep_hosted.client_error_journal")
            .fetch_one(&pool)
            .await
            .unwrap()
            .get("count");
    let classified_error = sqlx::query("SELECT reporter, registry_version, source_layer, retry_disposition, rpc_code, transaction_error, correlation_id FROM kep_hosted.client_error_journal WHERE attempt_id = $1")
        .bind("pg-blockhash-attempt")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(journal_count, 8);
    assert_eq!(archive_count, 1);
    assert_eq!(client_error_count, 1);
    assert_eq!(classified_error.get::<String, _>("reporter"), "client");
    assert_eq!(
        classified_error.get::<String, _>("registry_version"),
        "kep-error-registry/v1"
    );
    assert_eq!(
        classified_error.get::<String, _>("source_layer"),
        "transaction"
    );
    assert_eq!(
        classified_error.get::<String, _>("retry_disposition"),
        "user_may_retry_fresh"
    );
    assert_eq!(classified_error.get::<i64, _>("rpc_code"), -32002);
    assert_eq!(
        classified_error.get::<String, _>("transaction_error"),
        "BlockhashNotFound"
    );
    assert_eq!(
        classified_error.get::<String, _>("correlation_id"),
        "pg-browser-request"
    );
    println!(
        "PASS PostgreSQL: migration + 8 state events including durable client evidence + exact reissue replay without an additional write + recovered revision 2"
    );
}
