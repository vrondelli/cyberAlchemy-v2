#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
project_dir=$(dirname -- "$script_dir")
repository_dir=$(CDPATH= cd -- "$project_dir/../.." && pwd)
probe_dir=$(mktemp -d /tmp/are-seccomp-probe.XXXXXX)
trap 'rm -rf -- "$probe_dir"' EXIT HUP INT TERM

"$repository_dir/tools/toolchain/run" gcc -static -O2 -Wall -Wextra -Werror \
  -o "$probe_dir/probe" "$project_dir/deploy/seccomp-probe.c"

docker run --rm \
  --user 65532:65532 \
  --read-only \
  --cap-drop ALL \
  --security-opt no-new-privileges:true \
  --security-opt "seccomp=$project_dir/deploy/seccomp-node.json" \
  -v "$probe_dir/probe:/probe:ro" \
  --entrypoint /probe \
  "${ARE_SECCOMP_PROBE_IMAGE:-are-public-chat:security-candidate}"
