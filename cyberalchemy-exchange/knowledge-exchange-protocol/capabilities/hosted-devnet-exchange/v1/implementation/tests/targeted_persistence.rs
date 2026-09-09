use cyberalchemy_kep_hosted_devnet::{
    model::{Database, KnowledgeIdentity},
    store::Persistence,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::Row;

async fn open(url: &str) -> Persistence {
    for _ in 0..50 {
        match Persistence::postgres(url).await {
            Ok(writer) => return writer,
            Err(error) if error.contains("active writer") => {
                tokio::time::sleep(std::time::Duration::from_millis(20)).await
            }
            Err(error) => panic!("{error}"),
        }
    }
    panic!("writer did not release its session");
}

#[tokio::test]
#[ignore = "requires CA2_KEP_DOCUMENT_TEST_DATABASE_URL naming a fresh disposable database"]
async fn migration_targeted_writes_rollback_and_historical_preservation() {
    let url = std::env::var("CA2_KEP_DOCUMENT_TEST_DATABASE_URL").unwrap();
    let pool = sqlx::PgPool::connect(&url).await.unwrap();
    for migration in [
        include_str!("../migrations/001_hosted_exchange.sql"),
        include_str!("../migrations/002_error_intelligence.sql"),
        include_str!("../migrations/003_file_payloads.sql"),
    ] {
        for statement in migration
            .split("-- statement")
            .filter(|s| !s.trim().is_empty())
        {
            sqlx::query(statement).execute(&pool).await.unwrap();
        }
    }
    let mut state = Database::default();
    for id in ["one", "untouched"] {
        state.identities.insert(
            id.into(),
            KnowledgeIdentity {
                identity_id: id.into(),
                wallet_public_key: "wallet".into(),
                encryption_public_key: "key".into(),
                encryption_key_version: 1,
            },
        );
    }
    state
        .consumed_operations
        .insert("historical-operation".into());
    let legacy = serde_json::to_value(&state).unwrap();
    let mut invalid = legacy.clone();
    invalid["identities"]["one"]["future_field"] = json!("must not silently discard");
    sqlx::query("INSERT INTO kep_hosted.application_state VALUES (1,$1,7,clock_timestamp())")
        .bind(&invalid)
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query(
        "INSERT INTO kep_hosted.encrypted_archive (object_digest,encrypted_bytes) VALUES ($1,$2)",
    )
    .bind(vec![1u8; 32])
    .bind(vec![2u8; 16])
    .execute(&pool)
    .await
    .unwrap();
    sqlx::query("INSERT INTO kep_hosted.event_journal (event_type,entity_id,event_json,previous_event_digest,event_digest) VALUES ('historical','one','{}',$1,$2)").bind(vec![0u8;32]).bind(vec![3u8;32]).execute(&pool).await.unwrap();
    let error = Persistence::postgres(&url).await.err().unwrap();
    assert!(error.contains("lose fields"), "{error}");
    let table: Option<String> =
        sqlx::query_scalar("SELECT to_regclass('kep_hosted.state_documents')::text")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(
        table.is_none(),
        "failed migration must roll back schema too"
    );
    let stored: Value = sqlx::query_scalar("SELECT state_json FROM kep_hosted.application_state")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(stored, invalid);
    sqlx::query("UPDATE kep_hosted.application_state SET state_json=$1")
        .bind(&legacy)
        .execute(&pool)
        .await
        .unwrap();
    let baseline: Value =
        sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.application_state s")
            .fetch_one(&pool)
            .await
            .unwrap();
    let archive: Value =
        sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.encrypted_archive s")
            .fetch_one(&pool)
            .await
            .unwrap();
    let historical_event: Value =
        sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.event_journal s WHERE event_id=1")
            .fetch_one(&pool)
            .await
            .unwrap();
    let writer = open(&url).await;
    assert_eq!(
        serde_json::to_value(writer.load().await.unwrap()).unwrap(),
        legacy
    );
    let marker: Vec<u8> =
        sqlx::query_scalar("SELECT legacy_state_sha256 FROM kep_hosted.state_layout")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(
        marker,
        Sha256::digest(legacy.to_string().as_bytes()).to_vec()
    );
    sqlx::query("CREATE TABLE public.test_touches (collection text, id text)")
        .execute(&pool)
        .await
        .unwrap();
    sqlx::query("CREATE FUNCTION public.test_touch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN INSERT INTO public.test_touches VALUES (COALESCE(NEW.collection,OLD.collection),COALESCE(NEW.record_id,OLD.record_id)); RETURN COALESCE(NEW,OLD); END $$").execute(&pool).await.unwrap();
    sqlx::query("CREATE TRIGGER test_touch AFTER INSERT OR UPDATE OR DELETE ON kep_hosted.state_documents FOR EACH ROW EXECUTE FUNCTION public.test_touch()").execute(&pool).await.unwrap();
    writer.save(&state, "noop", "one").await.unwrap();
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM public.test_touches")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(
        count, 0,
        "unchanged documents must receive no SQL mutations"
    );
    state
        .identities
        .get_mut("one")
        .unwrap()
        .encryption_key_version = 2;
    state.consumed_operations.insert("new-operation".into());
    writer.save(&state, "changed", "one").await.unwrap();
    let touches: Vec<(String, String)> =
        sqlx::query_as("SELECT collection,id FROM public.test_touches ORDER BY collection,id")
            .fetch_all(&pool)
            .await
            .unwrap();
    assert_eq!(
        touches,
        vec![
            ("consumed_operations".into(), "new-operation".into()),
            ("identities".into(), "one".into())
        ]
    );
    let committed = serde_json::to_value(&state).unwrap();
    sqlx::query("CREATE TRIGGER test_fail BEFORE INSERT ON kep_hosted.event_journal FOR EACH STATEMENT EXECUTE FUNCTION kep_hosted.reject_immutable_mutation()").execute(&pool).await.unwrap();
    state
        .identities
        .get_mut("one")
        .unwrap()
        .encryption_key_version = 3;
    state.identities.remove("untouched");
    assert!(writer.save(&state, "retry", "one").await.is_err());
    assert_eq!(
        serde_json::to_value(writer.load().await.unwrap()).unwrap(),
        committed
    );
    let count: i64 = sqlx::query_scalar("SELECT count(*) FROM public.test_touches")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(
        count, 2,
        "rolled-back document writes must leave no touches"
    );
    sqlx::query("DROP TRIGGER test_fail ON kep_hosted.event_journal")
        .execute(&pool)
        .await
        .unwrap();
    writer.save(&state, "retry", "one").await.unwrap();
    assert_eq!(
        serde_json::to_value(writer.load().await.unwrap()).unwrap(),
        serde_json::to_value(&state).unwrap()
    );
    let events = sqlx::query("SELECT event_json,previous_event_digest,event_digest FROM kep_hosted.event_journal WHERE event_id>1 ORDER BY event_id").fetch_all(&pool).await.unwrap();
    let mut previous = vec![3u8; 32];
    for event in events {
        let value: Value = event.get("event_json");
        assert_eq!(event.get::<Vec<u8>, _>("previous_event_digest"), previous);
        let mut hash = Sha256::new();
        hash.update(b"CA2-KEP-HOSTED-EVENT-v1");
        hash.update(&previous);
        hash.update(value.to_string().as_bytes());
        previous = hash.finalize().to_vec();
        assert_eq!(event.get::<Vec<u8>, _>("event_digest"), previous);
    }
    let last: Value = sqlx::query_scalar(
        "SELECT event_json FROM kep_hosted.event_journal ORDER BY event_id DESC LIMIT 1",
    )
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        last["state_sha256"],
        hex::encode(Sha256::digest(
            serde_json::to_vec(&serde_json::to_value(&state).unwrap()).unwrap()
        ))
    );
    for statement in [
        "UPDATE kep_hosted.application_state SET revision=revision+1",
        "DELETE FROM kep_hosted.application_state",
        "INSERT INTO kep_hosted.application_state VALUES (1,'{}',1,clock_timestamp())",
        "TRUNCATE kep_hosted.application_state",
        "DELETE FROM kep_hosted.state_layout",
    ] {
        assert!(
            sqlx::query(statement).execute(&pool).await.is_err(),
            "legacy binary write or marker destruction allowed: {statement}"
        );
    }
    drop(writer);
    let restarted = open(&url).await;
    assert_eq!(
        serde_json::to_value(restarted.load().await.unwrap()).unwrap(),
        serde_json::to_value(&state).unwrap()
    );
    let after: Value = sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.application_state s")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(after, baseline);
    let after: Value = sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.encrypted_archive s")
        .fetch_one(&pool)
        .await
        .unwrap();
    assert_eq!(after, archive);
    let after: Value =
        sqlx::query_scalar("SELECT to_jsonb(s) FROM kep_hosted.event_journal s WHERE event_id=1")
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(after, historical_event);
}
