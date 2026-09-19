import {useEffect,useState} from 'react';
import {articleHref,headings} from './documentationContent';
export function ManualContents({id,text,anchor,origin}:{id:string;text:string;anchor:string;origin:string}){
 const items=headings(text),[active,setActive]=useState(anchor),[expanded,setExpanded]=useState(()=>matchMedia('(min-width:1151px)').matches);
 useEffect(()=>{setActive(anchor);},[id,anchor]);
 useEffect(()=>{
  const observer=new IntersectionObserver(records=>{
   const visible=records.filter(record=>record.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
   if(visible[0])setActive(visible[0].target.id);
  },{rootMargin:'-80px 0px -60% 0px'});
  for(const item of headings(text)){const heading=document.getElementById(item.id);if(heading)observer.observe(heading);}
  return()=>observer.disconnect();
 },[id,text]);
 return <aside className="manual-contents"><details open={expanded} onToggle={event=>setExpanded(event.currentTarget.open)}><summary>On this page</summary><nav aria-label="On this page">{items.map(item=><a key={item.id} href={articleHref(id,item.id,origin)} aria-current={active===item.id?'location':undefined}>{item.title.replace(/`/g,'')}</a>)}</nav></details></aside>;
}
