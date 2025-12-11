from fastapi import HTTPException
from models.models import ExpenseCreate, Expense, Pagination, ExpenseUpdate
from database.database import SessionDep
from sqlmodel import select

def create_expense(session: SessionDep, expense: ExpenseCreate):
    db_expense = Expense.model_validate(expense)
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense

def get_expenses(session: SessionDep, pagination: Pagination):
    statement = select(Expense).offset(pagination.offset).limit(pagination.limit)
    expenses = session.exec(statement).all()
    return expenses

def get_expense(session: SessionDep, expense_id: int):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

def update_expense(session: SessionDep,
                   expense_id: int,
                   expense: ExpenseUpdate):
    expense_db = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    expense_data = expense.model_dump(exclude_unset=True)
    expense_db.sqlmodel_update(expense_data)
    session.add(expense_db)
    session.commit()
    session.refresh(expense_db)
    return expense_db

def delete_expense(session: SessionDep, expense_id: int):
    expense_db = session.get(Expense, expense_id)
    if not expense_db:
        raise HTTPException(status_code=404, detail="Expense not found")
    session.delete(expense_db)
    session.commit()
    return {"Ok": True}
