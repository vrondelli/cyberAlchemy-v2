export function validateHttpBindingPolicy(value) {
    const p = value;
    if (!p || typeof p !== 'object' || Array.isArray(p) || Object.keys(p).sort().join(',') !== 'authentication,scope' ||
        !['https', 'loopback'].includes(p.scope) || !['bearer', 'none'].includes(p.authentication) ||
        p.authentication === 'none' && p.scope !== 'loopback')
        throw Error('INVALID_BINDING_POLICY');
    return { scope: p.scope, authentication: p.authentication };
}
