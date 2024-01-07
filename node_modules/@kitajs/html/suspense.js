const { contentsToString } = require('./index');
const { Readable } = require('stream');

// Avoids double initialization in case this file is not cached by
// module bundlers.
if (!globalThis.SUSPENSE_ROOT) {
  /* global SUSPENSE_ROOT */
  globalThis.SUSPENSE_ROOT = {
    resources: new Map(),
    requestCounter: 1,
    enabled: false,
    autoScript: true
  };
}

/**
 * Simple IE11 compatible replace child scripts to replace the template streamed by the
 * server.
 *
 * As this script is the only residue of this package that is actually sent to the client,
 * it's important to keep it as small as possible and also include the license to avoid
 * legal issues.
 */
//
// Variable names:
//  * - i: run number
//  * - l: if this call is being made by the DOMContentLoaded event
//  * - d: document
//  * - q: querySelector
//  * - v: the `B:${i}` fallback <div/>
//  * - t: the `N:${i}` <template/> content
//  * - s: the `S:${i}` <script/> with $KITA_RC call
//  * - f: a document fragment to hold the template children
//  * - c: a child node of each template iteration
//  * - r: all the remainder fragments waiting for a fallback to substitute
//  * - j: if at least one remainder was
//
// Pending data-sr elements are kept pending if their fallback has not yet been
// rendered, on each render a try to switch all pending data-sr is attempted until
// no elements are substituted.
const SuspenseScript = /* html */ `
      <script id="kita-html-suspense">
        /*! Apache-2.0 https://kita.js.org */
        function $KITA_RC(i){
          //# simple aliases
          var d=document,q=d.querySelector.bind(d),
            //# div sent as the fallback wrapper
            v=q('div[id="B:'+i+'"][data-sf]'),
            // template and script sent after promise finishes
            t=q('template[id="N:'+i+'"][data-sr]'),s=q('script[id="S:'+i+'"][data-ss]'),
            // fragment created to avoid inserting element one by one
            f=d.createDocumentFragment(),
            // used by iterators
            c,j,
            // all pending hydrations
            r;

          // if div or template is not found, let this hydration as pending
          if(t&&v&&s){
            // appends into the fragment
            while(c=t.content.firstChild)
              f.appendChild(c);

            // replaces the div and removes the script and template
            v.parentNode.replaceChild(f,v);
            t.remove();
            s.remove();

            // looks for pending templates
            r=d.querySelectorAll('template[id][data-sr]');

            do{
              // resets j from previous loop
              j=0;

              // loops over every found pending template and 
              for(c=0;c<r.length;c++)
                if(r[c]!=t)
                  // let j as true while at least on $KITA_RC call returns true
                  j=$KITA_RC(r[c].id.slice(2))?!0:j;
            }while(j)

            // we know at least the original template was substituted
            return!0;
          }
        }
      </script>
    `
  // Removes comment lines
  .replace(/^\s*\/\/.*/gm, '')
  // Removes line breaks added for readability
  .replace(/\n\s*/g, '');

function noop() {}

/** @type {import('./suspense').Suspense} */
function Suspense(props) {
  if (!SUSPENSE_ROOT.enabled) {
    throw new Error('Cannot use Suspense outside of a `renderToStream` call.');
  }

  // fallback may be async.
  const fallback = contentsToString([props.fallback]);

  if (!props.children) {
    return '';
  }

  const children = contentsToString([props.children]);

  // Returns content if it's not a promise
  if (typeof children === 'string') {
    return children;
  }

  let resource = SUSPENSE_ROOT.resources.get(props.rid);

  if (!resource) {
    throw new Error(
      'Suspense resource closed before all suspense components were resolved.'
    );
  }

  // Gets the current run number for this resource
  // Increments first so we can differ 0 as no suspenses
  // were used and 1 as the first suspense component
  const run = ++resource.running;

  children
    .then(writeStreamTemplate)
    .catch(function errorRecover(error) {
      // No catch block was specified, so we can
      // re-throw the error.
      if (!props.catch) {
        throw error;
      }

      let html;

      // unwraps error handler
      if (typeof props.catch === 'function') {
        html = props.catch(error);
      } else {
        html = props.catch;
      }

      // handles if catch block returns a string
      if (typeof html === 'string') {
        return writeStreamTemplate(html);
      }

      // must be a promise
      return html.then(writeStreamTemplate);
    })
    .catch(function writeFatalError(error) {
      if (resource) {
        const stream = resource.stream.deref();

        // stream.emit returns true if there's a listener
        // so we can safely ignore the error
        if (stream && stream.emit('error', error)) {
          return;
        }
      }
      /* c8 ignore next 2 */
      // Nothing else to do if no catch or listener was found
      console.error(error);
    })
    .finally(function cleanResource() {
      // Reloads the resource as it may have been closed
      resource = SUSPENSE_ROOT.resources.get(props.rid);

      if (!resource) {
        return;
      }

      // reduces current suspense id
      if (resource.running > 1) {
        resource.running -= 1;

        // Last suspense component, runs cleanup
      } else {
        const stream = resource.stream.deref();

        if (stream && !stream.closed) {
          stream.push(null); // ends stream
        }

        // Removes the current state
        SUSPENSE_ROOT.resources.delete(props.rid);
      }
    });

  // Keeps string return type
  if (typeof fallback === 'string') {
    return '<div id="B:' + run + '" data-sf>' + fallback + '</div>';
  }

  return fallback.then(function resolveCallback(resolved) {
    return '<div id="B:' + run + '" data-sf>' + resolved + '</div>';
  });

  /**
   * This function may be called by the catch handler in case the error could be handled.
   *
   * @param {string} result
   */
  function writeStreamTemplate(result) {
    // Reloads the resource as it may have been closed
    resource = SUSPENSE_ROOT.resources.get(props.rid);

    if (!resource) {
      return;
    }

    const stream = resource.stream.deref();

    // Stream was probably already closed/cleared out.
    // We can safely ignore this.
    if (!stream || stream.closed) {
      return;
    }

    // Writes the suspense script if its the first
    // suspense component in this resource. This way following
    // templates+scripts can be executed
    if (SUSPENSE_ROOT.autoScript && resource.sent === false) {
      stream.push(SuspenseScript);
      resource.sent = true;
    }

    // Writes the chunk
    stream.push(
      // prettier-ignore
      '<template id="N:' + run + '" data-sr>' + result + '</template><script id="S:' + run + '" data-ss>$KITA_RC(' + run + ')</script>'
    );
  }
}

/**
 * @type {import('./suspense').renderToStream}
 * @returns {any}
 */
function renderToStream(factory, customRid) {
  // Enables suspense if it's not enabled yet
  if (SUSPENSE_ROOT.enabled === false) {
    SUSPENSE_ROOT.enabled = true;
  }

  if (customRid && SUSPENSE_ROOT.resources.has(customRid)) {
    throw new Error(`The provided resource ID is already in use: ${customRid}.`);
  }

  const resourceId = customRid || SUSPENSE_ROOT.requestCounter++;

  /** @type {import('./suspense').HtmlStream} */
  //@ts-expect-error - we manually set the rid
  const stream = new Readable({ read: noop });
  stream.rid = resourceId;

  SUSPENSE_ROOT.resources.set(resourceId, {
    stream: new WeakRef(stream),
    running: 0,
    sent: false
  });

  let html;

  try {
    html = factory(resourceId);
  } catch (renderError) {
    // Could not generate even the loading template.
    // This means a sync error was thrown and there's
    // nothing we can do unless closing the stream
    // and re-throwing the error.

    stream.push(null); // ends stream
    SUSPENSE_ROOT.resources.delete(resourceId);

    throw renderError;
  }

  // root resolves to promise
  if (typeof html === 'string') {
    stream.push(html);

    const updatedResource = SUSPENSE_ROOT.resources.get(resourceId);

    // This resource already resolved or no suspenses were used.
    if (!updatedResource || updatedResource.running === 0) {
      stream.push(null); // ends stream
      SUSPENSE_ROOT.resources.delete(resourceId);
    }

    return stream;
  }

  html
    .then(function writeStreamHtml(html) {
      stream.push(html);
    })
    .catch(function catchError(error) {
      // Emits the error down the stream or
      // prints it to the console if there's no
      // listener (default node impl always has a listener)

      /* c8 ignore next 4 */
      if (stream.emit('error', error) === false) {
        console.error(error);
      }
    })
    .finally(function endStream() {
      const updatedResource = SUSPENSE_ROOT.resources.get(resourceId);

      // This resource already resolved or no suspenses were used.
      if (!updatedResource || updatedResource.running === 0) {
        stream.push(null); // ends stream
        SUSPENSE_ROOT.resources.delete(resourceId);
      }
    });

  return stream;
}

/** @type {import('./suspense').renderToString} */
async function renderToString(factory, customRid) {
  /** @type {Buffer[]} */
  const chunks = [];

  for await (const chunk of renderToStream(factory, customRid)) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

module.exports.Suspense = Suspense;
module.exports.renderToStream = renderToStream;
module.exports.renderToString = renderToString;
module.exports.SuspenseScript = SuspenseScript;
