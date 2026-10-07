"""Source-region BM25. Open Questions: G02-R11-REGION-POOLING-EXPOSED-R1.md."""
from collections import Counter
import math


def windows(lines, size=60, stride=30):
    for start in range(0, len(lines), stride):
        yield start+1, min(len(lines), start+size), '\n'.join(lines[start:start+size])
        if start+size >= len(lines):
            break


def rank(units, query):
    """Units: (path, start, end, Counter); BM25 then max pooling by path."""
    if not units or not query:
        return []
    n = len(units); df = Counter()
    for _, _, _, counter in units:
        df.update(set(counter)&set(query))
    average = sum(sum(c.values()) for _, _, _, c in units)/n
    best = {}
    for path, start, end, counter in units:
        overlap = set(counter)&set(query)
        if len(overlap) < 2:
            continue
        norm = 1.2*(.25+.75*sum(counter.values())/max(1, average))
        score = sum(query[t]*math.log1p((n-df[t]+.5)/(df[t]+.5))*counter[t]*2.2/
                    (counter[t]+norm) for t in overlap)
        candidate = {'path': path, 'start': start, 'end': end, 'score': score,
                     'query_terms': sorted(overlap)}
        if path not in best or (-score, start) < (-best[path]['score'], best[path]['start']):
            best[path] = candidate
    return sorted(best.values(), key=lambda x: (-x['score'], x['path'], x['start']))
