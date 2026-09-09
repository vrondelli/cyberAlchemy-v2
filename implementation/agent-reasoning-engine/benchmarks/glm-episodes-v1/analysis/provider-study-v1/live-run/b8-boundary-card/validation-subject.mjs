const need=(condition,code)=>{if(!condition)throw new Error(code);};
export function sliceInspection(text,offset=0,max_chars=1024){
 need(typeof text==='string','inspection-text-invalid');
 need(Number.isSafeInteger(offset)&&offset>=0&&offset<=text.length&&Number.isSafeInteger(max_chars)&&max_chars>=1&&max_chars<=1024,'inspection-range-invalid');
 const isLow=unit=>unit>=0xDC00&&unit<=0xDFFF;
 const isHigh=unit=>unit>=0xD800&&unit<=0xDBFF;
 const unitAt=i=>text.charCodeAt(i);

 // Reject an offset that begins inside a surrogate pair.
 need(!(offset>0&&offset<text.length&&isHigh(unitAt(offset-1))&&isLow(unitAt(offset))),'inspection-range-splits-unicode');

 let end=Math.min(text.length,offset+max_chars);
 // Move an interior end backward so it never ends inside a surrogate pair.
 if(end>offset&&end<text.length&&isHigh(unitAt(end-1))&&isLow(unitAt(end)))end--;

 // A nonempty read must make progress without splitting a pair.
 need(end>offset||offset===text.length,'inspection-range-splits-unicode');

 return {offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,eof:end===text.length,utf8:text.slice(offset,end)};
}
