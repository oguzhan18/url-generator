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
            <h1>Generate a URL</h1>
            <label for="url">URL</label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://github.com/oguzhan18"
            />
            <button>Generate URL</button>
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
