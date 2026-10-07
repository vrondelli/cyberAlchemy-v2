export const policy=Object.freeze({idle:900,absolute:28800,transaction:600,capacity:256});
export function isCurrent(row,time){return Boolean(row&&row.status==='active'&&time<Number(row.absolute)&&time<Number(row.last_activity)+policy.idle);}
export function authenticationIsCurrent(authTime,{issued,fresh,now}){return Number.isSafeInteger(authTime)&&authTime<=now&&authTime>=0&&(!fresh||authTime>=issued)&&now-authTime<=policy.absolute;}
