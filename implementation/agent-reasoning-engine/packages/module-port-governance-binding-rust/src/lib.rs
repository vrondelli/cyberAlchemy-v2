use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

pub const BINDING_ID: &str = "ARE-MODULE-PORT-RUST-BINDING-001-CANDIDATE";
pub const CONFIGURATION_ID: &str = "are-production-semantic-core-v1-candidate";
pub const CONFIGURATION_SHA256: &str =
    "8cf1463a048eaf3df6ae5e210fa1d9b974829dc9bd55cc50cd97c6260d9eef3d";
pub const MODULE_SET_DIGEST: &str =
    "f87d8f92824c2b1fab2635742f71d630ce3121c155b509fa13ce4fe0c6e1a926";

const CONSTITUTION: BoundFile = BoundFile::new(
    "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/MODULE-PORT-CONSTITUTION.md",
    "07103be5e183c71d2a5a5dd1f2dcfff01cb7864f977e5d73b68c391e7068ddee",
    "constitution",
);
const ADOPTION: BoundFile = BoundFile::new(
    "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/adoption-request.json",
    "d64c3f3fc1e86ee29a8b371e75adb80355c01e61fb7bb8cda1ead1aa7927c98e",
    "adoption",
);
const ADMISSION: BoundFile = BoundFile::new(
    "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/runtime-admission-request.json",
    "29ddcbbb0bf5c69654fa388dad1a116d3a63764652f7f339d28f4e259ad962e0",
    "runtime-admission",
);
const CONFIGURATION: BoundFile = BoundFile::new(
    "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v1/generated/runtime/configuration.json",
    CONFIGURATION_SHA256,
    "configuration",
);
const RUNTIME_EVIDENCE: BoundFile = BoundFile::new(
    "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v1/evidence/runtime-conformance.json",
    "7dd040c7e3c488d4be2c5c32ca29155c15f131a1eb5452a81f47f3c64d2a488e",
    "runtime-evidence",
);
const ADAPTER: BoundFile = BoundFile::new(
    "implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs",
    "1be73822d50fe2b2b84b05b1aa43627443aed156b27263a24c2f21e3d7246e91",
    "adapter",
);

const BOUND_FILES: [BoundFile; 6] = [
    CONSTITUTION,
    ADOPTION,
    ADMISSION,
    CONFIGURATION,
    RUNTIME_EVIDENCE,
    ADAPTER,
];

#[derive(Clone, Copy)]
struct BoundFile {
    relative_path: &'static str,
    sha256: &'static str,
    role: &'static str,
}

impl BoundFile {
    const fn new(relative_path: &'static str, sha256: &'static str, role: &'static str) -> Self {
        Self {
            relative_path,
            sha256,
            role,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct VerificationReceipt {
    value: Value,
}

impl VerificationReceipt {
    pub fn is_pass(&self) -> bool {
        self.value["disposition"] == "PASS"
    }

    pub fn reason_codes(&self) -> Vec<&str> {
        self.value["reason_codes"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
            .collect()
    }

    pub fn value(&self) -> &Value {
        &self.value
    }

    pub fn to_pretty_json(&self) -> String {
        format!(
            "{}\n",
            serde_json::to_string_pretty(&self.value).expect("receipt serializes")
        )
    }
}

fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn read_regular_file_without_symlinks(
    root: &Path,
    relative: &str,
) -> Result<Vec<u8>, &'static str> {
    let relative_path = Path::new(relative);
    if relative_path.is_absolute()
        || relative_path
            .components()
            .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err("binding.path-invalid");
    }

    let mut current = PathBuf::from(root);
    for component in relative_path.components() {
        let Component::Normal(component) = component else {
            return Err("binding.path-invalid");
        };
        current.push(component);
        let metadata = fs::symlink_metadata(&current).map_err(|_| "binding.file-unreadable")?;
        if metadata.file_type().is_symlink() {
            return Err("binding.symlink-forbidden");
        }
    }
    if !fs::metadata(&current)
        .map_err(|_| "binding.file-unreadable")?
        .is_file()
    {
        return Err("binding.not-regular-file");
    }
    fs::read(current).map_err(|_| "binding.file-unreadable")
}

fn exact_json(
    root: &Path,
    bound: BoundFile,
    checks: &mut Vec<Value>,
    reasons: &mut BTreeSet<String>,
) -> Option<Value> {
    let bytes = match read_regular_file_without_symlinks(root, bound.relative_path) {
        Ok(bytes) => bytes,
        Err(code) => {
            reasons.insert(code.to_string());
            checks.push(json!({"check_id": format!("file:{}", bound.role), "outcome": "BLOCK", "reason_code": code}));
            return None;
        }
    };
    let observed = sha256(&bytes);
    if observed != bound.sha256 {
        reasons.insert(format!("binding.{}-digest-mismatch", bound.role));
        checks.push(json!({
            "check_id": format!("digest:{}", bound.role),
            "outcome": "BLOCK",
            "expected_sha256": bound.sha256,
            "observed_sha256": observed
        }));
        return None;
    }
    checks.push(json!({
        "check_id": format!("digest:{}", bound.role),
        "outcome": "PASS",
        "observed_sha256": observed
    }));
    match serde_json::from_slice(&bytes) {
        Ok(value) => Some(value),
        Err(_) => {
            reasons.insert(format!("binding.{}-json-invalid", bound.role));
            checks.push(json!({"check_id": format!("json:{}", bound.role), "outcome": "BLOCK"}));
            None
        }
    }
}

fn claim(checks: &mut Vec<Value>, reasons: &mut BTreeSet<String>, id: &str, condition: bool) {
    checks.push(json!({"check_id": id, "outcome": if condition { "PASS" } else { "BLOCK" }}));
    if !condition {
        reasons.insert(format!("binding.claim-failed:{id}"));
    }
}

fn no_effect(value: &Value) -> bool {
    value["enforcement_active"] != true
        && value["effect_authorized"] != true
        && value["authority_effect"] == "none"
}

fn verify_claims(
    adoption: Option<&Value>,
    admission: Option<&Value>,
    configuration: Option<&Value>,
    evidence: Option<&Value>,
    checks: &mut Vec<Value>,
    reasons: &mut BTreeSet<String>,
) {
    if let Some(value) = adoption {
        claim(
            checks,
            reasons,
            "adoption:selected",
            value["decision_state"] == "selected",
        );
        claim(
            checks,
            reasons,
            "adoption:option",
            value["selected_option_id"] == "ARE-MPC-ADOPT",
        );
        claim(
            checks,
            reasons,
            "adoption:selector",
            value["selector"] == "profile:semantic-contract-v1/domain:are-module-port",
        );
        claim(
            checks,
            reasons,
            "adoption:constitution-digest",
            value["constitution_sha256"] == CONSTITUTION.sha256,
        );
        claim(
            checks,
            reasons,
            "adoption:authority-ceiling",
            value["constitution_adopted"] == true
                && value["runtime_admitted"] == false
                && no_effect(value),
        );
    }
    if let Some(value) = admission {
        claim(
            checks,
            reasons,
            "admission:id",
            value["decision_id"] == "ARE-MODULE-PORT-RUNTIME-ADMISSION-001",
        );
        claim(
            checks,
            reasons,
            "admission:selected",
            value["decision_state"] == "selected"
                && value["selected_option_id"] == "ARE-MP-RUNTIME-ADMIT",
        );
        claim(
            checks,
            reasons,
            "admission:subject",
            value["subject"] == CONFIGURATION_ID
                && value["subject_configuration_digest"] == CONFIGURATION_SHA256,
        );
        claim(
            checks,
            reasons,
            "admission:evidence",
            value["conformance_evidence_sha256"] == RUNTIME_EVIDENCE.sha256,
        );
        claim(
            checks,
            reasons,
            "admission:prerequisites",
            value["blocking_prerequisites"]
                .as_array()
                .is_some_and(Vec::is_empty)
                && value["satisfied_prerequisites"] == value["prerequisites"],
        );
        claim(
            checks,
            reasons,
            "admission:authority-ceiling",
            value["runtime_admitted"] == true
                && value["constitution_adopted"] == true
                && no_effect(value),
        );
    }
    if let Some(value) = configuration {
        let modules = value["modules"].as_array();
        claim(
            checks,
            reasons,
            "configuration:identity",
            value["configuration_id"] == CONFIGURATION_ID
                && value["schema_version"] == "are.static-module-configuration/v1",
        );
        claim(
            checks,
            reasons,
            "configuration:closed-module-set",
            modules.is_some_and(|rows| rows.len() == 1)
                && value["modules"][0]["module_id"] == "alch-semantic-prelude"
                && value["modules"][0]["factory_id"] == "createAlchSemanticAdapter"
                && value["modules"][0]["version"] == "1-candidate"
                && value["modules"][0]["manifest_digest"]
                    == "b5ce4d4a3a5b31d92658d8cd53d3ac3ce07283ab7ed8adc164fee23c1221edb5",
        );
        claim(
            checks,
            reasons,
            "configuration:authority-ceiling",
            value["authority_effect"] == "none",
        );
    }
    if let Some(value) = evidence {
        claim(
            checks,
            reasons,
            "evidence:status",
            value["status"] == "PASS" && value["configuration_id"] == CONFIGURATION_ID,
        );
        claim(
            checks,
            reasons,
            "evidence:bindings",
            value["bindings"]["runtime_configuration_sha256"] == CONFIGURATION_SHA256
                && value["bindings"]["adapter_source_sha256"] == ADAPTER.sha256
                && value["module_set_digest"] == MODULE_SET_DIGEST,
        );
        claim(
            checks,
            reasons,
            "evidence:entry-points",
            value["entry_points"]
                == json!([
                    "RequestIntentContainsPhrase",
                    "RequestIntentSemanticKey",
                    "RouterContainsPhrase"
                ]),
        );
        claim(
            checks,
            reasons,
            "evidence:authority-ceiling",
            value["runtime_admitted"] == false && no_effect(value),
        );
    }
}

pub fn verify_repository(repository_root: &Path) -> VerificationReceipt {
    let mut checks = Vec::new();
    let mut reasons = BTreeSet::new();

    // The Constitution is intentionally treated as bytes, not interpreted by this binding.
    match read_regular_file_without_symlinks(repository_root, CONSTITUTION.relative_path) {
        Ok(bytes) if sha256(&bytes) == CONSTITUTION.sha256 => checks.push(json!({
            "check_id": "digest:constitution", "outcome": "PASS", "observed_sha256": CONSTITUTION.sha256
        })),
        Ok(bytes) => {
            reasons.insert("binding.constitution-digest-mismatch".to_string());
            checks.push(json!({"check_id": "digest:constitution", "outcome": "BLOCK", "expected_sha256": CONSTITUTION.sha256, "observed_sha256": sha256(&bytes)}));
        }
        Err(code) => {
            reasons.insert(code.to_string());
            checks.push(json!({"check_id": "file:constitution", "outcome": "BLOCK", "reason_code": code}));
        }
    }

    let adoption = exact_json(repository_root, ADOPTION, &mut checks, &mut reasons);
    let admission = exact_json(repository_root, ADMISSION, &mut checks, &mut reasons);
    let configuration = exact_json(repository_root, CONFIGURATION, &mut checks, &mut reasons);
    let evidence = exact_json(repository_root, RUNTIME_EVIDENCE, &mut checks, &mut reasons);

    match read_regular_file_without_symlinks(repository_root, ADAPTER.relative_path) {
        Ok(bytes) if sha256(&bytes) == ADAPTER.sha256 => checks.push(json!({
            "check_id": "digest:adapter", "outcome": "PASS", "observed_sha256": ADAPTER.sha256
        })),
        Ok(bytes) => {
            reasons.insert("binding.adapter-digest-mismatch".to_string());
            checks.push(json!({"check_id": "digest:adapter", "outcome": "BLOCK", "expected_sha256": ADAPTER.sha256, "observed_sha256": sha256(&bytes)}));
        }
        Err(code) => {
            reasons.insert(code.to_string());
            checks
                .push(json!({"check_id": "file:adapter", "outcome": "BLOCK", "reason_code": code}));
        }
    }

    verify_claims(
        adoption.as_ref(),
        admission.as_ref(),
        configuration.as_ref(),
        evidence.as_ref(),
        &mut checks,
        &mut reasons,
    );

    let pass = reasons.is_empty();
    VerificationReceipt {
        value: json!({
            "schema_version": "are.module-port-rust-binding-receipt/v1-candidate",
            "binding_id": BINDING_ID,
            "disposition": if pass { "PASS" } else { "BLOCK" },
            "subject_configuration_id": CONFIGURATION_ID,
            "subject_configuration_sha256": CONFIGURATION_SHA256,
            "module_set_digest": MODULE_SET_DIGEST,
            "checks": checks,
            "reason_codes": reasons.into_iter().collect::<Vec<_>>(),
            "runtime_admission_verified": pass,
            "binding_admitted": false,
            "enforcement_active": false,
            "effect_authorized": false,
            "authority_effect": "none"
        }),
    }
}

pub fn bound_paths() -> impl Iterator<Item = &'static str> {
    BOUND_FILES.iter().map(|bound| bound.relative_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static NEXT_ID: AtomicU64 = AtomicU64::new(0);

    fn repository_root() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../..")
            .canonicalize()
            .unwrap()
    }

    fn fixture() -> PathBuf {
        let root = std::env::temp_dir().join(format!(
            "are-module-port-binding-{}-{}",
            std::process::id(),
            NEXT_ID.fetch_add(1, Ordering::Relaxed)
        ));
        let source = repository_root();
        for relative in bound_paths() {
            let target = root.join(relative);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::copy(source.join(relative), target).unwrap();
        }
        root
    }

    #[test]
    fn exact_repository_passes_without_granting_effects() {
        let receipt = verify_repository(&repository_root());
        assert!(receipt.is_pass(), "{}", receipt.to_pretty_json());
        assert_eq!(receipt.value()["binding_admitted"], false);
        assert_eq!(receipt.value()["enforcement_active"], false);
        assert_eq!(receipt.value()["effect_authorized"], false);
        assert_eq!(receipt.value()["authority_effect"], "none");
    }

    #[test]
    fn receipt_is_deterministic() {
        let root = repository_root();
        assert_eq!(verify_repository(&root), verify_repository(&root));
    }

    #[test]
    fn configuration_drift_blocks() {
        let root = fixture();
        fs::write(root.join(CONFIGURATION.relative_path), b"{}\n").unwrap();
        let receipt = verify_repository(&root);
        assert!(!receipt.is_pass());
        assert!(receipt
            .reason_codes()
            .contains(&"binding.configuration-digest-mismatch"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn admission_substitution_blocks() {
        let root = fixture();
        let path = root.join(ADMISSION.relative_path);
        let mut value: Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
        value["subject"] = json!("substituted-runtime");
        fs::write(
            path,
            format!("{}\n", serde_json::to_string_pretty(&value).unwrap()),
        )
        .unwrap();
        let receipt = verify_repository(&root);
        assert!(!receipt.is_pass());
        assert!(receipt
            .reason_codes()
            .contains(&"binding.runtime-admission-digest-mismatch"));
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn effect_smuggling_fails_semantic_claims() {
        let mut admission: Value = serde_json::from_slice(
            &fs::read(repository_root().join(ADMISSION.relative_path)).unwrap(),
        )
        .unwrap();
        admission["effect_authorized"] = json!(true);
        let mut checks = Vec::new();
        let mut reasons = BTreeSet::new();
        verify_claims(
            None,
            Some(&admission),
            None,
            None,
            &mut checks,
            &mut reasons,
        );
        assert!(reasons.contains("binding.claim-failed:admission:authority-ceiling"));
    }

    #[cfg(unix)]
    #[test]
    fn symlink_substitution_blocks_even_when_target_bytes_match() {
        use std::os::unix::fs::symlink;
        let root = fixture();
        let adapter = root.join(ADAPTER.relative_path);
        fs::remove_file(&adapter).unwrap();
        symlink(repository_root().join(ADAPTER.relative_path), &adapter).unwrap();
        let receipt = verify_repository(&root);
        assert!(!receipt.is_pass());
        assert!(receipt
            .reason_codes()
            .contains(&"binding.symlink-forbidden"));
        fs::remove_dir_all(root).unwrap();
    }
}
