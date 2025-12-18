from sqlmodel import select, func
from database.database import SessionDep
from models.expense import Expense
from models.budget import Budget, BudgetCreate, BudgetUpdate
from fastapi import HTTPException

def set_budget(session: SessionDep, budget: BudgetCreate):
    db_budget = Budget.model_validate(budget)
    session.add(db_budget)
    session.commit()
    session.refresh(db_budget)
    return db_budget

def budget_status(session: SessionDep, year: int, month: int):
    year_month = f"{year}-{month:02d}"
    statement = (select(func.sum(Expense.amount)).
                 where(func.strftime("%Y-%m", Expense.date) == year_month))
    spent = session.exec(statement).one_or_none()
    total = int(spent or 0)
    budget_get = (select(Budget.limit_amount).
                  where(func.strftime("%Y-%m", Budget.date) == year_month))
    budget = session.exec(budget_get).first()
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    balance = int(budget) - total
    is_over = balance < 0
    return {"balance": balance,
            "spent": total,
            "planed_budget": budget,
            "is_over_limit": is_over,
            "status": "danger" if is_over else "success",
            "message": "Budget is over!" if is_over else f"Budget is {balance}"}

def update_budget(session: SessionDep,
                  budget_id: int,
                  budget: BudgetUpdate):
    budget_db = session.get(Budget, budget_id)
    if not budget_db:
        raise HTTPException(status_code=404, detail="Budget not found")
    budget_data = budget.model_dump(exclude_unset=True)
    budget_db.sqlmodel_update(budget_data)
    session.add(budget_db)
    session.commit()
    session.refresh(budget_db)
    return budget_db


def delete_budget(session: SessionDep, budget_id: int):
    budget_db = session.get(Budget, budget_id)
    if not budget_db:
        raise HTTPException(status_code=404, detail="Budget not found")
    session.delete(budget_db)
    session.commit()
    return {"Ok": True}