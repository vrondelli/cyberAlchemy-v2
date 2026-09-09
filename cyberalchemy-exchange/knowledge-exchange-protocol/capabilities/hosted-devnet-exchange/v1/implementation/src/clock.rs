//! UTC-shaped process time whose elapsed intervals survive wall-clock corrections.
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

/// Sample wall time once. Subsequent readings advance only with elapsed time.
/// Injecting both sources makes wall-clock jumps testable without changing the OS.
pub fn anchored(wall: impl FnOnce() -> u64, elapsed: impl Fn() -> Duration) -> impl Fn() -> u64 {
    let epoch = wall();
    move || epoch.saturating_add(elapsed().as_secs())
}

pub fn process_clock() -> impl Fn() -> u64 + Send + Sync + 'static {
    let start = Instant::now();
    anchored(
        || {
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("host clock predates Unix epoch")
                .as_secs()
        },
        move || start.elapsed(),
    )
}
