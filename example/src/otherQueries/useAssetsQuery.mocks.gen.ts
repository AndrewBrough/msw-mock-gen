import { useAssetsQuery } from "./useAssetsQuery";

type QueryData = ReturnType<typeof useAssetsQuery>["data"];

export const mockAssetsQueryData: QueryData = [
  {
    id: "b438b6fa-765b-4706-8b22-88adb9b5534a",
    name: "Handmade Gold Hat",
    type: "Gloves",
    manufacturer: "Kautzer - Trantow",
    model: "Volt",
    serialNumber: "VC7JPRFTZW",
    location: "Cartwrighthaven",
    status: "inactive",
    createdAt: "2025-07-21T00:31:16.480Z",
    updatedAt: "2025-07-20T19:39:57.601Z",
  },
  {
    id: "46ae8a99-ad1c-4339-b1ea-b09822b5b86e",
    name: "Gorgeous Aluminum Chips",
    type: "Fish",
    manufacturer: "Ziemann, Hermiston and Ruecker",
    model: "Impala",
    serialNumber: "G9OELVF68J",
    location: "Stammstad",
    status: "maintenance",
    createdAt: "2025-07-20T20:40:32.751Z",
    updatedAt: "2025-07-20T19:02:33.306Z",
  },
  {
    id: "52d58980-fe34-48ef-949c-6b29df163781",
    name: "Tasty Marble Gloves",
    type: "Shirt",
    manufacturer: "Beahan, Quitzon and Smitham",
    model: "Aventador",
    serialNumber: "MHJF6FTHRR",
    location: "Mannton",
    status: "inactive",
    createdAt: "2025-07-21T06:59:44.830Z",
    updatedAt: "2025-07-20T19:31:45.347Z",
  },
];
