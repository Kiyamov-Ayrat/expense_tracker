
from database.database import SessionDep
from models.expense import Category, Expense, ExpensePublic
from sqlmodel import select, func
from typing import Optional


def get_product(session: SessionDep, category: Category):
    statement = select(Expense).where(Expense.category == category)
    result = session.exec(statement).all()
    return result

def get_by_month(session: SessionDep, year: int, month: int):
    statement = select(Expense).where(func.strftime("%Y-%m", Expense.date) == f"{year}-{month:02d}")
    result = session.exec(statement).all()
    return result