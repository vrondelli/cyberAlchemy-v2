use capacity_experiment_adapter::serving::{
    import_vllm, load_observations, project_serving, write_json_create_new, ProjectionOptions,
};
use capacity_experiment_adapter::{adapt_run, materialize_scenario_runs, validate_run, Error};
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "capacity-experiment",
    about = "Convert raw serving and swarm runs into capacity-curve profiles"
)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    Validate {
        #[arg(long)]
        run_dir: PathBuf,
    },
    Adapt {
        #[arg(long)]
        run_dir: PathBuf,
        #[arg(long)]
        out_dir: PathBuf,
    },
    Scenario {
        #[arg(long)]
        policy: PathBuf,
        #[arg(long, required = true)]
        run_dir: Vec<PathBuf>,
        #[arg(long)]
        out_dir: PathBuf,
    },
    /// Import one detailed vLLM repetition as serving-only evidence.
    ImportVllm {
        #[arg(long)]
        result: PathBuf,
        #[arg(long)]
        gpu_samples: PathBuf,
        #[arg(long)]
        manifest: PathBuf,
        #[arg(long)]
        out: PathBuf,
    },
    /// Project a fleet curve from repeated, identity-equal serving observations.
    ProjectServing {
        #[arg(long, required = true)]
        observation: Vec<PathBuf>,
        #[arg(long, value_delimiter = ',', default_value = "50000,70000,100000")]
        target_milli_rps: Vec<u64>,
        #[arg(long, default_value_t = 100)]
        active_agents: u64,
        #[arg(long, default_value_t = 1)]
        inference_points_per_request: u64,
        #[arg(long, default_value_t = 1)]
        parallel_inference_points_per_request: u64,
        #[arg(long, default_value_t = 800)]
        headroom_milli: u64,
        #[arg(long, default_value_t = 2)]
        min_repetitions: u64,
        #[arg(long, default_value_t = 100)]
        max_repeat_variance_milli: u64,
        #[arg(long)]
        replica_hourly_microunits: Option<u64>,
        #[arg(long)]
        out: PathBuf,
    },
}
fn run() -> capacity_experiment_adapter::Result<()> {
    match Cli::parse().command {
        Command::Validate { run_dir } => {
            validate_run(&run_dir)?;
            println!("valid {}", run_dir.display());
        }
        Command::Adapt { run_dir, out_dir } => {
            let result = adapt_run(&run_dir, &out_dir)?;
            println!("adapted {} -> {}", result.receipt.run_id, out_dir.display());
        }
        Command::Scenario {
            policy,
            run_dir,
            out_dir,
        } => {
            let scenario = materialize_scenario_runs(&policy, &run_dir, &out_dir)?;
            println!("materialized {}", scenario.display());
        }
        Command::ImportVllm {
            result,
            gpu_samples,
            manifest,
            out,
        } => {
            let observation = import_vllm(&result, &gpu_samples, &manifest)?;
            write_json_create_new(&out, &observation)?;
            println!(
                "imported {} -> {}",
                observation.observation_id,
                out.display()
            );
        }
        Command::ProjectServing {
            observation,
            target_milli_rps,
            active_agents,
            inference_points_per_request,
            parallel_inference_points_per_request,
            headroom_milli,
            min_repetitions,
            max_repeat_variance_milli,
            replica_hourly_microunits,
            out,
        } => {
            let observations = load_observations(&observation)?;
            let projection = project_serving(
                &observations,
                &ProjectionOptions {
                    target_milli_rps,
                    active_agents,
                    inference_points_per_request,
                    parallel_inference_points_per_request,
                    headroom_milli,
                    min_repetitions,
                    max_repeat_variance_milli,
                    replica_hourly_microunits,
                },
            )?;
            write_json_create_new(&out, &projection)?;
            println!(
                "projected {} -> {}",
                projection.projection_id,
                out.display()
            );
        }
    }
    Ok(())
}
fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error}");
        std::process::exit(match error {
            Error::Invalid(_) | Error::Json(_) | Error::Core(_) => 2,
            Error::Io(_) => 3,
        })
    }
}
