//! Transaction-scoped metadata reads used before authorization admission.
//!
//! This crate intentionally has no dependency on a policy decision engine.

use rusqlite::{OptionalExtension, Transaction};

pub fn authentication_metadata(
    transaction: &Transaction<'_>,
    row_id: u64,
) -> Option<(u64, String)> {
    let row_id = i64::try_from(row_id).ok()?;
    let rows = transaction
        .prepare(
            "SELECT evidence_revision, authenticated_subject_id
             FROM auth_authentication_evidence
             WHERE evidence_row_id = ?1
             LIMIT 2",
        )
        .ok()?
        .query_map([row_id], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
        })
        .ok()?
        .take(0)
        .collect::<Result<Vec<_>, _>>()
        .ok()?;
    match rows.as_slice() {
        [(revision, subject)] if *revision >= 0 && !subject.is_empty() => {
            Some((*revision as u64, subject.clone()))
        }
        _ => None,
    }
}

pub fn route_revision(transaction: &Transaction<'_>, row_id: u64) -> Option<u64> {
    let value = transaction
        .query_row(
            "SELECT binding_revision
             FROM auth_route_authorization_bindings
             WHERE binding_row_id = ?1",
            [i64::try_from(row_id).ok()?],
            |row| row.get::<_, i64>(0),
        )
        .optional()
        .ok()??;
    value.try_into().ok()
}
