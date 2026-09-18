import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
export const root=fileURLToPath(new URL('.',import.meta.url));
export const source=resolve(process.env.KELD_VIDEO_SOURCE??'/mnt/c/Users/vlad_/Downloads/keld-video');
export const output=resolve(root,'output');
export const cache=resolve(root,'../../.cache/keld-video-098');
export {ffmpeg};
export async function init(){await mkdir(output,{recursive:true});await mkdir(cache,{recursive:true});}
export async function json(path,value){await writeFile(path,JSON.stringify(value,null,2)+'\n');}
export async function readJSON(path){return JSON.parse(await readFile(path,'utf8'));}
export async function run(binary,args,{capture=false}={}) {
  return new Promise((yes,no)=>{
    const p=spawn(binary,args,{stdio:['ignore',capture?'pipe':'ignore','pipe']});let stdout=[],stderr='';
    p.stdout?.on('data',b=>stdout.push(b));p.stderr.on('data',b=>{stderr=(stderr+b).slice(-16000);});
    p.on('error',no);p.on('close',code=>code===0?yes(capture?Buffer.concat(stdout):stderr):no(Error(`${binary} exited ${code}: ${stderr}`)));
  });
}
export async function probe(file){return JSON.parse((await run(ffprobe.path,['-v','error','-show_format','-show_streams','-of','json',file],{capture:true})).toString());}
