// Installed dependency evidence, not a benchmark score. Open Questions: README.md.
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
const root='/home/vlad_/.local/share/are-toolchains/defects4j-v3';
const framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1';
const pin='6d54320e0db5a357f9ab38a8e4d2e5aead7e1c09';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
if(run('git',['-C',framework,'rev-parse','HEAD'])!==pin)throw Error('framework pin drift');
if(sha(readFileSync(framework+'/framework/core/Project.pm'))!=='b62cef271539edf2cc079853146a2b869d92ae4df626a6537b5c1543cadfd901')throw Error('fixture implementation drift');
const modules=['DBD::CSV','DBI','JSON','JSON::Parse','List::Util','Perl::Critic','String::Interpolate','URI'];
const perl=JSON.parse(run('perl',['-MJSON','-e',
  'my %v; for my $m (@ARGV) { eval "require $m"; die $@ if $@; $v{$m}=$m->VERSION // "unknown"; } print JSON::encode_json({perl=>$^V."",modules=>\\%v});',...modules]));
const downloads=['temurin11.tar.gz','App-cpanminus-1.7048.tar.gz','unzip_6.0-29ubuntu1_amd64.deb','libcrypt-dev_4.5.1-1_amd64.deb','libcrypt1_4.5.1-1_amd64.deb'].map(name=>{
  const bytes=readFileSync(root+'/downloads/'+name);return {name,bytes:bytes.length,sha256:sha(bytes)};
});
if(!statSync(root+'/logs/framework-smoke.log').size)throw Error('missing framework smoke evidence');
const receipt={schema:'are.defects4j-user-runtime/v1',verified_at:new Date().toISOString(),framework_pin:pin,root,framework,perl,downloads,
  dependency_lock_scope:'JDK, cpanminus and native payloads pinned; transitive CPAN and upstream framework resources version-observed, not fully content-locked',
  host_dependencies:['Ubuntu x86_64 glibc/runtime libraries','installed Perl 5.40','Git','shared repository native compiler'],
  verified_scope:'JxPath Git-backed fixture tooling; not all project builds or Subversion-backed projects',
  open_questions_owner:'tools/toolchain/README.md and G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md',
  gold_boundary:'framework info and checkout are trusted preparation only; raw logs and generated properties are not model context'};
writeFileSync(root+'/INSTALLATION.json',JSON.stringify(receipt,null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({runtime_verified:true,framework_pin:pin,perl_modules:Object.keys(perl.modules).length}));
