
from database.database import SessionDep
from models.expense import Category, Expense, ExpensePublic
from sqlmodel import select
from typing import Optional
#
# def get_by_category(session: SessionDep,
#                     category: Optional[Category] = None):
#     stm = select(Expense)
#     if category:
#         stm = stm.where(Expense.category == category)
#     result = session.exec(stm)
#     return result.all()

def get_product(session: SessionDep, category: Category):
    statement = select(Expense).where(Expense.category == category)
    result = session.exec(statement).all()
    return result