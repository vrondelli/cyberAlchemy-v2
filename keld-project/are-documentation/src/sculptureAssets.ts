export const sculptureAssets={
 objective:{file:'goal',label:'Your goal'},context:{file:'context',label:'Useful context'},
 agent:{file:'action',label:'Agent & tools'},evidence:{file:'evidence',label:'Evidence'},
 decision:{file:'comparison',label:'Next step'},boundary:{file:'boundary',label:'Permissions'},
 state:{file:'state',label:'Progress'},outcome:{file:'outcome',label:'Finish or ask'},
 evolution:{file:'refinement',label:'Refine'},language:{file:'language',label:'Your language'},
 adapters:{file:'adapters',label:'Connections'},
} as const;
export type SculptureId=keyof typeof sculptureAssets;
export const coreSculptures:SculptureId[]=['objective','context','agent','evidence','decision','boundary','state','outcome'];
export function sculptureAsset(id:string){return Object.hasOwn(sculptureAssets,id)?sculptureAssets[id as SculptureId]:undefined}
export const sculptureUrl=(file:string)=>`${import.meta.env.BASE_URL}assets/light-sculptures/${file}.webp`;
export const componentHref=(id:string)=>`#view=continuity&node=${encodeURIComponent(id)}`;
