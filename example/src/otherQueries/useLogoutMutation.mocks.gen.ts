import { useLogoutMutation } from "./useLogoutMutation";

type QueryData = ReturnType<typeof useLogoutMutation>["data"];

export const mockLogoutMutationData: QueryData = "a;6TcH|`ME";
