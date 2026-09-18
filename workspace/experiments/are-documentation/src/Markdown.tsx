import {countPerformance} from './performanceMetrics';
import React from 'react';
import {resolveLink,slug} from './documentationContent';
// Deliberately render a safe Markdown subset as React elements. Raw HTML is text.
// The content validator rejects unsupported block constructs in published files.
export function Inline({text,doc,origin='',onDocument}:{text:string;doc:string;origin?:string;onDocument?:(id:string,anchor:string)=>void}){
 const parts=text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
 return <>{parts.map((s,i)=>{if(s.startsWith('`'))return <code key={i}>{s.slice(1,-1)}</code>;if(s.startsWith('**'))return <strong key={i}>{s.slice(2,-2)}</strong>;const m=s.match(/^\[([^\]]+)\]\(([^)]+)\)$/);if(m){const href=resolveLink(m[2],doc,origin);return href?<a key={i} href={href} onClick={e=>{if(onDocument&&href.startsWith('#')){e.preventDefault();const p=new URLSearchParams(href.slice(1));onDocument(p.get('doc')!,p.get('anchor')??'');}}}><Inline text={m[1]} doc={doc}/></a>:<span key={i} className="unavailable-reference" title="This reference is not in the public documentation preview">{m[1].replace(/`/g,'')} <small>(reference not published)</small></span>;}return s;})}</>;
}
export const Markdown=React.memo(function Markdown({text,doc,origin='',prefix='',onDocument}:{text:string;doc:string;origin?:string;prefix?:string;onDocument?:(id:string,anchor:string)=>void}){
 countPerformance('markdown.parse');
 const lines=text.split('\n'),blocks:React.ReactNode[]=[];let i=0;
 const inline=(s:string)=><Inline text={s} doc={doc} origin={origin} onDocument={onDocument}/>;
 while(i<lines.length){const line=lines[i];if(!line.trim()){i++;continue;}
 const fence=line.match(/^(```|~~~)(\w*)/);if(fence){const body:string[]=[];i++;while(i<lines.length&&!lines[i].startsWith(fence[1]))body.push(lines[i++]);i++;blocks.push(<pre key={i} aria-label={fence[2]==='mermaid'?'Diagram source':undefined}><code>{body.join('\n')}</code></pre>);continue;}
 const h=line.match(/^(#{1,6}) (.+)/);if(h){i++;if(h[1].length===1)continue;const Tag=`h${Math.min(6,h[1].length)}` as 'h2';blocks.push(<Tag key={i} id={prefix+slug(h[2])} tabIndex={-1}>{inline(h[2])}</Tag>);continue;}
 if(line.startsWith('|')&&lines[i+1]?.match(/^\|[\s:|-]+\|$/)){const cells=(l:string)=>l.slice(1,-1).split('|').map(c=>c.trim());const headers=cells(line);i+=2;const rows:string[][]=[];while(lines[i]?.startsWith('|'))rows.push(cells(lines[i++]));blocks.push(<div className="table-scroll" key={i} tabIndex={0}><table><thead><tr>{headers.map((c,j)=><th key={j}>{inline(c)}</th>)}</tr></thead><tbody>{rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table></div>);continue;}
 if(/^(?:- |\d+\. )/.test(line)){const ordered=/^\d/.test(line),items:string[]=[];while(i<lines.length&&/^(?:- |\d+\. )/.test(lines[i])){let item=lines[i++].replace(/^(?:- |\d+\. )/,'');while(lines[i]?.match(/^ {2,}\S/))item+=' '+lines[i++].trim();items.push(item);}const List=ordered?'ol':'ul';blocks.push(<List key={i}>{items.map((s,j)=><li key={j}>{inline(s)}</li>)}</List>);continue;}
 const para=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^(#|```|~~~|\||- |\d+\. )/.test(lines[i]))para.push(lines[i++]);blocks.push(<p key={i}>{inline(para.join(' '))}</p>);
 }
 return <>{blocks}</>;
});
