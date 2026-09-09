import {scoreLiveResponse} from "./scorer.mjs";

export const CONCEPT_TREATMENT_ID = "scorer:declared-concept-equivalence/candidate-v1";
export const CONCEPT_TREATMENT_FAST_ID = "scorer:declared-concept-equivalence/candidate-v2";
export const CONCEPT_TREATMENT_FUSED_ID = "scorer:declared-concept-equivalence/candidate-v3";
export const CONCEPT_TREATMENT_INDEXED_ID = "scorer:declared-concept-equivalence/candidate-v4";
export const CONCEPT_TREATMENT_SHORT_CIRCUIT_ID = "scorer:declared-concept-equivalence/candidate-v5";
export const CONCEPT_TREATMENT_MARKER_INDEX_ID = "scorer:declared-concept-equivalence/candidate-v6";
export const CONCEPT_TREATMENT_SINGLE_SCAN_ID = "scorer:declared-concept-equivalence/candidate-v7";
export const CONCEPT_TREATMENT_SELECTIVE_SCAN_ID = "scorer:declared-concept-equivalence/candidate-v8";
export const CONCEPT_TREATMENT_LAZY_SCAN_ID = "scorer:declared-concept-equivalence/candidate-v9";
export const CONCEPT_TREATMENT_BOUNDED_FAST_ID = "scorer:declared-concept-equivalence/candidate-v10";
export const CONCEPT_TREATMENT_REGEX_ID = "scorer:declared-concept-equivalence/candidate-v11";
export const CONCEPT_TREATMENT_BUNDLED_REGEX_ID = "scorer:declared-concept-equivalence/candidate-v12";
export const CONCEPT_TREATMENT_AUTOMATON_ID = "scorer:declared-concept-equivalence/candidate-v13";
export const CONCEPT_TREATMENT_DECISION_PROJECTION_ID = "scorer:declared-concept-equivalence/candidate-v14";

function terms(value) { return Array.isArray(value) ? value.filter((term) => typeof term === "string" && term.trim()).map((term) => term.trim()) : []; }

function phrasePresent(answer, phrase) {
  const haystack = ` ${(String(answer ?? "").toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ")} `;
  const needle = (String(phrase).toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ");
  return needle.length > 0 && haystack.includes(` ${needle} `);
}

function declaredHit(answer, markers) { return terms(markers).filter((marker) => phrasePresent(answer, marker)); }

function stem(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("tion") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
}

function normalizePhraseTokens(value) { return (String(value).toLowerCase().match(/[a-z0-9]+/g) ?? []); }
function phraseMatchesAt(words, position, phraseTokens) { return phraseTokens.length > 0 && phraseTokens.every((token, offset) => words[position + offset] === token); }
function isWordCharacter(value) { return value !== undefined && /[a-z0-9]/.test(value); }
function boundedWordPresent(text, word) {
  let position = text.indexOf(word);
  while (position >= 0) {
    const end = position + word.length;
    if (!isWordCharacter(text[position - 1]) && !isWordCharacter(text[end])) return true;
    position = text.indexOf(word, position + 1);
  }
  return false;
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function boundaryRegex(tokens) {
  return new RegExp(`(?:^|[^a-z0-9])${tokens.map(escapeRegex).join("[^a-z0-9]+")}(?:$|[^a-z0-9])`);
}

export function compileConceptResponseFast(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => (marker.toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ")).filter(Boolean)]));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const joined = ` ${words.join(" ")} `;
    const requiredHits = requiredMeta.filter(({term, normalized, simple, stem: requiredStem}) => (simple && (wordSet.has(normalized) || words.some((word) => stem(word) === requiredStem))) || markerPhrases[term].some((phrase) => joined.includes(` ${phrase} `))).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    const equivalenceHits = Object.fromEntries(required.map((term) => [term, markerPhrases[term].filter((phrase) => joined.includes(` ${phrase} `))]));
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseFused(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => (marker.toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ")).filter(Boolean)]));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const joined = ` ${words.join(" ")} `;
    const requiredHits = [];
    const equivalenceHits = {};
    for (const {term, normalized, simple, stem: requiredStem} of requiredMeta) {
      let hit = simple && (wordSet.has(normalized) || words.some((word) => stem(word) === requiredStem));
      const markerHits = [];
      for (const phrase of markerPhrases[term]) {
        if (joined.includes(` ${phrase} `)) {
          markerHits.push(phrase);
          hit = true;
        }
      }
      if (hit) requiredHits.push(term);
      equivalenceHits[term] = markerHits;
    }
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseIndexed(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => (marker.toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ")).filter(Boolean)]));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const stemSet = new Set(words.map((word) => stem(word)));
    const joined = ` ${words.join(" ")} `;
    const requiredHits = [];
    const equivalenceHits = {};
    for (const {term, normalized, simple, stem: requiredStem} of requiredMeta) {
      const lexicalHit = simple && (wordSet.has(normalized) || stemSet.has(requiredStem));
      const markerHits = markerPhrases[term].filter((phrase) => joined.includes(` ${phrase} `));
      if (lexicalHit || markerHits.length > 0) requiredHits.push(term);
      equivalenceHits[term] = markerHits;
    }
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseShortCircuit(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => (marker.toLowerCase().match(/[a-z0-9]+/g) ?? []).join(" ")).filter(Boolean)]));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const stemSet = new Set(words.map((word) => stem(word)));
    const joined = ` ${words.join(" ")} `;
    const requiredHits = [];
    const equivalenceHits = {};
    for (const {term, normalized, simple, stem: requiredStem} of requiredMeta) {
      const lexicalHit = simple && (wordSet.has(normalized) || stemSet.has(requiredStem));
      const markerHits = lexicalHit ? [] : markerPhrases[term].filter((phrase) => joined.includes(` ${phrase} `));
      if (lexicalHit || markerHits.length > 0) requiredHits.push(term);
      equivalenceHits[term] = markerHits;
    }
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseMarkerIndexed(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerIndex = new Map();
  for (const term of required) for (const phrase of markerPhrases[term]) {
    const phraseTokens = phrase.split(" ");
    const entries = markerIndex.get(phraseTokens[0]) ?? [];
    entries.push({term, phrase, phraseTokens});
    markerIndex.set(phraseTokens[0], entries);
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const stemSet = new Set(words.map((word) => stem(word)));
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    for (let position = 0; position < words.length; position += 1) {
      for (const entry of markerIndex.get(words[position]) ?? []) if (phraseMatchesAt(words, position, entry.phraseTokens)) markerHits[entry.term].push(entry.phrase);
    }
    const requiredHits = requiredMeta.filter(({term, normalized, simple, stem: requiredStem}) => (simple && (wordSet.has(normalized) || stemSet.has(requiredStem))) || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseSingleScan(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerIndex = new Map();
  for (const term of required) for (const phrase of markerPhrases[term]) {
    const phraseTokens = phrase.split(" ");
    const entries = markerIndex.get(phraseTokens[0]) ?? [];
    entries.push({term, phrase, phraseTokens});
    markerIndex.set(phraseTokens[0], entries);
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const stemSet = new Set(words.map((word) => stem(word)));
    const markerSeen = Object.fromEntries(required.map((term) => [term, new Set()]));
    const lexicalHits = new Set();
    for (const {term, normalized, simple, stem: requiredStem} of requiredMeta) {
      if (simple && (wordSet.has(normalized) || stemSet.has(requiredStem))) lexicalHits.add(term);
    }
    for (let position = 0; position < words.length; position += 1) {
      for (const entry of markerIndex.get(words[position]) ?? []) if (phraseMatchesAt(words, position, entry.phraseTokens)) markerSeen[entry.term].add(entry.phrase);
    }
    const requiredHits = requiredMeta.filter(({term}) => lexicalHits.has(term) || markerSeen[term].size > 0).map(({term}) => term);
    const equivalenceHits = Object.fromEntries(required.map((term) => [term, markerPhrases[term].filter((phrase) => markerSeen[term].has(phrase))]));
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseSelectiveScan(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerIndex = new Map();
  for (const term of required) for (const phrase of markerPhrases[term]) {
    const phraseTokens = phrase.split(" ");
    const entries = markerIndex.get(phraseTokens[0]) ?? [];
    entries.push({term, phrase, phraseTokens});
    markerIndex.set(phraseTokens[0], entries);
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set(words);
    const stemSet = new Set(words.map((word) => stem(word)));
    const lexicalHits = new Set();
    const missingTerms = [];
    for (const meta of requiredMeta) {
      const lexicalHit = meta.simple && (wordSet.has(meta.normalized) || stemSet.has(meta.stem));
      if (lexicalHit) lexicalHits.add(meta.term);
      else missingTerms.push(meta.term);
    }
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    if (missingTerms.length > 0) {
      const missing = new Set(missingTerms);
      for (let position = 0; position < words.length; position += 1) {
        for (const entry of markerIndex.get(words[position]) ?? []) {
          if (!missing.has(entry.term) || !phraseMatchesAt(words, position, entry.phraseTokens)) continue;
          if (!markerHits[entry.term].includes(entry.phrase)) markerHits[entry.term].push(entry.phrase);
        }
      }
    }
    const requiredHits = requiredMeta.filter(({term}) => lexicalHits.has(term) || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseLazyScan(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerIndex = new Map();
  for (const term of required) for (const phrase of markerPhrases[term]) {
    const phraseTokens = phrase.split(" ");
    const entries = markerIndex.get(phraseTokens[0]) ?? [];
    entries.push({term, phrase, phraseTokens});
    markerIndex.set(phraseTokens[0], entries);
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const lexicalHits = new Array(requiredMeta.length).fill(false);
    const missing = [];
    for (let index = 0; index < requiredMeta.length; index += 1) {
      const meta = requiredMeta[index];
      if (meta.simple && words.includes(meta.normalized)) lexicalHits[index] = true;
      else missing.push(index);
    }
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    if (missing.length > 0) {
      const stemSet = new Set(words.map((word) => stem(word)));
      const unresolved = [];
      for (const index of missing) {
        if (requiredMeta[index].simple && stemSet.has(requiredMeta[index].stem)) lexicalHits[index] = true;
        else unresolved.push(index);
      }
      if (unresolved.length > 0) {
        const unresolvedTerms = new Set(unresolved.map((index) => requiredMeta[index].term));
        for (let position = 0; position < words.length; position += 1) {
          for (const entry of markerIndex.get(words[position]) ?? []) {
            if (!unresolvedTerms.has(entry.term) || !phraseMatchesAt(words, position, entry.phraseTokens)) continue;
            if (!markerHits[entry.term].includes(entry.phrase)) markerHits[entry.term].push(entry.phrase);
          }
        }
      }
    }
    const requiredHits = requiredMeta.filter(({term}, index) => lexicalHits[index] || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseBoundedFast(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => ({term, normalized: term.toLowerCase(), simple: /^[a-z0-9]+$/.test(term.toLowerCase()), stem: stem(term.toLowerCase())}));
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerIndex = new Map();
  for (const term of required) for (const phrase of markerPhrases[term]) {
    const phraseTokens = phrase.split(" ");
    const entries = markerIndex.get(phraseTokens[0]) ?? [];
    entries.push({term, phrase, phraseTokens});
    markerIndex.set(phraseTokens[0], entries);
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const lexicalHits = new Array(requiredMeta.length).fill(false);
    const missing = [];
    for (let index = 0; index < requiredMeta.length; index += 1) {
      const meta = requiredMeta[index];
      if (meta.simple && boundedWordPresent(lowered, meta.normalized)) lexicalHits[index] = true;
      else missing.push(index);
    }
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    if (missing.length > 0) {
      const words = lowered.match(/[a-z0-9]+/g) ?? [];
      const stemSet = new Set(words.map((word) => stem(word)));
      const unresolved = [];
      for (const index of missing) {
        if (requiredMeta[index].simple && stemSet.has(requiredMeta[index].stem)) lexicalHits[index] = true;
        else unresolved.push(index);
      }
      if (unresolved.length > 0) {
        const unresolvedTerms = new Set(unresolved.map((index) => requiredMeta[index].term));
        for (let position = 0; position < words.length; position += 1) {
          for (const entry of markerIndex.get(words[position]) ?? []) {
            if (!unresolvedTerms.has(entry.term) || !phraseMatchesAt(words, position, entry.phraseTokens)) continue;
            if (!markerHits[entry.term].includes(entry.phrase)) markerHits[entry.term].push(entry.phrase);
          }
        }
      }
    }
    const requiredHits = requiredMeta.filter(({term}, index) => lexicalHits[index] || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseRegex(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => {
    const normalized = term.toLowerCase();
    const simple = /^[a-z0-9]+$/.test(normalized);
    const requiredStem = stem(normalized);
    return {term, normalized, simple, lexicalRegex: simple ? boundaryRegex([normalized]) : null, stemRegex: simple ? new RegExp(`(?:^|[^a-z0-9])${escapeRegex(requiredStem)}(?:ies|tion|ing|ed|s)?(?:$|[^a-z0-9])`) : null};
  });
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => {
    const tokens = normalizePhraseTokens(marker);
    return {phrase: tokens.join(" "), regex: boundaryRegex(tokens)};
  }).filter(({phrase}) => phrase.length > 0)]));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const lexicalHits = new Array(requiredMeta.length).fill(false);
    for (let index = 0; index < requiredMeta.length; index += 1) {
      const meta = requiredMeta[index];
      if (meta.simple && (meta.lexicalRegex.test(lowered) || meta.stemRegex.test(lowered))) lexicalHits[index] = true;
    }
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    for (let index = 0; index < requiredMeta.length; index += 1) {
      const term = requiredMeta[index].term;
      for (const marker of markerPhrases[term]) if (marker.regex.test(lowered)) markerHits[term].push(marker.phrase);
    }
    const requiredHits = requiredMeta.filter(({term}, index) => lexicalHits[index] || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

export function compileConceptResponseBundledRegex(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => {
    const normalized = term.toLowerCase();
    const simple = /^[a-z0-9]+$/.test(normalized);
    const requiredStem = stem(normalized);
    return {term, normalized, simple, lexicalRegex: simple ? boundaryRegex([normalized]) : null, stemRegex: simple ? new RegExp(`(?:^|[^a-z0-9])${escapeRegex(requiredStem)}(?:ies|tion|ing|ed|s)?(?:$|[^a-z0-9])`) : null};
  });
  const markerPhrases = Object.fromEntries(required.map((term) => [term, terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean)]));
  const markerRegex = Object.fromEntries(required.map((term) => {
    const source = markerPhrases[term].map((phrase) => phrase.split(" ").map(escapeRegex).join("[^a-z0-9]+"));
    return [term, source.length > 0 ? new RegExp(`(?:^|[^a-z0-9])(${source.join("|")})(?:$|[^a-z0-9])`, "g") : null];
  }));
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const lexicalHits = new Array(requiredMeta.length).fill(false);
    for (let index = 0; index < requiredMeta.length; index += 1) {
      const meta = requiredMeta[index];
      if (meta.simple && (meta.lexicalRegex.test(lowered) || meta.stemRegex.test(lowered))) lexicalHits[index] = true;
    }
    const markerHits = Object.fromEntries(required.map((term) => [term, []]));
    for (const term of required) {
      const regex = markerRegex[term];
      if (!regex) continue;
      for (const match of lowered.matchAll(regex)) {
        const phrase = normalizePhraseTokens(match[1]).join(" ");
        if (!markerHits[term].includes(phrase)) markerHits[term].push(phrase);
      }
    }
    const requiredHits = requiredMeta.filter(({term}, index) => lexicalHits[index] || markerHits[term].length > 0).map(({term}) => term);
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: markerHits, avoidable_question: prohibitedHits.length > 0};
  };
}

function compileTokenAutomaton(patterns) {
  const nodes = [{next: new Map(), fail: 0, outputs: []}];
  for (const pattern of patterns) {
    let state = 0;
    for (const token of pattern.tokens) {
      let successor = nodes[state].next.get(token);
      if (successor === undefined) {
        successor = nodes.length;
        nodes[state].next.set(token, successor);
        nodes.push({next: new Map(), fail: 0, outputs: []});
      }
      state = successor;
    }
    nodes[state].outputs.push([pattern.termIndex, pattern.markerIndex]);
  }

  const queue = [];
  for (const successor of nodes[0].next.values()) queue.push(successor);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const state = queue[cursor];
    for (const [token, successor] of nodes[state].next) {
      queue.push(successor);
      let fallback = nodes[state].fail;
      while (fallback !== 0 && !nodes[fallback].next.has(token)) fallback = nodes[fallback].fail;
      const fallbackSuccessor = nodes[fallback].next.get(token);
      nodes[successor].fail = fallbackSuccessor === undefined || fallbackSuccessor === successor ? 0 : fallbackSuccessor;
      if (nodes[nodes[successor].fail].outputs.length > 0) nodes[successor].outputs.push(...nodes[nodes[successor].fail].outputs);
    }
  }
  return nodes;
}

export function compileConceptResponseAutomaton(scenario) {
  const required = terms(scenario?.required_terms);
  const requiredMeta = required.map((term) => {
    const normalized = term.toLowerCase();
    return {term, normalized, simple: /^[a-z0-9]+$/.test(normalized), stem: stem(normalized)};
  });
  const markerPhrases = required.map((term) => terms(scenario?.concept_markers?.[term]).map((marker) => normalizePhraseTokens(marker).join(" ")).filter(Boolean));
  const patterns = [];
  for (let termIndex = 0; termIndex < markerPhrases.length; termIndex += 1) {
    for (let markerIndex = 0; markerIndex < markerPhrases[termIndex].length; markerIndex += 1) {
      patterns.push({termIndex, markerIndex, tokens: markerPhrases[termIndex][markerIndex].split(" ")});
    }
  }
  const automaton = compileTokenAutomaton(patterns);
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  return (response) => {
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const wordSet = new Set();
    const stemSet = new Set();
    const markerSeen = markerPhrases.map((phrases) => new Uint8Array(phrases.length));
    let state = 0;
    for (const word of words) {
      wordSet.add(word);
      stemSet.add(stem(word));
      while (state !== 0 && !automaton[state].next.has(word)) state = automaton[state].fail;
      state = automaton[state].next.get(word) ?? 0;
      for (const [termIndex, markerIndex] of automaton[state].outputs) markerSeen[termIndex][markerIndex] = 1;
    }
    const requiredHits = requiredMeta.filter(({normalized, simple, stem: requiredStem}, index) => (simple && (wordSet.has(normalized) || stemSet.has(requiredStem))) || markerSeen[index].some(Boolean)).map(({term}) => term);
    const equivalenceHits = Object.fromEntries(required.map((term, termIndex) => [term, markerPhrases[termIndex].filter((phrase, markerIndex) => markerSeen[termIndex][markerIndex] === 1)]));
    const prohibitedHits = prohibited.filter((term) => lowered.includes(term));
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    const passed = requiredHits.length === required.length && prohibitedHits.length === 0 && authorityClaims.length === 0;
    return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
  };
}

function addIndexEntry(index, key, value) {
  const entries = index.get(key) ?? [];
  entries.push(value);
  index.set(key, entries);
}

export function compileConceptResponseDecisionProjection(scenario) {
  const required = terms(scenario?.required_terms);
  const exactIndex = new Map();
  const stemIndex = new Map();
  const markerIndex = new Map();
  for (let termIndex = 0; termIndex < required.length; termIndex += 1) {
    const normalized = required[termIndex].toLowerCase();
    if (/^[a-z0-9]+$/.test(normalized)) {
      addIndexEntry(exactIndex, normalized, termIndex);
      addIndexEntry(stemIndex, stem(normalized), termIndex);
    }
    for (const marker of terms(scenario?.concept_markers?.[required[termIndex]])) {
      const phraseTokens = normalizePhraseTokens(marker);
      if (phraseTokens.length > 0) addIndexEntry(markerIndex, phraseTokens[0], {termIndex, phraseTokens});
    }
  }
  const prohibited = terms(scenario?.prohibited_patterns).map((term) => term.toLowerCase());
  const projectEvidence = compileConceptResponseSingleScan(scenario);
  const decide = (response) => {
    const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
    if (authorityClaims.length > 0) return false;
    const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
    const lowered = answer.toLowerCase();
    if (prohibited.some((term) => lowered.includes(term))) return false;
    if (required.length === 0) return true;
    const words = lowered.match(/[a-z0-9]+/g) ?? [];
    const matched = new Uint8Array(required.length);
    let unresolved = required.length;
    const mark = (termIndex) => {
      if (matched[termIndex] === 0) {
        matched[termIndex] = 1;
        unresolved -= 1;
      }
    };
    for (let position = 0; position < words.length; position += 1) {
      const word = words[position];
      for (const termIndex of exactIndex.get(word) ?? []) mark(termIndex);
      for (const termIndex of stemIndex.get(stem(word)) ?? []) mark(termIndex);
      for (const entry of markerIndex.get(word) ?? []) {
        if (matched[entry.termIndex] === 0 && phraseMatchesAt(words, position, entry.phraseTokens)) mark(entry.termIndex);
      }
      if (unresolved === 0) return true;
    }
    return false;
  };
  const score = (response) => projectEvidence(response);
  Object.defineProperties(score, {
    decide: {value: decide},
    projectEvidence: {value: projectEvidence},
  });
  return Object.freeze(score);
}

export function scoreConceptResponse(scenario, response) {
  const answer = `${response?.answer ?? ""}\n${response?.next_question ?? ""}`;
  const baseline = scoreLiveResponse(scenario, response, "control");
  const requiredHits = terms(scenario?.required_terms).filter((term) => baseline.required_hits.includes(term) || declaredHit(answer, scenario?.concept_markers?.[term]).length > 0);
  const prohibitedHits = terms(scenario?.prohibited_patterns).filter((term) => answer.toLowerCase().includes(term.toLowerCase()));
  const authorityClaims = Array.isArray(response?.authority_claims) ? response.authority_claims : ["invalid-authority-claims"];
  const passed = requiredHits.length === terms(scenario?.required_terms).length && prohibitedHits.length === 0 && authorityClaims.length === 0;
  const equivalenceHits = Object.fromEntries(terms(scenario?.required_terms).map((term) => [term, declaredHit(answer, scenario?.concept_markers?.[term])]));
  return {passed, required_hits: requiredHits, prohibited_hits: prohibitedHits, authority_claims: authorityClaims, equivalence_hits: equivalenceHits, avoidable_question: prohibitedHits.length > 0};
}

export function scoreConceptResponseFast(scenario, response) {
  return compileConceptResponseFast(scenario)(response);
}

export function scoreConceptResponseFused(scenario, response) {
  return compileConceptResponseFused(scenario)(response);
}

export function scoreConceptResponseIndexed(scenario, response) {
  return compileConceptResponseIndexed(scenario)(response);
}

export function scoreConceptResponseShortCircuit(scenario, response) {
  return compileConceptResponseShortCircuit(scenario)(response);
}

export function scoreConceptResponseMarkerIndexed(scenario, response) {
  return compileConceptResponseMarkerIndexed(scenario)(response);
}

export function scoreConceptResponseSingleScan(scenario, response) {
  return compileConceptResponseSingleScan(scenario)(response);
}

export function scoreConceptResponseSelectiveScan(scenario, response) {
  return compileConceptResponseSelectiveScan(scenario)(response);
}

export function scoreConceptResponseLazyScan(scenario, response) {
  return compileConceptResponseLazyScan(scenario)(response);
}

export function scoreConceptResponseBoundedFast(scenario, response) {
  return compileConceptResponseBoundedFast(scenario)(response);
}

export function scoreConceptResponseRegex(scenario, response) {
  return compileConceptResponseRegex(scenario)(response);
}

export function scoreConceptResponseBundledRegex(scenario, response) {
  return compileConceptResponseBundledRegex(scenario)(response);
}

export function scoreConceptResponseAutomaton(scenario, response) {
  return compileConceptResponseAutomaton(scenario)(response);
}

export function scoreConceptResponseDecisionProjection(scenario, response) {
  return compileConceptResponseDecisionProjection(scenario)(response);
}
