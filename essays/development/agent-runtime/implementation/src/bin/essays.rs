use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use essays_agent_runtime::{
    Command, PairingCode, Runtime, SqliteStore,
    runtime::now_unix_ms,
    security::{create_pairing_code, local_process_principal},
};
use std::path::PathBuf;

#[derive(Parser)]
struct Cli {
    #[arg(long, default_value = "essays.db")]
    database: PathBuf,
    #[arg(long, default_value = "essays-cli")]
    client_id: String,
    #[command(subcommand)]
    command: CliCommand,
}

#[derive(Subcommand)]
enum CliCommand {
    Execute {
        command_file: PathBuf,
    },
    Snapshot {
        workspace: String,
        #[arg(long)]
        cursor: Option<i64>,
    },
    PairCode {
        #[arg(long, value_delimiter = ',')]
        scopes: Vec<String>,
        #[arg(long, default_value_t = 300)]
        ttl_seconds: i64,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let runtime = Runtime::new(SqliteStore::open(cli.database)?);
    let principal = local_process_principal(cli.client_id)?;
    match cli.command {
        CliCommand::Execute { command_file } => {
            let bytes = std::fs::read(&command_file)
                .with_context(|| format!("read command file {}", command_file.display()))?;
            let command: Command = serde_json::from_slice(&bytes)?;
            println!(
                "{}",
                serde_json::to_string_pretty(&runtime.execute(&command, &principal)?)?
            );
        }
        CliCommand::Snapshot { workspace, cursor } => println!(
            "{}",
            serde_json::to_string_pretty(&runtime.snapshot(&workspace, cursor)?)?
        ),
        CliCommand::PairCode {
            scopes,
            ttl_seconds,
        } => {
            let pairing = PairingCode {
                code: format!(
                    "{}{}",
                    uuid::Uuid::new_v4().simple(),
                    uuid::Uuid::new_v4().simple()
                ),
                subject: principal.subject().to_string(),
                scopes,
                expires_at_unix_ms: now_unix_ms().saturating_add(ttl_seconds.saturating_mul(1_000)),
            };
            create_pairing_code(&runtime, &pairing)?;
            println!("{}", serde_json::to_string_pretty(&pairing)?);
        }
    }
    Ok(())
}
