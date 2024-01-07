import { Elysia, t } from 'elysia';
import { db } from '../db/mock';

export const updateHandler = (app: Elysia) => {
  return app.put(
    '/:shortUrl',
    ({ body, params, set }) => {
      const url = db.urls.find((url) => url.shortUrl === params.shortUrl);

      if (!url) {
        set.status = 404;

        return { message: 'Not found', success: false };
      }

      const updatedUrl = { ...url, originalUrl: body.newOriginalUrl };

      db.urls = db.urls.map((url) => {
        return url.shortUrl === params.shortUrl ? updatedUrl : url;
      });

      return { message: 'Updated', success: true, url: updatedUrl };
    },
    {
      body: t.Object({
        newOriginalUrl: t.String(),
      }),
      params: t.Object({
        shortUrl: t.String(),
      }),
      detail: {
        tags: ['api'],
      },
    },
  );
};
