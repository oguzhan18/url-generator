import packageJson from '../../package.json';

export function BaseLayout(
  props: Html.PropsWithChildren<{
    description?: string;
    head?: string;
    title?: string;
    enableHtmx?: boolean;
  }>,
) {
  const title = `${props.title ?? 'Simple URL shortener'} | ${
    packageJson.author.name
  }`;

  const description = props.description ?? packageJson.description;

  return (
    <>
      {'<!doctype html>'}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="description" content={description} />
          <meta name="author" content={packageJson.author.name} />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{title}</title>
          <link rel="stylesheet" href="/public/css/pico.classless.min.css" />
          {props.head}
          {props.enableHtmx && <script src="/public/htmx.min.js" />}
        </head>
        <body hx-headers='{"accept": "text/html"}'>{props.children}</body>
      </html>
    </>
  );
}
