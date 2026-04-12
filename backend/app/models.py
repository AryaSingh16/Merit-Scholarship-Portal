"""
models.py — SQLAlchemy ORM models corresponding to the ER schema.
Relationships are declared here so SQLAlchemy can join tables automatically.
"""
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Text,
    ForeignKey, Boolean,
)
from sqlalchemy.orm import relationship
from app.database import Base


# ─── Users (Auth) ────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")   # "student" | "admin"
    student_id = Column(String(20), ForeignKey("students.student_id"), nullable=True)
    is_active = Column(Boolean, default=True)

    student = relationship("Student", back_populates="user")


# ─── Student ──────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String(20), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    section = Column(String(5), nullable=False)
    cgpa = Column(Float, nullable=False)

    user = relationship("User", back_populates="student", uselist=False)
    academic_records = relationship("AcademicRecord", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")


# ─── Academic Record (read-only source of truth) ─────────────────────────────

class AcademicRecord(Base):
    __tablename__ = "academic_records"

    record_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, nullable=False)
    sgpa = Column(Float, nullable=False)
    cgpa = Column(Float, nullable=False)          # cumulative CGPA up to this semester
    academic_year = Column(String(10), nullable=False)
    rank = Column(Integer, nullable=False)         # rank within the student's department

    student = relationship("Student", back_populates="academic_records")


# ─── Scholarship ──────────────────────────────────────────────────────────────

class Scholarship(Base):
    __tablename__ = "scholarships"

    scholarship_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    scholarship_name = Column(String(100), nullable=False)
    min_cgpa = Column(Float, nullable=False)
    percentage_cutoff = Column(Float, nullable=False)   # e.g. 10.0 → top 10 %
    academic_year = Column(String(10), nullable=False)
    amount = Column(Float, nullable=False, default=0.0) # disbursement amount (INR)
    description = Column(Text, nullable=True)

    applications = relationship("Application", back_populates="scholarship")


# ─── Application ─────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(String(20), ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.scholarship_id"), nullable=False)
    application_date = Column(DateTime, nullable=False)
    # Pending → auto-set to Eligible/Rejected by eligibility engine → admin can Approve
    status = Column(String(20), nullable=False, default="Pending")
    approval_date = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)

    student = relationship("Student", back_populates="applications")
    scholarship = relationship("Scholarship", back_populates="applications")
    disbursements = relationship("Disbursement", back_populates="application", cascade="all, delete-orphan")


# ─── Disbursement ─────────────────────────────────────────────────────────────

class Disbursement(Base):
    __tablename__ = "disbursements"

    disbursement_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.application_id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    disbursement_date = Column(DateTime, nullable=False)
    stage = Column(String(50), nullable=False)            # e.g. "First Installment" / "Full Amount"
    payment_status = Column(String(20), nullable=False, default="Pending")  # Pending | Completed

    application = relationship("Application", back_populates="disbursements")
