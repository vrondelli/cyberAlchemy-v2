"""Source-bound Cobertura evidence, not suspiciousness or answer labels.
Open Questions: evidence/G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json.
"""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path


def sha(data):
    return hashlib.sha256(data).hexdigest()


def bind_coverage(xml_bytes, sources, instrumentation):
    # ElementTree does not fetch the external Cobertura DTD. Reject declarations
    # of entities rather than admitting expanded or substituted source fields.
    if b"<!ENTITY" in xml_bytes or len(xml_bytes) > 32 * 1024 * 1024:
        raise ValueError("coverage.xml-boundary")
    tree = ET.fromstring(xml_bytes)
    if tree.tag != "coverage" or [s.text for s in tree.findall("./sources/source")] != [instrumentation["source_root"]]:
        raise ValueError("coverage.source-root")
    allowed = set(instrumentation["classes"])
    rows = {}
    names = set()
    class_line_count = 0
    class_covered_count = 0
    for c in tree.findall("./packages/package/classes/class"):
        name, filename = c.get("name"), c.get("filename")
        if not name or name in names or name.split("$")[0] not in allowed:
            raise ValueError("coverage.class-not-instrumented-or-duplicate")
        names.add(name)
        if not filename or "\\" in filename or filename.startswith("/") or any(x in ("", ".", "..") for x in filename.split("/")):
            raise ValueError("coverage.unsafe-filename")
        path = instrumentation["source_root"] + "/" + filename
        source = sources.get(path)
        if source is None or sha(source["bytes"]) != source["sha256"]:
            raise ValueError("coverage.source-not-bound")
        source_lines = source["bytes"].decode("utf-8", errors="strict").splitlines()
        row = rows.setdefault(path, {"path": path, "source_sha256": source["sha256"], "classes": [], "line_hits": {}})
        row["classes"].append(name)
        seen = set()
        for line in c.findall("./lines/line"):
            number, hits = line.get("number"), line.get("hits")
            if not re.fullmatch(r"[0-9]+", number or "") or not re.fullmatch(r"[0-9]+", hits or ""):
                raise ValueError("coverage.invalid-counter")
            number, hits = int(number), int(hits)
            if number < 1 or number > len(source_lines) or number in seen:
                raise ValueError("coverage.invalid-line-or-duplicate")
            seen.add(number)
            class_line_count += 1
            class_covered_count += hits > 0
            # A source line can belong to more than one compiled inner class.
            # Preserve a positive observation without adding duplicate source units.
            row["line_hits"][number] = max(row["line_hits"].get(number, 0), hits)
    if not names:
        raise ValueError("coverage.empty")
    result = []
    for path in sorted(rows):
        row = rows[path]
        row["line_hits"] = [{"line": n, "hits": h} for n, h in sorted(row["line_hits"].items())]
        row["observed_executable_lines"] = len(row["line_hits"])
        row["executed_lines"] = sum(x["hits"] > 0 for x in row["line_hits"])
        result.append(row)
    return {"rows": result, "reported_classes": len(names), "reported_source_files": len(result),
            "source_files_with_execution": sum(r["executed_lines"] > 0 for r in result),
            "unique_source_executable_lines": sum(r["observed_executable_lines"] for r in result),
            "unique_executed_source_lines": sum(r["executed_lines"] for r in result),
            "class_line_observations": class_line_count, "class_line_positive_observations": class_covered_count,
            "reported_lines_valid": tree.get("lines-valid"), "reported_lines_covered": tree.get("lines-covered"),
            "negative_evidence_policy": "Zero hits means this instrumented test did not execute this line; it does not prove irrelevance or absence of a bug. Missing classes are not unexecuted classes."}


def main():
    root = Path("/home/vlad_/are-benchmark-archive/g01-runtime-coverage-jxpath8-r1-20261006")
    result_bytes = (root / "RESULT.json").read_bytes()
    result = json.loads(result_bytes)
    if result["status"] != "terminal-coverage-execution-complete":
        raise ValueError("coverage.execution-incomplete")
    projection = json.loads((root / "buggy-java-only/RECEIPT.json").read_bytes())
    instrumentation_bytes = (root / "INSTRUMENTATION.json").read_bytes()
    instrumentation = json.loads(instrumentation_bytes)
    class_bytes = (root / "ALL-PRODUCTION-CLASSES.txt").read_bytes()
    if class_bytes.decode().splitlines() != instrumentation["classes"] or "-i" not in result["execution"]["args"]:
        raise ValueError("coverage.explicit-all-class-binding")
    sources = {}
    for source in projection["sources"]:
        data = (root / "buggy-java-only/corpus" / source["path"]).read_bytes()
        if sha(data) != source["sha256"] or sha((root / "trusted-fixture" / source["path"]).read_bytes()) != source["sha256"]:
            raise ValueError("coverage.source-drift")
        sources[source["path"]] = {**source, "bytes": data}
    xml_bytes = (root / "trusted-fixture/coverage.xml").read_bytes()
    if sha(xml_bytes) != result["coverage_xml_sha256"]:
        raise ValueError("coverage.xml-drift")
    failure_bytes = (root / "trusted-fixture/failing_tests").read_bytes()
    failures = re.findall(r"^--- (.+)$", failure_bytes.decode(), re.M)
    if failures != ["org.apache.commons.jxpath.ri.compiler.CoreOperationTest::testNan"]:
        raise ValueError("coverage.test-not-reproduced")
    bound = bind_coverage(xml_bytes, sources, instrumentation)
    out = {"status": "single-exposed-case-source-bound-execution-coverage", "case_id": "Defects4J-JxPath-8",
           "result_sha256": sha(result_bytes), "coverage_xml_sha256": sha(xml_bytes),
           "instrumentation_sha256": sha(instrumentation_bytes), "all_class_list_sha256": sha(class_bytes),
           "failure_observation_sha256": sha(failure_bytes), "binding_source_sha256": sha(Path(__file__).read_bytes()), **bound,
           "provider_calls": 0, "reference_label_reads": 0, "authority_effect": "none",
           "claim_ceiling": "Exact buggy-source execution evidence for one exposed test; not fault responsibility, ranking quality or superiority.",
           "open_questions_owner": "G01-RUNTIME-COVERAGE-FEASIBILITY-R1.json"}
    data = (json.dumps(out, indent=2) + "\n").encode()
    with (root / "SOURCE-BOUND-COVERAGE.json").open("xb") as stream:
        stream.write(data)
    print(json.dumps({k: out[k] for k in ["status", "reported_classes", "reported_source_files", "source_files_with_execution", "unique_executed_source_lines"]} | {"sha256": sha(data)}))


if __name__ == "__main__":
    main()
