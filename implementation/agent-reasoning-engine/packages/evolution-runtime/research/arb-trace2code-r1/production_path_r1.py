"""Java production-path parity with the frozen JS selector.

Open Questions: G01-DEFECTS4J-CALLER-CONTEXT-SCREEN-2026-10-06.md.
"""
from pathlib import PurePosixPath
import re


def production_path(path):
    return (path.endswith('.java')
            and not re.search(r'(^|/)(test|tests|testing|testsrc)(/|$)', path, re.I)
            and not re.match(r'^(Test.+|.+Tests?|.+TestCase)\.java$', PurePosixPath(path).name))
