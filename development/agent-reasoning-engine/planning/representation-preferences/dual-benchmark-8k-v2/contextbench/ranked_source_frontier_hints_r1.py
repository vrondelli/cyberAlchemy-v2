"""Additive wider hint view for the radical evidence frontier.

The historical ranker remains unchanged. This view uses the same index and
scores, with a separately bounded result count. Open questions:
RECENT-EVIDENCE-POSTRUN-R1.md.
"""
import math

from ranked_source_hints_r3 import SourceHintIndex, digest, encoded, terms, IndexLimitError


class FrontierSourceHintIndex(SourceHintIndex):
    def query(self, raw_query, maximum_bytes=8192, maximum_hints=10):
        if not isinstance(raw_query, str) or len(raw_query.encode("utf-8")) > 4096:
            raise ValueError("query-byte-limit-or-type")
        if not isinstance(maximum_bytes, int) or isinstance(maximum_bytes, bool) or not 1 <= maximum_bytes <= 8192:
            raise ValueError("response-limit")
        if not isinstance(maximum_hints, int) or isinstance(maximum_hints, bool) or not 1 <= maximum_hints <= 16:
            raise ValueError("hint-limit")
        all_terms = list(dict.fromkeys(terms(raw_query)))
        query = frozenset(all_terms[:128])
        weights = {term: 1 + math.log((1 + len(self.files)) / (1 + self.df.get(term, 0)))
                   for term in query}
        windows = []
        unreadable_matching_lines, unreadable_path_fallbacks = 0, 0
        for file in self.files:
            path_score = 3 * sum(weights[t] for t in sorted(query & file["path_terms"]))
            hits = [(i + 1, round((path_score + sum(weights[t] for t in sorted(query & line_terms))) * 10**9))
                    for i, line_terms in enumerate(file["lines"]) if query & line_terms]
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
                    scores.append(hits[at][1]);at += 1
                ranges.append((start, end, max(scores)));previous_end = end
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
        windows.sort(key=lambda window: (-window["score_units"], window["path"].encode("utf-8"),
                                         window["start_line"]))
        diverse, seen = [], set()
        for window in windows:
            if window["path"] in seen:
                continue
            seen.add(window["path"]);diverse.append(window)
        result = {"schema": "are.ranked-source-frontier-hints/v1",
                  "index_digest": self.index_digest,
                  "query_digest": digest({"query": raw_query}),
                  "partial_index": self.manifest["partial"],
                  "omitted_query_terms": max(0, len(all_terms) - 128),
                  "matching_windows": len(windows), "matching_paths": len(diverse),
                  "hints": diverse[:maximum_hints],
                  "maximum_hints": maximum_hints,
                  "unreadable_matching_lines": unreadable_matching_lines,
                  "unreadable_path_fallbacks": unreadable_path_fallbacks}
        while True:
            result["omitted_hints"] = len(diverse) - len(result["hints"])
            if len(encoded(result)) <= maximum_bytes:
                return result
            if not result["hints"]:
                raise IndexLimitError("response-metadata-limit")
            result["hints"].pop()
