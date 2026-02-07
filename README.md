# OpenAPI Fetch Demo

This is a small web app to try an OpenAPI YAML file.
It reads the YAML, lets you choose a path and method, and sends a request.

## Demo

https://freddiefujiwara.com/openapi-fetch/

## What you can do

- Paste an OpenAPI YAML file.
- Choose a base URL, path, and method.
- Fill query parameters.
- Run the request and see the response and time.
- Share the YAML in the URL (it is compressed).

## How it works (simple)

- The app parses your YAML.
- It finds servers and paths.
- It shows a simple form for query parameters.
- It builds the request URL and calls `fetch`.
- If the response is JSON, it shows it as JSON.

## Run locally

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Notes

- Some APIs block requests because of CORS.
- GET uses a simple request to avoid extra preflight.
- JSONP works only for GET when you add a `callback` query parameter.
