# Verifier Level Assignment Correction

Status: per-package owner assignment selected; minimum floor pending.

Rondelli directly clarified that the owner assigns the verification level needed
for each package. The earlier fixed manual, automated, or hybrid question is
therefore superseded before selection.

The selected level becomes part of the exact frozen package. Changing it after
review begins creates a superseding package revision and restarts verification.
A previous receipt cannot be reused over a changed level.

Proposed vocabulary for the next decision:

- `V0-draft-precheck`: optional automation, no admission effect;
- `V1-policy-verified`: an automated checker under exact Victor-owned policy;
- `V2-direct-verified`: Victor directly verifies the exact package;
- `V3-externally-attested`: V2 plus the separately governed external L2 route,
  currently unavailable.

Rondelli may always raise a package's level. The next gate selects the minimum
that cannot be bypassed for each protected package class.
