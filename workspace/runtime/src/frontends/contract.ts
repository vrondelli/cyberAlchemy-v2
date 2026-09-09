import type {ComponentType} from 'react';
// Open questions: README.md#open-questions.
export interface FrontendProps {
 path: string;
 navigate: (path:string)=>void;
 href: (path:string)=>string;
}
export interface FrontendModule { Component:ComponentType<FrontendProps>; styles:string }
export interface FrontendRegistration {
 id:string;
 label:string;
 icon:"runs" | "dashboard" | "explore" | "foundation" | "ontology" | "essays" | "chat";
 mountPath:string;
 load:()=>Promise<FrontendModule>;
}
