import { html } from '@elysiajs/html';
import { Elysia } from 'elysia';
import { aboutHandler } from './about';
import { homeHandler } from './home';
import { redirectHandler } from './redirect';

export const pageRoutes = new Elysia()
  .use(html())
  .use(homeHandler)
  .use(aboutHandler)
  .use(redirectHandler);
