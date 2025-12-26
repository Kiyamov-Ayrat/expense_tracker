from fastapi import FastAPI
import uvicorn

from database.database import create_db_and_tables
from contextlib import asynccontextmanager
from routers import expense, amount, filter
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app:FastAPI):
    create_db_and_tables()
    yield
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(expense.router)
app.include_router(amount.router)
app.include_router(filter.router)

@app.get("/")
def first_page():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)