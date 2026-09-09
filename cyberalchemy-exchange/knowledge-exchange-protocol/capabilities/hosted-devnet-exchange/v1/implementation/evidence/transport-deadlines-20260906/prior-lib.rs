//! Hosted, non-custodial HTTP realization of the no-price KEP Devnet flow.
//!
//! This crate accepts ciphertext and public material only. It never accepts a
//! wallet secret, encryption private key, content key, or plaintext artifact.

pub mod accounts;
pub mod clock;
pub mod api;
pub mod auth;
#[cfg(feature = "ui")]
pub mod file_ui;
pub mod files;
pub mod finality;
pub mod transition;
pub mod model;
pub mod limits;
pub mod response_admission;
pub mod store;
pub mod shared_state;
pub mod metadata;
#[cfg(feature = "ui")]
pub mod ui;

pub use api::{router, Application};
pub use finality::{FinalityGateway, FinalizedArtifactObservation, MockFinalityGateway};
#[cfg(feature = "ui")]
pub use ui::router_with_ui;

pub const CAPABILITY_ID: &str = "CA2-CAP-HOST-DEVNET-KNOWLEDGE-EXCHANGE";
pub const PROGRAM_ID: &str = "ns5yjVYuX3bsaMWdG4pPF5hmajdD21xHDVLMbJUCeh1";
pub const DEFAULT_DEVNET_RPC: &str = "https://api.devnet.solana.com";
pub const DEVNET_GENESIS_HASH: &str = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";
