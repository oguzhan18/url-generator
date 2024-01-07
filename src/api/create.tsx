import { Elysia, t } from 'elysia';
import { nanoid } from 'nanoid';
import { db } from '../db/mock';
import { isHtmlResponseExpected } from '../utils';

const createUniqueShortUrl = (): string => {
  const short = nanoid(12);

  if (db.urls.find((url) => url.shortUrl === short)) {
    return createUniqueShortUrl();
  }

  return short;
};

export const createHandler = (app: Elysia) => {
  return app.post(
    '/',
    ({ body, headers }) => {
      const url = { originalUrl: body.url, shortUrl: createUniqueShortUrl() };
      db.urls.push(url);

      if (!isHtmlResponseExpected(headers))
        return { message: 'Created', success: true, url };

      return (
        <p>
          Your shortened URL is{' '}
          <a href={`/${url.shortUrl}`}>{`/${url.shortUrl}`}</a>
        </p>
      );
    },
    {
      body: t.Object({
        // TODO: add validation for URL
        url: t.String({
          description: 'The URL to shorten',
          example: 'https://example.com',
        }),
      }),
      detail: {
        tags: ['api'],
      },
    },
  );
};
