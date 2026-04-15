# 🎓 Merit Scholarship Management System - Technical Data Extraction

This document provides a highly granular technical breakdown of the Merit Scholarship Management System codebase. It is designed to serve as the primary source for generating a formal DBMS project report, covering architecture, database design, normalization, logic, and implementation details.

---

# 1. Project Overview

*   **Project Title**: Merit Scholarship Management System (MSMS)
*   **Problem Statement**: Manual tracking of academic performance and scholarship eligibility is prone to human error, lacks transparency, and involves redundant data entry between academic and financial departments.
*   **Objectives**:
    *   Automate scholarship eligibility validation using real-time academic data.
    *   Centralize student scholarship applications and approval workflows.
    *   Track disbursement stages and payment history.
    *   Provide administrative oversight of the entire scholarship lifecycle.
*   **Scope**: The system is intended for educational institutions to manage "Merit-Based" scholarships. It handles user authentication (Admin/Student), academic record ingestion (Mock/API/CSV), application processing, and financial disbursement tracking.
*   **Key Features/Modules**:
    *   **RBAC Authentication**: Secure login for Students and Administrators.
    *   **Automated Eligibility Engine**: Instant validation based on CGPA and relative department rank.
    *   **Application Tracking**: Real-time status updates (Pending, Eligible, Approved, Rejected).
    *   **Disbursement Manager**: Tracking payment installments and completion status.
    *   **Data Ingestion Layer**: Pluggable architecture to sync with external academic databases (SLCM).

---

# 2. Tech Stack (Very Detailed)

## 2.1 Frontend
*   **Framework**: React (v18.3.1)
*   **Build Tool**: Vite (v5.3.1)
*   **Styling**: Vanilla CSS + Tailwind CSS (v3.4.4) for layout and typography.
*   **State Management**: React Context API (`AuthContext`) for global authentication state.
*   **Routing**: React Router DOM (v6.23.1) for declarative client-side navigation.
*   **Icons**: Lucide-React for modern vector icons.
*   **Notifications**: React Hot Toast for non-blocking UI feedback.
*   **HTTP Client**: Axios for asynchronous API communication.

## 2.2 Backend
*   **Language**: Python (v3.10+)
*   **Framework**: FastAPI (v0.111+) for high-performance asynchronous RESTful APIs.
*   **Validation**: Pydantic for strict data type enforcement and schema validation.
*   **Authentication**:
    *   **Hashing**: Passlib (Bcrypt) for secure password storage.
    *   **Tokens**: Jose (JWT) for stateless session management via Bearer tokens.
*   **Architecture Pattern**: Layered Architecture (Routes → Schemas → Models → Database).
*   **Documentation**: Swagger/OpenAPI (Auto-generated at `/docs`).

## 2.3 Database
*   **Type**: Relational Database (SQL)
*   **DBMS**: PostgreSQL
*   **ORM**: SQLAlchemy (v2.0+) using Declarative Base and Session management.
*   **Driver**: `psycopg2-binary` for Python-Postgres connectivity.

---

# 3. System Architecture

*   **Full Flow**:
    1.  **Frontend**: React client sends an HTTP request (carrying a JWT header if authenticated).
    2.  **CORS/Middleware**: FastAPI validates the request origin and handles JWT decoding.
    3.  **Route Handler**: Routes identify the operation (e.g., `POST /api/applications`).
    4.  **Business Logic (Eligibility Engine)**: The backend queries `AcademicRecord` and `Scholarship` definitions to run validation logic.
    5.  **ORM/Persistence**: SQLAlchemy converts Python objects to SQL queries and commits changes to PostgreSQL.
    6.  **Response**: The backend returns a Pydantic-validated JSON object to the frontend.
*   **Request-Response Lifecycle**:
    *   `Request` → `JSON Validation` → `Auth Check` → `DB Transaction` → `JSON Response`.
*   **Authentication/Authorization Flow**:
    *   Login → Backend verifies hash → JWT issued.
    *   Subsequent requests → JWT in `Authorization: Bearer <token>` → `Depends(get_current_user)`.

---

# 4. Functional Modules

### 4.1 Authentication
*   **Purpose**: Manage user identity and access levels.
*   **Operations**: Register (Student), Login, Get Profile.
*   **APIs**: `POST /api/auth/login`, `GET /api/auth/me`.

### 4.2 Student/User Management
*   **Purpose**: Maintain student profiles and academic metadata.
*   **Operations**: View profile, Fetch academic performance.
*   **APIs**: `GET /api/students/profile`, `GET /api/academics/me`.

### 4.3 Scholarship Application & Eligibility Engine
*   **Purpose**: Process applications and auto-validate criteria.
*   **Operations**: Submit application, Run eligibility check (CGPA + Rank).
*   **APIs**: `POST /api/applications/`, `GET /api/applications/me`.

### 4.4 Admin Panel
*   **Purpose**: Configuration and oversight.
*   **Operations**: Create scholarships, Approve/Reject applications, Seed data.
*   **APIs**: `POST /api/scholarships/`, `PATCH /api/applications/{id}`, `POST /api/admin/seed-mock-data`.

### 4.5 Disbursement Workflow
*   **Purpose**: Track financial payout status.
*   **Operations**: Generate installments, Mark as paid.
*   **APIs**: `GET /api/disbursements/`, `PATCH /api/disbursements/{id}/status`.

---

# 5. Database Design (VERY IMPORTANT)

## 5.1 Entities / Tables

| Table Name | Purpose |
| :--- | :--- |
| `users` | Stores login credentials, roles (Student/Admin), and student links. |
| `students` | Core student profile (Identifier, Department, cumulative CGPA). |
| `academic_records` | Detailed semester-wise SGPA/CGPA and relative department rank. |
| `scholarships` | Definitions of scholarship types, amounts, and eligibility criteria. |
| `applications` | Links students to scholarships with status and auto-generated remarks. |
| `disbursements` | Financial tracking of payouts associated with approved applications. |

## 5.2 Table Schemas

### Table: `users`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | - |
| `email` | String(255) | Unique, Not Null, Index | - |
| `hashed_password` | String(255) | Not Null | - |
| `role` | String(20) | Not Null | "student" |
| `student_id` | String(20) | FK (`students.student_id`), Nullable | - |
| `is_active` | Boolean | Not Null | True |

### Table: `students`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `student_id` | String(20) | PK, Index | - |
| `name` | String(100) | Not Null | - |
| `department` | String(50) | Not Null | - |
| `section` | String(5) | Not Null | - |
| `cgpa` | Float | Not Null | - |

### Table: `academic_records`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `record_id` | Integer | PK, Auto-increment | - |
| `student_id` | String(20) | FK (`students.student_id`), Not Null | - |
| `semester` | Integer | Not Null | - |
| `sgpa` | Float | Not Null | - |
| `cgpa` | Float | Not Null | - |
| `academic_year` | String(10) | Not Null | - |
| `rank` | Integer | Not Null | - |

### Table: `scholarships`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `scholarship_id` | Integer | PK, Auto-increment | - |
| `scholarship_name` | String(100) | Not Null | - |
| `min_cgpa` | Float | Not Null | - |
| `percentage_cutoff`| Float | Not Null (e.g. 10.0 for Top 10%) | - |
| `academic_year` | String(10) | Not Null | - |
| `amount` | Float | Not Null | 0.0 |
| `description` | Text | Nullable | - |

### Table: `applications`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `application_id` | Integer | PK, Auto-increment | - |
| `student_id` | String(20) | FK (`students.student_id`), Not Null | - |
| `scholarship_id` | Integer | FK (`scholarships.scholarship_id`), Not Null | - |
| `application_date` | DateTime | Not Null | - |
| `status` | String(20) | Not Null | "Pending" |
| `approval_date` | DateTime | Nullable | - |
| `remarks` | Text | Nullable | - |

### Table: `disbursements`
| Column Name | Data Type | Constraints | Default |
| :--- | :--- | :--- | :--- |
| `disbursement_id`| Integer | PK, Auto-increment | - |
| `application_id` | Integer | FK (`applications.application_id`), Not Null| - |
| `amount` | Float | Not Null | - |
| `disbursement_date`| DateTime | Not Null | - |
| `stage` | String(50) | Not Null (e.g. "Full Amount") | - |
| `payment_status` | String(20) | Not Null | "Pending" |

## 5.3 Relationships

1.  **One-to-One**: `users` ↔ `students`. A user account optionally maps to exactly one student profile.
2.  **One-to-Many**:
    *   `students` ↔ `academic_records`. One student has multiple semester records.
    *   `students` ↔ `applications`. One student can apply for multiple distinct scholarships.
    *   `scholarships` ↔ `applications`. One scholarship can have many applicants.
    *   `applications` ↔ `disbursements`. One approved application can result in multiple disbursement stages (installments).

## 5.4 ER Model (Textual Representation)

*   **Entities**: User, Student, AcademicRecord, Scholarship, Application, Disbursement.
*   **Student** (1) possesses (N) **AcademicRecords**.
*   **Student** (1) submits (N) **Applications**.
*   **Scholarship** (1) receives (N) **Applications**.
*   **Application** (1) results in (N) **Disbursements**.
*   **User** (1) acts as (1) **Student** (Role-based link).

---

# 6. Normalization Analysis

### 6.1 First Normal Form (1NF)
*   All columns contain atomic values. For example, `remarks` and `description` are single text fields, and student IDs are unique identifiers. No repeating groups exist.

### 6.2 Second Normal Form (2NF)
*   The system satisfies 2NF because all non-prime attributes are fully functionally dependent on the primary key.
*   Example: In `academic_records`, `sgpa` and `cgpa` depend entirely on the composite of `student_id` and `semester` (enforced by application logic and unique PK).

### 6.3 Third Normal Form (3NF)
*   The schema avoids transitive dependencies.
*   *Optimization identified*: The `students` table contains `cgpa` (cumulative), which is technically derivable from `academic_records`. However, it is stored in `students` for performance (Direct Display) and represents the "Last Validated CGPA". This is a controlled redundancy (denormalization) for read-heavy operations like the Dashboard.

---

# 7. ORM / Query Layer (CRITICAL)

The system uses **SQLAlchemy ORM**. Below is a mapping of key Python operations to their SQL equivalents used in the project.

### 7.1 Fetching Eligible Students (Join Query)
*   **ORM**:
    ```python
    db.query(models.Application).options(joinedload(models.Application.student)).all()
    ```
*   **SQL Equivalent**:
    ```sql
    SELECT applications.*, students.*
    FROM applications
    LEFT JOIN students ON applications.student_id = students.student_id;
    ```

### 7.2 Fetching Latest Academic Record
*   **ORM**:
    ```python
    db.query(models.AcademicRecord).filter(student_id=sid).order_by(AcademicRecord.semester.desc()).first()
    ```
*   **SQL Equivalent**:
    ```sql
    SELECT * FROM academic_records
    WHERE student_id = '23CS001'
    ORDER BY semester DESC
    LIMIT 1;
    ```

---

# 8. SQL (DDL + DML Reconstruction)

## 8.1 DDL (Data Definition Language)
```sql
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    section VARCHAR(5) NOT NULL,
    cgpa FLOAT NOT NULL
);

CREATE TABLE scholarships (
    scholarship_id SERIAL PRIMARY KEY,
    scholarship_name VARCHAR(100) NOT NULL,
    min_cgpa FLOAT NOT NULL,
    percentage_cutoff FLOAT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    amount FLOAT DEFAULT 0.0
);

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) REFERENCES students(student_id) ON DELETE CASCADE,
    scholarship_id INTEGER REFERENCES scholarships(scholarship_id),
    application_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    remarks TEXT
);
```

## 8.2 DML (Data Manipulation Language)

*   **Sample Insert (Scholarship)**:
    ```sql
    INSERT INTO scholarships (scholarship_name, min_cgpa, percentage_cutoff, academic_year, amount)
    VALUES ('Excellence Award', 9.0, 5.0, '2025-26', 50000.0);
    ```

*   **Update Status**:
    ```sql
    UPDATE applications
    SET status = 'Approved', approval_date = NOW()
    WHERE application_id = 1;
    ```

---

# 9. Advanced DB Features

*   👉 **Inferred from implementation**:
*   **Views**: The system can benefit from a `v_student_eligibility` view that joins `students` and their latest `academic_records` for the current year.
*   **Triggers**: A trigger is suggested for the `applications` table to auto-generate a `disbursements` entry when `status` transitions to 'Approved' (Currently handled by FastAPI logic).
*   **Indexing**: B-Tree indexes are applied to `student_id` and `email` for $O(\log n)$ lookup performance.

---

# 10. API Design

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user and return JWT. |
| `GET` | `/api/students/profile` | Retrieve student details for dashboard. |
| `GET` | `/api/scholarships/` | List all available scholarships. |
| `POST` | `/api/applications/` | Submit application and trigger Eligibility Engine. |
| `PATCH`| `/api/applications/{id}`| Admin: Change application status (Approve/Reject). |
| `GET` | `/api/disbursements/` | Admin: Track all payouts. |

---

# 11. Data Flow (Eligibility Logic)

### Step-by-Step: Apply for Scholarship
1.  **User Trigger**: Student clicks "Apply" on scholarship ID `X`.
2.  **Read Operation 1**: Backend fetches Student `S` profile and Scholarship `X` criteria.
3.  **Read Operation 2**: Backend fetches latest `AcademicRecord` for `S` in the scholarship's year.
4.  **Computation (Engine)**:
    *   Check `S.cgpa >= X.min_cgpa`.
    *   Count total students in `S.department`.
    *   Calculate `rank_cutoff = ceil(total_count * X.percentage_cutoff / 100)`.
    *   Check `S.rank <= rank_cutoff`.
5.  **Write Operation**:
    *   Insert into `applications` with state determined by computation (`Eligible` / `Rejected`).
6.  **Response**: Frontend displays immediate feedback based on engine result.

---

# 12. Screens / UI Mapping

*   **Login View**: Interfaces with `auth_routes.py` for token acquisition.
*   **Dashboard**: Aggregates data from `student_routes.py` and `scholarship_routes.py`.
*   **Academics Page**: Maps to `academic_routes.py` for historical performance display.
*   **Applications Page**: CRUD operations via `application_routes.py`.
*   **Admin Console**: Multi-module access to `admin_routes.py`.

---

# 13. Sample Data

*   **Student**: `('23CS001', 'Arya Singh', 'CSE', 'A', 9.4)`
*   **Academic Record**: `(1, '23CS001', 3, 9.4, 9.4, '2025-26', 1)`
*   **Scholarship**: `(1, 'Merit 2025', 9.0, 10.0, '2025-26', 25000.0)`

---

# 14. Constraints & Integrity

*   **Primary Keys**: Uniformly used (`student_id`, `id`, `record_id`).
*   **Foreign Keys**: Enforce referential integrity (e.g., `applications` cannot exist without a valid `student_id`).
*   **On Delete Cascade**: Deleting a student profile automatically purges their academic records and applications.
*   **Check Constraints**: (Suggested) `cgpa BETWEEN 0 AND 10` on `students` and `records`.

---

# 15. Assumptions

*   Students are ranked within their respective departments only.
*   CGPA is calculated on a 10.0 scale.
*   Each student has exactly one user account linked via `student_id`.

---

# 16. Limitations

*   Current system handles ranking based on a static field in `AcademicRecord` rather than real-time sorting of the entire student body (for performance).
*   Encryption is limited to password hashing; data in transit relies on TLS (handled by infrastructure).

---

# 17. Future Improvements

*   **Analytics Dashboard**: Using SQL Aggregations (`GROUP BY department`) to visualize scholarship distribution.
*   **Scaling**: Migration to a distributed cache (Redis) for session management.
*   **PDF Generation**: Auto-generating scholarship certificates using backend libraries.

---

