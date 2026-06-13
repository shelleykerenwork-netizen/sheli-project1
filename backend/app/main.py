from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models
from .auth import hash_password
from .routers import auth, surveys, responses, analytics
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="סקרים - איגוד מנהלי אגפי החינוך")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(surveys.router)
app.include_router(responses.router)
app.include_router(analytics.router)


def _seed_admin():
    db = SessionLocal()
    try:
        email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        password = os.getenv("ADMIN_PASSWORD", "changeme")
        print(f"[seed] email={email} db_url={os.getenv('DATABASE_URL','sqlite')[:20]}")
        existing = db.query(models.User).filter(models.User.email == email).first()
        if not existing:
            db.add(models.User(email=email, hashed_password=hash_password(password)))
            db.commit()
            print("[seed] admin created")
        else:
            print("[seed] admin exists")
    except Exception as e:
        print(f"[seed] ERROR: {e}")
    finally:
        db.close()


_seed_admin()


@app.post("/api/debug/reseed")
def reseed():
    _seed_admin()
    return {"ok": True}


@app.get("/")
def root():
    return {"message": "סקרים API - פעיל"}
