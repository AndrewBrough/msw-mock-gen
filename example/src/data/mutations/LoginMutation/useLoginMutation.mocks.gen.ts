import { useLoginMutation } from "./useLoginMutation";

type QueryData = ReturnType<typeof useLoginMutation>["data"];

export const mockLoginMutationData: QueryData = undefined; // TODO: Replace with mock mutation data of type: LoginData
