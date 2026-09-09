
const hash=location.hash;
location.replace(hash==='#home'?'/':hash==='#explore'?'/console-experience/':'/white-paper'+(hash.startsWith('#paper-')?hash:''));
