//! Local, no-network realization of the accepted encrypted durable Devnet binding.
//!
//! This module defines deterministic protocol contracts and injected ports. It
//! contains no credential, wallet, RPC, deployment, transaction-submission, or
//! network implementation.

#[path = "ports/cryptography.rs"]
pub mod cryptography;
#[path = "ports/durable_storage.rs"]
pub mod durable_storage;
pub mod evidence;
pub mod model;
pub mod protocol;
#[path = "ports/solana.rs"]
pub mod solana;

pub const ACCEPTED_BINDING_ID: &str = "CA2-D65-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-001";
pub const ACCEPTED_BINDING_MATERIAL_DIGEST: &str =
    "500d902f8a757709c6200e7b5b57a3b999c4c954606e7425cdc52fd9fe906926";
pub const ACCEPTANCE_DECISION_ID: &str =
    "CA2-DECISION-KEP-SOLANA-ENCRYPTED-DURABLE-DEVNET-RUST-BINDING-ACCEPTANCE-001";
