# AfterClass Coursework Project

A complete CST3144 coursework project with separate Vue and Express applications. The Vue app calls the Express REST API using the browser `fetch` API. The server uses Express and the native MongoDB Node.js driver; the database connection is kept in `express-app/.env`, which is excluded from Git.

## Project structure

- `vue-app/` — Vue 3 front end for GitHub Pages.
- `express-app/` — Express REST API, native MongoDB driver, seed script, and static lesson illustrations.
- `express-app/.env` — local Atlas connection settings. Do not commit or publish this file.

## Run locally

Requirements: Node.js 20 or newer, an accessible MongoDB Atlas cluster, and a browser.

1. In a terminal, go to `express-app` and run `npm install`.
2. Check `express-app/.env` has the correct Atlas URI, database name, port, and `CLIENT_ORIGIN=http://localhost:5500`.
3. Run `npm run seed` once to create ten lessons in the `lesson` collection. Avoid running it repeatedly, as each run inserts another ten.
4. Start the API with `npm start`. It listens on `http://localhost:3000` and writes request logs to the terminal.
5. In a second terminal, serve `vue-app` on port 5500 (for example, `npx http-server -p 5500` from that folder, or VS Code Live Server on port 5500). Open the shown localhost URL.

The front end is configured for `http://localhost:3000`. It will show sample lessons if the API is offline, but checkout is enabled only when connected to the API; sample data is never saved as a real order.

## REST routes

- `GET /lessons` — all lessons as JSON.
- `GET /search?q=...` — server-side search across subject, location, price, and spaces. Optional `teacherFirstName` and `teacherLastName` parameters narrow results.
- `GET /teachers` — teacher names and the number of lessons they teach.
- `GET /teachers/:firstName/:lastName/lessons` — lessons taught by one teacher.
- `GET /enrolment/:lessonid` — number of places ordered for a lesson.
- `POST /orders` — validates and saves an order.
- `PUT /lessons/:id` — updates supported lesson attributes, including an explicit `space` value (not only an increment/decrement).
- `GET /images/:filename` — returns an illustration or a JSON 404 message when it is missing.
- `GET /health` — API health check.

The same routes are also available under `/api`, for example `/api/lessons`.

## Database documents

`lesson` documents include `topic`, `location`, `price`, `space`, `icon`, `image`, and `teachers`. `order` documents include `name`, `phone`, `lessonIDs` (with each lesson ID and quantity), `numberOfSpace`, and `createdAt`. Seed data gives each lesson five spaces and associates it with a teacher.

## Deploy

### Express API on Render

The root `render.yaml` is a Render Blueprint for this project's current combined repository. It sets `express-app` as the service root, uses `npm install` and `npm start`, and checks `/health`. Render's Blueprint format supports a root directory for monorepos and prompts for values marked `sync: false`.

1. Push this repository to GitHub and open Render's Dashboard.
2. Choose **New + > Blueprint** and connect the repository containing `render.yaml`.
3. Supply `MONGODB_URI` and `CLIENT_ORIGIN` when prompted. Use your MongoDB Atlas connection string for the former; do not commit it to Git.
4. If the coursework brief requires your student number in the Render service name or URL, edit `name` in `render.yaml` before creating the Blueprint.
5. After Render deploys, open `https://YOUR-SERVICE.onrender.com/health`. A healthy API responds with `{"status":"ok"}`.

If the backend is deployed from its own repository rather than this combined project, use that backend repository's root as the service root and omit `rootDir: express-app` from its Blueprint. Set `CLIENT_ORIGIN` to the exact published GitHub Pages origin. The browser frontend must use the deployed HTTPS API URL in `API_BASE_URL`.

### Connect the API to Postman

The collection is `postman/AfterClass.postman_collection.json`.

1. In Postman, select **Import**, choose **Files**, and open `AfterClass.postman_collection.json`.
2. Open the imported collection's **Variables** tab. Set `baseUrl` to `http://localhost:3000` for a local server, or to the HTTPS Render URL after deployment. Do not add a trailing slash.
3. Start the Express API locally with `npm start`, or make sure the Render service is live.
4. Send **Get all lessons** first. Its test script saves the first lesson's MongoDB `_id` as the collection variable `lessonId`.
5. Send **Existing image** to demonstrate a successful image response (200), then **Missing image (expect JSON 404)** to demonstrate the error response (404 with an `error` field). The collection includes tests for both outcomes.
6. Try the other GET requests. **Submit order** writes a new order to MongoDB, and **Update lesson spaces** changes a lesson's available-space value, so use test data when demonstrating those two requests.

The image middleware serves existing files from `express-app/public/images`. If a file is missing, the request falls through to the explicit `/images/:filename` handler, which returns a JSON 404 message. The Postman collection has requests for both cases.

### Vue app on GitHub Pages

Edit `API_BASE_URL` in `vue-app/index.html` to your deployed HTTPS Render URL, commit and push the Vue folder to its GitHub repository, then enable GitHub Pages for that repository. Update the Render `CLIENT_ORIGIN` to the resulting Pages origin and redeploy/restart the API. HTTPS Pages must call an HTTPS API.

### Coursework submission

Keep the Vue and Express applications in separate GitHub repositories as required by the brief, and build the requested README links, MongoDB collection exports, Postman export, and commit history. This workspace package is source code and local setup; publishing, GitHub commits, Render deployment, and exported Atlas/Postman files must be completed from your accounts.
