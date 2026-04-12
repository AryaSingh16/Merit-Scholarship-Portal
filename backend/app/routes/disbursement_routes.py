"""disbursement_routes.py — Disbursement tracking."""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/api/disbursements", tags=["Disbursements"])


@router.get("/", response_model=List[schemas.DisbursementOut])
def list_disbursements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Disbursement).options(
        joinedload(models.Disbursement.application).joinedload(models.Application.scholarship),
        joinedload(models.Disbursement.application).joinedload(models.Application.student),
    )
    if current_user.role == "student":
        q = q.join(models.Application).filter(
            models.Application.student_id == current_user.student_id
        )
    return q.order_by(models.Disbursement.disbursement_date.desc()).all()


@router.get("/{disbursement_id}", response_model=schemas.DisbursementOut)
def get_disbursement(
    disbursement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    disb = (
        db.query(models.Disbursement)
        .options(
            joinedload(models.Disbursement.application).joinedload(models.Application.scholarship),
            joinedload(models.Disbursement.application).joinedload(models.Application.student),
        )
        .filter(models.Disbursement.disbursement_id == disbursement_id)
        .first()
    )
    if not disb:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    if (current_user.role == "student" and
            disb.application.student_id != current_user.student_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return disb


@router.post("/", response_model=schemas.DisbursementOut, status_code=201)
def create_disbursement(
    payload: schemas.DisbursementCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    """Admin: create a new disbursement for an Approved application."""
    app = db.query(models.Application).filter(
        models.Application.application_id == payload.application_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status not in ("Approved", "Eligible"):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot disburse; application status is '{app.status}'",
        )
    disb = models.Disbursement(
        application_id=payload.application_id,
        amount=payload.amount,
        disbursement_date=datetime.utcnow(),
        stage=payload.stage,
        payment_status=payload.payment_status,
    )
    db.add(disb)
    db.commit()
    db.refresh(disb)
    disb = (
        db.query(models.Disbursement)
        .options(
            joinedload(models.Disbursement.application).joinedload(models.Application.scholarship),
            joinedload(models.Disbursement.application).joinedload(models.Application.student),
        )
        .filter(models.Disbursement.disbursement_id == disb.disbursement_id)
        .first()
    )
    return disb


@router.patch("/{disbursement_id}", response_model=schemas.DisbursementOut)
def update_payment_status(
    disbursement_id: int,
    payload: schemas.DisbursementStatusUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.require_admin),
):
    disb = db.query(models.Disbursement).filter(
        models.Disbursement.disbursement_id == disbursement_id
    ).first()
    if not disb:
        raise HTTPException(status_code=404, detail="Disbursement not found")
    disb.payment_status = payload.payment_status
    db.commit()
    db.refresh(disb)
    return disb
