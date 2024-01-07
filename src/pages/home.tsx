/// <reference types="@kitajs/html/htmx.d.ts" />

import { Elysia } from 'elysia';
import { BaseLayout } from '../layout/Base';

export const homeHandler = (app: Elysia) => {
  return app.get(
    '/',
    () => (
      <BaseLayout enableHtmx>
        <main>
          <form hx-post="/api" hx-target="#response">
            <h1>Shorten a URL</h1>
            <label for="url">URL</label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com"
            />
            <button>Shorten</button>
          </form>
          <div id="response" />
        </main>
      </BaseLayout>
    ),
    {
      detail: {
        tags: ['pages'],
      },
    },
  );
};
