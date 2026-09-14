use cyberalchemy_orchestrator_api::{router_with_frontend, ApiState, GatewayConfig};
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), String> {
    let mut arguments = std::env::args().skip(1);
    let data_root = PathBuf::from(arguments.next().unwrap_or_else(|| "./state".into()));
    let static_root = PathBuf::from(arguments.next().unwrap_or_else(|| "../frontend".into()));
    let bind = arguments.next().unwrap_or_else(|| "127.0.0.1:8787".into());
    if arguments.next().is_some() {
        return Err("CLI_ARGUMENTS_EXCESS".into());
    }
    let max_active_assignments = std::env::var("ORCHESTRATOR_MAX_ASSIGNMENTS")
        .unwrap_or_else(|_| "8".into())
        .parse::<usize>()
        .map_err(|_| "ORCHESTRATOR_MAX_ASSIGNMENTS_INVALID".to_owned())?;
    let gateway = GatewayConfig {
        socket_path: std::env::var("ARE_GATEWAY_SOCKET").ok().map(PathBuf::from),
        profile_ref: std::env::var("ARE_GATEWAY_PROFILE_REF").ok(),
    };
    let state = ApiState::open(data_root, max_active_assignments, gateway)?;
    if let Ok(catalog_root) = std::env::var("ORCHESTRATOR_TEMPLATE_CATALOG") {
        state.import_catalog(catalog_root)?;
    }
    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .map_err(|error| format!("API_BIND:{error}"))?;
    axum::serve(listener, router_with_frontend(state, static_root))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .map_err(|error| format!("API_SERVE:{error}"))
}
