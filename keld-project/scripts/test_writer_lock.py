import pathlib
import selectors
import subprocess
import tempfile
import unittest

HELPER = pathlib.Path(__file__).with_name('with-writer-lock.py')


class WriterLockTest(unittest.TestCase):
    def test_live_writer_excludes_second_and_sigkill_releases(self):
        with tempfile.TemporaryDirectory() as tmp:
            lock = pathlib.Path(tmp) / 'writer.flock'
            command = ['python3', str(HELPER), str(lock), 'node', '-e']
            child = subprocess.Popen(command + ["console.log('ready');setInterval(()=>{},1000)"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            try:
                with selectors.DefaultSelector() as selector:
                    selector.register(child.stdout, selectors.EVENT_READ)
                    self.assertTrue(selector.select(10), 'runtime did not start')
                    self.assertEqual(child.stdout.readline(), b'ready\n')
                inode = lock.stat().st_ino
                blocked = subprocess.run(command + [''], capture_output=True, timeout=10)
                self.assertEqual(blocked.returncode, 73, blocked.stderr)
                child.kill()
                child.wait(timeout=10)
                restarted = subprocess.run(command + [''], capture_output=True, timeout=10)
                self.assertEqual(restarted.returncode, 0, restarted.stderr)
                self.assertEqual(lock.stat().st_ino, inode)
            finally:
                if child.poll() is None:
                    child.kill()
                    child.wait(timeout=10)
                child.stdout.close()
                child.stderr.close()

    def test_symlink_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = pathlib.Path(tmp) / 'target'
            target.write_text('preserve')
            lock = pathlib.Path(tmp) / 'lock'
            lock.symlink_to(target)
            result = subprocess.run(['python3', str(HELPER), str(lock), 'node', '-e', ''], capture_output=True, timeout=10)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(target.read_text(), 'preserve')


if __name__ == '__main__':
    unittest.main()
