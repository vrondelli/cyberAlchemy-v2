# G01 fresh r22 — sealed 8K GLM transfer

Status: fixed before VPS transfer or provider calls. Transfer only r21 private packets SHA-256 `9cf7490d6b21d34b58d0dbb75d1ab262caac061b773a75ab350b54a7291e149c`, packet seal SHA-256 `f281f62b2073fa61932b4c1823a02445aac88e6edd748dd9d6eeac1e4d89d63f`, this protocol, and its pinned runner to a new exact private VPS directory. Never transfer failed-source archives, projected code roots, evaluator gold, passing source, or credentials. The VPS transport must match SHA-256 `5669b2c72d642e1ccf1d5bd796064c1e61d9dcad8828622f9b6f4450acdec56d` and model `glm-5.3-flash`; the secret remains in its existing private VPS file.

Tokenize every exact prompt through the same account. Require 24 HTTP-200 responses with safe integer prompt tokens, each prompt plus a 512-token output reserve at most 8,192, and summed prompt tokens at most 220,000. Stop on the first failed admission, preserve the partial denominator and all receipts, and make no generation calls. If admitted, send one generation call per case in frozen order, maximum 512 output tokens, low reasoning effort, no automatic retry; stop on transport/provider failure. Preserve exact raw provider payload, usage, finish reason, request/response hashes, elapsed time, and every attempt. Cold-copy the entire VPS run to private WSL storage and verify byte manifests before evaluator access.

The unchanged r10 normalizer accepts only a sole JSON object or one complete `json` fence, exactly one `candidate_ids` key, and at most eight distinct valid IDs/paths. Invalid content falls back to the complete graph-r2 ranking for all-case scoring, but fails the prospective 24/24-valid gate. Seal all 24 predictions before opening evaluator labels. No r22 provider or validity result alone establishes superiority; the r11 predeclared fresh gate and human review still govern any bounded claim.

## Open Questions

- Will all 24 exact packets pass same-account token admission and one-shot generation without transport failure?
- Will 24/24 outputs normalize validly, and will the cold copy and prediction seal verify before evaluator access?
