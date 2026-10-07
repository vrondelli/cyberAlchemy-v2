export function prepareRequirementEntry(text, confirmed) {
  const requirements = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (requirements.length && !confirmed) return {ok: false, reason: "confirmation-required"};
  const encoder = new TextEncoder();
  if (requirements.length > 64 || new Set(requirements).size !== requirements.length
    || requirements.some(line => encoder.encode(line).length > 2048)
    || encoder.encode(JSON.stringify(requirements)).length > 16384) {
    return {ok: false, reason: "invalid-list"};
  }
  return {ok: true, ...(confirmed ? {requirements} : {})};
}
