#!/usr/bin/env python3
"""Stage and package the option-A ACI binding lifecycle synchronization."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


RUN = Path(__file__).resolve().parent
ROOT = next(parent for parent in RUN.parents if (parent / ".git").exists())
OUT = RUN / "staging" / "outputs"
STAMP = "2026-07-23T18:38:42-03:00"
TARGET = "cyberAlchemy-v2/development/agent-reasoning-engine"
DECISION_RECEIPT = f"{TARGET}/decisions/aci-reasoning-binding/BINDING-RECEIPT.json"
DECISION_RECORD = f"{TARGET}/decisions/aci-reasoning-binding/DECISION.md"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ref(path: Path, relative: str) -> dict[str, object]:
    return {
        "path": relative,
        "sha256": digest(path),
        "size_bytes": path.stat().st_size,
    }


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise ValueError(f"{label}: expected one match, found {count}")
    return text.replace(old, new)


def write_stage(relative: str, content: str) -> Path:
    path = OUT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return path


def stage_text(relative: str, changes: list[tuple[str, str, str]]) -> Path:
    text = (ROOT / relative).read_text(encoding="utf-8")
    for old, new, label in changes:
        text = replace_once(text, old, new, label)
    return write_stage(relative, text)


def stage_invoke() -> list[str]:
    paths: list[str] = []

    relative = f"{TARGET}/spec/SPEC.md"
    stage_text(
        relative,
        [
            (
                """1. **ACI integration decision:** `BLK-ARE-ACI-BINDING-001` must decide
   `RuntimeJournal`, artifact-byte, canonical receipt identity, Work Bus
   publication, effect-intent, and provenance-lineage ownership before affected
   L1/L2 mutation. Architectural similarity is not compatibility.""",
                """1. **ACI integration disposition:** `G-ARE-ACI-BINDING` selected the
   ACI-subordinate target in
   [`BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
   Integrated journal facts, canonical acceptance identity, replay cursor, and
   effect intents remain ACI-owned; semantic derivation stays evaluator-owned.
   External maturity and conformance remain open, so architectural selection is
   not runtime compatibility.""",
                "spec blocker disposition",
            ),
            (
                """Route `invoke:design ACI-REASONING-BINDING` before any affected actor-journal,
observation-transport, or durability SWU.""",
                """Route `invoke:plan ACI-subordinate conformance revision`. The plan may
separate local-only evidence from future integrated conformance, but it must not
select or authorize an implementation SWU while external maturity and
task-specific gates remain open.""",
                "spec next route",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/design/ARCHITECTURE.md"
    stage_text(
        relative,
        [
            (
                """Evaluator semantics remain reasoning-engine-owned. Physical authority for an
integrated actor journal, canonical event/receipt identity, observation
publication, and effect intents is unresolved. Artifact bytes must remain
distinct from journal-owned lifecycle facts. No external candidate source is
binding until its lifecycle owner receipt and the local
`ACI-REASONING-BINDING` decision both pass.""",
                """Evaluator semantics remain reasoning-engine-owned. The accepted
[`ACI-REASONING-BINDING`](aci-reasoning-binding/ARCHITECTURE.md) selects an
ACI-subordinate target: integrated actor-journal facts, canonical acceptance
identity, replay cursor, and effect intents are ACI-owned; semantic derivation
and reasoning-receipt content remain evaluator-owned behind the artifact
boundary. External source maturity and executable conformance still must pass
before compatibility or runtime claims.""",
                "parent architecture ownership",
            ),
            (
                """The interfaces in this view are logical boundaries. SWU-ARE-002,
SWU-ARE-003, and SWU-ARE-006 may not assign integrated physical ownership until
`BLK-ARE-ACI-BINDING-001` is dispositioned. A local-only witness must say so and
cannot satisfy ACI compatibility or packaging claims.""",
                """The interfaces in this view are logical boundaries.
`G-ARE-ACI-BINDING` selected the ACI-subordinate target through
[`BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
SWU-ARE-002, SWU-ARE-003, and SWU-ARE-006 still may not implement an integrated
writer or claim compatibility until the plan binds them to current ACI
conformance evidence. Local-only witnesses must remain explicitly
non-integrated.""",
                "parent architecture interface boundary",
            ),
            (
                """| ARE-DES-008 | Require `ACI-REASONING-BINDING` before SWU-ARE-002/003/006 mutation. | Prevent a second integrated journal or lifecycle authority from being created by local similarity. | The binding may choose ACI-subordinate, explicitly local-only, or incompatible/rerouted dispositions. |""",
                """| ARE-DES-008 | Use the selected ACI-subordinate binding for every future integrated journal, receipt, replay, publication, provenance, and effect-intent mapping. | Prevent a second integrated journal or lifecycle authority from being created by local similarity. | External maturity and conformance receipts remain mandatory; local-only evidence cannot satisfy compatibility. |""",
                "parent architecture decision",
            ),
            (
                """- Next route: Invoke plan; stop before Task Session or implementation.""",
                """- Binding decision:
  [`G-ARE-ACI-BINDING` option A](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json)
  passes for architecture selection only.
- Next route: Invoke plan for an ACI-subordinate conformance revision; stop
  before Task Session, SWU selection, or implementation.""",
                "parent architecture handoff",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/design/aci-reasoning-binding/ARCHITECTURE.md"
    stage_text(
        relative,
        [
            (
                "status: candidate-awaiting-owner-disposition",
                "status: accepted-aci-subordinate-with-external-gates",
                "binding architecture status",
            ),
            (
                """This is a design candidate. It becomes an accepted binding only after
`G-ARE-ACI-BINDING` records an owner disposition. It does not authorize an
adapter, runtime mutation, or a successor SWU.""",
                """`G-ARE-ACI-BINDING` selected option A. This is the accepted local
ACI-subordinate target architecture: local-only evidence may continue under an
explicit non-integration ceiling while external gates remain blocked. The
selection does not authorize an adapter, runtime mutation, or a successor SWU.""",
                "binding architecture intent",
            ),
            (
                """| `ARE-BIND-D8` | The A/B/C/D disposition remains with `G-ARE-ACI-BINDING`. | pending owner selection |""",
                """| `ARE-BIND-D8` | Select option A: ACI-subordinate integration target with explicitly local-only interim evidence. | accepted by `G-ARE-ACI-BINDING`; external maturity remains open |""",
                "binding architecture decision",
            ),
            (
                """- Distill: `flag`; the mapping is coherent, but owner disposition blocks plan
  readiness.
- Implementation layering: seed only; no mutation-ready units.
- Phase status: `flag`.
- Next route: `decision-gate G-ARE-ACI-BINDING`.""",
                """- Distill: `pass with target-lifecycle residue`; the owner disposition is
  selected, while external maturity still blocks integrated execution.
- Implementation layering: seed only; no mutation-ready units.
- Phase status: `pass` for the local architecture decision.
- Decision receipt:
  [`BINDING-RECEIPT.json`](../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
- Next route: `invoke:plan ACI-subordinate conformance revision`; do not select
  an implementation SWU.""",
                "binding architecture result",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/design/aci-reasoning-binding/DISTILL-VALIDATION.md"
    stage_text(
        relative,
        [
            (
                "Verdict: **FLAG — coherent design unit; owner disposition blocks plan readiness**",
                "Verdict: **PASS for plan authoring — external target-lifecycle residue remains**",
                "distill verdict",
            ),
            (
                "- The A/B/C/D disposition is a separate human owner gate.",
                "- The A/B/C/D disposition is closed by option A; plan authoring must preserve its claim ceiling.",
                "distill split pressure",
            ),
            (
                "| binding disposition unselected | `G-ARE-ACI-BINDING` human/architecture owner | blocks Invoke Plan |",
                "| binding disposition | `G-ARE-ACI-BINDING` human/architecture owner | resolved by option A; admits plan authoring only |",
                "distill gap row",
            ),
            (
                "The design must route to Decision Gate, not Plan.",
                "The design may route to Invoke Plan for an ACI-subordinate conformance revision. External dependencies block integrated execution, not plan authoring.",
                "distill next route",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/design/aci-reasoning-binding/DESIGN-TRANSPORT.md"
    stage_text(
        relative,
        [
            (
                """The candidate design may be consumed only by
`G-ARE-ACI-BINDING`. A selected option A or B must return to Invoke Design/Plan
for a scoped plan revision; it does not select a current SWU. Option C preserves
the blocker. Option D routes the architecture back to define/design for
standalone-library narrowing.""",
                """`G-ARE-ACI-BINDING` selected option A. Invoke Plan may consume the
accepted ACI-subordinate target and separate local-only interim evidence from
future integrated conformance. The handoff selects no SWU and authorizes no
implementation. ACI, Bus, ACP, APT, artifact, incident, and rollout gates
remain with their owners.""",
                "transport handoff",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/design/aci-reasoning-binding/DESIGN-RECEIPT.json"
    source = json.loads((ROOT / relative).read_text(encoding="utf-8"))
    source["status"] = "pass"
    source["execution_path"][-1] = "decision-gate:option-a-pass"
    source["validation"]["distill"] = "pass-with-target-lifecycle-residue"
    source["blockers"] = []
    source["claim_ceiling"]["binding_accepted"] = True
    source["result"] = (
        "The local ACI-subordinate architecture is accepted. External maturity "
        "and conformance remain prerequisites for integrated execution."
    )
    source["handoff_note"] = (
        "Route to Invoke Plan for ACI-subordinate conformance revision; select "
        "no implementation SWU."
    )
    source["next_route"] = "invoke:plan ACI-subordinate conformance revision"
    source["decision_evidence"] = (
        "cyberAlchemy-v2/development/agent-reasoning-engine/decisions/"
        "aci-reasoning-binding/BINDING-RECEIPT.json"
    )
    write_stage(relative, json.dumps(source, indent=2, ensure_ascii=False) + "\n")
    paths.append(relative)

    relative = f"{TARGET}/planning/WORK-PACK.md"
    stage_text(
        relative,
        [
            (
                "status: l0-promoted-awaiting-aci-binding-design",
                "status: aci-binding-selected-awaiting-plan-revision",
                "work pack status",
            ),
            (
                "- [`../design/DECISION-AND-EFFECT-FLOW.md`](../design/DECISION-AND-EFFECT-FLOW.md)",
                """- [`../design/DECISION-AND-EFFECT-FLOW.md`](../design/DECISION-AND-EFFECT-FLOW.md)
- [`../design/aci-reasoning-binding/ARCHITECTURE.md`](../design/aci-reasoning-binding/ARCHITECTURE.md)
- [`../decisions/aci-reasoning-binding/BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json)""",
                "work pack source design",
            ),
            (
                """| BLK-ARE-ACI-BINDING-001 | L1/L2 design blocker; does not block G-ARE-L0 | reasoning-engine and ACI architecture owners | Approved `ACI-REASONING-BINDING` mapping journal, artifact, canonical identity, Work Bus, effect-intent and provenance responsibilities, while preserving non-binding status for immature external contracts |""",
                """| BLK-ARE-ACI-BINDING-001 | resolved L1/L2 design blocker | reasoning-engine and ACI architecture owners | Option A selects the ACI-subordinate target through [`BINDING-RECEIPT.json`](../decisions/aci-reasoning-binding/BINDING-RECEIPT.json); it grants no runtime compatibility or implementation authority |""",
                "work pack binding blocker",
            ),
            (
                """Planning, policy readiness, and bounded `G-ARE-L0` promotion are **pass**.
`SWU-ARE-001` is **completed**. No further SWU is selected and
`implementation_authorized` remains false for downstream work. The next route
is `invoke:design ACI-REASONING-BINDING`. Do not select SWU-ARE-002,
SWU-ARE-003, or SWU-ARE-006 until that design dispositions the ownership seam.""",
                """Planning, policy readiness, bounded `G-ARE-L0` promotion, and the local
`G-ARE-ACI-BINDING` architecture decision are **pass**. Option A selects the
ACI-subordinate target with an explicitly local-only interim. `SWU-ARE-001` is
**completed**; no further SWU is selected and `implementation_authorized`
remains false. The next route is `invoke:plan ACI-subordinate conformance
revision`. Integrated actor-journal, publication, provenance, durability, and
effect-intent work remains blocked by `BLK-ARE-ACI-MATURITY-001` and
task-specific owner gates.""",
                "work pack current state",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/planning/work-pack/waves/W1-L1.md"
    stage_text(
        relative,
        [
            (
                """Before any actor-journal or observation-transport mutation, the
`ACI-REASONING-BINDING` contract must disposition
`BLK-ARE-ACI-BINDING-001`. A local-only witness disposition may proceed only
with explicit non-integration wording and cannot satisfy packaging or ACI
compatibility.""",
                """`G-ARE-ACI-BINDING` selected option A: integrated actor-journal facts
must be ACI-subordinate, while local-only interim evidence must carry explicit
non-integration wording. Before actor-journal or observation-transport
mutation, Invoke Plan must bind the selected path to current conformance
evidence; external maturity remains blocking for integrated execution.""",
                "W1 binding condition",
            ),
            (
                "Blockers/gaps: unresolved L0 residue; missing retained bytes blocks replay but",
                "Blockers/gaps: external ACI/Bus/ACP/APT maturity and conformance; missing retained bytes blocks replay but",
                "W1 blockers",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md"
    stage_text(
        relative,
        [
            (
                """The current journal package path, storage algorithm, and transport interfaces
are provisional. No implementation may create a second integrated runtime-
journal authority. `ACI-REASONING-BINDING` must first select exactly one:

1. an ACI-subordinate adapter and conformance path;
2. an explicitly local-only protocol witness with a later integration gate; or
3. an incompatible/rejected path with a reroute.""",
                """`G-ARE-ACI-BINDING` selected the ACI-subordinate adapter and
conformance target. No implementation may create a second integrated runtime
journal authority. The current local package path, storage algorithm, and
transport interfaces remain provisional until Invoke Plan maps them either to
an explicitly local-only witness or to current ACI conformance contracts.""",
                "protocol task binding condition",
            ),
            (
                "Neither SWU is ready or selected by this condition.",
                "The owner selection makes the task plan-revisable; neither SWU is ready, selected, or authorized by this condition.",
                "protocol task ceiling",
            ),
        ],
    )
    paths.append(relative)

    relative = f"{TARGET}/planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md"
    stage_text(
        relative,
        [
            (
                """Recovery and quarantine
handles must map to the journal authority selected by
`ACI-REASONING-BINDING`. The existing `AtomicFileRecordStore` evidence is L0
source evidence only; it proves neither ACI durability nor compatibility.""",
                """Recovery and quarantine handles in an integrated path must map to
the ACI-owned journal authority selected by
[`G-ARE-ACI-BINDING`](../../../decisions/aci-reasoning-binding/BINDING-RECEIPT.json).
The existing `AtomicFileRecordStore` evidence is L0 source evidence only; it
proves neither ACI durability nor compatibility, and local-only use must remain
explicitly non-integrated.""",
                "governance task binding condition",
            ),
        ],
    )
    paths.append(relative)
    return paths


def stage_craft() -> list[str]:
    ledger_rel = f"{TARGET}/.craft/ledger.yml"
    text = (ROOT / ledger_rel).read_text(encoding="utf-8")
    replacements = [
        (
            "    ART-ARE-L0-PROMOTION-RECEIPT: artifacts[16]\n",
            """    ART-ARE-L0-PROMOTION-RECEIPT: artifacts[16]
    ART-ARE-ACI-BINDING-DESIGN: artifacts[17]
    ART-ARE-ACI-BINDING-RECEIPT: artifacts[18]
""",
            "craft by-id artifacts",
        ),
        (
            "    BLK-ARE-ACI-BINDING-001: typed_items[3]\n",
            """    BLK-ARE-ACI-BINDING-001: typed_items[3]
    BLK-ARE-ACI-MATURITY-001: typed_items[4]
""",
            "craft by-id blocker",
        ),
        (
            "    DEC-ARE-L0-PROMOTION: decisions[1]\n",
            """    DEC-ARE-L0-PROMOTION: decisions[1]
    DEC-ARE-ACI-BINDING: decisions[2]
""",
            "craft by-id decision",
        ),
        (
            """  active_blockers:
    - BLK-ARE-ACI-BINDING-001""",
            """  active_blockers:
    - BLK-ARE-ACI-MATURITY-001""",
            "craft active blocker",
        ),
        (
            "Run invoke:design ACI-REASONING-BINDING; do not select SWU-ARE-002, SWU-ARE-003, or SWU-ARE-006 until the binding decision passes.",
            "Run invoke:plan ACI-subordinate conformance revision; do not select an implementation SWU until external-maturity and task-specific gates pass.",
            "craft next move",
        ),
        (
            "    decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json: ART-ARE-L0-PROMOTION-RECEIPT\n",
            """    decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json: ART-ARE-L0-PROMOTION-RECEIPT
    design/aci-reasoning-binding/ARCHITECTURE.md: ART-ARE-ACI-BINDING-DESIGN
    decisions/aci-reasoning-binding/BINDING-RECEIPT.json: ART-ARE-ACI-BINDING-RECEIPT
""",
            "craft artifact paths",
        ),
        (
            "    stage: post-l0-binding-design",
            "    stage: aci-binding-selected-plan-revision",
            "craft context stage",
        ),
        (
            "      - ART-ARE-L0-PROMOTION-RECEIPT\n",
            """      - ART-ARE-L0-PROMOTION-RECEIPT
      - ART-ARE-ACI-BINDING-DESIGN
      - ART-ARE-ACI-BINDING-RECEIPT
""",
            "craft owned artifacts",
        ),
        (
            """      The ACI binding blocker and all downstream evidence gaps remain open.""",
            """      G-ARE-ACI-BINDING selected the ACI-subordinate target. The local
      design blocker is resolved; external ACI/Bus/ACP/APT maturity and all
      downstream evidence gaps remain open.""",
            "craft context notes",
        ),
        (
            """      layer; ACI binding design is next and downstream implementation remains closed.""",
            """      layer. G-ARE-ACI-BINDING selected the ACI-subordinate target; plan
      revision is next and downstream implementation remains closed.""",
            "craft active description",
        ),
        (
            """  - item_id: BLK-ARE-ACI-BINDING-001
    item_type: blocker
    context_id: CTX-ARE-ROOT
    summary: Journal, artifact, canonical identity, publication, effect-intent, and lineage ownership are unresolved across the reasoning-engine and ACI candidates.
    blocker_type: design
    lane: target-lifecycle
    owner: reasoning-engine and ACI architecture owners
    refinement_status: refined
    requires_human: true
    status: active
    closure_condition: An approved ACI-REASONING-BINDING selects an ACI-subordinate, explicit local-only, or incompatible/rerouted disposition before affected L1/L2 mutation.
    evidence: ART-ARE-ACI-ADR-001
    links:
      - label: ACI runtime maturity
        target: ART-ARE-ACI-WORK-PACK
        kind: artifact-id
      - label: Bus review maturity
        target: ART-ARE-BUS-ASSESSMENT
        kind: artifact-id
      - label: APT mutation posture
        target: ART-ARE-APT-WORK-PACK
        kind: artifact-id
decisions:""",
            """  - item_id: BLK-ARE-ACI-BINDING-001
    item_type: blocker
    context_id: CTX-ARE-ROOT
    summary: The architecture owner selected an ACI-subordinate target while preserving a non-integrated local interim.
    blocker_type: design
    lane: target-lifecycle
    owner: reasoning-engine and ACI architecture owners
    refinement_status: resolved
    requires_human: true
    status: resolved
    closure_condition: An approved ACI-REASONING-BINDING selects an ACI-subordinate, explicit local-only, or incompatible/rerouted disposition before affected L1/L2 mutation.
    evidence: ART-ARE-ACI-BINDING-RECEIPT
    links:
      - label: Accepted binding design
        target: ART-ARE-ACI-BINDING-DESIGN
        kind: artifact-id
      - label: Binding owner receipt
        target: ART-ARE-ACI-BINDING-RECEIPT
        kind: artifact-id
  - item_id: BLK-ARE-ACI-MATURITY-001
    item_type: blocker
    context_id: CTX-ARE-ROOT
    summary: External ACI runtime, Bus, ACP, APT, and cross-repository conformance evidence is not mature enough for integrated execution.
    blocker_type: external-dependency
    lane: target-lifecycle
    owner: ACI, Bus, ACP, and APT lifecycle owners
    refinement_status: refined
    requires_human: false
    status: active
    closure_condition: Required external owner receipts and cross-repository conformance evidence pass for the exact selected binding.
    evidence: ART-ARE-ACI-WORK-PACK
    links:
      - label: Bus review maturity
        target: ART-ARE-BUS-ASSESSMENT
        kind: artifact-id
      - label: APT mutation posture
        target: ART-ARE-APT-WORK-PACK
        kind: artifact-id
      - label: Selected binding
        target: ART-ARE-ACI-BINDING-RECEIPT
        kind: artifact-id
decisions:""",
            "craft typed blockers",
        ),
        (
            """    links:
      - label: Terminal L0 witness receipt
        target: ART-ARE-L0-WITNESS-RECEIPT
        kind: artifact-id
recomposition: []""",
            """    links:
      - label: Terminal L0 witness receipt
        target: ART-ARE-L0-WITNESS-RECEIPT
        kind: artifact-id
  - decision_id: DEC-ARE-ACI-BINDING
    scope_id: CTX-ARE-ROOT
    question: Which authority disposition governs the reasoning engine after bounded L0 promotion?
    description: The design mapped ACI-subordinate, local-only, defer, and standalone-reroute options; the human architecture owner selected A.
    impact: Selects the ACI-subordinate target with an explicitly local-only interim; it grants no compatibility, implementation, effect, or SWU authority.
    options:
      - ACI-subordinate target
      - local-only
      - defer
      - standalone reroute
    selected_option: ACI-subordinate target
    rationale: Preserve the whole-engine objective without duplicating ACI's accepted one-writer authority.
    status: closed
    blocking: true
    evidence: ART-ARE-ACI-BINDING-RECEIPT
    links:
      - label: Binding design
        target: ART-ARE-ACI-BINDING-DESIGN
        kind: artifact-id
      - label: Owner receipt
        target: ART-ARE-ACI-BINDING-RECEIPT
        kind: artifact-id
recomposition: []""",
            "craft decision row",
        ),
    ]
    for old, new, label in replacements:
        if label == "craft next move":
            count = text.count(old)
            if count != 2:
                raise ValueError(f"{label}: expected two matches, found {count}")
            text = text.replace(old, new)
        else:
            text = replace_once(text, old, new, label)

    artifact_anchor = """  - artifact_id: ART-ARE-L0-PROMOTION-RECEIPT
    owner_context_id: CTX-ARE-ROOT
    path: decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json
    artifact_type: promotion-receipt
    status: pass
    notes: >-
      Explicit human-owner admission of the private finite L0 semantic witness.
      It selects no SWU and authorizes no implementation or broader engine claim.
"""
    artifact_replacement = artifact_anchor + """  - artifact_id: ART-ARE-ACI-BINDING-DESIGN
    owner_context_id: CTX-ARE-ROOT
    path: design/aci-reasoning-binding/ARCHITECTURE.md
    artifact_type: architecture-binding
    status: pass
    notes: Accepted ACI-subordinate target architecture; external runtime and conformance gates remain open.
  - artifact_id: ART-ARE-ACI-BINDING-RECEIPT
    owner_context_id: CTX-ARE-ROOT
    path: decisions/aci-reasoning-binding/BINDING-RECEIPT.json
    artifact_type: decision-receipt
    status: pass
    notes: Explicit option-A owner receipt; no compatibility, implementation, effect, or SWU authority.
"""
    text = replace_once(text, artifact_anchor, artifact_replacement, "craft artifacts")
    ledger_path = write_stage(ledger_rel, text)

    index_rel = f"{TARGET}/.craft/index.json"
    index = json.loads((ROOT / index_rel).read_text(encoding="utf-8"))
    ledger = __import__("yaml").safe_load(text)
    index["metadata"].update(
        {
            "ledger_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "generated_at": STAMP,
            "generator_version": "aci-binding-selection/1",
        }
    )
    index["by_id"] = ledger["indexes"]["by_id"]
    for family, row_id, idx in [
        ("artifacts", "ART-ARE-ACI-BINDING-DESIGN", 17),
        ("artifacts", "ART-ARE-ACI-BINDING-RECEIPT", 18),
        ("typed_items", "BLK-ARE-ACI-MATURITY-001", 4),
        ("decisions", "DEC-ARE-ACI-BINDING", 2),
    ]:
        if row_id not in index["by_family"][family]:
            index["by_family"][family].append(row_id)
        index["row_selectors"][row_id] = {
            "family": family,
            "row_id": row_id,
            "path": ".craft/ledger.yml",
            "index": idx,
        }
    index["active_blockers"] = ledger["indexes"]["active_blockers"]
    index["next_moves"] = ledger["indexes"]["next_moves"]
    index["artifacts_by_path"] = ledger["indexes"]["artifacts_by_path"]
    index["pending_by_node"][0].update(
        {
            "status": "flag",
            "blockers": ledger["indexes"]["active_blockers"],
            "next_move": ledger["indexes"]["next_moves"][0]["next_move"],
        }
    )
    root_refs = index["references"]["CTX-ARE-ROOT"]
    for row_id in [
        "ART-ARE-ACI-BINDING-DESIGN",
        "ART-ARE-ACI-BINDING-RECEIPT",
        "BLK-ARE-ACI-MATURITY-001",
        "DEC-ARE-ACI-BINDING",
    ]:
        if row_id not in root_refs:
            root_refs.append(row_id)
        if row_id not in index["reverse_links"]["CTX-ARE-ROOT"]:
            index["reverse_links"]["CTX-ARE-ROOT"].append(row_id)
    index["references"]["BLK-ARE-ACI-BINDING-001"] = [
        "ART-ARE-ACI-BINDING-DESIGN",
        "ART-ARE-ACI-BINDING-RECEIPT",
    ]
    index["references"]["BLK-ARE-ACI-MATURITY-001"] = [
        "ART-ARE-ACI-WORK-PACK",
        "ART-ARE-BUS-ASSESSMENT",
        "ART-ARE-APT-WORK-PACK",
        "ART-ARE-ACI-BINDING-RECEIPT",
    ]
    index["references"]["DEC-ARE-ACI-BINDING"] = [
        "ART-ARE-ACI-BINDING-DESIGN",
        "ART-ARE-ACI-BINDING-RECEIPT",
    ]
    index["reverse_links"]["BLK-ARE-ACI-BINDING-001"] = ["CTX-ARE-ROOT"]
    for artifact_id, consumers in {
        "ART-ARE-ACI-BINDING-DESIGN": [
            "CTX-ARE-ROOT",
            "BLK-ARE-ACI-BINDING-001",
            "DEC-ARE-ACI-BINDING",
        ],
        "ART-ARE-ACI-BINDING-RECEIPT": [
            "CTX-ARE-ROOT",
            "BLK-ARE-ACI-BINDING-001",
            "BLK-ARE-ACI-MATURITY-001",
            "DEC-ARE-ACI-BINDING",
        ],
    }.items():
        index["reverse_links"][artifact_id] = consumers
        index["evidence_refs"][artifact_id] = [
            item for item in consumers if item != "CTX-ARE-ROOT"
        ]
    index["stale_status"] = "fresh"
    write_stage(index_rel, json.dumps(index, indent=2, ensure_ascii=False) + "\n")

    craft_rel = f"{TARGET}/CRAFT.md"
    craft = """# Agent reasoning engine — Craft view

> Derived human view. Authority remains in [`.craft/ledger.yml`](.craft/ledger.yml).
> This scoped ledger does not validate or repair the parent `cyberAlchemy-v2` ledger.

## Quick links

- Next move: [revise the ACI-subordinate plan](#next-move)
- Active blockers: [`BLK-ARE-ACI-MATURITY-001`](#active-external-maturity-blocker)
- Blocking decisions: none
- Active gaps: [downstream residue](#active-gaps-and-residue)
- Terminal artifacts: [L0 promotion](decisions/g-are-l0-promotion/PROMOTION-RECEIPT.json), [binding decision](decisions/aci-reasoning-binding/BINDING-RECEIPT.json)

## Context CTX-ARE-ROOT

- **Stage / gate:** `aci-binding-selected-plan-revision` / `pass`
- **L0:** `SWU-ARE-001` completed and its bounded private witness is promoted.
- **Binding:** `G-ARE-ACI-BINDING` passed with option A, selecting an
  ACI-subordinate target and an explicitly local-only interim.
- **Selected work:** none. No downstream SWU is authorized.
- **Current route:** `invoke:plan ACI-subordinate conformance revision`.

## Closed ACI binding decision

`DEC-ARE-ACI-BINDING` selected the ACI-subordinate target. Integrated journal
facts, canonical acceptance identity, replay cursor, and effect intents belong
to ACI; semantic derivation and reasoning-receipt content remain
evaluator-owned. The decision is evidenced by
[`ART-ARE-ACI-BINDING-RECEIPT`](decisions/aci-reasoning-binding/BINDING-RECEIPT.json).

This closes the local ownership-disposition blocker only. It does not establish
runtime compatibility or authorize implementation.

## Active external maturity blocker

`BLK-ARE-ACI-MATURITY-001` blocks integrated execution. ACI runtime remains
blocked, Bus has no later post-remediation `PASS`, ACP is discovery, APT
mutation is blocked, and cross-repository conformance receipts do not exist.
Local-only evidence must remain explicitly non-integrated.

## Active gaps and residue

- **GAP-ARE-ARTIFACT-DURABILITY:** artifact admission and production durability remain L2 work.
- **GAP-ARE-INCIDENT-READINESS:** incident behavior and operational response remain downstream.
- **GAP-ARE-ROLLOUT-READINESS:** private rollout and the general-engine label remain unsupported.
- **GAP-ARE-INTENT-EVIDENCE:** revision-history and inter-rater evidence remain outside L0.
- **GAP-ARE-ANTI-BIAS-EFFICACY:** anti-bias efficacy remains explicitly excluded.

## Artifacts

| ID | Status | Meaning |
|---|---|---|
| ART-ARE-L0-PROMOTION-RECEIPT | pass | Bounded L0 admission; no implementation authority |
| ART-ARE-ACI-BINDING-DESIGN | pass | Accepted ACI-subordinate target architecture |
| ART-ARE-ACI-BINDING-RECEIPT | pass | Explicit option-A owner selection |
| ART-ARE-ACI-ADR-001 | accepted-w0-only | External decision evidence; runtime remains blocked |
| ART-ARE-ACI-WORK-PACK | blocked | External runtime-maturity evidence |
| ART-ARE-BUS-ASSESSMENT | fix | Candidate publication seam; no later PASS |
| ART-ARE-APT-WORK-PACK | mutation-blocked | Candidate lineage seam; no mutation authority |

## Next move

Run `invoke:plan ACI-subordinate conformance revision`. Do not select an
implementation SWU until external-maturity and task-specific gates pass.
"""
    write_stage(craft_rel, craft)
    return [ledger_rel, index_rel, craft_rel]


def build_package(owner: str, paths: list[str]) -> None:
    source_paths = [DECISION_RECEIPT, DECISION_RECORD]
    package = {
        "schema_version": "1.0.0",
        "package_id": f"ARE-ACI-BINDING-{owner.upper()}-APPLY-20260723",
        "mutation_mode": "apply-approved",
        "mutation_state": "materialized",
        "lifecycle_owner": owner,
        "authority_class": "private",
        "publication_class": "internal",
        "source_artifacts": [
            {
                **ref(ROOT / relative, relative),
                "authority_class": "private",
            }
            for relative in source_paths
        ],
        "changes": [],
        "target_inventory": [],
        "dependencies": [],
        "mirror_groups": [],
        "approval": {
            "class": "explicit-apply",
            "owner": owner,
            "scope_paths": paths,
            "authority_classes": ["private"],
            "publication_classes": ["internal"],
        },
        "validation_commands": [
            f"python3 {RUN.relative_to(ROOT)}/validate_sync.py --surface staged",
            f"python3 {RUN.relative_to(ROOT)}/validate_sync.py --surface target",
        ],
    }
    for idx, relative in enumerate(paths, 1):
        baseline = ROOT / relative
        staged = OUT / relative
        dep_id = f"baseline-{idx}"
        package["changes"].append(
            {
                "target_path": relative,
                "operation": "update",
                "output_ref": ref(staged, str(staged.relative_to(ROOT))),
            }
        )
        package["target_inventory"].append(
            {
                "target_path": relative,
                "lifecycle_owner": owner,
                "authority_class": "private",
                "publication_class": "internal",
                "dependency_ids": [dep_id],
            }
        )
        package["dependencies"].append(
            {
                "dependency_id": dep_id,
                "artifact_ref": ref(baseline, relative),
            }
        )
    (RUN / f"{owner}-material-package.json").write_text(
        json.dumps(package, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    invoke_paths = stage_invoke()
    craft_paths = stage_craft()
    build_package("invoke", invoke_paths)
    build_package("craft", craft_paths)
    print(f"STAGED_INVOKE={len(invoke_paths)}")
    print(f"STAGED_CRAFT={len(craft_paths)}")


if __name__ == "__main__":
    main()
