"""Evaluator-only 16-row reference projection, after generation closes.

The generation process never imports this file or reads the mixed upstream file.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

from project_references import Reader, Sink, ProjectionError, record

SOURCE_SHA256 = "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442"
SOURCE_BYTES = 277383467


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def project(source_path, cohort_manifest_path, generation_result_path, destination):
    source_path, destination = Path(source_path).resolve(), Path(destination).resolve()
    cohort_raw = Path(cohort_manifest_path).read_bytes()
    cohort = json.loads(cohort_raw)
    generation_raw = Path(generation_result_path).read_bytes()
    generation = json.loads(generation_raw)
    ids = cohort["question_ids"]
    if cohort.get("schema_version") != "are.longmemeval-fast-cohort-source/v1" or len(ids) != 16 or len(set(ids)) != 16:
        raise ProjectionError("invalid source-only cohort")
    if generation.get("schema_version") != "are.longmemeval-fast-cohort-paired-result/v1" or generation.get("status") != "completed" or generation.get("completed") != 16 or generation.get("unknown_usage") is not False or generation.get("question_ids") != ids:
        raise ProjectionError("generation not sealed and complete")
    if source_path.stat().st_size != SOURCE_BYTES or source_path.stat().st_mode & 0o222:
        raise ProjectionError("mixed upstream source size or mode drift")
    if destination.exists():
        raise ProjectionError("reference destination exists")
    destination.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".fast16-reference-", dir=destination.parent))
    os.chmod(stage, 0o700)
    selected = {}
    seen = set()
    try:
        with source_path.open("rb") as stream:
            reader = Reader(stream, SOURCE_BYTES)
            reader.expect("[")
            count = 0
            while True:
                count += 1
                if count > 500:
                    raise ProjectionError("source record ceiling exceeded")
                current = stage / "current-reference.json"
                sink = Sink(current, 1024 * 1024, 4 * 1024 * 1024, 0, None)
                try:
                    summary = record(reader, sink)
                finally:
                    sink.close()
                qid = summary["question_id"]
                if qid in seen:
                    raise ProjectionError("duplicate question ID")
                seen.add(qid)
                if qid in ids:
                    target = "reference-" + qid + ".json"
                    current.rename(stage / target)
                    os.chmod(stage / target, 0o400)
                    selected[qid] = {**summary, "path": target, "bytes": sink.size, "sha256": sink.hash.hexdigest()}
                else:
                    current.unlink()
                reader.ws()
                delimiter = reader.get()
                if delimiter == "]":
                    break
                if delimiter != ",":
                    raise ProjectionError("invalid top-level array")
            reader.ws()
            if reader.peek() or count != 500 or reader.count != SOURCE_BYTES or reader.hash.hexdigest() != SOURCE_SHA256:
                raise ProjectionError("pinned upstream source drift")
        if set(selected) != set(ids):
            raise ProjectionError("missing reference")
        manifest = {"schema_version": "are.longmemeval-fast-cohort-references/v1", "status": "verified",
                    "source_sha256": SOURCE_SHA256, "source_bytes": SOURCE_BYTES, "source_records": 500,
                    "cohort_manifest_sha256": digest(cohort_raw), "generation_result_sha256": digest(generation_raw),
                    "question_ids": ids, "selected": [selected[qid] for qid in ids], "reference_values_emitted": False,
                    "generator_reference_access": False, "provider_calls": 0}
        path = stage / "manifest.json"
        with path.open("x", encoding="utf-8") as handle:
            json.dump(manifest, handle, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(path, 0o400)
        stage.rename(destination)
        return {"status": "verified", "references": len(ids), "manifest_sha256": digest((destination / "manifest.json").read_bytes())}
    finally:
        if stage.exists():
            shutil.rmtree(stage)


if __name__ == "__main__":
    if len(sys.argv) != 5:
        raise SystemExit("usage: fast-cohort-reference-project-v1.py UPSTREAM_JSON COHORT_MANIFEST GENERATION_RESULT NEW_REFERENCE_DIR")
    print(json.dumps(project(*sys.argv[1:])))
