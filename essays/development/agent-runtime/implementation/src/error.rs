use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    InvalidInput,
    DeadlineExceeded,
    Unauthenticated,
    WorkOwnerRequired,
    ExpectedRevisionConflict,
    IdempotencyKeyReused,
    ContextInsufficient,
    ProposalNotCurrent,
    EffectNotUncertain,
    GrantNotCurrent,
    ScopeDenied,
    ResourceLimitExceeded,
    NotFound,
    PersistenceFailure,
}

#[derive(Debug)]
pub struct RuntimeError {
    pub code: ErrorCode,
    pub message: String,
    pub current_revision: Option<i64>,
}

impl RuntimeError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            current_revision: None,
        }
    }

    pub fn conflict(current_revision: i64) -> Self {
        Self {
            code: ErrorCode::ExpectedRevisionConflict,
            message: "expected revision does not match current revision".into(),
            current_revision: Some(current_revision),
        }
    }
}

impl Display for RuntimeError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{:?}: {}", self.code, self.message)
    }
}

impl std::error::Error for RuntimeError {}

impl From<rusqlite::Error> for RuntimeError {
    fn from(error: rusqlite::Error) -> Self {
        Self::new(ErrorCode::PersistenceFailure, error.to_string())
    }
}
