# Quizly

Quizly is a small, fast, mobile-first social relationship quiz app. A creator chooses 10 questions, shares a quiz link, and friends can play, see their score, compare on a leaderboard, and create their own challenge.

## Features

- Mobile-first Quizly landing and quiz creation flow
- Relationship themes for Friend, Best Friend, Partner, Crush, and Family
- Curated 10-question quiz creation from a reusable question bank
- Share page with Copy Link, native Share API, and WhatsApp links
- Public play flow with large tap targets and smooth question transitions
- Backend-calculated scoring with refresh-safe result URLs
- Animated result score, answer review, relationship level, and subtle high-score confetti
- Public leaderboard and creator results summary
- Friendly loading, empty, error, and 404 states
- Static Open Graph preview asset ready for future dynamic OG generation

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- Lucide React

Backend:

- Node.js
- Express.js
- MongoDB
- Mongoose

## Folder Structure

```text
Quiz/
|-- public/          # favicon, OG image, and static visual assets
|-- server/          # Express API, Mongoose models, routes, middleware
|-- src/             # React application, components, data, API service
|-- .env.example     # local environment template
|-- index.html       # base SEO metadata
|-- package.json
`-- README.md
```

## Environment Variables

Frontend:

```env
VITE_API_URL=/api
```

Backend:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/quizly
PORT=5000
CLIENT_URL=http://localhost:5173
```

For production, set `CLIENT_URL` to the deployed frontend URL. Multiple allowed origins can be comma-separated.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and update values if needed.
3. Start MongoDB locally or point `MONGODB_URI` at MongoDB Atlas.
4. Start the backend:

```bash
npm run server
```

5. In another terminal, start Vite:

```bash
npm run dev
```

6. Open `http://localhost:5173`.

For a single production-style process:

```bash
npm run build
npm run server
```

Then open `http://localhost:5000`.

## API Endpoints

- `GET /api/questions` - returns public question-bank items without correct answers. The bank includes the original questions plus 30 additional funny, love, crush, bestie, habits, and deep preference questions from `server/questionBank.additional.json`.
- `POST /api/quizzes` - creates a quiz from validated question IDs and returns separate public player and private creator dashboard URLs.
- `GET /api/quizzes/:slug` - returns public quiz data without correct answers.
- `POST /api/quizzes/:slug/submit` - validates answers and calculates the score on the server.
- `GET /api/quizzes/:slug/responses/:responseId` - returns a saved result and answer review without exposing correct answer indexes.
- `GET /api/quizzes/:slug/leaderboard` - returns public leaderboard entries.
- `GET /api/quizzes/manage/:manageToken` - returns private creator dashboard summary and saved submissions.
- `GET /api/quizzes/manage/:manageToken/submissions/:submissionId` - returns a private submission review for the creator.

The player link is `/quiz/:slug`; the private creator link is `/quiz/manage/:manageToken`. The manage token is generated with cryptographically secure random bytes and is never returned by public quiz endpoints.

## Deployment

Frontend:

- Deploy to Vercel as a Vite app.
- Set `VITE_API_URL` to the backend `/api` URL if the API is deployed separately.

Backend:

- Deploy to Railway or Render.
- Set `MONGODB_URI`, `PORT`, and `CLIENT_URL`.
- Use MongoDB Atlas for production data.

The server also serves the built frontend from `dist`, so a single backend deployment can host both API and static files after `npm run build`.

## Security Notes

- Correct answers are never returned by public quiz or question-bank endpoints.
- Scores are calculated only on the backend.
- Quiz slugs and response IDs are validated before database queries.
- Request bodies are validated and capped with a small JSON body limit.
- Quiz submissions have basic per-IP/per-quiz rate limiting.
- CORS is restricted through `CLIENT_URL`.
- Do not commit MongoDB URIs, API secrets, or private credentials.
