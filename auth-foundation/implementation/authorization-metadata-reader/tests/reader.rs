use auth_foundation_authorization_metadata_reader::{authentication_metadata, route_revision};
use rusqlite::{Connection, params};

#[test]
fn reads_only_valid_metadata_in_the_same_transaction() {
    let mut connection = Connection::open_in_memory().unwrap();
    connection
        .execute_batch(
            "CREATE TABLE auth_authentication_evidence (
                evidence_row_id INTEGER PRIMARY KEY,
                evidence_revision INTEGER NOT NULL,
                authenticated_subject_id TEXT NOT NULL
            );
            CREATE TABLE auth_route_authorization_bindings (
                binding_row_id INTEGER PRIMARY KEY,
                binding_revision INTEGER NOT NULL
            );",
        )
        .unwrap();
    let transaction = connection.transaction().unwrap();
    for (id, revision, subject) in [(1, 7, "subject"), (2, -1, "subject"), (3, 8, "")] {
        transaction
            .execute(
                "INSERT INTO auth_authentication_evidence VALUES (?1, ?2, ?3)",
                params![id, revision, subject],
            )
            .unwrap();
    }
    for (id, revision) in [(1, 11), (2, -1)] {
        transaction
            .execute(
                "INSERT INTO auth_route_authorization_bindings VALUES (?1, ?2)",
                params![id, revision],
            )
            .unwrap();
    }

    assert_eq!(
        authentication_metadata(&transaction, 1),
        Some((7, "subject".into()))
    );
    assert_eq!(authentication_metadata(&transaction, 2), None);
    assert_eq!(authentication_metadata(&transaction, 3), None);
    assert_eq!(authentication_metadata(&transaction, 4), None);
    assert_eq!(authentication_metadata(&transaction, u64::MAX), None);
    assert_eq!(route_revision(&transaction, 1), Some(11));
    assert_eq!(route_revision(&transaction, 2), None);
    assert_eq!(route_revision(&transaction, 3), None);
    assert_eq!(route_revision(&transaction, u64::MAX), None);
}
