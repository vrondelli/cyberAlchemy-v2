const need=(condition,code)=>{if(!condition)throw new Error(code);};
export function sliceInspection(text,offset=0,max_chars=1024){
 need(typeof text==='string','inspection-text-invalid');
 need(Number.isSafeInteger(offset)&&offset>=0&&offset<=text.length&&Number.isSafeInteger(max_chars)&&max_chars>=1&&max_chars<=1024,'inspection-range-invalid');
 const isHigh=u=>u>=0xD800&&u<=0xDBFF;
 const isLow=u=>u>=0xDC00&&u<=0xDFFF;
 // Offsets and lengths count UTF-16 code units. Reject an interior start.
 if(offset>0&&offset<text.length&&isHigh(text.charCodeAt(offset-1))&&isLow(text.charCodeAt(offset)))throw new Error('inspection-range-splits-unicode');

 let end=Math.min(text.length,offset+max_chars);
 // Move an interior end backward so it never lands inside a surrogate pair.
 while(end>offset&&end<text.length&&isHigh(text.charCodeAt(end-1))&&isLow(text.charCodeAt(end)))end--;
 // Reject a nonempty read that cannot make progress without splitting a pair; allow the empty slice exactly at EOF.
 need(end>offset||offset===text.length,'inspection-range-splits-unicode');
 return {offset_unit:'utf16-code-units',offset,next_offset:end,total_chars:text.length,eof:end===text.length,utf8:text.slice(offset,end)};
}
