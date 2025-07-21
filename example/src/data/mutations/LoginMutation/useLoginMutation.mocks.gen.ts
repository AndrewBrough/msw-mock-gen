import { useLoginMutation } from "./useLoginMutation";

type QueryData = ReturnType<typeof useLoginMutation>["data"];

export const mockLoginMutationData: QueryData = {
  id: "b438b6fa-765b-4706-8b22-88adb9b5534a",
  email: "Hiram42@hotmail.com",
  firstName: "Tyreek",
  lastName: "Muller",
  role: "admin",
  organizationId: "56d47f89-1d98-4546-aae8-a99ad1c3391e",
  createdAt: "2025-07-21T04:48:05.595Z",
  updatedAt: "2025-07-20T11:49:36.692Z",
};
