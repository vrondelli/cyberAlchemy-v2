"""Expose private WebKit helpers at their compiled path in one namespace. Questions: README.md."""
import os,sys
from pathlib import Path
if len(sys.argv)<2:sys.exit('Usage: run-desktop-webview COMMAND [ARGS...]')
libs='/usr/lib/x86_64-linux-gnu'
helpers=Path(os.environ['PKG_CONFIG_SYSROOT_DIR'])/'usr/lib/x86_64-linux-gnu/webkit2gtk-4.1'
if not (helpers/'WebKitNetworkProcess').is_file():sys.exit('Private WebKit helpers missing')
args=['bwrap','--die-with-parent','--ro-bind','/','/','--bind','/tmp','/tmp','--bind',str(Path.home()),str(Path.home()),'--dev-bind','/dev','/dev','--overlay-src',libs,'--tmp-overlay',libs,'--ro-bind',str(helpers),libs+'/webkit2gtk-4.1',*sys.argv[1:]]
os.execvp(args[0],args)
