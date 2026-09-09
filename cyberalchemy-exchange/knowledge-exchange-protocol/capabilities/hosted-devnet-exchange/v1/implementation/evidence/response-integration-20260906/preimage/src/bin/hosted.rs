use std::{env, net::SocketAddr};

use cyberalchemy_kep_hosted_devnet::{
    router_with_ui, Application, FinalityGateway, DEFAULT_DEVNET_RPC,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let bind: SocketAddr = env::var("CA2_KEP_BIND")
        .unwrap_or_else(|_| "127.0.0.1:8080".into())
        .parse()?;
    let database_url = env::var("CA2_KEP_DATABASE_URL")
        .map_err(|_| "CA2_KEP_DATABASE_URL is required for the hosted server")?;
    let rpc = env::var("CA2_KEP_DEVNET_RPC_URL").unwrap_or_else(|_| DEFAULT_DEVNET_RPC.into());

    let application = Application::postgres(&database_url, FinalityGateway::devnet(rpc)).await?;
    let listener = tokio::net::TcpListener::bind(bind).await?;
    let expiry_task = tokio::spawn(application.clone().run_file_expiry());
    println!("KEP hosted Devnet workbench listening on http://{bind}");
    axum::serve(listener, router_with_ui(application))
        .with_graceful_shutdown(async {
            #[cfg(unix)]
            {
                let mut terminate = tokio::signal::unix::signal(
                    tokio::signal::unix::SignalKind::terminate()
                ).expect("install SIGTERM handler");
                tokio::select! {
                    _ = tokio::signal::ctrl_c() => {},
                    _ = terminate.recv() => {},
                }
            }
            #[cfg(not(unix))]
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    expiry_task.abort();
    Ok(())
}
