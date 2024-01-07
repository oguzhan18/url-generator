import { Elysia, t } from 'elysia';
import { nanoid } from 'nanoid';
import { db } from '../db/mock';
import { isHtmlResponseExpected } from '../utils';

const createUniqueGenerateUrl = (): string => {
  const generate = nanoid(12);

  if (db.urls.find((url) => url.generateUrl === generate)) {
    return createUniqueGenerateUrl();
  }

  return generate;
};

export const createHandler = (app: Elysia) => {
  return app.post(
    '/',
    ({ body, headers }) => {
      const url = { originalUrl: body.url, generateUrl: createUniqueGenerateUrl() };      
      db.urls.push(url);

      if (!isHtmlResponseExpected(headers))
        return { message: 'Created', success: true, url };
      return (
        <p>
          Your generated URL is{' '}
          <a target='_blank' href={`/${url.generateUrl}`}>  {`/${url.generateUrl}`}</a>
        </p>
      );
    },
    {
      body: t.Object({
        url: t.String({
          description: 'The URL to generated',
          example: 'https://example.com',
        }),
      }),
      detail: {
        tags: ['api'],
      },
    },
  );
};
