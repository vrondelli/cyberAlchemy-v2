export function evidenceJson(value) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean')
        return JSON.stringify(value);
    if (typeof value === 'number' && Number.isFinite(value))
        return JSON.stringify(value);
    if (Array.isArray(value))
        return '[' + value.map(evidenceJson).join(',') + ']';
    if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + evidenceJson(value[k])).join(',') + '}';
    throw Error('INVALID_RECONCILIATION_EVIDENCE');
}
