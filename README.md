# AssignHub — Assignment & Project Help Website

Full stack website for taking assignment / project orders (coding, AI/ML, web, PPT slides, reports, any field).
Visitors contact you directly on **WhatsApp (0310-7577751)** or submit an order form, which shows up in your **admin dashboard**.

🌐 **Live site:** https://assignhub-lp21.onrender.com
🔐 **Admin dashboard:** https://assignhub-lp21.onrender.com/admin

**Stack:** Node.js + Express + SQLite locally / Neon Postgres online · plain HTML/CSS/JS frontend.

## Run it

```bash
npm install
npm start
```

- Website: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin  (password = `ADMIN_PASSWORD` from your `.env`)

## Settings — change the admin password!

Copy `.env.example` to `.env` and edit it:

```
ADMIN_PASSWORD=your-strong-password
WHATSAPP_NUMBER=923107577751
WHATSAPP_DISPLAY=0310-7577751
OWNER_NAME=Hafsa Ali
BRAND_NAME=AssignHub
```

## Features

**Public website (no login)**
- Animated hero with typing effect and a live "code terminal"
- Floating WhatsApp button + WhatsApp links everywhere (pre-filled messages)
- 10 service cards (3D tilt) — click one to start an order
- Interactive price estimator (service, size, deadline, viva prep)
- Order form: progress bar, validation, auto-saved draft, "send via WhatsApp instead"
- Tracking ID after submitting + "Track your request" page with a progress timeline
- Fun Zone: 🎡 Spin & Win discount wheel, 😱 Deadline Panic Meter with live countdown,
  😂 dev joke generator, 🧠 CS quiz, 🐞 Bug Hunt mini-game (win code `BUGHUNTER`)
- Dark / light mode, confetti, scroll animations, FAQ, fully responsive

**Admin dashboard (`/admin`)**
- Password login; stats (total, new, in progress, completed, earnings)
- Search, filter by status, sort by newest / deadline; overdue & due-soon highlighting
- Full request details, one-click WhatsApp reply with ready-made messages (Quote, Need details, Started, Delivered)
- Set status, price, a message shown on the client's tracking page, and private notes
- Auto-refresh every 30s with a sound + notification for new orders
- Export all requests to CSV (Excel)

## Where data is stored

- **Locally:** `data/assignhub.db` (SQLite file), used automatically when `DATABASE_URL` is not set.
- **Online:** a free Neon Postgres database, used when `DATABASE_URL` is set.

## Prices

Starting prices are in `public/app.js` (`SERVICES` list, `base` values in Rs). Change them to your own rates.

## Deploying (Render + Neon, free)

1. **Neon** (https://neon.tech): create a free project and copy the **connection string** (starts with `postgresql://`).
2. **GitHub:** push this folder to a new repository. `.env` and `data/` are ignored and are never uploaded.
3. **Render** (https://render.com): click **New > Blueprint** and pick the repository. Render reads `render.yaml` and asks for:
   - `ADMIN_PASSWORD`: your admin password
   - `DATABASE_URL`: the Neon connection string
4. Wait for the deploy to finish. The site is live at https://assignhub-lp21.onrender.com and the dashboard at https://assignhub-lp21.onrender.com/admin.

Every `git push` redeploys automatically. On the free plan the site sleeps after 15 minutes with no visitors, and the first visit after that takes ~30–50 seconds.

### Managing the live site

- **Change the admin password:** Render → assignhub service → **Environment** → edit `ADMIN_PASSWORD` → **Save** (the site restarts).
- **See errors:** Render → assignhub service → **Logs**.
- **See stored orders directly:** Neon console → your project → **Tables** → `requests`.
- **Health check:** https://assignhub-lp21.onrender.com/api/stats should return JSON.
