# Coach Backend

Express server that proxies requests to the Anthropic API so the mobile app never bundles the API key.

## Endpoints

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/coach` | `{ system: string, user: string }` | `{ text: string }` |
| `POST` | `/chat` | `{ system: string, messages: ChatMessage[] }` | `{ text: string }` |
| `GET` | `/health` | — | `{ ok: true }` |

## Local development

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run coach:server
# Runs on http://localhost:8787
```

Set `coachApiUrl` in `app.json → expo.extra` to point the app at your server.

## Deploy to Railway (recommended — free tier, one command)

1. Install Railway CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init` inside this repo root
4. Set the env var: `railway variables set ANTHROPIC_API_KEY=sk-ant-...`
5. `railway up`
6. Copy the generated URL (e.g. `https://lifter-coach.up.railway.app`)
7. Set it in `app.json`:
   ```json
   "extra": { "coachApiUrl": "https://lifter-coach.up.railway.app" }
   ```
   Or override per-device in **Settings → Coach URL** inside the app.

## Deploy to Render

1. Create a new **Web Service** pointing at this repo
2. Build command: `npm install && npx tsc -p tsconfig.server.json`
3. Start command: `node dist/server/index.js`
4. Add env var `ANTHROPIC_API_KEY`
5. Copy the service URL into `app.json → extra.coachApiUrl`

## Deploy to Fly.io

```bash
fly launch --name lifter-coach
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `PORT` | No | `8787` | Port to listen on |
| `ALLOWED_ORIGIN` | No | `*` | CORS origin (lock to your app domain in prod) |
