export type NationId = string;

export interface Nation {
  readonly id: NationId;
  readonly name: string;
  readonly code: string;
}
