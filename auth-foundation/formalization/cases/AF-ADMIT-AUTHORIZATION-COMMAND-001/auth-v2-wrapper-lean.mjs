import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extractCurrentWrapper } from './auth-v2-wrapper-extract.mjs';

const q = JSON.stringify;
const fail = message => { throw new Error(`AUTH_V2_WRAPPER_LEAN:${message}`); };
const list = xs => `[${xs.join(', ')}]`;
const pair = ([a,b]) => `(${q(a)}, ${q(b)})`;
const own = (object, keys, name) => {
  if (!object || typeof object !== 'object' || Array.isArray(object) ||
      JSON.stringify(Object.keys(object).sort()) !== JSON.stringify([...keys].sort())) fail(`shape:${name}`);
};
const pairs = (rows,name) => {
  if (!Array.isArray(rows) || rows.some(row => !Array.isArray(row) || row.length !== 2 || row.some(x => typeof x !== 'string'))) fail(`pairs:${name}`);
  return list(rows.map(pair));
};
const atom = value => {
  if (value.kind === 'eq') {
    own(value,['kind','left','right'],'eq');
    if (typeof value.left !== 'string' || typeof value.right !== 'string') fail('eq-type');
    return `(QualifierAtom.eq ${q(value.left)} ${q(value.right)})`;
  }
  if (value.kind === 'nonempty' || value.kind === 'truthy') {
    own(value,['kind','path'],value.kind);
    if (typeof value.path !== 'string') fail('path-type');
    return `(QualifierAtom.${value.kind} ${q(value.path)})`;
  }
  fail('atom-kind');
};

export function renderWrapperLean(ir, { fixture = false } = {}) {
  if (!fixture) assert.deepStrictEqual(ir,extractCurrentWrapper(),'production IR must be freshly extracted from pinned wrapper bytes');
  own(ir,['schema_version','source_sha256','cargo_sha256','branches','prefixActions','authResolverDefault','routeResolverDefault','contextWiring','authQualifiers','routeQualifiers','candidateSuccessFields','candidateFallbackFields','authMapperFields','routeMapperFields','commandMapperFields','permissionMapperFields'],'subject');
  if (ir.schema_version !== 'auth-foundation.trusted-wrapper-ir/v1-candidate' ||
      !/^[0-9a-f]{64}$/.test(ir.source_sha256) || !/^[0-9a-f]{64}$/.test(ir.cargo_sha256)) fail('identity');
  own(ir.branches,['ready','deny'],'branches');
  const actions = row => {
    if (!Array.isArray(row) || row.some(x => !['callDownstream','returnDeny'].includes(x))) fail('actions');
    return list(row.map(x => `Action.${x}`));
  };
  if (typeof ir.authResolverDefault !== 'boolean' || typeof ir.routeResolverDefault !== 'boolean') fail('resolver-default');
  for (const name of ['authQualifiers','routeQualifiers']) if (!Array.isArray(ir[name])) fail(`qualifiers:${name}`);
  const rows = ['contextWiring','candidateSuccessFields','candidateFallbackFields','authMapperFields','routeMapperFields','commandMapperFields','permissionMapperFields'];
  const definitions = rows.map(name => `def ${name} : List (String × String) :=\n  ${pairs(ir[name],name)}`);
  return `-- GENERATED from exact source-extracted trusted wrapper bytes. Data only.
namespace AuthGeneratedWrapperIR

def sourceSha256 : String := ${q(ir.source_sha256)}
def cargoSha256 : String := ${q(ir.cargo_sha256)}

inductive Action where
  | callDownstream
  | returnDeny
deriving Repr, DecidableEq

structure Branches where
  ready : List Action
  deny : List Action
deriving Repr, DecidableEq

def authorizeBranches : Branches :=
  { ready := ${actions(ir.branches.ready)}, deny := ${actions(ir.branches.deny)} }

def authorizePrefixActions : List Action :=
  ${actions(ir.prefixActions)}

def authResolverDefault : Bool := ${ir.authResolverDefault}
def routeResolverDefault : Bool := ${ir.routeResolverDefault}

inductive QualifierAtom where
  | eq (left right : String)
  | nonempty (path : String)
  | truthy (path : String)
deriving Repr, DecidableEq

def authQualifiers : List QualifierAtom :=
  ${list(ir.authQualifiers.map(atom))}

def routeQualifiers : List QualifierAtom :=
  ${list(ir.routeQualifiers.map(atom))}

${definitions.join('\n\n')}

end AuthGeneratedWrapperIR
`;
}

export function emitCurrentWrapperLean() {
  const output = fileURLToPath(new URL('./AuthGeneratedWrapperIR.lean',import.meta.url));
  writeFileSync(output,renderWrapperLean(extractCurrentWrapper()));
  return output;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.stdout.write(`${emitCurrentWrapperLean()}\n`);
