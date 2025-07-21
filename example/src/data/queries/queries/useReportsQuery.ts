import { ObjectWithKeys } from "@data/types/ObjectWithKeys";
import { Report } from "@data/types/Report";
import { DefaultError, useQuery } from "@tanstack/react-query";

export const REPORTS_QUERY_KEY = "REPORTS_QUERY_KEY";

/**
 * Define all filters for the reports query
 * then pick only the sortable ones (not all fields can be searched AND sorted)
 * define the sort
 */
export type ReportsFilters = ObjectWithKeys & {
  category?: string;
  name?: string;
  asset_manufacturer_name?: string;
  asset_category_name?: string;
  heartbeat_status?: string;
};

export type ReportsQueryData = Report[];

export const useReportsQuery = () => {
  const query = useQuery<
    ReportsQueryData,
    DefaultError
  >({
    queryKey: [REPORTS_QUERY_KEY],
    queryFn: () => {
      return fetch("/reports").then((res) => res.json());
    },
  });

  return query;
};
