"""
data_service.py — Modular Data Ingestion Layer (Repository Pattern).

Architecture:
    AcademicRecordRepository (abstract base)
    ├── MockDataRepository      ← Currently active for MVP
    ├── CSVExcelRepository      ← Placeholder: activated once admin uploads a file
    └── SLCMAPIRepository       ← Placeholder: activated once API credentials are available

To switch sources, instantiate a different repository class and call get_academic_records().
The application routes and seed script are completely decoupled from the source.
"""

from __future__ import annotations
import math
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional


# ─── Data Transfer Objects ────────────────────────────────────────────────────

@dataclass
class AcademicRecordDTO:
    student_id: str
    semester: int
    sgpa: float
    cgpa: float
    academic_year: str
    rank: int


# ─── Abstract Base Repository ─────────────────────────────────────────────────

class AcademicRecordRepository(ABC):
    """
    Abstract repository for academic records.
    Any concrete implementation must provide `get_academic_records`.
    """

    @abstractmethod
    def get_academic_records(self, student_id: Optional[str] = None) -> List[AcademicRecordDTO]:
        """
        Return a list of AcademicRecordDTOs.
        If student_id is provided, filter to that student only.
        """
        ...


# ─── Mock Data Repository (Active MVP source) ─────────────────────────────────

class MockDataRepository(AcademicRecordRepository):
    """
    Generates deterministic, realistic academic records in memory.
    Used by the seed script and the admin /seed endpoint.
    No external dependencies, no files, no network.
    """

    # Internal dataset — mirrors the seeded student list
    _MOCK_RECORDS: List[dict] = [
        # CSE Department (3 students) ─────────────────────────
        {"student_id": "23CS001", "semester": 1, "sgpa": 9.5, "cgpa": 9.5, "academic_year": "2023-24", "rank": 1},
        {"student_id": "23CS001", "semester": 2, "sgpa": 9.3, "cgpa": 9.4, "academic_year": "2024-25", "rank": 1},
        {"student_id": "23CS001", "semester": 3, "sgpa": 9.4, "cgpa": 9.4, "academic_year": "2025-26", "rank": 1},
        {"student_id": "23CS002", "semester": 1, "sgpa": 8.8, "cgpa": 8.8, "academic_year": "2023-24", "rank": 2},
        {"student_id": "23CS002", "semester": 2, "sgpa": 9.0, "cgpa": 8.9, "academic_year": "2024-25", "rank": 2},
        {"student_id": "23CS002", "semester": 3, "sgpa": 8.9, "cgpa": 8.9, "academic_year": "2025-26", "rank": 2},
        {"student_id": "23CS003", "semester": 1, "sgpa": 7.7, "cgpa": 7.7, "academic_year": "2023-24", "rank": 3},
        {"student_id": "23CS003", "semester": 2, "sgpa": 7.9, "cgpa": 7.8, "academic_year": "2024-25", "rank": 3},
        {"student_id": "23CS003", "semester": 3, "sgpa": 7.8, "cgpa": 7.8, "academic_year": "2025-26", "rank": 3},
        # ECE Department (2 students) ─────────────────────────
        {"student_id": "23EC001", "semester": 1, "sgpa": 9.2, "cgpa": 9.2, "academic_year": "2023-24", "rank": 1},
        {"student_id": "23EC001", "semester": 2, "sgpa": 9.2, "cgpa": 9.2, "academic_year": "2024-25", "rank": 1},
        {"student_id": "23EC001", "semester": 3, "sgpa": 9.2, "cgpa": 9.2, "academic_year": "2025-26", "rank": 1},
        {"student_id": "23EC002", "semester": 1, "sgpa": 8.5, "cgpa": 8.5, "academic_year": "2023-24", "rank": 2},
        {"student_id": "23EC002", "semester": 2, "sgpa": 8.7, "cgpa": 8.6, "academic_year": "2024-25", "rank": 2},
        {"student_id": "23EC002", "semester": 3, "sgpa": 8.6, "cgpa": 8.6, "academic_year": "2025-26", "rank": 2},
        # ME Department (2 students) ──────────────────────────
        {"student_id": "23ME001", "semester": 1, "sgpa": 8.0, "cgpa": 8.0, "academic_year": "2023-24", "rank": 2},
        {"student_id": "23ME001", "semester": 2, "sgpa": 8.2, "cgpa": 8.1, "academic_year": "2024-25", "rank": 2},
        {"student_id": "23ME001", "semester": 3, "sgpa": 8.1, "cgpa": 8.1, "academic_year": "2025-26", "rank": 2},
        {"student_id": "23ME002", "semester": 1, "sgpa": 8.3, "cgpa": 8.3, "academic_year": "2023-24", "rank": 1},
        {"student_id": "23ME002", "semester": 2, "sgpa": 8.5, "cgpa": 8.4, "academic_year": "2024-25", "rank": 1},
        {"student_id": "23ME002", "semester": 3, "sgpa": 8.4, "cgpa": 8.4, "academic_year": "2025-26", "rank": 1},
    ]

    def get_academic_records(self, student_id: Optional[str] = None) -> List[AcademicRecordDTO]:
        records = self._MOCK_RECORDS
        if student_id:
            records = [r for r in records if r["student_id"] == student_id]
        return [AcademicRecordDTO(**r) for r in records]


# ─── CSV / Excel Repository (Placeholder) ────────────────────────────────────

class CSVExcelRepository(AcademicRecordRepository):
    """
    PLACEHOLDER — Activated once admin uploads an Excel/CSV file via:
        POST /api/admin/upload-academic-excel

    Expected CSV columns:
        student_id, semester, sgpa, cgpa, academic_year, rank

    Implementation steps (when ready):
        1. Receive the UploadFile from FastAPI.
        2. Parse with pandas: pd.read_excel(file) or pd.read_csv(file).
        3. Validate columns and data types.
        4. Return a list of AcademicRecordDTOs.
        5. Persist via the standard seed/upsert logic.
    """

    def __init__(self, file_path: str):
        self.file_path = file_path

    def get_academic_records(self, student_id: Optional[str] = None) -> List[AcademicRecordDTO]:
        raise NotImplementedError(
            "CSVExcelRepository is a placeholder. "
            "Implement pandas parsing here once the upload module is approved."
        )


# ─── SLCM API Repository (Placeholder) ───────────────────────────────────────

class SLCMAPIRepository(AcademicRecordRepository):
    """
    PLACEHOLDER — Activated once the college SLCM API credentials are obtained.
    Route: GET /api/sync-slcm

    Implementation steps (when ready):
        1. Obtain base_url and api_key from environment variables.
        2. Call GET {base_url}/academic-records?student_id={id} with auth headers.
        3. Map the JSON response fields to AcademicRecordDTO.
        4. Handle pagination, rate limits, and timeouts.
        5. Persist via the standard seed/upsert logic.
    """

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key

    def get_academic_records(self, student_id: Optional[str] = None) -> List[AcademicRecordDTO]:
        raise NotImplementedError(
            "SLCMAPIRepository is a placeholder. "
            "Implement httpx/requests calls here once SLCM API credentials are available."
        )


# ─── Factory (makes swapping sources trivial) ─────────────────────────────────

def get_repository(source: str = "mock", **kwargs) -> AcademicRecordRepository:
    """
    Factory function — returns the appropriate repository.
    Usage:
        repo = get_repository("mock")
        repo = get_repository("csv", file_path="upload.xlsx")
        repo = get_repository("slcm", base_url="...", api_key="...")
    """
    if source == "mock":
        return MockDataRepository()
    elif source == "csv":
        return CSVExcelRepository(file_path=kwargs["file_path"])
    elif source == "slcm":
        return SLCMAPIRepository(base_url=kwargs["base_url"], api_key=kwargs["api_key"])
    else:
        raise ValueError(f"Unknown data source: {source}")
