# Retain – Personal Expense & Budget Manager

Retain is a full-stack web app for recording personal expenses, setting a monthly budget and seeing where your money goes. Admins also get a dashboard with platform-wide insights, and they manage the expense categories.

## Live Demo

| | URL |
|---|---|
| **Frontend (app)** | https://retain-budget-manager.vercel.app |
| **Backend (API)** | https://retain-backend-e98e.onrender.com/api/ |

> The backend runs on a free hosting plan, so the first request after a period of inactivity can take up to a minute while the server wakes up.

### Demo accounts

These are created by `python manage.py seed_demo`:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@retain.app` | `Admin@12345` |
| User | `demo@retain.app` | `Demo@12345` |

Anyone can sign up, but new accounts are always **normal users**. Admin accounts can only be created by the seed command, `createsuperuser`, or the Django admin.

---

## Technologies Used

**Frontend**
- React 19 + TypeScript + Vite
- Redux Toolkit + React Redux: searching, filtering, sorting and pagination of expenses
- React Context API: authentication, roles and protected routes
- React Router: page routing and the protected/admin routes
- Axios: API client with token interceptor
- Recharts: dashboard and admin charts

**Backend**
- Python, Django 5 + Django REST Framework
- DRF Token Authentication
- SQLite for local development, PostgreSQL in production (via `DATABASE_URL`)
- django-cors-headers, WhiteNoise, Gunicorn

---

## Main Features

### Users
- **Authentication**: sign up, sign in and sign out with token auth. The session is kept in `AuthContext`, and the role is re-checked against the API on every page load.
- **Expenses (CRUD)**: create, view, edit and delete expenses with title, amount, category, date, payment method and optional notes. Each expense has its own details page at `/expenses/:id`.
- **Search, filter & sort (Redux)**: search by text; filter by category, payment method, date range and min/max amount; sort by date or amount. Results are paginated.
- **Monthly budget**: set or update this month's budget and see total spent, remaining budget and status (*within budget*, *approaching limit* at 80% or more, or *over budget*).
- **Dashboard**: total spending for the month (or year), remaining budget, highest expense, spending by category, a monthly trend chart and recent expenses.
- **Reports**: date-range summaries, charts and CSV export.
- **Settings**: update profile and choose a display currency (RWF / USD / EUR).

### Admins
- Admin dashboard at `/admin`, visible only to users with the `admin` role.
- **Category management**: create, rename and delete the categories that every user picks from.
  - Renaming a category also updates every expense that uses it.
  - Deleting a category moves its expenses to the default **"Uncategorized"** category, which itself cannot be deleted.
- **Platform insights**: total registered users, total number and total value of expenses, expenses recorded this month, total spending per category, top 5 most-used and bottom 5 least-used categories, recently added expenses and recently registered users.

### Responsive UI
The layout adapts to desktop, tablet and mobile widths.

---

## State Management

| Concern | Where | File |
|---|---|---|
| Sign up / sign in / sign out, current user, role, `isAdmin` | React Context | `frontend/src/context/AuthContext.tsx` |
| Protected routes (signed-in users) | React Context | `frontend/src/components/ProtectedRoute.tsx` |
| Admin-only route | React Context | `frontend/src/components/AdminRoute.tsx` |
| Expenses list, search, category / payment / date / amount filters, sorting, pagination | Redux Toolkit | `frontend/src/store/expenseSlice.ts` |

The filtered, sorted and paginated lists come from memoised Redux selectors (`selectFilteredExpenses`, `selectPaginatedExpenses`, `selectTotalPages`). Components only dispatch actions such as `setSearchTerm`, `setCategoryFilter`, `setPaymentMethodFilter`, `setStartDate`, `setMinAmount`, `setSortBy` and `setCurrentPage`.

---

## Project Structure

```
retain-budget-manager/
├── backend/                  Django REST API
│   ├── config/               settings, urls, wsgi
│   ├── expenses/             models, serializers, views, permissions, tests
│   │   └── management/commands/seed_demo.py
│   ├── build.sh              build script for Render
│   ├── requirements.txt
│   └── .env.example
└── frontend/                 React + TypeScript + Vite
    ├── src/
    │   ├── components/       ProtectedRoute, AdminRoute, Pagination, StatCard, CategoryManager
    │   ├── context/          AuthContext
    │   ├── pages/            Expenses, ExpenseDetail, Budgets, Reports, Settings, AdminDashboard, Signin, Signup
    │   ├── services/         API client and typed service functions
    │   ├── store/            Redux store and expense slice
    │   └── utils/
    ├── vercel.json
    └── .env.example
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo        # admin, default categories and demo data
python manage.py runserver        # http://127.0.0.1:8000
```

Run the backend tests:

```bash
python manage.py test expenses
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env              # optional, defaults to http://127.0.0.1:8000/api/
npm run dev                       # http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env.example`)

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Secret key (required in production) |
| `DJANGO_DEBUG` | `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames, e.g. `retain-api.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s), e.g. `https://retain.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Same as the frontend URL(s) |
| `DATABASE_URL` | PostgreSQL connection string. If empty, SQLite is used |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Admin account created by `seed_demo` |

### Frontend (`frontend/.env.example`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL ending in `/api/` |

---

## Deployment

**Backend on Render (web service + PostgreSQL)**
1. Create a PostgreSQL database on Render and copy its *Internal Database URL*.
2. Create a Web Service from this repository:
   - Root Directory: `backend`
   - Build Command: `bash build.sh`
   - Start Command: `gunicorn config.wsgi:application`
3. Add the backend environment variables above (`DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `CORS_ALLOWED_ORIGINS`, …).

**Frontend on Vercel**
1. Import the repository and set Root Directory to `frontend` (framework: Vite).
2. Add `VITE_API_URL=https://retain-backend-e98e.onrender.com/api/`.
3. Deploy. `vercel.json` makes page refreshes on routes like `/expenses/5` work.

---

## API Reference

Base URL: `/api/`. Every endpoint except sign up and sign in needs the header `Authorization: Token <token>`.

### Authentication & profile

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup/` | Create an account `{name, email, password}`. Always creates a normal user. Returns `{user, token}` |
| POST | `/signin/` | Sign in `{email, password}`. Returns `{user: {id, name, email, role}, token}` |
| GET | `/profile/` | Current user, including `role` (`user` / `admin`) |
| PATCH | `/profile/` | Update `{name, email}` |

### Expenses (own data only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/expenses/` | List your expenses (filters below) |
| POST | `/expenses/` | Create `{title, amount, category, date, payment_method, description}` |
| GET | `/expenses/{id}/` | One expense |
| PUT / PATCH | `/expenses/{id}/` | Update |
| DELETE | `/expenses/{id}/` | Delete |
| GET | `/expenses/summary/?month=10&year=2026` | Monthly dashboard summary: total spent, budget, remaining, status, highest expense, spending by category, recent expenses |

**Query parameters for `GET /expenses/`:** `search`, `category`, `payment_method`, `date_from`, `date_to` (YYYY-MM-DD), `min_amount`, `max_amount`, `ordering` (`date`, `-date`, `amount`, `-amount`), `page`, `page_size`.

Pagination is used only when `page` is sent. The response is then `{count, next, previous, results}`; otherwise you get a plain list.

Users can only see and change their own expenses. Requesting another user's expense returns `404`.

### Budgets (own data only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/budgets/` | List your monthly budgets |
| POST | `/budgets/` | Create or update the budget for a month `{amount, month, year}` |

### Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories/` | Any signed-in user | List all categories |
| POST | `/categories/` | Admin | Create `{name}` |
| PATCH | `/categories/{id}/` | Admin | Rename (expenses are updated too) |
| DELETE | `/categories/{id}/` | Admin | Delete; its expenses move to "Uncategorized" |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/insights/` | Admin | Platform insights (users, expense totals, this month, per-category spending, top/bottom 5 categories, recent expenses, recent users) |

Non-admins get `403 Forbidden` from admin endpoints.

---

## Error Handling
- The API returns clear validation messages, e.g. amount must be greater than zero, unknown category, or duplicate category name.
- The frontend shows those messages in forms, plus loading and empty states.
- If a token expires or becomes invalid, the user is signed out automatically.

## Author
Erica Ishimwe, African Leadership University
