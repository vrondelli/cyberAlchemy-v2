use essays_agent_runtime::{
    Command, Receipt, Runtime, RuntimeEvent, SqliteStore, WorkspaceSnapshot,
    security::local_process_principal,
};
use serde::Serialize;
use serde_json::{Value, json};
use std::{
    collections::{HashMap, VecDeque},
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Child, Command as ProcessCommand, Stdio},
    sync::{
        Arc, Mutex,
        atomic::{AtomicU64, Ordering},
        mpsc::{SyncSender, TrySendError, sync_channel},
    },
};
use tauri::{Manager, State, ipc::Channel};
use tokio::sync::{Mutex as AsyncMutex, OnceCell, oneshot};

const EVENT_BATCH_LIMIT: usize = 256;
const CHAT_COMMAND_LIMIT: usize = 1024 * 1024;
const CHAT_COMMAND_QUEUE_LIMIT: usize = 64;
const CHAT_EVENT_BUFFER_LIMIT: usize = 256;

#[derive(Clone, Default)]
struct EventSubscriptions {
    cancellations: Arc<Mutex<HashMap<String, (u64, oneshot::Sender<()>)>>>,
    next_generation: Arc<AtomicU64>,
}

impl EventSubscriptions {
    fn replace(&self, subscription_id: String, cancellation: oneshot::Sender<()>) -> u64 {
        let generation = self.next_generation.fetch_add(1, Ordering::Relaxed);
        if let Some(previous) = self
            .cancellations
            .lock()
            .expect("event subscription lock poisoned")
            .insert(subscription_id, (generation, cancellation))
        {
            let _ = previous.1.send(());
        }
        generation
    }

    fn cancel(&self, subscription_id: &str) -> bool {
        self.cancellations
            .lock()
            .expect("event subscription lock poisoned")
            .remove(subscription_id)
            .is_some_and(|(_, cancellation)| cancellation.send(()).is_ok())
    }

    fn finish(&self, subscription_id: &str, generation: u64) {
        let mut cancellations = self
            .cancellations
            .lock()
            .expect("event subscription lock poisoned");
        if cancellations
            .get(subscription_id)
            .is_some_and(|(active_generation, _)| *active_generation == generation)
        {
            cancellations.remove(subscription_id);
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PrincipalEvidence {
    principal_subject: String,
    client_id: String,
    evidence_kind: &'static str,
    verified_human_identity: bool,
}

#[derive(Clone)]
struct ChatConfiguration {
    node_binary: String,
    bridge_path: Option<PathBuf>,
    upstream: Option<String>,
    cwd: PathBuf,
    model: Option<String>,
    receipt_path: Option<PathBuf>,
    allow_protocol_drift: bool,
}

impl ChatConfiguration {
    fn from_environment() -> Self {
        Self {
            node_binary: std::env::var("ARE_CODEX_NODE").unwrap_or_else(|_| "node".to_string()),
            bridge_path: std::env::var_os("ARE_CODEX_BRIDGE").map(PathBuf::from),
            upstream: std::env::var("CODEX_BINARY").ok(),
            cwd: std::env::var_os("ARE_CODEX_CWD")
                .map(PathBuf::from)
                .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))),
            model: std::env::var("ARE_CODEX_MODEL").ok(),
            receipt_path: std::env::var_os("ARE_CODEX_RECEIPT_PATH").map(PathBuf::from),
            allow_protocol_drift: std::env::var("ARE_CODEX_ALLOW_PROTOCOL_DRIFT")
                .is_ok_and(|value| value == "1"),
        }
    }
}

#[derive(Default)]
struct ChatEventDelivery {
    channel: Option<Channel<Value>>,
    buffered: VecDeque<Value>,
    replay_pending: bool,
}

#[derive(Clone, Default)]
struct ChatEventBroker {
    delivery: Arc<Mutex<ChatEventDelivery>>,
}

impl ChatEventBroker {
    fn publish(&self, event: Value) {
        let mut delivery = self
            .delivery
            .lock()
            .expect("chat event broker lock poisoned");
        if !delivery.replay_pending
            && let Some(channel) = &delivery.channel
        {
            if channel.send(event.clone()).is_ok() {
                return;
            }
            delivery.channel = None;
        }
        delivery.buffered.push_back(event);
        while delivery.buffered.len() > CHAT_EVENT_BUFFER_LIMIT {
            delivery.buffered.pop_front();
        }
    }

    fn bind(&self, channel: Channel<Value>) {
        let mut delivery = self
            .delivery
            .lock()
            .expect("chat event broker lock poisoned");
        delivery.channel = Some(channel);
        delivery.replay_pending = true;
    }

    fn replay(&self) -> Result<usize, String> {
        let mut delivery = self
            .delivery
            .lock()
            .expect("chat event broker lock poisoned");
        let channel = delivery
            .channel
            .clone()
            .ok_or_else(|| "ARE chat event channel is not attached".to_string())?;
        let mut replayed = 0;
        while let Some(event) = delivery.buffered.pop_front() {
            if let Err(error) = channel.send(event.clone()) {
                delivery.buffered.push_front(event);
                delivery.channel = None;
                delivery.replay_pending = false;
                return Err(format!("failed to replay ARE chat event: {error}"));
            }
            replayed += 1;
        }
        delivery.replay_pending = false;
        Ok(replayed)
    }

    fn detach(&self) {
        let mut delivery = self
            .delivery
            .lock()
            .expect("chat event broker lock poisoned");
        delivery.channel = None;
        delivery.replay_pending = false;
    }

    #[cfg(test)]
    fn buffered_events(&self) -> Vec<Value> {
        self.delivery
            .lock()
            .expect("chat event broker lock poisoned")
            .buffered
            .iter()
            .cloned()
            .collect()
    }
}

struct ChatProcess {
    connection_id: Option<u64>,
    child: Child,
    commands: SyncSender<Vec<u8>>,
    events: ChatEventBroker,
}

impl Drop for ChatProcess {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

#[derive(Clone, Default)]
struct ChatSupervisor {
    process: Arc<OnceCell<AsyncMutex<ChatProcess>>>,
    next_connection: Arc<AtomicU64>,
}

impl ChatSupervisor {
    async fn process(
        &self,
        configuration: ChatConfiguration,
    ) -> Result<&AsyncMutex<ChatProcess>, String> {
        self.process
            .get_or_try_init(
                || async move { start_chat_process(&configuration).map(AsyncMutex::new) },
            )
            .await
    }

    fn prewarm(&self, configuration: &ChatConfiguration) {
        if let Ok(process) = start_chat_process(configuration) {
            let _ = self.process.set(AsyncMutex::new(process));
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ChatConnectionInfo {
    connection_id: u64,
    transport: &'static str,
    authority_effect: &'static str,
}

fn chat_event(kind: &str, fields: Value) -> Value {
    let mut event = json!({"type": kind, "emittedAtMs": unix_time_millis()});
    if let (Some(target), Some(source)) = (event.as_object_mut(), fields.as_object()) {
        target.extend(source.clone());
    }
    event
}

fn unix_time_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn validate_chat_command(command: &Value) -> Result<Vec<u8>, String> {
    let object = command
        .as_object()
        .ok_or_else(|| "chat command must be an object".to_string())?;
    let command_type = object
        .get("type")
        .and_then(Value::as_str)
        .ok_or_else(|| "chat command type is required".to_string())?;
    if !matches!(
        command_type,
        "turn.start"
            | "approval.resolve"
            | "user-input.resolve"
            | "continuation.resolve"
            | "session.close"
    ) {
        return Err("chat command type is not allowed".to_string());
    }
    if object
        .get("requestId")
        .and_then(Value::as_str)
        .is_none_or(|value| value.trim().is_empty())
    {
        return Err("chat requestId is required".to_string());
    }
    let mut bytes = serde_json::to_vec(command).map_err(|error| error.to_string())?;
    if bytes.len() > CHAT_COMMAND_LIMIT {
        return Err("chat command exceeds the one-megabyte limit".to_string());
    }
    bytes.push(b'\n');
    Ok(bytes)
}

fn start_chat_process(configuration: &ChatConfiguration) -> Result<ChatProcess, String> {
    let bridge_path = configuration
        .bridge_path
        .clone()
        .ok_or_else(|| "ARE_CODEX_BRIDGE is not configured by the host".to_string())?;
    let upstream = configuration
        .upstream
        .clone()
        .ok_or_else(|| "CODEX_BINARY is not configured by the host".to_string())?;
    if !bridge_path.is_file() {
        return Err("configured ARE Codex bridge is not a file".to_string());
    }
    if !configuration.cwd.is_dir() {
        return Err("configured ARE Codex cwd is not a directory".to_string());
    }
    let mut command = ProcessCommand::new(&configuration.node_binary);
    command
        .arg(&bridge_path)
        .arg("--upstream")
        .arg(&upstream)
        .arg("--cwd")
        .arg(&configuration.cwd)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(model) = &configuration.model {
        command.arg("--model").arg(model);
    }
    if let Some(receipt_path) = &configuration.receipt_path {
        command.arg("--receipt").arg(receipt_path);
    }
    if configuration.allow_protocol_drift {
        command.arg("--allow-protocol-drift");
    }
    let mut child = command
        .spawn()
        .map_err(|error| format!("failed to start ARE Codex bridge: {error}"))?;
    let mut stdin = child
        .stdin
        .take()
        .ok_or_else(|| "ARE Codex bridge stdin is unavailable".to_string())?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "ARE Codex bridge stdout is unavailable".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "ARE Codex bridge stderr is unavailable".to_string())?;

    let events = ChatEventBroker::default();
    let command_events = events.clone();
    let (commands, command_receiver) = sync_channel::<Vec<u8>>(CHAT_COMMAND_QUEUE_LIMIT);
    std::thread::spawn(move || {
        for bytes in command_receiver {
            if let Err(error) = stdin.write_all(&bytes).and_then(|_| stdin.flush()) {
                command_events.publish(chat_event(
                    "request.failed",
                    json!({"error": {
                        "message": error.to_string(),
                        "code": "ARE_CHAT_WRITE_FAILED"
                    }}),
                ));
                break;
            }
        }
    });
    let stdout_events = events.clone();
    std::thread::spawn(move || {
        for line in BufReader::new(stdout).lines().map_while(Result::ok) {
            let event = serde_json::from_str(&line)
                .unwrap_or_else(|_| chat_event("bridge.protocol-error", json!({})));
            stdout_events.publish(event);
        }
        stdout_events.publish(chat_event("bridge.closed", json!({})));
    });
    let stderr_events = events.clone();
    std::thread::spawn(move || {
        for line in BufReader::new(stderr).lines().map_while(Result::ok) {
            stderr_events.publish(chat_event("bridge.stderr", json!({"text": line})));
        }
    });

    Ok(ChatProcess {
        connection_id: None,
        child,
        commands,
        events,
    })
}

#[tauri::command]
fn chat_control_plane_status(supervisor: State<'_, ChatSupervisor>) -> bool {
    supervisor.process.get().is_some()
}

#[tauri::command]
async fn chat_connect(
    on_event: Channel<Value>,
    configuration: State<'_, ChatConfiguration>,
    supervisor: State<'_, ChatSupervisor>,
) -> Result<ChatConnectionInfo, String> {
    let connection_id = supervisor.next_connection.fetch_add(1, Ordering::Relaxed) + 1;
    let process = supervisor.process(configuration.inner().clone()).await?;
    let mut process = process.lock().await;
    process.events.bind(on_event);
    process.connection_id = Some(connection_id);
    Ok(ChatConnectionInfo {
        connection_id,
        transport: "tauri-channel-to-are-jsonl-stdio",
        authority_effect: "none",
    })
}

#[tauri::command]
async fn chat_replay(
    connection_id: u64,
    supervisor: State<'_, ChatSupervisor>,
) -> Result<usize, String> {
    let process = supervisor
        .process
        .get()
        .ok_or_else(|| "chat control plane is not started".to_string())?;
    let process = process.lock().await;
    if process.connection_id != Some(connection_id) {
        return Err("chat connection is not active".to_string());
    }
    process.events.replay()
}

#[tauri::command]
async fn chat_send(
    connection_id: u64,
    command: Value,
    supervisor: State<'_, ChatSupervisor>,
) -> Result<(), String> {
    let bytes = validate_chat_command(&command)?;
    let process = supervisor
        .process
        .get()
        .ok_or_else(|| "chat control plane is not started".to_string())?;
    let process = process.lock().await;
    if process.connection_id != Some(connection_id) {
        return Err("chat connection is not active".to_string());
    }
    process
        .commands
        .try_send(bytes)
        .map_err(|error| match error {
            TrySendError::Full(_) => "ARE chat command queue is full".to_string(),
            TrySendError::Disconnected(_) => "ARE chat command writer is unavailable".to_string(),
        })
}

#[tauri::command]
async fn chat_disconnect(
    connection_id: u64,
    supervisor: State<'_, ChatSupervisor>,
) -> Result<bool, String> {
    let Some(process) = supervisor.process.get() else {
        return Ok(false);
    };
    let mut process = process.lock().await;
    if process.connection_id != Some(connection_id) {
        return Ok(false);
    }
    process.events.detach();
    process.connection_id = None;
    Ok(true)
}

#[tauri::command]
fn principal_evidence() -> Result<PrincipalEvidence, String> {
    let principal = local_process_principal("essays-tauri").map_err(|error| error.to_string())?;
    Ok(PrincipalEvidence {
        principal_subject: principal.subject().to_string(),
        client_id: principal.client_id().to_string(),
        evidence_kind: "local-process",
        verified_human_identity: false,
    })
}

#[tauri::command]
async fn execute(command: Command, runtime: State<'_, Runtime>) -> Result<Receipt, String> {
    let runtime = runtime.inner().clone();
    tauri::async_runtime::spawn_blocking(move || {
        let principal =
            local_process_principal("essays-tauri").map_err(|error| error.to_string())?;
        runtime
            .execute(&command, &principal)
            .map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| format!("runtime command task failed: {error}"))?
}

#[tauri::command]
async fn snapshot(
    workspace_id: String,
    cursor: Option<i64>,
    runtime: State<'_, Runtime>,
) -> Result<Option<WorkspaceSnapshot>, String> {
    read_snapshot(runtime.inner().clone(), workspace_id, cursor).await
}

async fn read_snapshot(
    runtime: Runtime,
    workspace_id: String,
    cursor: Option<i64>,
) -> Result<Option<WorkspaceSnapshot>, String> {
    // SQLite and its store mutex must not occupy the desktop command thread.
    tauri::async_runtime::spawn_blocking(move || {
        runtime
            .snapshot(&workspace_id, cursor)
            .map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| format!("runtime snapshot task failed: {error}"))?
}

async fn events_after(
    runtime: Runtime,
    workspace_id: String,
    cursor: i64,
) -> Result<Vec<RuntimeEvent>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        runtime
            .events_after(&workspace_id, cursor, EVENT_BATCH_LIMIT)
            .map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| format!("runtime event task failed: {error}"))?
}

#[tauri::command]
fn subscribe_events(
    subscription_id: String,
    workspace_id: String,
    cursor: i64,
    on_event: Channel<RuntimeEvent>,
    runtime: State<'_, Runtime>,
    subscriptions: State<'_, EventSubscriptions>,
) -> Result<(), String> {
    if subscription_id.trim().is_empty() || workspace_id.trim().is_empty() || cursor < 0 {
        return Err("invalid event subscription".to_string());
    }

    let runtime = runtime.inner().clone();
    let subscriptions = subscriptions.inner().clone();
    let mut receiver = runtime.subscribe();
    let (cancel, mut cancelled) = oneshot::channel();
    let generation = subscriptions.replace(subscription_id.clone(), cancel);

    tauri::async_runtime::spawn(async move {
        let mut delivered_cursor = cursor;
        loop {
            let batch =
                match events_after(runtime.clone(), workspace_id.clone(), delivered_cursor).await {
                    Ok(batch) => batch,
                    Err(_) => break,
                };
            let batch_len = batch.len();
            for event in batch {
                if event.cursor > delivered_cursor {
                    delivered_cursor = event.cursor;
                    if on_event.send(event).is_err() {
                        subscriptions.finish(&subscription_id, generation);
                        return;
                    }
                }
            }
            if batch_len < EVENT_BATCH_LIMIT {
                break;
            }
        }

        loop {
            tokio::select! {
                _ = &mut cancelled => break,
                received = receiver.recv() => match received {
                    Ok(event) if event.workspace_id == workspace_id && event.cursor > delivered_cursor => {
                        delivered_cursor = event.cursor;
                        if on_event.send(event).is_err() { break; }
                    }
                    Ok(_) => {}
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {
                        match events_after(runtime.clone(), workspace_id.clone(), delivered_cursor).await {
                            Ok(batch) => {
                                for event in batch {
                                    if event.cursor > delivered_cursor {
                                        delivered_cursor = event.cursor;
                                        if on_event.send(event).is_err() {
                                            subscriptions.finish(&subscription_id, generation);
                                            return;
                                        }
                                    }
                                }
                            }
                            Err(_) => break,
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                }
            }
        }
        subscriptions.finish(&subscription_id, generation);
    });
    Ok(())
}

#[tauri::command]
fn unsubscribe_events(
    subscription_id: String,
    subscriptions: State<'_, EventSubscriptions>,
) -> bool {
    subscriptions.cancel(&subscription_id)
}

fn main() {
    let builder = tauri::Builder::default();
    #[cfg(feature = "wdio")]
    let builder = builder
        .plugin(tauri_plugin_wdio::init())
        .plugin(tauri_plugin_wdio_webdriver::init());

    #[cfg(feature = "wdio")]
    let context = tauri::generate_context!(capabilities = ["wdio/capabilities/wdio-smoke.json"]);
    #[cfg(not(feature = "wdio"))]
    let context = tauri::generate_context!();

    builder
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            let database = std::env::var_os("ESSAYS_DATABASE")
                .map(PathBuf::from)
                .unwrap_or_else(|| data_dir.join("essays.db"));
            if let Some(parent) = database.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let store =
                SqliteStore::open(database).map_err(|error| anyhow_for_tauri(error.to_string()))?;
            let chat_configuration = ChatConfiguration::from_environment();
            let chat_supervisor = ChatSupervisor::default();
            chat_supervisor.prewarm(&chat_configuration);
            app.manage(Runtime::new(store));
            app.manage(EventSubscriptions::default());
            app.manage(chat_configuration);
            app.manage(chat_supervisor);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            execute,
            snapshot,
            subscribe_events,
            unsubscribe_events,
            principal_evidence,
            chat_control_plane_status,
            chat_connect,
            chat_replay,
            chat_send,
            chat_disconnect
        ])
        .run(context)
        .expect("run Essays desktop shell");
}

fn anyhow_for_tauri(message: String) -> Box<dyn std::error::Error> {
    Box::new(std::io::Error::other(message))
}

#[cfg(test)]
mod tests {
    use super::{
        CHAT_EVENT_BUFFER_LIMIT, ChatEventBroker, EventSubscriptions, principal_evidence,
        read_snapshot, validate_chat_command,
    };
    use serde_json::json;

    #[test]
    fn snapshot_worker_preserves_missing_workspace() {
        let runtime = super::Runtime::new(super::SqliteStore::open(":memory:").unwrap());
        assert!(tauri::async_runtime::block_on(read_snapshot(
            runtime, "missing".into(), None,
        )).unwrap().is_none());
    }

    #[test]
    fn snapshot_worker_preserves_data_and_cursor_freshness() {
        let runtime = super::Runtime::new(super::SqliteStore::open(":memory:").unwrap());
        let principal = super::local_process_principal("snapshot-test").unwrap();
        runtime.execute(&super::Command::CreateWorkspace {
            request_id: "snapshot-create".into(),
            workspace_id: "snapshot-workspace".into(),
            work_owner: principal.subject().into(),
            initial_text: "snapshot contents".into(),
            deadline_unix_ms: super::unix_time_millis() as i64 + 60_000,
        }, &principal).unwrap();
        let expected = runtime.snapshot("snapshot-workspace", None).unwrap().unwrap();
        for cursor in [None, Some(expected.event_cursor), Some(expected.event_cursor + 1)] {
            let actual = tauri::async_runtime::block_on(read_snapshot(
                runtime.clone(), "snapshot-workspace".into(), cursor,
            )).unwrap().unwrap();
            let direct = runtime.snapshot("snapshot-workspace", cursor).unwrap().unwrap();
            let mut actual = serde_json::to_value(actual).unwrap();
            let mut direct = serde_json::to_value(direct).unwrap();
            // Each read intentionally has its own snapshot identity and timestamp.
            for value in [&mut actual, &mut direct] {
                assert!(value.as_object_mut().unwrap().remove("snapshot_id").is_some());
                assert!(value.as_object_mut().unwrap().remove("created_at_unix_ms").is_some());
            }
            assert_eq!(actual, direct);
        }
    }

    #[test]
    fn principal_evidence_keeps_subject_and_client_identity_distinct() {
        let evidence = principal_evidence().expect("local process identity");
        assert!(
            evidence.principal_subject.starts_with("unix:")
                || evidence.principal_subject.starts_with("windows:")
        );
        assert_eq!(evidence.client_id, "essays-tauri");
        assert_eq!(evidence.evidence_kind, "local-process");
        assert!(!evidence.verified_human_identity);
        assert_ne!(evidence.principal_subject, evidence.client_id);
    }

    #[test]
    fn replacing_and_cancelling_event_subscriptions_is_bounded() {
        let subscriptions = EventSubscriptions::default();
        let (first, first_cancelled) = tokio::sync::oneshot::channel();
        let first_generation = subscriptions.replace("workspace-stream".to_string(), first);
        let (second, second_cancelled) = tokio::sync::oneshot::channel();
        let second_generation = subscriptions.replace("workspace-stream".to_string(), second);

        assert!(first_cancelled.blocking_recv().is_ok());
        subscriptions.finish("workspace-stream", first_generation);
        assert!(subscriptions.cancel("workspace-stream"));
        assert!(second_cancelled.blocking_recv().is_ok());
        subscriptions.finish("workspace-stream", second_generation);
        assert!(!subscriptions.cancel("workspace-stream"));
    }

    #[test]
    fn chat_command_surface_is_allowlisted_and_bounded() {
        assert!(
            validate_chat_command(&json!({
                "type": "turn.start",
                "requestId": "turn-1",
                "text": "Inspect the candidate."
            }))
            .is_ok()
        );
        assert!(
            validate_chat_command(&json!({
                "type": "spawn.arbitrary",
                "requestId": "bad-1"
            }))
            .is_err()
        );
        assert!(validate_chat_command(&json!({"type": "turn.start"})).is_err());
    }

    #[test]
    fn chat_event_broker_retains_only_the_bounded_latest_events_before_attachment() {
        let broker = ChatEventBroker::default();
        for sequence in 0..(CHAT_EVENT_BUFFER_LIMIT + 7) {
            broker.publish(json!({"type": "fixture", "sequence": sequence}));
        }

        let buffered = broker.buffered_events();
        assert_eq!(buffered.len(), CHAT_EVENT_BUFFER_LIMIT);
        assert_eq!(buffered[0]["sequence"], 7);
        assert_eq!(
            buffered.last().expect("last buffered event")["sequence"],
            CHAT_EVENT_BUFFER_LIMIT + 6
        );
    }
}
