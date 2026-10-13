from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.database import db
from app.routers import auth, admin, property, harvest, payment

app = FastAPI(
    title="TreeConnect API",
    version="1.0.0"
)

cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://tree-connect-five.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Operations"])
app.include_router(property.router, prefix="/api/properties", tags=["Properties"])
app.include_router(harvest.router, prefix="/api/harvest-requests", tags=["Harvest Requests & Assessments"])
app.include_router(payment.router, prefix="/api/payments", tags=["Payments"])

@app.get("/")
def home():
    return {
        "message": "Welcome to TreeConnect API"
    }

@app.get("/database")
def database_status():
    return {
        "database": db.name,
        "collections": db.list_collection_names()
    }