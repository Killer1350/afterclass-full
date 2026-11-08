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

Create a web service from the `express-app` directory. Use build command `npm install` and start command `npm start`. Add `MONGODB_URI`, `DB_NAME`, `CLIENT_ORIGIN`, and `NODE_ENV=production` as Render environment variables. Set `CLIENT_ORIGIN` to the exact published GitHub Pages origin. Do not paste Atlas credentials into source code or public files. Use a Render service name/URL that includes your student number as required in the coursework.

### Vue app on GitHub Pages

Edit `API_BASE_URL` in `vue-app/index.html` to your deployed HTTPS Render URL, commit and push the Vue folder to its GitHub repository, then enable GitHub Pages for that repository. Update the Render `CLIENT_ORIGIN` to the resulting Pages origin and redeploy/restart the API. HTTPS Pages must call an HTTPS API.

### Coursework submission

Keep the Vue and Express applications in separate GitHub repositories as required by the brief, and build the requested README links, MongoDB collection exports, Postman export, and commit history. This workspace package is source code and local setup; publishing, GitHub commits, Render deployment, and exported Atlas/Postman files must be completed from your accounts.
