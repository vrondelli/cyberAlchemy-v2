// Presentation only: callback parameters are not proof of a credential change.
// Open questions and pinned-template provenance: security/themes/README.md.
export async function bootAccountConsole(entryModuleUrl) {
 const url=new URL(window.location.href);
 const returned=[url.searchParams,new URLSearchParams(url.hash.slice(1))].some(params=>
  params.getAll('kc_action_status').length===1&&params.get('kc_action_status')==='success'&&
  params.getAll('code').length===1&&params.get('code')&&
  params.getAll('state').length===1&&params.get('state'));
 if(!returned) return import(entryModuleUrl);
 // Our issuer listener revokes sessions on credential changes. Do not try to
 // establish another session with the now-invalid action authorization code.
 // Always require the real OIDC flow to decide authentication on the next visit.
 window.history.replaceState(null,'',url.pathname);
 const main=document.createElement('main');
 main.style.cssText='max-width:42rem;margin:10vh auto;padding:2rem;font:18px/1.6 system-ui';
 const title=document.createElement('h1');title.textContent='Sign in to continue';
 const text=document.createElement('p');
 text.textContent='For your security, sign in again after changing your credentials. You can then review your saved authenticators.';
 const link=document.createElement('a');link.href=url.pathname;link.textContent='Sign in again';
 link.style.cssText='display:inline-block;padding:12px 20px;background:#064f97;color:white;border-radius:4px';
 main.append(title,text,link);document.getElementById('app').replaceChildren(main);
}
