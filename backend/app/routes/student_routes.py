"""student_routes.py — Student profile endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("/", response_model=List[schemas.StudentOut])
def list_students(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    """Admin only: list all students."""
    return db.query(models.Student).all()


@router.get("/me", response_model=schemas.StudentOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Student: view own profile."""
    if current_user.role == "admin":
        raise HTTPException(status_code=403, detail="Use /api/students for admin")
    student = db.query(models.Student).filter(
        models.Student.student_id == current_user.student_id
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.get("/{student_id}", response_model=schemas.StudentOut)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Admin: any student; Student: own profile only."""
    if current_user.role == "student" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
