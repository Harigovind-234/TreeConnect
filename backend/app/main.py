from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import db
from app.routers import auth, admin, property

app = FastAPI(
    title="TreeConnect API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Operations"])
app.include_router(property.router, prefix="/api/properties", tags=["Properties"])

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