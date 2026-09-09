//! Off-chain realization for the encrypted durable co-ownership protocol.
//!
//! This crate owns production cryptography and SQL persistence. It deliberately
//! contains no Solana signing, deployment, airdrop, or transaction submission.

pub mod crypto;
pub mod sql;

pub use crypto::{
    production_profile, ProductionCryptography, RecipientKeyDirectory, Sha256Identity,
};
pub use sql::{PostgresDialect, PostgresThreeLayerStorage, SqlDialect};
