use crate::{
    AuthenticatedPrincipal, Command, ErrorCode, Receipt, RuntimeError, RuntimeEvent, SqliteStore,
    WorkspaceSnapshot,
};
use std::sync::{Arc, Mutex, MutexGuard};
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct Runtime {
    store: Arc<Mutex<SqliteStore>>,
    events: broadcast::Sender<RuntimeEvent>,
}

impl Runtime {
    pub fn new(store: SqliteStore) -> Self {
        let (events, _) = broadcast::channel(256);
        Self {
            store: Arc::new(Mutex::new(store)),
            events,
        }
    }

    pub fn execute(
        &self,
        command: &Command,
        principal: &AuthenticatedPrincipal,
    ) -> Result<Receipt, RuntimeError> {
        let mut store = self.store()?;
        let receipt = store.execute(command, principal, now_unix_ms())?;
        if !receipt.replayed
            && let Some(cursor) = receipt.event_cursor
            && let Some(event) = store
                .events_after(command.workspace_id(), cursor.saturating_sub(1), 1)?
                .into_iter()
                .find(|event| event.cursor == cursor)
        {
            let _ = self.events.send(event);
        }
        Ok(receipt)
    }

    pub fn snapshot(
        &self,
        workspace_id: &str,
        known_cursor: Option<i64>,
    ) -> Result<Option<WorkspaceSnapshot>, RuntimeError> {
        self.store()?
            .snapshot(workspace_id, known_cursor, now_unix_ms())
    }

    pub fn events_after(
        &self,
        workspace_id: &str,
        cursor: i64,
        limit: usize,
    ) -> Result<Vec<RuntimeEvent>, RuntimeError> {
        self.store()?.events_after(workspace_id, cursor, limit)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<RuntimeEvent> {
        self.events.subscribe()
    }

    pub(crate) fn with_store<T>(
        &self,
        operation: impl FnOnce(&mut SqliteStore) -> Result<T, RuntimeError>,
    ) -> Result<T, RuntimeError> {
        let mut store = self.store()?;
        operation(&mut store)
    }

    fn store(&self) -> Result<MutexGuard<'_, SqliteStore>, RuntimeError> {
        self.store.lock().map_err(|_| {
            RuntimeError::new(
                ErrorCode::PersistenceFailure,
                "SQLite store lock is poisoned",
            )
        })
    }
}

pub fn now_unix_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis().min(i64::MAX as u128) as i64)
        .unwrap_or_default()
}
