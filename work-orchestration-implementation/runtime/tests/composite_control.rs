use cav2_work_orchestration_etl_demo::c19::{evaluate_exact, C19GateInput};
use cav2_work_orchestration_etl_demo::composite::{
    compile_l0, validate_compiled_composite, validate_gate_domination, validate_helper_receipt,
    ScopeBindings,
};
use cav2_work_orchestration_etl_demo::dag::DagDefinition;
use cav2_work_orchestration_etl_demo::ports::{
    stream_identity, AcceptedHistoryPort, AppendOutcome, FileAcceptedHistory, ResumeDisposition,
    StructuralTransition,
};
use cav2_work_orchestration_etl_demo::repository::{
    prepare, repository_root_identity, RepositoryWorkInput, ToolchainBinding,
};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs;
use std::os::unix::fs::{symlink, PermissionsExt};
use std::path::{Component, Path, PathBuf};
use std::time::Duration;

const L0: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../projects/domainspec-v2/development/backend-cli-completion/layers/L0-semantic-pattern-proof/execution-dag.json"
);

fn sha(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}

fn bindings(source: &Value) -> ScopeBindings {
    let mut result = BTreeMap::new();
    let mut index = 0;
    for node in source["nodes"].as_array().unwrap() {
        for field in ["read_scope", "write_scope"] {
            for scope in node[field].as_array().unwrap() {
                let scope = scope.as_str().unwrap();
                let exact = !scope.chars().any(char::is_whitespace)
                    && !Path::new(scope).is_absolute()
                    && Path::new(scope)
                        .components()
                        .all(|part| matches!(part, Component::Normal(_)));
                if !exact {
                    result.entry(scope.to_owned()).or_insert_with(|| {
                        index += 1;
                        vec![format!("resolved/scope-{index}")]
                    });
                }
            }
        }
    }
    ScopeBindings(result)
}

#[test]
fn compiler_emits_exact_flattened_gate_dominated_graph() {
    let bytes = fs::read(L0).unwrap();
    let source: Value = serde_json::from_slice(&bytes).unwrap();
    let first = compile_l0(&bytes, &bindings(&source)).unwrap();
    let second = compile_l0(&bytes, &bindings(&source)).unwrap();
    assert_eq!(first.value, second.value);
    assert_eq!(first.definition.nodes.len(), 39);
    assert_eq!(
        first
            .definition
            .nodes
            .keys()
            .filter(|id| id.starts_with("gate."))
            .count(),
        9
    );
    assert_eq!(
        first
            .definition
            .nodes
            .keys()
            .filter(|id| id.starts_with("checkpoint."))
            .count(),
        9
    );
    assert_eq!(first.value["authority_effect"], "none");
    assert_eq!(first.value["external_effect_authorized"], false);
    let mut changed_source = source.clone();
    changed_source["nodes"][0]["title"] = json!("source-sensitive change");
    let changed_bytes = serde_json::to_vec(&changed_source).unwrap();
    let changed = compile_l0(&changed_bytes, &bindings(&changed_source)).unwrap();
    assert_ne!(first.source_sha256, changed.source_sha256);
    assert_ne!(first.graph_sha256, changed.graph_sha256);
}

#[test]
fn compiler_kills_cycle_missing_dependency_nested_scheduler_and_unresolved_scope() {
    let bytes = fs::read(L0).unwrap();
    let source: Value = serde_json::from_slice(&bytes).unwrap();
    assert!(compile_l0(&bytes, &ScopeBindings::default())
        .unwrap_err()
        .starts_with("COMPILE_SCOPE_UNRESOLVED"));

    let mut missing = source.clone();
    missing["nodes"][1]["depends_on"] = json!(["absent"]);
    assert!(
        compile_l0(&serde_json::to_vec(&missing).unwrap(), &bindings(&missing))
            .unwrap_err()
            .starts_with("DAG_DEPENDENCY_MISSING")
    );

    let mut cycle = source.clone();
    cycle["nodes"][0]["depends_on"] = json!(["L0-B01-01"]);
    assert_eq!(
        compile_l0(&serde_json::to_vec(&cycle).unwrap(), &bindings(&cycle)).unwrap_err(),
        "DAG_CYCLE_DETECTED"
    );

    let mut nested = source.clone();
    nested["nodes"][0]["kind"] = json!("nested-scheduler");
    assert!(
        compile_l0(&serde_json::to_vec(&nested).unwrap(), &bindings(&nested))
            .unwrap_err()
            .starts_with("COMPILE_NESTED_SCHEDULER_FORBIDDEN")
    );
}

#[test]
fn compiled_envelope_rejects_schema_authority_and_stage_topology_drift() {
    let bytes = fs::read(L0).unwrap();
    let source: Value = serde_json::from_slice(&bytes).unwrap();
    let value = compile_l0(&bytes, &bindings(&source)).unwrap().value;
    let mut authority = value.clone();
    authority["authority_effect"] = json!("write");
    assert_eq!(
        validate_compiled_composite(&authority).unwrap_err(),
        "COMPOSITE_AUTHORITY_CEILING_VIOLATION"
    );
    let mut schema = value.clone();
    schema["schema_version"] = json!("hostile");
    assert_eq!(
        validate_compiled_composite(&schema).unwrap_err(),
        "COMPOSITE_ENVELOPE_IDENTITY_INVALID"
    );
    let mut topology = value.clone();
    let gate = topology["nodes"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|node| node["node_id"] == "gate.product-ontology")
        .unwrap();
    gate["depends_on"] = json!(["preflight.L0-B01-01"]);
    assert!(validate_compiled_composite(&topology)
        .unwrap_err()
        .starts_with("COMPOSITE_STAGE_TOPOLOGY_INVALID"));
    let mut checkpoint_bypass = value.clone();
    let checkpoint = checkpoint_bypass["nodes"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|node| node["node_id"] == "checkpoint.domainspec-source")
        .unwrap();
    checkpoint["depends_on"] = json!(["gate.domainspec-source"]);
    assert!(validate_compiled_composite(&checkpoint_bypass)
        .unwrap_err()
        .starts_with("COMPOSITE_STAGE_TOPOLOGY_INVALID"));
    let mut orphaned_work = value.clone();
    let work = orphaned_work["nodes"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|node| node["node_id"] == "work.domainspec-source.L0-B04-01-source")
        .unwrap();
    work["depends_on"] = json!(["gate.domainspec-source"]);
    assert!(validate_compiled_composite(&orphaned_work)
        .unwrap_err()
        .starts_with("COMPOSITE_STAGE_TOPOLOGY_INVALID"));
    let mut semantic_reuse = value.clone();
    semantic_reuse["nodes"]
        .as_array_mut()
        .unwrap()
        .iter_mut()
        .find(|node| node["node_id"] == "work.canonical-definitions.L0-B02-01")
        .unwrap()["contract"] = json!("c19-gate");
    assert!(validate_compiled_composite(&semantic_reuse)
        .unwrap_err()
        .starts_with("COMPOSITE_NODE_SEMANTICS_INVALID"));
    let mut node_effect = value;
    node_effect["nodes"][0]["static_input"]["authority_effect"] = json!("write");
    assert!(validate_compiled_composite(&node_effect)
        .unwrap_err()
        .starts_with("COMPOSITE_NODE_EFFECT_ENVELOPE_INVALID"));
}

#[test]
fn gate_bypass_is_rejected() {
    let bytes = fs::read(L0).unwrap();
    let source: Value = serde_json::from_slice(&bytes).unwrap();
    let mut value = compile_l0(&bytes, &bindings(&source)).unwrap().value;
    let nodes = value["nodes"].as_array_mut().unwrap();
    let work = nodes
        .iter_mut()
        .find(|node| node["node_id"] == "work.canonical-definitions.L0-B02-01")
        .unwrap();
    work["depends_on"] = json!(["preflight.L0-B01-01"]);
    let definition = DagDefinition::from_value(&value).unwrap();
    assert!(validate_gate_domination(&definition)
        .unwrap_err()
        .starts_with("COMPILE_GATE_DOMINATION_VIOLATION"));
}

struct C19Fixture {
    root: tempfile::TempDir,
    evaluator: PathBuf,
    program: PathBuf,
    attempt: PathBuf,
    evaluator_sha: String,
    program_sha: String,
    attempt_sha: String,
}

fn c19_fixture(script_body: &str) -> C19Fixture {
    let root = tempfile::tempdir().unwrap();
    let evaluator = root.path().join("evaluator");
    let program = root.path().join("program.json");
    let attempt = root.path().join("attempt.json");
    fs::write(&evaluator, format!("#!/bin/sh\n{script_body}\n")).unwrap();
    let mut permissions = fs::metadata(&evaluator).unwrap().permissions();
    permissions.set_mode(0o700);
    fs::set_permissions(&evaluator, permissions).unwrap();
    fs::write(
        &program,
        serde_json::to_vec(&json!({"program_id":"C19"})).unwrap(),
    )
    .unwrap();
    fs::write(
        &attempt,
        serde_json::to_vec(&json!({"program_id":"C19","attempt_id":"attempt-1"})).unwrap(),
    )
    .unwrap();
    C19Fixture {
        evaluator_sha: plain_file_sha(&evaluator),
        program_sha: plain_file_sha(&program),
        attempt_sha: plain_file_sha(&attempt),
        root,
        evaluator,
        program,
        attempt,
    }
}

fn run_c19<'a>(
    fixture: &'a C19Fixture,
    stage: &'a str,
    evaluator_sha: &'a str,
    program_sha: &'a str,
    attempt_sha: &'a str,
    timeout: Duration,
    maximum: usize,
) -> cav2_work_orchestration_etl_demo::c19::C19GateResult {
    let are = Box::leak(Box::new(
        json!({"kind":"direct","next_stage":"compiled-graph","effect_authorized":false,"authority_effect":"none"}),
    ));
    evaluate_exact(C19GateInput {
        node_id: "gate.compiled-graph",
        command_id: "command-1",
        expected_stage: stage,
        expected_program_id: "C19",
        expected_attempt_id: "attempt-1",
        repository_root: fixture.root.path(),
        evaluator_path: &fixture.evaluator,
        evaluator_sha256: evaluator_sha,
        program_path: &fixture.program,
        program_sha256: program_sha,
        attempt_path: &fixture.attempt,
        attempt_sha256: attempt_sha,
        timeout,
        max_output_bytes: maximum,
        are_result: are,
    })
}

#[test]
fn c19_invokes_exact_inputs_and_composes_actual_next_action_shape() {
    let output = r#"{"program_id":"C19","attempt_id":"attempt-1","decision":"CONTINUE","next_action":{"kind":"advance-authorized-stage","stage":"compiled-graph"},"effect_authorized":false,"authority_effect":"none"}"#;
    let fixture = c19_fixture(&format!("printf '%s' '{output}'"));
    let ok = run_c19(
        &fixture,
        "compiled-graph",
        &fixture.evaluator_sha,
        &fixture.program_sha,
        &fixture.attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(ok.event.outcome, "succeeded");
    assert!(!ok.work_emitted);
    let stage = run_c19(
        &fixture,
        "system-ontology",
        &fixture.evaluator_sha,
        &fixture.program_sha,
        &fixture.attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(stage.event.error.as_deref(), Some("C19_STAGE_MISMATCH"));
    assert!(!stage.work_emitted);
}

#[test]
fn c19_hostiles_fail_without_work() {
    let output = r#"{"program_id":"C19","attempt_id":"attempt-1","decision":"CONTINUE","next_action":{"kind":"advance-authorized-stage","stage":"compiled-graph"},"effect_authorized":false,"authority_effect":"none"}"#;
    let fixture = c19_fixture(&format!("printf '%s' '{output}'"));
    for (digest, expected) in [
        (
            (
                "sha256:wrong",
                fixture.program_sha.as_str(),
                fixture.attempt_sha.as_str(),
            ),
            "C19_EVALUATOR_DIGEST_DRIFT",
        ),
        (
            (
                fixture.evaluator_sha.as_str(),
                "sha256:wrong",
                fixture.attempt_sha.as_str(),
            ),
            "C19_PROGRAM_DIGEST_DRIFT",
        ),
        (
            (
                fixture.evaluator_sha.as_str(),
                fixture.program_sha.as_str(),
                "sha256:wrong",
            ),
            "C19_ATTEMPT_DIGEST_DRIFT",
        ),
    ] {
        let result = run_c19(
            &fixture,
            "compiled-graph",
            digest.0,
            digest.1,
            digest.2,
            Duration::from_secs(1),
            4096,
        );
        assert_eq!(result.event.error.as_deref(), Some(expected));
        assert!(!result.work_emitted);
    }
    let bad_program = c19_fixture(&format!("printf '%s' '{output}'"));
    fs::write(&bad_program.program, br#"{"program_id":"OTHER"}"#).unwrap();
    let bad_program_sha = plain_file_sha(&bad_program.program);
    let result = run_c19(
        &bad_program,
        "compiled-graph",
        &bad_program.evaluator_sha,
        &bad_program_sha,
        &bad_program.attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(
        result.event.error.as_deref(),
        Some("C19_PROGRAM_ID_MISMATCH")
    );
    assert!(!result.work_emitted);
    let bad_attempt = c19_fixture(&format!("printf '%s' '{output}'"));
    fs::write(
        &bad_attempt.attempt,
        br#"{"program_id":"C19","attempt_id":"other"}"#,
    )
    .unwrap();
    let bad_attempt_sha = plain_file_sha(&bad_attempt.attempt);
    let result = run_c19(
        &bad_attempt,
        "compiled-graph",
        &bad_attempt.evaluator_sha,
        &bad_attempt.program_sha,
        &bad_attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(
        result.event.error.as_deref(),
        Some("C19_ATTEMPT_ID_MISMATCH")
    );
    assert!(!result.work_emitted);
    let malformed = c19_fixture("printf 'not-json'");
    let result = run_c19(
        &malformed,
        "compiled-graph",
        &malformed.evaluator_sha,
        &malformed.program_sha,
        &malformed.attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(
        result.event.error.as_deref(),
        Some("C19_EVALUATOR_MALFORMED_JSON")
    );
    assert!(!result.work_emitted);
    let oversized = c19_fixture("head -c 8192 /dev/zero");
    let result = run_c19(
        &oversized,
        "compiled-graph",
        &oversized.evaluator_sha,
        &oversized.program_sha,
        &oversized.attempt_sha,
        Duration::from_secs(1),
        128,
    );
    assert_eq!(
        result.event.error.as_deref(),
        Some("C19_EVALUATOR_OUTPUT_LIMIT_EXCEEDED")
    );
    assert!(!result.work_emitted);
    let timeout = c19_fixture("sleep 1");
    let result = run_c19(
        &timeout,
        "compiled-graph",
        &timeout.evaluator_sha,
        &timeout.program_sha,
        &timeout.attempt_sha,
        Duration::from_millis(20),
        128,
    );
    assert_eq!(result.event.error.as_deref(), Some("C19_EVALUATOR_TIMEOUT"));
    assert!(!result.work_emitted);
    let stop_output = r#"{"program_id":"C19","attempt_id":"attempt-1","decision":"STOP","next_action":null,"effect_authorized":false,"authority_effect":"none"}"#;
    let stop = c19_fixture(&format!("printf '%s' '{stop_output}'; exit 2"));
    let result = run_c19(
        &stop,
        "compiled-graph",
        &stop.evaluator_sha,
        &stop.program_sha,
        &stop.attempt_sha,
        Duration::from_secs(1),
        4096,
    );
    assert_eq!(
        result.event.error.as_deref(),
        Some("C19_CONTINUATION_NOT_PERMITTED")
    );
    assert!(!result.work_emitted);
}

fn file_sha(path: &Path) -> String {
    sha(&fs::read(path).unwrap())
}

fn plain_file_sha(path: &Path) -> String {
    format!("{:x}", Sha256::digest(fs::read(path).unwrap()))
}

fn closure(paths: &[&str]) -> BTreeMap<PathBuf, String> {
    paths
        .iter()
        .map(|path| {
            let path = PathBuf::from(path);
            let digest = file_sha(&path);
            (path, digest)
        })
        .collect()
}

fn repo_input(root: &Path, bubblewrap: &Path, executable: &Path) -> RepositoryWorkInput {
    RepositoryWorkInput {
        command_id: "command-1".to_owned(),
        repository_root: root.to_path_buf(),
        repository_root_identity: repository_root_identity(root).unwrap(),
        argv: vec!["--version".to_owned()],
        read_scope: vec![PathBuf::from("input.txt")],
        write_scope: vec![PathBuf::from("out.txt")],
        required_outputs: BTreeMap::from([(PathBuf::from("out.txt"), None)]),
        protected_sha256: BTreeMap::from([(
            PathBuf::from("protected.txt"),
            file_sha(&root.join("protected.txt")),
        )]),
        deadline_unix_ms: 10_000,
        max_output_bytes: 4096,
        authority_effect: "none".to_owned(),
        external_effect: "none".to_owned(),
        toolchain: ToolchainBinding {
            executable: executable.to_path_buf(),
            executable_sha256: file_sha(executable),
            closure_sha256: BTreeMap::new(),
            bubblewrap: bubblewrap.to_path_buf(),
            bubblewrap_sha256: file_sha(bubblewrap),
        },
    }
}

#[test]
fn repository_preflight_kills_path_scope_toolchain_and_protected_mutants_without_promotion() {
    let repo = tempfile::tempdir().unwrap();
    fs::write(repo.path().join("input.txt"), "input").unwrap();
    fs::write(repo.path().join("protected.txt"), "protected").unwrap();
    let bwrap = Path::new("/usr/bin/bwrap");
    let executable = Path::new("/usr/bin/true");
    let good = repo_input(repo.path(), bwrap, executable);
    assert!(prepare(good.clone(), 1).is_ok());

    let mut escape = good.clone();
    escape.write_scope = vec![PathBuf::from("../escape")];
    assert!(prepare(escape, 1)
        .unwrap_err()
        .starts_with("REPOSITORY_PATH_ESCAPE"));

    let mut scope = good.clone();
    scope.required_outputs = BTreeMap::from([(PathBuf::from("elsewhere.txt"), None)]);
    assert!(prepare(scope, 1)
        .unwrap_err()
        .starts_with("REPOSITORY_SCOPE_EXPANSION"));

    let mut tool = good.clone();
    tool.toolchain.executable_sha256 = "sha256:wrong".to_owned();
    assert_eq!(prepare(tool, 1).unwrap_err(), "TOOLCHAIN_BINDING_DRIFT");

    let mut closure_drift = good.clone();
    closure_drift.toolchain.closure_sha256 = BTreeMap::from([(
        PathBuf::from("/lib/x86_64-linux-gnu/libc.so.6"),
        "sha256:wrong".to_owned(),
    )]);
    assert!(prepare(closure_drift, 1)
        .unwrap_err()
        .starts_with("TOOLCHAIN_CLOSURE_DRIFT"));

    let mut non_atomic = good.clone();
    non_atomic.write_scope.push(PathBuf::from("second.txt"));
    non_atomic
        .required_outputs
        .insert(PathBuf::from("second.txt"), None);
    assert_eq!(
        prepare(non_atomic, 1).unwrap_err(),
        "REPOSITORY_NONATOMIC_WRITE_SET"
    );

    let mut protected = good;
    protected
        .protected_sha256
        .insert(PathBuf::from("protected.txt"), "sha256:wrong".to_owned());
    assert!(prepare(protected, 1)
        .unwrap_err()
        .starts_with("PROTECTED_HASH_DRIFT"));
    assert!(!repo.path().join("out.txt").exists());
}

#[test]
fn repository_adapter_executes_only_in_staging_and_promotes_exact_output() {
    let repo = tempfile::tempdir().unwrap();
    fs::write(repo.path().join("input.txt"), "contained-output").unwrap();
    fs::write(repo.path().join("protected.txt"), "protected").unwrap();
    let executable = Path::new("/usr/bin/cp");
    let mut input = repo_input(repo.path(), Path::new("/usr/bin/bwrap"), executable);
    input.argv = vec!["input.txt".to_owned(), "out.txt".to_owned()];
    input.toolchain.closure_sha256 = closure(&[
        "/lib/x86_64-linux-gnu/libc.so.6",
        "/lib/x86_64-linux-gnu/libselinux.so.1",
        "/lib/x86_64-linux-gnu/libacl.so.1",
        "/lib/x86_64-linux-gnu/libattr.so.1",
        "/lib/x86_64-linux-gnu/libpcre2-8.so.0",
        "/lib64/ld-linux-x86-64.so.2",
    ]);
    let receipt = prepare(input, 1).unwrap().execute(1);
    assert_eq!(receipt.status, "succeeded", "{:?}", receipt.cause);
    assert_eq!(receipt.changed_paths, vec![PathBuf::from("out.txt")]);
    assert_eq!(
        fs::read_to_string(repo.path().join("out.txt")).unwrap(),
        "contained-output"
    );
    assert_eq!(
        fs::read_to_string(repo.path().join("protected.txt")).unwrap(),
        "protected"
    );
}

#[test]
fn repository_adapter_blocks_concurrent_drift_excess_output_and_deadline() {
    let repo = tempfile::tempdir().unwrap();
    fs::write(repo.path().join("input.txt"), "contained-output").unwrap();
    fs::write(repo.path().join("protected.txt"), "protected").unwrap();
    let mut cp = repo_input(
        repo.path(),
        Path::new("/usr/bin/bwrap"),
        Path::new("/usr/bin/cp"),
    );
    cp.argv = vec!["input.txt".to_owned(), "out.txt".to_owned()];
    cp.toolchain.closure_sha256 = closure(&[
        "/lib/x86_64-linux-gnu/libc.so.6",
        "/lib/x86_64-linux-gnu/libselinux.so.1",
        "/lib/x86_64-linux-gnu/libacl.so.1",
        "/lib/x86_64-linux-gnu/libattr.so.1",
        "/lib/x86_64-linux-gnu/libpcre2-8.so.0",
        "/lib64/ld-linux-x86-64.so.2",
    ]);
    let prepared = prepare(cp, 1).unwrap();
    fs::write(repo.path().join("out.txt"), "concurrent").unwrap();
    let receipt = prepared.execute(1);
    assert_eq!(
        receipt.cause.as_deref(),
        Some("REPOSITORY_WRITE_PREIMAGE_DRIFT:out.txt")
    );
    assert_eq!(
        fs::read_to_string(repo.path().join("out.txt")).unwrap(),
        "concurrent"
    );

    fs::remove_file(repo.path().join("out.txt")).unwrap();
    let mut noisy = repo_input(
        repo.path(),
        Path::new("/usr/bin/bwrap"),
        Path::new("/usr/bin/seq"),
    );
    noisy.argv = vec!["1".to_owned(), "10000".to_owned()];
    noisy.max_output_bytes = 64;
    noisy.toolchain.closure_sha256 = closure(&[
        "/lib/x86_64-linux-gnu/libc.so.6",
        "/lib64/ld-linux-x86-64.so.2",
    ]);
    let receipt = prepare(noisy, 1).unwrap().execute(1);
    assert_eq!(
        receipt.cause.as_deref(),
        Some("REPOSITORY_OUTPUT_LIMIT_EXCEEDED")
    );
    assert!(!repo.path().join("out.txt").exists());

    let mut slow = repo_input(
        repo.path(),
        Path::new("/usr/bin/bwrap"),
        Path::new("/usr/bin/sleep"),
    );
    slow.argv = vec!["1".to_owned()];
    slow.deadline_unix_ms = 20;
    slow.toolchain.closure_sha256 = closure(&[
        "/lib/x86_64-linux-gnu/libc.so.6",
        "/lib64/ld-linux-x86-64.so.2",
    ]);
    let receipt = prepare(slow, 1).unwrap().execute(1);
    assert_eq!(receipt.cause.as_deref(), Some("GLOBAL_DEADLINE_EXCEEDED"));
    assert!(!repo.path().join("out.txt").exists());
}

#[test]
fn repository_adapter_rechecks_absent_destination_chain_before_promotion() {
    let repo = tempfile::tempdir().unwrap();
    let external = tempfile::tempdir().unwrap();
    fs::write(repo.path().join("input.txt"), "contained-output").unwrap();
    fs::write(repo.path().join("protected.txt"), "protected").unwrap();
    let mut input = repo_input(
        repo.path(),
        Path::new("/usr/bin/bwrap"),
        Path::new("/usr/bin/cp"),
    );
    input.argv = vec!["input.txt".to_owned(), "nested/out.txt".to_owned()];
    input.write_scope = vec![PathBuf::from("nested/out.txt")];
    input.required_outputs = BTreeMap::from([(PathBuf::from("nested/out.txt"), None)]);
    input.toolchain.closure_sha256 = closure(&[
        "/lib/x86_64-linux-gnu/libc.so.6",
        "/lib/x86_64-linux-gnu/libselinux.so.1",
        "/lib/x86_64-linux-gnu/libacl.so.1",
        "/lib/x86_64-linux-gnu/libattr.so.1",
        "/lib/x86_64-linux-gnu/libpcre2-8.so.0",
        "/lib64/ld-linux-x86-64.so.2",
    ]);
    let prepared = prepare(input, 1).unwrap();
    symlink(external.path(), repo.path().join("nested")).unwrap();
    let receipt = prepared.execute(1);
    assert!(matches!(
        receipt.cause.as_deref(),
        Some(cause) if cause.starts_with("REPOSITORY_PATH_LINK_FORBIDDEN")
            || cause.starts_with("REPOSITORY_WRITE_CHAIN_DRIFT")
    ));
    assert!(!receipt.promoted);
    assert!(!external.path().join("out.txt").exists());
}

fn transition(
    event_id: &str,
    expected: Option<&str>,
    cursor: &str,
    event: Value,
) -> StructuralTransition {
    StructuralTransition {
        stream_id: stream_identity(&json!({"graph":"g"})),
        expected_cursor_identity: expected.map(str::to_owned),
        event_id: event_id.to_owned(),
        accepted_event: event,
        next_cursor: json!({"cursor":cursor}),
        next_cursor_identity: sha(&serde_json::to_vec(&json!({"cursor":cursor})).unwrap()),
        command_intents: vec![json!({"command_id":format!("command-{event_id}")})],
    }
}

#[test]
fn durable_history_distinguishes_exact_and_divergent_duplicate_and_preserves_deadline() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("history.json");
    let mut history = FileAcceptedHistory::open(&path).unwrap();
    let stream = stream_identity(&json!({"graph":"g"}));
    history
        .open_stream(&stream, &json!({"graph":"g"}), 100, 1)
        .unwrap();
    let first = transition(
        "event-1",
        None,
        "one",
        json!({"event_id":"event-1","value":1}),
    );
    assert_eq!(
        history.compare_and_append(first.clone()),
        AppendOutcome::Accepted
    );
    assert_eq!(history.compare_and_append(first), AppendOutcome::Duplicate);
    let divergent = transition(
        "event-1",
        None,
        "one",
        json!({"event_id":"event-1","value":2}),
    );
    assert_eq!(
        history.compare_and_append(divergent),
        AppendOutcome::DivergentDuplicate
    );
    drop(history);
    let reopened = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(reopened.read(&stream).events.len(), 1);
    assert_eq!(
        reopened.assert_resumable(&stream, 100).unwrap_err(),
        "GLOBAL_DEADLINE_EXCEEDED"
    );
}

#[test]
fn file_history_rejects_stream_identity_and_denormalized_tampering() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("history.json");
    let identity = json!({"graph":"g"});
    let stream = stream_identity(&identity);
    let mut history = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(
        history
            .open_stream("invented-stream", &identity, 100, 1)
            .unwrap_err(),
        "HISTORY_STREAM_IDENTITY_MISMATCH"
    );
    history.open_stream(&stream, &identity, 100, 1).unwrap();
    history.compare_and_append(transition(
        "event-1",
        None,
        "one",
        json!({"event_id":"event-1","value":1}),
    ));
    drop(history);
    let mut stored: Value = serde_json::from_slice(&fs::read(&path).unwrap()).unwrap();
    stored["streams"][&stream]["events"][0]["value"] = json!(999);
    fs::write(&path, serde_json::to_vec_pretty(&stored).unwrap()).unwrap();
    assert!(matches!(
        FileAcceptedHistory::open(&path),
        Err(error) if error.starts_with("HISTORY_CORRUPT")
    ));
}

#[test]
fn accepted_history_rejects_transition_identity_tampering_without_mutation() {
    use cav2_work_orchestration_etl_demo::ports::InMemoryAcceptedHistory;

    let mut history = InMemoryAcceptedHistory::default();
    let stream = stream_identity(&json!({"graph":"g"}));
    let before = history.read(&stream);
    let mut cursor_drift = transition(
        "event-1",
        None,
        "one",
        json!({"event_id":"event-1","value":1}),
    );
    cursor_drift.next_cursor_identity = "sha256:wrong".to_owned();
    assert_eq!(
        history.compare_and_append(cursor_drift),
        AppendOutcome::Conflict
    );
    assert_eq!(history.read(&stream), before);

    let event_drift = transition(
        "event-1",
        None,
        "one",
        json!({"event_id":"different","value":1}),
    );
    assert_eq!(
        history.compare_and_append(event_drift),
        AppendOutcome::Conflict
    );
    assert_eq!(history.read(&stream), before);
}

#[test]
fn command_receipt_requires_a_prior_begin() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("history.json");
    let mut history = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(
        history
            .record_command_receipt("never-begun", json!({"status":"succeeded"}))
            .unwrap_err(),
        "COMMAND_NOT_BEGUN"
    );
    assert!(history.command_receipt("never-begun").is_none());
}

#[test]
fn begin_command_rolls_back_memory_when_atomic_persist_fails() {
    let dir = tempfile::tempdir().unwrap();
    let parent = dir.path().join("store");
    fs::create_dir(&parent).unwrap();
    let path = parent.join("history.json");
    let mut history = FileAcceptedHistory::open(&path).unwrap();
    fs::remove_dir(&parent).unwrap();
    fs::write(&parent, "not-a-directory").unwrap();
    assert!(history
        .begin_command("command-1", &json!({"input":1}))
        .unwrap_err()
        .starts_with("HISTORY_WRITE_FAILED"));
    fs::remove_file(&parent).unwrap();
    fs::create_dir(&parent).unwrap();
    assert_eq!(
        history
            .begin_command("command-1", &json!({"input":1}))
            .unwrap(),
        ResumeDisposition::Execute
    );
}

#[test]
fn resume_never_blindly_repeats_an_in_progress_or_completed_command() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("history.json");
    let input = json!({"command_id":"command-1","input":"exact"});
    let mut history = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(
        history.begin_command("command-1", &input).unwrap(),
        ResumeDisposition::Execute
    );
    drop(history);
    let mut resumed = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(
        resumed.begin_command("command-1", &input).unwrap_err(),
        "REPOSITORY_RECONCILIATION_REQUIRED"
    );
    let receipt = json!({"command_id":"command-1","status":"succeeded"});
    resumed
        .record_command_receipt("command-1", receipt.clone())
        .unwrap();
    drop(resumed);
    let mut complete = FileAcceptedHistory::open(&path).unwrap();
    assert_eq!(
        complete.begin_command("command-1", &input).unwrap(),
        ResumeDisposition::Completed(receipt)
    );
}

#[test]
fn helper_receipt_must_be_exact_closed_single_joined_and_non_accepting() {
    let receipt = json!({
        "status":"closed","run_id":"run-1","joined":true,
        "authority_effect":"none","external_effect":"none","accepted_own_candidate":false
    });
    assert!(validate_helper_receipt(&[receipt.clone()], "run-1").is_ok());
    assert_eq!(
        validate_helper_receipt(&[], "run-1").unwrap_err(),
        "HELPER_CARDINALITY_VIOLATION"
    );
    assert_eq!(
        validate_helper_receipt(&[receipt.clone(), receipt], "run-1").unwrap_err(),
        "HELPER_CARDINALITY_VIOLATION"
    );
}
