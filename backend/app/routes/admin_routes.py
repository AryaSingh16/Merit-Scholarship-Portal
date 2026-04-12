"""
admin_routes.py — Admin-only utilities: seed trigger, dashboard stats, and
future-ready placeholders for Excel upload and SLCM sync.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.seed import reset_and_seed

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ─── Seed / Reset ─────────────────────────────────────────────────────────────

@router.post("/seed", summary="Re-seed database with mock data")
def trigger_seed(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    """
    Drops and re-populates all tables using the MockDataRepository.
    Use with caution — this is destructive.
    """
    counts = reset_and_seed(db)
    return {"message": "Database re-seeded successfully", "record_counts": counts}


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.DashboardStats)
def admin_dashboard_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    total_students = db.query(models.Student).count()
    apps = db.query(models.Application).all()
    total_applications = len(apps)
    eligible_count = sum(1 for a in apps if a.status == "Eligible")
    approved_count = sum(1 for a in apps if a.status == "Approved")
    rejected_count = sum(1 for a in apps if a.status == "Rejected")
    pending_count  = sum(1 for a in apps if a.status == "Pending")

    disbursements = db.query(models.Disbursement).all()
    total_disbursed = sum(
        d.amount for d in disbursements if d.payment_status == "Completed"
    )

    return schemas.DashboardStats(
        total_students=total_students,
        total_applications=total_applications,
        eligible_count=eligible_count,
        approved_count=approved_count,
        rejected_count=rejected_count,
        pending_count=pending_count,
        total_disbursed=total_disbursed,
    )


@router.get("/student-stats/{student_id}", response_model=schemas.StudentDashboardStats)
def student_dashboard_stats(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = (
        db.query(models.AcademicRecord)
        .filter(models.AcademicRecord.student_id == student_id)
        .order_by(models.AcademicRecord.semester.desc())
        .all()
    )
    latest_cgpa = records[0].cgpa if records else None
    latest_rank = records[0].rank if records else None

    apps = db.query(models.Application).filter(models.Application.student_id == student_id).all()
    total_applications = len(apps)
    approved_applications = sum(1 for a in apps if a.status == "Approved")

    disbursements = (
        db.query(models.Disbursement)
        .join(models.Application)
        .filter(models.Application.student_id == student_id)
        .all()
    )
    total_disbursed = sum(d.amount for d in disbursements if d.payment_status == "Completed")

    return schemas.StudentDashboardStats(
        student=schemas.StudentOut.model_validate(student),
        latest_cgpa=latest_cgpa,
        latest_rank=latest_rank,
        total_applications=total_applications,
        approved_applications=approved_applications,
        total_disbursed=total_disbursed,
    )


# ─── Future-Ready Placeholders ────────────────────────────────────────────────

@router.post(
    "/upload-academic-excel",
    summary="[PLACEHOLDER] Upload academic records via Excel/CSV",
    status_code=501,
)
def upload_academic_excel():
    """
    PLACEHOLDER — Not yet implemented.

    Once admin approval is granted, this endpoint will:
        1. Accept: multipart/form-data with an UploadFile (xlsx or csv).
        2. Parse using CSVExcelRepository (data_service.py).
        3. Validate column schema: student_id, semester, sgpa, cgpa, academic_year, rank.
        4. Upsert records into the academic_records table.
        5. Return a summary of inserted / updated rows.

    Expected columns:
        student_id (str), semester (int), sgpa (float), cgpa (float),
        academic_year (str e.g. "2023-24"), rank (int)
    """
    raise HTTPException(
        status_code=501,
        detail="Excel/CSV upload module is scaffolded but not yet activated. See CSVExcelRepository in data_service.py.",
    )


@router.get(
    "/sync-slcm",
    summary="[PLACEHOLDER] Sync academic records from SLCM portal API",
    status_code=501,
)
def sync_slcm():
    """
    PLACEHOLDER — Not yet implemented.

    Once SLCM API credentials are obtained, this endpoint will:
        1. Read SLCM_BASE_URL and SLCM_API_KEY from environment variables.
        2. Instantiate SLCMAPIRepository (data_service.py).
        3. Fetch all academic records for enrolled students.
        4. Upsert into the academic_records table.
        5. Return sync summary (fetched, inserted, updated counts).

    Required environment variables:
        SLCM_BASE_URL — e.g. https://slcm.university.edu/api/v1
        SLCM_API_KEY  — Bearer token or API key
    """
    raise HTTPException(
        status_code=501,
        detail="SLCM sync not yet activated. See SLCMAPIRepository in data_service.py.",
    )
