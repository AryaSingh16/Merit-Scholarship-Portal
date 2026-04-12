"""
schemas.py — Pydantic v2 schemas for request validation and response serialization.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    student_id: Optional[str] = None
    name: Optional[str] = None


# ─── Student ──────────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    student_id: str
    name: str
    department: str
    section: str
    cgpa: float


class StudentOut(StudentBase):
    model_config = {"from_attributes": True}


# ─── Academic Record ─────────────────────────────────────────────────────────

class AcademicRecordBase(BaseModel):
    semester: int
    sgpa: float
    cgpa: float
    academic_year: str
    rank: int


class AcademicRecordOut(AcademicRecordBase):
    record_id: int
    student_id: str
    model_config = {"from_attributes": True}


# ─── Scholarship ─────────────────────────────────────────────────────────────

class ScholarshipBase(BaseModel):
    scholarship_name: str
    min_cgpa: float
    percentage_cutoff: float
    academic_year: str
    amount: float
    description: Optional[str] = None


class ScholarshipCreate(ScholarshipBase):
    pass


class ScholarshipOut(ScholarshipBase):
    scholarship_id: int
    model_config = {"from_attributes": True}


# ─── Application ─────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    scholarship_id: int


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Approved|Rejected)$")
    remarks: Optional[str] = None


class ApplicationOut(BaseModel):
    application_id: int
    student_id: str
    scholarship_id: int
    application_date: datetime
    status: str
    approval_date: Optional[datetime] = None
    remarks: Optional[str] = None
    # Nested
    student: Optional[StudentOut] = None
    scholarship: Optional[ScholarshipOut] = None
    model_config = {"from_attributes": True}


# ─── Disbursement ─────────────────────────────────────────────────────────────

class DisbursementCreate(BaseModel):
    application_id: int
    amount: float
    stage: str
    payment_status: str = "Pending"


class DisbursementStatusUpdate(BaseModel):
    payment_status: str = Field(..., pattern="^(Pending|Completed)$")


class DisbursementOut(BaseModel):
    disbursement_id: int
    application_id: int
    amount: float
    disbursement_date: datetime
    stage: str
    payment_status: str
    # Nested
    application: Optional[ApplicationOut] = None
    model_config = {"from_attributes": True}


# ─── Admin Dashboard Stats ────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_students: int
    total_applications: int
    eligible_count: int
    approved_count: int
    rejected_count: int
    pending_count: int
    total_disbursed: float


class StudentDashboardStats(BaseModel):
    student: StudentOut
    latest_cgpa: Optional[float]
    latest_rank: Optional[int]
    total_applications: int
    approved_applications: int
    total_disbursed: float
