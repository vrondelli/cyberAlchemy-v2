import {chromium} from 'playwright';
export const browserHome=new URL('../.runtime/browser-home/',import.meta.url).pathname;
export function browserOptions(headless=true){return {headless,env:{...process.env,HOME:browserHome},ignoreDefaultArgs:['--disable-dev-shm-usage'],args:[]};}
export async function launchBrowser(){return chromium.launch(browserOptions());}
