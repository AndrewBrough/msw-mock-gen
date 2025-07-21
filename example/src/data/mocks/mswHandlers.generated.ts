import { queryHandlers } from './queryHandlers.generated';
import { mutationHandlers } from './mutationHandlers.generated';

export const handlers = [
  ...queryHandlers,
  ...mutationHandlers
];