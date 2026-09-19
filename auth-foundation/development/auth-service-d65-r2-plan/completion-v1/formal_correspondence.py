#!/usr/bin/env python3
"""Check Auth source-to-Rust type correspondence and finite Lean projection equality."""

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
NODES = IMPL / "operation-source/specs/auth-exact-permission/nodes"
RUST = IMPL / "standard-runtime"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def typename(name):
    return "".join(part.capitalize() for part in name.split("-"))


def rusttype(value):
    kind = value["kind"]
    if kind == "scalar":
        return {"String": "String", "Bool": "bool", "UInt64": "u64"}[value["name"]]
    if kind == "named":
        feature, name = value["selector"].split(":")
        if feature != "auth-exact-permission":
            raise ValueError("wrong-domain type selector")
        return "kernel::" + typename(name)
    if kind in {"list", "set"}:
        return {"list": "Vec", "set": "std::collections::BTreeSet"}[kind] + "<" + rusttype(value["element"]) + ">"
    raise ValueError("unsupported Auth type")


def source_projection():
    expected = {"properties": [], "variants": [], "rules": []}
    assertions = []
    sources = []
    for path in sorted(NODES.glob("*.json")):
        data = path.read_bytes()
        node = json.loads(data)
        if node["feature_id"] != "auth-exact-permission":
            raise ValueError("wrong-domain source")
        sources.append({"path": str(path.relative_to(REPO)), "sha256": sha(data)})
        contract = node["body"]["typed_contract"]
        name = typename(node["node_id"])
        if contract["schema_version"] == "domainspec.typed-record/v1":
            fields = contract["properties"]
            checks = []
            for field in fields:
                expected["properties"].append([field["ontology_property"], name + "::" + field["name"]])
                checks.append(f"let _: {rusttype(field['type'])} = {field['name']};")
            assertions.append(f"#[allow(dead_code)] fn check_{node['node_id'].replace('-', '_')}(value: kernel::{name}) {{ let kernel::{name} {{ {', '.join(p['name'] for p in fields)} }} = value; {' '.join(checks)} }}")
        elif contract["schema_version"] == "domainspec.typed-sum/v1":
            arms = []
            for variant in contract["variants"]:
                expected["variants"].append([variant["ontology_variant"], name + "::" + variant["name"]])
                selector = f"kernel::{name}::{variant['name']}"
                if variant["payload"] is None:
                    arms.append(selector + " => {}")
                else:
                    arms.append(selector + f"(value) => {{ let _: {rusttype(variant['payload'])} = value; }}")
            assertions.append(f"#[allow(dead_code)] fn check_{node['node_id'].replace('-', '_')}(value: kernel::{name}) {{ match value {{ {', '.join(arms)} }} }}")
        elif contract["schema_version"] == "domainspec.typed-rule/v1":
            function = node["node_id"].replace("-", "_")
            expected["rules"].append([contract["ontology_rule"], f"auth-exact-permission:{node['node_id']}"])
            arguments = ", ".join("&" + rusttype(p["type"]) for p in contract["parameters"])
            assertions.append(f"const _: fn({arguments}) -> bool = kernel::{function};")
    return {key: sorted(value) for key, value in expected.items()}, assertions, sources


def run(command, cwd, env):
    result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, timeout=300)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


def lean_list(rows):
    return "[" + ", ".join("(" + ", ".join(json.dumps(item) for item in row) + ")" for row in rows) + "]"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    expected, assertions, source_refs = source_projection()
    rust_refs = [{"path": str(p.relative_to(REPO)), "sha256": sha(p.read_bytes())} for p in sorted(RUST.rglob("*.rs"))]
    program = '\n'.join(assertions) + '\nfn main() { println!("{}", serde_json::json!({"properties":kernel::DOMAINSPEC_PROPERTY_BINDINGS,"variants":kernel::DOMAINSPEC_VARIANT_BINDINGS,"rules":kernel::DOMAINSPEC_RULE_SELECTORS})); }\n'
    with tempfile.TemporaryDirectory(prefix="auth-rust-correspondence-") as directory:
        root = Path(directory)
        (root / "src").mkdir()
        (root / "src/main.rs").write_text(program)
        (root / "Cargo.toml").write_text('[package]\nname="auth-rust-projection-check"\nversion="0.0.0"\nedition="2024"\n[workspace]\n[dependencies]\nserde_json="=1.0.151"\nkernel={package="auth-foundation-operation-auth-exact-permission-authorize",path=' + json.dumps(str(RUST)) + '}\n')
        env = {**os.environ}
        env.setdefault("CARGO_TARGET_DIR", str(root / "target"))
        # The disposable harness has its own resolved lock; Auth's locked crates
        # and generated manifests are never modified by this check.
        run(["cargo", "generate-lockfile", "--offline"], root, env)
        actual = json.loads(run(["cargo", "run", "--locked", "--offline", "--quiet"], root, env))
        actual = {key: sorted(value) for key, value in actual.items()}
        if set(actual) != set(expected) or any(not rows for rows in expected.values()):
            raise ValueError("projection denominator mismatch")
        proof = "namespace AuthFoundation.RustProjection\n"
        for key in expected:
            proof += f"def source_{key} : List (String × String) := {lean_list(expected[key])}\n"
            proof += f"def rust_{key} : List (String × String) := {lean_list(actual[key])}\n"
            proof += f"theorem {key}_correspond : rust_{key} = source_{key} := by decide\n"
        proof += "end AuthFoundation.RustProjection\n"
        (root / "AuthRustProjection.lean").write_text(proof)
        run(["lean", "AuthRustProjection.lean"], root, env)
        if expected != actual:
            raise ValueError("Rust projection differs from authored source")
        # A wrong-domain/changed projection must make the same proof fail.
        bad = proof.replace('"AUTH-PERMISSION#resource"', '"WRONG-DOMAIN#resource"', 1)
        if bad == proof:
            raise ValueError("negative proof anchor missing")
        (root / "WrongDomain.lean").write_text(bad)
        negative = subprocess.run(["lean", "WrongDomain.lean"], cwd=root, env=env, text=True, capture_output=True, timeout=300)
        if negative.returncode == 0 or "decide" not in negative.stdout + negative.stderr:
            raise ValueError("wrong-domain projection was not rejected by Lean equality proof")
        if source_refs != source_projection()[2] or any(sha((REPO / ref["path"]).read_bytes()) != ref["sha256"] for ref in rust_refs):
            raise ValueError("sources changed during correspondence check")
        result = {
            "schema_version": "auth-rust-structural-correspondence/v1",
            "status": "pass", "source_refs": source_refs, "rust_refs": rust_refs,
            "property_count": len(expected["properties"]), "variant_count": len(expected["variants"]), "rule_count": len(expected["rules"]),
            "rust_type_checks": "all-record-fields-exhaustive-sum-variants-and-rule-signatures",
            "projection": actual, "harness_sha256": sha(program.encode()),
            "lean_statement_sha256": sha(proof.encode()), "wrong_domain_control": "rejected-by-lean",
            "runner_sha256": sha(Path(__file__).read_bytes()),
            "harness_lock_sha256": sha((root / "Cargo.lock").read_bytes()),
            "authority_effect": "none",
            "claim_ceiling": "Auth-specific finite source/Rust structural correspondence only. This does not prove universal compiler correctness or runtime authorization semantics; policy proofs and service behavior tests remain separate evidence.",
        }
        if args.write:
            (HERE / "AuthRustProjection.lean").write_text(proof)
            (HERE / "rust-projection-harness.rs").write_text(program)
            shutil.copyfile(root / "Cargo.lock", HERE / "formal-harness.Cargo.lock")
            (HERE / "RUST-CORRESPONDENCE.json").write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
        else:
            if (HERE / "AuthRustProjection.lean").read_text() != proof or (HERE / "rust-projection-harness.rs").read_text() != program:
                raise ValueError("saved formal projection drift")
            if (HERE / "formal-harness.Cargo.lock").read_bytes() != (root / "Cargo.lock").read_bytes():
                raise ValueError("formal harness lock drift")
        print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
