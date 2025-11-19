from models.models import ExpenseCreate, Expense
from database.darabase import SessionDep
from sqlmodel import select

def create_expense(session: SessionDep, expense: ExpenseCreate):
    db_expense = Expense.model_validate(expense)
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense

def get_expenses(session: SessionDep):
    statement = select(Expense)
    expenses = session.exec(statement).all()
    return expenses