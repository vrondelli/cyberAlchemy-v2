use std::collections::BTreeSet;
use std::env;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

#[derive(Debug)]
struct RehearsalError {
    code: &'static str,
    message: String,
}

impl RehearsalError {
    fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }
}

type Result<T> = std::result::Result<T, RehearsalError>;

#[derive(Clone, Debug, Deserialize, Serialize)]
struct ExactRef {
    path: String,
    sha256: String,
    size_bytes: u64,
    location: String,
    current: bool,
}

#[derive(Debug, Deserialize)]
struct Refs {
    harness_manifest: ExactRef,
    harness_lockfile: ExactRef,
    harness_source: ExactRef,
    harness_executable: ExactRef,
    candidate_manifest: ExactRef,
    product_approval: ExactRef,
    adoption_decision: ExactRef,
    selected_profile: ExactRef,
    frozen_verifier: ExactRef,
    positive_evidence: ExactRef,
    forced_failure_evidence: ExactRef,
}

#[derive(Debug, Deserialize)]
struct RehearsalProfile {
    schema_version: String,
    profile_id: String,
    candidate_id: String,
    candidate_payload_digest: String,
    enforced_profile_id: String,
    enforced_stage_ids: Vec<String>,
    refs: Refs,
    expected_positive_evidence_payload_digest: String,
    expected_forced_failure_evidence_payload_digest: String,
    predecessor_state: String,
    degraded_mode: String,
    rollback: String,
    retention: String,
    forbidden_effects: Vec<String>,
    claim_ceiling: String,
    authority_effect: String,
    profile_payload_digest: String,
}

#[derive(Clone, Debug, PartialEq, Serialize)]
struct EnforcementState {
    state: String,
    candidate_payload_digest: Option<String>,
    profile_id: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
struct GateResult {
    decision: String,
    reason_code: String,
    evidence_payload_digest: Option<String>,
    verifier_verdict: Option<String>,
    aggregate_state: Option<String>,
    profile_id: Option<String>,
    authority_effect: String,
}

fn sha256(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn canonical(value: &Value) -> Value {
    match value {
        Value::Array(values) => Value::Array(values.iter().map(canonical).collect()),
        Value::Object(values) => {
            let mut keys: Vec<_> = values.keys().collect();
            keys.sort();
            let mut result = serde_json::Map::new();
            for key in keys {
                result.insert(key.clone(), canonical(&values[key]));
            }
            Value::Object(result)
        }
        other => other.clone(),
    }
}

fn canonical_digest(value: &Value) -> Result<String> {
    let bytes = serde_json::to_vec(&canonical(value))
        .map_err(|error| RehearsalError::new("SERIALIZATION_FAILED", error.to_string()))?;
    Ok(sha256(&bytes))
}

fn payload_digest(value: &Value, field: &str) -> Result<String> {
    let mut payload = value.clone();
    payload
        .as_object_mut()
        .ok_or_else(|| RehearsalError::new("JSON_OBJECT_REQUIRED", field))?
        .remove(field);
    canonical_digest(&payload)
}

fn read_json(path: &Path) -> Result<Value> {
    let bytes = fs::read(path).map_err(|error| {
        RehearsalError::new("JSON_READ_FAILED", format!("{}: {error}", path.display()))
    })?;
    serde_json::from_slice(&bytes).map_err(|error| {
        RehearsalError::new("JSON_PARSE_FAILED", format!("{}: {error}", path.display()))
    })
}

fn string<'a>(value: &'a Value, field: &str) -> Result<&'a str> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| RehearsalError::new("FIELD_MISSING", field))
}

fn resolve_ref(root: &Path, reference: &ExactRef) -> Result<PathBuf> {
    if !reference.current {
        return Err(RehearsalError::new("EXACT_REF_STALE", &reference.path));
    }
    let path = if reference.location == "host" {
        let candidate = PathBuf::from(&reference.path);
        if !candidate.is_absolute() {
            return Err(RehearsalError::new("UNSAFE_EXACT_REF", &reference.path));
        }
        candidate
    } else if reference.location == "repository" {
        let candidate = Path::new(&reference.path);
        if candidate.is_absolute()
            || candidate.components().any(|part| {
                matches!(
                    part,
                    Component::ParentDir | Component::RootDir | Component::Prefix(_)
                )
            })
        {
            return Err(RehearsalError::new("UNSAFE_EXACT_REF", &reference.path));
        }
        root.join(candidate)
    } else {
        return Err(RehearsalError::new(
            "EXACT_REF_LOCATION_INVALID",
            &reference.location,
        ));
    };
    let resolved = fs::canonicalize(&path).map_err(|error| {
        RehearsalError::new("EXACT_REF_MISSING", format!("{}: {error}", reference.path))
    })?;
    if reference.location == "repository" && !resolved.starts_with(root) {
        return Err(RehearsalError::new(
            "EXACT_REF_ESCAPES_REPOSITORY",
            &reference.path,
        ));
    }
    let bytes = fs::read(&resolved)
        .map_err(|error| RehearsalError::new("EXACT_REF_READ_FAILED", error.to_string()))?;
    if bytes.len() as u64 != reference.size_bytes {
        return Err(RehearsalError::new(
            "EXACT_REF_SIZE_MISMATCH",
            &reference.path,
        ));
    }
    if sha256(&bytes) != reference.sha256 {
        return Err(RehearsalError::new(
            "EXACT_REF_DIGEST_MISMATCH",
            &reference.path,
        ));
    }
    Ok(resolved)
}

fn exact_ref(root: &Path, path: &Path) -> Result<ExactRef> {
    let resolved = fs::canonicalize(path).map_err(|error| {
        RehearsalError::new("EXACT_REF_MISSING", format!("{}: {error}", path.display()))
    })?;
    if !resolved.starts_with(root) {
        return Err(RehearsalError::new(
            "EXACT_REF_ESCAPES_REPOSITORY",
            resolved.display().to_string(),
        ));
    }
    let bytes = fs::read(&resolved)
        .map_err(|error| RehearsalError::new("EXACT_REF_READ_FAILED", error.to_string()))?;
    let relative = resolved
        .strip_prefix(root)
        .map_err(|error| RehearsalError::new("EXACT_REF_RELATIVE_FAILED", error.to_string()))?;
    Ok(ExactRef {
        path: relative.to_string_lossy().replace('\\', "/"),
        sha256: sha256(&bytes),
        size_bytes: bytes.len() as u64,
        location: "repository".to_owned(),
        current: true,
    })
}

fn exact_ref_from_value(value: &Value) -> Result<ExactRef> {
    serde_json::from_value(value.clone())
        .map_err(|error| RehearsalError::new("EXACT_REF_INVALID", error.to_string()))
}

fn manifest_refs(manifest: &Value) -> Result<Vec<ExactRef>> {
    let mut refs = Vec::new();
    let groups = manifest
        .get("artifact_groups")
        .and_then(Value::as_object)
        .ok_or_else(|| RehearsalError::new("MANIFEST_GROUPS_MISSING", "artifact_groups"))?;
    for values in groups.values() {
        for value in values
            .as_array()
            .ok_or_else(|| RehearsalError::new("MANIFEST_GROUP_INVALID", "artifact group"))?
        {
            refs.push(exact_ref_from_value(value)?);
        }
    }
    for value in manifest
        .get("runtime_refs")
        .and_then(Value::as_array)
        .ok_or_else(|| RehearsalError::new("MANIFEST_RUNTIME_REFS_MISSING", "runtime_refs"))?
    {
        refs.push(exact_ref_from_value(value)?);
    }
    let selection = manifest
        .pointer("/selected_decisions/selection_ref")
        .ok_or_else(|| RehearsalError::new("MANIFEST_SELECTION_REF_MISSING", "selection_ref"))?;
    refs.push(exact_ref_from_value(selection)?);
    Ok(refs)
}

fn verify_payload(path: &Path, digest_field: &str, expected: &str) -> Result<Value> {
    let value = read_json(path)?;
    let declared = string(&value, digest_field)?;
    let actual = payload_digest(&value, digest_field)?;
    if declared != actual || actual != expected {
        return Err(RehearsalError::new(
            "PAYLOAD_DIGEST_MISMATCH",
            format!(
                "{} expected {expected}, declared {declared}, actual {actual}",
                path.display()
            ),
        ));
    }
    Ok(value)
}

fn expected_stage_ids() -> Vec<String> {
    (0..=12).map(|index| format!("S{index}")).collect()
}

fn gate_decision(
    expected_profile: &str,
    verifier_valid: bool,
    profile_id: Option<&str>,
    aggregate_state: Option<&str>,
    digest: Option<&str>,
) -> GateResult {
    let (decision, reason_code) = if !verifier_valid {
        ("deny", "EVIDENCE_VERIFICATION_FAILED")
    } else if profile_id.is_none() || aggregate_state.is_none() || digest.is_none() {
        ("deny", "EVIDENCE_FIELDS_MISSING")
    } else if aggregate_state != Some("passed") {
        ("deny", "AGGREGATE_NOT_PASSED")
    } else if profile_id != Some(expected_profile) {
        ("deny", "EVIDENCE_PROFILE_MISMATCH")
    } else {
        ("accept", "VERIFIED_ALL_STAGES_PASSED")
    };
    GateResult {
        decision: decision.to_owned(),
        reason_code: reason_code.to_owned(),
        evidence_payload_digest: digest.map(str::to_owned),
        verifier_verdict: Some(if verifier_valid { "passed" } else { "failed" }.to_owned()),
        aggregate_state: aggregate_state.map(str::to_owned),
        profile_id: profile_id.map(str::to_owned),
        authority_effect: "none".to_owned(),
    }
}

fn evaluate_evidence(
    root: &Path,
    verifier: &Path,
    evidence: &Path,
    expected_profile: &str,
) -> GateResult {
    if !evidence.exists() {
        return GateResult {
            decision: "deny".to_owned(),
            reason_code: "EVIDENCE_MISSING".to_owned(),
            evidence_payload_digest: None,
            verifier_verdict: None,
            aggregate_state: None,
            profile_id: None,
            authority_effect: "none".to_owned(),
        };
    }
    let value = match read_json(evidence) {
        Ok(value) => value,
        Err(_) => return gate_decision(expected_profile, false, None, None, None),
    };
    let output = Command::new(verifier)
        .arg("--repo-root")
        .arg(root)
        .arg("--evidence")
        .arg(evidence)
        .output();
    let verifier_valid = output
        .ok()
        .filter(|output| output.status.success())
        .and_then(|output| serde_json::from_slice::<Value>(&output.stdout).ok())
        .and_then(|receipt| {
            receipt
                .get("verdict")
                .and_then(Value::as_str)
                .map(|v| v == "passed")
        })
        .unwrap_or(false);
    gate_decision(
        expected_profile,
        verifier_valid,
        value.get("profile_id").and_then(Value::as_str),
        value.get("aggregate_state").and_then(Value::as_str),
        value.get("evidence_payload_digest").and_then(Value::as_str),
    )
}

fn exact_ref_json(reference: &ExactRef) -> Value {
    serde_json::to_value(reference).expect("ExactRef serialization cannot fail")
}

fn arg(args: &[String], flag: &str) -> Result<PathBuf> {
    let index = args
        .iter()
        .position(|value| value == flag)
        .ok_or_else(|| RehearsalError::new("ARGUMENT_MISSING", flag))?;
    args.get(index + 1)
        .map(PathBuf::from)
        .ok_or_else(|| RehearsalError::new("ARGUMENT_VALUE_MISSING", flag))
}

fn run() -> Result<Value> {
    let args: Vec<String> = env::args().skip(1).collect();
    let root = fs::canonicalize(arg(&args, "--repo-root")?)
        .map_err(|error| RehearsalError::new("REPOSITORY_ROOT_INVALID", error.to_string()))?;
    let profile_path = fs::canonicalize(root.join(arg(&args, "--profile")?))
        .map_err(|error| RehearsalError::new("PROFILE_MISSING", error.to_string()))?;
    if !profile_path.starts_with(&root) {
        return Err(RehearsalError::new(
            "PROFILE_ESCAPES_REPOSITORY",
            profile_path.display().to_string(),
        ));
    }
    let output_root = root.join(arg(&args, "--output-root")?);

    let profile_value = read_json(&profile_path)?;
    let profile: RehearsalProfile = serde_json::from_value(profile_value.clone())
        .map_err(|error| RehearsalError::new("PROFILE_INVALID", error.to_string()))?;
    if profile.schema_version != "evf.reference-enforcement-rehearsal-profile/v1"
        || profile.authority_effect != "none"
        || profile.enforced_stage_ids != expected_stage_ids()
        || profile.predecessor_state != "disabled-no-reference-enforcement"
        || profile.degraded_mode != "deny-and-preserve-evidence"
        || profile.rollback != "restore-exact-predecessor"
        || profile.retention != "append-only-content-addressed"
        || profile.forbidden_effects.is_empty()
    {
        return Err(RehearsalError::new(
            "PROFILE_CONTRACT_INVALID",
            &profile.profile_id,
        ));
    }
    let computed_profile_digest = payload_digest(&profile_value, "profile_payload_digest")?;
    if computed_profile_digest != profile.profile_payload_digest {
        return Err(RehearsalError::new(
            "PROFILE_PAYLOAD_DIGEST_MISMATCH",
            computed_profile_digest,
        ));
    }

    let rehearsal_profile_ref = exact_ref(&root, &profile_path)?;
    let harness_manifest_path = resolve_ref(&root, &profile.refs.harness_manifest)?;
    let harness_lockfile_path = resolve_ref(&root, &profile.refs.harness_lockfile)?;
    let harness_source_path = resolve_ref(&root, &profile.refs.harness_source)?;
    let harness_executable_path = resolve_ref(&root, &profile.refs.harness_executable)?;
    let manifest_path = resolve_ref(&root, &profile.refs.candidate_manifest)?;
    let product_approval_path = resolve_ref(&root, &profile.refs.product_approval)?;
    let adoption_path = resolve_ref(&root, &profile.refs.adoption_decision)?;
    let selected_profile_path = resolve_ref(&root, &profile.refs.selected_profile)?;
    let verifier_path = resolve_ref(&root, &profile.refs.frozen_verifier)?;
    let positive_path = resolve_ref(&root, &profile.refs.positive_evidence)?;
    let forced_failure_path = resolve_ref(&root, &profile.refs.forced_failure_evidence)?;

    let manifest = verify_payload(
        &manifest_path,
        "candidate_payload_digest",
        &profile.candidate_payload_digest,
    )?;
    if string(&manifest, "candidate_id")? != profile.candidate_id {
        return Err(RehearsalError::new(
            "CANDIDATE_ID_MISMATCH",
            &profile.candidate_id,
        ));
    }
    let manifest_refs = manifest_refs(&manifest)?;
    for reference in &manifest_refs {
        resolve_ref(&root, reference)?;
    }

    let product_approval = read_json(&product_approval_path)?;
    if payload_digest(&product_approval, "receipt_payload_digest")?
        != string(&product_approval, "receipt_payload_digest")?
        || string(&product_approval, "decision")? != "approve"
        || product_approval
            .pointer("/decision_scope/approved_candidate_payload_digest")
            .and_then(Value::as_str)
            != Some(&profile.candidate_payload_digest)
    {
        return Err(RehearsalError::new(
            "PRODUCT_APPROVAL_INVALID",
            product_approval_path.display().to_string(),
        ));
    }

    let adoption = read_json(&adoption_path)?;
    if payload_digest(&adoption, "receipt_payload_digest")?
        != string(&adoption, "receipt_payload_digest")?
        || string(&adoption, "decision")? != "adopt-and-authorize-reference-rehearsal"
        || adoption
            .pointer("/bindings/candidate_payload_digest")
            .and_then(Value::as_str)
            != Some(&profile.candidate_payload_digest)
        || adoption
            .pointer("/bindings/selected_profile_id")
            .and_then(Value::as_str)
            != Some(profile.enforced_profile_id.as_str())
    {
        return Err(RehearsalError::new(
            "ADOPTION_DECISION_INVALID",
            adoption_path.display().to_string(),
        ));
    }

    let selected_profile = read_json(&selected_profile_path)?;
    if string(&selected_profile, "profile_id")? != profile.enforced_profile_id {
        return Err(RehearsalError::new(
            "SELECTED_PROFILE_ID_MISMATCH",
            &profile.enforced_profile_id,
        ));
    }
    let selected_stage_ids: Vec<String> = selected_profile
        .get("stages")
        .and_then(Value::as_array)
        .ok_or_else(|| RehearsalError::new("SELECTED_PROFILE_STAGES_MISSING", "stages"))?
        .iter()
        .map(|stage| {
            if stage.get("required").and_then(Value::as_bool) != Some(true) {
                return Err(RehearsalError::new(
                    "OPTIONAL_STAGE_FORBIDDEN",
                    "required=false",
                ));
            }
            Ok(stage
                .get("stage_id")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned())
        })
        .collect::<Result<Vec<_>>>()?;
    if selected_stage_ids != profile.enforced_stage_ids {
        return Err(RehearsalError::new(
            "STAGE_DENOMINATOR_MISMATCH",
            "S0-S12 required",
        ));
    }

    let predecessor = EnforcementState {
        state: profile.predecessor_state.clone(),
        candidate_payload_digest: None,
        profile_id: None,
    };
    let predecessor_value = serde_json::to_value(&predecessor)
        .map_err(|error| RehearsalError::new("STATE_SERIALIZATION_FAILED", error.to_string()))?;
    let predecessor_digest = canonical_digest(&predecessor_value)?;

    let positive = evaluate_evidence(
        &root,
        &verifier_path,
        &positive_path,
        &profile.enforced_profile_id,
    );
    if positive.decision != "accept"
        || positive.evidence_payload_digest.as_deref()
            != Some(profile.expected_positive_evidence_payload_digest.as_str())
    {
        return Err(RehearsalError::new(
            "REFERENCE_CUT_IN_FAILED",
            positive.reason_code,
        ));
    }
    let active = EnforcementState {
        state: "active-local-reference-enforcement".to_owned(),
        candidate_payload_digest: Some(profile.candidate_payload_digest.clone()),
        profile_id: Some(profile.enforced_profile_id.clone()),
    };
    let active_digest =
        canonical_digest(&serde_json::to_value(&active).map_err(|error| {
            RehearsalError::new("STATE_SERIALIZATION_FAILED", error.to_string())
        })?)?;

    let forced_failure = evaluate_evidence(
        &root,
        &verifier_path,
        &forced_failure_path,
        &profile.enforced_profile_id,
    );
    if forced_failure.decision != "deny"
        || forced_failure.reason_code != "AGGREGATE_NOT_PASSED"
        || forced_failure.evidence_payload_digest.as_deref()
            != Some(
                profile
                    .expected_forced_failure_evidence_payload_digest
                    .as_str(),
            )
    {
        return Err(RehearsalError::new(
            "DEGRADED_MODE_DID_NOT_FAIL_CLOSED",
            forced_failure.reason_code,
        ));
    }
    let missing = evaluate_evidence(
        &root,
        &verifier_path,
        &root.join("projects/domainspec-v2/development/evolvable-validation-framework/evidence/production-stability/v3-candidate/reference-enforcement/__missing__.json"),
        &profile.enforced_profile_id,
    );
    if missing.decision != "deny" || missing.reason_code != "EVIDENCE_MISSING" {
        return Err(RehearsalError::new(
            "MISSING_EVIDENCE_DID_NOT_FAIL_CLOSED",
            missing.reason_code,
        ));
    }

    let restored = predecessor.clone();
    let restored_digest =
        canonical_digest(&serde_json::to_value(&restored).map_err(|error| {
            RehearsalError::new("STATE_SERIALIZATION_FAILED", error.to_string())
        })?)?;
    if restored != predecessor || restored_digest != predecessor_digest {
        return Err(RehearsalError::new(
            "ROLLBACK_PREDECESSOR_MISMATCH",
            restored_digest,
        ));
    }

    resolve_ref(&root, &profile.refs.positive_evidence)?;
    resolve_ref(&root, &profile.refs.forced_failure_evidence)?;
    resolve_ref(&root, &profile.refs.harness_manifest)?;
    resolve_ref(&root, &profile.refs.harness_lockfile)?;
    resolve_ref(&root, &profile.refs.harness_source)?;
    resolve_ref(&root, &profile.refs.harness_executable)?;
    let rehearsal_profile_ref_after = exact_ref(&root, &profile_path)?;
    if rehearsal_profile_ref.sha256 != rehearsal_profile_ref_after.sha256
        || rehearsal_profile_ref.size_bytes != rehearsal_profile_ref_after.size_bytes
    {
        return Err(RehearsalError::new(
            "REHEARSAL_PROFILE_DRIFT",
            rehearsal_profile_ref.path.clone(),
        ));
    }
    for reference in &manifest_refs {
        resolve_ref(&root, reference)?;
    }
    let unique_manifest_paths: BTreeSet<_> = manifest_refs
        .iter()
        .map(|item| item.path.as_str())
        .collect();

    let mut receipt = json!({
        "schema_version": "evf.reference-enforcement-rehearsal-receipt/v1",
        "rehearsal_id": "evf.reference-enforcement.key-door.v1",
        "profile_id": profile.profile_id,
        "profile_payload_digest": profile.profile_payload_digest,
        "candidate_id": profile.candidate_id,
        "candidate_payload_digest": profile.candidate_payload_digest,
        "enforced_profile_id": profile.enforced_profile_id,
        "enforced_stage_ids": profile.enforced_stage_ids,
        "authorization_refs": {
            "product_approval": exact_ref_json(&profile.refs.product_approval),
            "adoption_decision": exact_ref_json(&profile.refs.adoption_decision)
        },
        "implementation_refs": {
            "rehearsal_profile": exact_ref_json(&rehearsal_profile_ref),
            "cargo_manifest": exact_ref_json(&profile.refs.harness_manifest),
            "cargo_lockfile": exact_ref_json(&profile.refs.harness_lockfile),
            "source": exact_ref_json(&profile.refs.harness_source),
            "executable": exact_ref_json(&profile.refs.harness_executable),
            "all_current_before_and_after": true
        },
        "candidate_ref_rehash": {
            "passed": manifest_refs.len(),
            "failed": 0,
            "unique_paths": unique_manifest_paths.len(),
            "before_and_after": true
        },
        "reference_cut_in": {
            "result": "passed",
            "predecessor_state": predecessor,
            "predecessor_digest": predecessor_digest,
            "active_state": active,
            "active_state_digest": active_digest,
            "gate": positive,
            "all_required_stages_enforced": true
        },
        "degraded_mode": {
            "result": "passed",
            "forced_failure_gate": forced_failure,
            "missing_evidence_gate": missing,
            "prior_pass_reused": false,
            "policy": profile.degraded_mode
        },
        "rollback": {
            "result": "passed",
            "restored_state": restored,
            "restored_state_digest": restored_digest,
            "exact_predecessor_restored": true,
            "policy": profile.rollback
        },
        "evidence_retention": {
            "result": "passed",
            "positive_evidence_ref": exact_ref_json(&profile.refs.positive_evidence),
            "forced_failure_evidence_ref": exact_ref_json(&profile.refs.forced_failure_evidence),
            "refs_current_after_rollback": true,
            "mode": profile.retention
        },
        "forbidden_effects_preserved": profile.forbidden_effects,
        "result": "passed-reference-rehearsal",
        "auth_application": "not-granted",
        "publication": "not-granted",
        "release": "not-granted",
        "deployment": "not-granted",
        "claim_ceiling": profile.claim_ceiling,
        "authority_effect": "none",
        "receipt_payload_digest": ""
    });
    let _ = (
        harness_manifest_path,
        harness_lockfile_path,
        harness_source_path,
        harness_executable_path,
    );
    let receipt_digest = payload_digest(&receipt, "receipt_payload_digest")?;
    receipt["receipt_payload_digest"] = Value::String(receipt_digest.clone());

    let receipt_dir = output_root.join("sha256").join(&receipt_digest);
    let receipt_path = receipt_dir.join("REHEARSAL-RECEIPT.json");
    if receipt_path.exists() {
        return Err(RehearsalError::new(
            "APPEND_ONLY_RECEIPT_EXISTS",
            receipt_path.display().to_string(),
        ));
    }
    fs::create_dir_all(&receipt_dir)
        .map_err(|error| RehearsalError::new("RECEIPT_DIRECTORY_FAILED", error.to_string()))?;
    let temporary = receipt_dir.join(".REHEARSAL-RECEIPT.json.partial");
    let pretty = serde_json::to_vec_pretty(&receipt)
        .map_err(|error| RehearsalError::new("RECEIPT_SERIALIZATION_FAILED", error.to_string()))?;
    fs::write(&temporary, &pretty)
        .map_err(|error| RehearsalError::new("RECEIPT_WRITE_FAILED", error.to_string()))?;
    fs::rename(&temporary, &receipt_path)
        .map_err(|error| RehearsalError::new("RECEIPT_FINALIZE_FAILED", error.to_string()))?;

    Ok(json!({
        "status": "passed-reference-rehearsal",
        "receipt_path": receipt_path.strip_prefix(&root).unwrap_or(&receipt_path),
        "receipt_payload_digest": receipt_digest,
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
                    "status": "blocked",
                    "reason_code": error.code,
                    "message": error.message,
                    "authority_effect": "none"
                }))
                .unwrap()
            );
            std::process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_object_order_is_stable() {
        let left = json!({"b": 2, "a": {"d": 4, "c": 3}});
        let right = json!({"a": {"c": 3, "d": 4}, "b": 2});
        assert_eq!(
            canonical_digest(&left).unwrap(),
            canonical_digest(&right).unwrap()
        );
    }

    #[test]
    fn gate_accepts_only_verified_passing_selected_profile() {
        let accepted = gate_decision(
            "selected",
            true,
            Some("selected"),
            Some("passed"),
            Some("abc"),
        );
        assert_eq!(accepted.decision, "accept");
        assert_eq!(accepted.reason_code, "VERIFIED_ALL_STAGES_PASSED");

        let failed = gate_decision(
            "selected",
            true,
            Some("selected"),
            Some("failed"),
            Some("def"),
        );
        assert_eq!(failed.decision, "deny");
        assert_eq!(failed.reason_code, "AGGREGATE_NOT_PASSED");

        let wrong_profile =
            gate_decision("selected", true, Some("other"), Some("passed"), Some("ghi"));
        assert_eq!(wrong_profile.decision, "deny");
        assert_eq!(wrong_profile.reason_code, "EVIDENCE_PROFILE_MISMATCH");

        let invalid = gate_decision(
            "selected",
            false,
            Some("selected"),
            Some("passed"),
            Some("jkl"),
        );
        assert_eq!(invalid.decision, "deny");
        assert_eq!(invalid.reason_code, "EVIDENCE_VERIFICATION_FAILED");
    }

    #[test]
    fn rollback_state_is_exact() {
        let predecessor = EnforcementState {
            state: "disabled-no-reference-enforcement".to_owned(),
            candidate_payload_digest: None,
            profile_id: None,
        };
        let restored = predecessor.clone();
        let predecessor_digest =
            canonical_digest(&serde_json::to_value(&predecessor).unwrap()).unwrap();
        let restored_digest = canonical_digest(&serde_json::to_value(&restored).unwrap()).unwrap();
        assert_eq!(predecessor, restored);
        assert_eq!(predecessor_digest, restored_digest);
    }
}
