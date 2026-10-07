// Open questions: README.md#open-questions.
export interface RuntimeControls {
 scheduler?:{runtimeId:string;available:boolean;enabled:boolean};
 schema_version:'workspace-native-controls/v1';
 runtimeId:string;
 available:boolean;
 enabled:boolean;
 mode:'native-fixture';
 remaining:number|null;
 active:boolean;
 blockedReason:string|null;
 canReview:boolean;
 canLaunch:boolean;
 cancelLaunchIds:string[];
 state:unknown|null;
}
