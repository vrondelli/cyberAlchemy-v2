# G01 BugSwarm selective-GLM r35 — exact failed-source archive protocol

Status: prospectively fixed source-only acquisition protocol for the sealed r34
population. This stage opens no gold, passing source, patch, or model output.

## Objective

Acquire one byte-pinned GitHub codeload archive for the exact failing commit of
each of the 24 r34 repositories, then inspect every archive under bounded safety
and code-availability rules. This supplies the immutable source input for the
later code-only projection and selective-GLM transfer test.

The only population input is the r34 result at SHA-256
`fee3ffa2e39fee3aadfbe09612439542942ffcfcadb13e45dc7f77ffda9e012c`.
The runner must reject any input drift, non-sequential slot, duplicate
repository, non-40-character commit, unexpected language, or changed r34
boundary flag.

## Frozen acquisition and inspection rule

- Request exactly
  `https://codeload.github.com/{repository}/legacy.tar.gz/{failed_commit}`.
- Make one request per slot, sequentially, with zero automatic retries.
- Accept only HTTP 200, a final HTTPS codeload URL, a complete gzip stream, and
  at most 256 MiB downloaded per archive.
- Preserve incomplete or over-cap `.partial` files and their observed byte
  count and SHA-256 as failure evidence.
- Permit exactly one archive root. Its suffix must equal
  `-{declared repository basename}-{first seven commit characters}`. The owner
  prefix before that suffix must match `[A-Za-z0-9._-]+`. This prospectively
  handles GitHub owner renames without accepting another repository basename or
  commit.
- Reject absolute paths, backslashes, `..` components, multiple roots,
  duplicate projected code paths, more than 250,000 members, more than 4 GiB
  declared regular-file bytes, or more than 64 MiB eligible code bytes.
- Python slots require at least one `.py` file; Java slots require at least one
  `.java` file. Matching files above 1 MiB are counted separately and excluded
  from the later projection rather than opened.
- Record the archive byte count, SHA-256, final URL, root, caps, and inspection
  counts in per-case receipts and a terminal result.

The gate passes only at 24/24 admissible archives. A failure is terminal for
r35 and must remain evidence; a separately versioned repair may address only
the observed failure class.

## Boundaries

R35 performs no label, diff, passing-tree, score, GLM, VPS, publication, or
superiority operation. A passing source gate proves only that the sealed r34
population has exact failed-source archives suitable for a later code-only
projection.

## Open Questions

- Do any declared repositories resolve through an owner rename under the
  prospectively fixed suffix rule?
- Do any exact archives exceed the bounded archive or inspection caps?
- After code-only projection, what fraction of the 24 cases have disagreement
  between unchanged ARE and graph-r2 top-1 predictions?
