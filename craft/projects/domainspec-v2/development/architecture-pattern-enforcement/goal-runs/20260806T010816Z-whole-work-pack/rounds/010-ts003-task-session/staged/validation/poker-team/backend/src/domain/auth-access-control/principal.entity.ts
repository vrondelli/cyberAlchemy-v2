export type PrincipalStatus = "ACTIVE" | "DISABLED";
export type SubjectType = "user" | "service" | "automation";

export type Principal = {
  id: string;
  subjectType: SubjectType;
  status: PrincipalStatus;
  roleKeys: string[];
  directPermissions: string[];
};
