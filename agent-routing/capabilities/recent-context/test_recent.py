#!/usr/bin/env python3
"""Exercise recent-context behavior against isolated real Git repositories."""
import concurrent.futures
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("recent", ROOT / "recent.py")
R = importlib.util.module_from_spec(SPEC); SPEC.loader.exec_module(R)


class RecentContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="recent-context-test-")
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name) / "repository"
        self.repo.mkdir()
        self.env = {k:v for k,v in os.environ.items() if not k.startswith("GIT_")}
        self.env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                        GIT_AUTHOR_NAME="Fixture", GIT_AUTHOR_EMAIL="fixture@example.invalid",
                        GIT_COMMITTER_NAME="Fixture", GIT_COMMITTER_EMAIL="fixture@example.invalid")
        self.git("init", "-b", "main")
        self.git("config", "core.hooksPath", str(Path(self.temp.name) / "hooks"))

    def git(self, *args, ok=True, repo=None):
        p = subprocess.run(["git", "-C", str(repo or self.repo), *args], capture_output=True, env=self.env)
        if ok:
            self.assertEqual(p.returncode, 0, p.stderr)
        return p

    def put(self, path, text="fixture\n"):
        p = self.repo / path; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(text)

    def commit(self, subject="fixture"):
        self.git("add", "--all"); self.git("commit", "-m", subject)
        return self.git("rev-parse", "HEAD").stdout.decode().strip()

    def query(self, path=".", **kwargs):
        return R.query(self.repo, {"kind": "path", "paths": [path]}, **kwargs)

    def changes(self, result):
        return [change for commit in result["commits"] for change in commit["changes"]]

    def test_unborn_and_first_commit(self):
        self.assertEqual(self.query()["status"], "no_history")
        self.put("project/a.txt"); oid=self.commit()
        result=self.query("project")
        self.assertEqual(result["commits"][0]["oid"], oid)
        self.assertEqual(self.changes(result)[0]["status"], "A")

    def test_modified_deleted_and_odd_paths(self):
        names=["space file.txt", "line\nbreak.txt", "naïve.txt", "[literal]*.txt", "-option.txt"]
        for name in names: self.put(name)
        self.commit()
        self.assertEqual({x["path"] for x in self.changes(self.query())},set(names))
        self.put(names[0],"changed\n"); (self.repo/names[1]).unlink(); self.commit()
        self.assertEqual({x["status"] for x in self.query(limit=1)["commits"][0]["changes"]},{"M","D"})

    def test_rename_into_and_out_of_scope(self):
        self.put("one/a"); self.commit(); (self.repo/"two").mkdir()
        self.git("mv","one/a","two/b"); self.commit()
        for scope in ["one","two"]:
            change=self.query(scope,limit=1)["commits"][0]["changes"][0]
            self.assertEqual(change["previous_path"],"one/a")
            self.assertEqual(change["path"],"two/b")
            self.assertTrue(change["status"].startswith("R"))

    def test_scope_is_literal_and_boundary_aware(self):
        for name in ["app/a","application/b","[literal]*/c"]: self.put(name)
        self.commit()
        self.assertEqual([c["path"] for c in self.changes(self.query("app"))],["app/a"])
        self.assertEqual([c["path"] for c in self.changes(self.query("[literal]*"))],["[literal]*/c"])

    def test_empty_and_failed_commits(self):
        self.put("a"); first=self.commit()
        self.git("commit","--allow-empty","-m","empty")
        result=self.query(limit=1)
        self.assertEqual(result["commits"][0]["changes"],[])
        self.assertEqual(result["commits"][0]["subject"],"empty")
        hooks=Path(self.temp.name)/"hooks";hooks.mkdir()
        hook=hooks/"pre-commit";hook.write_text("#!/bin/sh\nexit 1\n");hook.chmod(0o755)
        head=self.git("rev-parse","HEAD").stdout
        self.put("b");self.git("add","b")
        self.assertNotEqual(self.git("commit","-m","must fail",ok=False).returncode,0)
        self.assertEqual(self.query()["source"]["head"],head.decode().strip())

    def test_worktree_status_and_read_only_query(self):
        self.put("a"); self.commit();self.put("a","staged\n");self.git("add","a");self.put("a","unstaged\n");self.put("untracked","new\n")
        index=self.repo/".git/index";before=index.read_bytes();head=self.git("rev-parse","HEAD").stdout
        status=self.git("status","--porcelain=v1","-z").stdout
        result=self.query(include_status=True)
        self.assertEqual(index.read_bytes(),before)
        self.assertEqual(self.git("rev-parse","HEAD").stdout,head)
        self.assertEqual(self.git("status","--porcelain=v1","-z").stdout,status)
        self.assertEqual({c["status"] for c in result["working_tree"]["changes"]},{"MM","??"})
        self.assertFalse((self.repo/".git/cyberalchemy").exists())

    def test_cache_miss_hit_stale_and_corrupt(self):
        self.put("a");self.commit()
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"miss")
        self.assertFalse((self.repo/".git/cyberalchemy").exists())
        self.assertEqual(self.query(refresh=True)["cache"]["status"],"refreshed")
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"hit")
        self.put("b");self.commit()
        stale=self.query(use_cache=True)
        self.assertEqual(stale["cache"]["status"],"stale")
        self.assertEqual(stale["commits"][0]["changes"][0]["path"],"b")
        cache=next((self.repo/".git/cyberalchemy/recent-context").glob("*.json"))
        cache.write_text("{bad json")
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"corrupt")

    def test_amend_reset_branch_and_detached_head(self):
        self.put("a");first=self.commit();self.query(refresh=True)
        self.git("commit","--amend","-m","amended")
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"stale")
        self.git("switch","-c","feature");self.query(refresh=True)
        self.git("switch","main")
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"stale")
        self.git("checkout","--detach",first)
        self.assertIsNone(self.query()["source"]["branch"])
        self.git("reset","--hard",first)
        self.assertEqual(self.query()["source"]["head"],first)

    def test_merge_uses_first_parent(self):
        self.put("base");self.commit();self.git("switch","-c","feature")
        self.put("feature/a");self.commit("feature change");self.git("switch","main")
        self.put("main/a");self.commit("main change");self.git("merge","--no-ff","feature","-m","merge feature")
        result=self.query(limit=1)
        self.assertEqual(len(result["commits"][0]["parents"]),2)
        self.assertEqual([c["path"] for c in self.changes(result)],["feature/a"])

    def test_rebase_invalidates_cache(self):
        self.put("base");self.commit();self.git("switch","-c","feature")
        self.put("feature");self.commit();self.git("switch","main");self.put("main");self.commit()
        self.git("switch","feature");old=self.query(refresh=True)["source"]["head"]
        self.git("rebase","main")
        result=self.query(use_cache=True)
        self.assertNotEqual(result["source"]["head"],old)
        self.assertEqual(result["cache"]["status"],"stale")

    def test_worktree_cache_isolation(self):
        self.put("a");self.commit();self.query(refresh=True)
        linked=Path(self.temp.name)/"linked"
        self.git("worktree","add","-b","other",str(linked))
        other=R.query(linked,{"kind":"path","paths":["."]},use_cache=True)
        self.assertEqual(other["cache"]["status"],"miss")
        R.query(linked,{"kind":"path","paths":["."]},refresh=True)
        self.assertEqual(self.query(use_cache=True)["source"]["branch"],"refs/heads/main")

    def test_limits_and_no_matching_recent_commit(self):
        for i in range(4): self.put(f"app/{i}")
        self.commit();self.put("elsewhere");self.commit()
        result=self.query(limit=1)
        self.assertTrue(result["history_truncated"])
        result=self.query("app",limit=1)
        self.assertEqual(result["commits"],[]);self.assertEqual(result["status"],"ok")
        result=self.query("app",max_files=2)
        self.assertEqual(len(self.changes(result)),2);self.assertTrue(result["files_truncated"])
        with self.assertRaises(R.Unavailable):self.query(limit=101)

    def test_gitlink_does_not_traverse(self):
        self.put("a");oid=self.commit()
        self.git("update-index","--add","--cacheinfo",f"160000,{oid},submodule")
        self.git("commit","-m","gitlink")
        change=self.query(limit=1)["commits"][0]["changes"][0]
        self.assertEqual(change["kind"],"gitlink")
        self.assertEqual(change["path"],"submodule")

    def test_environment_cannot_redirect_repository(self):
        self.put("a");oid=self.commit()
        with patch.dict(os.environ,{"GIT_DIR":"/not/a/repository","GIT_INDEX_FILE":"/tmp/not-the-index"}):
            self.assertEqual(self.query()["source"]["head"],oid)

    def test_invalid_scope_and_repository(self):
        for path in ["../outside","/etc",".git/config","a/../../b","a\\b"]:
            with self.subTest(path=path),self.assertRaises(R.Unavailable): self.query(path)
        with self.assertRaises(R.Unavailable):R.query(Path(self.temp.name),{"paths":["."]})

    def test_source_change_during_observation(self):
        self.put("a");self.commit()
        original=R.Git.source;calls=[]
        def change(git):
            value=original(git);calls.append(1)
            if len(calls)>1:value["head"]="0"*40
            return value
        with patch.object(R.Git,"source",change):
            result=self.query(refresh=True)
        self.assertEqual(result["status"],"stale")
        self.assertFalse(result["cache"]["written"])

    def test_concurrent_refresh_and_interrupted_write(self):
        self.put("a");self.commit()
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda _:self.query(refresh=True),range(2)))
        self.assertTrue(any(r["cache"]["written"] for r in results))
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"hit")
        with patch.object(R.os,"replace",side_effect=OSError("fixture interrupted write")):
            self.assertTrue(self.query(refresh=True)["cache"]["status"].startswith("unavailable"))
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"hit")
        self.assertEqual(list((self.repo/".git/cyberalchemy/recent-context").glob(".recent-*")),[])

    def test_cache_failure_does_not_change_commit_or_query(self):
        self.put("a");oid=self.commit()
        cache_root=self.repo/".git/cyberalchemy";cache_root.write_text("not a directory")
        result=self.query(refresh=True)
        self.assertTrue(result["cache"]["status"].startswith("unavailable"))
        self.assertEqual(self.query()["source"]["head"],oid)

    def test_cli_and_handoff_example(self):
        self.put("project/older.py");self.commit("older")
        self.put("project/target.py");oid=self.commit("implement the requested target")
        result=subprocess.run([sys.executable,str(ROOT/"recent.py"),"query","--repo",str(self.repo),"--path","project","--limit","1"],capture_output=True,text=True)
        self.assertEqual(result.returncode,0,result.stderr)
        brief=json.loads(result.stdout)
        change=brief["commits"][0]["changes"][0]
        self.assertEqual(change["path"],"project/target.py")
        self.assertEqual(brief["commits"][0]["oid"],oid)
        self.assertEqual((self.repo/change["path"]).read_text(),"fixture\n")
        self.assertFalse(brief["session_restored"])

    def test_shallow_boundary_is_not_a_root_commit(self):
        self.put("a");self.commit();self.put("b");self.commit()
        clone=Path(self.temp.name)/"shallow"
        self.git("clone","--depth","1",self.repo.as_uri(),str(clone))
        with self.assertRaises(R.Unavailable):
            R.query(clone,{"kind":"path","paths":["."]})

    def test_project_selection_and_ambiguity(self):
        self.put("chosen/profile.json","{}\n");self.put("chosen/README.md","source\n")
        self.put("unrelated/file");self.commit()
        entry={"entry_id":"chosen","name":"Chosen","kind":"project","aliases":["chosen project","shared runtime"],
               "root":"chosen","owner":"fixture owner","identity_refs":["PROJECT-CHOSEN"],
               "read_first":["chosen/profile.json","chosen/README.md"],"sources":[],"summary":"fixture","open_questions":[],"authority_effect":"none"}
        entry["sources"]=[{"path":path,"selector":"whole-file","sha256":hashlib.sha256((self.repo/path).read_bytes()).hexdigest()} for path in entry["read_first"]]
        index={"schema_ref":"schemas/agent-router.schema.json#/$defs/projectIndex","schema_version":"cav2-project-citation-index/v1",
               "index_id":"cav2.agent-routing.project-citations","visibility":"private","status":"candidate-read-model","authority_effect":"none",
               "coverage":"fixture","open_questions":[],"entries":[entry]}
        path=Path(self.temp.name)/"index.json";path.write_text(json.dumps(index))
        scope,error=R.scope_for_project("chosen project",self.repo,path)
        self.assertIsNone(error)
        view=R.query(self.repo,scope)
        self.assertFalse(any(c["path"].startswith("unrelated") for c in self.changes(view)))
        other={**entry,"entry_id":"other","name":"Other","identity_refs":["PROJECT-OTHER"]}
        index["entries"].append(other);path.write_text(json.dumps(index))
        scope,error=R.scope_for_project("shared runtime",self.repo,path)
        self.assertIsNone(scope);self.assertEqual(error["status"],"ambiguous")
        self.put("chosen/README.md","changed\n")
        self.assertEqual(R.scope_for_project("Chosen",self.repo,path)[1]["status"],"not_evaluable")

    def test_cache_shape_and_parent_symlink(self):
        self.put("a");self.commit();self.query(refresh=True)
        cache=next((self.repo/".git/cyberalchemy/recent-context").glob("*.json"))
        envelope=json.loads(cache.read_text());envelope["view"].pop("history_truncated")
        envelope["digest"]=R.digest(envelope["view"]);cache.write_text(json.dumps(envelope))
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"corrupt")
        self.query(refresh=True)
        target=Path(self.temp.name)/"moved-cache"
        cache.parent.rename(target);cache.parent.symlink_to(target,target_is_directory=True)
        self.assertEqual(self.query(use_cache=True)["cache"]["status"],"corrupt")
        self.assertTrue(self.query(refresh=True)["cache"]["status"].startswith("unavailable"))


if __name__ == "__main__":
    unittest.main()
