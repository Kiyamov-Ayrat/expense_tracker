from fastapi import FastAPI
import uvicorn

import crud.crud
from database.darabase import create_db_and_tables, SessionDep
from contextlib import asynccontextmanager
from models.models import ExpenseCreate, ExpensePublic
from crud import crud

@asynccontextmanager
async def lifespan(app:FastAPI):
    create_db_and_tables()
    yield
app = FastAPI(lifespan=lifespan)

@app.get("/")
def first_page():
    return {"message": "Hello World"}


@app.post("/expenses/", response_model=ExpensePublic)
def create_expense(session: SessionDep,expense: ExpenseCreate):
    return crud.create_expense(session=session, expense=expense)

@app.get("/expenses/", response_model=list[ExpensePublic])
def read_expenses(session: SessionDep):
    return crud.get_expenses(session=session)


if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
