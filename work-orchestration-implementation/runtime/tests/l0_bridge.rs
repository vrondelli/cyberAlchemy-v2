use cav2_work_orchestration_etl_demo::l0::{
    parse_binding_for_tests, preflight, require_mutation_authorization, resume, run,
    validate_binding_value_for_tests, validate_preflight_material_for_tests, L0RunRequest,
};
use cav2_work_orchestration_etl_demo::repository::{repository_root_identity, ToolchainBinding};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

const ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../..");
const BINDING: &str =
    "cyberAlchemy-v2/work-orchestration-implementation/domainspec/l0-execution-bindings.json";
const SOURCE: &str = "projects/domainspec-v2/development/backend-cli-completion/layers/L0-semantic-pattern-proof/execution-dag.json";

fn sha_file(path: &Path) -> String {
    format!("sha256:{:x}", Sha256::digest(fs::read(path).unwrap()))
}

fn request(run_id: &str) -> L0RunRequest {
    let root = Path::new(ROOT).canonicalize().unwrap();
    L0RunRequest {
        schema_version: "cav2-domainspec-l0-run-request/v1-candidate".to_owned(),
        repository_root: root.clone(),
        repository_root_identity: repository_root_identity(&root).unwrap(),
        binding_path: PathBuf::from(BINDING),
        binding_sha256: sha_file(&root.join(BINDING)),
        run_id: run_id.to_owned(),
        run_directory: PathBuf::from(format!(
            "projects/domainspec-v2/development/backend-cli-completion/evidence/l0/orchestration-preflight/{run_id}"
        )),
        absolute_deadline_unix_ms: u128::from(u64::MAX),
        toolchain: ToolchainBinding {
            executable: PathBuf::from("/usr/bin/true"),
            executable_sha256: sha_file(Path::new("/usr/bin/true")),
            closure_sha256: BTreeMap::new(),
            bubblewrap: PathBuf::from("/usr/bin/bwrap"),
            bubblewrap_sha256: sha_file(Path::new("/usr/bin/bwrap")),
        },
        c19: None,
        mutation_authorization: None,
        authority_effect: "none".to_owned(),
        external_effect: "none".to_owned(),
    }
}

fn copy_path(source_root: &Path, target_root: &Path, relative: &Path) {
    let source = source_root.join(relative);
    let target = target_root.join(relative);
    if source.is_dir() {
        fs::create_dir_all(&target).unwrap();
        for entry in fs::read_dir(source).unwrap() {
            let entry = entry.unwrap();
            copy_path(
                source_root,
                target_root,
                &entry.path().strip_prefix(source_root).unwrap(),
            );
        }
    } else {
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::copy(source, target).unwrap();
    }
}

#[test]
fn binding_closes_all_descriptive_scopes_and_exact_root() {
    let root = Path::new(ROOT).canonicalize().unwrap();
    let source: Value = serde_json::from_slice(&fs::read(root.join(SOURCE)).unwrap()).unwrap();
    let value: Value = serde_json::from_slice(&fs::read(root.join(BINDING)).unwrap()).unwrap();
    let binding = parse_binding_for_tests(value).unwrap();
    validate_binding_value_for_tests(&source, &binding).unwrap();

    let mut expanded = binding.clone();
    expanded.scope_bindings.insert(
        "invented ambient scope".to_owned(),
        vec!["projects".to_owned()],
    );
    assert_eq!(
        validate_binding_value_for_tests(&source, &expanded).unwrap_err(),
        "L0_SCOPE_BINDING_KEY_SET_MISMATCH"
    );

    let mut bypass = binding;
    bypass.preflight_node_id = "work.canonical-definitions.L0-B02-01".to_owned();
    assert_eq!(
        validate_binding_value_for_tests(&source, &bypass).unwrap_err(),
        "L0_GATE_BYPASS_OR_ROOT_MISMATCH"
    );
}

#[test]
fn cli_preflight_rejects_digest_drift_and_evidence_scope_expansion_before_writes() {
    let temporary = tempfile::tempdir().unwrap();
    let drift_path = temporary.path().join("drift.json");
    let mut drift = serde_json::to_value(request("hostile-digest")).unwrap();
    drift["binding_sha256"] = json!("sha256:wrong");
    fs::write(&drift_path, serde_json::to_vec(&drift).unwrap()).unwrap();
    assert_eq!(
        preflight(&drift_path).unwrap_err(),
        "L0_BINDING_DIGEST_DRIFT"
    );

    let expansion_path = temporary.path().join("expansion.json");
    let mut expansion = serde_json::to_value(request("hostile-scope")).unwrap();
    expansion["run_directory"] = json!("projects/domainspec-v2/impl/cli");
    fs::write(&expansion_path, serde_json::to_vec(&expansion).unwrap()).unwrap();
    assert_eq!(
        preflight(&expansion_path).unwrap_err(),
        "L0_EVIDENCE_SCOPE_EXPANSION"
    );
}

#[test]
fn mutable_execution_requires_a_separate_exact_authorization() {
    let writes = vec![PathBuf::from(
        "projects/domainspec-v2/impl/cli/src/mutable.ts",
    )];
    assert_eq!(
        require_mutation_authorization(
            "sha256:graph",
            "work.exact-implementation-binding.L0-B01-02",
            &writes,
            None,
            1,
        )
        .unwrap_err(),
        "L0_MUTATION_AUTHORIZATION_REQUIRED"
    );
    let wrong = cav2_work_orchestration_etl_demo::l0::MutationAuthorization {
        authorization_id: "auth-1".to_owned(),
        graph_sha256: "sha256:other".to_owned(),
        node_id: "work.exact-implementation-binding.L0-B01-02".to_owned(),
        write_scope: writes.clone(),
        expires_unix_ms: 100,
        authority_effect: "repository-mutation".to_owned(),
        external_effect_authorized: false,
    };
    assert_eq!(
        require_mutation_authorization(
            "sha256:graph",
            "work.exact-implementation-binding.L0-B01-02",
            &writes,
            Some(&wrong),
            1,
        )
        .unwrap_err(),
        "L0_MUTATION_AUTHORIZATION_MISMATCH"
    );
}

#[test]
fn in_progress_command_and_cursor_conflict_fail_closed() {
    use cav2_work_orchestration_etl_demo::ports::{
        stream_identity, AcceptedHistoryPort, AppendOutcome, FileAcceptedHistory,
        StructuralTransition,
    };
    let temporary = tempfile::tempdir().unwrap();
    let mut history = FileAcceptedHistory::open(temporary.path().join("history.json")).unwrap();
    let identity = json!({"run":"resume-hostile"});
    let stream = stream_identity(&identity);
    history.open_stream(&stream, &identity, 100, 1).unwrap();
    assert!(matches!(
        history.begin_command("command-1", &json!({"exact":1})),
        Ok(cav2_work_orchestration_etl_demo::ports::ResumeDisposition::Execute)
    ));
    assert_eq!(
        history
            .begin_command("command-1", &json!({"exact":1}))
            .unwrap_err(),
        "REPOSITORY_RECONCILIATION_REQUIRED"
    );
    let cursor = json!({"state":"one"});
    let cursor_identity = format!(
        "sha256:{:x}",
        Sha256::digest(serde_json::to_vec(&cursor).unwrap())
    );
    let transition = StructuralTransition {
        stream_id: stream.clone(),
        expected_cursor_identity: Some("sha256:wrong".to_owned()),
        event_id: "event-1".to_owned(),
        accepted_event: json!({"event_id":"event-1"}),
        next_cursor: cursor,
        next_cursor_identity: cursor_identity,
        command_intents: vec![],
    };
    assert_eq!(
        history.compare_and_append(transition),
        AppendOutcome::Conflict
    );
    assert!(history.read(&stream).events.is_empty());
}

#[test]
fn completed_resume_is_bound_to_the_original_preflight_material_identity() {
    let preflight = json!({"selected_material_identity":"sha256:original"});
    validate_preflight_material_for_tests(&preflight, "sha256:original").unwrap();
    assert_eq!(
        validate_preflight_material_for_tests(&preflight, "sha256:changed").unwrap_err(),
        "L0_SELECTED_MATERIAL_DRIFT_SINCE_PREFLIGHT"
    );
}

#[test]
fn positive_b00_run_and_completed_resume_are_identical_in_a_temporary_repository() {
    let source_root = Path::new(ROOT).canonicalize().unwrap();
    let temporary = tempfile::tempdir().unwrap();
    let target_root = temporary.path().canonicalize().unwrap();
    let binding_value: Value =
        serde_json::from_slice(&fs::read(source_root.join(BINDING)).unwrap()).unwrap();
    let binding = parse_binding_for_tests(binding_value).unwrap();
    for scope in &binding.read_scopes {
        copy_path(&source_root, &target_root, scope);
    }
    copy_path(&source_root, &target_root, &binding.source.path);
    copy_path(&source_root, &target_root, Path::new(BINDING));
    let mut exact = request("positive-resume");
    exact.repository_root = target_root.clone();
    exact.repository_root_identity = repository_root_identity(&target_root).unwrap();
    exact.binding_sha256 = sha_file(&target_root.join(BINDING));
    exact.toolchain = ToolchainBinding {
        executable: PathBuf::from("/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node"),
        executable_sha256: binding.expected.node_sha256,
        closure_sha256: binding.expected.toolchain_closure_sha256,
        bubblewrap: PathBuf::from("/usr/bin/bwrap"),
        bubblewrap_sha256: binding.expected.bubblewrap_sha256,
    };
    let request_path = temporary.path().join("request.json");
    let exact_request_bytes = serde_json::to_vec(&exact).unwrap();
    fs::write(&request_path, &exact_request_bytes).unwrap();
    let first_preflight = preflight(&request_path).unwrap();
    let run_directory = target_root.join(&exact.run_directory);
    let persisted_request = fs::read(run_directory.join("run-request.json")).unwrap();
    let persisted_receipt = fs::read(run_directory.join("preflight-receipt.json")).unwrap();
    assert_eq!(preflight(&request_path).unwrap(), first_preflight);
    assert_eq!(
        fs::read(run_directory.join("run-request.json")).unwrap(),
        persisted_request
    );
    assert_eq!(
        fs::read(run_directory.join("preflight-receipt.json")).unwrap(),
        persisted_receipt
    );

    let mut drifted = exact.clone();
    drifted.absolute_deadline_unix_ms -= 1;
    fs::write(&request_path, serde_json::to_vec(&drifted).unwrap()).unwrap();
    assert_eq!(
        preflight(&request_path).unwrap_err(),
        "L0_RUN_REQUEST_DIVERGENT_REUSE"
    );
    assert_eq!(
        fs::read(run_directory.join("run-request.json")).unwrap(),
        persisted_request
    );
    assert_eq!(
        fs::read(run_directory.join("preflight-receipt.json")).unwrap(),
        persisted_receipt
    );
    assert_eq!(run(&request_path).unwrap_err(), "L0_RUN_REQUEST_DRIFT");
    assert!(!run_directory.join("accepted-history.json").exists());

    fs::write(&request_path, &exact_request_bytes).unwrap();
    let first = run(&request_path).unwrap();
    let completed = resume(&request_path).unwrap();
    assert_eq!(first, completed);
    assert_eq!(completed["selected_material_unchanged"], true);
    assert_eq!(completed["successor_command_held"], "preflight.L0-B01-01");
}
