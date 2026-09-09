# Verbatim Explorer Returns

## Agent 1 — Shannon, Claude

Explorer report — static accounting only (no runtime/throughput inference)

Inputs (all ASCII, therefore UTF-8 bytes = Unicode character count):

| input | selector | exact bytes/chars |
|---|---|---:|
| `cyberAlchemy-v2/development/research/2026-09-01-subagent-research-context-footprint/strategy-inventory-packet.json` | `$`; accounting basis `$.selected_matches[0]`, `$.unresolved_gaps`, `$.design_consequences`, `$.non_authority_notice` | 4,957 |
| `cyberAlchemy-v2/development/research/2026-08-29-define-cli-self-hosted-cloud-model-selection/dispatch-sheet.json` | `$`; especially `$.groups[].agents[]`, `$.connections`, `$.max_loops` | 15,912 |
| `cyberAlchemy-v2/development/research/2026-09-01-subagent-research-context-footprint/dispatch-sheet.json` | `$`; especially `$.groups[].agents[]`, `$.connections`, `$.max_loops` | 13,796 |

The packet explicitly says Inventory is discovery-only, exact runtime receipts are absent, hidden system/tool context is unknown, and `token_budget` is not runtime-enforced (`...strategy-inventory-packet.json:$.unresolved_gaps`, `$.non_authority_notice`).

### Extracted static fixture

`P` is the sum of each `.initial_prompt` length. This is exact persisted prompt text, excluding orchestrator-added system/developer/tool context.

| dispatch | agents | `P` chars | `B=Σ token_budget` | prompt estimate `P/4` |
|---|---:|---:|---:|---:|
| 2026-08-29 Define | 9 | 7,270 | 20,000 | 1,817.50 |
| 2026-09-01 footprint | 9 | 5,539 | 14,600 | 1,384.75 |

Tokenizer estimate is only a parameterized approximation: `T_prompt ≈ P/k`, with `k ∈ {3,4,5}` chars/token. Thus old prompt total is approximately 1,454–2,423 tokens; current is 1,108–1,846. Exact tokenizer output is unknown.

Group totals for the old fixture:

```text
explorers   n=3  prompt_chars=2784  budget=7000
synth       n=1  prompt_chars=922   budget=3200
skeptics    n=3  prompt_chars=1892  budget=4900
writer      n=1  prompt_chars=946   budget=2800
auditor     n=1  prompt_chars=726   budget=2100
```

Current sheet:

```text
explorers   n=3  prompt_chars=2193  budget=5400
synth       n=1  prompt_chars=623   budget=2400
skeptics    n=3  prompt_chars=1501  budget=3600
writer      n=1  prompt_chars=647   budget=2000
auditor     n=1  prompt_chars=575   budget=1200
```

### Base dependency-flow model

For each edge `e`, let `F_e` be fan-out, `B_src` the declared source budget, and `m_e` the number of traversals. Maximum declared handoff is:

```text
H_max = Σ_e (m_e × F_e × B_src)
H_min = 0
A_input = T_prompt + H
```

`H_min=0` is a mathematical lower bound because no minimum output is declared; successful research likely requires positive returns, but that value is unknown.

Nominal one-pass edges (`m=1`) are:

```text
explorers → synthesizer: 1 × 7000
synthesizer → skeptics: 3 × 3200 (old) / 3 × 2400 (current)
skeptics → writer:      1 × 4900 / 3600
writer → auditor:       1 × 2800 / 2000
```

| dispatch | handoffs min..max | aggregate visible input min..max (`P/4 + H`) |
|---|---:|---:|
| old | 0..24,300 | 1,817.50..26,117.50 |
| current | 0..18,200 | 1,384.75..19,584.75 |

Maximum upstream handoff into one call (old/current):

```text
synthesizer: 7000 / 5400
each skeptic: 3200 / 2400
writer:      4900 / 3600
auditor:     2800 / 2000
explorer:       0 / 0
```

Peak visible input is the synthesizer call:

```text
old:     922/4 + 7000 = 7,230.50 estimated tokens
current: 623/4 + 5400 = 5,555.75 estimated tokens
```

If a provider counts declared output in context processing, add that call’s `B`: old synthesizer envelope `10,430.50`; current `7,955.75`. Hidden context is not included.

Declared output is separate: nominal old `20,000`, current `14,600`; actual output may be lower, higher if budgets are unenforced, truncated, or otherwise provider-controlled. Actual usage, cached input, reasoning tokens, and hidden schemas are unknown.

### Loop/revision amplification

Represent loop semantics with independent traversal indicators:

```text
z     = extra synthesizer→skeptics zig-zag traversal (0..1)
f_SE  = synthesizer→explorers feedback/revision traversal (0..1)
f_AW  = auditor→writer feedback/revision traversal (0..1)
L     = whole-dispatch multiplier, if max_loops means complete retries
       (conditional assumption: L = 1 + max_loops)
```

Old edge-hand-off formula:

```text
H_old = 7000
      + 9600(1+z)       # synthesizer→3 skeptics
      + 4900
      + 2800
      + 9600 f_SE       # synthesizer→3 explorers feedback
      + 2100 f_AW       # auditor→writer feedback
```

Current:

```text
H_current = 5400 + 7200(1+z) + 3600 + 2000
          + 7200 f_SE + 1200 f_AW
```

With all optional edge loops once (`z=f_SE=f_AW=1`), handoffs are old `36,000` (1.481× base) and current `26,600` (1.462× base). If `max_loops` additionally means whole-pass retry, conditional upper envelopes are old `3×36,000=108,000` (`max_loops=2`) and current `2×26,600=53,200` (`max_loops=1`). These are not asserted runtime semantics; the sheets do not define zig-zag/revision call traces.

Machine-readable implementation specification:

```text
for each agent call:
  prompt_chars = len(initial_prompt)
  prompt_est = prompt_chars / tokenizer_chars_per_token
  upstream_declared = sum(edge_traversal_count * fanout * source_budget)
  visible_input_est = prompt_est + upstream_declared
  actual = unknown unless runtime receipt exists
```

No throughput, wall-clock, quality parity, KV-cache capacity, or five-minute completion claim follows from these static counts.

## Agent 2 — Hewitt, Carl

## Explorer report — native runtime accounting

### Observed facts

1. **Repository receipts are planning/registration evidence, not usage evidence.** The dispatch is registered with nine scheduled agents and a three-agent explorer wave, but preconfirmation recorded `spawn_attempt_count: 0`; its declared temporary close receipt does not yet exist.  
   Evidence: `dispatch-sheet.json:11-45`; `preconfirmation-closure.json:13-17`; `telemetry/agents/subagents-dispatch.yaml:7350-7372`.

2. **A local native JSONL receipt does expose actual per-call usage.** For this Sol child’s first model call:

```text
input_tokens             24,229
cached_input_tokens      23,296
cache_write_input_tokens      0
output_tokens               330
reasoning_output_tokens     115
total_tokens             24,559
model_context_window    258,400
```

`total_tokens = input_tokens + output_tokens`; therefore reasoning is a reported output subdivision, not an additional quantity to add.  
Evidence: `/home/vrondelli/.codex/sessions/2026/09/01/rollout-2026-09-01T08-14-28-01a05bd1-c309-7aa3-8c40-dc6286dc888d.jsonl:18`, selector `$.payload.info`.

3. **What this `fork_turns:"none"` child still received:**

| category | observed representation |
|---|---|
| Parent conversation turns | Absent |
| Platform/base instructions | `session_meta.base_instructions.text`, 17,766 UTF-8 bytes |
| Managed developer overlays | Three developer messages totalling 42,202 visible bytes |
| AGENTS instructions | User-context item, 5,907 bytes |
| Plugin inventory | User-context item, 3,296 bytes |
| Environment context | User-context item, 407 bytes |
| Task briefing | `agent_message`; 91-byte plaintext routing header plus encrypted persisted payload; decrypted briefing was model-visible |
| Tool schemas | Semantically available to the model, but not serialized as a separately measurable receipt field |
| Retrieved bytes | Persisted as `custom_tool_call_output`; included in later calls, with no token-category attribution |
| Upstream returns | No special category; when sent/followed up they become message context |
| Cached input | Explicit per-call and cumulative token fields |
| Reasoning | Token count exposed; reasoning contents remain opaque/encrypted |
| Output | Per-call and cumulative token count exposed |

Evidence: same JSONL, selectors `session_meta`, initial `response_item[message]`, `agent_message`, `custom_tool_call_output`, and `event_msg[token_count]`.

4. **The parent spawn receipt confirms `fork_turns:"none"`, Sol, and high effort.**  
   Evidence: `/home/vrondelli/.codex/sessions/2026/09/01/rollout-2026-09-01T06-53-32-01a05b87-aab6-7270-ad6c-d23a6c8d0525.jsonl:894`, `spawn_agent.arguments`.

### Fork behavior

Host-contract facts, separate from repository evidence:

- `none`: excludes surrounding parent turns but retains independently injected platform/developer instructions, workspace AGENTS/environment context, tool availability, and the explicit task.
- `all` or omitted: adds the full surrounding parent history. It inherits parent model and reasoning effort; model/effort overrides are unavailable.
- Positive `N`: adds only the most recent `N` turns and permits model/effort overrides.
- Consequently, `none` reduces only forked conversational history. It does **not** imply a small prompt or remove fixed runtime context.

### Concurrency bound

The native host contract provides four total collaboration slots, including the root: maximum concurrent children = `4 - 1 = 3`. A live roster showed `/root` plus exactly three child paths, corroborating the current three-child wave. Repository evidence independently declares the same limit (`strategy-inventory-packet.json:76-87`; `dispatch-sheet.json:6,13-15`). More than three total agents remain schedulable only across waves.

### Derived bounds and unknowns

- First-call aggregate input is observed exactly at 24,229 tokens, but attribution among instructions, task, tool schemas, and protocol framing is unknown.
- Cached input is a subset of input: uncached input for that call was arithmetically `24,229 - 23,296 = 933` tokens.
- Exact hidden tool-schema tokens, serialized request bytes, cache-key boundaries, and task-briefing plaintext bytes remain unknown.
- No evidence makes `token_budget: 1800` an enforced cap. The packet explicitly calls it a target (`strategy-inventory-packet.json:76-93`).
- Repository Inventory correctly remains discovery-only (`strategy-inventory-packet.json:95`).

### Smallest Luna-versus-Sol benchmark

Use two byte-identical parent sessions, one Luna and one Sol, each seeded with the same fixed history. Each parent performs two child runs:

1. `fork_turns:none`
2. `fork_turns:all`, inheriting that parent’s model/effort

That is the minimum **four-cell** design. Each child should execute the same three-call script:

1. no-tool baseline;
2. retrieve one fixed, hash-bound source payload;
3. receive one fixed, hash-bound upstream return.

Capture raw host-bound serialized sections or tokenizer counts before submission; otherwise tool-schema and role-category attribution stays unknowable despite aggregate usage receipts. Score outputs blindly against one fixed correctness rubric; latency or textual similarity cannot establish quality parity.

### Required receipt schema

```json
{
  "run_id": "...",
  "parent_id": "...",
  "child_id": "...",
  "model": "...",
  "effort": "...",
  "fork_turns": "none|all|N",
  "declared_token_budget": 1800,
  "budget_enforced": false,
  "sections": {
    "forked_turns": {"sha256": "...", "bytes": 0, "tokens": null},
    "base_instructions": {"sha256": "...", "bytes": 0, "tokens": null},
    "developer_instructions": {},
    "agents_context": {},
    "task_briefing": {},
    "tool_schemas": {},
    "retrieved_payload": {},
    "upstream_return": {}
  },
  "calls": [{
    "input_tokens": 0,
    "cached_input_tokens": 0,
    "cache_write_input_tokens": 0,
    "output_tokens": 0,
    "reasoning_output_tokens": 0,
    "total_tokens": 0,
    "context_window": 0,
    "started_at": "...",
    "completed_at": "..."
  }],
  "output_sha256": "...",
  "rubric_score": null,
  "termination": "completed|failed|truncated"
}
```

## Agent 3 — Simon, Herbert

Research result (read-only; access date 2026-09-01)

Exact identity is confirmed: official Qwen repository [Qwen/Qwen3.8-27B-FP8](https://huggingface.co/Qwen/Qwen3.8-27B-FP8) exists, is a 28B-parameter FP8 safetensors model, and its repository tree reports 30.9 GB of artifacts. The model card explicitly supplies vLLM and SGLang launch paths. Its config identifies `Qwen3_5ForConditionalGeneration`, a multimodal causal LM with vision encoder—not a plain dense text-only Qwen3 model. No silent substitution is needed.

Architecture facts from [official config](https://huggingface.co/Qwen/Qwen3.8-27B-FP8/blob/main/config.json) and [Transformers implementation](https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_5/modeling_qwen3_5.py):

- 64 layers, arranged 3 linear-attention/Gated-DeltaNet layers then 1 full-attention layer: 48 linear + 16 full.
- Full attention: 4 KV heads × 256 head dimension.
- DeltaNet: 48 value heads, 16 key heads, key/value head dimensions 128.
- `mamba_ssm_dtype=float32`, `linear_conv_kernel_dim=4`.
- Native context 262,144; Qwen documents YaRN extension to 1,000,000, but extension quality/performance is unmeasured here.

Memory equations, excluding allocator/engine overhead:

```text
W = 30.9 GB                 # repository artifact footprint; runtime loaded size must be measured
HBM = 141 GB                # H200 official specification
N_full = 16
N_linear = 48

KV_bytes/token =
  N_full × 2(K,V) × 4(KV heads) × 256(head dim) × bytes/element
  = 32,768 × bytes/element

=> BF16 KV: 65,536 B/token
=> FP8 KV:  32,768 B/token

DeltaNet recurrent state/request =
  N_linear × 48 × 128 × 128 × 4
  = 150,994,944 B ≈ 0.151 GB (144 MiB)

Conv state/request ≈
  N_linear × (2×16×128 + 48×128) × (4−1) × dtype_bytes
  = 2.95 MB at BF16, 5.90 MB at FP32
```

The recurrent-state shape is directly shown in the official implementation as `[batch, num_v_heads, k_head_dim, v_head_dim]`; its reference path computes in FP32. This is fixed per active sequence, independent of context length. KV is only present in the 16 full-attention layers.

At full native context:

- 262k tokens: BF16 KV ≈17.18 GB/request; FP8 KV ≈8.59 GB/request.
- 1M tokens: BF16 KV ≈65.54 GB/request; FP8 KV ≈32.77 GB/request.

A conservative serving budget is:

```text
C = u×141 − W − A
```

where `u` is engine memory fraction and `A` is runtime reserve for CUDA graphs, activations, workspace, vision preprocessing, fragmentation, and safety margin. Using `u=0.85–0.90` (vLLM/SGLang controls) and unmeasured `A=8–16 GB` gives approximately `C=73–88 GB` for request state/KV.

Approximate memory-bound active requests at 262k context:

- BF16 KV: `floor((C−0.151)/17.18)` ≈ 4–5.
- FP8 KV: `floor((C−0.151)/8.59)` ≈ 8–10.

These are capacity bounds, not quality-preserving concurrency claims. Start lower (e.g. `max-num-seqs` 1, 2, then 4) and promote only after output-agreement and latency canaries. FP8 KV quality impact is not established by the cited sources, so BF16 KV is the safer quality-preserving hypothesis.

Serving behavior:

- [vLLM scheduler docs](https://docs.vllm.ai/en/latest/cli/run-batch/) define `max-num-seqs` as sequences per iteration and `max-num-batched-tokens` as tokens per iteration; chunked prefill permits long prompts to be split, while decode and prefill compete for capacity.
- [SGLang server arguments](https://github.com/sgl-project/sglang/blob/main/docs/advanced_features/server_arguments.md) expose equivalent controls: `--max-running-requests`, `--max-total-tokens`, `--mem-fraction-static`, and `--chunked-prefill-size`.
- Prefill is activation/temporary-memory sensitive; decode is dominated by fixed DeltaNet state plus accumulated full-attention KV. Continuous batching shares weights and interleaves active requests, but does not share per-request recurrent state or KV.

Replica hypothesis:

```text
replicas_low_context ≈ floor(141 / (30.9 + A + 0.151))
```

With `A=8–16 GB`, this is approximately 2–3 independent replicas, only for short-context workloads. At 262k context, two replicas leave roughly 31.6 GB/replica before per-request overhead: about one BF16 full-context request or three FP8-KV requests each. Three replicas leave ~8 GB/replica and cannot hold one BF16 262k request. Therefore, one shared-weight engine with bounded concurrency is the stronger long-context hypothesis; independent replicas trade context capacity for isolation/latency and duplicate 30.9 GB weights.

H200 confirmation: [NVIDIA H200 specification](https://www.nvidia.com/en-us/data-center/h200/) reports 141 GB HBM3e and 4.8 TB/s. [RunPod current pricing](https://www.runpod.io/pricing) lists H200 Pods at 141 GB and $4.59/hr Secure Cloud; this is infrastructure evidence only, not throughput evidence.

Minimal live trace to collect on a canary:

`model_id/revision, engine+CUDA versions, HBM total/free, loaded weight bytes, memory fraction, runtime reserve peak, KV dtype and allocated bytes/token, recurrent+conv state bytes/active sequence, max_model_len, max-num-seqs/max-running-requests, max-num-batched-tokens/chunk size, prompt/output token counts, prefill tok/s, decode tok/s, TTFT/TPOT p50/p95, active/queued counts, OOM/restarts, and output agreement versus concurrency=1.`

Sweep `max-num-seqs={1,2,4,8}`, contexts `{8k,32k,128k,262k}`, and representative text/image prompts for at least five minutes per cell. Every throughput, latency, stability, and five-minute claim remains **canary input** until measured.
