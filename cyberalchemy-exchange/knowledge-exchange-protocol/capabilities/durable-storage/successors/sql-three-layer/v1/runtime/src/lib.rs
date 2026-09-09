//! SQL-portable, three-layer protection and verified recovery.
//!
//! D65 predecessor: `CA2-SYSTEM-ONTOLOGY-KEP-DST-SQL-THREE-LAYER`, exact
//! digest `3193e49df81e492e1675d4f557a7b1e020124e9cd513b0d8e7fdd42cbe992755`.
//! PostgreSQL is the first adapter, not part of the portable object identity.

pub mod adapters;
mod core;

pub use crate::core::*;
pub use cyberalchemy_durable_storage::{MaterialClassification, ObjectKind, QualifiedByteIdentity};

pub const ADMITTED_SYSTEM_ONTOLOGY_ID: &str = "CA2-SYSTEM-ONTOLOGY-KEP-DST-SQL-THREE-LAYER";
pub const ADMITTED_SYSTEM_ONTOLOGY_SHA256: &str =
    "3193e49df81e492e1675d4f557a7b1e020124e9cd513b0d8e7fdd42cbe992755";
pub const ADMISSION_DECISION_ID: &str = "CA2-DECISION-KEP-DST3-SYSTEM-ONTOLOGY-ADMISSION-001";
