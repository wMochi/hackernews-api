import { h, jsx, serve, validateRequest, PathParams, json } from "https://deno.land/x/sift@0.3.4/mod.ts";
// deployctl run --libs=ns,fetchevent --watch mod.tsx

import {QueryString, StoryObject} from "./api/interface.ts";
import {handleApi, handleItemBase} from "./api/hnapi.ts";

// interface Story {
//   news: string,
//   newest: string,
//   best: string,
//   ask: string,
//   show: string,
//   jobs: string
// }

const STORIES: any = {
  news: "topstories",
  newest: "newstories",
  best: "beststories",
  ask: "askstories",
  show: "showstories",
  jobs: "jobstories"
}

const style = css`
:root {
--primary-color: #6c63ff;
--secondary-color: #f5f2fe;
--link-border-radius: 5px;
--box-shadow: 0 5px 5px rgba(0, 0, 0, 0.2);
}

body {
margin: 100px auto;
text-align: center;
max-width: 800px;
}

h1 {
font-size: 96px;
margin: 0;
}
h2 {
margin: 50px 0 0;
font-size: 48px;
}

h3 {
margin: 0 0 20px;
font-size: 24px;
}
a {
color: var(--primary-color);
}

.links {
display: flex;
justify-content: center;
}

.links a {
text-decoration: none;
}

.contact-link,
.about-link {
border-radius: var(--link-border-radius);
border: 1px solid #000000;
margin: 20px;
padding: 20px;
box-shadow: var(--box-shadow);
}

a.contact-link {
background-color: var(--primary-color);
color: var(--secondary-color);
}

a.about-link {
background-color: var(--secondary-color);
color: var(--primary-color);
}

.about-text {
display: flex;
justify-content: space-between;
padding: 5px;
}

.about-text p {
flex: 1;
background-color: var(--secondary-color);
margin: 10px;
padding: 20px;
font-size: 18px;
}

a.email-link {
color: var(--primary-color);
text-decoration: none;
font-size: 28px;
}

a.email-link:hover {
text-decoration: underline;
}
`;

const getQueryStringParam = (url: string, param: string): QueryString | undefined => {
  const searchParams = new URLSearchParams(new URL(url).search.slice(1));
  const queryParam = searchParams.get(param);
  return queryParam ? {[param]: queryParam} : undefined;
};

async function handleReq (request: Request, params?: PathParams) {
  const { error } = await validateRequest(request, {
    GET: {},
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }
  const { slug = "" } = params as { slug: string };

  if (slug != "" && !(slug in STORIES)) {
    return jsx(<NotFound />, { status: 404 });
  }

  const getValueQ: QueryString | undefined = getQueryStringParam(request.url, "page");

  const story: StoryObject[] | { code: string; message: string; } = await handleApi(STORIES[slug], getValueQ);

  if (Array.isArray(story) && story.length === 0) {
    return json({code: "pageNotFound", message: "Failed to retrieve the page!"},{status: 200});
  }

  return json(story,{status: 200});
}

function isNumeric(value: string): boolean {
    return /^-?\d+$/.test(value);
}

async function handleItem (request: Request, params?: PathParams) {
  const { error } = await validateRequest(request, {
    GET: {},
  });
  if (error) {
    return json({ error: error.message }, { status: error.status });
  }
  const { id = "" } = params as { id: string };

  if (id == "" || !isNumeric(id)) {
    return jsx(<NotFound />, { status: 404 });
  }

  const item = await handleItemBase(id);

  return json(item,{ status: 200 });


}

const App = () => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="ie=edge" />
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <title>Hacker News API</title>
    </head>
    <body>
      <h2>👋🏾 Hi!</h2>
      <h1>
        Hacker News API on Deno Deploy
      </h1>

      <div class="links">
        <a href="https://github.com/DiFronzo/hackernews-api-deno" class="contact-link">GitHub</a>
        <a href="doc" class="about-link">Documentation</a>
      </div>
    </body>
  </html>
);

const Doc = () => (
<html>
  <head>
    <meta charSet="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Documentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style dangerouslySetInnerHTML={{ __html: style }} />
  </head>
  <body>
    <a href="/">Back to homepage</a>
    <h1>📚 Documentation</h1>
    <h3>GET /news</h3>
    <p>Returns the 30 stories/posts from the front page.<br/> Example request: https://hackernews-api.deno.dev/news?page=2</p>
    <h3>GET /best</h3>
    <p>Returns the 30 best stories/posts from the front page.<br/> Example request: https://hackernews-api.deno.dev/best</p>
    <h3>GET /ask</h3>
    <p>Returns 30 ask stories/posts from the front page.<br/> Example request: https://hackernews-api.deno.dev/ask</p>
    <h3>GET /show</h3>
    <p>Returns 30 show stories/posts from the front page.<br/> Example request: https://hackernews-api.deno.dev/show</p>
    <h3>GET /jobs</h3>
    <p>Returns 30 job stories/posts from the front page.<br/> Example request: https://hackernews-api.deno.dev/jobs</p>
    <h3>GET /item/:id</h3>
    <p>Returns the details of the story/post with (nested) comments.<br/> Example request: https://hackernews-api.deno.dev/item/3338485</p>
  </body>
</html>
);

const NotFound = () => (
  <div>
    <h1>Page not found</h1>
  </div>
);

serve({
  "/": () => jsx(<App />),
  "/doc": () => jsx(<Doc />),
  "/:slug": handleReq,
  "/item/:id": handleItem,
  // The route handler of 404 will be invoked when a route handler
  // for the requested path is not found.
  404: () => jsx(<NotFound />, { status: 404 })
});


/** Wrapper function to get syntax highlight for CSS in editors. */
function css(style: TemplateStringsArray) {
  return style.join("");
}