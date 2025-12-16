from sqlmodel import select, func
from database.database import SessionDep
from models.expense import Expense
from models.budget import Budget, BudgetCreate


def set_budget(session: SessionDep, budget: BudgetCreate):
    db_budget = Budget.model_validate(budget)
    session.add(db_budget)
    session.commit()
    session.refresh(db_budget)
    return db_budget

def budget_status(session: SessionDep):
    spent = session.exec(select(func.sum(Expense.amount))).one_or_none()
    total = int(spent or 0)
    budget = int(session.exec(select(Budget.limit_amount)).first())
    balance = budget - total
    is_over = balance < 0
    return {"balance": balance,
            "spent": total,
            "planed_budget": budget,
            "is_over_limit": is_over,
            "status": "danger" if is_over else "success",
            "message": "Budget is over!" if is_over else f"Budget is {balance}"}

