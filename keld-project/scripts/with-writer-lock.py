"""Hold a Linux advisory writer lock for the lifetime of the exec'd runtime."""
import fcntl
import os
import stat
import sys


def main():
    if len(sys.argv) < 3:
        raise SystemExit('Usage: with-writer-lock.py <lock-path> <command> [args...]')
    fd = os.open(sys.argv[1], os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        if not stat.S_ISREG(os.fstat(fd).st_mode):
            raise SystemExit('Writer lock must be a regular file')
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('customer.writer-already-running', file=sys.stderr)
            raise SystemExit(73)
        os.set_inheritable(fd, True)
        env = dict(os.environ, KELD_WRITER_LOCK_FD=str(fd))
        os.execvpe(sys.argv[2], sys.argv[2:], env)
    finally:
        os.close(fd)


if __name__ == '__main__':
    main()
