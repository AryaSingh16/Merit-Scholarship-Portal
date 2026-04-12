"""academic_routes.py — Read-only academic records."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/academic-records", tags=["Academic Records"])


@router.get("/me", response_model=List[schemas.AcademicRecordOut])
def get_my_records(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_student),
):
    """Student: view own academic records ordered by semester."""
    return (
        db.query(models.AcademicRecord)
        .filter(models.AcademicRecord.student_id == current_user.student_id)
        .order_by(models.AcademicRecord.semester)
        .all()
    )


@router.get("/{student_id}", response_model=List[schemas.AcademicRecordOut])
def get_student_records(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Admin: any student's records; Student: own only."""
    if current_user.role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    records = (
        db.query(models.AcademicRecord)
        .filter(models.AcademicRecord.student_id == student_id)
        .order_by(models.AcademicRecord.semester)
        .all()
    )
    return records


@router.get("/", response_model=List[schemas.AcademicRecordOut])
def list_all_records(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    """Admin only: all academic records."""
    return db.query(models.AcademicRecord).all()
