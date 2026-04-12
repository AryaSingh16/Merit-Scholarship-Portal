"""
application_routes.py — Application submission + Eligibility Engine.

Eligibility Engine Logic:
    ON POST /api/applications (student submits):
        1. Fetch student's latest AcademicRecord for the scholarship's academic_year.
        2. Fetch total students in the same department (for rank cutoff).
        3. rank_cutoff = ceil(dept_count * percentage_cutoff / 100)
        4. cgpa_ok = record.cgpa >= scholarship.min_cgpa
        5. rank_ok  = record.rank <= rank_cutoff
        6. status   = "Eligible" if both, else "Rejected"
        7. Auto-set approval_date and remarks.
"""
import math
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/applications", tags=["Applications"])


def _run_eligibility(
    student: models.Student,
    scholarship: models.Scholarship,
    record: models.AcademicRecord,
    dept_count: int,
) -> tuple[str, str | None]:
    """
    Returns (status: str, remarks: str).
    Pure function — no DB writes.
    """
    rank_cutoff = max(1, math.ceil(dept_count * scholarship.percentage_cutoff / 100))
    cgpa_ok = record.cgpa >= scholarship.min_cgpa
    rank_ok = record.rank <= rank_cutoff

    if cgpa_ok and rank_ok:
        remarks = (
            f"Auto-approved: CGPA {record.cgpa} ≥ {scholarship.min_cgpa}; "
            f"Rank {record.rank} ≤ {rank_cutoff} (top {scholarship.percentage_cutoff}%)"
        )
        return "Eligible", remarks

    reasons = []
    if not cgpa_ok:
        reasons.append(f"CGPA {record.cgpa} < required {scholarship.min_cgpa}")
    if not rank_ok:
        reasons.append(f"Rank {record.rank} not in top {scholarship.percentage_cutoff}% (cutoff: Rank {rank_cutoff})")
    return "Rejected", "Auto-rejected: " + "; ".join(reasons)


# ─── Student: submit application ────────────────────────────────────────────

@router.post("/", response_model=schemas.ApplicationOut, status_code=201)
def create_application(
    payload: schemas.ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_student),
):
    student_id = current_user.student_id

    # Prevent duplicate applications
    existing = (
        db.query(models.Application)
        .filter(
            models.Application.student_id == student_id,
            models.Application.scholarship_id == payload.scholarship_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this scholarship")

    scholarship = db.query(models.Scholarship).filter(
        models.Scholarship.scholarship_id == payload.scholarship_id
    ).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()

    # Latest record in the scholarship's academic year
    record = (
        db.query(models.AcademicRecord)
        .filter(
            models.AcademicRecord.student_id == student_id,
            models.AcademicRecord.academic_year == scholarship.academic_year,
        )
        .order_by(models.AcademicRecord.semester.desc())
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=400,
            detail=f"No academic record found for academic year {scholarship.academic_year}",
        )

    dept_count = (
        db.query(models.Student)
        .filter(models.Student.department == student.department)
        .count()
    )

    status, remarks = _run_eligibility(student, scholarship, record, dept_count)
    approval_date = datetime.utcnow() if status == "Eligible" else None

    application = models.Application(
        student_id=student_id,
        scholarship_id=payload.scholarship_id,
        application_date=datetime.utcnow(),
        status=status,
        approval_date=approval_date,
        remarks=remarks,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    # Load relationships for response
    db.refresh(application)
    application = (
        db.query(models.Application)
        .options(joinedload(models.Application.student), joinedload(models.Application.scholarship))
        .filter(models.Application.application_id == application.application_id)
        .first()
    )
    return application


# ─── Student: own applications ───────────────────────────────────────────────

@router.get("/me", response_model=List[schemas.ApplicationOut])
def my_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_student),
):
    return (
        db.query(models.Application)
        .options(joinedload(models.Application.scholarship))
        .filter(models.Application.student_id == current_user.student_id)
        .order_by(models.Application.application_date.desc())
        .all()
    )


# ─── Admin: all applications ─────────────────────────────────────────────────

@router.get("/", response_model=List[schemas.ApplicationOut])
def list_all_applications(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    return (
        db.query(models.Application)
        .options(
            joinedload(models.Application.student),
            joinedload(models.Application.scholarship),
        )
        .order_by(models.Application.application_date.desc())
        .all()
    )


# ─── Admin: approve / reject ─────────────────────────────────────────────────

@router.patch("/{application_id}", response_model=schemas.ApplicationOut)
def update_application_status(
    application_id: int,
    payload: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    app = db.query(models.Application).filter(
        models.Application.application_id == application_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = payload.status
    if payload.remarks:
        app.remarks = payload.remarks
    if payload.status == "Approved":
        app.approval_date = datetime.utcnow()
        # Automatically generate a pending disbursement
        existing_disb = db.query(models.Disbursement).filter(models.Disbursement.application_id == app.application_id).first()
        if not existing_disb:
            sch = db.query(models.Scholarship).filter(models.Scholarship.scholarship_id == app.scholarship_id).first()
            if sch:
                disb = models.Disbursement(
                    application_id=app.application_id,
                    amount=sch.amount,
                    disbursement_date=datetime.utcnow(),
                    stage="Full Amount",
                    payment_status="Pending"
                )
                db.add(disb)
    db.commit()
    db.refresh(app)
    app = (
        db.query(models.Application)
        .options(joinedload(models.Application.student), joinedload(models.Application.scholarship))
        .filter(models.Application.application_id == application_id)
        .first()
    )
    return app


@router.get("/{application_id}", response_model=schemas.ApplicationOut)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    app = (
        db.query(models.Application)
        .options(joinedload(models.Application.student), joinedload(models.Application.scholarship))
        .filter(models.Application.application_id == application_id)
        .first()
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user.role == "student" and app.student_id != current_user.student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return app
