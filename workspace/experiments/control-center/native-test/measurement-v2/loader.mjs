import {specURL,measurementSource} from '../campaign/measurement-loader.mjs';

export function isMeasurementSpec(url) {
  try {
    const parsed=new URL(url);
    parsed.search='';parsed.hash='';
    return parsed.href===specURL;
  } catch {return false;}
}
export async function load(url,context,nextLoad) {
  const result=await nextLoad(url,context);
  if(!isMeasurementSpec(url))return result;
  return {...result,source:measurementSource(Buffer.from(result.source).toString('utf8'))};
}
