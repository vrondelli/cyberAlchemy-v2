use anyhow::Result;
use clap::Parser;
use essays_agent_runtime::{Runtime, SqliteStore, ipc};
use std::path::PathBuf;

#[derive(Parser)]
struct Args {
    #[arg(long, default_value = "essays.db")]
    database: PathBuf,
    #[arg(long, default_value = "/tmp/essays-agent-runtime.sock")]
    socket: PathBuf,
    #[arg(long, default_value_t = 262_144)]
    max_frame_bytes: usize,
    #[arg(long, default_value_t = 32)]
    max_connections: usize,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    let runtime = Runtime::new(SqliteStore::open(args.database)?);
    ipc::serve_unix(
        args.socket,
        runtime,
        args.max_frame_bytes,
        args.max_connections,
    )
    .await?;
    Ok(())
}
