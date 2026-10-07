# G01 early four-range stop diagnostics

Status: exposed-task diagnostics only, not prospective benchmark evidence. Full receipts are on the GLM VPS at `/opt/are/evolution-runtime/g01-early-go-diagnostic-r1` and `/opt/are/evolution-runtime/g01-early-svelte-diagnostic-r1`.

The new opt-in `intent-anchor-terminal-shortlist-distinctive-early-r1` checked the existing receipt-bound four-wide-range threshold from discovery call 6 instead of call 12. On exposed GitHub CLI Go, it stopped after eight discovery calls, scored native Span/File-F1 `0.213899/0.285714`, used 25,064 known model tokens, and took 111.804s. The previous candidate on that task scored `0.055615/0.250000`, 38,855 tokens, 142.682s; the frozen control scored `0/0`, 36,761 tokens, 137.800s.

On exposed Svelte JavaScript, the early arm stopped after ten discovery calls and scored native Span/File-F1 `0/0.250000`, 37,775 tokens, 170.298s. The previous candidate had scored `0.347903/0.285714`, 46,873 tokens, 169.592s. The early stop lost the Span-F1 gain. Its trajectory had not delivered the relevant `src/compiler/compile/nodes/Element.ts` range selected by the previous run; merely reaching four wide source ranges was not enough. **Reject the unconditional early-stop arm.**

The follow-up conditional hypothesis is to check from call 6 only when no runtime distinctive acquisition occurred, while allowing eight model calls after an acquisition before the first stop check. This remains a separate candidate requiring its own diagnostics and fresh prospective tasks.

## Open Questions

- Does the conditional rule retain Svelte source recall while saving Go-like overhead?
- How much variation across repeated GLM runs is attributable to the stopping policy versus exploration stochasticity?
