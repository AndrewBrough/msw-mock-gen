import { Asset } from "@data/types/Asset";
import { DefaultError, useQuery } from "@tanstack/react-query";

export const ASSETS_QUERY_KEY = "ASSETS_QUERY_KEY";
export type AssetsQueryData = Asset[];

export const useAssetsQuery = () => {
  const query = useQuery<AssetsQueryData, DefaultError>({
    queryKey: [ASSETS_QUERY_KEY],
    queryFn: () => {
      return fetch("/assets").then((res) => res.json());
    },
  });

  return query;
};
