from fastapi import FastAPI, status, Query
import uvicorn

import crud.crud
from database.darabase import create_db_and_tables, SessionDep
from contextlib import asynccontextmanager
from models.models import ExpenseCreate, ExpensePublic, PaginationDep, Pagination, ExpenseUpdate, Category
from crud import crud
from func import func
from typing import Optional


@asynccontextmanager
async def lifespan(app:FastAPI):
    create_db_and_tables()
    yield
app = FastAPI(lifespan=lifespan)

@app.get("/")
def first_page():
    return {"message": "Hello World"}

@app.get("/expense/category/", response_model=list[ExpensePublic])
def read_category(session: SessionDep, category: Category):
    return func.get_product(session=session, category=category)



@app.post("/expenses/", response_model=ExpensePublic, status_code=status.HTTP_201_CREATED)
def create_expense(session: SessionDep,expense: ExpenseCreate):
    return crud.create_expense(session=session, expense=expense)

@app.get("/expenses/", response_model=list[ExpensePublic])
def read_expenses(session: SessionDep, pagination: PaginationDep):
    return crud.get_expenses(session=session, pagination=pagination)

@app.get("/expenses/{expense_id}", response_model=ExpensePublic, status_code=status.HTTP_200_OK)
def read_expense(session: SessionDep, expense_id: int):
    return crud.get_expense(session=session, expense_id=expense_id)

@app.patch("/expense/{expense_id}", response_model=ExpensePublic)
def expense_patch(session: SessionDep, expense_id: int, expense: ExpenseUpdate):
    return crud.update_expense(session=session, expense_id=expense_id, expense=expense)

@app.delete("/expense/{expense_id}")
def expense_delete(session: SessionDep, expense_id: int):
    return crud.delete_expense(session=session, expense_id=expense_id)



if __name__ == "__main__":
    uvicorn.run("main:app", reload=True)
