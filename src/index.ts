import { staticPlugin } from '@elysiajs/static';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import packageJson from '../package.json';
import { apiRoutes } from './api';
import { pageRoutes } from './pages';

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: packageJson.name,
          description: packageJson.description,
          version: packageJson.version,
          contact: {
            name: packageJson.author.name,
            url: packageJson.author.url,
          },
        },
        tags: [
          {
            name: 'api',
            description: 'API endpoints for URL shortener CRUD operations',
          },
          {
            name: 'pages',
            description: 'Endpoints for rendered html pages',
          },
        ],
      },
    }),
  )
  .use(staticPlugin())
  .use(apiRoutes)
  .use(pageRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
