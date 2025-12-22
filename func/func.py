
from database.database import SessionDep
from models.expense import Category, Expense, ExpensePublic
from sqlmodel import select, func
from fastapi import HTTPException


def get_product(session: SessionDep, category: Category):
    statement = select(Expense).where(Expense.category == category)
    result = session.exec(statement).all()
    return result

def get_by_month(session: SessionDep, year: int, month: int):
    statement = select(Expense).where(func.strftime("%Y-%m", Expense.date) == f"{year}-{month:02d}")
    result = session.exec(statement).all()
    return result

def statistic_month(session: SessionDep, year: int, month: int):
    data = get_by_month(session=session, year=year, month=month)
    if not data:
        raise HTTPException(status_code=404, detail="No data found")

    d = {}
    for i in data:
        if i.category not in d:
            d[i.category] = i.amount
        else:
            d[i.category] += i.amount
    sorted_d = sorted(d.items(), key = lambda x: x[1], reverse = True)
    return {k: v for k, v in sorted_d}
