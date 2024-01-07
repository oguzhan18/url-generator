import { Elysia } from 'elysia';
import { db } from '../db/mock';

export const aboutHandler = (app: Elysia) => {
  return app.get('/about', () => JSON.stringify(db.urls), {
    detail: {
      tags: ['pages'],
    },
  });
};
