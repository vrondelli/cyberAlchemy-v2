import hashlib
import io
from pathlib import Path
import tarfile
import tempfile
import unittest
from archive import members, pack, unpack


class ArchiveTests(unittest.TestCase):
    def entry(self, path='root/file', data=b'content', **extra):
        return dict(path=path, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), mode=0o644, **extra)

    def test_rejects_unsafe_paths_and_links(self):
        for path in ('../escape', '/absolute', 'a/../escape', 'a//b', 'a\\b', './a'):
            with self.subTest(path=path), self.assertRaises(ValueError):
                members({'files':[self.entry(path)]})
        for target in ('/absolute', '../../escape', 'missing'):
            with self.subTest(target=target), self.assertRaises(ValueError):
                members({'files':[self.entry('root/link', kind='symlink', link_target=target)]})
        with self.assertRaises(ValueError):
            members({'files':[self.entry('a'), self.entry('a/b')]})

    def test_roundtrip_reproducible_with_symlink_and_executable(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'source'; source.mkdir()
            (source/'run').write_bytes(b'content'); (source/'run').chmod(0o755)
            (source/'alias').symlink_to('run')
            executable=self.entry('run'); executable['mode']=0o755
            link=self.entry('alias',kind='symlink',link_target='run');link['mode']=0o755
            closure={'files':[executable,link]}
            pack(source,closure,root/'one.tgz');pack(source,closure,root/'two.tgz')
            self.assertEqual((root/'one.tgz').read_bytes(),(root/'two.tgz').read_bytes())
            unpack(root/'one.tgz',closure,root/'unpacked')
            self.assertEqual((root/'unpacked/alias').read_bytes(),b'content')
            self.assertTrue((root/'unpacked/alias').is_symlink())
            self.assertEqual((root/'unpacked/run').stat().st_mode & 0o777,0o755)

    def test_rejects_unexpected_members_duplicate_and_tampered_content(self):
        cases=[ [('root/file',b'changed')], [('root/file',b'content'),('root/file',b'content')], [('root/file',b'content'),('../escape',b'bad')] ]
        for case in cases:
            with self.subTest(case=case), tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp)
                with tarfile.open(root/'bad.tgz','w:gz') as archive:
                    for name,data in case:
                        header=tarfile.TarInfo(name);header.size=len(data);header.mode=0o644
                        archive.addfile(header,io.BytesIO(data))
                with self.assertRaises(ValueError):
                    unpack(root/'bad.tgz',{'files':[self.entry()]},root/'out')
                self.assertFalse((root/'escape').exists())

    def test_rejects_archive_symlink_substitution_before_writing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            with tarfile.open(root/'bad.tgz','w:gz') as archive:
                header=tarfile.TarInfo('root/file');header.mode=0o644
                header.type=tarfile.SYMTYPE;header.linkname='../../escape'
                archive.addfile(header)
            with self.assertRaises(ValueError):
                unpack(root/'bad.tgz',{'files':[self.entry()]},root/'out')
            self.assertFalse((root/'out').exists())

    def test_refuses_existing_destination(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            with self.assertRaises(ValueError):
                unpack(root/'unused.tgz',{'files':[self.entry()]},root)


if __name__=='__main__':
    unittest.main()
