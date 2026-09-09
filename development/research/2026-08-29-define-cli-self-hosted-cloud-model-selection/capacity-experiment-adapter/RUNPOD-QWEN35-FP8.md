# RunPod Qwen3.5 FP8 experiment template

This is a candidate-local benchmark template, not a production deployment.

## Template fields

- Container image: `pasterfild/qwen3.5-35b-a3b-fp8-vllm@sha256:7fdd5424d42f9f181c8e3d9994db43966c2106293e2b895f8c8b485ab15adbe0`
- GPU: one H200
- Container disk: 50 GB
- Network volume: 60 GB when empty; when preserving the observed 35 GB legacy
  model directory, use at least 100 GB and prefer 120 GB so detailed benchmark
  evidence has headroom
- Volume mount: `/workspace`
- TCP ports: `22`
- HTTP ports: none; do not expose port 8000
- Docker entrypoint: `/bin/bash`
- Docker start command:

  ```text
  -lc 'set -e; apt-get update; DEBIAN_FRONTEND=noninteractive apt-get install -y openssh-server; install -d -m 700 /root/.ssh; printf "%s\n" "$PUBLIC_KEY" > /root/.ssh/authorized_keys; chmod 600 /root/.ssh/authorized_keys; ssh-keygen -A; /usr/sbin/sshd; exec sleep infinity'
  ```

Overriding the entrypoint is required. The community image otherwise downloads
an unpinned model revision and starts its own vLLM server before the governed
runner can capture identities. The replacement command must also start `sshd`;
exposing TCP port 22 does not create an SSH service inside a custom container.

## Environment

```text
HF_HOME=/workspace/huggingface
HF_HUB_ENABLE_HF_TRANSFER=1
HF_XET_HIGH_PERFORMANCE=1
PYTHONDONTWRITEBYTECODE=1
```

Do not add an inference API key or Hugging Face token for this public model.

## After RunPod supplies SSH

From the repository root, build and copy the central-workspace binary and the
two scripts:

```bash
cargo build --release -p capacity-curve
scp -P <port> -i ~/.ssh/id_ed25519 \
  target/release/capacity-curve \
  cyberAlchemy-v2/development/research/2026-08-29-define-cli-self-hosted-cloud-model-selection/capacity-experiment-adapter/scripts/bootstrap-qwen35-fp8.sh \
  cyberAlchemy-v2/development/research/2026-08-29-define-cli-self-hosted-cloud-model-selection/capacity-experiment-adapter/scripts/run-vllm-32k.sh \
  root@<host>:/workspace/define-capacity/
```

On the pod:

```bash
chmod 755 /workspace/define-capacity/{capacity-curve,bootstrap-qwen35-fp8.sh,run-vllm-32k.sh}
/workspace/define-capacity/bootstrap-qwen35-fp8.sh
source /workspace/models/Qwen__Qwen3.5-35B-A3B-FP8/experiment.env
OUTPUT_ROOT=/workspace/define-capacity/raw-qwen35-fp8 \
  RUN_PREFIX_CACHE=0 \
  /workspace/define-capacity/run-vllm-32k.sh
```

Do not run the cached lane in the first experiment. Its cache-counter delta
contract is not implemented yet.
