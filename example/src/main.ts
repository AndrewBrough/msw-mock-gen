import { useAssetsQuery } from "@data/queries/useAssetsQuery";

const { data } = useAssetsQuery();

console.log(data);
