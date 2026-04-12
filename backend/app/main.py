"""
main.py — FastAPI application entry point.
Registers all routers, configures CORS, and creates DB tables on startup.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app import models
from app.routes import (
    auth_routes,
    student_routes,
    academic_routes,
    scholarship_routes,
    application_routes,
    disbursement_routes,
    admin_routes,
)


# ─── Lifespan: create tables on startup ───────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    models.Base.metadata.create_all(bind=engine)
    yield


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Merit Scholarship Management System",
    description=(
        "Automated DBMS-backed portal for scholarship eligibility validation, "
        "application tracking, and disbursement management."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ─────────────────────────────────────────────────────────

app.include_router(auth_routes.router)
app.include_router(student_routes.router)
app.include_router(academic_routes.router)
app.include_router(scholarship_routes.router)
app.include_router(application_routes.router)
app.include_router(disbursement_routes.router)
app.include_router(admin_routes.router)


@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "Merit Scholarship Management System API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
