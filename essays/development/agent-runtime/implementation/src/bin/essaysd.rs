use anyhow::{Context, Result, bail};
use axum_server::tls_rustls::RustlsConfig;
use clap::Parser;
use essays_agent_runtime::{Runtime, SqliteStore, server};
use std::{net::SocketAddr, path::PathBuf};

#[derive(Parser)]
struct Args {
    #[arg(long, default_value = "essays.db")]
    database: PathBuf,
    #[arg(long, default_value = "127.0.0.1:8787")]
    listen: SocketAddr,
    #[arg(long, default_value = "http://127.0.0.1:8787")]
    public_base_url: String,
    #[arg(long)]
    tls_certificate: Option<PathBuf>,
    #[arg(long)]
    tls_private_key: Option<PathBuf>,
    #[arg(long, default_value_t = 262_144)]
    max_body_bytes: usize,
    #[arg(long, default_value_t = 15)]
    request_timeout_seconds: u64,
    #[arg(long, default_value_t = 3_600_000)]
    lease_duration_ms: i64,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    let runtime = Runtime::new(SqliteStore::open(&args.database)?);
    let app = server::router(
        runtime,
        server::ServerConfig {
            public_base_url: args.public_base_url,
            max_body_bytes: args.max_body_bytes,
            request_timeout_seconds: args.request_timeout_seconds,
            lease_duration_ms: args.lease_duration_ms,
        },
    );

    match (args.tls_certificate, args.tls_private_key) {
        (Some(certificate), Some(private_key)) => {
            let tls = RustlsConfig::from_pem_file(certificate, private_key)
                .await
                .context("load TLS identity")?;
            axum_server::bind_rustls(args.listen, tls)
                .serve(app.into_make_service())
                .await?;
        }
        (None, None) if args.listen.ip().is_loopback() => {
            let listener = tokio::net::TcpListener::bind(args.listen).await?;
            axum::serve(listener, app).await?;
        }
        (None, None) => bail!("TLS_REQUIRED_FOR_NON_LOOPBACK_LISTENER"),
        _ => bail!("TLS_CERTIFICATE_AND_PRIVATE_KEY_REQUIRED_TOGETHER"),
    }
    Ok(())
}
