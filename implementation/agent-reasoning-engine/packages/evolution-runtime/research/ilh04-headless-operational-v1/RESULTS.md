# IL-H04 Operational Headless Results

Status: operational binding complete  
Activation: controlled local operational

| Check | Result |
| --- | --- |
| Activation manifest integrity | verified |
| Serving-pointer lineage | verified |
| Fresh operational state | verified |
| App-server entrypoint binding | implemented |
| Gateway entrypoint binding | implemented |
| Installed Codex protocol | re-observed at `0.155.0-alpha.16.3` |
| Real Codex app-server initialize | passed |
| Model turn started | no |
| Provider/model calls | 0 |
| Model-neutral continuity canary | passed |
| Repository default | disabled |
| Focused tests | 31/31 passed |
| Full wrapper tests | 222/222 passed |
| Evolution-runtime tests | 128/128 passed |
| Coordinator settlement | 8/8 tasks completed |
| Restart / SQLite-loss recovery | verified / verified |

- Activation manifest digest: `9bb454edaa5fe28a01fd608312ab187a91c3a73f4d440a7ca1465e22799b2357`
- Operational snapshot digest: `ab1a753dbf435aac4619b92559a0772703d21cb1ab9819156904ee0faeed5775`
- Operational canary digest: `e138e49fd4c7225673f3cc00f3daa3fd885aab018443989177531547955c2b6c`
- Live initialize digest: `628642478d3ca7f9a9ce0de6eecf2c3ddc1c6158c99baf21a0c0b80024bc5fb5`
- Validation digest: `2a099cc229f046a968b4410d1469063bf08bf7a6d41f6d7c6d794132e767e487`
- Operational package digest: `ac3bc70aa0cca657b331680fec89379e12728d5ab9f449c316afd4a80dbd81da`
- Coordinator settlement digest: `d7d6d05cc9134941058cc0f0cd1050e4c98fdd967f6a1000e3b809a4aa8ec8f4`

## Decision

`operational-headless-binding-complete`. The admitted local pointer is now
directly consumable by both real entrypoints through one exact manifest.

## Claim boundary

This completes the local shared-RPC/headless scope. It does not claim external
deployment, publication, Codex Desktop UI support, or real-user effectiveness.

## Open Questions

Open questions are owned by [README.md](README.md#open-questions).
