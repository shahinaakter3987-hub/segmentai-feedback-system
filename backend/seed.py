"""
Seed script: loads sample_feedback.csv into the database via the API pipeline.
Run from the backend/ directory:
    python seed.py
"""
import sys, os, csv
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
import models  # register all models
from api.routes.feedback import _process_and_save

Base.metadata.create_all(bind=engine)
db = SessionLocal()

csv_path = os.path.join(os.path.dirname(__file__), "data", "sample_feedback.csv")

print("[SEED] Seeding database from sample_feedback.csv ...")
saved = 0
with open(csv_path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            _process_and_save(
                db,
                customer_name=row["customer_name"],
                customer_email=row.get("customer_email"),
                total_spend=float(row.get("total_spend") or 0),
                text=row["feedback_text"],
                rating=int(row["rating"]) if row.get("rating") else None,
                source="csv"
            )
            saved += 1
            print(f"  OK [{saved}] {row['customer_name']}")
        except Exception as e:
            print(f"  ERR Error on row: {e}")

db.close()
print(f"\n[DONE] Seed complete - {saved} feedback records imported.")
print("   Start the server: uvicorn main:app --reload --port 8000")
