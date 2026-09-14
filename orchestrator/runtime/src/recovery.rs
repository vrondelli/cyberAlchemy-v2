use crate::controller::DurableRunController;
use crate::coordination::EffectDisposition;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RecoveryAction {
    Execute,
    Wait,
    Reconcile,
    BlockedUnknownEffect,
    AcceptRecordedEvent,
    Complete,
}
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RecoveryAssessment {
    pub command_id: String,
    pub action: RecoveryAction,
    pub reason: String,
}

pub fn assess(
    controller: &DurableRunController,
    command_id: &str,
    now: u128,
) -> Result<RecoveryAssessment, String> {
    let state = controller.snapshot()?;
    if !state.pending_commands.contains_key(command_id) {
        return Ok(RecoveryAssessment {
            command_id: command_id.into(),
            action: RecoveryAction::Complete,
            reason: "command is no longer pending".into(),
        });
    }
    if let Some(receipt) = controller.receipt(command_id)? {
        return match controller.effective_disposition(&receipt)? {
            EffectDisposition::Unknown => Ok(RecoveryAssessment {
                command_id: command_id.into(),
                action: RecoveryAction::BlockedUnknownEffect,
                reason: "receipt effect disposition remains unknown".into(),
            }),
            EffectDisposition::Applied | EffectDisposition::NotApplicable => {
                Ok(RecoveryAssessment {
                    command_id: command_id.into(),
                    action: RecoveryAction::AcceptRecordedEvent,
                    reason: "validated receipt contains an event not yet accepted".into(),
                })
            }
            EffectDisposition::NotApplied => Ok(RecoveryAssessment {
                command_id: command_id.into(),
                action: RecoveryAction::Execute,
                reason: "owner resolved that the effect was not applied".into(),
            }),
        };
    }
    if let Some(lease) = controller.lease(command_id)? {
        if lease.expires_at_ms > now {
            return Ok(RecoveryAssessment {
                command_id: command_id.into(),
                action: RecoveryAction::Wait,
                reason: "worker lease is active".into(),
            });
        }
        if lease.begun_at_ms.is_some() {
            return Ok(RecoveryAssessment {
                command_id: command_id.into(),
                action: RecoveryAction::Reconcile,
                reason: "begun attempt expired without a receipt".into(),
            });
        }
    }
    Ok(RecoveryAssessment {
        command_id: command_id.into(),
        action: RecoveryAction::Execute,
        reason: "pending command has no active or uncertain attempt".into(),
    })
}
