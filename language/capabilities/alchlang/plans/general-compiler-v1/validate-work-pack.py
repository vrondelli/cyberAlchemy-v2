#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def fail(msg): raise SystemExit(f"ALCHLANG_GENERAL_COMPILER_WORK_PACK:{msg}")

plan = json.loads((ROOT / "work-pack.json").read_text())
schema = json.loads((ROOT / "work-pack.schema.json").read_text())
if set(plan) != set(schema["required"]): fail("closed-root-shape")
for key in ("schema_version","work_pack_id","status","route","stop_condition","publication","external_effect","authority_effect"):
    expected = schema["properties"][key]["const"]
    if plan[key] != expected: fail(f"root-constant:{key}")
for source in plan["source_bindings"]:
    path = (ROOT / source["path"]).resolve()
    if not path.is_file(): fail(f"missing-source:{source['path']}")
    if digest(path) != source["sha256"]: fail(f"source-drift:{source['path']}")

task_ids = [task["swu_id"] for task in plan["tasks"]]
if task_ids != plan["frontier"] or len(task_ids) != len(set(task_ids)): fail("frontier-order")
all_targets = []
for index, task in enumerate(plan["tasks"]):
    if task["authority_effect"] != "none": fail(f"task-authority:{task['swu_id']}")
    expected_dependencies = [] if index == 0 else [task_ids[index - 1]]
    if task["dependencies"] != expected_dependencies: fail(f"dependency:{task['swu_id']}")
    expected_successor = task_ids[index + 1] if index + 1 < len(task_ids) else None
    if task["successor"] != expected_successor: fail(f"successor:{task['swu_id']}")
    if not task["material_writes"] or not task["validation"] or not task["done_criteria"]: fail(f"incomplete-contract:{task['swu_id']}")
    targets = task["material_writes"]
    if len(targets) != len(set(targets)): fail(f"duplicate-local-target:{task['swu_id']}")
    all_targets.extend(targets)
if len(all_targets) != len(set(all_targets)): fail("cross-task-target-overlap")

binding_task = next(task for task in plan["tasks"] if task["swu_id"] == "GC-SWU-04")
delegation = binding_task.get("delegation", {})
if delegation.get("required") is not True or delegation.get("route") != "CA2-ROUTE-DELEGATE" or delegation.get("helper_count") != 1:
    fail("binding-delegation")

material_files = ["work-pack.json","work-pack.schema.json","WORK-PACK.md","validate-work-pack.py"]
material_digest = hashlib.sha256("".join(f"{name}:{digest(ROOT/name)}\n" for name in sorted(material_files)).encode()).hexdigest()
print(json.dumps({
    "schema_version":"cav2.alchlang.general-compiler.work-pack-validation/v1-candidate",
    "status":"PASS","work_pack_id":plan["work_pack_id"],"frontier":plan["frontier"],
    "source_bindings":len(plan["source_bindings"]),"declared_targets":len(all_targets),"binding_delegation":"PASS","material_digest":material_digest,
    "authority_effect":"none","claim_ceiling":plan["claim_ceiling"]
}, indent=2))
