#!/usr/bin/env bash
set -euo pipefail

MODEL_REPO="${MODEL_REPO:-Qwen/Qwen3.5-35B-A3B-FP8}"
MODEL_REVISION="${MODEL_REVISION:-9d1823d2dee688a6b25e77009dc727688c44936e}"
MODEL_PATH="${MODEL_PATH:-/workspace/models/Qwen__Qwen3.5-35B-A3B-FP8}"
CAPACITY_CURVE_BIN="${CAPACITY_CURVE_BIN:-/workspace/define-capacity/capacity-curve}"

if [[ ! -x "$CAPACITY_CURVE_BIN" ]]; then
  echo "capacity-curve binary is missing: $CAPACITY_CURVE_BIN" >&2
  exit 2
fi
mkdir -p "$MODEL_PATH"
python3 - "$MODEL_REPO" "$MODEL_REVISION" "$MODEL_PATH" <<'PY'
from huggingface_hub import snapshot_download
import sys
snapshot_download(repo_id=sys.argv[1], revision=sys.argv[2], local_dir=sys.argv[3])
PY

python3 - "$MODEL_PATH" "$MODEL_REPO" <<'PY'
import hashlib, json, pathlib, sys
root = pathlib.Path(sys.argv[1])
repo = sys.argv[2]
def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()
weights = []
for path in sorted(root.glob("*.safetensors")):
    weights.append({"path": path.name, "bytes": path.stat().st_size, "sha256": digest(path)})
if not weights:
    raise SystemExit("no safetensors weights found")
tokenizer_names = {
    "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json",
    "added_tokens.json", "vocab.json", "merges.txt", "chat_template.jinja",
}
tokenizer = []
for path in sorted(root.iterdir()):
    if path.is_file() and path.name in tokenizer_names:
        tokenizer.append({"path": path.name, "bytes": path.stat().st_size, "sha256": digest(path)})
tokenizer_bytes = json.dumps(tokenizer, sort_keys=True, separators=(",", ":")).encode()
manifest = {
    "repo": repo,
    "source_url": "https://huggingface.co/" + repo,
    "license_id": "Apache-2.0",
    "checkpoint_quantization": "fp8",
    "total_weight_bytes": sum(item["bytes"] for item in weights),
    "files": weights,
    "tokenizer_sha256": hashlib.sha256(tokenizer_bytes).hexdigest(),
}
chat = root / "chat_template.jinja"
if chat.is_file():
    manifest["chat_template_sha256"] = digest(chat)
(root / "tokenizer-artifacts.json").write_text(json.dumps(tokenizer, indent=2, sort_keys=True) + "\n")
(root / "artifacts.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
PY

"$CAPACITY_CURVE_BIN" model import \
  --config "$MODEL_PATH/config.json" \
  --artifacts "$MODEL_PATH/artifacts.json" \
  --revision "$MODEL_REVISION" \
  --out "$MODEL_PATH/model-profile.json"

python3 - "$MODEL_PATH" "$MODEL_REVISION" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
revision = sys.argv[2]
profile = json.loads((root / "model-profile.json").read_text())
artifacts = json.loads((root / "artifacts.json").read_text())
values = {
    "MODEL_PATH": str(root),
    "MODEL_REVISION": revision,
    "MODEL_PROFILE_ID": profile["profile_id"],
    "WEIGHTS_ARTIFACT_BYTES": artifacts["total_weight_bytes"],
    "TOKENIZER_DIGEST": artifacts["tokenizer_sha256"],
    "IMAGE_CONFIG_DIGEST": "6222a6c3c548eef038a9ad3424cec1175f5fe6dcdb44c9663ad4a6acec610c0e",
    "IMAGE_MANIFEST_DIGEST": "7fdd5424d42f9f181c8e3d9994db43966c2106293e2b895f8c8b485ab15adbe0",
}
with (root / "experiment.env").open("w") as handle:
    for key, value in values.items():
        handle.write(f"export {key}={value}\n")
print(root / "experiment.env")
PY
