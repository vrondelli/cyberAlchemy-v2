# Ranked-source-hints core review R1

Rejected pending one concrete correction. All 12 supplied tests independently pass.

## Finding: terminal LF extent differs from native reads

The core keeps the trailing empty item from text.split(LF). The actual repository-tools.mjs read_file producer explicitly removes that item when text ends in LF. A real temporary Git fixture containing `needle` followed by LF reproduces hint end_line=2, while native read_file returns end_line=total_lines=1. The core test currently codifies this incorrect extra line for a two-line CRLF/LF example. Native clamping avoids fabricated source bytes, but the advertised exact source range is wrong.

Correct additively and test against the actual producer, including terminal LF, CRLF, no terminal LF, empty file and a last-line match. Original reviewed bytes are preserved.

The remaining inspected deterministic logic follows R3: distinct per-file df/path postings, atomic budget admission and sorted stop, text-anchored disjoint windows, path-only fallback, integer ranking, query bounds and whole-hint omissions. Response fields contain no source text or read identities. That shape is not proof of native evidence isolation.

## Open Questions

Resource worker enforcement, bounded inventory and native adapter remain pending. The current native source reader accepts at most 2,000,000 bytes per file, while index eligibility allows 8MiB; future integration must explicitly address hints that cannot be read, without silently changing frozen tools. The reader also rejects returned spans above 32,768 UTF-8 bytes: a 40-line hint need not fit, and reducing line_count cannot rescue one oversized line. Resolve source accessibility explicitly before worker/integration admission. No live admission or model-quality/savings conclusion is supplied. Exact bindings are in the paired JSON.
