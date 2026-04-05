# FinHub

FinHub is a full-stack finance tracking app: a **Node.js / Express** REST API with **PostgreSQL** and **Prisma**, plus a **React (Vite)** web client. Users can register, sign in with JWTs, browse financial records, and (depending on role) use analytics dashboards and administration tools.

---

## Features

### Authentication & profiles

- **Register** and **log in** with email and password (passwords hashed with bcrypt).
- **JWT** stored in the browser; included on API requests as `Authorization: Bearer <token>`.
- **`GET /api/me`** returns the current user (after login).

### Roles & access control

The API enforces roles consistently (`src/config/accessControl.js`):

| Capability | VIEWER | ANALYST | ADMIN |
|------------|:------:|:-------:|:-----:|
| Register / login, `GET /api/me` | ✓ | ✓ | ✓ |
| List / read records (`GET /api/records`) | ✓ | ✓ | ✓ |
| Create / update / delete records | | | ✓ |
| Dashboard APIs (summaries, charts data, trends) | | ✓ | ✓ |
| User management (`GET/POST/PATCH/DELETE /api/users`) | | | ✓ |

- **Registration** creates accounts as **VIEWER** by default.
- **Admins** cannot change another **admin’s** role via the API; they also cannot delete **admin** accounts or themselves (see user service rules).

### Records

- **Income** and **expense** entries: amount, type, category, date, optional notes, owner user.
- **Pagination** and filters (e.g. type, category) on list.
- **Admins** can create, **edit**, and **delete** records from the UI (and via API).

### Dashboard (Analyst & Admin only)

- **Summary KPIs**: total income, total expenses, net balance.
- **Insights**: transaction count, category count, average transaction size, current month net vs last month (with % change).
- **Charts** (Recharts): cash flow over time, monthly net (positive / negative coloring), top **expense** categories (income-only categories excluded), income vs expense donut, recent activity table.
- **Viewers** do not see the Dashboard link and receive **403** on dashboard routes.

### User administration (Admin only)

- **List** all users.
- **Create** users with name, email, password, and role.
- **Change roles** (VIEWER / ANALYST / ADMIN) with the restriction above for other admins.
- **Delete** non-admin users (not yourself).

### CLI: bootstrap an admin

From the project root, after the database is migrated and `.env` is configured:

```bash
npm run create-admin -- --name "Admin" --email admin@example.com --password "yourSecurePassword"
```

Short flags: `-n`, `-e`, `-p`. Fails if the email already exists.

### Web client (FinHub UI)

- **Landing** (logged out): welcome + links to log in / register.
- **Home (logged in)**: records table (same data as `/records`).
- **Navbar**: **Dashboard** (Analyst & Admin), **Records**, **Users** (Admin), **Log out**.
- Polished layout, modals for record edit/delete and user delete confirmation.

---

## Tech stack

- **Backend**: Express 5, Prisma 7, PostgreSQL (`pg` + Prisma adapter), JWT, express-validator, bcrypt, CORS, dotenv.
- **Frontend**: React 19, React Router 7, Vite 8, Axios, Recharts.
- **Database**: PostgreSQL (see `prisma/schema.prisma`).

---

## Local setup

### Prerequisites

- **Node.js** 18+ (or 20+ recommended)
- **PostgreSQL** running locally (or reachable from your machine)
- **npm** (comes with Node)

### 1. Clone and install dependencies

```bash
git clone https://github.com/soni-prakhar07/finHub.git
cd Finance-backend

# API dependencies
npm install

# Client dependencies
cd client
npm install
cd ..
```

### 2. Create the database

Create an empty PostgreSQL database, for example:

```sql
CREATE DATABASE finance_db;
```

### 3. Environment variables

In the **project root** (next to `server.js`), create a `.env` file.

**Option A — connection string only** (encode special characters in the password, e.g. `@` → `%40`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/finance_db?schema=public"
JWT_SECRET="a-long-random-string"
PORT=5000
```

**Option B — split variables** (handy when the password contains `@` or other URL-sensitive characters). The runtime pool uses these; keep `DATABASE_URL` for Prisma CLI (`migrate`, `studio`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/finance_db?schema=public&sslmode=disable"
DATABASE_USER=postgres
DATABASE_PASSWORD=your_plain_password
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=finance_db

JWT_SECRET="a-long-random-string"
PORT=5000
```

- **`JWT_SECRET`**: use a strong random value in any real environment; restart the server after changing it.
- **`PORT`**: API port (default **5000**). The Vite app expects the API at `http://localhost:5000` unless you override (below).

### 4. Apply database migrations

From the **project root**:

```bash
npx prisma migrate deploy
```

For active development you can instead use:

```bash
npx prisma migrate dev
```

This creates tables such as `User` and `Record` and the `Role` / `RecordType` enums.

### 5. Create an administrator (recommended)

```bash
npm run create-admin -- --name "Admin" --email you@example.com --password "yourSecurePassword"
```

Then sign in through the client with that email and password.

### 6. Run the API

From the **project root**:

```bash
npm run dev
```

Or without file watching:

```bash
node server.js
```

You should see: `Server is running on port 5000` (or your `PORT`).

### 7. Run the client

In a **second terminal**, from the `client` folder:

```bash
cd client
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

#### Pointing the client at a different API URL

Create `client/.env` (or `.env.local`):

```env
VITE_API_BASE_URL=http://localhost:5000
```

Adjust host/port if your API differs.

### 8. Production build (optional)

```bash
cd client
npm run build
npm run preview
```

Serve `client/dist` with any static host; configure `VITE_API_BASE_URL` at **build time** so the browser calls the correct API origin.

---

## Useful commands

| Command | Where | Purpose |
|--------|--------|---------|
| `npm run dev` | project root | API with nodemon |
| `npm run create-admin -- --name ... --email ... --password ...` | project root | Insert an ADMIN user |
| `npx prisma migrate deploy` | project root | Apply migrations |
| `npx prisma studio` | project root | Browse / edit DB in a GUI |
| `npm run dev` | `client/` | Vite dev server |
| `npm run build` | `client/` | Production client bundle |

---

## API overview (high level)

- **`POST /api/auth/register`**, **`POST /api/auth/login`**
- **`GET /api/me`** (authenticated)
- **`/api/records`** — `GET` (read roles), `POST` / `PUT /:id` / `DELETE /:id` (admin)
- **`/api/dashboard`** — `summary`, `categories`, `trends`, `insights`, `recent` (analyst & admin)
- **`/api/users`** — list, create, patch role/status, delete (admin; rules apply)

All authenticated routes expect: `Authorization: Bearer <token>`.

---

## Troubleshooting

- **`Invalid prisma... table does not exist`**: run `npx prisma migrate deploy` against the same database as `DATABASE_URL`.
- **DB auth errors**: check credentials; if using `DATABASE_URL`, ensure special characters in passwords are URL-encoded, or use `DATABASE_PASSWORD` + related vars for the app runtime.
- **Client cannot reach API**: confirm the API is running and `VITE_API_BASE_URL` / default `http://localhost:5000` matches your server.

---

## License

ISC (see `package.json`).
