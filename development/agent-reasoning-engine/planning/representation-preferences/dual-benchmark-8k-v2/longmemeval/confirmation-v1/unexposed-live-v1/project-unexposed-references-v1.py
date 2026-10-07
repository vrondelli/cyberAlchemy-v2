#!/usr/bin/env python3
"""Create-once, post-seal evaluator reference projection. Never prints values."""
import argparse, hashlib, json, os, stat, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from project_references import project_stream, SOURCE_BYTES, SOURCE_SHA256  # noqa: E402
import project_references  # noqa: E402
import project_stream as parser_module  # noqa: E402

IDS = ("0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs")
SEAL_SHA256 = "03528b41d2d4c956fd4b2425d58e36258b76fd7dc4870b4953e75b06a007e1c2"
SEAL_SCHEMA = "are.longmemeval-unexposed-recovery-composite-seal/v1"

def digest(path):
    h = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""): h.update(chunk)
    return h.hexdigest()

def exclusive_json(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o400)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as out:
            json.dump(value, out, separators=(",", ":")); out.write("\n"); out.flush(); os.fsync(out.fileno())
    except Exception:
        try: os.close(fd)
        except OSError: pass
        raise

def project(source, destination, seal, *, expected_source_sha256=SOURCE_SHA256,
            expected_source_bytes=SOURCE_BYTES, expected_records=500,
            expected_seal_sha256=SEAL_SHA256, require_read_only=True):
    source, destination, seal = map(lambda p: Path(p).resolve(), (source, destination, seal))
    destination.parent.mkdir(parents=True, exist_ok=True)
    started = destination.with_name(destination.name + ".attempt-started.json")
    completed = destination.with_name(destination.name + ".attempt-completed.json")
    failed = destination.with_name(destination.name + ".attempt-failed.json")
    if destination.exists() or started.exists() or completed.exists() or failed.exists(): raise RuntimeError("projection destination or attempt already exists")
    source_stat, seal_stat = source.lstat(), seal.lstat()
    if not stat.S_ISREG(source_stat.st_mode) or source.is_symlink() or source_stat.st_size != expected_source_bytes: raise RuntimeError("source identity invalid")
    if require_read_only and source_stat.st_mode & 0o222: raise RuntimeError("source must be read-only")
    if not stat.S_ISREG(seal_stat.st_mode) or seal.is_symlink() or digest(seal) != expected_seal_sha256: raise RuntimeError("recovery seal bytes invalid")
    seal_value = json.loads(seal.read_bytes())
    if seal_value.get("schema_version") != SEAL_SCHEMA or seal_value.get("terminal") is not True or seal_value.get("status") != "completed" or seal_value.get("evaluator_reference_access") is not False: raise RuntimeError("recovery seal state invalid")
    start = {"schema_version":"are.longmemeval-unexposed-reference-projection-attempt/v1","status":"started","source":str(source),"destination":str(destination),"recovery_seal":str(seal),"recovery_seal_sha256":expected_seal_sha256,"automatic_retries":0,"generator_reference_access":False,"authority_effect":"evaluator-only"}
    exclusive_json(started, start)
    staging = Path(tempfile.mkdtemp(prefix=".unexposed-reference-projection-", dir=destination.parent))
    try:
        with open(source, "rb") as stream:
            receipt = project_stream(stream, staging / "references", expected_sha256=expected_source_sha256, expected_bytes=expected_source_bytes, expected_records=expected_records, question_ids=IDS)
        if digest(source) != expected_source_sha256 or digest(seal) != expected_seal_sha256: raise RuntimeError("source changed during projection")
        refs = staging / "references"; reference_receipt = refs / "reference-acquisition.json"
        files = []
        for selected in receipt["selected"]:
            path = refs / selected["path"]
            if digest(path) != selected["sha256"]: raise RuntimeError("projected reference drift")
            files.append({"question_id":selected["question_id"],"path":selected["path"],"bytes":selected["bytes"],"sha256":selected["sha256"],"answer_json_type":selected["answer_json_type"]})
        projection = {"schema_version":"are.longmemeval-unexposed-offline-reference-projection/v1","status":"verified","source":{"path":str(source),"bytes":expected_source_bytes,"sha256":expected_source_sha256,"records":expected_records,"read_only":not bool(source_stat.st_mode & 0o222)},"destination":str(destination),"recovery_seal":{"path":str(seal),"sha256":expected_seal_sha256},"bindings":{"wrapper_sha256":digest(__file__),"projector_sha256":digest(project_references.__file__),"parser_sha256":digest(parser_module.__file__),"reference_receipt_sha256":digest(reference_receipt),"reference_files":files},"question_ids":list(IDS),"provider_calls":0,"judge_calls":0,"automatic_retries":0,"generator_reference_access":False,"reference_values_emitted":False,"authority_effect":"evaluator-only"}
        exclusive_json(refs / "PROJECTION-RECEIPT.json", projection)
        for item in refs.iterdir(): os.chmod(item, 0o400)
        refs.rename(destination); os.chmod(destination, 0o500)
        exclusive_json(completed, {**start,"status":"completed","projection_receipt_sha256":digest(destination / "PROJECTION-RECEIPT.json"),"reference_receipt_sha256":projection["bindings"]["reference_receipt_sha256"]})
        return projection
    except Exception as error:
        exclusive_json(failed, {**start,"status":"failed","failure_type":type(error).__name__})
        raise
    finally:
        if staging.exists():
            import shutil; shutil.rmtree(staging)

def main():
    parser = argparse.ArgumentParser(); parser.add_argument("source"); parser.add_argument("destination"); parser.add_argument("recovery_seal")
    args = parser.parse_args(); result = project(args.source, args.destination, args.recovery_seal)
    print(json.dumps({"status":result["status"],"projection_receipt":str(Path(args.destination).resolve()/"PROJECTION-RECEIPT.json"),"provider_calls":0,"judge_calls":0}))

if __name__ == "__main__": main()
