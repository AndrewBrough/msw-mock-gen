import { useAssetsQuery } from "@data/queries/useAssetsQuery";

const { data, isLoading, error } = useAssetsQuery();

console.log(data);