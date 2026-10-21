# messageforyou (MERN)

Personalised gift museum: a wizard builds a gift, the server stores it, and the recipient opens `/g/:slug`. No payment; the link is free.

## Setup
1. Requires Node 18+ and MongoDB (local: `brew services start mongodb-community`).
2. `cd server && cp .env.example .env && npm install`
3. `cd client && npm install`

`.env` (server): `MONGODB_URI`, `PORT` (default 5055), `PUBLIC_URL` (origin used to build share links, e.g. `https://yoursite.com`).

## Run (dev)
- Server: `cd server && npm run dev` (http://localhost:5055, health at `/api/health`)
- Client: `cd client && npm run dev` (http://localhost:5180, proxies `/api` and `/uploads`)

Note: on macOS, port 5000 is held by AirPlay Receiver. Disable it in System Settings, or set `PORT` (and the Vite proxy target) to another port.

## API
- `POST /api/uploads/photo|voice`: multipart `file` (5MB, image/* or audio/*), returns `{ url }`
- `POST /api/gifts`: JSON gift, returns `{ slug, url }`
- `GET /api/gifts/:slug`
- `POST /api/gifts/:slug/visit`: returns `{ views }`

Limits: 8 photos (max one puzzle), 5 notes (80 chars each), letter 500 chars, 5 promises. Media URLs must start with `/uploads/`. Create and upload are rate limited in memory per IP (resets on restart).

## Deploy
- Build the client (`cd client && npm run build`) and serve `client/dist` from a static host or reverse proxy, forwarding `/api` and `/uploads` to the Node server (`cd server && npm start`).
- Set `PUBLIC_URL` to the public site origin and `MONGODB_URI` to e.g. MongoDB Atlas.
- Uploads are written to `server/uploads/` on local disk. Use a persistent volume (or swap to S3) on hosts with ephemeral filesystems.
- `trust proxy` is enabled so rate limiting uses the real client IP behind a proxy.
# MessageforYou
