"""Owner-facing formal adapters and evidence-bound claims; no implicit publication."""
import argparse
from collections import Counter
import json
import os
from pathlib import Path
import shutil
import sys
import uuid
import zipfile
sys.dont_write_bytecode = True
KIT = Path(__file__).resolve().parent
sys.path.insert(0, str(KIT / "adapters"))
from common import Invalid, b64, capture, check_version, clean, data, digest, fields, file, read, ref, save, sha, tool_paths, verify_ref
import driver
import evf_core as core

ADAPTER_FILES = ["adapters/common.py", "adapters/driver.py", "adapters/graph.py", "adapters/cbmc.py", "adapters/lean_adapter.py",
                 "adapters/tlc.py", "formal.py", "evf_core.py", "TOOLCHAINS.json"]

def tools_bind(root, values, trusted):
    if not trusted:
        raise Invalid("Use --trust-local-tools only for installations you trust")
    core.isolation()
    catalog = read(KIT / "TOOLCHAINS.json")
    entries = {}
    for name, value in values.items():
        if not value:
            continue
        path = Path(value).resolve(strict=True)
        if not path.is_file() or (name not in ("alloy", "tlc") and not os.access(path, os.X_OK)):
            raise Invalid("Tool is not an executable file: " + name)
        if name in catalog["tools"] and sha(path) != catalog["tools"][name]["sha256"]:
            raise Invalid("Tool bytes differ from the shipped exact runtime catalog: " + name)
        if name in ("alloy", "tlc"):
            with zipfile.ZipFile(path) as archive:
                manifest = archive.read("META-INF/MANIFEST.MF").decode()
            marker = "Bundle-Version: 6.2.0" if name == "alloy" else "X-Git-Tag: v1.7.4"
            if marker not in manifest:
                raise Invalid("JAR version mismatch: " + name)
            version = "6.2.0" if name == "alloy" else driver.tlc.VERSION
        else:
            result = capture([path, "-version" if name == "java" else "--version"], root, timeout=10)
            version = check_version(name, result)
        entries[name] = {"file": ref(root, path), "version_output": version}
        if name == "cc":
            result = capture([path, "-print-prog-name=cc1"], root, timeout=10)
            clean(result)
            from common import raw
            cc1 = Path(raw(result["stdout"]).decode().strip()).resolve(strict=True)
            entries["cc1"] = {"file": ref(root, cc1), "version_output": "GCC preprocessor/compiler support executable"}
    if not entries:
        raise Invalid("Supply at least one runtime")
    entries["python"] = {"file": ref(root, Path(sys.executable)), "version_output": sys.version.splitlines()[0]}
    result = {"schema_version": "evf.formal-tools/v1", "tools": entries, "catalog_ref": ref(root, KIT / "TOOLCHAINS.json"),
              "trust_assumptions": catalog["trust_assumptions"]}
    path = root / ".evf-tools" / (digest(result) + ".json")
    if path.parent.is_symlink():
        raise Invalid("Tool-binding directory must not be a symlink")
    core.new_json(path, result)
    return {"status": "bound-not-admitted", "tools": str(path.relative_to(root)), "providers": sorted(set(entries) - {"python", "cc1"})}

def spec_read(root, name):
    value = read(file(root, name))
    fields(value, ("schema_version", "audit_id", "obligation", "claims"))
    if value["schema_version"] != "evf.formal-audit/v1":
        raise Invalid("Unsupported formal audit specification")
    core.identifier(value["audit_id"])
    file(root, value["obligation"])
    if not isinstance(value["claims"], list) or not value["claims"]:
        raise Invalid("At least one formal claim is required")
    ids = []
    for claim in value["claims"]:
        fields(claim, ("id", "description", "positive", "negative", "assumptions", "limits"))
        ids.append(core.identifier(claim["id"]))
        if not isinstance(claim["description"], str) or not claim["description"].strip():
            raise Invalid("Describe the intended claim")
        for key in ("assumptions", "limits"):
            if not isinstance(claim[key], list) or not claim[key] or any(not isinstance(x, str) or not x.strip() for x in claim[key]):
                raise Invalid("Explicit claim assumptions and limits are required")
        positive, negative = read(file(root, claim["positive"])), read(file(root, claim["negative"]))
        driver.request(root, positive)
        driver.request(root, negative)
        if positive["provider"] != negative["provider"] or positive == negative:
            raise Invalid("Positive and deliberate negative must be distinct requests for the same provider")
    if len(set(ids)) != len(ids):
        raise Invalid("Duplicate claim identifier")
    return value

def check_tools(root, lock):
    paths = tool_paths(root, lock)
    catalog_path = verify_ref(root, lock["catalog_ref"])
    if catalog_path != KIT / "TOOLCHAINS.json":
        raise Invalid("Tool manifest belongs to a different kit")
    catalog = read(catalog_path)
    if lock["trust_assumptions"] != catalog["trust_assumptions"]:
        raise Invalid("Tool trust assumptions changed")
    for name, expected in catalog["tools"].items():
        if name in paths and sha(paths[name]) != expected["sha256"]:
            raise Invalid("Tool does not match shipped catalog")
    return paths

def build_profile(root, specification, spec_name, claim, tools_name, batch):
    positive, negative = read(file(root, claim["positive"])), read(file(root, claim["negative"]))
    provider = positive["provider"]
    lock = read(file(root, tools_name))
    paths = check_tools(root, lock)
    if not driver.REQUIRED[provider] <= paths.keys():
        raise Invalid("Required runtime missing for " + provider)
    raw_dir = batch / claim["id"] / "raw"
    raw_dir.mkdir(parents=True)
    negative_outcome = "rejected-proof" if provider == "lean" else "counterexample"
    spec = {"schema_version": "evf.audit-spec/v1", "audit_id": specification["audit_id"] + "." + claim["id"],
            "subject": claim["description"], "claim_ceiling": "; ".join(claim["limits"]),
            "sources": [specification["obligation"], spec_name],
            "bindings": sorted(set([claim["positive"], claim["negative"], positive["source"], negative["source"], tools_name]
                                  + [str(p.relative_to(root)) for value in (positive, negative) for p in driver.dependencies(root, value)])),
            "obligations": [claim["id"]], "checks": [{
                "id": claim["id"], "provider": provider, "obligations": [claim["id"]],
                "executable": str(paths["python"]),
                "args": ["-B", str(KIT / "adapters/driver.py"), "--input", "{input}", "--tools", tools_name,
                         "--records", str(raw_dir.relative_to(root))],
                "tool_files": [str(KIT / name) for name in ADAPTER_FILES] + [str(p) for p in paths.values()],
                "input": claim["positive"], "expected": driver.summary(provider, "supported"),
                "negative_controls": [{"id": claim["id"] + ".negative", "input": claim["negative"],
                                       "expected": driver.summary(provider, negative_outcome),
                                       "reason_code": driver.summary(provider, negative_outcome)["reason_code"]}],
                "timeout_ms": 180000, "max_output_bytes": 4096}]}
    generated = batch / claim["id"] / "audit-spec.json"
    save(generated, spec)
    profile_path = core.freeze(root, str(generated.relative_to(root)), route="theorem" if provider == "lean" else "executable")
    return profile_path, raw_dir

def verify_job(root, job, claim, tools_name):
    fields(job, ("id", "status", "profile_ref", "evidence_ref", "records"))
    if job["id"] != claim["id"] or job["status"] != "passed":
        raise Invalid("Formal claim does not have a passing EVF run")
    profile_path, evidence_path = verify_ref(root, job["profile_ref"]), verify_ref(root, job["evidence_ref"])
    verified, code = core.verify(root, str(evidence_path))
    if code or verified.get("aggregate_state") != "passed":
        raise Invalid("Independent EVF evidence verification did not pass")
    profile = read(profile_path)
    evidence = read(evidence_path)
    if evidence["profile_ref"] != job["profile_ref"]:
        raise Invalid("Evidence/profile binding mismatch")
    lock = read(file(root, tools_name))
    paths = check_tools(root, lock)
    positive, negative = read(file(root, claim["positive"])), read(file(root, claim["negative"]))
    provider = positive["provider"]
    if profile["route"] != ("theorem" if provider == "lean" else "executable"):
        raise Invalid("Evidence route does not match the formal provider")
    if len(profile["checks"]) != 1 or len(profile["mutations"]) != 1 or profile["repetitions"] != 2:
        raise Invalid("Formal profile check/negative/repetition denominator changed")
    check, negative_check = profile["checks"][0], profile["mutations"][0]
    if (check["provider_id"] != provider or check["input_ref"] != ref(root, file(root, claim["positive"]))
            or negative_check["input_ref"] != ref(root, file(root, claim["negative"]))
            or check["expected_output"] != driver.summary(provider, "supported")
            or negative_check["expected_output"] != driver.summary(provider, "rejected-proof" if provider == "lean" else "counterexample")):
        raise Invalid("Formal profile is not checking the declared positive and negative requests")
    argv = check["runtime"]["argv"]
    if len(argv) != 8 or argv[:7] != ["-B", str(KIT / "adapters/driver.py"), "--input", "{input}", "--tools", tools_name, "--records"]:
        raise Invalid("Formal provider invocation changed")
    records_directory = (root / argv[7]).resolve()
    if not records_directory.is_relative_to(root):
        raise Invalid("Formal records directory escapes workspace")
    if len(job["records"]) != 4 or len({digest(r) for r in job["records"]}) != 4:
        raise Invalid("Require exactly two positive and two negative tool invocations")
    counts, positive_details = Counter(), []
    for item in job["records"]:
        record_path = verify_ref(root, item)
        if record_path.parent != records_directory:
            raise Invalid("Raw record belongs to a different EVF invocation")
        record = read(record_path)
        recorded_digest = record.pop("receipt_digest")
        if recorded_digest != digest(record):
            raise Invalid("Raw provider receipt digest mismatch")
        if record["provider"] != provider or record["tools_ref"] != ref(root, file(root, tools_name)):
            raise Invalid("Raw provider or tool binding mismatch")
        request_path = verify_ref(root, record["request_ref"])
        name = request_path.relative_to(root).as_posix()
        if name not in (claim["positive"], claim["negative"]):
            raise Invalid("Undeclared raw provider request")
        value = read(request_path)
        source = verify_ref(root, record["source_ref"])
        if source != driver.request(root, value):
            raise Invalid("Provider input source binding mismatch")
        dependencies = [ref(root, p) for p in driver.dependencies(root, value)]
        if record["dependency_refs"] != dependencies:
            raise Invalid("Provider configuration/dependency binding mismatch")
        for process in record["native_evidence"]["processes"]:
            executable = paths["java" if provider in ("alloy", "tlc") else provider]
            if process["argv"][0] != str(executable):
                raise Invalid("Raw observation names a different runtime")
            if provider == "alloy" and process["argv"][3] != str(paths["alloy"]):
                raise Invalid("Raw observation names a different Alloy JAR")
        outcome, details = driver.classify(value, record["native_evidence"], root)
        expected_outcome = "supported" if name == claim["positive"] else ("rejected-proof" if provider == "lean" else "counterexample")
        if outcome != expected_outcome or record["normalized_outcome"] != outcome or record["details"] != details or record["summary"] != driver.summary(provider, outcome):
            raise Invalid("Native evidence does not support its expected outcome")
        counts[name] += 1
        if outcome == "supported":
            positive_details.append(details)
    if counts != Counter({claim["positive"]: 2, claim["negative"]: 2}) or positive_details[0] != positive_details[1]:
        raise Invalid("Provider replay/negative denominator differs")
    property_value = positive["options"] if provider in ("lean", "cbmc", "tlc") else read(file(root, positive["source"]))
    return {"schema_version": "evf.portable-formal-claim/v1-candidate", "claim_id": claim["id"],
            "status": "supported-for-declared-scope", "evidence_kind": driver.KINDS[provider],
            "author_description": claim["description"], "machine_property": property_value,
            "source_ref": ref(root, file(root, positive["source"])), "provider": provider,
            "dependency_refs": [ref(root, p) for p in driver.dependencies(root, positive)],
            "assumptions": claim["assumptions"] + lock["trust_assumptions"], "limits": claim["limits"],
            "observed_details": positive_details[0], "evf_evidence_ref": job["evidence_ref"],
            "raw_evidence_refs": job["records"], "authority_effect": "none", "whole_system_claim": False}

def run_formal(root, spec_name, tools_name, trusted):
    if not trusted:
        raise Invalid("Formal execution requires --trust-local-providers")
    core.isolation()
    specification = spec_read(root, spec_name)
    check_tools(root, read(file(root, tools_name)))
    parent = root / ".evf-formal"
    if parent.is_symlink():
        raise Invalid("Formal evidence store must not be a symlink")
    batch = parent / ("run-" + uuid.uuid4().hex)
    batch.mkdir(parents=True)
    jobs, claims = [], []
    for claim in specification["claims"]:
        try:
            profile, raw_directory = build_profile(root, specification, spec_name, claim, tools_name, batch)
            result, code = core.run(root, str(profile.relative_to(root)), True)
            if code:
                raise Invalid("EVF run did not pass: " + json.dumps(result))
            job = {"id": claim["id"], "status": "passed", "profile_ref": ref(root, profile),
                   "evidence_ref": ref(root, Path(result["evidence"])),
                   "records": [ref(root, p) for p in sorted(raw_directory.glob("*.json"))]}
            checked_claim = verify_job(root, job, claim, tools_name)
            jobs.append(job)
            claims.append(checked_claim)
        except (Invalid, core.Error, OSError, ValueError, KeyError, TypeError) as error:
            jobs.append({"id": claim["id"], "status": "not_evaluable", "reason": str(error)})
    passed = len(claims) == len(specification["claims"])
    bundle = {"schema_version": "evf.formal-audit-bundle/v1", "status": "passed" if passed else "not_established",
              "spec_ref": ref(root, file(root, spec_name)), "tools_ref": ref(root, file(root, tools_name)),
              "jobs": jobs, "claims": claims, "authority_effect": "none"}
    bundle["bundle_digest"] = digest(bundle)
    destination = batch / "FORMAL-CLAIMS.json"
    save(destination, bundle)
    return {"status": bundle["status"], "formal_claims": str(destination), "supported_claims": len(claims),
            "required_claims": len(specification["claims"]), "failures": [j for j in jobs if j["status"] != "passed"],
            "whole_system_claim": False, "authority_effect": "none"}, 0 if passed else 2

def verify_formal(root, name):
    path = Path(name)
    path = path.resolve() if path.is_absolute() else file(root, name)
    if not path.is_relative_to(root):
        raise Invalid("Formal claims must be inside the selected workspace")
    bundle = read(path)
    bound = bundle.pop("bundle_digest")
    if digest(bundle) != bound or bundle.get("schema_version") != "evf.formal-audit-bundle/v1" or bundle.get("status") != "passed" or bundle.get("authority_effect") != "none":
        raise Invalid("Formal bundle is altered, incomplete, or unsupported")
    spec_path = verify_ref(root, bundle["spec_ref"])
    tools_path = verify_ref(root, bundle["tools_ref"])
    specification = spec_read(root, str(spec_path.relative_to(root)))
    if len(bundle["jobs"]) != len(specification["claims"]) or len(bundle["claims"]) != len(specification["claims"]):
        raise Invalid("Formal claim denominator changed")
    recomputed = [verify_job(root, job, claim, str(tools_path.relative_to(root)))
                  for job, claim in zip(bundle["jobs"], specification["claims"], strict=True)]
    if recomputed != bundle["claims"]:
        raise Invalid("Published claim is stronger or different than recomputed evidence")
    return {"verdict": "passed", "claims_verified": len(recomputed), "bundle_digest": bound,
            "whole_system_claim": False, "authority_effect": "none"}

def main():
    parser = argparse.ArgumentParser(description="Portable formal adapters and bounded claims")
    commands = parser.add_subparsers(dest="command", required=True)
    init = commands.add_parser("formal-init")
    init.add_argument("destination")
    binding = commands.add_parser("formal-tools")
    binding.add_argument("--workspace", required=True)
    binding.add_argument("--trust-local-tools", action="store_true")
    for name in ("souffle", "alloy", "java", "cbmc", "lean", "cc", "tlc"):
        binding.add_argument("--" + name)
    execute = commands.add_parser("formal-run")
    execute.add_argument("--workspace", required=True)
    execute.add_argument("--spec", default="audit.json")
    execute.add_argument("--tools", required=True)
    execute.add_argument("--trust-local-providers", action="store_true")
    verify = commands.add_parser("formal-verify")
    verify.add_argument("--workspace", required=True)
    verify.add_argument("--claims", required=True)
    args = parser.parse_args()
    code = 0
    try:
        core.check_kit()
        if args.command == "formal-init":
            target = Path(args.destination).absolute()
            if target.exists() or target.is_symlink():
                raise Invalid("Choose a new formal-audit directory; existing work is preserved")
            shutil.copytree(KIT / "formal-example", target)
            value = {"status": "created", "workspace": str(target), "next": "formal-tools, then formal-run, then formal-verify"}
        else:
            root = core.workspace(args.workspace)
            if args.command == "formal-tools":
                value = tools_bind(root, {n: getattr(args, n) for n in ("souffle", "alloy", "java", "cbmc", "lean", "cc", "tlc")}, args.trust_local_tools)
            elif args.command == "formal-run":
                value, code = run_formal(root, args.spec, args.tools, args.trust_local_providers)
            else:
                value = verify_formal(root, args.claims)
    except (Invalid, core.Error, OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        value, code = {"status": "not_evaluable", "reason": str(error), "formal_claim": "not-established", "authority_effect": "none"}, 2
    print(data(value).decode(), end="")
    return code
