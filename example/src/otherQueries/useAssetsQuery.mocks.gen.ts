import { useAssetsQuery } from "./useAssetsQuery";

type QueryData = ReturnType<typeof useAssetsQuery>["data"];

export const mockAssetsQueryData: QueryData = undefined; // TODO: Replace with mock query data of type: AssetsQueryData
