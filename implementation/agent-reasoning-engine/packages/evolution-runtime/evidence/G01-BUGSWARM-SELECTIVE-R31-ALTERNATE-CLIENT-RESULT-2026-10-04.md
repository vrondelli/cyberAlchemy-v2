# G01 BugSwarm selective-GLM r31 — alternate-client repair result

Status: terminal partial repair. One of seven fixed transport-only failures was
recovered; six require score-blind repository replacement.

The protocol SHA-256 is
`a2c7ac38fb8bc4478300e4f5f23a46e57d7a3699f5de304449909805a8f4d221`.
The runner SHA-256 is
`bc202982f7e37b3da2784f3768c11246692938aa5dce453215f52b0b6e630b9b`.
The private result SHA-256 is
`6238f34ef6698dcce62874d19f1177e55e6b8c33f114b154893606fc45d1dbb0`.

Each fixed row received exactly one Python-standard-library HTTPS request with
redirects disabled and no retries. Python row 10 (`google/python-fire`) was
recovered at its exact 192,878-byte declared length with strict UTF-8. The
other six returned only 32,576–65,345 bytes despite HTTP 200 and matching
larger `Content-Length` values; they were rejected and their partial bodies
retained.

Together, r29 and r31 authenticate source/log availability for 15/24 original
r28 rows. The remaining fixed replacement denominator is nine slots:

- Python ordinals 5, 6, 7, and 12;
- Java ordinals 15, 18, 19, 21, and 22.

Three of these are source-archive 404s and six are repeated log truncations.
Transport repair is exhausted. The next step is a score-blind queue beginning
strictly after the r28 language-specific source-order floors and excluding all
prior and r28 repositories.

No label, passing source, patch, ranking, provider call, model call, or score
was accessed.

## Open Questions

- How many score-blind replacement attempts will fill the four Python and five
  Java slots?
- Will the replacement population retain enough candidates for later exact
  source archive and code-only projection stages?
