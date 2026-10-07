# G01 BugSwarm guarded confirmation r46 — official log API protocol

Status: frozen protocol for a private, score-blind transport-validation census.
This stage is not a benchmark result and makes no model call.

## Objective

Test the official BugSwarm `get_build_log(job_id)` retrieval path uniformly on
the complete 29-case r45 population. This is a transport hypothesis, not a
change to the r44 ranking treatment or its evaluation.

BugSwarm's official REST API documentation states that `get_build_log(job_id)`
returns the original build log. The published client resolves that operation to
`http://www.api.bugswarm.org/v1/logs/{job_id}`. The public API currently exposes
HTTP but not HTTPS, so its content cannot be admitted by origin alone. It must
instead pass the cross-transport checks below.

## Frozen inputs

- r45 result SHA-256:
  `26e9de47e18b74d5baf6737ef70fbc06f63b66c7a85940d76fca5c85e3798f09`
- r45 run-freeze SHA-256:
  `0a3f6d308e48366b510a48c3709a5f13e34f5c53a74f0b645ffb8b0f70113a42`
- r45 result document SHA-256: filled into the runner only after this protocol
  and result document are frozen.
- Official documentation: `https://www.bugswarm.org/docs/toolset/bugswarm-rest-api/`
- Official client source:
  `https://github.com/BugSwarm/bugswarm/blob/master/bugswarm/common/rest_api/database_api.py`

## Uniform validation rule

For every r45 row, in queue order 11–39:

1. make exactly one bounded request to the official `/v1/logs/{job_id}` API,
   with request starts separated by at least 3.1 seconds to remain below the
   documented unauthenticated limit of 20 requests per minute;
2. require HTTP 200, `application/json`, a final URL on
   `www.api.bugswarm.org`, a body no larger than 10 MiB, and valid UTF-8 JSON;
3. require one string field named `build_log`, strict UTF-8 encodability, and a
   decoded length exactly equal to the HTTPS raw-log `Content-Length` already
   preserved by r45;
4. for each of the 23 r45-admitted rows, additionally require byte-for-byte and
   SHA-256 equality with its preserved complete HTTPS log;
5. retain the raw API response, decoded log, response headers, and receipt.

There are no automatic retries. The method is applied to all 29 rows, not only
the four truncated rows. Source-archive 404 cases remain rejected regardless of
API success. The first 24 rows that satisfy both the unchanged r45 source gate
and this uniform API-log gate become the only eligible input to a separately
frozen source-projection and target-existence census.

If any of the 23 cross-transport controls differs by even one byte, the API-log
method fails globally and repairs no case. If fewer than 24 source-valid rows
pass, record another terminal supply deficit.

No label, passing source, patch, gold target, ranking, or model call is allowed.

## Claim ceiling

This stage may claim only cross-validated source/log availability. It cannot
claim fault-localization accuracy, efficiency, generalization, or superiority.

## Open Questions

- Will all 23 HTTPS controls match the official API byte for byte?
- Will the API return complete exact-length content for the four truncated
  transport cases?
- How many of the first 24 API-admitted rows survive exact target-existence
  screening?
