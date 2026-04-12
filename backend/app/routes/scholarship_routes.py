"""scholarship_routes.py — Scholarship catalog management."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/scholarships", tags=["Scholarships"])


@router.get("/", response_model=List[schemas.ScholarshipOut])
def list_scholarships(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    """Any authenticated user: browse available scholarships."""
    return db.query(models.Scholarship).all()


@router.get("/{scholarship_id}", response_model=schemas.ScholarshipOut)
def get_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    sch = db.query(models.Scholarship).filter(
        models.Scholarship.scholarship_id == scholarship_id
    ).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return sch


@router.post("/", response_model=schemas.ScholarshipOut, status_code=201)
def create_scholarship(
    payload: schemas.ScholarshipCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    """Admin only: add a new scholarship."""
    sch = models.Scholarship(**payload.model_dump())
    db.add(sch)
    db.commit()
    db.refresh(sch)
    return sch


@router.delete("/{scholarship_id}", status_code=204)
def delete_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    sch = db.query(models.Scholarship).filter(
        models.Scholarship.scholarship_id == scholarship_id
    ).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    db.delete(sch)
    db.commit()
