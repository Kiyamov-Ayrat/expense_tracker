from fastapi import APIRouter, Path
from starlette import status

from models.expense import Category, ExpensePublic, ExpenseCreate, PaginationDep, ExpenseUpdate
from func import func
from database.database import SessionDep
from crud import crud

router = APIRouter()

@router.get("/expenses/category",
            response_model=list[ExpensePublic],
            tags=["filter"])
def read_category(session: SessionDep, category: Category):
    return func.get_product(session=session, category=category)

@router.get("/expenses/{month}",
            response_model=list[ExpensePublic],
            tags=["filter"])
def get_month(session: SessionDep, year: int, month: int):
    return func.get_by_month(session=session, year=year, month=month)

@router.post("/expenses/",
             response_model=ExpensePublic,
             status_code=status.HTTP_201_CREATED,
             tags=["CRUD"])
def create_expense(session: SessionDep,expense: ExpenseCreate):
    return crud.create_expense(session=session, expense=expense)

@router.get("/expenses/",
         response_model=list[ExpensePublic],
         tags=["CRUD"])
def read_expenses(session: SessionDep, pagination: PaginationDep):
    return crud.get_expenses(session=session, pagination=pagination)

@router.get("/expenses/{expense_id}",
            response_model=ExpensePublic,
            tags=["CRUD"])
def read_expense(session: SessionDep,
                 expense_id: int = Path(..., ge=0)):
    return crud.get_expense(session=session, expense_id=expense_id)

@router.patch("/expenses/{expense_id}",
            response_model=ExpensePublic,
            status_code=status.HTTP_200_OK,
            tags=["CRUD"])
def update_expense(session: SessionDep,
                   expense_id: int,
                   expense: ExpenseUpdate):
    return crud.update_expense(session=session,
                               expense_id=expense_id,
                               expense=expense)

@router.delete("/expenses/{expense_id",
               tags=["CRUD"])
def delete_expense(session: SessionDep, expense_id: int):
    return crud.delete_expense(session=session, expense_id=expense_id)


