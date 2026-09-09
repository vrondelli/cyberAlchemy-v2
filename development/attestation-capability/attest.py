#!/usr/bin/env python3
"""Attestation capability — L1 integrity-seal (attest + verify).

INTERNAL / moat-adjacent. cite-results-withhold-mechanism: the verdicts this
produces are demonstrable; this mechanism file stays private (never copy to
public arcanum/). L2 external-signature is NOT implemented here (deferred-moat).

Contract (per SKILL.md):
  attest(governance-act) -> AttestationArtifact{header, artifact_sha256, seal}
  verify(artifact, claimed_state) -> valid | tampered
verify is decidable + total and recomputes from the CLAIMED state (it never
trusts a state copy carried by the artifact). Soundness: valid => the claimed
canonical state == the attested canonical state (no false valid, modulo SHA-256).
"""
import sys, json, hashlib

CANON_VERSION = "attest.canon.v1"

def canonicalize(raw: bytes) -> bytes:
    # Frozen v1 rule: utf-8, strip per-line trailing whitespace, LF newlines,
    # exactly one trailing newline. Deterministic: "the same artifact" always
    # canonicalizes identically, so attest and verify agree by construction.
    text = raw.decode("utf-8")
    lines = [ln.rstrip() for ln in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    return ("\n".join(lines).rstrip("\n") + "\n").encode("utf-8")

def _sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _seal(header: dict, artifact_sha256: str) -> str:
    tuple_obj = {"header": header, "artifact_sha256": artifact_sha256}
    serialized = json.dumps(tuple_obj, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return _sha(CANON_VERSION.encode("utf-8") + b"\x00" + serialized)

def attest(path: str, actor: str, kind: str, act_id: str, timestamp: str) -> dict:
    with open(path, "rb") as f:
        artifact_sha256 = _sha(canonicalize(f.read()))
    header = {"actor": actor, "act": {"kind": kind, "id": act_id},
              "timestamp": timestamp, "canon_version": CANON_VERSION}
    return {"header": header, "artifact_sha256": artifact_sha256, "seal": _seal(header, artifact_sha256)}

def verify(artifact: dict, claimed_path: str) -> str:
    # Independently recompute from the CLAIMED state under the artifact's own
    # frozen canon_version; rebuild the seal and compare. Total -> one verdict.
    header = artifact["header"]
    if header.get("canon_version") != CANON_VERSION:
        return "tampered"  # canon rule mismatch -> cannot vouch
    with open(claimed_path, "rb") as f:
        claimed_sha = _sha(canonicalize(f.read()))
    recomputed_seal = _seal(header, claimed_sha)
    return "valid" if (recomputed_seal == artifact.get("seal")
                       and claimed_sha == artifact.get("artifact_sha256")) else "tampered"

def _usage():
    print("usage: attest.py attest <file> --actor A --kind K --id I --timestamp T", file=sys.stderr)
    print("       attest.py verify <attestation.json> <claimed_file>", file=sys.stderr)
    sys.exit(2)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        _usage()
    cmd = sys.argv[1]
    if cmd == "attest":
        path = sys.argv[2]; opts = {}
        a = sys.argv[3:]
        for i in range(0, len(a), 2):
            opts[a[i].lstrip("-")] = a[i + 1]
        art = attest(path, opts["actor"], opts["kind"], opts["id"], opts["timestamp"])
        print(json.dumps(art, indent=2))
    elif cmd == "verify":
        with open(sys.argv[2]) as f:
            art = json.load(f)
        print(verify(art, sys.argv[3]))
    else:
        _usage()
