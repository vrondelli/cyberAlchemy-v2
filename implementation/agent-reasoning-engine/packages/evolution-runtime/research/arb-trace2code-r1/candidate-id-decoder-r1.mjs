// Frozen scalar-ID decoder. Open Questions: G01-DEFECTS4J-32-R2-PROTOCOL.md.
export function decodeCandidateIds(content, candidateCount) {
  if (!Number.isSafeInteger(candidateCount) || candidateCount < 1) throw Error('candidate-count');
  const value = JSON.parse(content);
  if (!value || Array.isArray(value) || Object.keys(value).length !== 1 ||
      !Array.isArray(value.candidate_ids)) throw Error('response-shape');
  const ids = value.candidate_ids.map(item => {
    if (typeof item === 'string' && /^(?:\d+|\[\d+\])$/.test(item)) return Number(item.replace(/[\[\]]/g, ''));
    return item;
  });
  if (ids.length > 8 || new Set(ids).size !== ids.length ||
      !ids.every(item => Number.isSafeInteger(item) && item >= 1 && item <= candidateCount)) throw Error('candidate-ids');
  return ids;
}
