use capacity_curve::{
    import_model, load_scenario, plan, validate_model, Error, ModelProfileV1, PlanResultV1,
};
use clap::{Parser, Subcommand};
use std::{fs, path::PathBuf, process};

#[derive(Parser)]
#[command(
    name = "capacity-curve",
    about = "Model-aware self-hosted inference capacity planner"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    Model {
        #[command(subcommand)]
        command: ModelCommand,
    },
    Plan {
        #[arg(long)]
        input: PathBuf,
        #[arg(long)]
        json_out: PathBuf,
    },
}
#[derive(Subcommand)]
enum ModelCommand {
    Import {
        #[arg(long)]
        config: PathBuf,
        #[arg(long)]
        artifacts: PathBuf,
        #[arg(long)]
        revision: String,
        #[arg(long)]
        out: PathBuf,
    },
    Validate {
        #[arg(long)]
        input: PathBuf,
    },
}

fn run() -> capacity_curve::Result<()> {
    match Cli::parse().command {
        Command::Model {
            command:
                ModelCommand::Import {
                    config,
                    artifacts,
                    revision,
                    out,
                },
        } => {
            let p = import_model(&config, &artifacts, &revision)?;
            fs::write(&out, serde_json::to_vec_pretty(&p)?)?;
            println!("imported {} -> {}", p.profile_id, out.display());
        }
        Command::Model {
            command: ModelCommand::Validate { input },
        } => {
            let p: ModelProfileV1 = serde_json::from_slice(&fs::read(&input)?)?;
            validate_model(&p)?;
            println!("valid {}", p.profile_id);
        }
        Command::Plan { input, json_out } => {
            let s = load_scenario(&input)?;
            let r = plan(&s)?;
            fs::write(&json_out, serde_json::to_vec_pretty(&r)?)?;
            print_table(&r);
        }
    }
    Ok(())
}
fn print_table(r: &PlanResultV1) {
    println!(
        "MODEL  RPS  STATUS  CAPACITY_RPS  EVIDENCE/MIN  MEMORY_GIB  COST_U/H  REPLICAS  POINTS  WORKERS  SEARCH"
    );
    for p in &r.points {
        println!(
            "{}  {:.1}  {}  {:.1}  {:.3}  {:.2}  {}  {}  {}  {}  {}",
            p.model_profile_id,
            p.target_milli_rps as f64 / 1000.0,
            p.status,
            p.observed_capacity_milli_rps as f64 / 1000.0,
            p.projected_accepted_unique_evidence_per_minute_milli as f64 / 1000.0,
            p.memory.total().unwrap_or(0) as f64 / capacity_curve::GIB as f64,
            p.observed_cost_microunits_per_hour
                .map(|v| v.to_string())
                .unwrap_or_else(|| "unknown".into()),
            p.serving_replicas,
            p.inference_points,
            p.workers,
            p.search_strategy,
        )
    }
    println!("plan_id {}", r.plan_id)
}
fn main() {
    if let Err(e) = run() {
        eprintln!("error: {e}");
        process::exit(match e {
            Error::Invalid(_) | Error::Io(_) | Error::Json(_) => 2,
            Error::NoFeasible(_) => 3,
            Error::SearchLimit(_) => 4,
        })
    }
}
