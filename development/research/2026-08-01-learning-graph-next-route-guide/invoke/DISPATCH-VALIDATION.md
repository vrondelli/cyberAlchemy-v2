# Dispatch Spec Validation

- Dispatch: `INVOKE-DISPATCH.json`
- Validator: `arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py`
- Result: pass
- Blocks: 0
- Flags: 0
- Execution: not attempted
- Subagent strategy in dispatch: none
- Current learner-view mutation admission: absent
- Current semantic/destination-owner admission: absent
- Current selected SWU: none

The first validation attempt correctly blocked because owner-specific receipt
field names were outside the Formulae enum. Those requirements were moved into
the allowed `approval_record`, `artifacts`, `validation`, and
`audit_reference` fields; the repaired document then passed. No route was
executed.
