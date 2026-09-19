#!/usr/bin/env python3
"""Compile each Auth source graph twice and compare the exact persisted scaffold."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[4]
IMPL = HERE.parents[2] / "implementation"
CLI = HERE / "compiler-snapshot"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--materialize", action="store_true")
    args = parser.parse_args()
    results = []
    with tempfile.TemporaryDirectory(prefix="auth-graph-replay-") as directory:
        for source in ("operation-source", "command-boundary-source", "trusted-input-source"):
            runs = []
            for repetition in range(2):
                output = Path(directory) / f"{source}-{repetition}.json"
                result = subprocess.run([
                    os.environ.get("DOMAINSPEC_NODE", shutil.which("node")), "--import", str(CLI / "node_modules/tsx/dist/loader.mjs"),
                    "--input-type=module", "-e",
                    "import fs from 'node:fs'; "
                    "import { compileProject } from " + json.dumps((CLI / "src/compilation/certificate.ts").as_uri()) + "; "
                    "const compiled = compileProject(process.argv[1]); "
                    "const system_ontology = {schema_version: 'auth-system-ontology-projection/v1-candidate', "
                    "nodes: compiled.graph.nodes, relationships: compiled.graph.relationships, "
                    "authority_effect: 'none', open_questions_ref: '../README.md'}; "
                    "fs.writeFileSync(process.argv[2], JSON.stringify({...compiled, system_ontology}, null, 2) + '\\n');",
                    str(IMPL / source), str(output),
                ], cwd=REPO, capture_output=True, text=True, timeout=120)
                if result.returncode != 0:
                    raise RuntimeError(result.stdout + result.stderr)
                runs.append(output.read_bytes())
            if runs[0] != runs[1]:
                raise ValueError("nondeterministic Auth graph:" + source)
            destination = HERE / "graph-scaffolds" / f"{source}.json"
            if args.materialize:
                destination.parent.mkdir(exist_ok=True)
                destination.write_bytes(runs[0])
            elif destination.read_bytes() != runs[0]:
                raise ValueError("Auth graph scaffold drift:" + source)
            results.append({"source": source, "runs": 2, "sha256": hashlib.sha256(runs[0]).hexdigest(), "status": "pass"})
    print(json.dumps({"status": "pass", "graphs": results}, sort_keys=True))


if __name__ == "__main__":
    main()
