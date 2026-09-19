import { Coach, CreateCoachInput } from "./coach.entity";

export type CoachRepository = {
  create(input: CreateCoachInput): Promise<Coach>;
  findById(id: string): Promise<Coach | null>;
  findByPrincipalId(principalId: string): Promise<Coach | null>;
  findAll(): Promise<Coach[]>;
};
