//! Pure structural kernel for CyberAlchemy Orchestrator.
//!
//! The crate performs no I/O. Callers own admission, durability, scheduling,
//! worker execution, lifecycle decisions, and external effects.

pub mod dag;
pub mod work;

pub use dag::{
    DagCommand, DagCursor, DagDefinition, DagEngine, DagNode, DagTransition, NodeEvent,
    OutputCondition, ReleasePolicy, ENGINE_VERSION,
};
pub use work::{compile_work_graph, CompositeWork, LeafWork, WorkCatalog, WorkDefinition, WorkUse};

pub const API_VERSION: &str = "rwo-core-api/v1";

/// Produce the initial transition for an already validated graph.
pub fn start(definition: DagDefinition) -> DagTransition {
    DagEngine::new(definition).start()
}

/// Apply one accepted structural event to one cursor without I/O.
///
/// The caller remains responsible for atomically persisting the accepted event,
/// returned cursor, and the complete returned command batch.
pub fn apply_event(
    definition: DagDefinition,
    cursor: DagCursor,
    event: NodeEvent,
) -> Result<DagTransition, String> {
    DagEngine::from_cursor(definition, cursor)?.apply_event(event)
}

/// Replay accepted events from an empty cursor.
pub fn replay(
    definition: DagDefinition,
    events: impl IntoIterator<Item = NodeEvent>,
) -> Result<DagTransition, String> {
    let mut engine = DagEngine::new(definition);
    let mut transition = engine.start();
    for event in events {
        transition = engine.apply_event(event)?;
    }
    Ok(transition)
}
