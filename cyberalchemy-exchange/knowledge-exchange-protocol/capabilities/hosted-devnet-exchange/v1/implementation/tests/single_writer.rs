use cyberalchemy_kep_hosted_devnet::{model::Database, store::Persistence};
use sqlx::Row;

#[tokio::test]
#[ignore = "requires CA2_KEP_WRITER_TEST_DATABASE_URL naming a disposable database"]
async fn writer_exclusion_takeover_and_connection_loss_fence_stale_state() {
    let url = std::env::var("CA2_KEP_WRITER_TEST_DATABASE_URL").unwrap();
    let first = Persistence::postgres(&url).await.unwrap();
    assert!(first.ready().await);
    let clone = first.clone();
    let state = Database::default();
    first.save(&state, "first", "test").await.unwrap();
    assert!(Persistence::postgres(&url)
        .await
        .err()
        .unwrap()
        .contains("active writer"));
    drop(first);
    assert!(
        Persistence::postgres(&url).await.is_err(),
        "a live clone owns the connection"
    );
    drop(clone);
    // Socket teardown can be processed asynchronously by PostgreSQL.
    let mut replacement = None;
    for _ in 0..50 {
        if let Ok(writer) = Persistence::postgres(&url).await {
            replacement = Some(writer);
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(20)).await;
    }
    let old = replacement.expect("replacement after shutdown");
    old.save(&state, "replacement", "test").await.unwrap();
    let admin = sqlx::PgPool::connect(&url).await.unwrap();
    let pid: i32 = sqlx::query("SELECT pid FROM pg_locks WHERE locktype='advisory' AND classid=1262833713 AND objid=1 AND database=(SELECT oid FROM pg_database WHERE datname=current_database())")
        .fetch_one(&admin).await.unwrap().get("pid");
    let terminated: bool = sqlx::query_scalar("SELECT pg_terminate_backend($1)")
        .bind(pid)
        .fetch_one(&admin)
        .await
        .unwrap();
    assert!(terminated);
    assert!(!old.ready().await, "terminated writer must fail readiness");
    assert!(old
        .save(&state, "stale_before_takeover", "test")
        .await
        .is_err());
    let new = Persistence::postgres(&url).await.unwrap();
    assert!(new.ready().await);
    new.save(&state, "new_writer", "test").await.unwrap();
    assert!(old
        .save(&state, "stale_after_takeover", "test")
        .await
        .is_err());
    let stale: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM kep_hosted.event_journal WHERE event_type LIKE 'stale_%'",
    )
    .fetch_one(&admin)
    .await
    .unwrap();
    assert_eq!(stale, 0);
    let latest: String = sqlx::query_scalar(
        "SELECT event_type FROM kep_hosted.event_journal ORDER BY event_id DESC LIMIT 1",
    )
    .fetch_one(&admin)
    .await
    .unwrap();
    assert_eq!(latest, "new_writer");
}
