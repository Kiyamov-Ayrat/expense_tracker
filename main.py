from fastapi import FastAPI
import uvicorn

from database.database import create_db_and_tables
from contextlib import asynccontextmanager


from routers import expense

@asynccontextmanager
async def lifespan(app:FastAPI):
    create_db_and_tables()
    yield
app = FastAPI(lifespan=lifespan)
app.include_router(expense.router)


@app.get("/")
def first_page():
    return {"message": "Hello World"}

if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
