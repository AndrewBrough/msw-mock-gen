import { Report } from "@data/types/Report";
import { DefaultError, useQuery } from "@tanstack/react-query";

export const REPORTS_QUERY_KEY = "REPORTS_QUERY_KEY";

export type ReportsQueryData = Report[];
export type ReportsFilters = Pick<Report, "category" | "name">;

export const useReportsQuery = (filters: ReportsFilters) => {
  const query = useQuery<ReportsQueryData, DefaultError>({
    queryKey: [REPORTS_QUERY_KEY],
    queryFn: () => {
      return fetch("/reports", {
        method: "POST",

        body: JSON.stringify(filters),
      }).then((res) => res.json());
    },
  });

  return query;
};
