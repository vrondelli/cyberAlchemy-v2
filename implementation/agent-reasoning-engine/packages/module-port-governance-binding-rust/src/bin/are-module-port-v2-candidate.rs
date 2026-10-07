use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::fs;
use std::path::{Component, Path, PathBuf};

const BINDING_ID: &str = "ARE-MODULE-PORT-RUST-BINDING-002-CANDIDATE";
const CONFIGURATION_ID: &str = "are-production-semantic-core-v2-candidate";
const CONFIGURATION_SHA256: &str =
    "71673fd5302bc521513d530eccfc36c2c81b01d967916ee013edf203a2e910c8";
const MODULE_SET_DIGEST: &str = "f87d8f92824c2b1fab2635742f71d630ce3121c155b509fa13ce4fe0c6e1a926";
const ROOT: &str = "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2";

#[derive(Clone, Copy)]
struct Bound {
    role: &'static str,
    path: &'static str,
    digest: &'static str,
    json: bool,
}

const BOUND: [Bound; 11] = [
    Bound { role: "constitution", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/MODULE-PORT-CONSTITUTION.md", digest: "07103be5e183c71d2a5a5dd1f2dcfff01cb7864f977e5d73b68c391e7068ddee", json: false },
    Bound { role: "adoption", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-module-port-v1/governance-candidate/adoption-request.json", digest: "d64c3f3fc1e86ee29a8b371e75adb80355c01e61fb7bb8cda1ead1aa7927c98e", json: true },
    Bound { role: "alch-source", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/runtime-configuration.alch", digest: "747aa1d6afbf9709a04f049c26e156ddac57ae69b13fb74394cf2da3857cea32", json: false },
    Bound { role: "build-manifest", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/manifest.json", digest: "7e9c785068bf22a23dee31258877c5673f3daac288d26eb47205f3589f56e6d9", json: true },
    Bound { role: "configuration", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/runtime/configuration.json", digest: CONFIGURATION_SHA256, json: true },
    Bound { role: "entrypoints", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/runtime/entrypoints.json", digest: "8104a4b223e05e754c1bc785969d2b907c5733ddfce5b3cc6edb400c63dc293e", json: true },
    Bound { role: "runtime-bindings", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/generated/provenance/runtime-bindings.json", digest: "47ce3e3cd632a5b111c4df20b22dc64180bfd0e858897d0e7f71ddda2d04bdcc", json: true },
    Bound { role: "runtime-evidence", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/are-runtime-configuration-v2/evidence/runtime-conformance.json", digest: "ebc2bc6ba9a14507f74d3e1898c5e54ec95207b54839b40cef09d2f8c30fc40c", json: true },
    Bound { role: "adapter", path: "implementation/agent-reasoning-engine/packages/module-port/alch-semantic-adapter.mjs", digest: "79c744c2ea3f92c3aaf102a697d4b306d6660d9c1311c14b7eef2c5111457039", json: false },
    Bound { role: "runtime", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/consumer-runtime.mjs", digest: "b4a58d12309c93632fd3487d6a8fcdf778993d688e45e4b72637012f01d095a0", json: false },
    Bound { role: "compiled", path: "language/capabilities/alchlang/plans/general-compiler-v1/extensions/semantic-contract-v1/evidence/bundle/app/prelude.mjs", digest: "a959563fbfab815c2ac08bff8835384d1102349b763ad10d918a248a9ce74cf7", json: false },
];

fn sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn regular_bytes(root: &Path, relative: &str) -> Result<Vec<u8>, &'static str> {
    let mut current = PathBuf::from(root);
    for part in Path::new(relative).components() {
        let Component::Normal(name) = part else {
            return Err("binding.path-invalid");
        };
        current.push(name);
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

fn claim(checks: &mut Vec<Value>, reasons: &mut BTreeSet<String>, id: &str, valid: bool) {
    checks.push(json!({"check_id": id, "outcome": if valid { "PASS" } else { "BLOCK" }}));
    if !valid {
        reasons.insert(format!("binding.claim-failed:{id}"));
    }
}

fn verify_repository(root: &Path) -> Value {
    let mut checks = Vec::new();
    let mut reasons = BTreeSet::new();
    let mut values = std::collections::BTreeMap::new();
    for bound in BOUND {
        match regular_bytes(root, bound.path) {
            Err(reason) => {
                reasons.insert(reason.to_owned());
                checks.push(json!({"check_id": format!("file:{}", bound.role), "outcome": "BLOCK", "reason_code": reason}));
            }
            Ok(bytes) => {
                let observed = sha256(&bytes);
                let valid = observed == bound.digest;
                checks.push(json!({"check_id": format!("digest:{}", bound.role), "outcome": if valid { "PASS" } else { "BLOCK" }, "observed_sha256": observed}));
                if !valid {
                    reasons.insert(format!("binding.{}-digest-mismatch", bound.role));
                    continue;
                }
                if bound.json {
                    match serde_json::from_slice::<Value>(&bytes) {
                        Ok(value) => {
                            values.insert(bound.role, value);
                        }
                        Err(_) => {
                            reasons.insert(format!("binding.{}-json-invalid", bound.role));
                        }
                    }
                }
            }
        }
    }
    let adoption = values.get("adoption");
    let manifest = values.get("build-manifest");
    let configuration = values.get("configuration");
    let entrypoints = values.get("entrypoints");
    let bindings = values.get("runtime-bindings");
    let evidence = values.get("runtime-evidence");
    claim(
        &mut checks,
        &mut reasons,
        "adoption:no-runtime-admission",
        adoption.is_some_and(|v| {
            v["decision_state"] == "selected"
                && v["selected_option_id"] == "ARE-MPC-ADOPT"
                && v["runtime_admitted"] == false
                && v["effect_authorized"] == false
        }),
    );
    claim(
        &mut checks,
        &mut reasons,
        "manifest:candidate",
        manifest.is_some_and(|v| {
            v["profile"] == "module-configuration-v2"
                && v["source_sha256"] == BOUND[2].digest
                && v["configuration_id"] == CONFIGURATION_ID
                && v["runtime_admitted"] == false
                && v["enforcement_active"] == false
                && v["authority_effect"] == "none"
        }),
    );
    claim(
        &mut checks,
        &mut reasons,
        "configuration:closed",
        configuration.is_some_and(|v| {
            v["schema_version"] == "are.static-module-configuration/v1"
                && v["configuration_id"] == CONFIGURATION_ID
                && v["modules"].as_array().is_some_and(|a| a.len() == 1)
                && v["modules"][0]["factory_id"] == "createAlchSemanticAdapter"
                && v["modules"][0]["module_id"] == "alch-semantic-prelude"
                && v["authority_effect"] == "none"
        }),
    );
    claim(
        &mut checks,
        &mut reasons,
        "entrypoints:three",
        entrypoints.is_some_and(|v| {
            v["configuration_id"] == CONFIGURATION_ID
                && v["entries"].as_array().is_some_and(|a| a.len() == 3)
                && v["runtime_admitted"] == false
                && v["authority_effect"] == "none"
        }),
    );
    claim(
        &mut checks,
        &mut reasons,
        "bindings:exact",
        bindings.is_some_and(|v| {
            v["modules"].as_array().is_some_and(|a| a.len() == 1)
                && v["modules"][0]["factory_source_sha256"] == BOUND[8].digest
                && v["modules"][0]["runtime_source_sha256"] == BOUND[9].digest
                && v["modules"][0]["compiled_source_sha256"] == BOUND[10].digest
                && v["authority_effect"] == "none"
        }),
    );
    claim(
        &mut checks,
        &mut reasons,
        "evidence:exact",
        evidence.is_some_and(|v| {
            v["status"] == "PASS"
                && v["configuration_id"] == CONFIGURATION_ID
                && v["module_set_digest"] == MODULE_SET_DIGEST
                && v["bindings"]["runtime_configuration_sha256"] == CONFIGURATION_SHA256
                && v["bindings"]["adapter_source_sha256"] == BOUND[8].digest
                && v["bindings"]["runtime_source_sha256"] == BOUND[9].digest
                && v["bindings"]["compiled_source_sha256"] == BOUND[10].digest
                && v["runtime_admitted"] == false
                && v["enforcement_active"] == false
                && v["effect_authorized"] == false
                && v["authority_effect"] == "none"
        }),
    );
    let pass = reasons.is_empty();
    json!({"schema_version": "are.module-port-rust-binding-receipt/v2-candidate", "binding_id": BINDING_ID,
        "disposition": if pass { "PASS" } else { "BLOCK" }, "subject_root": ROOT,
        "subject_configuration_id": CONFIGURATION_ID, "subject_configuration_sha256": CONFIGURATION_SHA256,
        "module_set_digest": MODULE_SET_DIGEST, "checks": checks, "reason_codes": reasons.into_iter().collect::<Vec<_>>(),
        "runtime_admission_verified": false, "binding_admitted": false, "enforcement_active": false,
        "effect_authorized": false, "authority_effect": "none"})
}

fn main() {
    let mut args = std::env::args().skip(1);
    let root = match (args.next().as_deref(), args.next(), args.next()) {
        (Some("--repository-root"), Some(path), None) => PathBuf::from(path),
        _ => {
            eprintln!("usage: are-module-port-v2-candidate --repository-root <path>");
            std::process::exit(2);
        }
    };
    let receipt = verify_repository(&root);
    println!(
        "{}",
        serde_json::to_string_pretty(&receipt).expect("serializable receipt")
    );
    if receipt["disposition"] != "PASS" {
        std::process::exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn repo() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../../..")
            .canonicalize()
            .unwrap()
    }
    #[test]
    fn exact_candidate_passes_without_admission() {
        let receipt = verify_repository(&repo());
        assert_eq!(receipt["disposition"], "PASS", "{receipt}");
        assert_eq!(receipt["runtime_admission_verified"], false);
        assert_eq!(receipt["binding_admitted"], false);
    }
    #[test]
    fn adapter_drift_blocks() {
        let source = repo();
        let nonce = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let target =
            std::env::temp_dir().join(format!("are-v2-binding-{}-{nonce}", std::process::id()));
        fs::create_dir(&target).unwrap();
        for bound in BOUND {
            let destination = target.join(bound.path);
            fs::create_dir_all(destination.parent().unwrap()).unwrap();
            fs::copy(source.join(bound.path), destination).unwrap();
        }
        fs::write(target.join(BOUND[8].path), b"drift\n").unwrap();
        let receipt = verify_repository(&target);
        assert_eq!(receipt["disposition"], "BLOCK");
        assert!(receipt["reason_codes"]
            .as_array()
            .unwrap()
            .contains(&json!("binding.adapter-digest-mismatch")));
        fs::remove_dir_all(target).unwrap();
    }
}
