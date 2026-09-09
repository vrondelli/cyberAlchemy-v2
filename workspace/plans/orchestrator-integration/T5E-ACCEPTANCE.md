# T5E — Integrated execution relationships acceptance

Candidate acceptance, 2026-09-08. Authority effect: none. Owner authorization:
user “next”; [D65 construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Result

The [integrated browser journey](test-integrated-relationships.mjs) passes for
Project, Chat and Knowledge selections using the existing Workspace shell and
sibling orchestrator frontend. Three isolated fixture tasks execute through the
real native review owner, ARE host and Rust driver. Each produces one verified run
and a separate Essays handoff. No application defect was exposed by this journey;
the implementation tested is the existing T5A–T5D candidate.

| Source | Selected context | Return behavior |
| --- | --- | --- |
| Project | One displayed project description and bundled snapshot revision | Matches before and after reload |
| Chat | One message from a mocked Tauri bridge, with thread/message coordinates and content revision | Matches while retained; unavailable after reload |
| Knowledge | One candidate concept, definition, status, references and claim ceiling | Matches before and after reload |

The browser selects and replaces input explicitly. Each owner review contains the
exact source envelope. The accepted task digest, projected source coordinates and
selected-text checksum remain bound to that input. Each launch appears once on
the Dashboard with a text-task icon and Completed label. Opening the run selects
Overview first. Native owner verification supplies the owner run key and completion
digest, and declared-source links return to the selected source and back to the run.

For every result, opening Essays captures the correct owner identity and completion
digest. Replacing the unsaved buffer requires the existing checkbox and Stage
control. Staging leaves saved workspace state unchanged. The existing Essays Save
control creates an exact saved revision; an explicit edit and second save create
a later edited revision. Reload preserves edited writing without automatic
restaging. Dismissing the handoff leaves the writing intact. These local save
observations do not perform native lifecycle acceptance or promotion.

After all three tasks finish, restarting the isolated native console replays all
three owner histories, retains their run keys, source coordinates and completion
digests, and leaves journal bytes unchanged. The isolated budget remains exhausted
at three of three tasks. No fourth launch or model call is made.

## Evidence and reproducibility

[T5E evidence](T5E-EVIDENCE.json) binds the tested frontend file tree and test source.
[Journey receipts](t5e-evidence/integrated.json) record source coordinates, task
digests, owner keys, completion digests and exact/edited Essays revisions for all
three sources. No credentials or temporary runtime tokens are copied into evidence.
The isolated runtime directory is removed after the test.

Run the browser script with the installed native console configuration, fixture
driver, bounded dashboard dist directory and an output directory, in that order.
It creates fresh isolated state with a three-task fixture budget and a fresh browser
profile. Its Chat connection is mocked; native review, dispatch, owner replay and
browser-local Essays operations are real. Existing installed journal bytes are
compared before and after the entire journey.

The local candidate remains http://127.0.0.1:4187/#/apps/orchestrator/runs . Its two
existing runs and three remaining fixture launches are unchanged. Tested assets
match the installed frontend; no asset refresh or installed service restart was
needed. Prior T5D build/unit/accessibility evidence remains separately attributed.

## Open Questions

T5 is complete within this local fixture candidate boundary. T6, native executor
integration in the main scheduler, is the next runnable construction task. T7 still
owns whole Workspace acceptance, including live Tauri journeys, performance budgets
and outstanding manual/browser checks. The mocked Chat bridge is not proof of
live native Chat operation or durable transcript recovery.

Source identities remain caller-declared. Fixture output is a fixed test response,
not a model answer. Essays handoffs remain browser-local, single-record references;
dismissal removes their local association. Upstream source attestation, historical
source retrieval and durable cross-device relationships remain separate work.

[UX6](UX6-ACCEPTANCE.md#open-questions), standard catalog snapshot drift and the
[operational/VPS gates](PLAN.md#open-questions) remain open. No admission, promotion,
publication or VPS activation follows from this acceptance evidence. MCP stays last.
