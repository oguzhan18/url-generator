import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const redirectHandler = (app: Elysia) => {
  return app.get(
    '/:shortUrl',
    ({ params, set }) => {
      const redirectTo = db.urls.find((url) => url.shortUrl === params.shortUrl)
        ?.originalUrl;

      if (!redirectTo) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      return Response.redirect(redirectTo, 301);
    },
    {
      params: t.Object({
        shortUrl: t.String(),
      }),
      detail: {
        description: 'Redirect to original URL',
        tags: ['pages'],
      },
    },
  );
};
