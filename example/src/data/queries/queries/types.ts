import { ObjectWithKeys } from "@data/types/ObjectWithKeys";

export type BaseFilters<S extends ObjectWithKeys = ObjectWithKeys> = {
  location_id?: string;
  search?: string;
  sort?: S;
  page?: number;
  perPage?: number;
};

export type SortDirection = "asc" | "desc" | "";

export type SortFilters<S extends ObjectWithKeys = ObjectWithKeys> = {
  [key in keyof S]?: SortDirection;
};
