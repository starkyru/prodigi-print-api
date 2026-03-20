import type { ProdigiClient } from "prodigi-print-api";

export interface ParamDef {
  name: string;
  label: string;
  kind: "string" | "number" | "json";
  required: boolean;
  defaultValue?: string;
}

export interface MethodDef {
  id: string;
  resource: string;
  description: string;
  params: ParamDef[];
  execute: (
    client: ProdigiClient,
    values: Record<string, string>,
  ) => Promise<unknown>;
}
