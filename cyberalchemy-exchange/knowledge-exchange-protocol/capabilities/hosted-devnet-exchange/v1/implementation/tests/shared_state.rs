use cyberalchemy_kep_hosted_devnet::{model::Database, shared_state::SharedMap};
use serde_json::json;
use std::{
    collections::BTreeMap,
    sync::{
        atomic::{AtomicUsize, Ordering},
        Arc,
    },
};

#[derive(Debug)]
struct Counted {
    copies: Arc<AtomicUsize>,
    bytes: Vec<u8>,
}
impl Clone for Counted {
    fn clone(&self) -> Self {
        self.copies.fetch_add(1, Ordering::SeqCst);
        Self {
            copies: self.copies.clone(),
            bytes: self.bytes.clone(),
        }
    }
}

#[test]
fn snapshot_and_index_changes_never_copy_untouched_records() {
    let copies = Arc::new(AtomicUsize::new(0));
    let mut original = SharedMap::default();
    for i in 0..1024 {
        original.insert(
            format!("record-{i}"),
            Counted {
                copies: copies.clone(),
                bytes: vec![7; 16_384],
            },
        );
    }
    let snapshots: Vec<_> = (0..50).map(|_| original.clone()).collect();
    assert_eq!(copies.load(Ordering::SeqCst), 0);
    let mut candidate = snapshots[0].clone();
    candidate.insert(
        "added".into(),
        Counted {
            copies: copies.clone(),
            bytes: vec![1],
        },
    );
    candidate.remove("record-2");
    assert_eq!(
        copies.load(Ordering::SeqCst),
        0,
        "index changes must only clone shared pointers"
    );
    assert!(std::ptr::eq(
        original.get("record-1").unwrap(),
        candidate.get("record-1").unwrap()
    ));
    candidate.get_mut("record-0").unwrap().bytes[0] = 9;
    candidate.get_mut("record-0").unwrap().bytes[1] = 9;
    assert_eq!(
        copies.load(Ordering::SeqCst),
        1,
        "detach only the edited record, once"
    );
    assert_eq!(original["record-0"].bytes[0], 7);
    assert!(original.contains_key("record-2"));
    assert!(!original.contains_key("added"));
    assert!(candidate.get_mut("missing").is_none());
    drop(candidate); // Abandoning a candidate is rollback; all snapshots remain intact.
    for snapshot in snapshots {
        assert_eq!(snapshot["record-0"].bytes[0], 7);
        assert_eq!(snapshot.len(), 1024);
    }
}

#[test]
fn database_snapshots_share_file_bytes_and_isolate_expiry_and_replay_changes() {
    let legacy = json!({
        "accounts": {}, "files": {"file": {
            "original_bytes": 10_000_000, "retention_policy":"kep-file-retention-v1",
            "upload_message":"signed", "accepted_by":"a", "accepted_at":1,
            "last_download_at":null, "expires_at":null, "expired_at":null, "attempts":{}
        }},
        "identities":{"a":{"identity_id":"a","wallet_public_key":"wallet","encryption_public_key":"key","encryption_key_version":1}},
        "artifacts":{}, "grants":{}, "reissues":{}, "consumed_operations":["old"], "client_errors":{}
    });
    let mut original: Database = serde_json::from_value(legacy.clone()).unwrap();
    original
        .file_payloads
        .insert("file".into(), "x".repeat(10_000_000));
    let mut candidate = original.clone();
    assert!(std::ptr::eq(
        original.file_payloads["file"].as_ptr(),
        candidate.file_payloads["file"].as_ptr()
    ));
    assert!(std::ptr::eq(
        original.files.get("file").unwrap(),
        candidate.files.get("file").unwrap()
    ));
    candidate.files.get_mut("file").unwrap().expired_at = Some(2);
    candidate
        .file_payloads
        .insert("second".into(), "y".repeat(1024));
    assert!(
        std::ptr::eq(
            original.file_payloads["file"].as_ptr(),
            candidate.file_payloads["file"].as_ptr()
        ),
        "payload index detachment must not copy retained bytes"
    );
    candidate.file_payloads.remove("file");
    candidate.consumed_operations.insert("new".into());
    assert_eq!(original.file_payloads["file"].len(), 10_000_000);
    assert_eq!(original.files["file"].expired_at, None);
    assert!(!original.consumed_operations.contains("new"));
    assert!(std::ptr::eq(
        original.identities.get("a").unwrap(),
        candidate.identities.get("a").unwrap()
    ));
    assert_eq!(
        serde_json::to_value(&original).unwrap(),
        legacy,
        "wire and journal metadata must not change or include payloads"
    );
    let restored: Database =
        serde_json::from_value(serde_json::to_value(&candidate).unwrap()).unwrap();
    assert_eq!(restored.files["file"].expired_at, Some(2));
    assert!(
        restored.file_payloads.is_empty(),
        "payload recovery remains the separate store's responsibility"
    );
}

#[test]
fn shared_map_preserves_canonical_map_encoding_and_replacement_isolation() {
    let ordinary: BTreeMap<String, _> = [
        ("z".into(), json!({"n":2})),
        ("ä".into(), json!(null)),
        ("a".into(), json!([1, 2])),
    ]
    .into_iter()
    .collect();
    let mut shared: SharedMap<_> = ordinary.clone().into_iter().collect();
    assert_eq!(
        serde_json::to_vec(&ordinary).unwrap(),
        serde_json::to_vec(&shared).unwrap()
    );
    let snapshot = shared.clone();
    shared.insert("z".into(), json!({"n":3}));
    assert_eq!(snapshot["z"]["n"], 2);
    let restored: SharedMap<serde_json::Value> =
        serde_json::from_slice(&serde_json::to_vec(&shared).unwrap()).unwrap();
    assert_eq!(restored["z"]["n"], 3);
}
