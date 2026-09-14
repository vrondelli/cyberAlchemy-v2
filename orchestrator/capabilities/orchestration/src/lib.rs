pub mod agent;
pub mod are_adapter;
pub mod dispatch;
pub mod run_template;
pub mod strategy;
pub mod supervisor;
pub mod template;

pub use agent::{execute_assignment, AgentExecutor, AgentProfile, AgentTurn, AgentTurnDraft};
pub use are_adapter::{AreAgent, AreTransport};
pub use dispatch::DispatchProposal;
pub use run_template::RunTemplate;
pub use strategy::{AgentRequirement, Lane, Strategy, StrategyLimits};
pub use supervisor::{supervise_once, SupervisorStep};
pub use template::{ParameterConstraints, ParameterSpec, StrategyTemplate, TemplateInstantiation};
