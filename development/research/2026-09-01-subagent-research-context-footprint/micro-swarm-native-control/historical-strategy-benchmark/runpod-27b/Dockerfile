ARG VLLM_IMAGE=vllm/vllm-openai:latest
FROM ${VLLM_IMAGE}
ARG VLLM_IMAGE

WORKDIR /opt/experiment

COPY experiment.json ./experiment.json
COPY run_experiment.py summarize_run.py structured_agent.py ./
COPY schemas ./schemas
COPY runpod-start.sh pod-bootstrap.sh agent.sh ./
COPY build/workload.json ./workload.json

RUN test -s workload.json \
    && python3 -c "import jsonschema" \
    && chmod 0755 runpod-start.sh pod-bootstrap.sh agent.sh structured_agent.py

ENV MODEL_ID=Qwen/Qwen3.8-27B-FP8 \
    BASE_VLLM_IMAGE=${VLLM_IMAGE} \
    SERVED_MODEL_NAME=qwen-27b-microshard \
    MAX_MODEL_LEN=16384 \
    MAX_NUM_SEQS=32 \
    GPU_MEMORY_UTILIZATION=0.90 \
    KV_CACHE_DTYPE=auto \
    REASONING_EFFORT=medium \
    REQUEST_TIMEOUT_SECONDS=240 \
    GLOBAL_DEADLINE_SECONDS=300 \
    MAX_OUTPUT_TOKENS_EXTRACTOR=3600 \
    MAX_OUTPUT_TOKENS_REDUCER=6000 \
    MAX_OUTPUT_TOKENS_SYNTHESIZER=5000 \
    MAX_OUTPUT_TOKENS_JUDGE=4096 \
    HF_HOME=/workspace/rwo/hf-cache \
    RESULTS_ROOT=/workspace/rwo/results \
    API_BASES=http://127.0.0.1:8000/v1,http://127.0.0.1:8002/v1 \
    API_BASE_STRATEGY=round-robin \
    API_BASE_COUNTER_FILE=/tmp/cav2-rwo-api-base.counter \
    VLLM_USE_FLASHINFER_SAMPLER=0 \
    MAX_NUM_SEQS_PER_REPLICA=16

ENTRYPOINT ["/opt/experiment/pod-bootstrap.sh"]
