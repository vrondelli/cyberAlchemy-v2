"""One-pass query-bound hint index for the 120-second worker policy.

Worker isolation and native integration are separate construction stages.
Open questions: RADICAL-SOURCE-ACQUISITION-PROTOCOL-R4.md.
"""
from dataclasses import dataclass
import hashlib
import json
import math
import re
import sys
import unicodedata


def encoded(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def digest(value):
    return hashlib.sha256(encoded(value)).hexdigest()


NORMALIZER = {"version": "ranked-source-hints-r3", "python": sys.version,
              "unicode": unicodedata.unidata_version}


def terms(text):
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"([A-Z]+)([A-Z][a-z])", r"\1 \2", text)
    text = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", text).lower()
    tokens, current = [], []
    for char in text:
        if unicodedata.category(char)[0] in ("L", "N"):
            current.append(char)
        else:
            if len(current) >= 2:
                tokens.append("".join(current))
            current = []
    if len(current) >= 2:
        tokens.append("".join(current))
    return tokens


@dataclass(frozen=True)
class Blob:
    path: bytes
    mode: str
    size: int
    load: object


@dataclass(frozen=True)
class Limits:
    entries: int = 50000
    file_bytes: int = 8 * 1024**2
    admitted_bytes: int = 96 * 1024**2
    postings: int = 8000000
    manifest_bytes: int = 16 * 1024**2


class IndexLimitError(ValueError):
    pass


def safe_path(raw):
    path = raw.decode("utf-8", errors="strict")
    if (not path or path.startswith("/") or "\\" in path or "\x00" in path
            or any(x in ("", ".", "..") for x in path.split("/"))):
        raise ValueError("unsafe-path")
    return path


class SourceHintIndex:
    def __init__(self, records, base_commit, limits=Limits(), query_terms=None):
        if not re.fullmatch(r"[a-f0-9]{40}|[a-f0-9]{64}", base_commit):
            raise ValueError("base-commit")
        if any(not isinstance(v, int) or isinstance(v, bool) or v < 1
               or v > getattr(Limits(), k) for k, v in vars(limits).items()):
            raise ValueError("limits")
        if query_terms is not None and not isinstance(query_terms, str):
            raise ValueError("bound-query-type")
        self.bound_query = query_terms
        retained_terms = (None if query_terms is None else
                          frozenset(list(dict.fromkeys(terms(query_terms)))[:128]))
        self.base_commit, self.files, self.df = base_commit, [], {}
        manifest, used_bytes, used_postings, manifest_bytes = [], 0, 0, 256
        previous, stop, budget_stop_at = None, False, None
        for position, blob in enumerate(records):
            if position >= limits.entries:
                raise IndexLimitError("entry-limit")
            if not isinstance(blob.path, bytes) or (previous is not None and blob.path <= previous):
                raise ValueError("inventory-order-or-duplicate")
            previous = blob.path
            if not isinstance(blob.size, int) or isinstance(blob.size, bool) or blob.size < 0:
                raise ValueError("blob-size")
            row = {"path_hex": blob.path.hex(), "mode": blob.mode, "bytes": blob.size}
            reason, path, data = None, None, None
            if blob.mode not in ("100644", "100755"):
                reason = "mode"
            else:
                try:
                    path = safe_path(blob.path)
                    row["path"] = path
                except (UnicodeDecodeError, ValueError):
                    reason = "path"
            if reason is None and blob.size > limits.file_bytes:
                reason = "file-size"
            if reason is None and blob.size > 2000000:
                reason = "native-file-size"
            if reason is None and stop:
                reason = "admission-stopped"
            if reason is None:
                data = blob.load()
                if not isinstance(data, bytes) or len(data) != blob.size:
                    raise ValueError("blob-byte-identity")
                try:
                    text = data.decode("utf-8", errors="strict")
                    if "\x00" in text:
                        raise ValueError("binary")
                except (UnicodeDecodeError, ValueError):
                    reason = "encoding"
            if reason is None:
                # Match native read_file: split LF and remove the final empty line.
                lines = text.split("\n")
                if text.endswith("\n"):
                    lines.pop()
                path_terms = frozenset(terms(path))
                postings, file_terms, stored_lines = len(path_terms), set(path_terms), []
                for line in lines:
                    full_terms = frozenset(terms(line))
                    postings += len(full_terms)
                    file_terms.update(full_terms)
                    stored_lines.append(full_terms if retained_terms is None else
                                        full_terms & retained_terms)
                if used_bytes + blob.size > limits.admitted_bytes:
                    reason, stop = "admitted-byte-limit", True
                    budget_stop_at = position
                elif used_postings + postings > limits.postings:
                    reason, stop = "posting-limit", True
                    budget_stop_at = position
                else:
                    sha = hashlib.sha256(data).hexdigest()
                    row.update({"content_sha256": sha, "postings": postings})
                    for term in file_terms:
                        self.df[term] = self.df.get(term, 0) + 1
                    # Full terms are consumed per line for postings and DF;
                    # only the query intersection survives in the file index.
                    self.files.append({"path": path, "content_sha256": sha,
                                       "path_terms": path_terms, "lines": stored_lines,
                                       "line_bytes": [len(line.encode("utf-8")) for line in lines],
                                       "empty": not data})
                    used_bytes += blob.size
                    used_postings += postings
            row["status"] = "admitted" if reason is None else "excluded"
            row["reason"] = reason
            manifest_bytes += len(encoded(row)) + 1
            if manifest_bytes > limits.manifest_bytes:
                raise IndexLimitError("manifest-limit")
            manifest.append(row)
        self.manifest = {"entries": manifest, "admitted_files": len(self.files),
                         "admitted_bytes": used_bytes, "postings": used_postings,
                         "partial": any(r["status"] != "admitted" for r in manifest),
                         "remaining_after_budget_stop": 0 if budget_stop_at is None else len(manifest) - budget_stop_at - 1}
        if len(encoded(self.manifest)) > limits.manifest_bytes:
            raise IndexLimitError("manifest-limit")
        self.index_digest = digest({"base_commit": base_commit, "normalizer": NORMALIZER,
                                    "limits": vars(limits), "manifest": self.manifest})

    def query(self, raw_query, maximum_bytes=8192):
        if not isinstance(raw_query, str) or len(raw_query.encode("utf-8")) > 4096:
            raise ValueError("query-byte-limit-or-type")
        if self.bound_query is not None and raw_query != self.bound_query:
            raise ValueError("bound-query-mismatch")
        if not isinstance(maximum_bytes, int) or isinstance(maximum_bytes, bool) or not 1 <= maximum_bytes <= 8192:
            raise ValueError("response-limit")
        all_terms = list(dict.fromkeys(terms(raw_query)))
        query = frozenset(all_terms[:128])
        weights = {t: 1 + math.log((1 + len(self.files)) / (1 + self.df.get(t, 0))) for t in query}
        windows = []
        unreadable_matching_lines, unreadable_path_fallbacks = 0, 0
        for file in self.files:
            path_score = 3 * sum(weights[t] for t in sorted(query & file["path_terms"]))
            hits = [(i + 1, round((path_score + sum(weights[t] for t in sorted(query & ts))) * 10**9))
                    for i, ts in enumerate(file["lines"]) if query & ts]
            text_matched = bool(hits)
            unreadable_matching_lines += sum(file["line_bytes"][line - 1] > 32768 for line, _ in hits)
            hits = [(line, score) for line, score in hits if file["line_bytes"][line - 1] <= 32768]
            prefix = [0]
            for size in file["line_bytes"]:
                prefix.append(prefix[-1] + size + 1)
            def fit(start, end, anchor):
                while start < anchor and prefix[end] - prefix[start - 1] - 1 > 32768:
                    start += 1
                while end > anchor and prefix[end] - prefix[start - 1] - 1 > 32768:
                    end -= 1
                return start, end
            ranges, previous_end, at = [], 0, 0
            while at < len(hits):
                anchor = hits[at][0]
                start = max(1, previous_end + 1, anchor - 5)
                end = min(len(file["lines"]), start + 39)
                start, end = fit(start, end, anchor)
                scores = []
                while at < len(hits) and hits[at][0] <= end:
                    scores.append(hits[at][1])
                    at += 1
                ranges.append((start, end, max(scores)))
                previous_end = end
            if not text_matched and path_score and not file["empty"]:
                if file["line_bytes"][0] > 32768:
                    unreadable_path_fallbacks += 1
                else:
                    start, end = fit(1, min(40, len(file["lines"])), 1)
                    ranges.append((start, end, round(path_score * 10**9)))
            for start, end, score in ranges:
                windows.append({"path": file["path"], "base_commit": self.base_commit,
                                "content_sha256": file["content_sha256"],
                                "start_line": start, "end_line": end, "score_units": score})
        windows.sort(key=lambda w: (-w["score_units"], w["path"].encode("utf-8"), w["start_line"]))
        result = {"schema": "are.ranked-source-hints/v1", "index_digest": self.index_digest,
                  "query_digest": digest({"query": raw_query}), "partial_index": self.manifest["partial"],
                  "omitted_query_terms": max(0, len(all_terms) - 128),
                  "matching_windows": len(windows), "hints": windows[:5],
                  "unreadable_matching_lines": unreadable_matching_lines,
                  "unreadable_path_fallbacks": unreadable_path_fallbacks}
        while True:
            result["omitted_hints"] = len(windows) - len(result["hints"])
            if len(encoded(result)) <= maximum_bytes:
                return result
            if not result["hints"]:
                raise IndexLimitError("response-metadata-limit")
            result["hints"].pop()
