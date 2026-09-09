#!/usr/bin/env python3
"""Real Git lifecycle tests; all installation effects are in temporary repos."""
import concurrent.futures
import json
import hashlib
import shutil
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import hooks as H
import recent as R


class HookTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix='recent hook $ space-')
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)/'repo'; self.repo.mkdir()
        self.env = {k:v for k,v in os.environ.items() if not k.startswith('GIT_')}
        self.env.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_AUTHOR_NAME='Test', GIT_COMMITTER_NAME='Test',
                        GIT_AUTHOR_EMAIL='test@example.invalid', GIT_COMMITTER_EMAIL='test@example.invalid')
        self.git('init', '-b', 'main')
        self.git('config', 'core.hooksPath', '.hooks')

    def git(self, *args, repo=None, ok=True):
        p = subprocess.run(['git','-C',str(repo or self.repo),*args],env=self.env,capture_output=True,text=True)
        if ok: self.assertEqual(p.returncode,0,p.stderr)
        return p

    def commit(self, repo=None):
        root=repo or self.repo
        (root/'file').write_text('content')
        self.git('add','file',repo=root)
        return self.git('commit','--allow-empty','-m','test',repo=root)

    def install(self, **kwargs):
        return H.install(self.repo, None, ['.'], **kwargs)

    def test_install_commit_cache_and_uninstall(self):
        state=self.install()
        self.assertTrue(state['changed'])
        self.assertEqual(self.git('config','core.hooksPath').stdout.strip(),'.hooks')
        self.commit()
        view=R.query(self.repo,{'kind':'path','paths':['.']},use_cache=True)
        self.assertEqual(view['cache']['status'],'hit')
        self.assertEqual(view['commits'][0]['oid'],self.git('rev-parse','HEAD').stdout.strip())
        self.assertTrue(H.uninstall(self.repo)['changed'])
        self.assertFalse(H.uninstall(self.repo)['changed'])
        self.assertEqual(R.query(self.repo,{'kind':'path','paths':['.']},use_cache=True)['cache']['status'],'hit')

    def test_repeated_install_and_conflicting_configuration(self):
        state=self.install(); hook=Path(state['hook']); before=hook.read_bytes()
        self.assertFalse(self.install()['changed'])
        with self.assertRaises(R.Unavailable): self.install(limit=5)
        self.assertEqual(hook.read_bytes(),before)

    def test_foreign_hook_preserved(self):
        hook=self.repo/'.hooks/post-commit';hook.parent.mkdir()
        hook.write_text('#!/bin/sh\necho existing\n');hook.chmod(0o755)
        original=hook.read_bytes()
        for fn in [self.install,lambda:H.uninstall(self.repo)]:
            with self.assertRaises(R.Unavailable): fn()
        self.assertEqual(hook.read_bytes(),original)

    def test_modified_owned_hook_preserved(self):
        hook=Path(self.install()['hook']);hook.write_bytes(hook.read_bytes()+b'# local change\n')
        before=hook.read_bytes()
        with self.assertRaises(R.Unavailable): H.uninstall(self.repo)
        self.assertEqual(hook.read_bytes(),before)

    def test_symlink_and_external_directory_rejected(self):
        external=Path(self.tmp.name)/'external';external.mkdir()
        (self.repo/'.hooks').symlink_to(external,target_is_directory=True)
        with self.assertRaises(R.Unavailable): self.install()
        self.assertEqual(list(external.iterdir()),[])
        (self.repo/'.hooks').unlink()
        self.git('config','core.hooksPath',str(external))
        with self.assertRaises(R.Unavailable): self.install()
        self.assertEqual(list(external.iterdir()),[])

    def test_nonexecutable_hook_not_silently_reenabled(self):
        hook=Path(self.install()['hook']);hook.chmod(0o644)
        self.assertEqual(H.inspect(hook)['status'],'disabled')
        with self.assertRaises(R.Unavailable): self.install()
        H.uninstall(self.repo)

    def test_failed_refresh_keeps_commit_successful(self):
        state=self.install()
        config=state['config']; config['sources']={}
        hook=Path(state['hook']);hook.write_bytes(H.render(config))
        result=self.commit()
        self.assertIn('refresh failed',result.stderr)
        self.assertTrue(self.git('rev-parse','HEAD').stdout.strip())

    def test_failed_commit_does_not_refresh(self):
        state=self.install();self.commit()
        view=R.query(self.repo,{'kind':'path','paths':['.']},use_cache=True)
        source=view['source']['head']
        pre=Path(state['hook']).with_name('pre-commit');pre.write_text('#!/bin/sh\nexit 1\n');pre.chmod(0o755)
        self.assertNotEqual(self.git('commit','--allow-empty','-m','blocked',ok=False).returncode,0)
        self.assertEqual(R.query(self.repo,{'kind':'path','paths':['.']},use_cache=True)['source']['head'],source)

    def test_limits_and_literal_scope_cache_match(self):
        H.install(self.repo,None,['[literal]*'],limit=3,max_files=7)
        (self.repo/'[literal]*').mkdir();(self.repo/'[literal]*/a').write_text('a')
        self.git('add','--all');self.git('commit','-m','literal')
        result=R.query(self.repo,{'kind':'path','paths':['[literal]*']},limit=3,max_files=7,use_cache=True)
        self.assertEqual(result['cache']['status'],'hit')
        self.assertEqual(result['commits'][0]['changes'][0]['path'],'[literal]*/a')

    def test_concurrent_install_never_overwrites(self):
        def attempt():
            try: return self.install()['status']
            except OSError: return 'busy'
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda _:attempt(),range(2)))
        self.assertIn('installed',results)
        self.assertEqual(H.inspect(self.repo/'.hooks/post-commit')['status'],'installed')

    def test_linked_worktree_does_not_refresh_selected_worktree(self):
        self.git('config','--unset','core.hooksPath')
        self.commit();self.install();self.commit()
        other=Path(self.tmp.name)/'linked'
        self.git('worktree','add','-b','other',str(other))
        self.commit(repo=other)
        self.assertEqual(R.query(other,{'kind':'path','paths':['.']},use_cache=True)['cache']['status'],'miss')
        with self.assertRaises(R.Unavailable): H.uninstall(other)
        self.assertEqual(H.inspect(self.repo/'.git/hooks/post-commit')['status'],'installed')

    def test_invalid_selection_and_status_no_effects(self):
        for projects, paths in [(None,None),(['does-not-exist'],None),(None,['../escape'])]:
            with self.assertRaises(R.Unavailable): H.install(self.repo,projects,paths)
        cmd=[sys.executable,'-B',str(H.ROOT/'hooks.py'),'status','--repo',str(self.repo)]
        p=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr)
        self.assertEqual(json.loads(p.stdout)['status'],'not-installed')
        self.assertFalse((self.repo/'.hooks').exists())

    def test_named_project_refresh_and_resolution_drift(self):
        router=Path(self.tmp.name)/'routing'
        package=router/'capabilities/recent-context';package.mkdir(parents=True)
        for name in ['hooks.py','recent.py']: shutil.copyfile(H.ROOT/name,package/name)
        (router/'scripts').mkdir()
        (router/'schemas').mkdir()
        shutil.copyfile(R.ROUTER_ROOT/'schemas/agent-router.schema.json',router/'schemas/agent-router.schema.json')
        shutil.copyfile(R.ROUTER_ROOT/'scripts/locate.py',router/'scripts/locate.py')
        (self.repo/'chosen').mkdir();(self.repo/'chosen/README.md').write_text('source')
        entry={'entry_id':'chosen','name':'Chosen','kind':'project','aliases':['chosen project'],
               'root':'chosen','owner':'fixture','identity_refs':['PROJECT-CHOSEN'],
               'read_first':['chosen/README.md'],'sources':[{'path':'chosen/README.md','selector':'whole-file',
               'sha256':hashlib.sha256((self.repo/'chosen/README.md').read_bytes()).hexdigest()}],
               'summary':'fixture','open_questions':[],'authority_effect':'none'}
        index=json.loads((R.ROUTER_ROOT/'project-index.json').read_text());index['entries']=[entry]
        (router/'project-index.json').write_text(json.dumps(index))
        cmd=[sys.executable,'-B',str(package/'hooks.py'),'install','--repo',str(self.repo),'--project','Chosen']
        p=subprocess.run(cmd,capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr)
        self.git('add','--all');self.git('commit','-m','project')
        query=[sys.executable,'-B',str(package/'recent.py'),'query','--repo',str(self.repo),'--project','Chosen','--cache']
        p=subprocess.run(query,capture_output=True,text=True)
        self.assertEqual(json.loads(p.stdout)['cache']['status'],'hit')
        (self.repo/'other').mkdir()
        entry['root']='other'; (router/'project-index.json').write_text(json.dumps(index))
        result=self.git('commit','--allow-empty','-m','scope drift')
        self.assertIn('refresh failed',result.stderr)
        p=subprocess.run(query,capture_output=True,text=True)
        self.assertEqual(json.loads(p.stdout)['cache']['status'],'miss')

if __name__=='__main__': unittest.main()
