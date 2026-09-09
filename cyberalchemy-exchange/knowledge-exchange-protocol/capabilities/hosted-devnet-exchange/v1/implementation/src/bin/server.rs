use std::{env, net::SocketAddr};

use cyberalchemy_kep_hosted_devnet::{router, Application, FinalityGateway, DEFAULT_DEVNET_RPC};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let bind: SocketAddr = env::var("CA2_KEP_BIND")
        .unwrap_or_else(|_| "127.0.0.1:8080".into())
        .parse()?;
    let rpc = env::var("CA2_KEP_DEVNET_RPC_URL").unwrap_or_else(|_| DEFAULT_DEVNET_RPC.into());
    let gateway = FinalityGateway::devnet(rpc);
    let application = match env::var("CA2_KEP_DATABASE_URL") {
        Ok(database_url) => Application::postgres(&database_url, gateway).await?,
        Err(_) if env::var("CA2_KEP_ALLOW_VOLATILE").as_deref() == Ok("1") => {
            Application::memory(gateway).await
        }
        Err(_) => {
            return Err("CA2_KEP_DATABASE_URL is required unless CA2_KEP_ALLOW_VOLATILE=1 is explicitly set".into());
        }
    };
    let listener = tokio::net::TcpListener::bind(bind).await?;
    let expiry_task = tokio::spawn(application.clone().run_file_expiry());
    println!("KEP hosted Devnet service listening on http://{bind}");
    axum::serve(listener, router(application))
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await?;
    expiry_task.abort();
    Ok(())
}
