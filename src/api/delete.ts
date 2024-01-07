import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const deleteHandler = (app: Elysia) => {
  return app.delete(
    '/:generateUrl',
    ({ params, set }) => {
      const url = db.urls.find((url) => url.generateUrl === params.generateUrl);

      if (!url) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      db.urls = db.urls.filter((url) => url.generateUrl !== params.generateUrl);

      return { message: 'Deleted', success: true, url };
    },
    {
      params: t.Object({
        generateUrl: t.String(),
      }),
      detail: {
        tags: ['api'],
      },
    },
  );
};
