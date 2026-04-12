"""
seed.py — Mock data generator and database seeder.

Run inside Docker:
    docker compose exec backend python -m app.seed

Or triggered via the Admin API endpoint:
    POST /api/admin/seed
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models
from app.auth import hash_password
from app.data_service import MockDataRepository
# ─── Master student list (mirrors SLCM roster) ────────────────────────────────
STUDENTS = [
    {"student_id": "23CS001", "name": "Aarav Kapoor",     "department": "CSE",   "section": "A", "cgpa": 9.4},
    {"student_id": "23CS002", "name": "Ishani Iyer",      "department": "CSE",   "section": "A", "cgpa": 8.9},
    {"student_id": "23CS003", "name": "Vihaan Gupta",     "department": "CSE",   "section": "B", "cgpa": 7.8},
    {"student_id": "23EC001", "name": "Aisha Siddiqui",   "department": "ECE",   "section": "A", "cgpa": 9.2},
    {"student_id": "23EC002", "name": "Arjun Reddy",      "department": "ECE",   "section": "B", "cgpa": 8.6},
    {"student_id": "23ME001", "name": "Kavya Nair",       "department": "ME",    "section": "A", "cgpa": 8.1},
    {"student_id": "23ME002", "name": "Sameer Deshmukh",  "department": "ME",    "section": "B", "cgpa": 8.4},
    {"student_id": "23EE001", "name": "Myra Rao",         "department": "EEE",   "section": "A", "cgpa": 9.1},
    {"student_id": "23CV001", "name": "Rohan Mehra",      "department": "Civil", "section": "A", "cgpa": 8.3},
    {"student_id": "23CV002", "name": "Zara Khan",        "department": "Civil", "section": "B", "cgpa": 7.5},
]

SCHOLARSHIPS = [
    {
        "scholarship_name": "Manipal Merit Excellence Scholarship",
        "min_cgpa": 9.0,
        "percentage_cutoff": 10.0,
        "academic_year": "2025-26",
        "amount": 75000.0,
        "description": "Awarded to top performers with CGPA ≥ 9.0 (Top 10%)",
    },
    {
        "scholarship_name": "Manipal Academic Achievement Award",
        "min_cgpa": 8.5,
        "percentage_cutoff": 25.0,
        "academic_year": "2025-26",
        "amount": 50000.0,
        "description": "Recognizing top 25% performers with CGPA ≥ 8.5",
    },
    {
        "scholarship_name": "General Merit Support",
        "min_cgpa": 7.5,
        "percentage_cutoff": 50.0,
        "academic_year": "2025-26",
        "amount": 25000.0,
        "description": "Broad-based merit support for students in the top 50%.",
    },
]


def reset_and_seed(db: Session) -> dict:
    """Drop all rows (in dependency order) then repopulate."""
    print("🗑  Clearing existing data …")
    db.query(models.Disbursement).delete()
    db.query(models.Application).delete()
    db.query(models.AcademicRecord).delete()
    db.query(models.Scholarship).delete()
    db.query(models.User).delete()
    db.query(models.Student).delete()
    db.commit()

    # ── Students ──────────────────────────────────────────────────────────────
    print("👤 Seeding students …")
    student_objs = []
    for s in STUDENTS:
        student = models.Student(**s)
        db.add(student)
        student_objs.append(student)
    db.commit()

    # ── User accounts (student credentials mirror SLCM) ──────────────────────
    print("🔑 Creating user accounts …")
    for s in STUDENTS:
        user = models.User(
            email=f"{s['student_id']}@manipal.edu",
            hashed_password=hash_password(f"Manipal@{s['student_id']}"),
            role="student",
            student_id=s["student_id"],
        )
        db.add(user)

    # Admin account
    admin = models.User(
        email="admin@manipal.edu",
        hashed_password=hash_password("Admin@Manipal2025"),
        role="admin",
        student_id=None,
    )
    db.add(admin)
    db.commit()

    # ── Academic Records (from MockDataRepository) ───────────────────────────
    print("📚 Seeding academic records …")
    repo = MockDataRepository()
    records = repo.get_academic_records()
    for r in records:
        rec = models.AcademicRecord(
            student_id=r.student_id,
            semester=r.semester,
            sgpa=r.sgpa,
            cgpa=r.cgpa,
            academic_year=r.academic_year,
            rank=r.rank,
        )
        db.add(rec)
    db.commit()

    # ── Scholarships ─────────────────────────────────────────────────────────
    print("🏆 Seeding scholarships …")
    scholarship_objs = []
    for sch in SCHOLARSHIPS:
        s_obj = models.Scholarship(**sch)
        db.add(s_obj)
        scholarship_objs.append(s_obj)
    db.commit()

    # Refresh to get IDs
    for s_obj in scholarship_objs:
        db.refresh(s_obj)

    merit_excellence = scholarship_objs[0]
    academic_achievement = scholarship_objs[1]
    general_merit = scholarship_objs[2]

    # ── Pre-seeded Applications ───────────────────────────────────────────────
    print("📝 Seeding applications …")
    import math

    def dept_size(dept: str) -> int:
        return sum(1 for s in STUDENTS if s["department"] == dept)

    def calc_eligibility(student_id: str, scholarship: models.Scholarship) -> tuple:
        """Returns (status, remarks)."""
        recs = [r for r in records
                if r.student_id == student_id and r.academic_year == scholarship.academic_year]
        if not recs:
            return "Rejected", "No academic record for this academic year"
        rec = max(recs, key=lambda x: x.semester)
        student_dept = next(s["department"] for s in STUDENTS if s["student_id"] == student_id)
        d_count = dept_size(student_dept)
        rank_cutoff = max(1, math.ceil(d_count * scholarship.percentage_cutoff / 100))
        cgpa_ok = rec.cgpa >= scholarship.min_cgpa
        rank_ok = rec.rank <= rank_cutoff
        if cgpa_ok and rank_ok:
            return "Eligible", f"CGPA {rec.cgpa} ≥ {scholarship.min_cgpa}; Rank {rec.rank} ≤ {rank_cutoff} (top {scholarship.percentage_cutoff}%)"
        reasons = []
        if not cgpa_ok:
            reasons.append(f"CGPA {rec.cgpa} < required {scholarship.min_cgpa}")
        if not rank_ok:
            reasons.append(f"Rank {rec.rank} > cutoff {rank_cutoff}")
        return "Rejected", "Auto-rejected: " + "; ".join(reasons)

    preseeded_apps = [
        # student_id, scholarship, final_status
        ("23CS001", merit_excellence,    "Approved"),
        ("23EC001", merit_excellence,    "Approved"),
        ("23EE001", merit_excellence,    "Eligible"),
        ("23CS002", academic_achievement,"Eligible"),
        ("23ME002", academic_achievement,"Eligible"),
        ("23CS001", general_merit,       "Approved"),
        ("23CS002", general_merit,       "Approved"),
        ("23EC002", general_merit,       "Eligible"),
        ("23ME002", general_merit,       "Pending"),
    ]

    app_objs = []
    base_date = datetime(2025, 1, 15)
    for idx, (sid, sch, override_status) in enumerate(preseeded_apps):
        auto_status, remarks = calc_eligibility(sid, sch)
        final_status = override_status if override_status in ("Approved", "Pending") else auto_status
        app_date = base_date + timedelta(days=idx * 2)
        approval_date = app_date + timedelta(days=3) if final_status in ("Approved", "Eligible") else None
        app = models.Application(
            student_id=sid,
            scholarship_id=sch.scholarship_id,
            application_date=app_date,
            status=final_status,
            approval_date=approval_date,
            remarks=remarks,
        )
        db.add(app)
        app_objs.append((app, sch, final_status))

    db.commit()
    for app, _, _ in app_objs:
        db.refresh(app)

    # ── Disbursements ─────────────────────────────────────────────────────────
    print("💸 Seeding disbursements …")
    disbursement_data = [
        # (app index, stage, payment_status)
        (0, "Full Amount",        "Completed"),    # 22CS001 Merit Excellence
        (1, "First Installment",  "Completed"),    # 22EC002 Merit Excellence
        (1, "Second Installment", "Pending"),      # 22EC002 Merit Excellence
        (6, "Full Amount",        "Completed"),    # 22CS001 General Merit
        (7, "Full Amount",        "Pending"),      # 22CS002 General Merit
    ]
    for app_idx, stage, pay_status in disbursement_data:
        app_obj, sch, status = app_objs[app_idx]
        if status not in ("Approved",):
            continue
        disb = models.Disbursement(
            application_id=app_obj.application_id,
            amount=sch.amount if stage == "Full Amount" else sch.amount / 2,
            disbursement_date=app_obj.application_date + timedelta(days=15),
            stage=stage,
            payment_status=pay_status,
        )
        db.add(disb)
    db.commit()

    counts = {
        "students": db.query(models.Student).count(),
        "users": db.query(models.User).count(),
        "academic_records": db.query(models.AcademicRecord).count(),
        "scholarships": db.query(models.Scholarship).count(),
        "applications": db.query(models.Application).count(),
        "disbursements": db.query(models.Disbursement).count(),
    }
    print(f"✅ Seed complete: {counts}")
    return counts


if __name__ == "__main__":
    # Create all tables first
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        reset_and_seed(db)
    finally:
        db.close()
