# ARE presentation deployment decision

## Context

The ARE page and live conversation path needed to be externally testable for a
time-bounded presentation. The target VPS already served KELD staging through a
Caddy container on ports 80 and 443, so a second public edge could not be added
without conflict.

## Decision

- Serve the visitor-facing page at `https://are.keld.studio/`. Internally
  rewrite `/` to the packaged `/are/` page without changing the browser URL.
- Redirect exact `/are` and `/are/` page requests to `/`. Preserve `/are/*`
  only as a compatibility surface for packaged assets and the chat API.
- Keep access anonymous-public for the presentation window.
- Run the ARE edge, public chat, inference broker, and provider gateway as a
  separate Compose project connected to Caddy through one dedicated Docker
  ingress network.
- Keep every ARE backend unpublished from host ports. Only the existing Caddy
  container retains ports 80 and 443.
- Use process-memory conversations with a 1,800-second idle retention period.
- Apply temporary shared ceilings of 5,000,000 micro-USD per hour and
  50,000,000 micro-USD per month, with conservative accounting rates of
  1,000,000 input and 10,000,000 output micro-USD per million tokens.
- Supply the dedicated Z.AI credential as a mode-0400 Docker secret. Do not put
  secret material in image layers, Compose environment variables, source, or
  deployment evidence.
- Preserve the existing KELD staging, Keycloak, Postgres, and orchestrator
  services. The only existing service recreated was Caddy so its bind-mounted
  configuration could adopt the new hostname and persistent network.

This is a presentation deployment decision, not admission of the candidate as
a general multi-tenant production service.

## Rationale

Reusing the existing TLS edge avoided a port conflict and kept certificate
management in one place. The separate internal networks preserve the tested
edge-to-chat-to-broker-to-provider chain while preventing direct public access
to backend listeners. Anonymous access satisfies the presentation requirement;
short retention and monetary ceilings bound the temporary exposure.

## Alternatives considered

- Keep the page local or provide only a deployment bundle: rejected because
  other people needed to test the live page.
- Require invitation or identity authentication immediately: deferred because
  the owner explicitly selected anonymous-public access for the presentation.
- Start a second public reverse proxy: rejected because ports 80 and 443 were
  already owned by the KELD Caddy container.

## Trade-offs and residue

- Anonymous access can be abused despite conversation, token, concurrency, and
  monetary limits.
- Conversation state is single-instance process memory and disappears on
  restart; it is not a durable multi-node session system.
- The VPS currently holds content-addressed local images rather than artifacts
  pulled from an external production registry.
- The accounting rates are deliberately conservative guard values, not a claim
  about provider invoice precision.
- Long-lived public operation still needs an owner decision on authentication,
  abuse controls, monitoring, alerting, backups, registry publication, and
  credential rotation.

## Affected artifacts

- `keld-project/are-documentation/deploy/compose.presentation.yaml`
- `keld-project/are-documentation/deploy/Caddyfile.presentation`
- `keld-project/are-documentation/server/edge-server.mjs`
- `/opt/are-keld-presentation` on the presentation VPS
- `/opt/keld-staging/Caddyfile.infrastructure` and
  `/opt/keld-staging/compose.infrastructure.yaml` on the presentation VPS

The pre-change VPS files are preserved under
`/opt/keld-staging/backups/are-presentation-20260918T171724Z`. The later
root-canonical routing change is separately recoverable from
`/opt/keld-staging/backups/are-root-canonical-20260918T173246Z`.

## Verification

- Public TLS certificate issued for `are.keld.studio`.
- `/` returns the ARE page directly; exact `/are` and `/are/` return a 308
  redirect to `/` while `/are/*` assets and the chat API remain available.
- Status reports live `glm-5.3-flash` mode and 1,800-second retention.
- Direct API and Firefox UI probes each completed a real model turn.
- Firefox reported no console errors during the chat probe.
- All four ARE containers were healthy, read-only, capability-dropped, and had
  no host port bindings.
- KELD staging remained 503 as designed, Keycloak discovery remained 200, and
  the orchestrator remained active on `127.0.0.1:18080`.

## Live chat intent recovery rollout

The public chat originally treated any malformed output from the separate
intent-classifier model call as a terminal `intent-output-invalid` turn. That
made an intermittent provider formatting defect visible to the visitor even
though the conversational reply had not yet been attempted. Large replies or
ASCII diagrams were not established as the cause.

The bounded recovery now:

1. validates the first classifier output against the same strict schema;
2. retries once using only sanitized validation issue codes; and
3. if both classifier outputs are invalid, discards them and selects a
   host-authored `understand` route with no retained preference and
   `authority_effect: none`.

Invalid classifier output still cannot select a route, introduce a preference,
or reach the visitor. Reply-output and provider validation remain fail closed.
This degradation is limited to the public conversational surface, which has no
execution tools or effect authority.

The replacement public-chat image is
`sha256:2c7b5e27a30ce6c55268405459d46683df26f02bcf18890c939e6f0f84ccb7a6`.
Only that container was recreated. The edge, inference broker, provider gateway,
KELD, Keycloak, Postgres, and orchestrator were not changed. The pre-rollout
Compose file is recoverable from
`/opt/keld-staging/backups/are-chat-intent-recovery-20260918T174323Z`.

Post-rollout evidence:

- all 49 server tests passed, including transient retry and persistent-invalid
  host-fallback cases;
- the 94-file public-chat package manifest verified;
- both security evidence checksum sets verified;
- `/` returned 200 with the expected security headers and `/are/` returned the
  canonical 308 redirect to `/`;
- a Firefox turn at `https://are.keld.studio/` returned the requested reply and
  reported zero console errors; and
- all four ARE containers were healthy after the rollout, with only
  `public-chat` receiving a new container identity.

## Current-workspace baseline rollout

Before the customer-validation fixes were implemented, the current workspace
was rebuilt, validated, and deployed as a recoverable presentation baseline.
All four containers were replaced in dependency order and became healthy:

- edge: `sha256:3d8180cbb76ab755e113e5c8da571c2438edb9ea3cfb470ef96fde45fd2a29bc`;
- public chat: `sha256:5ddeb8c4a7a5f683175c919d8560aafe96d924a48e5c797bf17f8cf55ac7dcdd`;
- inference broker: `sha256:d03d130ad6965b9e2b727e650a6df4cfa8275aa493888801c95a5464dc2489a2`;
- provider gateway: `sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361`.

The baseline passed 49 server tests, package verification, TLS/root-route
checks, and a real live model turn. Its pre-deployment Compose envelope is
recoverable from
`/opt/keld-staging/backups/are-current-baseline-20260918T181500Z`.

## Customer-validation hardening candidate

The next local candidate addresses the observed presentation defects without
expanding the chat's execution authority:

- the live chat controller remains mounted across Introduction,
  Documentation, and Explorer navigation; a versioned same-tab browser copy
  restores the conversation after refresh only after the server revalidates
  the session, and expires locally after at most 30 minutes;
- assistant Markdown is rendered as escaped React elements, while
  model-supplied links remain non-clickable;
- failed requests expose a `Retry message` action that restores the original
  text to the composer but does not automatically spend another allowance;
- the status contract reports shared-demo availability and its UTC-aligned
  reset time instead of reporting only provider configuration;
- presentation token and call ceilings are explicit environment settings at
  500,000 hourly tokens, 120 admitted chat turns, and 240 broker calls, while
  the existing 5 USD hourly and 50 USD monthly monetary ceilings remain
  unchanged and fail closed;
- broker quota failures retain only admitted public reason codes; and
- the response prompt now states that routing is selected per request and that
  invitation admission never substitutes for email verification.

Candidate verification passed 51 server tests, TypeScript and production
build checks, all package/security verifiers, and an eleven-check Playwright
customer flow covering Markdown, navigation and refresh continuity, server
revalidation, allowance continuity, failed-turn retry, and uncaught browser
errors.

The separately composed deployable candidate changes only public chat
`sha256:b7d06497e424b9ff0979f8fce88e81abddd794a516e365b7ce5c34e5579005d6`
and inference broker
`sha256:c97781ae0ee05e69fd0ab8fe145c154c62c7ec807591dd58dcc0bdaa41fd96a3`.
The exact override is `deploy/compose.presentation.candidate.yaml`; edge and
provider gateway remain on the deployed baseline images.

During candidate packaging, the live public-chat container was independently
replaced with content-equivalent baseline image
`sha256:0a82c38b22f7699b8410daac8a8097281bd44dbadec1c1921df94e4c330875b7`.
Its package aggregate remains the previously verified baseline
`541123dd2d7c002a66ea12e1b1f82060923a5d4fc481a6deba0a9fbd9e3b1e9c`;
the candidate override was kept separate rather than overwriting that live
baseline pointer.

## Customer-validation candidate rollout

The owner explicitly authorized the exact candidate deployment. On
2026-09-18, only `inference-broker` and `public-chat` were replaced, in that
order, using the base Compose file plus
`deploy/compose.presentation.candidate.yaml`. The live image identities are:

- public chat: `sha256:b7d06497e424b9ff0979f8fce88e81abddd794a516e365b7ce5c34e5579005d6`;
- inference broker: `sha256:c97781ae0ee05e69fd0ab8fe145c154c62c7ec807591dd58dcc0bdaa41fd96a3`;
- edge, unchanged: `sha256:3d8180cbb76ab755e113e5c8da571c2438edb9ea3cfb470ef96fde45fd2a29bc`; and
- provider gateway, unchanged: `sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361`.

The exact pre-rollout Compose file and container image mapping are recoverable
from
`/opt/keld-staging/backups/are-candidate-before-20260918T182742Z`.

Post-rollout evidence:

- all four ARE services were healthy; the edge and provider gateway retained
  their pre-rollout container identities and uptime;
- `/` returned 200 and `/are/` returned the canonical 308 redirect to `/`;
- the public status contract reported the live GLM model as available;
- an API-level live model turn returned 200, streamed a Markdown response, and
  its temporary session was deleted with a 200 response;
- a live Chromium customer pass completed 15 checks covering Markdown
  rendering, retained terminology, navigation continuity, refresh continuity,
  server revalidation, session controls, mobile overflow, fresh-state reset,
  and zero browser errors; and
- the replaced services remained read-only, capability-dropped,
  `no-new-privileges`, seccomp-confined, and without host port bindings.

## Follow-up

Before treating this as a sustained public service, select and execute a new
bounded objective for authentication or invitation access, abuse monitoring,
registry-backed image publication, secret rotation, operational alerts, and a
post-presentation security review.

## Open Questions

- When should anonymous-public access end?
- What long-lived spending ceiling and provider rates should the owner approve?
- Which identity and tenancy model should replace anonymous sessions?
