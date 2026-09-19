# Guard candidate fixture - positive

## Concept Registry
| Concept | Type |
| --- | --- |
| ExampleGuard | Guard |

## ExampleGuard
| Attribute | Value |
| --- | --- |
| protected_surface | /admin |
| source_rule | AdminAccess |
| conditions | authenticated,admin-role |
| fallback | /forbidden |
| decision_authority | false |
| enforcement_scope | ui-projection |
