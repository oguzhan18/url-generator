import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const readHandler = (app: Elysia) => {
  return app.get(
    '/:shortUrl',
    ({ params, set }) => {
      const url = db.urls.find((url) => url.shortUrl === params.shortUrl);

      if (!url) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      return { url, success: true };
    },
    {
      params: t.Object({
        shortUrl: t.String(),
      }),
      detail: {
        tags: ['api'],
      },
    },
  );
};
