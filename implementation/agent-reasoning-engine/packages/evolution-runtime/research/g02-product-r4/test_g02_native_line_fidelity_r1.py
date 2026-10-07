import io
import runpy
import unittest
from pathlib import Path
from unittest.mock import patch

native = runpy.run_path(str(Path(__file__).with_name('audit-g02-r11-native-line-fidelity-r1.py')))['load_native']()


class NativeLineTest(unittest.TestCase):
    def read(self, raw, start, end):
        with patch('builtins.open', lambda *args, **kwargs: io.BytesIO(raw)):
            return native('fixture', start, end)

    def test_terminal_newline(self):
        self.assertEqual(self.read(b'a\nb\n', 1, 3), (0, 3))

    def test_end_clamps_to_eof(self):
        self.assertEqual(self.read(b'a\nb', 2, 100), (2, 2))

    def test_missing_start_is_dropped(self):
        self.assertIsNone(self.read(b'a\nb', 3, 3))

    def test_missing_file(self):
        with patch('builtins.open', side_effect=FileNotFoundError()):
            self.assertIsNone(native('missing', 1, 30))


if __name__ == '__main__':
    unittest.main()
