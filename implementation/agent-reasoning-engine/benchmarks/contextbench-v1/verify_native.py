"""Run unchanged upstream evaluator on independent local controls. Open questions: README.md."""
import argparse, contextlib, hashlib, io, json, os, subprocess, sys, tempfile
from pathlib import Path

def run(upstream, output):
    sys.path.insert(0, str(upstream))
    from contextbench.evaluate import evaluate_instance
    from contextbench.parsers.gold import Gold
    from contextbench.extractors import available
    assert available(), 'Required tree-sitter parser unavailable'
    revision=subprocess.check_output(['git','-C',str(upstream),'rev-parse','HEAD'],text=True).strip()
    with tempfile.TemporaryDirectory(prefix='are-cb-native-') as temp:
        root=Path(temp)/'source';root.mkdir()
        source='def foo():\n    return 1\ndef bar():\n    return 2\n'
        (root/'a.py').write_text(source)
        subprocess.run(['git','init','-q',str(root)],check=True)
        subprocess.run(['git','-C',str(root),'add','a.py'],check=True)
        subprocess.run(['git','-C',str(root),'remote','add','origin',str(root)],check=True)
        subprocess.run(['git','-C',str(root),'-c','user.name=ARE fixture','-c','user.email=fixture@invalid','commit','-qm','fixture'],check=True)
        commit=subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()
        gold=Gold({'inst_id':'fixture','repo_url':str(root),'commit':commit,'init_ctx':[{'file':'a.py','start_line':1,'end_line':2}],'add_ctx':[]})
        def score(name, steps, final):
            pred={'instance_id':'fixture','repo_url':str(root),'commit':commit,'traj_data':{'pred_steps':[{'files':['a.py'],'spans':{'a.py':[{'start':s,'end':e}]}} for s,e in steps],'pred_files':['a.py'] if final else [],'pred_spans':{'a.py':[{'start':final[0],'end':final[1]}]} if final else {}}}
            log=io.StringIO()
            with contextlib.redirect_stderr(log): result=evaluate_instance('fixture',gold,pred,str(Path(temp)/'cache'))
            return {'name':name,'result':result}
        perfect=score('perfect',[(1,2)],(1,2))
        forgotten=score('delivered_then_displaced',[(1,2),(3,4)],(3,4))
        missing=score('missing_final',[(1,2)],None)
        for granularity in ['file','symbol','span','line']:
            assert perfect['result']['final'][granularity]['coverage']==1.0
            assert perfect['result']['final'][granularity]['precision']==1.0
        assert forgotten['result']['trajectory']['auc_coverage']['span']==1.0
        assert forgotten['result']['final']['span']['coverage']==0.0
        assert forgotten['result']['final']['symbol']['coverage']==0.0
        assert missing['result']['error']=='no_context_extracted'
        output.write_text(json.dumps({'status':'passed','upstream_revision':revision,'controls':[perfect,forgotten,missing],'claim_ceiling':'Offline scorer controls; not a live ContextBench result.','open_questions_ref':'README.md'},indent=2)+'\n')
        print('Three native evaluator controls passed.')

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--upstream',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();run(a.upstream,a.out)
