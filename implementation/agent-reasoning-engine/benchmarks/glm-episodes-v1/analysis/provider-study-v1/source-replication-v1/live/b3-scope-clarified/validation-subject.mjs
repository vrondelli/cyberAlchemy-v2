const need=(condition,code)=>{if(!condition)throw new Error(code);};
export function sliceInspection(text,offset=0,max_chars=1024){
 need(typeof text==='string','inspection-text-invalid');
 need(Number.isSafeInteger(offset)&&offset>=0&&offset<=text.length&&Number.isSafeInteger(max_chars)&&max_chars>=1&&max_chars<=1024,'inspection-range-invalid');
 const splitPair=position=>position>0&&position<text.length&&/[\uD800-\uDBFF]/.test(text[position-1])&&/[\uDC00-\uDFFF]/.test(text[position]);
 need(!splitPair(offset),'inspection-range-splits-unicode');
 let end=Math.min(text.length,offset+max_chars);
 if(splitPair(end))end-=1;

 need(end>offset||offset===text.length,'inspection-range-splits-unicode');
 return {offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,eof:end===text.length,utf8:text.slice(offset,end)};
}
