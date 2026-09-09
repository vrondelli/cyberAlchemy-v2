use cyberalchemy_kep_hosted_devnet::{
    limits::Limits,
    model::{Database, KnowledgeIdentity},
    shared_state::SharedMap,
};
use serde::{Serialize, Serializer};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

#[derive(Clone)]
struct Counted {
    calls: Arc<AtomicUsize>,
    value: u64,
}
impl Serialize for Counted {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        self.calls.fetch_add(1, Ordering::SeqCst);
        self.value.serialize(s)
    }
}
#[test]
fn shared_encodings_are_built_once_and_all_mutations_invalidate() {
    let calls = Arc::new(AtomicUsize::new(0));
    let mut map = SharedMap::default();
    for i in 0..256 {
        map.insert(
            i.to_string(),
            Counted {
                calls: calls.clone(),
                value: i,
            },
        );
    }
    std::thread::scope(|scope| {
        for _ in 0..8 {
            let snapshot = map.clone();
            scope.spawn(move || {
                snapshot.encoding().unwrap();
            });
        }
    });
    assert_eq!(calls.load(Ordering::SeqCst), 256);
    let original = map.clone();
    let hash = original.encoding().unwrap().records["0"].digest;
    map.get_mut("0").unwrap().value = 999;
    assert_ne!(map.encoding().unwrap().records["0"].digest, hash);
    assert_eq!(original.encoding().unwrap().records["0"].digest, hash);
    assert_eq!(calls.load(Ordering::SeqCst), 512);
    map.insert(
        "new".into(),
        Counted {
            calls: calls.clone(),
            value: 42,
        },
    );
    assert!(map.encoding().unwrap().records.contains_key("new"));
    map.remove("new");
    assert!(!map.encoding().unwrap().records.contains_key("new"));
    map.insert(
        "0".into(),
        Counted {
            calls: calls.clone(),
            value: 123,
        },
    );
    assert_eq!(map.encoding().unwrap().records["0"].json, b"123");
    let count = calls.load(Ordering::SeqCst);
    assert!(map.get_mut("missing").is_none());
    assert!(map.remove("missing").is_none());
    map.encoding().unwrap();
    assert_eq!(calls.load(Ordering::SeqCst), count);
}
fn oracle(db: &Database) {
    let canonical = serde_json::to_value(db).unwrap();
    let bytes = serde_json::to_vec(&canonical).unwrap();
    let metadata = db.metadata().unwrap();
    assert_eq!(metadata.byte_len(), bytes.len());
    assert_eq!(metadata.byte_len(), serde_json::to_vec(db).unwrap().len());
    assert_eq!(
        metadata.digest().as_slice(),
        Sha256::digest(&bytes).as_slice()
    );
    for ((collection, key), (bytes, digest)) in metadata.documents() {
        let expected = if collection == "consumed_operations" {
            json!(true)
        } else {
            canonical[&collection][&key].clone()
        };
        assert_eq!(
            serde_json::from_slice::<serde_json::Value>(bytes).unwrap(),
            expected
        );
        assert_eq!(digest.as_slice(), Sha256::digest(bytes).as_slice());
    }
}
#[test]
fn cached_bytes_hashes_and_quota_boundaries_match_full_serializer_after_edits() {
    let mut state = Database::default();
    oracle(&state);
    for i in 0..40 {
        let before = state.clone();
        state.identities.insert(
            format!("escaped-\"\\\n-é-{i}"),
            KnowledgeIdentity {
                identity_id: format!("{i}"),
                wallet_public_key: "wallet".into(),
                encryption_public_key: "key".into(),
                encryption_key_version: u64::MAX - i,
            },
        );
        state
            .consumed_operations
            .insert(format!("operation-\n-{i}"));
        oracle(&state);
        let n = serde_json::to_vec(&state).unwrap().len();
        assert!(Limits {
            metadata_bytes: n,
            ..Limits::default()
        }
        .validate_growth(&before, &state)
        .is_ok());
        assert!(Limits {
            metadata_bytes: n - 1,
            ..Limits::default()
        }
        .validate_growth(&before, &state)
        .is_err());
    }
    let snapshot = state.clone();
    let old_hash = snapshot.metadata().unwrap().digest();
    state
        .identities
        .get_mut("escaped-\"\\\n-é-0")
        .unwrap()
        .encryption_public_key = "replacement".repeat(20);
    state.identities.remove("escaped-\"\\\n-é-1");
    state.consumed_operations.clear();
    oracle(&state);
    oracle(&snapshot);
    assert_eq!(snapshot.metadata().unwrap().digest(), old_hash);
    assert_ne!(state.metadata().unwrap().digest(), old_hash);
    let loaded: Database = serde_json::from_slice(&serde_json::to_vec(&state).unwrap()).unwrap();
    oracle(&loaded);
    let before = state.clone();
    let digest = state.metadata().unwrap().digest();
    state.file_payloads.insert("file".into(), "x".repeat(4096));
    assert_eq!(state.metadata().unwrap().digest(), digest);
    let limit = state.metadata().unwrap().byte_len() + 4095;
    assert!(Limits {
        stored_bytes: limit,
        ..Limits::default()
    }
    .validate_growth(&before, &state)
    .is_err());
}
#[test]
fn warmed_wallet_quota_detects_identity_reassignment() {
    let mut state:Database=serde_json::from_value(json!({
        "accounts":{},"files":{},"client_errors":{},"grants":{},"reissues":{},"consumed_operations":[],
        "identities":{
            "a":{"identity_id":"a","wallet_public_key":"one","encryption_public_key":"key","encryption_key_version":1},
            "b":{"identity_id":"b","wallet_public_key":"two","encryption_public_key":"key","encryption_key_version":1}},
        "artifacts":{
            "a":{"artifact_version_id":"a","originator_id":"a","policy_id":"policy","encryption_epoch":1,"ciphertext_base64":"AAAA","ciphertext_sha256":"digest","owners":["a"],"envelopes":{},"revision":0},
            "b":{"artifact_version_id":"b","originator_id":"b","policy_id":"policy","encryption_epoch":1,"ciphertext_base64":"BBBB","ciphertext_sha256":"digest","owners":["b"],"envelopes":{},"revision":0}}
    })).unwrap();
    oracle(&state);
    let limit = Limits {
        wallet_bytes: 4,
        ..Limits::default()
    };
    let before = state.clone();
    assert!(limit.validate_growth(&before, &state).is_ok());
    state.identities.get_mut("b").unwrap().wallet_public_key = "one".into();
    assert!(limit.validate_growth(&before, &state).is_err());
    oracle(&state);
}
