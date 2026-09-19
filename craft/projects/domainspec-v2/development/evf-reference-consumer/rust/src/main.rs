use std::env;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Component, Path, PathBuf};

use serde_json::{Map, Value, json};
use sha2::{Digest, Sha256};

const STAGE_IDS: [&str; 13] = [
    "S0", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12",
];

fn sha256(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn canonical(value: &Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.iter().map(canonical).collect()),
        Value::Object(values) => {
            let mut keys: Vec<_> = values.keys().collect();
            keys.sort();
            let mut result = Map::new();
            for key in keys {
                result.insert(key.clone(), canonical(&values[key]));
            }
            Value::Object(result)
        }
        other => other.clone(),
    }
}

fn digest(value: &Value) -> Result<String, String> {
    serde_json::to_vec(&canonical(value))
        .map(|bytes| sha256(&bytes))
        .map_err(|error| error.to_string())
}

fn object<'a>(value: &'a Value, label: &str) -> Result<&'a Map<String, Value>, String> {
    value
        .as_object()
        .ok_or_else(|| format!("{label} must be an object"))
}

fn text<'a>(object: &'a Map<String, Value>, field: &str) -> Result<&'a str, String> {
    object
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("{field} must be a string"))
}

fn payload_digest(value: &Value, field: &str) -> Result<String, String> {
    let mut value = value.clone();
    object(&value, "digest payload")?;
    value.as_object_mut().unwrap().remove(field);
    digest(&value)
}

fn safe_repo_ref(root: &Path, path: &Path) -> Result<Value, String> {
    let root = fs::canonicalize(root).map_err(|error| error.to_string())?;
    let path = fs::canonicalize(path).map_err(|error| error.to_string())?;
    if !path.starts_with(&root) {
        return Err("consumer evidence must be inside the repository".to_owned());
    }
    let relative = path
        .strip_prefix(&root)
        .map_err(|error| error.to_string())?;
    if relative.components().any(|part| {
        matches!(
            part,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    }) {
        return Err("unsafe evidence path".to_owned());
    }
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    Ok(json!({
        "path": relative.to_string_lossy().replace('\\', "/"),
        "sha256": sha256(&bytes),
        "size_bytes": bytes.len(),
        "location": "repository",
        "current": true
    }))
}

fn verify_stage_chain(stages: &[Value], profile_id: &str) -> Result<(), String> {
    if stages.len() != STAGE_IDS.len() {
        return Err(format!("stage denominator mismatch: {}", stages.len()));
    }
    let mut previous: Option<(&str, &str)> = None;
    for (stage, expected_id) in stages.iter().zip(STAGE_IDS) {
        let stage_object = object(stage, "stage")?;
        let stage_id = text(stage_object, "stage_id")?;
        if stage_id != expected_id
            || text(stage_object, "schema_version")? != "evf.stage-receipt/v1"
            || text(stage_object, "profile_id")? != profile_id
            || text(stage_object, "state")? != "passed"
            || text(stage_object, "authority_effect")? != "none"
        {
            return Err(format!("consumer rejected stage {stage_id}"));
        }
        let declared = text(stage_object, "receipt_payload_digest")?;
        if payload_digest(stage, "receipt_payload_digest")? != declared {
            return Err(format!("stage digest mismatch: {stage_id}"));
        }
        let inputs = stage_object
            .get("input_stage_receipt_digests")
            .and_then(Value::as_object)
            .ok_or("stage input digest map missing")?;
        match previous {
            None if !inputs.is_empty() => return Err("S0 has unexpected predecessor".to_owned()),
            Some((previous_id, previous_digest))
                if inputs.len() != 1
                    || inputs.get(previous_id).and_then(Value::as_str) != Some(previous_digest) =>
            {
                return Err(format!("stage predecessor mismatch: {stage_id}"));
            }
            _ => {}
        }
        previous = Some((stage_id, declared));
    }
    Ok(())
}

fn accept(root: &Path, evidence_path: &Path, expected_profile: &str) -> Result<Value, String> {
    let bytes = fs::read(evidence_path).map_err(|error| error.to_string())?;
    let evidence: Value = serde_json::from_slice(&bytes).map_err(|error| error.to_string())?;
    let aggregate = object(&evidence, "EVF aggregate")?;
    if text(aggregate, "schema_version")? != "evf.evolvable-validation-receipt/v1"
        || text(aggregate, "profile_id")? != expected_profile
        || text(aggregate, "route")? != "multi_provider"
        || text(aggregate, "aggregate_state")? != "passed"
        || text(aggregate, "authority_effect")? != "none"
        || text(aggregate, "release_admission")? != "not-granted"
    {
        return Err("aggregate contract is not acceptable to this consumer".to_owned());
    }
    if aggregate
        .get("all_required_stages_present")
        .and_then(Value::as_bool)
        != Some(true)
    {
        return Err("aggregate does not contain every required stage".to_owned());
    }
    let declared_digest = text(aggregate, "evidence_payload_digest")?;
    if payload_digest(&evidence, "evidence_payload_digest")? != declared_digest {
        return Err("aggregate evidence digest mismatch".to_owned());
    }
    let stages = aggregate
        .get("stage_receipts")
        .and_then(Value::as_array)
        .ok_or("stage receipts missing")?;
    verify_stage_chain(stages, expected_profile)?;
    let verification = aggregate
        .get("verification_receipt")
        .and_then(Value::as_object)
        .ok_or("verification receipt missing")?;
    if text(verification, "verdict")? != "passed"
        || text(verification, "authority_effect")? != "none"
        || verification
            .get("all_refs_current")
            .and_then(Value::as_bool)
            != Some(true)
        || verification.get("replay_equal").and_then(Value::as_bool) != Some(true)
    {
        return Err("independent verification receipt is not acceptable".to_owned());
    }
    let claim_ceiling = text(aggregate, "claim_ceiling")?;
    let mut receipt = json!({
        "schema_version": "evf.reference-consumer-receipt/v1",
        "consumer_id": "domainspec.evf-reference-consumer.v1",
        "accepted_profile_id": expected_profile,
        "accepted_evidence_payload_digest": declared_digest,
        "evidence_ref": safe_repo_ref(root, evidence_path)?,
        "decision": "accepted-as-bounded-evidence",
        "aggregate_state": "passed",
        "verified_stage_ids": STAGE_IDS,
        "preserved_claim_ceiling": claim_ceiling,
        "authority_effect": "none",
        "receipt_payload_digest": ""
    });
    let receipt_digest = payload_digest(&receipt, "receipt_payload_digest")?;
    receipt["receipt_payload_digest"] = Value::String(receipt_digest);
    Ok(receipt)
}

fn argument(args: &[String], flag: &str) -> Result<PathBuf, String> {
    let index = args
        .iter()
        .position(|value| value == flag)
        .ok_or_else(|| format!("missing {flag}"))?;
    args.get(index + 1)
        .map(PathBuf::from)
        .ok_or_else(|| format!("missing value for {flag}"))
}

fn argument_text(args: &[String], flag: &str) -> Result<String, String> {
    Ok(argument(args, flag)?.to_string_lossy().into_owned())
}

fn run() -> Result<Value, String> {
    let args: Vec<String> = env::args().skip(1).collect();
    let root = argument(&args, "--repo-root")?;
    let evidence = argument(&args, "--evidence")?;
    let expected_profile = argument_text(&args, "--expected-profile")?;
    let output = argument(&args, "--output")?;
    let receipt = accept(&root, &evidence, &expected_profile)?;
    let parent = output.parent().ok_or("output path has no parent")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let mut file = OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&output)
        .map_err(|error| format!("consumer receipt is append-only: {error}"))?;
    let mut bytes = serde_json::to_vec_pretty(&receipt).map_err(|error| error.to_string())?;
    bytes.push(b'\n');
    file.write_all(&bytes).map_err(|error| error.to_string())?;
    file.sync_all().map_err(|error| error.to_string())?;
    Ok(json!({
        "status": "accepted-as-bounded-evidence",
        "receipt_path": output,
        "receipt_payload_digest": receipt["receipt_payload_digest"],
        "authority_effect": "none"
    }))
}

fn main() {
    match run() {
        Ok(value) => println!("{}", serde_json::to_string(&value).unwrap()),
        Err(error) => {
            eprintln!(
                "{}",
                serde_json::to_string(&json!({
                    "status": "rejected",
                    "reason": error,
                    "authority_effect": "none"
                }))
                .unwrap()
            );
            std::process::exit(2);
        }
    }
}
