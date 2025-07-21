import { useLoginMutation } from "./useLoginMutation";

type QueryData = ReturnType<typeof useLoginMutation>["data"];

export const mockLoginMutationData: QueryData = "a;6TcH|`ME";
