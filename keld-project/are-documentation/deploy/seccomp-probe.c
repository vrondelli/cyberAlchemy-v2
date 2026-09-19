#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <sys/ptrace.h>
#include <sys/syscall.h>
#include <sys/uio.h>
#include <unistd.h>

static int expect_eperm(const char *name, long result) {
  if (result == -1 && errno == EPERM) return 0;
  fprintf(stderr, "%s was not denied with EPERM: result=%ld errno=%d\n", name, result, errno);
  return 1;
}

int main(void) {
  char source = 'x', destination = 0;
  struct iovec local = {.iov_base = &destination, .iov_len = 1};
  struct iovec remote = {.iov_base = &source, .iov_len = 1};
  int failed = 0;
  errno = 0;
  failed |= expect_eperm("process_vm_readv", syscall(SYS_process_vm_readv, getpid(), &local, 1, &remote, 1, 0));
  errno = 0;
  failed |= expect_eperm("ptrace", ptrace(PTRACE_TRACEME, 0, 0, 0));
  if (!failed) puts("{\"ok\":true,\"denied\":[\"process_vm_readv\",\"ptrace\"],\"errno\":\"EPERM\"}");
  return failed;
}
