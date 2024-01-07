import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const deleteHandler = (app: Elysia) => {
  return app.delete(
    '/:shortUrl',
    ({ params, set }) => {
      const url = db.urls.find((url) => url.shortUrl === params.shortUrl);

      if (!url) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      db.urls = db.urls.filter((url) => url.shortUrl !== params.shortUrl);

      return { message: 'Deleted', success: true, url };
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
