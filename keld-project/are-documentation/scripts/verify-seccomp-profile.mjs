import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const path = resolve(import.meta.dirname, '../deploy/seccomp-node.json');
const profile = JSON.parse(readFileSync(path, 'utf8'));
assert.equal(profile.defaultAction, 'SCMP_ACT_ERRNO', 'seccomp-default-deny-required');
assert.equal(profile.defaultErrnoRet, 1, 'seccomp-default-eperm-required');
assert.ok(Array.isArray(profile.archMap) && profile.archMap.length >= 2, 'seccomp-architecture-map-required');
assert.ok(Array.isArray(profile.syscalls) && profile.syscalls.length > 0, 'seccomp-rules-required');

const forbidden = new Set([
  'process_vm_readv', 'process_vm_writev', 'ptrace', 'kcmp', 'pidfd_getfd',
  'process_madvise', 'bpf', 'perf_event_open', 'userfaultfd', 'keyctl',
  'add_key', 'request_key', 'mount', 'umount2', 'pivot_root', 'setns',
  'unshare', 'reboot', 'swapon', 'swapoff', 'init_module', 'finit_module',
  'delete_module', 'acct', 'iopl', 'ioperm', 'settimeofday', 'stime',
  'clock_settime', 'clock_settime64', 'vhangup', 'syslog', 'open_by_handle_at',
]);
const allowed = new Set(profile.syscalls.filter(rule => rule.action === 'SCMP_ACT_ALLOW').flatMap(rule => rule.names));
for (const syscall of forbidden) assert.ok(!allowed.has(syscall), `seccomp-forbidden-allow:${syscall}`);
for (const syscall of ['read', 'write', 'exit', 'exit_group', 'futex', 'socket', 'connect', 'bind', 'listen', 'accept4']) {
  assert.ok(allowed.has(syscall), `seccomp-required-runtime-call-missing:${syscall}`);
}
assert.ok(profile.syscalls.some(rule => rule.action === 'SCMP_ACT_ERRNO' && rule.errnoRet === 38 && rule.names.includes('clone3')),
  'seccomp-clone3-enosys-fallback-required');
process.stdout.write(`${JSON.stringify({verified: true, default_action: profile.defaultAction, rules: profile.syscalls.length, allowed_syscalls: allowed.size})}\n`);
