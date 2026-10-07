#!/usr/bin/env python3
"""Hostile controls for the additive SQL source-use successor."""

from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("auth-v4b-sql-source-use-v14.py")
SPEC = importlib.util.spec_from_file_location("auth_v4b_sql_source_use_v14", SCRIPT)
assert SPEC and SPEC.loader
subject = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(subject)


class SqlSourceUseV14(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="auth-v14-sql-use-")
        self.addCleanup(self.temporary.cleanup)
        self.target_dir = Path(self.temporary.name)
        self.source = self.target_dir / "source.rs"
        self.sql = subject.v7.IMPL / "authorization-schema/migrations/0001_auth_state.sql"
        self.dep_path = self.target_dir / "source.d"
        self.dep_path.write_text(f"{self.dep_path}: {self.source} {self.sql}\n")

    def check(self) -> dict:
        return subject.classified_source_dependencies(
            self.dep_path, self.source, self.target_dir, self.target_dir)

    def test_literal_include_str_is_classified(self) -> None:
        self.source.write_text(f'const SCHEMA: &str = include_str!("{self.sql}");\n')
        result = self.check()
        self.assertEqual(result["data_dependency_count"], 1)
        self.assertEqual(result["approved_external_data_source_uses"],
                         {str(self.sql.relative_to(subject.v7.IMPL)): [str(self.source)]})

    def test_include_as_rust_source_fails_even_beside_valid_use(self) -> None:
        self.source.write_text(f'const SCHEMA: &str = include_str!("{self.sql}");\n'
                               f'include!("{self.sql}");\n')
        with self.assertRaisesRegex(ValueError, "executable or byte inclusion needs review"):
            self.check()

    def test_alternate_delimiters_and_comments_cannot_supply_fake_use(self) -> None:
        for form in (
            f'include_bytes!{{"{self.sql}"}};',
            f'include_bytes!["{self.sql}"];',
            f'include_bytes! /* split */ ("{self.sql}");',
        ):
            self.source.write_text(f'// include_str!("{self.sql}");\n{form}\n')
            with self.subTest(form=form), self.assertRaisesRegex(
                    ValueError, "executable or byte inclusion needs review"):
                self.check()
        self.source.write_text(f'/* include_str!("{self.sql}"); */\nfn normal() {{}}\n')
        with self.assertRaisesRegex(ValueError, "lacks literal include_str source use"):
            self.check()
        self.source.write_text(f'const TEXT: &str = "include_str!(\\"{self.sql}\\")";\n')
        with self.assertRaisesRegex(ValueError, "lacks literal include_str source use"):
            self.check()
        self.source.write_text(
            f'const SCHEMA: &str = include_str!("{self.sql}");\n'
            f'const Q1: char = \'"\';\n'
            f'const BYTES: &[u8] = include_bytes!{{"{self.sql}"}};\n'
            f'const Q2: char = \'"\';\n')
        with self.assertRaisesRegex(ValueError, "executable or byte inclusion needs review"):
            self.check()

    def test_nonliteral_and_module_source_forms_fail(self) -> None:
        self.source.write_text(f'const SCHEMA: &str = include_str!(concat!("{self.sql}"));\n')
        with self.assertRaisesRegex(ValueError, "nonliteral include_str needs review"):
            self.check()
        self.source.write_text(f'#[path = "{self.sql}"] mod hidden;\n'
                               f'const SCHEMA: &str = include_str!("{self.sql}");\n')
        with self.assertRaisesRegex(ValueError, "approved SQL used as Rust module source"):
            self.check()

    def test_dep_info_without_literal_use_fails(self) -> None:
        self.source.write_text("fn normal() {}\n")
        with self.assertRaisesRegex(ValueError, "lacks literal include_str source use"):
            self.check()

    def test_current_schema_uses_all_three_approved_sql_files_as_text(self) -> None:
        source = subject.v7.IMPL / "authorization-admission-service/src/schema.rs"
        sql = sorted(subject.v7.ALLOWED_EXTERNAL_DATA)
        self.dep_path.write_text(f"{self.dep_path}: {source} {' '.join(map(str, sql))}\n")
        result = subject.classified_source_dependencies(
            self.dep_path, source, source.parents[1], self.target_dir)
        self.assertEqual(set(result["approved_external_data_source_uses"]),
                         {str(path.relative_to(subject.v7.IMPL)) for path in sql})


if __name__ == "__main__":
    unittest.main()
