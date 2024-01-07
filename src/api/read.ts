import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const readHandler = (app: Elysia) => {
  return app.get(
    '/:generateUrl',
    ({ params, set }) => {
      const url = db.urls.find((url) => url.generateUrl === params.generateUrl);

      if (!url) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      return { url, success: true };
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
