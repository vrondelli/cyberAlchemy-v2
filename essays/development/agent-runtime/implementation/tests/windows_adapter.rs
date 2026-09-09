use essays_agent_runtime::{Command, ipc, security::local_process_principal};

#[test]
fn local_process_identity_has_platform_prefix_and_stable_shape() {
    let first = local_process_principal("adapter-test").expect("derive process principal");
    let second = local_process_principal("adapter-test").expect("derive process principal again");
    assert_eq!(first.subject(), second.subject());
    #[cfg(unix)]
    assert!(
        first
            .subject()
            .strip_prefix("unix:")
            .is_some_and(|id| !id.is_empty() && id.chars().all(|c| c.is_ascii_digit()))
    );
    #[cfg(windows)]
    assert!(
        first.subject().strip_prefix("windows:S-").is_some_and(
            |sid| !sid.is_empty() && sid.chars().all(|c| c.is_ascii_digit() || c == '-')
        )
    );
}

#[test]
fn framed_json_codec_remains_transport_neutral_and_bounded() {
    let request = ipc::IpcRequest {
        client_id: "adapter-test".into(),
        command: Command::CreateWorkspace {
            request_id: "request-adapter".into(),
            workspace_id: "workspace-test".into(),
            work_owner: "owner-test".into(),
            initial_text: String::new(),
            deadline_unix_ms: i64::MAX,
        },
    };
    let mut bytes = Vec::new();
    ipc::write_frame(&mut bytes, &request).expect("encode frame");
    let decoded: ipc::IpcRequest =
        ipc::read_frame(bytes.as_slice(), 262_144).expect("decode frame");
    assert_eq!(decoded.client_id, request.client_id);
    assert!(ipc::read_frame::<ipc::IpcRequest>(bytes.as_slice(), 1).is_err());
}

#[test]
fn windows_override_preserves_required_bundle_posture() {
    let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let base: serde_json::Value = serde_json::from_slice(
        &std::fs::read(root.join("desktop/src-tauri/tauri.conf.json")).expect("read base config"),
    )
    .expect("parse base config");
    let windows: serde_json::Value = serde_json::from_slice(
        &std::fs::read(root.join("desktop/src-tauri/tauri.windows.conf.json"))
            .expect("read Windows override"),
    )
    .expect("parse Windows override");
    assert_eq!(
        base["app"]["security"]["csp"].as_str(),
        Some("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:")
    );
    assert_eq!(
        windows["bundle"]["targets"],
        serde_json::json!(["msi", "nsis"])
    );
    assert_eq!(
        windows["bundle"]["icon"],
        serde_json::json!(["icons/icon.ico"])
    );
    assert_eq!(
        windows["bundle"]["windows"]["webviewInstallMode"]["type"],
        "embedBootstrapper"
    );
    assert_eq!(windows["bundle"]["windows"]["allowDowngrades"], false);
}
