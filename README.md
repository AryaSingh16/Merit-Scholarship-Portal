# 🎓 Merit Scholarship Management System

An automated, DBMS-backed web portal that replaces a manual paper-based scholarship allocation
process. Built with **FastAPI + PostgreSQL** backend and a **React + Tailwind CSS** SLCM-style
frontend.

---

## Architecture

```
React (Vite)       FastAPI               PostgreSQL (Docker)
   ↓   /api/*  →   Application Logic
                         ↓
               Modular Data Ingestion Layer
               ├── MockDataRepository  (active)
               ├── CSVExcelRepository  (placeholder)
               └── SLCMAPIRepository   (placeholder)
                         ↓
                     ORM (SQLAlchemy)
                         ↓
                     PostgreSQL DB
```

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js 18+](https://nodejs.org/) (for the frontend)

### 1 — Start the backend stack (PostgreSQL + FastAPI)

```bash
cd "c:\Users\Arya\Desktop\merit scholarship"
docker compose up --build -d
```

Wait ~20 seconds for the DB to initialise.

### 2 — Seed the database

```bash
docker compose exec backend python -m app.seed
```

### 3 — Start the React frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Accounts (created by seed)

| Role    | Email                    | Password          |
|---------|--------------------------|-------------------|
| Admin   | admin@merit.edu          | Admin@Merit2024   |
| Student | 22CS001@merit.edu        | Merit@22CS001     |
| Student | 22CS002@merit.edu        | Merit@22CS002     |
| Student | 22EC002@merit.edu        | Merit@22EC002     |
| *(etc)* | `{ID}@merit.edu`         | `Merit@{ID}`      |

---

## Seeded Data

| Entity        | Count |
|---------------|-------|
| Students      | 10    |
| Departments   | 5 (CSE, ECE, ME, EEE, Civil) |
| Scholarships  | 3     |
| Applications  | 11    |
| Disbursements | 5     |

### Scholarships

| Scholarship                    | Min CGPA | Top %  | Amount     |
|--------------------------------|----------|--------|------------|
| Merit Excellence Scholarship   | 9.0      | 10%    | ₹75,000    |
| Academic Achievement Award     | 8.5      | 25%    | ₹50,000    |
| General Merit Scholarship      | 7.5      | 50%    | ₹25,000    |

---

## Eligibility Engine

On every application submission (`POST /api/applications`):

1. System fetches the student's latest `AcademicRecord` for the scholarship's `academic_year`.
2. Counts total students in the student's department (`dept_count`).
3. Computes `rank_cutoff = ceil(dept_count × percentage_cutoff / 100)`.
4. Evaluates:
   - `cgpa_ok = record.cgpa >= scholarship.min_cgpa`
   - `rank_ok  = record.rank <= rank_cutoff`
5. Sets `status = Eligible` if both pass, else `Rejected`, with auto-generated remarks.

---

## API Reference

Swagger UI: **http://localhost:8000/docs**

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/login` | Public |
| GET | `/api/students/me` | Student |
| GET | `/api/students/` | Admin |
| GET | `/api/academic-records/me` | Student |
| GET | `/api/scholarships/` | Both |
| POST | `/api/scholarships/` | Admin |
| POST | `/api/applications/` | Student |
| GET | `/api/applications/me` | Student |
| GET | `/api/applications/` | Admin |
| PATCH | `/api/applications/{id}` | Admin |
| GET | `/api/disbursements/` | Both |
| POST | `/api/disbursements/` | Admin |
| PATCH | `/api/disbursements/{id}` | Admin |
| POST | `/api/admin/seed` | Admin |
| GET | `/api/admin/stats` | Admin |
| POST | `/api/admin/upload-academic-excel` | 501 Placeholder |
| GET | `/api/sync-slcm` | 501 Placeholder |

---

## Data Ingestion Layer — Extending

To swap from mock data to a real source, simply instantiate a different repository:

```python
# data_service.py
from app.data_service import get_repository

# Active MVP
repo = get_repository("mock")

# When Excel upload is approved:
repo = get_repository("csv", file_path="uploads/records.xlsx")

# When SLCM API credentials are available:
repo = get_repository("slcm", base_url="https://slcm.edu/api/v1", api_key="…")
```

The application routes and seed script are **completely decoupled** from the source.

---

## pgAdmin (optional DB browser)

Navigate to **http://localhost:5050**

- Email: `admin@merit.edu`
- Password: `admin123`
- Add server: host=`db`, port=`5432`, db=`merit_scholarship`, user=`merit_user`

---

## Project Structure

```
merit scholarship/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   └── app/
│       ├── main.py            # FastAPI app, routers, CORS
│       ├── database.py        # SQLAlchemy engine + session
│       ├── models.py          # ORM models
│       ├── schemas.py         # Pydantic v2 schemas
│       ├── auth.py            # JWT + RBAC deps
│       ├── data_service.py    # Repository Pattern (modular ingestion)
│       ├── seed.py            # Mock data generator
│       └── routes/
│           ├── auth_routes.py
│           ├── student_routes.py
│           ├── academic_routes.py
│           ├── scholarship_routes.py
│           ├── application_routes.py  # ← Eligibility Engine
│           ├── disbursement_routes.py
│           └── admin_routes.py        # ← Future placeholders
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── api/axiosClient.js
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── TopHeader.jsx
        │   ├── StatCard.jsx
        │   ├── StatusBadge.jsx
        │   ├── DataTable.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── Dashboard.jsx
            ├── ApplicationsPage.jsx
            ├── AcademicsPage.jsx
            ├── DisbursementsPage.jsx
            └── AdminPage.jsx
```
