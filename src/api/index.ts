import { Elysia } from 'elysia';
import { createHandler } from './create';
import { deleteHandler } from './delete';
import { readHandler } from './read';
import { updateHandler } from './update';

export const apiRoutes = new Elysia({ prefix: '/api' })
  .use(createHandler)
  .use(readHandler)
  .use(updateHandler)
  .use(deleteHandler);
